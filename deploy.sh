# Configuration
SERVICE_NAME="harvard-poll-platform"
REGION="us-central1"
# Default to bline-v2 if not set
PROJECT_ID=${NEXT_PUBLIC_FIREBASE_PROJECT_ID:-"bline-v2"}

# Load environment variables from .env.local if present
if [ -f .env.local ]; then
    echo "Loading environment variables from .env.local..."
    set -a # automatically export all variables
    source .env.local
    set +a
fi

# Exit on error
set -e

# 1. Build and Push Container
echo "Building container for project $PROJECT_ID..."
gcloud builds submit --config cloudbuild.yaml . --project $PROJECT_ID \
  --substitutions=_SERVICE_NAME=$SERVICE_NAME,_NEXT_PUBLIC_FIREBASE_API_KEY=$NEXT_PUBLIC_FIREBASE_API_KEY,_NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=$NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,_NEXT_PUBLIC_FIREBASE_PROJECT_ID=$NEXT_PUBLIC_FIREBASE_PROJECT_ID,_NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=$NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,_NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=$NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,_NEXT_PUBLIC_FIREBASE_APP_ID=$NEXT_PUBLIC_FIREBASE_APP_ID,_NEXT_PUBLIC_FIREBASE_DATABASE_ID=${NEXT_PUBLIC_FIREBASE_DATABASE_ID:-"(default)"}

# 2. Deploy to Cloud Run
echo "Deploying to Cloud Run Service: $SERVICE_NAME"
gcloud run deploy $SERVICE_NAME \
  --image gcr.io/$PROJECT_ID/$SERVICE_NAME \
  --project $PROJECT_ID \
  --region $REGION \
  --platform managed \
  --allow-unauthenticated \
  --set-env-vars NEXT_PUBLIC_FIREBASE_API_KEY=$NEXT_PUBLIC_FIREBASE_API_KEY \
  --set-env-vars NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=$NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN \
  --set-env-vars NEXT_PUBLIC_FIREBASE_PROJECT_ID=$NEXT_PUBLIC_FIREBASE_PROJECT_ID \
  --set-env-vars NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=$NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET \
  --set-env-vars NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=$NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID \
  --set-env-vars NEXT_PUBLIC_FIREBASE_APP_ID=$NEXT_PUBLIC_FIREBASE_APP_ID \
  --set-env-vars NEXT_PUBLIC_FIREBASE_DATABASE_ID=${NEXT_PUBLIC_FIREBASE_DATABASE_ID:-"(default)"} \
  --set-env-vars FIREBASE_DATABASE_ID=${NEXT_PUBLIC_FIREBASE_DATABASE_ID:-"(default)"}

echo "Deployment Complete!"
echo "Your service is live. Check the URL above."
