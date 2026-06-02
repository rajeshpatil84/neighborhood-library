import uuid
from datetime import datetime, timezone
from sqlalchemy import (
    Column, String, Integer, Boolean, Numeric,
    Text, ForeignKey, DateTime, CheckConstraint
)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from app.db.database import Base


def utcnow():
    return datetime.now(timezone.utc)


class Book(Base):
    __tablename__ = "books"

    id              = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    title           = Column(String(255), nullable=False)
    author          = Column(String(255), nullable=False)
    isbn            = Column(String(20), unique=True, nullable=True)
    genre           = Column(String(100), nullable=True)
    total_copies    = Column(Integer, nullable=False, default=1)
    available_copies = Column(Integer, nullable=False, default=1)
    published_year  = Column(Integer, nullable=True)
    description     = Column(Text, nullable=True)
    created_at      = Column(DateTime(timezone=True), default=utcnow)
    updated_at      = Column(DateTime(timezone=True), default=utcnow, onupdate=utcnow)

    borrowings      = relationship("Borrowing", back_populates="book")

    __table_args__ = (
        CheckConstraint("available_copies <= total_copies", name="copies_lte_total"),
        CheckConstraint("total_copies >= 0", name="total_copies_non_negative"),
        CheckConstraint("available_copies >= 0", name="available_copies_non_negative"),
    )


class Member(Base):
    __tablename__ = "members"

    id          = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name        = Column(String(255), nullable=False)
    email       = Column(String(255), nullable=False, unique=True)
    phone       = Column(String(30), nullable=True)
    address     = Column(Text, nullable=True)
    is_active   = Column(Boolean, nullable=False, default=True)
    joined_at   = Column(DateTime(timezone=True), default=utcnow)
    created_at  = Column(DateTime(timezone=True), default=utcnow)
    updated_at  = Column(DateTime(timezone=True), default=utcnow, onupdate=utcnow)

    borrowings  = relationship("Borrowing", back_populates="member")


class Borrowing(Base):
    __tablename__ = "borrowings"

    id          = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    book_id     = Column(UUID(as_uuid=True), ForeignKey("books.id"), nullable=False)
    member_id   = Column(UUID(as_uuid=True), ForeignKey("members.id"), nullable=False)
    borrowed_at = Column(DateTime(timezone=True), default=utcnow)
    due_date    = Column(DateTime(timezone=True), nullable=False)
    returned_at = Column(DateTime(timezone=True), nullable=True)
    fine_amount = Column(Numeric(10, 2), nullable=False, default=0.00)
    fine_paid   = Column(Boolean, nullable=False, default=False)
    notes       = Column(Text, nullable=True)
    created_at  = Column(DateTime(timezone=True), default=utcnow)
    updated_at  = Column(DateTime(timezone=True), default=utcnow, onupdate=utcnow)

    book        = relationship("Book", back_populates="borrowings")
    member      = relationship("Member", back_populates="borrowings")
