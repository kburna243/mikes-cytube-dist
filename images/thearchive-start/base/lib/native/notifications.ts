import { IS_NATIVE } from "../platform";

export type PushNotificationPayload = {
  title?: string;
  body?: string;
  data?: Record<string, string>;
};

type NotificationHandler = (payload: PushNotificationPayload) => void;

let handler: NotificationHandler | null = null;

/** Register for push notifications. Returns the device token on success. */
export async function registerPushNotifications(
  onNotification: NotificationHandler,
): Promise<string | null> {
  if (!IS_NATIVE) return null;

  try {
    const { PushNotifications } = await import("@capacitor/push-notifications");

    // Request permission
    const permStatus = await PushNotifications.requestPermissions();
    if (permStatus.receive !== "granted") return null;

    // Register
    await PushNotifications.register();

    // Listen for registration
    PushNotifications.addListener("registration", (token) => {
      console.log("Push token:", token.value);
    });

    // Listen for incoming notifications
    PushNotifications.addListener(
      "pushNotificationReceived",
      (notification) => {
        onNotification({
          title: notification.title,
          body: notification.body,
          data: notification.data as Record<string, string>,
        });
      },
    );

    handler = onNotification;
    return null; // Token arrives async via listener above
  } catch {
    return null;
  }
}

/** Remove all push notification listeners */
export async function unregisterPushNotifications(): Promise<void> {
  if (!IS_NATIVE) return;

  try {
    const { PushNotifications } = await import("@capacitor/push-notifications");
    await PushNotifications.removeAllListeners();
    handler = null;
  } catch {
    // Ignore
  }
}
