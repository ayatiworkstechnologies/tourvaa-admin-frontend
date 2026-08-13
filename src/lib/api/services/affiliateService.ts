import api from "@/lib/api/client";

export type PaginatedResponse<T> = {
  items: T[];
  total: number;
  page: number;
  limit: number;
  total_pages: number;
};

export type AffiliateLink = {
  id: number;
  affiliate_id: number;
  ref_code: string;
  custom_alias: string | null;
  link_type: "tour" | "category" | "destination" | "custom" | string;
  tour_id: number | null;
  tour_title: string | null;
  destination_url: string | null;
  label: string | null;
  campaign_name: string | null;
  utm_source: string | null;
  utm_medium: string | null;
  utm_campaign: string | null;
  utm_content: string | null;
  utm_term: string | null;
  commission_type_override: string | null;
  commission_percentage_override: string | null;
  commission_fixed_override: string | null;
  attribution_model: string;
  attribution_window_days: number;
  valid_from: string | null;
  valid_until: string | null;
  status: "draft" | "active" | "disabled" | "expired" | "deleted" | string;
  is_active: boolean;
  total_clicks: number;
  total_conversions: number;
  created_by: number | null;
  updated_by: number | null;
  created_at: string;
  updated_at: string;
};

export type AffiliateClick = {
  id: number;
  link_id: number;
  affiliate_id: number;
  ip_address: string | null;
  referrer: string | null;
  clicked_at: string;
};

export type AffiliateConversion = {
  id: number;
  link_id: number;
  affiliate_id: number;
  booking_id: number;
  booking_code: string | null;
  commission_rule_id: number | null;
  booking_amount: string;
  eligible_amount: string;
  commission_percentage: string;
  commission_amount: string;
  original_commission: string | null;
  adjustment_amount: string;
  final_commission: string | null;
  currency: string;
  status: "pending" | "confirmed" | "available" | "paid" | "void" | "reversed" | string;
  approved_at: string | null;
  available_at: string | null;
  converted_at: string;
};

export type AffiliateCommissionSummary = {
  affiliate_id: number;
  total_conversions: number;
  total_commission: string;
  pending_commission: string;
  confirmed_commission: string;
  available_commission: string;
  paid_commission: string;
  void_commission: string;
  entries: AffiliateConversion[];
};

export type AffiliateCommissionRule = {
  id: number;
  name: string | null;
  affiliate_id: number | null;
  tour_id: number | null;
  category_id: number | null;
  affiliate_link_id: number | null;
  commission_type: "percentage" | "fixed" | string;
  percentage: string;
  fixed_amount: string;
  currency: string;
  valid_from: string | null;
  valid_until: string | null;
  priority: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

export type AffiliatePayoutMethod = {
  id: number;
  affiliate_id: number;
  method_type: string;
  account_holder_name: string;
  bank_name: string;
  account_number_masked: string;
  ifsc: string;
  swift_code: string;
  bank_country: string;
  paypal_email: string;
  is_default: boolean;
  is_active: boolean;
  created_at: string;
};

export type AffiliatePayout = {
  id: number;
  payout_code: string | null;
  affiliate_id: number;
  total_amount: string;
  currency: string;
  payment_method: string;
  reference_number: string | null;
  status: "requested" | "approved" | "processing" | "paid" | "rejected" | "cancelled" | "pending" | string;
  notes: string | null;
  paid_at: string | null;
  created_at: string;
};

export type AffiliateWalletSummary = {
  affiliate_id: number;
  available_balance: string;
  pending_payout_balance: string;
  paid_lifetime: string;
  lifetime_earnings: string;
  ledger_balance: string;
};

export type AffiliateWalletTransaction = {
  id: number;
  transaction_type: string;
  amount: string;
  currency: string;
  commission_id: number | null;
  payout_id: number | null;
  reference_type: string | null;
  reference_id: number | null;
  description: string | null;
  created_at: string;
};

// --- admin: affiliate lifecycle (approve/reject already in operationsService.ts) ---

export async function activateAffiliate(affiliateId: number | string) {
  const res = await api.post(`/affiliates/${affiliateId}/activate`);
  return res.data.data;
}

export async function suspendAffiliate(affiliateId: number | string, reason: string) {
  const res = await api.post(`/affiliates/${affiliateId}/suspend`, { reason });
  return res.data.data;
}

// --- admin: affiliate links --------------------------------------------------

export type AffiliateLinkFilters = {
  page?: number;
  limit?: number;
  search?: string;
  affiliate_id?: number;
  tour_id?: number;
  status?: string;
};

export async function getAffiliateLinks(filters: AffiliateLinkFilters = {}) {
  const res = await api.get<PaginatedResponse<AffiliateLink> & { status: string }>("/affiliate-links", { params: filters });
  return res.data;
}

export async function getAffiliateLink(linkId: number | string) {
  const res = await api.get<{ data: AffiliateLink }>(`/affiliate-links/${linkId}`);
  return res.data.data;
}

export type AffiliateLinkPayload = {
  affiliate_id?: number;
  link_type?: string;
  tour_id?: number | null;
  destination_url?: string | null;
  label?: string | null;
  campaign_name?: string | null;
  utm_source?: string | null;
  utm_medium?: string | null;
  utm_campaign?: string | null;
  utm_content?: string | null;
  utm_term?: string | null;
  custom_alias?: string | null;
  commission_type_override?: string | null;
  commission_percentage_override?: string | number | null;
  commission_fixed_override?: string | number | null;
  attribution_model?: string;
  attribution_window_days?: number;
  valid_from?: string | null;
  valid_until?: string | null;
  status?: string;
};

export async function createAffiliateLink(payload: AffiliateLinkPayload & { affiliate_id: number }) {
  const res = await api.post<{ data: AffiliateLink }>("/affiliate-links", payload);
  return res.data.data;
}

export async function updateAffiliateLink(linkId: number | string, payload: AffiliateLinkPayload) {
  const res = await api.put<{ data: AffiliateLink }>(`/affiliate-links/${linkId}`, payload);
  return res.data.data;
}

export async function activateAffiliateLink(linkId: number | string) {
  const res = await api.post<{ data: AffiliateLink }>(`/affiliate-links/${linkId}/activate`);
  return res.data.data;
}

export async function disableAffiliateLink(linkId: number | string) {
  const res = await api.post<{ data: AffiliateLink }>(`/affiliate-links/${linkId}/disable`);
  return res.data.data;
}

export async function duplicateAffiliateLink(linkId: number | string, campaignName?: string) {
  const res = await api.post<{ data: AffiliateLink }>(`/affiliate-links/${linkId}/duplicate`, null, {
    params: campaignName ? { campaign_name: campaignName } : undefined,
  });
  return res.data.data;
}

export async function deleteAffiliateLink(linkId: number | string) {
  const res = await api.delete(`/affiliate-links/${linkId}`);
  return res.data.data;
}

// --- self-service: own links --------------------------------------------------

export async function getOwnAffiliateLinks(affiliateId: number | string) {
  const res = await api.get<{ data: AffiliateLink[] }>(`/affiliates/${affiliateId}/links`);
  return res.data.data;
}

export async function getOwnAffiliateLink(affiliateId: number | string, linkId: number | string) {
  const res = await api.get<{ data: AffiliateLink }>(`/affiliates/${affiliateId}/links/${linkId}`);
  return res.data.data;
}

export async function createOwnAffiliateLink(affiliateId: number | string, payload: AffiliateLinkPayload) {
  const res = await api.post<{ data: AffiliateLink }>(`/affiliates/${affiliateId}/links`, payload);
  return res.data.data;
}

export async function updateOwnAffiliateLink(affiliateId: number | string, linkId: number | string, payload: AffiliateLinkPayload) {
  const res = await api.put<{ data: AffiliateLink }>(`/affiliates/${affiliateId}/links/${linkId}`, payload);
  return res.data.data;
}

// --- clicks / conversions / commissions ----------------------------------------

export async function getAffiliateClicks(affiliateId: number | string, params: { page?: number; limit?: number } = {}) {
  const res = await api.get<PaginatedResponse<AffiliateClick> & { status: string }>(`/affiliates/${affiliateId}/clicks`, { params });
  return res.data;
}

export async function getAffiliateConversions(affiliateId: number | string, params: { page?: number; limit?: number } = {}) {
  const res = await api.get<PaginatedResponse<AffiliateConversion> & { status: string }>(`/affiliates/${affiliateId}/conversions`, { params });
  return res.data;
}

export async function getAffiliateCommissions(affiliateId: number | string) {
  const res = await api.get<{ data: AffiliateCommissionSummary }>(`/affiliates/${affiliateId}/commissions`);
  return res.data.data;
}

// --- admin: commission rules ----------------------------------------------------

export type CommissionRuleFilters = { page?: number; limit?: number; affiliate_id?: number; tour_id?: number; is_active?: boolean };

export async function getCommissionRules(filters: CommissionRuleFilters = {}) {
  const res = await api.get<PaginatedResponse<AffiliateCommissionRule> & { status: string }>("/affiliate-commission-rules", { params: filters });
  return res.data;
}

export type CommissionRulePayload = {
  name?: string | null;
  affiliate_id?: number | null;
  tour_id?: number | null;
  category_id?: number | null;
  affiliate_link_id?: number | null;
  commission_type?: string;
  percentage?: string | number;
  fixed_amount?: string | number;
  currency?: string;
  valid_from?: string | null;
  valid_until?: string | null;
  priority?: number;
  is_active?: boolean;
};

export async function createCommissionRule(payload: CommissionRulePayload) {
  const res = await api.post<{ data: AffiliateCommissionRule }>("/affiliate-commission-rules", payload);
  return res.data.data;
}

export async function updateCommissionRule(ruleId: number | string, payload: CommissionRulePayload) {
  const res = await api.put<{ data: AffiliateCommissionRule }>(`/affiliate-commission-rules/${ruleId}`, payload);
  return res.data.data;
}

export async function deleteCommissionRule(ruleId: number | string) {
  const res = await api.delete(`/affiliate-commission-rules/${ruleId}`);
  return res.data.data;
}

// --- self-service: payout methods -----------------------------------------------

export async function getPayoutMethods() {
  const res = await api.get<{ data: AffiliatePayoutMethod[] }>("/affiliate/payout-methods");
  return res.data.data;
}

export type PayoutMethodPayload = {
  method_type?: string;
  account_holder_name?: string;
  bank_name?: string;
  account_number?: string;
  ifsc?: string;
  swift_code?: string;
  bank_country?: string;
  paypal_email?: string;
  is_default?: boolean;
  is_active?: boolean;
};

export async function createPayoutMethod(payload: PayoutMethodPayload) {
  const res = await api.post<{ data: AffiliatePayoutMethod }>("/affiliate/payout-methods", payload);
  return res.data.data;
}

export async function updatePayoutMethod(methodId: number | string, payload: PayoutMethodPayload) {
  const res = await api.put<{ data: AffiliatePayoutMethod }>(`/affiliate/payout-methods/${methodId}`, payload);
  return res.data.data;
}

export async function deletePayoutMethod(methodId: number | string) {
  const res = await api.delete(`/affiliate/payout-methods/${methodId}`);
  return res.data;
}

// --- self-service: wallet + payout requests --------------------------------------

export async function getWalletSummary() {
  const res = await api.get<{ data: AffiliateWalletSummary }>("/affiliate/wallet");
  return res.data.data;
}

export async function getWalletTransactions(params: { page?: number; limit?: number } = {}) {
  const res = await api.get<PaginatedResponse<AffiliateWalletTransaction> & { status: string }>("/affiliate/wallet/transactions", { params });
  return res.data;
}

export async function requestPayout(payload: { amount: string | number; payout_method_id: number; notes?: string }) {
  const res = await api.post<{ data: AffiliatePayout }>("/affiliate/payout-requests", payload);
  return res.data.data;
}

export async function getAffiliatePayouts(params: { page?: number; limit?: number; affiliate_id?: number } = {}) {
  const res = await api.get<PaginatedResponse<AffiliatePayout> & { status: string }>("/affiliate-payouts", { params });
  return res.data;
}

// --- admin: payout queue ---------------------------------------------------------

export async function getAdminAffiliatePayouts(params: { page?: number; limit?: number; status?: string } = {}) {
  const res = await api.get<PaginatedResponse<AffiliatePayout> & { status: string }>("/admin/affiliate-payouts", { params });
  return res.data;
}

export async function approveAffiliatePayout(payoutId: number | string) {
  const res = await api.post<{ data: AffiliatePayout }>(`/affiliate-payouts/${payoutId}/approve`);
  return res.data.data;
}

export async function rejectAffiliatePayout(payoutId: number | string, reason: string) {
  const res = await api.post<{ data: AffiliatePayout }>(`/affiliate-payouts/${payoutId}/reject`, { reason });
  return res.data.data;
}

export async function markAffiliatePayoutProcessing(payoutId: number | string) {
  const res = await api.post<{ data: AffiliatePayout }>(`/affiliate-payouts/${payoutId}/processing`);
  return res.data.data;
}

export async function markAffiliatePayoutPaid(payoutId: number | string, payload: { payment_reference: string; admin_notes?: string }) {
  const res = await api.post<{ data: AffiliatePayout }>(`/affiliate-payouts/${payoutId}/mark-paid`, payload);
  return res.data.data;
}
