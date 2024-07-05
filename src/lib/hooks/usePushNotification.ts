import { env } from "@/env";
import { api } from "@/trpc/react";
import { useState, useEffect, useCallback } from "react";
import { urlBase64ToUint8Array } from "../utils/base64ToUnit8Array";
import { toast } from "sonner";

// Make sure to import or define SerializablePushSubscription type here
type SerializablePushSubscription = {
  endpoint: string;
  expirationTime: number | null;
  keys: {
    p256dh: string;
    auth: string;
  };
};

const convertToSerializablePushSubscription = (
  sub: PushSubscription,
): SerializablePushSubscription => ({
  endpoint: sub.endpoint,
  expirationTime: sub.expirationTime,
  keys: {
    p256dh: sub.getKey("p256dh")
      ? btoa(
          String.fromCharCode.apply(
            null,
            Array.from(new Uint8Array(sub.getKey("p256dh")!)),
          ),
        )
      : "",
    auth: sub.getKey("auth")
      ? btoa(
          String.fromCharCode.apply(
            null,
            Array.from(new Uint8Array(sub.getKey("auth")!)),
          ),
        )
      : "",
  },
});

export const usePushNotifications = () => {
  const [subscription, setSubscription] = useState<PushSubscription | null>(
    null,
  );
  const [isSubscribed, setIsSubscribed] = useState(false);
  const subscribeMutation =
    api.pushNotification.subscribePushNotifications.useMutation();
  const sendNotificationMutation =
    api.pushNotification.sendPushNotification.useMutation();
  const sendNotificationMutationToUser =
    api.pushNotification.sendPushNotificationToUser.useMutation();
  const unsubscribeMutation =
    api.pushNotification.unSubscribePushNotifications.useMutation();

  const { data: session } = api.user.getSession.useQuery();

  useEffect(() => {
    if ("serviceWorker" in navigator && "PushManager" in window) {
      navigator.serviceWorker.ready
        .then(async (registration) => {
          await registration.pushManager.getSubscription().then((sub) => {
            if (sub) {
              setSubscription(sub);
              setIsSubscribed(true);
            }
          });
        })
        .catch((error) => {
          console.error("Failed to get subscription:", error);
        });
    }
  }, []);

  const subscribeToNotifications = useCallback(async () => {
    if (!("serviceWorker" in navigator)) return;

    try {
      const registration = await navigator.serviceWorker.ready;
      const sub = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(
          env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
        ),
      });
      setSubscription(sub);
      setIsSubscribed(true);

      const serializableSub = convertToSerializablePushSubscription(sub);
      await subscribeMutation.mutateAsync({ subscription: serializableSub });

      // Request permission for notifications
      if ("Notification" in window) {
        const permission = await Notification.requestPermission();
        if (permission !== "granted") {
          console.warn("Notification permission not granted");
        }
      }
    } catch (error) {
      console.error("Failed to subscribe to push notifications:", error);
    }
  }, [subscribeMutation]);

  const unsubscribeFromNotifications = useCallback(async () => {
    if (!subscription) return;

    try {
      await subscription.unsubscribe();
      setSubscription(null);
      setIsSubscribed(false);
      // You might want to add a mutation to remove the subscription from your server

      if (session?.user)
        await unsubscribeMutation.mutateAsync({
          uid: session?.user.id,
        });
    } catch (error) {
      console.error("Failed to unsubscribe from push notifications:", error);
    }
  }, [session?.user, subscription, unsubscribeMutation]);

  const sendNotification = useCallback(
    async (title: string, body: string) => {
      if (!subscription) return;

      try {
        const serializableSub =
          convertToSerializablePushSubscription(subscription);
        await sendNotificationMutation.mutateAsync({
          subscription: serializableSub,
          payload: JSON.stringify({ title, body }),
        });

        // Show notification if the app is active
        if ("Notification" in window && Notification.permission === "granted") {
          new Notification(title, { body });
          toast(`${title}`, { description: body, icon: "🔔" });
        }
      } catch (error) {
        console.error("Failed to send push notification:", error);
      }
    },
    [subscription, sendNotificationMutation],
  );

  //#TODO try sending notification to a user from another user. mimicking server oriented push notification

  const sendPushToUser = useCallback(
    async (uid: string, payload: { title: string; body: string }) => {
      await sendNotificationMutationToUser.mutateAsync({
        id: uid,
        payload,
      });
    },
    [sendNotificationMutationToUser],
  );

  return {
    isSubscribed,
    subscribeToNotifications,
    unsubscribeFromNotifications,
    sendNotification,
    sendPushToUser,
  };
};
