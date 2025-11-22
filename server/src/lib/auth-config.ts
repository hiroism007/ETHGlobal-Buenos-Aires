import Google from "@auth/core/providers/google"
import { PrismaAdapter } from "@auth/prisma-adapter"
import { prisma } from "./prisma"
import { initServices, getServices } from "./services"
import { AuthConfig } from "@auth/core"

export const authConfig: AuthConfig = {
  adapter: PrismaAdapter(prisma),
  providers: [
    Google({
        clientId: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        allowDangerousEmailAccountLinking: true,
    }),
  ],
  session: { strategy: "jwt" },
  callbacks: {
    session({ session, token }) {
        if (session.user && token.sub) {
            session.user.id = token.sub;
        }
        return session;
    }
  },
  events: {
    async createUser({ user }) {
      console.log("New user created:", user.id, user.email);
      try {
        // Ensure services are initialized
        await initServices();
        const { walletService } = getServices();
        
        if (!user.id) throw new Error("User ID is missing");

        // Create Wallet using Coinbase CDP SDK
        const { walletId, address, seed } = await walletService.createWallet();
        
        // Update User with Wallet Info
        await prisma.user.update({
            where: { id: user.id },
            data: {
                walletId: walletId,
                walletData: seed || null,
                embeddedWalletAddress: address, // Sync address to legacy/frontend field
            }
        });
        console.log(`Assigned wallet ${walletId} (${address}) to user ${user.id}`);
      } catch (error) {
          console.error("Failed to create wallet for new user:", error);
          // Consider retry logic or alerting here
      }
    },
  },
  trustHost: true, // Needed for behind proxy or Hono if host header isn't standard? Usually safe to set if we trust the env.
}

