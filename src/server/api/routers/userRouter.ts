import { z } from "zod";

import {
  createTRPCRouter,
  protectedProcedure,
  publicProcedure,
} from "@/server/api/trpc";
import { users } from "@/server/db/schema";
import { db } from "@/server/db";
import { eq } from "drizzle-orm";

export const userRouter = createTRPCRouter({
  getSession: protectedProcedure.query(({ ctx }) => {
    return ctx.session;
  }),

  getUserByEmail: publicProcedure
    .input(z.object({ email: z.string() }))
    .query(({ ctx, input }) => {
      const user = db.select().from(users).where(eq(users.email, input.email));

      return user;
    }),
});
