import uuid
from sqlalchemy import Column, String, Text, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship

from app.db.base_class import Base

class Persona(Base):
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    book_id = Column(UUID(as_uuid=True), ForeignKey("book.id"), nullable=False)
    role_name = Column(String, nullable=False)
    system_prompt = Column(Text, nullable=False)
    
    # Relationships
    book = relationship("Book", back_populates="persona")
