export type Permission = {
  name: string;
  slug: string;
  module: string;
  action?: "get" | "post" | "put" | "delete";
};

export type MenuItem = {
  label: string;
  permission: string;
  module: string;
};

export type AuthUser = {
  id: number;
  name: string;
  email: string;
  user_type?: string;
  profile_image?: string;
  profile_status?: string | null;
  approval_status?: string | null;
  role: {
    id: number;
    name: string;
    slug: string;
  };
  permissions: Permission[];
};

export type DashboardStats = {
  users: number;
  active_users: number;
  roles: number;
  permissions: number;
  pending_users: number;
};

export type PendingApproval = {
  id: number;
  name: string;
  email: string;
  role_id: number | null;
  role_name?: string | null;
  created_at: string;
};
