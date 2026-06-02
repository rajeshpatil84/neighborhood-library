from typing import List, Optional
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, or_

from app.db import get_db
from app.models import Book
from app.schemas import BookCreate, BookUpdate, BookResponse

router = APIRouter(prefix="/books", tags=["Books"])


@router.get("", response_model=List[BookResponse])
async def list_books(
    search: Optional[str] = Query(None, description="Search by title, author, or ISBN"),
    genre: Optional[str] = Query(None),
    available_only: bool = Query(False),
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=200),
    db: AsyncSession = Depends(get_db),
):
    q = select(Book)
    if search:
        like = f"%{search}%"
        q = q.where(or_(Book.title.ilike(like), Book.author.ilike(like), Book.isbn.ilike(like)))
    if genre:
        q = q.where(Book.genre.ilike(f"%{genre}%"))
    if available_only:
        q = q.where(Book.available_copies > 0)
    q = q.order_by(Book.title).offset(skip).limit(limit)
    result = await db.execute(q)
    return result.scalars().all()


@router.get("/{book_id}", response_model=BookResponse)
async def get_book(book_id: UUID, db: AsyncSession = Depends(get_db)):
    book = await db.get(Book, book_id)
    if not book:
        raise HTTPException(status_code=404, detail="Book not found")
    return book


@router.post("", response_model=BookResponse, status_code=status.HTTP_201_CREATED)
async def create_book(payload: BookCreate, db: AsyncSession = Depends(get_db)):
    if payload.isbn:
        existing = await db.execute(select(Book).where(Book.isbn == payload.isbn))
        if existing.scalar_one_or_none():
            raise HTTPException(status_code=409, detail="ISBN already exists")
    book = Book(**payload.model_dump(), available_copies=payload.total_copies)
    db.add(book)
    await db.flush()
    await db.refresh(book)
    return book


@router.patch("/{book_id}", response_model=BookResponse)
async def update_book(book_id: UUID, payload: BookUpdate, db: AsyncSession = Depends(get_db)):
    book = await db.get(Book, book_id)
    if not book:
        raise HTTPException(status_code=404, detail="Book not found")

    data = payload.model_dump(exclude_unset=True)

    # Adjust available_copies if total_copies changes
    if "total_copies" in data:
        diff = data["total_copies"] - book.total_copies
        new_available = book.available_copies + diff
        if new_available < 0:
            raise HTTPException(
                status_code=400,
                detail=f"Cannot reduce total_copies: {-diff} copies are currently borrowed"
            )
        book.available_copies = new_available

    for key, val in data.items():
        setattr(book, key, val)

    await db.flush()
    await db.refresh(book)
    return book


@router.delete("/{book_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_book(book_id: UUID, db: AsyncSession = Depends(get_db)):
    book = await db.get(Book, book_id)
    if not book:
        raise HTTPException(status_code=404, detail="Book not found")
    if book.available_copies < book.total_copies:
        raise HTTPException(status_code=400, detail="Cannot delete: book has active borrowings")
    await db.delete(book)
