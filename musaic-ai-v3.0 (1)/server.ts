import express from "express";
import session from "express-session";
import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
import Stripe from "stripe";
import * as admin from "firebase-admin";
import { getFirestore, FieldValue } from "firebase-admin/firestore";
import firebaseConfig from "./firebase-applet-config.json" assert { type: "json" };

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Initialize Firebase Admin
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.applicationDefault(),
    projectId: firebaseConfig.projectId,
  });
}
const db = getFirestore();

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "sk_test_placeholder");

const app = express();
const PORT = parseInt(process.env.PORT || "3000");

// Health Check for Cloud Run
app.get("/health", (req, res) => {
  res.status(200).send("OK");
});

// Stripe Webhook needs raw body
app.post("/api/webhooks/stripe", express.raw({ type: 'application/json' }), async (req, res) => {
  const sig = req.headers['stripe-signature'];
  let event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig!, process.env.STRIPE_WEBHOOK_SECRET || "");
  } catch (err: any) {
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  const session = event.data.object as any;

  switch (event.type) {
    case 'checkout.session.completed':
      const userId = session.metadata.userId;
      const customerId = session.customer;
      
      const userRef = db.collection('users').doc(userId);

      if (session.mode === 'subscription') {
        await userRef.update({ isPro: true, stripeCustomerId: customerId });
      } else {
        const pointsToAdd = parseInt(session.metadata.points);
        await db.runTransaction(async (t) => {
          const userDoc = await t.get(userRef);
          if (!userDoc.exists) return;
          const currentPoints = userDoc.data()?.points || 0;
          t.update(userRef, { points: currentPoints + pointsToAdd, stripeCustomerId: customerId });
          t.set(db.collection('transactions').doc(), {
            userId,
            amount: pointsToAdd,
            description: "Points Purchase",
            createdAt: FieldValue.serverTimestamp()
          });
        });
      }
      break;

    case 'invoice.payment_failed':
    case 'customer.subscription.deleted':
      const customer = session.customer as string;
      const snapshot = await db.collection('users').where('stripeCustomerId', '==', customer).get();
      if (!snapshot.empty) {
        snapshot.forEach(doc => doc.ref.update({ isPro: false }));
      }
      break;
  }

  res.json({ received: true });
});

app.use(express.json({ limit: '50mb' }));
app.use(session({
  secret: process.env.SESSION_SECRET || "musaic-secret-key",
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: true,
    sameSite: 'none',
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  }
}));

app.use(passport.initialize());
app.use(passport.session());

// Passport Config
passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID || "placeholder",
    clientSecret: process.env.GOOGLE_CLIENT_SECRET || "placeholder",
    callbackURL: `${process.env.APP_URL}/auth/callback`,
    proxy: true
  },
  async (accessToken, refreshToken, profile, done) => {
    const user = {
      id: profile.id,
      displayName: profile.displayName,
      email: profile.emails?.[0]?.value,
      avatar: profile.photos?.[0]?.value
    };

    const userRef = db.collection('users').doc(user.id);
    await userRef.set(user, { merge: true });

    return done(null, user);
  }
));

passport.serializeUser((user: any, done) => done(null, user.id));
passport.deserializeUser(async (id: string, done) => {
  const doc = await db.collection('users').doc(id).get();
  done(null, doc.exists ? doc.data() : null);
});

// Auth Routes
app.get("/api/auth/url", (req, res) => {
  const params = new URLSearchParams({
    client_id: process.env.GOOGLE_CLIENT_ID || "",
    redirect_uri: `${process.env.APP_URL}/auth/callback`,
    response_type: 'code',
    scope: 'profile email',
  });
  res.json({ url: `https://accounts.google.com/o/oauth2/v2/auth?${params}` });
});

app.get("/auth/callback", (req, res, next) => {
  passport.authenticate("google", (err: any, user: any) => {
    if (err) return next(err);
    if (!user) return res.redirect("/");
    req.logIn(user, (err) => {
      if (err) return next(err);
      res.send(`
        <html>
          <body>
            <script>
              if (window.opener) {
                window.opener.postMessage({ type: 'OAUTH_AUTH_SUCCESS' }, '*');
                window.close();
              } else {
                window.location.href = '/';
              }
            </script>
            <p>Authentication successful. This window should close automatically.</p>
          </body>
        </html>
      `);
    });
  })(req, res, next);
});

app.get("/api/auth/me", (req, res) => {
  res.json(req.user || null);
});

app.post("/api/auth/logout", (req, res) => {
  req.logout(() => {
    res.json({ success: true });
  });
});

// Library Routes
app.post("/api/library/save", async (req, res) => {
  if (!req.user) return res.status(401).json({ error: "Unauthorized" });
  const { type, title, artist, data, cost = 0 } = req.body;
  
  const user = req.user as any;
  const userRef = db.collection('users').doc(user.id);

  try {
    await db.runTransaction(async (t) => {
      const userDoc = await t.get(userRef);
      const userData = userDoc.data();

      // Block Video for Non-Pro
      if (type === 'video' && !userData?.isPro) {
        throw new Error("Video generation is a Pro feature");
      }

      if ((userData?.points || 0) < cost && !userData?.isPro) {
        throw new Error("Insufficient points");
      }

      t.set(db.collection('library').doc(), {
        userId: user.id,
        type,
        title,
        artist,
        data,
        createdAt: FieldValue.serverTimestamp()
      });

      if (cost > 0 && !userData?.isPro) {
        t.update(userRef, { points: FieldValue.increment(-cost) });
        t.set(db.collection('transactions').doc(), {
          userId: user.id,
          amount: -cost,
          description: `Generation: ${type}`,
          createdAt: FieldValue.serverTimestamp()
        });
      }
    });
    res.json({ success: true });
  } catch (e: any) {
    res.status(403).json({ error: e.message });
  }
});

app.get("/api/library/list", async (req, res) => {
  if (!req.user) return res.status(401).json({ error: "Unauthorized" });
  const snapshot = await db.collection('library')
    .where('userId', '==', (req.user as any).id)
    .orderBy('createdAt', 'desc')
    .get();
  
  const list = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  res.json(list);
});

// Monetization Routes
app.get("/api/transactions", async (req, res) => {
  if (!req.user) return res.status(401).json({ error: "Unauthorized" });
  const snapshot = await db.collection('transactions')
    .where('userId', '==', (req.user as any).id)
    .orderBy('createdAt', 'desc')
    .get();
    
  const list = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  res.json(list);
});

app.post("/api/promo/redeem", async (req, res) => {
  if (!req.user) return res.status(401).json({ error: "Unauthorized" });
  const { code } = req.body;
  
  try {
    const points = await db.runTransaction(async (t) => {
      const promoRef = db.collection('promo_codes').doc(code);
      const promoDoc = await t.get(promoRef);
      
      if (!promoDoc.exists || promoDoc.data()?.isUsed) {
        throw new Error("Invalid or used promo code");
      }

      const points = promoDoc.data()?.points;
      t.update(promoRef, { isUsed: true });
      
      const userRef = db.collection('users').doc((req.user as any).id);
      t.update(userRef, { points: FieldValue.increment(points) });
      
      t.set(db.collection('transactions').doc(), {
        userId: (req.user as any).id,
        amount: points,
        description: `Promo Code: ${code}`,
        createdAt: FieldValue.serverTimestamp()
      });
      
      return points;
    });
    
    res.json({ success: true, points });
  } catch (e: any) {
    res.status(400).json({ error: e.message });
  }
});

app.delete("/api/user/delete", async (req, res) => {
  if (!req.user) return res.status(401).json({ error: "Unauthorized" });
  const userId = (req.user as any).id;

  // Note: Deleting collections recursively is not recommended for large collections in client SDKs, 
  // but for a single user it might be okay or we should use a cloud function. 
  // For now, we'll just delete the user doc and let the rest be (or implement a recursive delete helper if needed).
  // A proper implementation would use a Cloud Function to delete all user data.
  
  await db.collection('users').doc(userId).delete();
  
  req.logout(() => {
    res.json({ success: true });
  });
});

app.post("/api/stripe/create-checkout", async (req, res) => {
  if (!req.user) return res.status(401).json({ error: "Unauthorized" });
  const { type, currency = 'usd' } = req.body; // type: 'points' | 'subscription'
  const user = req.user as any;

  const lineItems = type === 'subscription' 
    ? [{ price: process.env.STRIPE_PRICE_ID_PRO, quantity: 1 }]
    : [{
        price_data: {
          currency,
          product_data: { name: "100 MUSAIC Points" },
          unit_amount: currency === 'ils' ? 3500 : 1000, // 35 ILS or 10 USD
        },
        quantity: 1,
      }];

  const session = await stripe.checkout.sessions.create({
    payment_method_types: ['card'],
    line_items: lineItems,
    mode: type === 'subscription' ? 'subscription' : 'payment',
    success_url: `${process.env.APP_URL}?success=true`,
    cancel_url: `${process.env.APP_URL}?canceled=true`,
    customer_email: user.email,
    metadata: {
      userId: user.id,
      points: type === 'points' ? "100" : "0"
    }
  });

  res.json({ url: session.url });
});

// Spotlight Routes
function slugify(text: string): string {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')     // Replace spaces with -
    .replace(/[^\w\-]+/g, '') // Remove all non-word chars
    .replace(/\-\-+/g, '-');  // Replace multiple - with single -
}

app.get("/api/spotlight/check-slug", async (req, res) => {
  const { slug } = req.query;
  if (!slug) return res.status(400).json({ error: "Slug is required" });
  
  const doc = await db.collection('smartlinks').doc(slug as string).get();
  res.json({ available: !doc.exists });
});

app.get("/api/spotlight/me", async (req, res) => {
  if (!req.user) return res.status(401).json({ error: "Unauthorized" });
  const userId = (req.user as any).id;
  
  const snapshot = await db.collection('smartlinks').where('userId', '==', userId).limit(1).get();
  
  if (!snapshot.empty) {
    const linkDoc = snapshot.docs[0];
    const link = linkDoc.data();
    
    // Get top platform
    const clicksSnapshot = await db.collection('smart_link_clicks')
      .where('smartLinkId', '==', linkDoc.id)
      .get();
      
    const platformCounts: Record<string, number> = {};
    clicksSnapshot.forEach(doc => {
      const p = doc.data().platform;
      platformCounts[p] = (platformCounts[p] || 0) + 1;
    });
    
    const topPlatform = Object.entries(platformCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || 'None';
    
    res.json({ id: linkDoc.id, ...link, topPlatform });
  } else {
    res.json(null);
  }
});

app.post("/api/spotlight/view/:slug", async (req, res) => {
  const { slug } = req.params;
  const linkRef = db.collection('smartlinks').doc(slug);
  
  await linkRef.update({ views: FieldValue.increment(1) });
  res.json({ success: true });
});

app.post("/api/spotlight/click/:slug", async (req, res) => {
  const { slug } = req.params;
  const { platform } = req.body;
  
  // Assuming slug is the doc ID for smartlinks
  await db.collection('smart_link_clicks').add({
    smartLinkId: slug,
    platform,
    createdAt: FieldValue.serverTimestamp()
  });
  
  res.json({ success: true });
});

app.get("/api/spotlight/:slug", async (req, res) => {
  const { slug } = req.params;
  const linkDoc = await db.collection('smartlinks').doc(slug).get();
  
  if (!linkDoc.exists || !linkDoc.data()?.isActive) {
    return res.status(404).json({ error: "Spotlight not found" });
  }

  const link = linkDoc.data();

  // Fetch associated assets
  let assets: any[] = [];
  try {
    const assetIds = JSON.parse(link?.selectedAssets || '[]');
    if (assetIds.length > 0) {
      // Firestore 'in' query supports up to 10 values. 
      // If assetIds > 10, we need to batch or fetch individually. 
      // For simplicity assuming < 10 for now or fetch all library items (not efficient).
      // Better: fetch by ID individually or use 'in' batches.
      
      // Let's use Promise.all for individual fetches to avoid 'in' limit issues if list is long
      // though 'in' is better for reads.
      const assetDocs = await Promise.all(assetIds.map((id: string) => db.collection('library').doc(id).get()));
      assets = assetDocs.filter(d => d.exists).map(d => ({ id: d.id, ...d.data() }));
    }
  } catch (e) {
    console.error("Error parsing assets for spotlight:", e);
  }

  res.json({ ...link, assets });
});

app.post("/api/spotlight/save", async (req, res) => {
  if (!req.user) return res.status(401).json({ error: "Unauthorized" });
  const user = req.user as any;
  const userRef = db.collection('users').doc(user.id);

  // Gatekeeping: Restrict access to Pro users
  // Note: The prompt implies tiered access. "Implementing restrictions for paid subscribers"
  // But also "token deduction for new links". 
  // If it's a Pro feature, maybe they don't pay tokens? 
  // The original code checked `if (!user.isPro) return error`.
  // But then it also had cost logic.
  // Let's stick to the original logic: Must be Pro to access Studio? 
  // Wait, the prompt says "Tiered Access & Billing: Implementing restrictions for paid subscribers, token deduction for new links, and free updates for existing links."
  // This implies non-pro might be able to use it but pay tokens? Or Pro users pay tokens?
  // Original code:
  // if (!user.isPro) return 403 "Smart Link Studio is a Pro feature"
  // AND THEN
  // if (!currentLink && user.points < COST) return 402
  // This means ONLY Pro users can use it, AND they must have points for the first link?
  // That seems double-gated.
  // Let's assume the "Pro feature" check was strict. I will keep it.
  
  // Actually, usually "Pro" implies "Subscriber". "Tokens" implies "Pay as you go".
  // Maybe the intention is: Pro users get it for free? Or Pro users get access, but still pay tokens?
  // Let's look at the prompt again: "restrictions for paid subscribers, token deduction for new links".
  // This implies:
  // 1. You might need to be a subscriber to even access it.
  // 2. Creating a NEW link costs tokens (maybe for everyone, or maybe just non-subscribers? But if non-subscribers can't access...).
  // Let's keep the existing logic: Must be Pro to access. New links cost 15 tokens. Updates are free.
  
  // Fetch user fresh data
  const userDoc = await userRef.get();
  const userData = userDoc.data();

  if (!userData?.isPro) {
    return res.status(403).json({ error: "Smart Link Studio is a Pro feature" });
  }

  const { profileName, bio, socialMedia, selectedAssets, theme, buttonStyle, buttonColor, backgroundMotion, slug: requestedSlug, profileImage } = req.body;
  const userId = user.id;
  
  // Check for existing link
  const snapshot = await db.collection('smartlinks').where('userId', '==', userId).limit(1).get();
  let currentLinkDoc = snapshot.empty ? null : snapshot.docs[0];
  let slug = requestedSlug || currentLinkDoc?.id;

  if (!slug) {
    slug = slugify(profileName);
    // Check uniqueness
    let counter = 0;
    let originalSlug = slug;
    while ((await db.collection('smartlinks').doc(slug).get()).exists) {
      counter++;
      slug = `${originalSlug}-${counter}`;
    }
  } else {
    // Check if slug is taken by another user
    const existingDoc = await db.collection('smartlinks').doc(slug).get();
    if (existingDoc.exists && existingDoc.data()?.userId !== userId) {
      return res.status(400).json({ error: "Slug is already taken" });
    }
  }

  const COST = 15;
  
  try {
    await db.runTransaction(async (t) => {
      // Re-fetch user in transaction to ensure points balance is correct
      const tUserDoc = await t.get(userRef);
      const tUserData = tUserDoc.data();

      if (!currentLinkDoc) {
        // New Link
        if ((tUserData?.points || 0) < COST) {
          throw new Error("Insufficient tokens"); // Will be caught and sent as 402 if we handle it
        }
        
        // Deduct points
        t.update(userRef, { points: FieldValue.increment(-COST) });
        t.set(db.collection('transactions').doc(), {
          userId,
          amount: -COST,
          description: "Smart Link Publication",
          createdAt: FieldValue.serverTimestamp()
        });

        // Create Link
        t.set(db.collection('smartlinks').doc(slug), {
          userId,
          slug, // Redundant if doc ID is slug, but good for querying
          profileName,
          bio,
          socialMedia: JSON.stringify(socialMedia),
          selectedAssets: JSON.stringify(selectedAssets),
          theme,
          buttonStyle,
          buttonColor,
          backgroundMotion: backgroundMotion ? true : false,
          isActive: true,
          views: 0,
          profileImage,
          createdAt: FieldValue.serverTimestamp()
        });
      } else {
        // Update Link (Free)
        if (slug !== currentLinkDoc.id) {
           // Slug changed
           // Check availability again (already done above)
           
           // Create new doc
           t.set(db.collection('smartlinks').doc(slug), {
             ...currentLinkDoc.data(),
             slug,
             profileName,
             bio,
             socialMedia: JSON.stringify(socialMedia),
             selectedAssets: JSON.stringify(selectedAssets),
             theme,
             buttonStyle,
             buttonColor,
             backgroundMotion: backgroundMotion ? true : false,
             profileImage,
           });
           
           // Delete old doc
           t.delete(currentLinkDoc.ref);
        } else {
           // Same slug, just update
           t.update(currentLinkDoc.ref, {
             profileName,
             bio,
             socialMedia: JSON.stringify(socialMedia),
             selectedAssets: JSON.stringify(selectedAssets),
             theme,
             buttonStyle,
             buttonColor,
             backgroundMotion: backgroundMotion ? true : false,
             profileImage,
           });
        }
      }
    });
    
    res.json({ success: true, slug });
  } catch (e: any) {
    if (e.message === "Insufficient tokens") {
      return res.status(402).json({ error: "Insufficient tokens", required: COST, current: userData?.points });
    }
    res.status(500).json({ error: e.message });
  }
});

// Vite Middleware
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, "dist")));
    app.get("*", (req, res) => {
      res.sendFile(path.join(__dirname, "dist", "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
