export type Role = {
  id: number;
  name: string;
  slug: string;
  is_active: boolean;
  is_system?: boolean;
};

export type User = {
  id: number;
  name: string;
  email: string;
  phone: string;
  profile_image: string;
  address: string;
  country: string;
  state: string;
  city: string;
  pincode: string;
  role_id: number | null;
  is_active: boolean;
  approval_status: "pending" | "approved" | "rejected";
  user_type?: "CUSTOMER" | "AGENT" | "SUPPLIER" | "ADMIN";
  country_code?: string;
  mobile_number?: string;
  email_verified?: boolean;
  password_created?: boolean;
  admin_verified?: boolean;
  account_status?: "PENDING_EMAIL_VERIFICATION" | "PENDING_PASSWORD_CREATION" | "PENDING_ADMIN_VERIFICATION" | "ACTIVE" | "INACTIVE" | "SUSPENDED" | "LOCKED";
  admin_verified_at?: string | null;
  deactivated_at?: string | null;
  deactivation_reason?: string | null;
  last_login_at?: string | null;
  updated_at?: string | null;
  status_history?: Array<{ id: number; from_status?: string | null; to_status: string; reason?: string | null; created_at: string }>;
  created_at: string;
  role?: Role | null;
};

export type UserFormData = {
  name: string;
  email: string;
  phone: string;
  profile_image: string;
  address: string;
  country: string;
  state: string;
  city: string;
  pincode: string;
  password?: string;
  role_id: number | "";
  is_active?: boolean;
  approval_status?: "pending" | "approved" | "rejected";
};
