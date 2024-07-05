import { DrizzleAdapter } from "@auth/drizzle-adapter";
import NextAuth, { type NextAuthConfig } from "next-auth";
import { db } from "./db";
import { accounts, sessions, users, verificationTokens } from "./db/schema";
import credentials from "next-auth/providers/credentials";
import { eq } from "drizzle-orm";
import { compare } from "bcrypt";

export const config: NextAuthConfig = {
  adapter: DrizzleAdapter(db, {
    usersTable: users,
    accountsTable: accounts,
    sessionsTable: sessions,
    verificationTokensTable: verificationTokens,
  }),
  callbacks: {
    async jwt({ token, user }) {
      console.log("JWT-rc", token);
      if (user) {
        token.email = user.email;
      }
      return token;
    },
    session: ({ session, user }) => {
      console.log("SESSION-rc", session);
      console.log("USER-rc", user);
      return {
        ...session,
        user: {
          ...session.user,
          id: user.id,
        },
      };
    },
  },
  providers: [
    credentials({
      credentials: {
        email: {},
        password: {},
      },
      authorize: async (credentials) => {
        if (!credentials?.email || !credentials?.password) {
          console.log("ALL FIELDS ARE REQUIRED");
          return null;
        }

        const credsEmail = JSON.stringify(credentials.email);
        const credsPassword = JSON.stringify(credentials.password);

        console.log(credsEmail, credsPassword);

        const userFromDb = await db
          .select()
          .from(users)
          .where(eq(users.email, credsEmail));

        if (!userFromDb[0]) {
          console.log("User not found");
          return null;
        }

        const isValid = await compare(
          credsPassword,
          userFromDb[0].passwordHash!,
        );
        console.log("ISVALID??", isValid);

        if (!isValid) return null;

        return userFromDb[0];
      },
    }),
  ],
};

export const { handlers, signIn, signOut, auth } = NextAuth(config);
