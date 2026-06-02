from typing import List, Optional
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.db import get_db
from app.models import Member
from app.schemas import MemberCreate, MemberUpdate, MemberResponse

router = APIRouter(prefix="/members", tags=["Members"])


@router.get("", response_model=List[MemberResponse])
async def list_members(
    search: Optional[str] = Query(None, description="Search by name or email"),
    active_only: bool = Query(False),
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=200),
    db: AsyncSession = Depends(get_db),
):
    q = select(Member)
    if search:
        like = f"%{search}%"
        q = q.where(
            Member.name.ilike(like) | Member.email.ilike(like)
        )
    if active_only:
        q = q.where(Member.is_active == True)
    q = q.order_by(Member.name).offset(skip).limit(limit)
    result = await db.execute(q)
    return result.scalars().all()


@router.get("/{member_id}", response_model=MemberResponse)
async def get_member(member_id: UUID, db: AsyncSession = Depends(get_db)):
    member = await db.get(Member, member_id)
    if not member:
        raise HTTPException(status_code=404, detail="Member not found")
    return member


@router.post("", response_model=MemberResponse, status_code=status.HTTP_201_CREATED)
async def create_member(payload: MemberCreate, db: AsyncSession = Depends(get_db)):
    existing = await db.execute(select(Member).where(Member.email == payload.email))
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=409, detail="Email already registered")
    member = Member(**payload.model_dump())
    db.add(member)
    await db.flush()
    await db.refresh(member)
    return member


@router.patch("/{member_id}", response_model=MemberResponse)
async def update_member(member_id: UUID, payload: MemberUpdate, db: AsyncSession = Depends(get_db)):
    member = await db.get(Member, member_id)
    if not member:
        raise HTTPException(status_code=404, detail="Member not found")
    data = payload.model_dump(exclude_unset=True)
    if "email" in data and data["email"] != member.email:
        existing = await db.execute(select(Member).where(Member.email == data["email"]))
        if existing.scalar_one_or_none():
            raise HTTPException(status_code=409, detail="Email already in use")
    for key, val in data.items():
        setattr(member, key, val)
    await db.flush()
    await db.refresh(member)
    return member


@router.delete("/{member_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_member(member_id: UUID, db: AsyncSession = Depends(get_db)):
    from sqlalchemy import select as sel
    from app.models import Borrowing
    member = await db.get(Member, member_id)
    if not member:
        raise HTTPException(status_code=404, detail="Member not found")
    active = await db.execute(
        sel(Borrowing).where(
            Borrowing.member_id == member_id,
            Borrowing.returned_at == None
        )
    )
    if active.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="Cannot delete member with active borrowings")
    await db.delete(member)
