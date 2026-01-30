from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.prompts import PromptTemplate
from app.core.config import settings

llm = ChatGoogleGenerativeAI(
    model="gemini-2.5-flash",
    google_api_key=settings.GOOGLE_API_KEY,
    temperature=0.7,
    convert_system_message_to_human=True # Gemini sometimes needs this for system prompts in certain chains (optional but safe)
)

async def generate_system_prompt(book_text_sample: str) -> dict:
    """
    Analyze the beginning of the book to generate a persona name and system prompt.
    Returns: {"role_name": str, "system_prompt": str}
    """
    
    # Simple prompt engineering
    template = """
    You are an expert literary analyst and AI persona designer.
    Analyze the provided text (preface/introduction of a book) and create a "Persona" for an AI assistant that represents the author or the spirit of this book.
    
    Input Text:
    {text}
    
    Output Format (JSON strictly):
    {{
        "role_name": "Name of the persona (e.g., 'The Stoic Philosopher', 'Strict Financial Advisor')",
        "system_prompt": "A detailed system prompt (instruction) for the AI, instructing it how to behave, speak, and answer questions based on this book's content. It should be strictly grounded in the book."
    }}
    """
    
    # We can use structured output or simple chain. 
    # For robust JSON, we'll use json mode if available or PydanticOutputParser.
    # For MVP, we'll trust GPT-4o with simple json prompt.
    
    prompt = PromptTemplate(template=template, input_variables=["text"])
    chain = prompt | llm
    
    # Using first 2000 chars roughly as sample
    sample = book_text_sample[:8000] # GPT-4o context is large, 8000 chars is safe
    
    response = await chain.ainvoke({"text": sample})
    content = response.content
    
    # Parse generic JSON
    import json
    try:
        # cleanup markdown code blocks if any
        if "```json" in content:
            content = content.split("```json")[1].split("```")[0].strip()
        elif "```" in content:
            content = content.split("```")[1].split("```")[0].strip()
            
        result = json.loads(content)
        return result
    except Exception as e:
        # Fallback
        return {
            "role_name": "Book Assistant",
            "system_prompt": "You are a helpful assistant answering questions based on the book."
        }
