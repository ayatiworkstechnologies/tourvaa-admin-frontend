import api from "@/lib/api";

export type Notification = {
  id: number;
  title: string;
  message: string;
  notification_type: string;
  channel: string;
  status: string;
  is_read: boolean;
  created_at?: string | null;
};

export type NotificationFilters = {
  page?: number;
  limit?: number;
  user_id?: number;
  is_read?: string;
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

export async function retryNotification(notificationId: number | string) {
  const response = await api.post<ApiDataResponse<Notification>>(
    `/notifications/${notificationId}/retry`,
  );

  return response.data.data;
}


