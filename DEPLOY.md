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

## Dépannage Git (Windows) — `git` non reconnu

Si PowerShell affiche l'erreur `git : The term 'git' is not recognized...`, Git n'est pas installé (ou pas dans le `PATH`).

### Option A (recommandée) — GitHub Desktop (sans terminal)
1. Installe **GitHub Desktop** : <https://desktop.github.com/>
2. Ouvre ton repo `Musaic-AI` dans GitHub Desktop.
3. Clique **Fetch origin**, puis **Push origin**.
4. Si besoin, crée une PR et merge vers `main`.

### Option B — Installer Git pour Windows
1. Installe **Git for Windows** : <https://git-scm.com/download/win>
2. Redémarre VS Code après l'installation.
3. Vérifie que Git est dispo :

```bash
git --version
```

4. Puis pousse ta branche :

```bash
git checkout work
git push -u origin work
```

### Si `git` reste introuvable
- Ferme/réouvre totalement VS Code.
- Ouvre un **nouveau terminal PowerShell**.
- Vérifie que ce chemin existe : `C:\Program Files\Git\cmd\git.exe`.
- Si nécessaire, ajoute `C:\Program Files\Git\cmd` au `PATH` Windows puis redémarre la session.

### SpotlightPublic (pages /s/slug)
Le `vercel.json` contient un rewrite qui envoie `/s/*` vers `index.html`.
Le composant SpotlightPublic lit le slug depuis l'URL via React Router.

### Limites connues
- Video generation nécessite Vercel Pro (timeout > 10s)
- Les fonctions serverless ont un cold start de ~1-2s à la première invocation
- Firebase Admin se reconnecte à chaque cold start (~500ms)

## Récupérer `App.tsx` automatiquement depuis GitHub (sans terminal avancé)

Si ton PC a perdu les fichiers locaux mais que GitHub contient la dernière version :

1. Ouvre le repo sur GitHub web.
2. Clique dans `src/App.tsx`.
3. Clique **Raw** puis `Ctrl+A` / `Ctrl+C`.
4. Dans VS Code local, ouvre `src/App.tsx`, fais `Ctrl+A` / `Ctrl+V`, puis sauvegarde.
5. Fais la même chose pour les autres fichiers critiques si besoin (`src/components/Header.tsx`, `src/components/ai-service.ts`).

### Méthode recommandée (plus sûre) : GitHub Desktop

1. Installe/ouvre **GitHub Desktop**.
2. `File` → `Clone repository...` → colle `https://github.com/dctprod-dotcom/Musaic-AI.git`.
3. Choisis un dossier local et clique **Clone**.
4. Sélectionne la bonne branche (`main` ou `work`).
5. Ouvre le projet cloné dans VS Code (`Repository` → `Open in Visual Studio Code`).

Tu repars ainsi d'une copie locale propre identique à GitHub.


## Problème: seul l'URL de commit fonctionne (pas le domaine officiel)

Si `*.vercel.app` de commit marche mais pas le domaine officiel (`www...`) :

1. **Vercel → Settings → Domains**
   - Le domaine custom doit être `Valid Configuration`.
   - Vérifie les DNS (`A`, `CNAME`) chez ton registrar.
2. **Firebase → Authentication → Settings → Authorized domains**
   - Ajoute **tous** les domaines utilisés:
     - domaine officiel (`www.musaicaistudio.com`)
     - domaine Vercel principal (`...projects.vercel.app`)
     - éventuel domaine preview
3. **Vercel → Environment Variables (Production)**
   - `VITE_PUBLIC_APP_URL=https://www.musaicaistudio.com`
   - `NEXT_PUBLIC_APP_URL=https://www.musaicaistudio.com`
4. **Redeploy** après changement des variables/env.

Pourquoi: les previews changent à chaque commit, donc `window.location.origin` devient instable pour les liens partagés et certains flux auth.
