/**
 * HOTFIX — organization create RLS tests.
 *
 * Covers:
 * - migration contracts (SELECT creator, is_org_creator, atomic RPC)
 * - role model (owner via existing organization_member_role)
 * - live production/staging RLS when SUPABASE_* env is present
 *
 * Run: npx tsx scripts/test-org-create-rls-hotfix.ts
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { canManageOrganization } from "../src/config/partners";

const MIG = resolve(
  "supabase/migrations/20260812150000_hotfix_org_create_rls.sql",
);

let passed = 0;
let failed = 0;

async function test(name: string, fn: () => void | Promise<void>) {
  try {
    await fn();
    passed += 1;
    console.log(`PASS  ${name}`);
  } catch (e) {
    failed += 1;
    console.error(`FAIL  ${name}`);
    console.error(e instanceof Error ? e.stack : e);
  }
}

function loadEnvFromOptionalFiles() {
  for (const p of ["/etc/ckr/ckr.env", ".env.local", ".env"]) {
    try {
      const raw = readFileSync(p, "utf8");
      for (const line of raw.split("\n")) {
        const t = line.trim();
        if (!t || t.startsWith("#") || !t.includes("=")) continue;
        const i = t.indexOf("=");
        const k = t.slice(0, i);
        let v = t.slice(i + 1).trim();
        if (
          (v.startsWith('"') && v.endsWith('"')) ||
          (v.startsWith("'") && v.endsWith("'"))
        ) {
          v = v.slice(1, -1);
        }
        if (!process.env[k]) process.env[k] = v;
      }
    } catch {
      /* optional */
    }
  }
}

function migrationSql(): string {
  return readFileSync(MIG, "utf8");
}

async function main() {
  await test("migration allows created_by on organizations_select", () => {
    const sql = migrationSql();
    assert.match(sql, /create policy "organizations_select"/i);
    assert.match(sql, /created_by\s*=\s*auth\.uid\(\)/i);
    assert.match(sql, /is_org_member\(id,\s*auth\.uid\(\)\)/i);
    assert.doesNotMatch(
      sql,
      /alter table public\.organizations disable row level security/i,
    );
  });

  await test("migration adds is_org_creator SECURITY DEFINER", () => {
    const sql = migrationSql();
    assert.match(sql, /create or replace function public\.is_org_creator/i);
    assert.match(sql, /security definer/i);
    assert.match(sql, /organization_members_insert/i);
    assert.match(sql, /is_org_creator\(organization_id,\s*auth\.uid\(\)\)/i);
  });

  await test("migration RPC forces created_by = auth.uid()", () => {
    const sql = migrationSql();
    assert.match(
      sql,
      /create or replace function public\.create_organization_with_owner/i,
    );
    assert.match(sql, /v_uid uuid := auth\.uid\(\)/i);
    assert.match(sql, /created_by,\s*\n\s*verification_status/i);
    assert.match(sql, /v_uid,\s*-- force owner\/creator/i);
    assert.match(sql, /role = 'owner'|values \(v_org_id, v_uid, 'owner'\)/i);
    assert.match(sql, /interval '2 minutes'/i);
    assert.match(sql, /pg_advisory_xact_lock/i);
    assert.match(sql, /grant execute[\s\S]*to authenticated/i);
  });

  await test("existing role model: owner can manage", () => {
    assert.equal(canManageOrganization("owner"), true);
    assert.equal(canManageOrganization("manager"), true);
    assert.equal(canManageOrganization("employee"), false);
  });

  loadEnvFromOptionalFiles();
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const serviceKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY?.trim() ||
    process.env.SUPABASE_SECRET_KEY?.trim();
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();
  const live = Boolean(url && serviceKey && anonKey && process.env.CKR_RLS_LIVE === "1");

  if (!live) {
    await test("live RLS skipped (set CKR_RLS_LIVE=1 + Supabase env)", () => {
      assert.ok(true);
    });
  } else {
    const admin = createClient(url!, serviceKey!, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const anon = createClient(url!, anonKey!, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    const suffix = Math.random().toString(16).slice(2, 10);
    const emailA = `org-rls-a-${suffix}@example.com`;
    const emailB = `org-rls-b-${suffix}@example.com`;
    const password = `TestPass_${suffix}_Xx`;

    const created: string[] = [];
    let userA: string | null = null;
    let userB: string | null = null;
    let clientA: SupabaseClient | null = null;
    let clientB: SupabaseClient | null = null;

    try {
      const a = await admin.auth.admin.createUser({
        email: emailA,
        password,
        email_confirm: true,
        user_metadata: { full_name: "Org RLS A" },
      });
      assert.ok(a.data.user?.id, a.error?.message);
      userA = a.data.user!.id;

      const b = await admin.auth.admin.createUser({
        email: emailB,
        password,
        email_confirm: true,
        user_metadata: { full_name: "Org RLS B" },
      });
      assert.ok(b.data.user?.id, b.error?.message);
      userB = b.data.user!.id;

      const loginA = await anon.auth.signInWithPassword({
        email: emailA,
        password,
      });
      assert.ok(loginA.data.session?.access_token, loginA.error?.message);
      clientA = createClient(url!, anonKey!, {
        global: {
          headers: {
            Authorization: `Bearer ${loginA.data.session!.access_token}`,
          },
        },
        auth: { persistSession: false, autoRefreshToken: false },
      });

      const loginB = await anon.auth.signInWithPassword({
        email: emailB,
        password,
      });
      assert.ok(loginB.data.session?.access_token, loginB.error?.message);
      clientB = createClient(url!, anonKey!, {
        global: {
          headers: {
            Authorization: `Bearer ${loginB.data.session!.access_token}`,
          },
        },
        auth: { persistSession: false, autoRefreshToken: false },
      });

      await test("anon cannot create organization", async () => {
        const { error } = await anon.rpc("create_organization_with_owner", {
          p_name: `Anon Blocked ${suffix}`,
          p_type: "company",
        });
        assert.ok(error, "anon must be denied");
      });

      await test("authenticated user can create", async () => {
        const { data, error } = await clientA!.rpc(
          "create_organization_with_owner",
          {
            p_name: `Acme Hotfix ${suffix}`,
            p_type: "company",
            p_description: "rls test",
            p_website: "https://example.com",
            p_region: "Dagestan",
            p_city: "Makhachkala",
          },
        );
        assert.ifError(error);
        assert.equal(typeof data, "string");
        created.push(data as string);
      });

      await test("organization membership created as owner", async () => {
        const orgId = created[0]!;
        const { data, error } = await admin
          .from("organization_members")
          .select("user_id, role")
          .eq("organization_id", orgId);
        assert.ifError(error);
        assert.equal(data?.length, 1);
        assert.equal(data![0].user_id, userA);
        assert.equal(data![0].role, "owner");

        const { data: org } = await admin
          .from("organizations")
          .select("created_by, verification_status")
          .eq("id", orgId)
          .single();
        assert.equal(org?.created_by, userA);
        assert.equal(org?.verification_status, "unverified");
      });

      await test("user A cannot create as user B (created_by spoof blocked)", async () => {
        // Direct insert with foreign created_by must fail WITH CHECK
        const { error } = await clientA!
          .from("organizations")
          .insert({
            name: `Spoof ${suffix}`,
            type: "company",
            created_by: userB,
            verification_status: "unverified",
          })
          .select("id")
          .single();
        assert.ok(error, "spoof created_by must fail");
        assert.match(error!.message, /row-level security|policy/i);
      });

      await test("owner can update own organization", async () => {
        const orgId = created[0]!;
        const { data, error } = await clientA!
          .from("organizations")
          .update({ description: "updated by owner" })
          .eq("id", orgId)
          .select("id, description")
          .single();
        assert.ifError(error);
        assert.equal(data?.description, "updated by owner");
      });

      await test("unrelated user cannot update / cannot read unverified", async () => {
        const orgId = created[0]!;
        const { data: visible } = await clientB!
          .from("organizations")
          .select("id")
          .eq("id", orgId);
        assert.equal((visible ?? []).length, 0);

        const { data: updated, error } = await clientB!
          .from("organizations")
          .update({ description: "hacked" })
          .eq("id", orgId)
          .select("id");
        // RLS: 0 rows updated, no error typically
        assert.equal((updated ?? []).length, 0);
        void error;
      });

      await test("duplicate submit reuses same org (idempotent window)", async () => {
        const { data: first } = await clientA!.rpc(
          "create_organization_with_owner",
          {
            p_name: `Dup Org ${suffix}`,
            p_type: "company",
          },
        );
        created.push(first as string);
        const { data: second, error } = await clientA!.rpc(
          "create_organization_with_owner",
          {
            p_name: `Dup Org ${suffix}`,
            p_type: "company",
          },
        );
        assert.ifError(error);
        assert.equal(second, first);
      });

      await test("RLS isolation: B cannot read A membership", async () => {
        const orgId = created[0]!;
        const { data } = await clientB!
          .from("organization_members")
          .select("user_id")
          .eq("organization_id", orgId);
        assert.equal((data ?? []).length, 0);
      });
    } finally {
      if (created.length) {
        await admin
          .from("organization_members")
          .delete()
          .in("organization_id", created);
        await admin.from("organizations").delete().in("id", created);
      }
      if (userA) await admin.auth.admin.deleteUser(userA);
      if (userB) await admin.auth.admin.deleteUser(userB);
    }
  }

  console.log(`\n${passed} passed, ${failed} failed`);
  if (failed) process.exit(1);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
