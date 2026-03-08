# Musaic AI v3.1 — Déploiement Vercel

## Architecture

```
musaic-ai/
├── api/                    ← Vercel Serverless Functions (remplace server.ts)
│   ├── _shared.ts          ← Firebase Admin, auth, Stripe (partagé)
│   ├── ai/
│   │   ├── generate-image.ts
│   │   ├── generate-text.ts
│   │   └── generate-video.ts
│   ├── library/
│   │   ├── list.ts
│   │   └── save.ts
│   ├── spotlight/
│   │   ├── [slug].ts       ← Dynamic route: GET public, POST view/click
│   │   ├── check-slug.ts
│   │   ├── me.ts
│   │   └── save.ts
│   ├── stripe/
│   │   └── create-checkout.ts
│   ├── user/
│   │   ├── me.ts
│   │   └── delete.ts
│   ├── promo/redeem.ts
│   ├── transactions.ts
│   └── webhooks/stripe.ts
├── src/                    ← React frontend (Vite)
├── public/
├── vercel.json
├── package.json
└── vite.config.ts
```

## Étape 1 — Préparer le repo GitHub

```bash
# Dans ton repo existant, vide le contenu actuel (ou crée une branche)
cd musaic-ai
git checkout -b v3.1-vercel

# Supprime l'ancien code
rm -rf src/ api/ public/ server.ts

# Décompresse le nouveau zip ici
unzip musaic-ai-v3.1-vercel.zip -d .

# Commit
git add .
git commit -m "feat: v3.1 — Full Vercel serverless architecture"
git push origin v3.1-vercel
```

## Étape 2 — Connecter Vercel

1. Va sur **[vercel.com/new](https://vercel.com/new)**
2. Importe ton repo GitHub `musaic-ai`
3. **Framework Preset** → Vite
4. **Build Command** → `vite build` (devrait être auto-détecté)
5. **Output Directory** → `dist`
6. Clique **Deploy** (ça va fail la première fois — c'est normal, on doit ajouter les env vars)

## Étape 3 — Variables d'environnement

Dans **Vercel Dashboard → Settings → Environment Variables**, ajoute :

| Variable | Description |
|---|---|
| `FIREBASE_PROJECT_ID` | `utility-destiny-389408` |
| `FIREBASE_SERVICE_ACCOUNT_KEY` | Colle le JSON complet de ta service account Firebase Admin (une seule ligne) |
| `GEMINI_API_KEY` | Ta clé API Gemini (depuis Google AI Studio) |
| `STRIPE_SECRET_KEY` | Ta clé secrète Stripe (sk_test_...) |
| `STRIPE_WEBHOOK_SECRET` | Le secret du webhook Stripe (whsec_...) |
| `STRIPE_PRICE_ID_PRO` | L'ID du prix Stripe pour l'abonnement PRO |

### Comment obtenir FIREBASE_SERVICE_ACCOUNT_KEY :
1. Firebase Console → Project Settings → Service Accounts
2. Clique "Generate new private key"
3. Copie tout le JSON
4. Colle-le tel quel dans la variable Vercel (une seule ligne)

## Étape 4 — Redéployer

```bash
# Après avoir ajouté les env vars, redéploie
vercel --prod
# Ou pousse un commit, Vercel auto-deploy
```

## Étape 5 — Configurer le Webhook Stripe

1. Stripe Dashboard → Developers → Webhooks
2. Ajoute un endpoint: `https://ton-domaine.vercel.app/api/webhooks/stripe`
3. Événements à écouter :
   - `checkout.session.completed`
   - `invoice.payment_failed`
   - `customer.subscription.deleted`
4. Copie le Signing Secret → mets-le dans `STRIPE_WEBHOOK_SECRET` sur Vercel

## Étape 6 — Domaine custom (optionnel)

1. Vercel Dashboard → Settings → Domains
2. Ajoute `musaic-ai.app` (ou ton domaine)
3. Configure les DNS chez ton registrar

## Notes importantes

### Timeouts
- Vercel Hobby : 10s max par function → video generation ne marchera PAS
- **Vercel Pro** ($20/mo) : 300s max → nécessaire pour `/api/ai/generate-video`
- Images et texte fonctionnent sur Hobby (< 60s)

### Astuce pour le développement local
```bash
# Installe Vercel CLI
npm i -g vercel

# Lance le dev server (frontend + serverless functions)
vercel dev

# Ça simule l'environnement Vercel localement
# Les API routes dans /api/ sont servies automatiquement
```

### SpotlightPublic (pages /s/slug)
Le `vercel.json` contient un rewrite qui envoie `/s/*` vers `index.html`.
Le composant SpotlightPublic lit le slug depuis l'URL via React Router.

### Limites connues
- Video generation nécessite Vercel Pro (timeout > 10s)
- Les fonctions serverless ont un cold start de ~1-2s à la première invocation
- Firebase Admin se reconnecte à chaque cold start (~500ms)
