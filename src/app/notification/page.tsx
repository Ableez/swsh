"use client";

import { Button } from "@/components/ui/button";
import { usePushNotifications } from "@/lib/hooks/usePushNotification";
import React from "react";
import { api } from "@/trpc/react";

const NotificationPage = () => {
  const {
    isSubscribed,
    subscribeToNotifications,
    sendNotification,
    unsubscribeFromNotifications,
    sendPushToUser,
  } = usePushNotifications();

  const { data: session } = api.user.getSession.useQuery();


  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-[#2e026d] to-[#15162c] text-white">
      <div className="container flex flex-col items-center justify-center gap-12 px-4 py-16 ">
        <h1 className="text-5xl font-extrabold tracking-tight sm:text-[5rem]">
          {isSubscribed ? "Subscribed" : "Not Subscribed"}
        </h1>

        {isSubscribed ? (
          <Button
            onClick={async () => {
              await unsubscribeFromNotifications();
            }}
          >
            Unsubscribe
          </Button>
        ) : (
          <Button
            onClick={async () => {
              await subscribeToNotifications();
            }}
          >
            subscribe
          </Button>
        )}

        {isSubscribed && (
          <Button
            onClick={async () => {
              await sendNotification(
                `${session?.user.name}`,
                "How are you doing?",
              );
            }}
          >
            Send Notification
          </Button>
        )}

        <Button
          onClick={async () => {
            await sendPushToUser("d220499a-3f80-4cbc-ac59-8298d26a949a", {
              body: "Hello Matt",
              title: "Test Push",
            });
          }}
        >
          Send push to user
        </Button>
      </div>
    </main>
  );
};

export default NotificationPage;
