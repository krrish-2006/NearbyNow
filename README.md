# NearbyNow

NearbyNow is a local marketplace app where buyers discover products from nearby shops and sellers manage their shop listings. The current MVP focuses on Durgapur, with other cities shown as coming soon.

## Tech Stack

- Next.js App Router
- React
- TypeScript
- Tailwind CSS
- Supabase Auth
- Supabase PostgreSQL
- Supabase Storage
- Server Actions
- Zod
- React Hook Form

## Main Features

- Buyer marketplace homepage
- Product search, AI semantic search, and category filtering
- Product detail pages
- City selector
- Add to cart
- Direct Buy Now checkout
- COD order flow
- Stock tracking and stock decrement after orders
- Buyer order history
- Seller portal
- Seller product create/edit/delete
- Product image upload
- Seller order view

## Local Setup

Install dependencies:

```bash
npm install
```

Create local environment variables:

```bash
copy .env.example .env.local
```

Fill in the Supabase values in `.env.local`.

Optional AI search values:

```bash
HUGGINGFACE_API_KEY=
HUGGINGFACE_EMBEDDING_MODEL=intfloat/multilingual-e5-small
```

After the AI search migration is applied and `HUGGINGFACE_API_KEY` is set, backfill existing product embeddings:

```bash
npm run search:backfill
```

Run the dev server:

```bash
npm run dev
```

Open:

```txt
http://localhost:3000
```

## Verification Commands

```bash
npx tsc --noEmit
npm run lint
npm run build
```

On Windows, `npm run build` can require permission outside restricted sandboxes because Next.js spawns worker processes.

## Supabase Commands

Check migration state:

```bash
npx supabase migration list
```

Push migrations:

```bash
npx supabase db push
```

Migration filenames must use the Supabase timestamp format:

```txt
YYYYMMDDHHMMSS_name.sql
```

## Project Context

For AI/Codex handoff, read:

- `PROJECT_CONTEXT.md`
- `NEXT_TASKS.md`
- `docs/architecture.md`
- `docs/database.md`
- `docs/flows.md`

Start new Codex sessions by asking it to read `PROJECT_CONTEXT.md` before editing.
