import uuid
from sqlalchemy import Column, ForeignKey, Enum as SqEnum
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
import enum

from app.db.base_class import Base

class AccessLevel(str, enum.Enum):
    OWNER = "owner"
    PURCHASED = "purchased"

class UserLibrary(Base):
    user_id = Column(UUID(as_uuid=True), ForeignKey("user.id"), primary_key=True)
    book_id = Column(UUID(as_uuid=True), ForeignKey("book.id"), primary_key=True)
    access_level = Column(SqEnum(AccessLevel), default=AccessLevel.PURCHASED)
    
    # Relationships
    user = relationship("User", back_populates="books")
    book = relationship("Book", back_populates="user_libraries")
