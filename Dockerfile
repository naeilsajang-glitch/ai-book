# Python 3.11 Slim (Lightweight)
FROM python:3.11-slim-bookworm

# Set working directory
WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    gcc \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements first
COPY requirements.txt .

# Install dependencies with increased timeout and mirror for reliability
# Installing heaviest packages first to better utilize layer caching if they succeed
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir --default-timeout=100 -r requirements.txt

# Copy application code
COPY . .

# Expose port (Railway will override this, but good for docs)
EXPOSE 8080

# Command to run the application (production mode)
# Use the dynamic PORT injected by Railway
CMD ["sh", "-c", "uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8000}"]
