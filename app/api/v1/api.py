from fastapi import APIRouter
from app.api.v1.endpoints import books, chat

api_router = APIRouter()

api_router.include_router(books.router, prefix="/books", tags=["books"])
api_router.include_router(chat.router, prefix="/books", tags=["chat"]) # /books/{id}/chat
