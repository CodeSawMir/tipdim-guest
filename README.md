# Tip Dim guest ordering

The page a guest opens by scanning a table QR code: menu, order, "order sent". Static, about 7 KB gzipped, no app
download. It talks to the same Supabase project as the app through two functions, `guest_menu()` and
`place_guest_order()`, with the public anon key.

```sh
cd tipdim-guest
npm install
cp .env.example .env   # fill in the project URL and anon key
npm run dev            # open http://localhost:4321/?t=<qr_token of a table>
npm run build          # static files in dist/
```

Table QR codes link to `<address>/t/<qr_token>`. Any static host works; `public/_redirects` (Netlify, Cloudflare
Pages) and `vercel.json` send `/t/*` to the one page. The address is decision D-31.

The cafe's menu-only QR links to `<address>/m/<menu_token>`: the same menu with photos, no table and no ordering,
read through `public_menu()`. The owner finds it in the app under Settings → Menu QR code. The token is made by the
server (`restaurants.menu_token`) and syncs down to the owner's phones.

The owner turns ordering on in the app: Settings → QR ordering.

## Shared code

`src/shared/` (money, numerals, UUIDv7 ids) is copied from the Tip Dim app's domain code so this page builds on its
own and shows money and Devanagari digits exactly as the app does. If the app's versions change, copy them again.

## Deploying

Pushing to `main` deploys to Vercel. Set `PUBLIC_SUPABASE_URL` and `PUBLIC_SUPABASE_ANON_KEY` in the Vercel project's
environment variables (the anon key is public by design).
