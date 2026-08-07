import {
  mapCrmActivityRow,
  mapCrmContactRow,
  mapLeadRow,
} from "@/lib/crm/mappers";
import { hasSupabaseEnv } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/server";
import type { CrmActivity, CrmContact, CrmLead } from "@/types";
import type { CrmActivityRow, CrmContactRow, LeadRow } from "@/types/database";

export async function listCrmContacts(limit = 100): Promise<CrmContact[]> {
  if (!hasSupabaseEnv()) return [];
  try {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("crm_contacts")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(limit);
    if (error || !data) return [];
    return (data as CrmContactRow[]).map(mapCrmContactRow);
  } catch {
    return [];
  }
}

export async function getCrmContactById(
  id: string,
): Promise<CrmContact | null> {
  if (!hasSupabaseEnv() || !id) return null;
  try {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("crm_contacts")
      .select("*")
      .eq("id", id)
      .maybeSingle();
    if (error || !data) return null;
    return mapCrmContactRow(data as CrmContactRow);
  } catch {
    return null;
  }
}

export async function listCrmLeads(limit = 100): Promise<CrmLead[]> {
  if (!hasSupabaseEnv()) return [];
  try {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("leads")
      .select("*, crm_contacts(name, email)")
      .order("created_at", { ascending: false })
      .limit(limit);
    if (error || !data) return [];
    return data.map((row) => {
      const lead = row as LeadRow & {
        crm_contacts?: { name: string; email: string } | null;
      };
      return mapLeadRow(lead, {
        contactName: lead.crm_contacts?.name,
        contactEmail: lead.crm_contacts?.email,
      });
    });
  } catch {
    return [];
  }
}

export async function getCrmLeadById(id: string): Promise<CrmLead | null> {
  if (!hasSupabaseEnv() || !id) return null;
  try {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("leads")
      .select("*, crm_contacts(name, email)")
      .eq("id", id)
      .maybeSingle();
    if (error || !data) return null;
    const lead = data as LeadRow & {
      crm_contacts?: { name: string; email: string } | null;
    };
    return mapLeadRow(lead, {
      contactName: lead.crm_contacts?.name,
      contactEmail: lead.crm_contacts?.email,
    });
  } catch {
    return null;
  }
}

export async function listCrmActivities(limit = 100): Promise<CrmActivity[]> {
  if (!hasSupabaseEnv()) return [];
  try {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("crm_activities")
      .select("*, crm_contacts(name), leads(title)")
      .order("created_at", { ascending: false })
      .limit(limit);
    if (error || !data) return [];
    return data.map((row) => {
      const activity = row as CrmActivityRow & {
        crm_contacts?: { name: string } | null;
        leads?: { title: string } | null;
      };
      return mapCrmActivityRow(activity, {
        contactName: activity.crm_contacts?.name,
        leadTitle: activity.leads?.title,
      });
    });
  } catch {
    return [];
  }
}

export async function listCrmTasks(limit = 50): Promise<CrmActivity[]> {
  if (!hasSupabaseEnv()) return [];
  try {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("crm_activities")
      .select("*, crm_contacts(name), leads(title)")
      .eq("type", "task")
      .order("created_at", { ascending: false })
      .limit(limit);
    if (error || !data) return [];
    return data.map((row) => {
      const activity = row as CrmActivityRow & {
        crm_contacts?: { name: string } | null;
        leads?: { title: string } | null;
      };
      return mapCrmActivityRow(activity, {
        contactName: activity.crm_contacts?.name,
        leadTitle: activity.leads?.title,
      });
    });
  } catch {
    return [];
  }
}

export type CrmDashboardStats = {
  contacts: number;
  leadsOpen: number;
  tasksOpen: number;
  activities: number;
};

export async function getCrmDashboardStats(): Promise<CrmDashboardStats> {
  const empty = { contacts: 0, leadsOpen: 0, tasksOpen: 0, activities: 0 };
  if (!hasSupabaseEnv()) return empty;
  try {
    const supabase = createClient();
    const [contacts, leads, tasks, activities] = await Promise.all([
      supabase
        .from("crm_contacts")
        .select("id", { count: "exact", head: true }),
      supabase
        .from("leads")
        .select("id", { count: "exact", head: true })
        .neq("stage", "closed"),
      supabase
        .from("crm_activities")
        .select("id", { count: "exact", head: true })
        .eq("type", "task")
        .eq("task_status", "open"),
      supabase
        .from("crm_activities")
        .select("id", { count: "exact", head: true }),
    ]);
    return {
      contacts: contacts.count ?? 0,
      leadsOpen: leads.count ?? 0,
      tasksOpen: tasks.count ?? 0,
      activities: activities.count ?? 0,
    };
  } catch {
    return empty;
  }
}
