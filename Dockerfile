# Python 3.11 Slim (Lightweight)
FROM python:3.11-slim

# Set working directory
WORKDIR /app

# Install system dependencies (gcc, libpq-dev needed for some python libs if attempting to build)
# Supabase/FastAPI deps are mostly pure python or have wheels, but gcc is safe.
RUN apt-get update && apt-get install -y \
    gcc \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements first to leverage Docker cache
COPY requirements.txt .

# Install dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY . .

# Expose port (Railway will override this, but good for docs)
EXPOSE 8080

# Command to run the application (production mode)
# Use the dynamic PORT injected by Railway
CMD ["sh", "-c", "uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8000}"]
