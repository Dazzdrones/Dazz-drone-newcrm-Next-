export interface CrmRole {
  id: string;
  key: string;
  name: string;
  description: string | null;
  is_system: boolean;
}

export interface CrmProfile {
  id: string;
  email: string;
  full_name: string | null;
  role_id: string;
  is_active: boolean;
  avatar_url: string | null;
  role?: CrmRole;
}

export interface AuthSession {
  userId: string;
  email: string;
  profile: CrmProfile;
  permissions: string[];
  isSuperAdmin: boolean;
}
