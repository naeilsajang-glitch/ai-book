from supabase import create_client, Client
from app.core.config import settings

def get_supabase() -> Client:
    """
    Return a Supabase client instance.
    Using SERVICE_KEY to bypass Row Level Security (RLS) for backend operations.
    """
    url: str = settings.SUPABASE_URL
    key: str = settings.SUPABASE_SERVICE_KEY
    return create_client(url, key)

supabase: Client = get_supabase()
