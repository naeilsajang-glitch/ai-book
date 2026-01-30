import os
import shutil
import hashlib
from typing import Optional
from fastapi import APIRouter, BackgroundTasks, HTTPException, status
from pydantic import UUID4

from app.schemas.book import BookProcessRequest
from app.services.pdf_service import parse_pdf, split_markdown
from app.services.rag_service import upsert_documents
from app.services.persona_service import generate_system_prompt
from app.services.storage_service import download_file_from_storage
from app.db.supabase import supabase

router = APIRouter()

async def process_book_task(book_id: str, bucket_name: str, file_path: str):
    """
    Background task to process the PDF from Supabase Storage.
    """
    local_path = f"temp_{book_id}.pdf"
    
    try:
        # 1. Download from Supabase
        await download_file_from_storage(bucket_name, file_path, local_path)
        
        # 2. Parse PDF
        full_text = await parse_pdf(local_path)
        
        # 3. Split
        docs = split_markdown(full_text)
        
        # 4. Calculate Hash (for Deduplication/Reference)
        with open(local_path, "rb") as f:
            file_hash = hashlib.sha256(f.read()).hexdigest()
            
        await upsert_documents(docs, file_hash)
        
        # 5. Generate Persona
        persona_data = await generate_system_prompt(full_text)
        
        # 6. Update Book Status & Save Persona in Supabase
        # Update Book
        print(f"Updating book {book_id} status to ready...")
        supabase.table("books").update({
            "status": "ready", 
            "file_hash": file_hash
        }).eq("id", book_id).execute()
        
        # Create Persona
        # Check if persona exists first? Or just insert.
        # Supabase UUID usually auto-generated if omitted.
        supabase.table("personas").insert({
            "book_id": book_id,
            "role_name": persona_data["role_name"],
            "system_prompt": persona_data["system_prompt"]
        }).execute()
        
        print(f"Book {book_id} processed successfully.")
            
    except Exception as e:
        print(f"Error processing book {book_id}: {e}")
        # Update Status to Failed
        supabase.table("books").update({
            "status": "failed",
            "error_message": str(e)
        }).eq("id", book_id).execute()
        
    finally:
        # Cleanup
        if os.path.exists(local_path):
            os.remove(local_path)

@router.post("/process-book", status_code=status.HTTP_202_ACCEPTED)
async def process_book(
    request: BookProcessRequest,
    background_tasks: BackgroundTasks
):
    """
    Trigger processing of a book already uploaded to Supabase Storage.
    """
    # Verify book exists (Optional, mostly implicit)
    # response = supabase.table("books").select("id").eq("id", str(request.book_id)).execute()
    # if not response.data:
    #     raise HTTPException(status_code=404, detail="Book record not found")
    
    background_tasks.add_task(
        process_book_task, 
        str(request.book_id), 
        request.bucket_name, 
        request.file_path
    )
    
    return {"status": "processing", "msg": "Book processing started", "book_id": request.book_id}
