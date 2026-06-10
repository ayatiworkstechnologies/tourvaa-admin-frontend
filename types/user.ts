export type Role = {
  id: number;
  name: string;
  slug: string;
  is_active: boolean;
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
