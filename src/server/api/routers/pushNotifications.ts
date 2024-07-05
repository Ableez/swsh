import { users } from "@/server/db/schema";
import { createTRPCRouter, protectedProcedure, publicProcedure } from "../trpc";
import { z } from "zod";
import { eq } from "drizzle-orm";
import { sendPushNotification } from "@/server/pushNotifications";

const pushSubscriptionSchema = z.object({
  endpoint: z.string().url(),
  expirationTime: z.number().nullable(),
  keys: z.object({
    p256dh: z.string(),
    auth: z.string(),
  }),
});

export type SerializablePushSubscription = z.infer<
  typeof pushSubscriptionSchema
>;

export const pushNotificationsRouter = createTRPCRouter({
  unSubscribePushNotifications: protectedProcedure
    .input(
      z.object({
        uid: z.string(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      await ctx.db
        .update(users)
        .set({ pushSubs: null })
        .where(eq(users.id, input.uid));
      return { success: true };
    }),

  subscribePushNotifications: protectedProcedure
    .input(z.object({ subscription: z.any() }))
    .mutation(async ({ ctx, input }) => {
      await ctx.db
        .update(users)
        .set({ pushSubs: input.subscription })
        .where(eq(users.id, ctx.session.user.id));
      return { success: true };
    }),

  sendPushNotification: protectedProcedure
    .input(
      z.object({
        subscription: pushSubscriptionSchema,
        payload: z.string(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      await sendPushNotification(
        input.subscription as unknown as PushSubscription,
        input.payload,
      );
      return { success: true };
    }),

  sendPushNotificationToUser: publicProcedure
    .input(
      z.object({
        id: z.string(),
        payload: z.object({
          title: z.string(),
          body: z.string(),
        }),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const user = await ctx.db
        .select()
        .from(users)
        .where(eq(users.id, input.id));

      const subscription = user[0]?.pushSubs as PushSubscription;

      if (subscription) {
        await sendPushNotification(subscription, JSON.stringify(input.payload));
        return { success: true };
      } else {
        console.log("Error user has not subscribed");
        return { success: false };
      }
    }),
});
