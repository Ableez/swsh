import { DrizzleAdapter } from "@auth/drizzle-adapter";
import {
  getServerSession,
  type User,
  type DefaultSession,
  type NextAuthOptions,
} from "next-auth";
import { type Adapter } from "next-auth/adapters";
import GoogleProvider from "next-auth/providers/google";

import { env } from "@/env";
import { db } from "@/server/db";
import {
  accounts,
  sessions,
  users,
  verificationTokens,
} from "@/server/db/schema";
import Credentials from "next-auth/providers/credentials";
import { eq } from "drizzle-orm";

import * as bcrypt from "bcrypt";

/**
 * Module augmentation for `next-auth` types. Allows us to add custom properties to the `session`
 * object and keep type safety.
 *
 * @see https://next-auth.js.org/getting-started/typescript#module-augmentation
 */
declare module "next-auth" {
  interface Session extends DefaultSession {
    user: {
      id: string;
      // ...other properties
      // role: UserRole;
    } & DefaultSession["user"];
  }

  // interface User {
  //   // ...other properties
  //   // role: UserRole;
  // }
}

/**
 * Options for NextAuth.js used to configure adapters, providers, callbacks, etc.
 *
 * @see https://next-auth.js.org/configuration/options
 */
export const authOptions: NextAuthOptions = {
  callbacks: {
    session: ({ session, user }) => ({
      ...session,
      user: {
        ...session.user,
        id: user.id,
      },
    }),
  },
  adapter: DrizzleAdapter(db, {
    usersTable: users,
    accountsTable: accounts,
    sessionsTable: sessions,
    verificationTokensTable: verificationTokens,
  }) as Adapter,
  providers: [
    GoogleProvider({
      clientId: env.GOOGLE_CLIENT_ID,
      clientSecret: env.GOOGLE_CLIENT_SECRET,
    }),

    Credentials({
      credentials: {
        username_or_email: {
          label: "Email or username",
          type: "text",
          placeholder: "Email or username",
        },
        password: {
          label: "Password",
          type: "password",
          placeholder: "Enter your password",
        },
      },
      name: "Credentials Login",
      async authorize(credentials) {
        try {
          if (!credentials?.username_or_email || !credentials?.password) {
            throw new Error("All fields are required");
          }

          const user = await db
            .select()
            .from(users)
            .where(eq(users.email, credentials.username_or_email));

          if (!user[0]) {
            throw new Error("User not found.");
          }

          const isValid = await bcrypt.compare(
            credentials.password,
            user[0].password_hash!,
          );

          if (!isValid) {
            return null;
          } else {
            return user as unknown as User;
          }
        } catch (error) {
          throw new Error(error as string);
        }
      },
    }),
  ],
};

/**
 * Wrapper for `getServerSession` so that you don't need to import the `authOptions` in every file.
 *
 * @see https://next-auth.js.org/configuration/nextjs
 */
export const getServerAuthSession = () => getServerSession(authOptions);
