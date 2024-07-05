import "@/styles/globals.css";

import { GeistSans } from "geist/font/sans";

import { TRPCReactProvider } from "@/trpc/react";
import { Toaster } from "sonner";
import NotificationWrapper from "@/lib/context/NotificationWrapper";
import { SessionProvider } from "next-auth/react";

export const metadata = {
  title: "Swoosh | Experimental!",
  description: "Testing base core features",
  icons: [{ rel: "icon", url: "/favicon.ico" }],

};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${GeistSans.variable}`}>
      <body>
        <TRPCReactProvider>
          <NotificationWrapper>{children}</NotificationWrapper>
        </TRPCReactProvider>
        <Toaster />
      </body>
    </html>
  );
}
