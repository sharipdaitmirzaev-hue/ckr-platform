/**
 * Применяет seed пилота ООО ТИНДА через локальный API.
 *
 * Usage:
 *   PILOT_SEED_SECRET=... npm run seed:tinda
 *   DEMO_SEED_SECRET=... npm run seed:tinda
 *   PILOT_SEED_SECRET=... SITE_URL=http://localhost:3000 npm run seed:tinda
 */

const secret =
  process.env.PILOT_SEED_SECRET || process.env.DEMO_SEED_SECRET;
const base = (
  process.env.SITE_URL ||
  process.env.NEXT_PUBLIC_SITE_URL ||
  "http://localhost:3000"
).replace(/\/$/, "");

if (!secret) {
  console.error("Задайте PILOT_SEED_SECRET или DEMO_SEED_SECRET");
  process.exit(1);
}

const res = await fetch(`${base}/api/pilot/tinda-seed`, {
  method: "POST",
  headers: {
    "x-pilot-seed-secret": secret,
  },
});

const body = await res.json();
console.log(JSON.stringify(body, null, 2));
process.exit(body.ok ? 0 : 1);
