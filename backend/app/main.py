from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import settings
from app.api import books_router, members_router, borrowings_router, stats_router

app = FastAPI(
    title="Neighborhood Library API",
    description="REST API for managing books, members, and borrowings",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(books_router,     prefix="/api/v1")
app.include_router(members_router,   prefix="/api/v1")
app.include_router(borrowings_router, prefix="/api/v1")
app.include_router(stats_router,     prefix="/api/v1")


@app.get("/health", tags=["Health"])
async def health_check():
    return {"status": "ok", "service": "library-api"}
