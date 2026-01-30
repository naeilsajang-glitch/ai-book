import os
from app.db.supabase import supabase

async def download_file_from_storage(bucket_name: str, file_path: str, destination_path: str):
    """
    Download a file from Supabase Storage to a local destination.
    """
    print(f"Downloading from bucket '{bucket_name}', path '{file_path}' to '{destination_path}'...")
    try:
        # Supabase Storage download returns bytes
        response = supabase.storage.from_(bucket_name).download(file_path)
        
        with open(destination_path, "wb") as f:
            f.write(response)
            
        print("Download complete.")
        return True
    except Exception as e:
        print(f"Error downloading file: {e}")
        raise e
