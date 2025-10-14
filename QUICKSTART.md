# Guide de démarrage rapide - FutardioMaskBot

## Étapes de configuration

### 1. Prérequis
- Compte Telegram avec un bot créé via @BotFather
- Compte OpenAI avec accès à l'API
- Compte Cloudflare Workers
- Node.js et npm installés

### 2. Installation
```bash
npm install
```

### 3. Configuration des secrets

Exécutez le script de configuration :
```bash
./setup-secrets.sh
```

Ou configurez manuellement :
```bash
# Configurez votre token Telegram Bot
wrangler secret put TELEGRAM_BOT_TOKEN

# Configurez votre clé API OpenAI
wrangler secret put OPENAI_API_KEY
```

### 4. Test en local
```bash
npm run dev
```

### 5. Déploiement
```bash
npm run deploy
```

### 6. Configuration du webhook Telegram

Une fois déployé, configurez le webhook :
```bash
./setup-webhook.sh VOTRE_TOKEN_TELEGRAM https://votre-worker.votre-subdomain.workers.dev
```

## Tokens nécessaires

### Token Telegram Bot
1. Allez sur Telegram et cherchez @BotFather
2. Tapez `/newbot` et suivez les instructions
3. Copiez le token fourni

### Clé API OpenAI
1. Allez sur [platform.openai.com](https://platform.openai.com)
2. Créez une nouvelle clé API
3. Assurez-vous d'avoir des crédits disponibles

## Test du bot

**Expérience simplifiée :**

1. Cherchez votre bot sur Telegram
2. Tapez `/start` → Le bot répond "Send me your image."
3. Envoyez directement une photo avec un visage visible
4. Attendez la génération (30-60 secondes)
5. Recevez votre image avec le masque de Futardio !
6. Envoyez une autre photo pour recommencer instantanément

**Aucun menu, aucun bouton** - juste un flux direct et fluide !

## Résolution des problèmes

### Le bot ne répond pas
- Vérifiez que le webhook est configuré correctement
- Vérifiez les logs de Cloudflare Workers
- Vérifiez que les secrets sont configurés

### Erreur OpenAI
- Vérifiez que votre clé API est valide
- Vérifiez que vous avez des crédits disponibles
- Vérifiez que vous avez accès à DALL-E 3 et GPT-4 Vision

### Le webhook ne fonctionne pas
```bash
# Vérifier le statut du webhook
curl "https://api.telegram.org/bot<VOTRE_TOKEN>/getWebhookInfo"
```

## Support

Si vous rencontrez des problèmes, vérifiez :
1. Les logs Cloudflare Workers
2. Le statut du webhook Telegram
3. Votre solde API OpenAI
