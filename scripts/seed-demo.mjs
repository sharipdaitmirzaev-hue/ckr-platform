/**
 * Применяет demo seed через локальный API.
 * Требует: npm run dev (или start) + DEMO_SEED_SECRET в env.
 *
 * Usage:
 *   DEMO_SEED_SECRET=... npm run seed:demo
 *   DEMO_SEED_SECRET=... SITE_URL=http://localhost:3000 npm run seed:demo
 */

const secret = process.env.DEMO_SEED_SECRET;
const base = (process.env.SITE_URL || process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000").replace(/\/$/, "");

if (!secret) {
  console.error("Задайте DEMO_SEED_SECRET");
  process.exit(1);
}

const res = await fetch(`${base}/api/demo/seed`, {
  method: "POST",
  headers: {
    "x-demo-seed-secret": secret,
  },
});

const body = await res.json();
console.log(JSON.stringify(body, null, 2));
process.exit(body.ok ? 0 : 1);
