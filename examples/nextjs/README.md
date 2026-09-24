# @studymind/react — Next.js example

Tests `StudyMindPanel` against a real StudyMind API without publishing to npm.

```bash
cp .env.local.example .env.local   # add your sm_live_ key (server-side only)
npm install                         # installs the package from ../.. (its dist/)
npm run dev                         # http://localhost:3000/demo
```

After changing the package source, run `npm run example:install` from the repo root. It rebuilds
the package and reinstalls it here. `.npmrc` sets `install-links=true`, so the package is copied
rather than symlinked (a symlink would load the repo root's React and break hooks), and npm won't
refresh that copy while the version number is unchanged — the script removes it first.
`npm run example:build` does the same and then builds the app.

## How it works

1. `app/api/studymind-session/route.ts` exchanges `STUDYMIND_API_KEY` for a short-lived
   session token on the server (`POST /api/v1/auth/session`). The API key never reaches the browser.
2. `app/demo/page.tsx` fetches that token and renders `<StudyMindPanel sessionToken=… />`.
3. The panel checks the course status, indexes the course content if needed, then enables
   the AI Tutor, Quiz, Flashcards and Summary tabs.

The session route takes `userId` from the request body to keep the demo simple — in a real app,
take the user from your own auth session instead.
