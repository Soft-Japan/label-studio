#!/bin/sh
set -e ${DEBUG:+-x}

CADDY_CONFIG=$OPT_DIR/caddy/Caddyfile

echo >&3 "=> Copy Caddy config file..."
mkdir -p "$OPT_DIR/caddy"
\cp -f /label-studio/deploy/Caddyfile $CADDY_CONFIG

# ── Configure upstream app host ──────────────────────────────
if [ -n "${APP_HOST:-}" ]; then
  echo >&3 "=> Setting upstream app host to: ${APP_HOST}"
  export APP_HOST="${APP_HOST}"
else
  echo >&3 "=> Using default upstream app host: localhost"
fi

# ── Handle LABEL_STUDIO_HOST subpath ─────────────────────────
LABEL_STUDIO_HOST_NO_SCHEME=${LABEL_STUDIO_HOST#*//}
LABEL_STUDIO_HOST_NO_TRAILING_SLASH=${LABEL_STUDIO_HOST_NO_SCHEME%/}
LABEL_STUDIO_HOST_SUBPATH=$(echo "$LABEL_STUDIO_HOST_NO_TRAILING_SLASH" | cut -d'/' -f2- -s)

if [ -n "${LABEL_STUDIO_HOST_SUBPATH:-}" ]; then
  echo >&3 "=> Adding subpath /${LABEL_STUDIO_HOST_SUBPATH} to Caddy config..."
  # Prepend subpath to handle_path and handle directives
  sed -i "s|handle_path /static/\*|handle_path /${LABEL_STUDIO_HOST_SUBPATH}/static/*|g" $CADDY_CONFIG
  sed -i "s|handle_path /react-app/\*|handle_path /${LABEL_STUDIO_HOST_SUBPATH}/react-app/*|g" $CADDY_CONFIG
  sed -i "s|handle /caddy_health|handle /${LABEL_STUDIO_HOST_SUBPATH}/caddy_health|g" $CADDY_CONFIG
  sed -i "s|handle /favicon.ico|handle /${LABEL_STUDIO_HOST_SUBPATH}/favicon.ico|g" $CADDY_CONFIG
  echo >&3 "=> Successfully added subpath to Caddy config."
else
  echo >&3 "=> Skipping subpath configuration."
fi

# ── Configure SSL if certs are provided ──────────────────────
if [ -n "${CADDY_SSL_CERT:-}" ] && [ -n "${CADDY_SSL_CERT_KEY:-}" ]; then
  echo >&3 "=> Configuring TLS with provided certificates..."
  sed -i "s|auto_https off|# auto_https off|g" $CADDY_CONFIG
  # Add tls directive inside the server block
  sed -i "/:{.CADDY_PORT:8085}/a\\\\ttls ${CADDY_SSL_CERT} ${CADDY_SSL_CERT_KEY}" $CADDY_CONFIG
  echo >&3 "=> TLS configured successfully."
else
  echo >&3 "=> Skipping TLS configuration (no certificates provided)."
fi

echo >&3 "=> Caddy configuration complete."
