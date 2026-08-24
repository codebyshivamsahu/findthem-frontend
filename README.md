# Find Them India — Frontend

Next.js 14 (pages router) + Tailwind + Zustand client for the Find Them India
missing persons platform.

> Find Them India is an independent community project. It is **not** operated by,
> or affiliated with, any government body or police force.

## Setup

```bash
npm ci
cp .env.example .env.local     # set NEXT_PUBLIC_API_URL
npm run dev                    # http://localhost:3000
```

The API must be running separately (see the backend repo).

## Environment

| Variable | Required | Purpose |
|---|---|---|
| `NEXT_PUBLIC_API_URL` | yes | Backend base URL |
| `NEXT_PUBLIC_FACE_API_URL` | no | Face similarity service; the sighting form works without it |

Both are public by definition — they ship to the browser. Never put a secret in a
`NEXT_PUBLIC_*` variable.

## Things to know before changing features

- **Signup only offers volunteer and NGO.** Police and admin accounts are granted
  server-side after verification, and the API ignores any role the client sends —
  adding those options back to the form would do nothing.
- **Sightings are never verified in the browser.** The face service returns a
  photo *similarity* score used only to pick which case a report attaches to. The
  UI must not call anything "verified" or "matched" — a police/admin reviewer
  decides, and only then is the family notified.
- **The age filter is not age progression.** It is a canvas filter and is labelled
  as such. Don't present it as a forensic likeness.
- **Contact details only render for signed-in users**, because the API omits them
  for anonymous callers. A blank phone number on a public page is expected.

## Scripts

| Command | Does |
|---|---|
| `npm run dev` | dev server |
| `npm run build` / `npm start` | production build and serve |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run lint` | Next ESLint |
