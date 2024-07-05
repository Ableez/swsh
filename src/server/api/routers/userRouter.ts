import { z } from "zod";

import { createTRPCRouter, protectedProcedure } from "@/server/api/trpc";

export const userRouter = createTRPCRouter({
  getSession: protectedProcedure.query(({ ctx }) => {
    return ctx.session;
  }),
  registerUser: publicProcedure
    .input(
      z.object({
        username: z.string().min(2),
        email: z.string().email(),
        phoneNumber: z.string().min(10),
        password: z.string().min(8),
      }),
    )
    .mutate(({ ctx, input }) => {
      const { username, email, phoneNumber, password } = input;
      
  
      return ctx
    }),
});
