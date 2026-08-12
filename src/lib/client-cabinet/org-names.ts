import { createClient } from "@/lib/supabase/server";

export async function orgNameMap(organizationIds: string[]) {
  const ids = [...new Set(organizationIds.filter(Boolean))];
  if (!ids.length) return new Map<string, string>();
  const supabase = createClient();
  const { data } = await supabase
    .from("organizations")
    .select("id, name")
    .in("id", ids);
  const map = new Map<string, string>();
  for (const row of data || []) {
    const id = (row as { id?: string }).id;
    const name = (row as { name?: string }).name;
    if (id && name) map.set(id, name);
  }
  return map;
}
