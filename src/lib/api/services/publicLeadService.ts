import api from "@/lib/api/client";

export type ContactEnquiry = {
  id: number;
  name: string;
  email: string;
  phone: string | null;
  audience: "public" | "supplier" | "agent";
  enquiry_type: string;
  subject: string;
  message: string;
  is_replied: boolean;
  created_at: string;
};

export type NewsletterSubscriber = {
  id: number;
  email: string;
  is_active: boolean;
  created_at: string;
};

export type PublicLeadPage<T> = {
  items: T[];
  total: number;
  page: number;
  limit: number;
  total_pages: number;
};

async function list<T>(path: string, page: number, limit: number, search: string) {
  const response = await api.get<{ data: PublicLeadPage<T> }>(path, {
    params: { page, limit, search: search.trim() },
  });
  return response.data.data;
}

export function listContactEnquiries(page: number, limit: number, search: string, audience = "all") {
  return api.get<{ data: PublicLeadPage<ContactEnquiry> }>("/public-leads/contact-enquiries", {
    params: { page, limit, search: search.trim(), audience },
  }).then((response) => response.data.data);
}

export function listNewsletterSubscribers(page: number, limit: number, search: string) {
  return list<NewsletterSubscriber>("/public-leads/newsletter-subscribers", page, limit, search);
}
