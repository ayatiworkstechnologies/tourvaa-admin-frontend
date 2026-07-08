import api from "@/lib/api/client";

export type Notification = {
  id: number;
  user_id: number | null;
  title: string;
  message: string;
  notification_type: string;
  channel: string;
  status: string;
  is_read: boolean;
  entity_type?: string | null;
  entity_id?: number | null;
  created_at?: string | null;
};

export type NotificationFilters = {
  page?: number;
  limit?: number;
  user_id?: number;
  is_read?: string;
  entity_type?: string;
  entity_id?: number;
  notification_type?: string;
};

export type PaginatedNotifications = {
  data: Notification[];
  items: Notification[];
  total: number;
  page: number;
  limit: number;
  total_pages: number;
};

type ApiDataResponse<T> = {
  status: string;
  data: T;
};

export async function getNotifications(filters: NotificationFilters = {}) {
  const response = await api.get<PaginatedNotifications>("/notifications/", { params: filters });
  return response.data;
}

export async function markNotificationRead(notificationId: number | string) {
  const response = await api.patch<ApiDataResponse<Notification>>(
    `/notifications/${notificationId}/read`,
  );

  return response.data.data;
}

export async function markAllNotificationsRead(userId: number) {
  const response = await api.patch<ApiDataResponse<{ updated: number }>>(
    "/notifications/mark-all-read",
    undefined,
    { params: { user_id: userId } }
  );

  return response.data.data;
}

export async function retryNotification(notificationId: number | string) {
  const response = await api.post<ApiDataResponse<Notification>>(
    `/notifications/${notificationId}/retry`,
  );

  return response.data.data;
}
