from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from datetime import datetime, timezone

from app.db import get_db
from app.models import Book, Member, Borrowing
from app.schemas import LibraryStats
from app.config import settings

router = APIRouter(prefix="/stats", tags=["Stats"])


@router.get("", response_model=LibraryStats)
async def get_stats(db: AsyncSession = Depends(get_db)):
    now = datetime.now(timezone.utc)

    total_books = (await db.execute(select(func.count()).select_from(Book))).scalar()
    total_members = (await db.execute(select(func.count()).select_from(Member))).scalar()
    active_borrowings = (await db.execute(
        select(func.count()).select_from(Borrowing).where(Borrowing.returned_at == None)
    )).scalar()
    overdue_borrowings = (await db.execute(
        select(func.count()).select_from(Borrowing).where(
            Borrowing.returned_at == None,
            Borrowing.due_date < now,
        )
    )).scalar()

    # Stored unpaid fines from already-returned books
    stored_fines = (await db.execute(
        select(func.coalesce(func.sum(Borrowing.fine_amount), 0)).where(
            Borrowing.fine_paid == False,
            Borrowing.fine_amount > 0,
        )
    )).scalar() or 0

    # Accruing fines from active overdue loans (fine_amount not yet recorded)
    overdue_due_dates = (await db.execute(
        select(Borrowing.due_date).where(
            Borrowing.returned_at == None,
            Borrowing.due_date < now,
        )
    )).scalars().all()
    accruing_fines = sum(
        max(0, (now - (d if d.tzinfo else d.replace(tzinfo=timezone.utc))).days) * settings.FINE_PER_DAY
        for d in overdue_due_dates
    )

    return LibraryStats(
        total_books=total_books or 0,
        total_members=total_members or 0,
        active_borrowings=active_borrowings or 0,
        overdue_borrowings=overdue_borrowings or 0,
        total_fines_outstanding=float(stored_fines) + accruing_fines,
    )
