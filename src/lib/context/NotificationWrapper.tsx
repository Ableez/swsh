"use client";
import { type ReactNode, useEffect } from "react";
import { toast } from "sonner";

type Props = {
  children: ReactNode;
};

const NotificationWrapper = ({ children }: Props) => {
  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.addEventListener("message", (event) => {

        console.log("EVENT",event.data)
        if (event.data && event.data.type === "PUSH_RECEIVED") {
          // Handle push notification received while app is active
          console.log("Push notification received:", event.data);
          toast(<>Push notification received: {event.data.payload}</>);
        }
      });
    }
  }, []);

  return children;
};

export default NotificationWrapper;
