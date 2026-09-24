import api from "@/lib/api/client";

// Browser web push: registers /sw.js, subscribes with the backend's VAPID
// public key and stores the subscription for the signed-in user, so every
// Tourvaa notification also appears as a system notification.

export type PushState = "unsupported" | "default" | "granted" | "denied";

export function pushSupported(): boolean {
  return typeof window !== "undefined" && "serviceWorker" in navigator && "PushManager" in window && "Notification" in window;
}

export function pushPermission(): PushState {
  if (!pushSupported()) return "unsupported";
  return Notification.permission as PushState;
}

function base64UrlToUint8Array(value: string): Uint8Array<ArrayBuffer> {
  const padding = "=".repeat((4 - (value.length % 4)) % 4);
  const raw = atob((value + padding).replace(/-/g, "+").replace(/_/g, "/"));
  const bytes = new Uint8Array(new ArrayBuffer(raw.length));
  for (let i = 0; i < raw.length; i += 1) bytes[i] = raw.charCodeAt(i);
  return bytes;
}

let publicKeyPromise: Promise<string> | null = null;
function vapidPublicKey(): Promise<string> {
  publicKeyPromise ??= api
    .get("/notifications/push/public-key")
    .then((res) => (res.data?.data?.public_key as string) || "")
    .catch(() => {
      publicKeyPromise = null;
      return "";
    });
  return publicKeyPromise;
}

let inFlight: Promise<boolean> | null = null;

/** Subscribe this browser (permission must already be granted) and save the
 * subscription for the current user. Safe to call on every page load; calls
 * made while one is running share it (the bell can mount more than once). */
export function ensurePushSubscription(): Promise<boolean> {
  inFlight ??= subscribeAndSave().finally(() => {
    inFlight = null;
  });
  return inFlight;
}

async function subscribeAndSave(): Promise<boolean> {
  if (pushPermission() !== "granted") return false;
  const key = await vapidPublicKey();
  if (!key) return false; // push not configured on the server
  const registration = await navigator.serviceWorker.register("/sw.js");
  await navigator.serviceWorker.ready;
  const serverKey = base64UrlToUint8Array(key);

  let subscription = await registration.pushManager.getSubscription();
  // A subscription made with an older VAPID key can't receive our pushes.
  const current = subscription?.options.applicationServerKey;
  if (subscription && current && !sameKey(new Uint8Array(current), serverKey)) {
    await subscription.unsubscribe();
    subscription = null;
  }
  subscription ??= await registration.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: serverKey });

  const json = subscription.toJSON();
  if (!json.endpoint || !json.keys?.p256dh || !json.keys?.auth) return false;
  await api.post("/notifications/push/subscribe", { endpoint: json.endpoint, p256dh: json.keys.p256dh, auth: json.keys.auth });
  return true;
}

/** Ask for permission (must run from a click) and subscribe. */
export async function enablePush(): Promise<PushState> {
  if (!pushSupported()) return "unsupported";
  const result = (await Notification.requestPermission()) as PushState;
  if (result === "granted") await ensurePushSubscription();
  return result;
}

function sameKey(a: Uint8Array, b: Uint8Array) {
  return a.length === b.length && a.every((byte, i) => byte === b[i]);
}
