import uuid
from sqlalchemy import Column, String, Boolean, ForeignKey, Enum as SqEnum, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
import enum

from app.db.base_class import Base

class BookStatus(str, enum.Enum):
    PROCESSING = "processing"
    READY = "ready"
    FAILED = "failed"

class Book(Base):
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    title = Column(String, nullable=False)
    owner_id = Column(UUID(as_uuid=True), ForeignKey("user.id"), nullable=True) # Null for official books
    is_official = Column(Boolean, default=False)
    file_hash = Column(String, unique=True, index=True, nullable=False)
    status = Column(SqEnum(BookStatus, native_enum=False), default=BookStatus.PROCESSING)
    error_message = Column(Text, nullable=True)
    
    # Relationships
    persona = relationship("Persona", back_populates="book", uselist=False)
    user_libraries = relationship("UserLibrary", back_populates="book")
    chat_messages = relationship("ChatMessages", back_populates="book")
