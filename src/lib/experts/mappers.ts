import type {
  ExpertProfile,
  ExpertProfileStatus,
  ExpertSpecialization,
} from "@/types";
import type { ExpertProfileRow } from "@/types/database";

export function mapExpertProfileRow(row: ExpertProfileRow): ExpertProfile {
  return {
    id: row.id,
    userId: row.user_id,
    specialization: row.specialization as ExpertSpecialization,
    headline: row.headline,
    description: row.description,
    experienceYears: row.experience_years,
    services: row.services,
    region: row.region,
    status: row.status as ExpertProfileStatus,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}
