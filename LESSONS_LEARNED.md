# Lessons Learned & "Gotchas" Log

This document serves as a repository of mistakes made and lessons learned during the development of the Harvard Poll Platform. Review this before starting similar features or deployments.

## 1. Deployment vs. Version Control
**The Mistake:** Assuming that `git push` updates the live site.
**The Reality:** We are using Google Cloud Run. Pushing code to GitHub does *not* automatically trigger a new deployment unless a CI/CD trigger is explicitly set up (which wasn't the default in our manual workflow).
**The Fix:** Always run the deployment script (`./deploy.sh` or `gcloud run deploy`) to update the actual running service.
**Lesson:** Differentiate between "saving code" (Git) and "shipping code" (Deploy).

## 2. Environment Variables in Cloud Run
**The Mistake:** Features working locally (like AI Synthesis) failing in production with "API Key missing" errors.
**The Reality:** Local `.env.local` files differ from Cloud Run environment configurations. Variables defined locally are not automatically "lifted" to the cloud container.
**The Fix:** Explicitly pass variables during the build/deploy step using `--set-env-vars` flags in the `gcloud` command.
```bash
gcloud run deploy ... --set-env-vars NEXT_PUBLIC_FIREBASE_API_KEY=...
```
**Lesson:** "It works on my machine" is usually an environment variable issue.

## 3. Hydration Errors & Browser Extensions
**The Mistake:** Users seeing scary red error screens ("Hydration failed") even though the app seemed to work.
**The Reality:** Browser extensions (like password managers or "Jetski") often inject custom attributes (e.g., `data-extension-id`) into the `<html>` or `<body>` tags. Next.js creates HTML on the server, sees different HTML in the browser, and panics.
**The Fix:** Add `suppressHydrationWarning` to the `<html>` tag in `layout.tsx`.
**Lesson:** We cannot control the user's browser plugins. Validating the exact byte-match of the HTML body is fragile; React suppression is the standard workaround.

## 4. "Harvard Minimalist" Aesthetics
**The Mistake:** Using default spacing and slightly misaligned text.
**The Reality:** In a minimalist design, *every pixel matters*. Misalignment that is invisible in a busy UI becomes a glaring error in a clean interface.
**The Fix:** 
-   Manually syncing padding (`px-6`) between the navbar and hero section.
-   Tightening letter spacing (`tracking-tight`) on large serif headers to mimic print typography.
**Lesson:** Minimalism requires *more* attention to detail, not less.

## 5. Defensive AI Prompting
**The Mistake:** Asking the AI to "analyze this" and getting back paragraphs of text when we needed JSON.
**The Reality:** Large Language Models (LLMs) are chatty. If you don't constrain them, they will write an essay.
**The Fix:**
-   Explicitly defining the JSON schema in the prompt.
-   Adding instructions like "Return ONLY valid JSON" and "Do not include markdown formatting."
-   Adding error handling in the API route to catch malformed JSON responses.
**Lesson:** Treat AI not as a magic box, but as a function call that needs strict type validation.

## 6. Authentication Flows
**The Mistake:** Overcomplicating student access.
**The Reality:** Students in a lecture hall don't want to "Sign Up" or "Verify Email." They want to answer the poll *now*.
**The Fix:** Using anonymous/ephemeral sessions for students (`signInAnonymously`) while keeping strict email/password auth for Professors.
**Lesson:** Match the friction of the auth flow to the user's context (High friction for storage/admin, Zero friction for participation).
