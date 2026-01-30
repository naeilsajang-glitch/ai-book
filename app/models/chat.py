import uuid
from sqlalchemy import Column, Text, ForeignKey, Enum as SqEnum
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
import enum

from app.db.base_class import Base

class ChatRole(str, enum.Enum):
    USER = "user"
    ASSISTANT = "assistant"

class ChatMessages(Base):
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("user.id"), nullable=False)
    book_id = Column(UUID(as_uuid=True), ForeignKey("book.id"), nullable=False)
    role = Column(SqEnum(ChatRole, native_enum=False), nullable=False)
    content = Column(Text, nullable=False)
    
    # Relationships
    user = relationship("User", back_populates="chat_messages")
    book = relationship("Book", back_populates="chat_messages")
