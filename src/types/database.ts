export type DbUserRole =
  | "entrepreneur"
  | "investor"
  | "expert"
  | "company"
  | "admin";

export type ProfileRow = {
  id: string;
  full_name: string;
  company_name: string | null;
  avatar_url: string | null;
  bio: string | null;
  phone: string | null;
  city: string | null;
  region: string | null;
  created_at: string;
  updated_at: string;
};

export type UserRoleRow = {
  id: string;
  user_id: string;
  role: DbUserRole;
  created_at: string;
};

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: ProfileRow;
        Insert: {
          id: string;
          full_name?: string;
          company_name?: string | null;
          avatar_url?: string | null;
          bio?: string | null;
          phone?: string | null;
          city?: string | null;
          region?: string | null;
        };
        Update: Partial<Omit<ProfileRow, "id" | "created_at">>;
      };
      user_roles: {
        Row: UserRoleRow;
        Insert: {
          id?: string;
          user_id: string;
          role: DbUserRole;
          created_at?: string;
        };
        Update: Partial<Omit<UserRoleRow, "id">>;
      };
    };
    Enums: {
      user_role: DbUserRole;
    };
  };
};
