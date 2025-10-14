#!/bin/bash

# Script de configuration des secrets pour FutardioMaskBot
# Remplacez les valeurs par vos vrais tokens avant d'exécuter

echo "Configuration des secrets Cloudflare Workers..."

# Configuration du token Telegram Bot
echo "Configuration du token Telegram Bot..."
echo "Entrez votre token Telegram Bot (obtenu depuis @BotFather):"
read -s TELEGRAM_BOT_TOKEN
wrangler secret put TELEGRAM_BOT_TOKEN <<< "$TELEGRAM_BOT_TOKEN"

# Configuration de la clé API OpenAI
echo "Configuration de la clé API OpenAI..."
echo "Entrez votre clé API OpenAI (obtenue depuis platform.openai.com):"
read -s OPENAI_API_KEY
wrangler secret put OPENAI_API_KEY <<< "$OPENAI_API_KEY"

echo "✅ Configuration terminée!"
echo ""
echo "Prochaines étapes:"
echo "1. Déployez votre worker: npm run deploy"
echo "2. Configurez le webhook Telegram avec l'URL de votre worker"
echo "3. Testez votre bot!"
