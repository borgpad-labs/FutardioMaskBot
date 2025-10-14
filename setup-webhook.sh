#!/bin/bash

# Script pour configurer le webhook Telegram
# Usage: ./setup-webhook.sh <TELEGRAM_BOT_TOKEN> <WEBHOOK_URL>

if [ $# -ne 2 ]; then
    echo "Usage: $0 <TELEGRAM_BOT_TOKEN> <WEBHOOK_URL>"
    echo "Exemple: $0 123456:ABC-DEF1234ghIkl-zyx57W2v1u123ew11 https://your-worker.your-subdomain.workers.dev"
    exit 1
fi

TELEGRAM_BOT_TOKEN=$1
WEBHOOK_URL=$2

echo "Configuration du webhook Telegram..."
echo "Token: ${TELEGRAM_BOT_TOKEN:0:10}..."
echo "URL: $WEBHOOK_URL"

# Configurer le webhook
RESPONSE=$(curl -s -X POST "https://api.telegram.org/bot$TELEGRAM_BOT_TOKEN/setWebhook" \
  -H "Content-Type: application/json" \
  -d "{\"url\": \"$WEBHOOK_URL\"}")

echo "Réponse de Telegram:"
echo $RESPONSE | jq '.' 2>/dev/null || echo $RESPONSE

# Vérifier le statut du webhook
echo ""
echo "Vérification du webhook..."
STATUS=$(curl -s "https://api.telegram.org/bot$TELEGRAM_BOT_TOKEN/getWebhookInfo")
echo $STATUS | jq '.' 2>/dev/null || echo $STATUS
