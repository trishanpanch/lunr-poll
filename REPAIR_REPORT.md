# 🚨 Critical Fix: Enable Analytics Data

The analytics page crash you experienced is caused by **missing permissions** in your Firestore database.
Because we switched to a secure Cloud Firestore setup, we must explicitly allow the Professor to read the student responses.

Currently, your database is likely blocking the read request, returning `undefined`, which causes the charts to crash.

## ✅ Step 1: Frontend Patch (Already Deployed)
I have just deployed a new version of the website that:
1.  **Prevents Crashes**: Replaced the chart logic to gracefully handle empty/missing data instead of showing a white screen error.
2.  **Shows Permissions Status**: If data is missing (due to permissions), it will now simply say "Waiting for responses" instead of crashing.

## ⚠️ Step 2: Update Firestore Rules (REQUIRED)
You must update your database rules to allow the Professor to see the responses.

1.  Go to the **[Firebase Console](https://console.firebase.google.com/)**.
2.  Navigate to **Firestore Database** > **Rules**.
3.  **Delete everything** there and **Paste** the following rules:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // Users: Users can read/write their own profile
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }

    // Sessions:
    match /sessions/{sessionId} {
      // Public read allowed so students can join by code
      allow read: if true;
      
      // Only professors (non-anonymous) can create
      allow create: if request.auth != null && request.auth.token.firebase.sign_in_provider != 'anonymous';
      
      // Only the owner can update (close/open) or delete
      allow update, delete: if request.auth != null && request.auth.uid == resource.data.ownerId;

      // Responses Subcollection
      match /responses/{responseId} {
        // Students (anyone) can write a response
        allow create: if true;
        
        // 🔒 SECURE READ: Only the Professor (Owner of the session) can read responses
        // This checks if the user requesting the data matches the 'ownerId' of the session
        allow read, list: if request.auth != null && 
                          request.auth.uid == get(/databases/$(database)/documents/sessions/$(sessionId)).data.ownerId;
      }
    }
  }
}
```

4.  Click **Publish**.

### Why this works
These rules grant the "read" permission specifically to the **Owner** of the session. Without this, the database (by default) blocks all reads to protect student privacy.

Once you publish these rules, reload the dashboard, and the analytics charts will appear! 📊
