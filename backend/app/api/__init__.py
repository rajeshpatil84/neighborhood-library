from app.api.books import router as books_router
from app.api.members import router as members_router
from app.api.borrowings import router as borrowings_router
from app.api.stats import router as stats_router

__all__ = ["books_router", "members_router", "borrowings_router", "stats_router"]
