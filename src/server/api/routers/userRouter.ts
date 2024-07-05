import { z } from "zod";

import {
  createTRPCRouter,
  protectedProcedure,
  publicProcedure,
} from "@/server/api/trpc";
import { users } from "@/server/db/schema";
import { hash } from "bcrypt";

export const userRouter = createTRPCRouter({
  getSession: protectedProcedure.query(({ ctx }) => {
    return ctx.session;
  }),

  register: publicProcedure
    .input(
      z.object({
        username: z.string().min(2),
        email: z.string().email(),
        phoneNumber: z.string().min(10),
        password: z.string().min(8),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      const { username, email, phoneNumber, password } = input;
      const hashedPassword = await hash(password, 10);

      try {
        const newUser = await ctx.db
          .insert(users)
          .values({
            name: username,
            email,
            phoneNumber,
            passwordHash: hashedPassword,
            image: null,
            pushNotificationSubscription: null,
          })
          .returning();

        return { success: true, user: newUser[0] };
      } catch (error) {
        console.error("Error during registration:", error);
        throw new Error("Registration failed");
      }
    }),
});
