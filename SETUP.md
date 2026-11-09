# LLYD Bot — Supabase integration

## 1. Install the Supabase SDK
Run from the project root:
```bash
npm install @supabase/supabase-js
```

## 2. Configure environment variables
Copy `.env.example` to `.env`, then fill in:
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY` (or the project's publishable key)

Do not put a service-role/secret key in a Vite `VITE_` variable.

## 3. Enable anonymous authentication
In Supabase Dashboard:
Authentication → Sign In / Providers (or Sign-In Methods) → Anonymous Sign-Ins → Enable.

This implementation uses a persistent anonymous Supabase account per browser profile.
If you need named accounts and cross-device history, add email/password or OAuth authentication.

## 4. Run the SQL
Run the database SQL previously supplied in the Supabase SQL Editor. It must create:
- `conversations`
- `messages`
- `developer_info`

The `messages.role` check must allow `user`, `assistant`, and `bot`. The supplied SQL does.

## 5. Replace project files
Copy the files in this folder into the matching `src/` paths in your project.
Also replace `src/services/chatService.js` with the included version. This update is required because loading developer information from Supabase is asynchronous.

## 6. Run and test
```bash
npm run dev
```
Send a message, refresh the page, and confirm the conversation remains.

## Developer mode security note
The original app's `window.prompt()` check is not secure: browser code cannot protect a secret.
This version intentionally disables passcode verification rather than embedding a password in the frontend. Do not open developer information insertion to everyone in a production app. To enable it safely, create a Supabase Edge Function that verifies a server-side secret and then grants a developer role / inserts approved information. The RLS policy should check a trusted `auth.jwt()` app_metadata claim for developer authorization.
