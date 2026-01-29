FROM python:3.11-slim

# Standard Python environment variables
ENV PYTHONDONTWRITEBYTECODE 1
ENV PYTHONUNBUFFERED 1
ENV PORT 8181

WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

# EXPOSE the port for documentation
EXPOSE 8181

# The CORRECT way to start Streamlit in Docker/Cloud Run
CMD ["streamlit", "run", "app.py", "--server.port", "8181", "--server.address", "0.0.0.0", "--server.headless", "true"]