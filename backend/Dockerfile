FROM python:3.11-slim

RUN apt-get update && apt-get install -y \
    git \
    gcc \
    libffi-dev \
    openssl \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

# Install Villain's own dependencies
RUN if [ -f /app/villain/requirements.txt ]; then \
      pip install --no-cache-dir -r /app/villain/requirements.txt; \
    fi

RUN mkdir -p /app/data /app/uploads

# Generate self-signed cert for nginx if not present
RUN mkdir -p /certs && \
    openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
    -keyout /certs/selfsigned.key -out /certs/selfsigned.crt \
    -subj "/C=AZ/ST=Baku/L=Baku/O=VillainUI/CN=localhost" || true

EXPOSE 8000

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000", "--reload"]
