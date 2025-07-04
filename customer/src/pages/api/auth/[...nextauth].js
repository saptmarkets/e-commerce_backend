import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import CustomerServices from "@services/CustomerServices";

export const authOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        try {
          if (!credentials?.email || !credentials?.password) {
            throw new Error("Email and password are required");
          }
          
          const response = await CustomerServices.loginCustomer({
            email: credentials.email,
            password: credentials.password,
          });

          if (response && response.token) {
            return {
              id: response._id,
              name: response.name,
              email: response.email,
              token: response.token,
              address: response.address || "",
              phone: response.phone || "",
              image: response.image || ""
            };
          }

          throw new Error("Invalid email or password");
        } catch (error) {
          console.error("Authentication error:", error);
          const message = error.response?.data?.message || error.message || "Authentication failed";
          throw new Error(message);
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.name = user.name;
        token.email = user.email;
        token.token = user.token;
        token.address = user.address;
        token.phone = user.phone;
        token.image = user.image;
      }
      return token;
    },
    async session({ session, token }) {
      if (token) {
        session.user = session.user || {};
        session.user.id = token.id;
        session.user.name = token.name;
        session.user.email = token.email;
        session.user.token = token.token;
        session.user.address = token.address;
        session.user.phone = token.phone;
        session.user.image = token.image;
      }
      return session;
    },
  },
  pages: {
    signIn: "/auth/login",
    error: "/auth/error",
    signOut: "/auth/login"
  },
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  secret: process.env.NEXTAUTH_SECRET || "your-secret-key-here",
  debug: process.env.NODE_ENV === "development",
  events: {
    async signIn(message) {
      console.log("User signed in:", message);
    },
    async signOut(message) {
      console.log("User signed out:", message);
    },
    async error(message) {
      console.error("Auth error:", message);
    }
  }
};

export default NextAuth(authOptions); 