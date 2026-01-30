import json
from typing import AsyncGenerator, List, Optional
from fastapi import APIRouter, HTTPException, Request
from fastapi.responses import StreamingResponse
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.messages import HumanMessage, SystemMessage

from app.schemas.chat import ChatRequest, ChatMessage as ChatMessageSchema
from app.services.rag_service import retrieve_context
from app.core.config import settings
from app.db.supabase import supabase
from app.core.limiter import limiter

router = APIRouter()

# Initialize Chat Model
chat_llm = ChatGoogleGenerativeAI(
    model="gemini-2.5-flash",
    google_api_key=settings.GOOGLE_API_KEY,
    temperature=0.7,
    streaming=True,
    convert_system_message_to_human=True 
)

async def save_chat_history(user_id: Optional[str], book_id: str, user_msg: str, ai_msg: str):
    """
    Save chat history to Supabase.
    """
    try:
        # Save User Message
        supabase.table("chat_messages").insert({
            "book_id": book_id,
            "user_id": user_id,
            "role": "user",
            "content": user_msg
        }).execute()
        
        # Save AI Message
        supabase.table("chat_messages").insert({
            "book_id": book_id,
            "user_id": user_id,
            "role": "assistant",
            "content": ai_msg
        }).execute()
        print(f"DEBUG: Saved chat history for book {book_id}")
    except Exception as e:
        print(f"Error saving chat history: {e}")

@router.post("/{book_id}/chat")
@limiter.limit("20/minute")
async def chat_endpoint(
    request: Request, 
    book_id: str,
    chat_request: ChatRequest
):
    # 1. Get Book
    response = supabase.table("books").select("*").eq("id", book_id).execute()
    if not response.data:
        raise HTTPException(status_code=404, detail="Book not found")
    book = response.data[0]
    
    # Check status?
    if book.get("status") != "ready":
         raise HTTPException(status_code=400, detail="Book is not ready for chat")

    # 2. Get Persona
    res_p = supabase.table("personas").select("*").eq("book_id", book_id).execute()
    if res_p.data:
        persona = res_p.data[0]
        system_content = f"Role: {persona['role_name']}\nInstructions: {persona['system_prompt']}"
    else:
        system_content = "You are a helpful assistant."

    # 3. Retrieve Context
    # Using file_hash from book record. 
    # Ensure book table has file_hash! (Added in schema)
    docs = await retrieve_context(chat_request.message, book.get("file_hash", ""))
    context_text = "\n\n".join([doc.page_content for doc in docs])
    
    # 4. Construct Messages
    messages = [
        SystemMessage(content=system_content),
        HumanMessage(content=f"Context:\n{context_text}\n\nQuestion: {chat_request.message}")
    ]

    # 5. Stream
    async def event_generator() -> AsyncGenerator[str, None]:
        full_response = ""
        try:
            async for chunk in chat_llm.astream(messages):
                content = chunk.content
                if content:
                    full_response += content
                    yield f"data: {json.dumps({'content': content})}\n\n"
            
            yield "data: [DONE]\n\n"
            
            # Save History
            # User ID handling: For now, we don't have Auth. 
            # In Supabase, usually user_id comes from Auth token.
            # If "God Mode", pass a dummy or None.
            # The previous code used book.owner_id. 
            # In new schema, book has user_id.
            user_id = book.get("user_id")
            await save_chat_history(user_id, book_id, chat_request.message, full_response)
                
        except Exception as e:
            print(f"Error in stream: {e}")
            yield f"data: {json.dumps({'error': str(e)})}\n\n"

    return StreamingResponse(event_generator(), media_type="text/event-stream")

@router.get("/{book_id}/messages", response_model=List[ChatMessageSchema])
async def get_chat_history(book_id: str):
    """
    Retrieve chat history for a book.
    """
    response = supabase.table("chat_messages")\
        .select("id, role, content, created_at, user_id")\
        .eq("book_id", book_id)\
        .order("created_at")\
        .execute()
        
    # Convert string timestamps to datetime objects if Pydantic doesn't auto-handle? 
    # Pydantic usually handles ISO strings.
    return response.data
