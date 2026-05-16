#!/bin/sh
if [ ! -f /etc/nginx/ssl/cert.pem ]; then
  echo "Generating self-signed SSL certificates..."
  mkdir -p /etc/nginx/ssl
  openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
    -keyout /etc/nginx/ssl/key.pem \
    -out /etc/nginx/ssl/cert.pem \
    -subj "/CN=localhost"
  echo "Certificates generated."
fi
