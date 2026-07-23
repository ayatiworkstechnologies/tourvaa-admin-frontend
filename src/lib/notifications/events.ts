export const NOTIFICATION_REFRESH_EVENT = "tourvaa:notifications:refresh";
export const NOTIFICATION_PUSH_MESSAGE = "tourvaa:notification-received";

export function requestNotificationRefresh() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event(NOTIFICATION_REFRESH_EVENT));
  }
}

export function isNotificationPushMessage(data: unknown) {
  return (
    typeof data === "object" &&
    data !== null &&
    (data as { type?: string }).type === NOTIFICATION_PUSH_MESSAGE
  );
}
