import { env } from "@/env";
import webpush from "web-push";

const vapidKeys = {
  publicKey: env.VAPID_PUBLIC_KEY,
  privateKey: env.VAPID_PRIVATE_KEY,
};

webpush.setVapidDetails(
  "mailto:djayableez@gmail.com",
  vapidKeys.publicKey,
  vapidKeys.privateKey,
);

export const sendPushNotification = async (
  subscription: PushSubscription,
  payload: string,
) => {
  try {
    await webpush.sendNotification(subscription, payload);
    console.log("Push notification sent successfully");
  } catch (error) {
    console.error("Error sending push notification:", error);
  }
};
