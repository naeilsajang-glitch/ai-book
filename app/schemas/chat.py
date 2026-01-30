from pydantic import BaseModel, ConfigDict
from uuid import UUID
from datetime import datetime

class ChatRequest(BaseModel):
    message: str

# Although Streaming Response is used, this helps documentation
class ChatResponse(BaseModel):
    response: str

class ChatMessage(BaseModel):
    id: UUID
    role: str
    content: str
    created_at: datetime
    
    model_config = ConfigDict(from_attributes=True)
