
# Deploying to Existing GCP Project

Yes, you can reuse an existing project! Here is how to keep everything separate:

## 1. Firebase / Firestore Separation

By default, a GCP project shares one Firestore database. To keep data separate:

**Option A (Recommended): Use a Named Database**
1. Go to Firebase Console > Firestore Data.
2. Click the specific database dropdown (usually it says `(default)`) -> "Create database".
3. Name it `harvard-poll-db` (or similar).
4. Update your `.env.local` to include:
   ```bash
   NEXT_PUBLIC_FIREBASE_DATABASE_ID=harvard-poll-db
   ```
   *Note: If you skip this, it will use the `(default)` database, which is shared with other apps.*

**Option B: Shared DB**
If you don't create a named database, data will live in the `(default)` database. 
- Collections `sessions`, `responses`, `users` will be created.
- Ensure these don't conflict with your existing app's collections.

## 2. Cloud Run Separation

We use a specific **Service Name** (`harvard-poll-platform`) to avoid overwriting your existing services.

To deploy:
1. Ensure you have the `gcloud` CLI installed and authenticated to your project.
2. Run the included deploy script (requires your `.env.local` vars to be loaded or passed):

```bash
# Load env vars first (Mac/Linux)
export $(grep -v '^#' .env.local | xargs)

# Run deploy script
./deploy.sh
```

This script builds the container and deploys it to Cloud Run as a **new service** called `harvard-poll-platform`. It won't touch your existing Cloud Run services.

## 3. Authentication (Important)

**Firebase Auth is Global**: Users are shared across the ENTIRE project.
- If User A exists in your old app, they can log in here with the same credentials.
- **Anonymous Users**: Safe to use; they are just unique IDs.
- **Professor Login**: If you use Email/Pass, just be aware it's the same user pool.

## 4. Vertex AI

We use the project's Vertex AI quota. No extra setup needed besides enabling the API in your existing project.
