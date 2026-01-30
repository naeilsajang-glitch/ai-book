import os
from typing import List
from langchain_google_genai import GoogleGenerativeAIEmbeddings
from langchain_community.vectorstores import SupabaseVectorStore
from app.core.config import settings
from app.db.supabase import supabase

# Explicitly set env var for libraries that rely on it
os.environ["GOOGLE_API_KEY"] = settings.GOOGLE_API_KEY

embeddings = GoogleGenerativeAIEmbeddings(model="models/embedding-001", google_api_key=settings.GOOGLE_API_KEY)

# Supabase Vector Store
vectorstore = SupabaseVectorStore(
    client=supabase,
    embedding=embeddings,
    table_name="documents",
    query_name="match_documents"
)

async def upsert_documents(documents: List[any], file_hash: str):
    """
    Upsert documents (chunks) to Supabase with file_hash metadata.
    """
    # Create metadata for each doc
    for doc in documents:
        doc.metadata["file_hash"] = str(file_hash)
    
    # Langchain Supabase add_documents
    vectorstore.add_documents(documents)

async def retrieve_context(query: str, file_hash: str, k: int = 5):
    """
    Retrieve context relevant to the query from the specific book (via file_hash).
    """
    # Filter syntax for Supabase Vector Store (PostgREST)
    # metadata column is jsonb.
    # We want metadata->>'file_hash' == file_hash
    filter_dict = {"file_hash": str(file_hash)}
    docs = vectorstore.similarity_search(query, k=k, filter=filter_dict)
    return docs

async def delete_vectors_by_file_hash(file_hash: str):
    """
    Delete all vectors associated with a specific file_hash.
    Used when the last reference to a file is deleted.
    """
    try:
        # Use Supabase Client to delete directly
        response = supabase.table("documents").delete().eq("metadata->>file_hash", str(file_hash)).execute()
        print(f"Vectors for hash {file_hash} deleted. Count: {len(response.data) if response.data else 0}")
    except Exception as e:
        print(f"Error deleting vectors for {file_hash}: {e}")
