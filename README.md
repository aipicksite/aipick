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

## এই স্ক্যাফোল্ডে যা আছে (Phase 1 শুরু)
- Homepage (top tools + category list)
- Tool detail page (`/tool/[slug]`) — SEO metadata সহ
- Category page (`/category/[slug]`)
- Supabase client (server + browser)
- TypeScript types

## এখনো বাকি (পরের ধাপ)
- Search page + filter UI
- `/top/[slug]` ranking pages
- `/compare/[a]-vs-[b]` pages
- Voting UI (upvote/downvote button + auth)
- Admin panel (tool add/edit)
- ডিজাইন পলিশ (এখন শুধু কার্যকরী, বেসিক Tailwind স্টাইল)
