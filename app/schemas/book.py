from datetime import datetime
from typing import Optional
from uuid import UUID

from pydantic import BaseModel, ConfigDict

# Base schema
class BookBase(BaseModel):
    title: str

# Properties to return to client
class Book(BookBase):
    id: UUID
    is_official: bool = False
    file_hash: str
    status: str
    error_message: Optional[str] = None
    created_at: datetime
    
    model_config = ConfigDict(from_attributes=True)

class BookUploadResponse(BaseModel):
    status: str
    msg: str
    book_id: UUID

class BookProcessRequest(BaseModel):
    book_id: UUID
    file_path: str # Path in Supabase Storage (e.g. "user_123/my_book.pdf")
    bucket_name: str = "books"
