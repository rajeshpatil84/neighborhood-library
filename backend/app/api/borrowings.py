from typing import List, Optional
from uuid import UUID
from datetime import datetime, timezone, timedelta
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from sqlalchemy.orm import selectinload

from app.db import get_db
from app.models import Borrowing, Book, Member
from app.schemas import BorrowRequest, ReturnRequest, RenewRequest, BorrowingResponse
from app.config import settings

router = APIRouter(prefix="/borrowings", tags=["Borrowings"])


def compute_fine(due_date: datetime, returned_at: Optional[datetime] = None) -> float:
    now = returned_at or datetime.now(timezone.utc)
    if now > due_date:
        overdue_days = (now - due_date).days
        return round(overdue_days * settings.FINE_PER_DAY, 2)
    return 0.0


@router.get("", response_model=List[BorrowingResponse])
async def list_borrowings(
    member_id: Optional[UUID] = Query(None),
    book_id: Optional[UUID] = Query(None),
    active_only: bool = Query(False, description="Only unreturned borrowings"),
    overdue_only: bool = Query(False, description="Only overdue borrowings"),
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=200),
    db: AsyncSession = Depends(get_db),
):
    q = select(Borrowing).options(
        selectinload(Borrowing.book),
        selectinload(Borrowing.member),
    )
    if member_id:
        q = q.where(Borrowing.member_id == member_id)
    if book_id:
        q = q.where(Borrowing.book_id == book_id)
    if active_only:
        q = q.where(Borrowing.returned_at == None)
    if overdue_only:
        now = datetime.now(timezone.utc)
        q = q.where(Borrowing.returned_at == None, Borrowing.due_date < now)
    q = q.order_by(Borrowing.borrowed_at.desc()).offset(skip).limit(limit)
    result = await db.execute(q)
    return result.scalars().all()


@router.get("/{borrowing_id}", response_model=BorrowingResponse)
async def get_borrowing(borrowing_id: UUID, db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(Borrowing)
        .options(selectinload(Borrowing.book), selectinload(Borrowing.member))
        .where(Borrowing.id == borrowing_id)
    )
    b = result.scalar_one_or_none()
    if not b:
        raise HTTPException(status_code=404, detail="Borrowing not found")
    return b


@router.post("/borrow", response_model=BorrowingResponse, status_code=status.HTTP_201_CREATED)
async def borrow_book(payload: BorrowRequest, db: AsyncSession = Depends(get_db)):
    # Validate book
    book = await db.get(Book, payload.book_id)
    if not book:
        raise HTTPException(status_code=404, detail="Book not found")
    if book.available_copies < 1:
        raise HTTPException(status_code=409, detail="No copies available for borrowing")

    # Validate member
    member = await db.get(Member, payload.member_id)
    if not member:
        raise HTTPException(status_code=404, detail="Member not found")
    if not member.is_active:
        raise HTTPException(status_code=403, detail="Member account is inactive")

    # Enforce per-member borrowing limit
    active_count = (await db.execute(
        select(func.count()).select_from(Borrowing).where(
            Borrowing.member_id == payload.member_id,
            Borrowing.returned_at == None,
        )
    )).scalar() or 0
    if active_count >= settings.BORROW_LIMIT:
        raise HTTPException(
            status_code=409,
            detail=f"Member has reached the borrowing limit of {settings.BORROW_LIMIT} books",
        )

    # Block if member has outstanding unpaid fines on returned books
    unpaid_fines = (await db.execute(
        select(func.count()).select_from(Borrowing).where(
            Borrowing.member_id == payload.member_id,
            Borrowing.fine_paid == False,
            Borrowing.fine_amount > 0,
        )
    )).scalar() or 0
    if unpaid_fines > 0:
        raise HTTPException(
            status_code=403,
            detail="Member has unpaid fines. Please settle outstanding fines before borrowing.",
        )

    # Check member doesn't already have this book
    existing = await db.execute(
        select(Borrowing).where(
            Borrowing.book_id == payload.book_id,
            Borrowing.member_id == payload.member_id,
            Borrowing.returned_at == None,
        )
    )
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=409, detail="Member already has this book borrowed")

    now = datetime.now(timezone.utc)
    due_date = now + timedelta(days=payload.due_days)

    borrowing = Borrowing(
        book_id=payload.book_id,
        member_id=payload.member_id,
        borrowed_at=now,
        due_date=due_date,
        notes=payload.notes,
    )
    book.available_copies -= 1

    db.add(borrowing)
    await db.flush()

    result = await db.execute(
        select(Borrowing)
        .options(selectinload(Borrowing.book), selectinload(Borrowing.member))
        .where(Borrowing.id == borrowing.id)
    )
    return result.scalar_one()


@router.post("/{borrowing_id}/return", response_model=BorrowingResponse)
async def return_book(
    borrowing_id: UUID,
    payload: ReturnRequest,
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Borrowing)
        .options(selectinload(Borrowing.book), selectinload(Borrowing.member))
        .where(Borrowing.id == borrowing_id)
    )
    borrowing = result.scalar_one_or_none()
    if not borrowing:
        raise HTTPException(status_code=404, detail="Borrowing not found")
    if borrowing.returned_at:
        raise HTTPException(status_code=409, detail="Book already returned")

    now = datetime.now(timezone.utc)
    borrowing.returned_at = now
    borrowing.fine_amount = compute_fine(borrowing.due_date, now)
    if payload.notes:
        borrowing.notes = payload.notes

    borrowing.book.available_copies += 1
    await db.flush()
    await db.refresh(borrowing)
    return borrowing


@router.post("/{borrowing_id}/pay-fine", response_model=BorrowingResponse)
async def pay_fine(borrowing_id: UUID, db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(Borrowing)
        .options(selectinload(Borrowing.book), selectinload(Borrowing.member))
        .where(Borrowing.id == borrowing_id)
    )
    borrowing = result.scalar_one_or_none()
    if not borrowing:
        raise HTTPException(status_code=404, detail="Borrowing not found")
    if borrowing.fine_amount <= 0:
        raise HTTPException(status_code=400, detail="No fine to pay")
    if borrowing.fine_paid:
        raise HTTPException(status_code=409, detail="Fine already paid")
    borrowing.fine_paid = True
    await db.flush()
    await db.refresh(borrowing)
    return borrowing


@router.post("/{borrowing_id}/renew", response_model=BorrowingResponse)
async def renew_borrowing(
    borrowing_id: UUID,
    payload: RenewRequest,
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Borrowing)
        .options(selectinload(Borrowing.book), selectinload(Borrowing.member))
        .where(Borrowing.id == borrowing_id)
    )
    borrowing = result.scalar_one_or_none()
    if not borrowing:
        raise HTTPException(status_code=404, detail="Borrowing not found")
    if borrowing.returned_at:
        raise HTTPException(status_code=409, detail="Cannot renew an already-returned borrowing")

    now = datetime.now(timezone.utc)

    # If already overdue, lock in the accrued fine before resetting the due date
    if now > borrowing.due_date:
        overdue_fine = compute_fine(borrowing.due_date, now)
        borrowing.fine_amount = float(borrowing.fine_amount) + overdue_fine

    borrowing.due_date = now + timedelta(days=payload.renew_days)
    await db.flush()
    await db.refresh(borrowing)
    return borrowing
