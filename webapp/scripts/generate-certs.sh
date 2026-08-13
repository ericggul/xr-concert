#!/bin/bash
set -euo pipefail

REPOSITORY_ROOT=$(cd "$(dirname "$0")/.." && pwd)
CERTIFICATE_DIRECTORY="$REPOSITORY_ROOT/certificates"
LOCAL_NAME=$(scutil --get LocalHostName 2>/dev/null || hostname -s)
DEFAULT_HOSTNAME=$(printf "%s.local" "$LOCAL_NAME" | tr '[:upper:]' '[:lower:]')
CERTIFICATE_HOSTNAME=${CERTIFICATE_HOSTNAME:-"$DEFAULT_HOSTNAME"}
SHORT_HOSTNAME=${CERTIFICATE_HOSTNAME%.local}

ROOT_KEY="$CERTIFICATE_DIRECTORY/rootCA.key"
ROOT_CERTIFICATE="$CERTIFICATE_DIRECTORY/rootCA.pem"
SERVER_KEY="$CERTIFICATE_DIRECTORY/server.key"
SERVER_CERTIFICATE="$CERTIFICATE_DIRECTORY/server.pem"
SERVER_REQUEST="$CERTIFICATE_DIRECTORY/server.csr"
SERVER_CONFIGURATION="$CERTIFICATE_DIRECTORY/server.conf"
HOSTNAME_RECORD="$CERTIFICATE_DIRECTORY/.hostname"

mkdir -p "$CERTIFICATE_DIRECTORY"

if [ ! -f "$ROOT_KEY" ]; then
  openssl genrsa -out "$ROOT_KEY" 2048
  chmod 600 "$ROOT_KEY"
fi

if [ ! -f "$ROOT_CERTIFICATE" ]; then
  openssl req -x509 -new -nodes -key "$ROOT_KEY" -sha256 -days 3650 \
    -out "$ROOT_CERTIFICATE" -subj "/C=KR/O=NRF-XR-Dev/CN=NRF-XR-Dev-Root-CA"
fi

NEEDS_CERTIFICATE=false
if [ ! -f "$SERVER_KEY" ] || [ ! -f "$SERVER_CERTIFICATE" ]; then
  NEEDS_CERTIFICATE=true
elif [ ! -f "$HOSTNAME_RECORD" ] || [ "$(<"$HOSTNAME_RECORD")" != "$CERTIFICATE_HOSTNAME" ]; then
  NEEDS_CERTIFICATE=true
elif ! openssl x509 -checkend 86400 -noout -in "$SERVER_CERTIFICATE" >/dev/null 2>&1; then
  NEEDS_CERTIFICATE=true
fi

if [ "$NEEDS_CERTIFICATE" = true ]; then
  {
    printf '%s\n' '[req]' 'default_bits = 2048' 'prompt = no' 'default_md = sha256' \
      'distinguished_name = dn' 'req_extensions = req_ext' '' '[dn]' 'C = KR' \
      'O = NRF-XR-Dev' "CN = $CERTIFICATE_HOSTNAME" '' '[req_ext]' \
      'subjectAltName = @alt_names' '' '[alt_names]' 'DNS.1 = localhost' \
      "DNS.2 = $CERTIFICATE_HOSTNAME" 'IP.1 = 127.0.0.1'
    if [ "$SHORT_HOSTNAME" != "$CERTIFICATE_HOSTNAME" ]; then
      printf 'DNS.3 = %s\n' "$SHORT_HOSTNAME"
    fi
  } > "$SERVER_CONFIGURATION"

  openssl genrsa -out "$SERVER_KEY" 2048
  chmod 600 "$SERVER_KEY"
  openssl req -new -key "$SERVER_KEY" -out "$SERVER_REQUEST" -config "$SERVER_CONFIGURATION"
  openssl x509 -req -in "$SERVER_REQUEST" -CA "$ROOT_CERTIFICATE" -CAkey "$ROOT_KEY" \
    -CAcreateserial -out "$SERVER_CERTIFICATE" -days 825 -sha256 \
    -extfile "$SERVER_CONFIGURATION" -extensions req_ext
  printf '%s' "$CERTIFICATE_HOSTNAME" > "$HOSTNAME_RECORD"
fi

printf 'HTTPS certificates ready for %s.\n' "$CERTIFICATE_HOSTNAME"
printf 'Install the mobile root certificate from https://%s:%s/cert\n' "$CERTIFICATE_HOSTNAME" "${REALTIME_PORT:-10001}"
