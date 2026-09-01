# AIPick.site — Next.js Project

## Setup

1. `npm install`
2. Supabase প্রজেক্ট বানাও, তারপর SQL Editor-এ `supabase/001_init_schema.sql` রান করো (আলাদা জিপে দেওয়া আছে)
3. `.env.example` কে `.env.local` নামে কপি করে Supabase URL + anon key বসাও
4. `npm run dev`

## Deploy

- GitHub-এ push/drag-drop করো (এই ফোল্ডারের সব ফাইল, root-এ)
- Vercel-এ ইমপোর্ট করো, Environment Variables-এ `NEXT_PUBLIC_SUPABASE_URL` ও `NEXT_PUBLIC_SUPABASE_ANON_KEY` বসাও
- Deploy

## এই স্ক্যাফোল্ডে যা আছে (Phase 1)
- Homepage (rank-list top tools + category chips) — ডিজাইন পলিশ করা
- Tool detail page (`/tool/[slug]`) — SEO metadata + voting সহ
- Category page (`/category/[slug]`)
- **Voting (upvote/downvote)**: `/api/vote` route, `VoteButton` component, toggle/switch লজিক, optimistic UI
- Auth: passwordless magic-link login (`/login`), Supabase email OTP, `/auth/callback` handler
- `middleware.ts` — auth session cookie রিফ্রেশ করে (Server Component-এ user পড়ার জন্য দরকার)
- Supabase client (server + browser)
- TypeScript types

## Supabase Dashboard-এ একটা সেটিং লাগবে ভোটিং কাজ করার জন্য
Authentication → Providers → Email → **Enable "Confirm email"** অফ রাখলে magic link সরাসরি কাজ করবে (অথবা রেখে দিতে পারো, Supabase নিজে থেকেই ইমেইল ভেরিফাই করে নেবে ক্লিক করলে)।
Authentication → URL Configuration-এ `Site URL` এবং `Redirect URLs`-এ তোমার Vercel ডোমেইন (এবং `http://localhost:3000` ডেভের জন্য) যোগ করতে হবে — নাহলে magic link কাজ করবে না।

- **Search & filter**: `/tools` page — full-text search (Postgres `search_vector`), category sidebar filter, pricing-type filter, all URL-based (shareable/bookmarkable links)

- **Admin panel** (`/admin`) — tool list, add (`/admin/tools/new`), edit/delete (`/admin/tools/[id]/edit`); protected by `admin_users` table (see setup below)

## Admin অ্যাক্সেস দেওয়া
1. প্রথমে সাইটে normal login (`/login`) দিয়ে নিজের ইমেইল দিয়ে একবার সাইন-ইন করো (এটা `profiles`-এ একটা রো বানাবে)
2. Supabase → Table Editor → `admin_users` টেবিলে নিজের ইমেইল দিয়ে একটা রো যোগ করো
3. এরপর `/admin`-এ গেলে অ্যাক্সেস পাবা — অন্য কেউ গেলে `/admin/denied`-এ redirect হবে

- **Ranking pages** (`/top/[slug]`) — `/top/ai-writing` style pulls top tools from a matching category automatically; also two special pages: `/top/best-free-ai-tools` and `/top/trending-ai-tools`
- **Comparison pages** (`/compare/[slug]`) — reads from the `comparisons` table (see below for how to add one)

## Comparison পেজ যোগ করা
`comparisons` টেবিলে এখনো কোনো admin UI নেই (Phase 2-এ যোগ হবে) — আপাতত Supabase Table Editor থেকে ম্যানুয়ালি একটা রো অ্যাড করো:
- `slug`: যেমন `chatgpt-vs-claude` (এটাই URL হবে: `/compare/chatgpt-vs-claude`)
- `tool_a_id`, `tool_b_id`: দুটো টুলের UUID (tools টেবিল থেকে কপি করো)
- `intro_text`: ঐচ্ছিক, ১-২ লাইন ভূমিকা

## এখনো বাকি (Phase 2+)
Phase 1-এর মূল স্কোপ এখানেই শেষ। বাকিটা Phase 2 (reviews, submission form, user lists) — Phase 1 প্ল্যান ডকুমেন্টে বিস্তারিত আছে।
