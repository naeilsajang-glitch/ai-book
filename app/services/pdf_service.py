import os
from llama_parse import LlamaParse
from langchain_text_splitters import MarkdownHeaderTextSplitter
from app.core.config import settings

async def parse_pdf(file_path: str) -> str:
    """
    Parse PDF using LlamaParse (Markdown mode).
    Returns the full markdown content.
    """
    parser = LlamaParse(
        api_key=settings.LLAMA_CLOUD_API_KEY,
        result_type="markdown",  # "markdown" and "text" are available
        verbose=True,
    )
    
    # LlamaParse.load_data can be blocking or async depending on implementation, 
    # but currently official SDK often runs sync under the hood or via event loop.
    # For safety in async FastAPI, we might offload if it was heavy, 
    # but LlamaParse does HTTP calls, so it should be fine or we wrap it.
    # Note: parser.load_data returns a list of Document objects
    documents = await parser.aload_data(file_path) 
    
    full_text = "\n\n".join([doc.text for doc in documents])
    return full_text

def split_markdown(text: str):
    """
    Split markdown content into chunks based on headers.
    """
    headers_to_split_on = [
        ("#", "Header 1"),
        ("##", "Header 2"),
        ("###", "Header 3"),
    ]
    
    splitter = MarkdownHeaderTextSplitter(headers_to_split_on=headers_to_split_on)
    chunks = splitter.split_text(text)
    return chunks
