import type { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import { neon } from "@neondatabase/serverless";
import crypto from "crypto";

if (!process.env.DATABASE_URL) {
  throw new Error("FATAL: DATABASE_URL environment variable is not set.");
}
const sql = neon(process.env.DATABASE_URL!);

if (!process.env.NEXTAUTH_SECRET) {
  throw new Error("FATAL: NEXTAUTH_SECRET environment variable is not set.");
}
const token = process.env.NEXTAUTH_SECRET;

export const authOptions: NextAuthOptions = {
  secret: token,
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
    }),
  ],
  callbacks: {
    async signIn({ user }) {
      if (!user.email) return false;

      try {
        // Check if user exists
        const result = await sql`
          SELECT * FROM users WHERE email = ${user.email}
        `;

        // If user doesn't exist, create a new user
        if (result.length === 0) {
          // user.id is expected to be populated by NextAuth.js from the Google user profile.
          // crypto.randomUUID() is used as a fallback to generate a unique ID
          // if user.id is not available (e.g., for a new user where the mapping might not yet have occurred or is unexpected).
          // This ensures that a unique ID is always available for the user record in the database.
          const userId = user.id || crypto.randomUUID();
          await sql`
            INSERT INTO users (id, name, email, image)
            VALUES (${userId}, ${user.name}, ${user.email}, ${user.image})
          `;
          user.id = userId; // Ensure user object has the ID
        } else {
          user.id = result[0].id; // Set user ID from database
        }

        return true;
      } catch (error) {
        console.error("Error during sign in:", error);
        throw error;
      }
    },
    async jwt({ token, user }) {
      if (user && user.id) {
        token.id = user.id; // Store user ID in token
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user && token.id) {
        session.user.id = token.id; // Assign user ID to session
      }
      return session;
    },
  },
  pages: {
    signIn: "/login",
  },
  session: {
    strategy: "jwt",
  },
};