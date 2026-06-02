from __future__ import annotations
from datetime import datetime, timezone
from typing import Optional, List
from uuid import UUID
from pydantic import BaseModel, EmailStr, Field, field_validator, computed_field


# ─────────────────────────────────────────
# BOOK SCHEMAS
# ─────────────────────────────────────────
class BookBase(BaseModel):
    title: str = Field(..., min_length=1, max_length=255)
    author: str = Field(..., min_length=1, max_length=255)
    isbn: Optional[str] = Field(None, max_length=20)
    genre: Optional[str] = Field(None, max_length=100)
    total_copies: int = Field(default=1, ge=1)
    published_year: Optional[int] = Field(None, ge=1000, le=2100)
    description: Optional[str] = None


class BookCreate(BookBase):
    pass


class BookUpdate(BaseModel):
    title: Optional[str] = Field(None, min_length=1, max_length=255)
    author: Optional[str] = Field(None, min_length=1, max_length=255)
    isbn: Optional[str] = Field(None, max_length=20)
    genre: Optional[str] = Field(None, max_length=100)
    total_copies: Optional[int] = Field(None, ge=1)
    published_year: Optional[int] = Field(None, ge=1000, le=2100)
    description: Optional[str] = None


class BookResponse(BookBase):
    id: UUID
    available_copies: int
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


# ─────────────────────────────────────────
# MEMBER SCHEMAS
# ─────────────────────────────────────────
class MemberBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=255)
    email: str = Field(..., max_length=255)
    phone: Optional[str] = Field(None, max_length=30)
    address: Optional[str] = None

    @field_validator("email")
    @classmethod
    def email_lowercase(cls, v: str) -> str:
        return v.lower().strip()


class MemberCreate(MemberBase):
    pass


class MemberUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=255)
    email: Optional[str] = Field(None, max_length=255)
    phone: Optional[str] = Field(None, max_length=30)
    address: Optional[str] = None
    is_active: Optional[bool] = None

    @field_validator("email")
    @classmethod
    def email_lowercase(cls, v: Optional[str]) -> Optional[str]:
        return v.lower().strip() if v else v


class MemberResponse(MemberBase):
    id: UUID
    is_active: bool
    joined_at: datetime
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


# ─────────────────────────────────────────
# BORROWING SCHEMAS
# ─────────────────────────────────────────
class BorrowRequest(BaseModel):
    book_id: UUID
    member_id: UUID
    due_days: int = Field(default=14, ge=1, le=90)
    notes: Optional[str] = None


class ReturnRequest(BaseModel):
    notes: Optional[str] = None


class RenewRequest(BaseModel):
    renew_days: int = Field(default=14, ge=1, le=30)


class BorrowingResponse(BaseModel):
    id: UUID
    book_id: UUID
    member_id: UUID
    borrowed_at: datetime
    due_date: datetime
    returned_at: Optional[datetime]
    fine_amount: float
    fine_paid: bool
    notes: Optional[str]
    created_at: datetime
    updated_at: datetime
    book: Optional[BookResponse] = None
    member: Optional[MemberResponse] = None

    @computed_field
    @property
    def accrued_fine(self) -> float:
        """Stored fine for returned books; real-time accruing fine for active overdue loans."""
        if self.returned_at is not None:
            return float(self.fine_amount)
        due = self.due_date
        if due.tzinfo is None:
            due = due.replace(tzinfo=timezone.utc)
        now = datetime.now(timezone.utc)
        if now > due:
            from app.config import settings
            return round((now - due).days * settings.FINE_PER_DAY, 2)
        return 0.0

    model_config = {"from_attributes": True}


# ─────────────────────────────────────────
# STATS SCHEMA
# ─────────────────────────────────────────
class LibraryStats(BaseModel):
    total_books: int
    total_members: int
    active_borrowings: int
    overdue_borrowings: int
    total_fines_outstanding: float
