// import { DrizzleAdapter } from "@auth/drizzle-adapter";
// import {
//   getServerSession,
//   type DefaultSession,
//   type NextAuthOptions,
// } from "next-auth";
// import { type Adapter } from "next-auth/adapters";
// import GoogleProvider from "next-auth/providers/google";

// import { env } from "@/env";
// import { db } from "@/server/db";
// import {
//   accounts,
//   sessions,
//   users,
//   verificationTokens,
// } from "@/server/db/schema";
// import { eq } from "drizzle-orm";

// import * as bcrypt from "bcrypt";
// import Credentials from "next-auth/providers/credentials";

// /**
//  * Module augmentation for `next-auth` types. Allows us to add custom properties to the `session`
//  * object and keep type safety.
//  *
//  * @see https://next-auth.js.org/getting-started/typescript#module-augmentation
//  */
// declare module "next-auth" {
//   interface Session extends DefaultSession {
//     user: {
//       id: string;
//       // ...other properties
//       // role: UserRole;
//     } & DefaultSession["user"];
//   }

//   // interface User {
//   //   // ...other properties
//   //   // role: UserRole;
//   // }
// }

// /**
//  * Options for NextAuth.js used to configure adapters, providers, callbacks, etc.
//  *
//  * @see https://next-auth.js.org/configuration/options
//  */
// export const authOptions: NextAuthOptions = {
//   // debug: true,
//   callbacks: {
//     async jwt({ token, user }) {
//       console.log("JWT-rc", token);
//       if (user) {
//         token.email = user.email;
//       }
//       return token;
//     },
//     session: ({ session, user }) => {
//       console.log("SESSION-rc", session);
//       console.log("USER-rc", user);
//       return {
//         ...session,
//         user: {
//           ...session.user,
//           id: user.id,
//         },
//       };
//     },
//   },
//   adapter: DrizzleAdapter(db, {
//     usersTable: users,
//     accountsTable: accounts,
//     sessionsTable: sessions,
//     verificationTokensTable: verificationTokens,
//   }) as Adapter,
//   session: {
//     strategy: "database",
//   },
//   providers: [
//     GoogleProvider({
//       clientId: env.GOOGLE_CLIENT_ID,
//       clientSecret: env.GOOGLE_CLIENT_SECRET,
//     }),

//     Credentials({
//       credentials: {
//         email: {},
//         password: {},
//       },
//       name: "Email",
//       async authorize(credentials) {
//         if (!credentials?.email || !credentials?.password) {
//           console.log("ALL FIELDS ARE REQUIRED");
//           throw new Error("All fields are required");
//         }

//         const user = await db
//           .select()
//           .from(users)
//           .where(eq(users.email, credentials.email));

//         if (!user[0]) {
//           console.log("User not found");
//           throw new Error("User not found.");
//         }

//         const isValid = await bcrypt.compare(
//           credentials.password,
//           user[0].passwordHash!,
//         );
//         console.log("ISVALID??", isValid);

//         if (!isValid) return null;

//         return user[0];
//       },
//     }),
//   ],
// };

// /**
//  * Wrapper for `getServerSession` so that you don't need to import the `authOptions` in every file.
//  *
//  * @see https://next-auth.js.org/configuration/nextjs
//  */
// export const getServerAuthSession = () => getServerSession(authOptions);
