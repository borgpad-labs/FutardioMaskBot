# FutardioMaskBot

Bot Telegram automatisé qui fusionne des visages avec le masque iconique de Futardio en utilisant l'API ChatGPT/DALL-E.

## Fonctionnalités

- 🎭 **Fusion instantanée** de visages avec le masque iconique de Futardio
- 📸 **Expérience ultra-simple** : envoyez une photo, recevez le résultat
- 🧠 Analyse intelligente des photos avec GPT-4 Vision
- 🎨 Génération d'images haute qualité avec DALL-E 3
- ⚡ **Flux direct** sans menus ou étapes complexes

## Prérequis

- Un bot Telegram (créé via @BotFather)
- Une clé API OpenAI
- Un compte Cloudflare Workers
- Node.js et npm installés

## Configuration

### 1. Installation des dépendances

```bash
npm install
```

### 2. Configuration des variables d'environnement

Configurez vos secrets avec Wrangler:

```bash
# Token de votre bot Telegram (obtenu depuis @BotFather)
wrangler secret put TELEGRAM_BOT_TOKEN

# Clé API OpenAI (obtenue depuis platform.openai.com)
wrangler secret put OPENAI_API_KEY
```

### 3. Configuration du webhook Telegram

Une fois votre worker déployé, configurez le webhook de votre bot:

```bash
curl -X POST "https://api.telegram.org/bot<VOTRE_TOKEN>/setWebhook" \
  -H "Content-Type: application/json" \
  -d '{"url": "https://votre-worker.votre-subdomain.workers.dev/"}'
```

## Déploiement

### Développement local

```bash
npm run dev
```

### Déploiement en production

```bash
npm run deploy
```

## Utilisation du bot

**Expérience ultra-simple :**

1. **Démarrer** : Envoyez `/start` à votre bot
2. **Envoyer** : Le bot vous demande "Send me your image."
3. **Recevoir** : Envoyez une photo, le bot génère automatiquement l'image avec le masque
4. **Répéter** : Envoyez une autre photo pour recommencer !

**C'est tout !** Pas de menus, pas de boutons, juste un flux direct et fluide.

## Structure du projet

```
src/
├── index.ts        # Point d'entrée principal et gestion des webhooks
├── telegram.ts     # Service pour l'API Telegram
├── openai.ts       # Service pour l'API OpenAI (GPT-4 Vision + DALL-E)
├── session.ts      # Gestion des sessions utilisateur
└── types.ts        # Définitions TypeScript
```

## Architecture

Le bot utilise Cloudflare Workers pour:
- Recevoir les webhooks Telegram
- Traiter les images avec OpenAI
- Gérer les sessions utilisateur en mémoire
- Répondre en temps réel

## Sécurité

- Les tokens sont stockés comme secrets Cloudflare
- Validation des types de fichiers
- Gestion d'erreurs robuste
- Limitation des sessions en mémoire

## Commandes disponibles

- `/start` - Démarre le bot et active le mode photo
- `/help` - Rappel simple de l'utilisation

Le bot fonctionne en **mode continu** : après chaque photo traitée, il est prêt à en recevoir une nouvelle.

## Développement

### Scripts disponibles

- `npm run dev` - Développement local avec hot reload
- `npm run build` - Compilation TypeScript
- `npm run deploy` - Déploiement sur Cloudflare Workers

### Contribuer

1. Fork le projet
2. Créez une branche feature (`git checkout -b feature/nouvelle-fonctionnalite`)
3. Commit vos changements (`git commit -am 'Ajout d'une nouvelle fonctionnalité'`)
4. Push vers la branche (`git push origin feature/nouvelle-fonctionnalite`)
5. Créez une Pull Request

## Licence

MIT License - voir le fichier LICENSE pour plus de détails.
