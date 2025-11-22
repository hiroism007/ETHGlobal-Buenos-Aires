import { CdpClient } from "@coinbase/cdp-sdk";
import { toAccount } from "viem/accounts";
import { createWalletClient, http, WalletClient, Address, parseUnits } from 'viem';
import { polygonAmoy } from 'viem/chains';
import Decimal from 'decimal.js';

export class CdpWalletService {
    private cdp: CdpClient | null = null;
    private clients: Map<string, WalletClient> = new Map();
    private usdcAddress: Address;
    private isMockMode = false;
    // Cache the default server wallet ID in memory if created dynamically
    private defaultServerWalletId: string | null = null;

    constructor() {
        this.usdcAddress = process.env.POLYGON_AMOY_USDC_ADDRESS as Address;
    }

    async init() {
        if (!process.env.CDP_API_KEY_ID || !process.env.CDP_API_KEY_SECRET) {
            console.warn("CDP keys missing, entering Mock Mode");
            this.isMockMode = true;
            return;
        }

        try {
            this.cdp = new CdpClient();
            // Pre-check if we can connect or default wallet exists?
            // Not necessary, lazy load is better.
        } catch (error) {
            console.warn("Failed to initialize CDP Client, falling back to Mock Mode:", error);
            this.isMockMode = true;
        }
    }

    /**
     * Creates a new Server Wallet (Managed) for a user.
     * Returns the wallet ID and address.
     */
    async createWallet(): Promise<{ walletId: string; address: string; seed?: string }> {
        if (this.isMockMode || !this.cdp) {
            // Mock Wallet
            const { generatePrivateKey, privateKeyToAccount } = require("viem/accounts");
            const mockAccount = privateKeyToAccount(generatePrivateKey());
            const mockId = "mock-" + Date.now() + "-" + Math.random().toString(36).substring(7);
            return { walletId: mockId, address: mockAccount.address, seed: "mock-seed" };
        }

        try {
            // Create a new account on the CDP
            // Assuming createAccount exists on the evm namespace or similar.
            // If strict typing fails, we use 'any'.
            // Note: Defaulting to Polygon Amoy if networkId is required.
            const account = await (this.cdp.evm as any).createAccount({
                networkId: 'polygon-amoy'
            });

            return {
                walletId: account.id,
                address: account.address,
                // Server Wallets usually don't expose seed, so it might be undefined.
            };
        } catch (error) {
            console.error("Failed to create CDP wallet:", error);
            throw error;
        }
    }

    /**
     * Gets a viem WalletClient for a specific wallet ID.
     * If no walletId is provided, it tries to retrieve the 'Server Wallet' (funding source for operations).
     */
    async getWalletClient(walletId?: string): Promise<WalletClient> {
        if (this.isMockMode) {
            return this.getMockClient();
        }

        let targetId = walletId || process.env.CDP_SERVER_WALLET_ID || this.defaultServerWalletId;
        
        // If no ID is available (neither passed nor env), create one dynamically for this session
        if (!targetId) {
            console.log("No CDP_SERVER_WALLET_ID found. Creating a new Server Wallet for this session...");
            const newWallet = await this.createWallet();
            this.defaultServerWalletId = newWallet.walletId;
            targetId = newWallet.walletId;
            console.log(`>>> Created Temporary Server Wallet: ${targetId} (${newWallet.address})`);
            console.log(`>>> PLEASE SAVE THIS ID TO .env AS CDP_SERVER_WALLET_ID TO PERSIST IT.`);
        }

        if (!targetId) throw new Error("No Wallet ID provided and failed to create one.");

        // Return cached client if exists
        if (this.clients.has(targetId)) {
            return this.clients.get(targetId)!;
        }

        if (!this.cdp) throw new Error("WalletService not initialized");

        try {
            const cdpAccount = await (this.cdp.evm as any).getAccount({ id: targetId });
            const viemAccount = toAccount(cdpAccount);
            
            const client = createWalletClient({
                account: viemAccount,
                chain: polygonAmoy,
                transport: http()
            });

            this.clients.set(targetId, client);
            return client;
        } catch (error) {
            console.error(`Failed to load wallet ${targetId}:`, error);
            throw error;
        }
    }

    private getMockClient(): WalletClient {
        const { generatePrivateKey, privateKeyToAccount } = require("viem/accounts");
        const mockAccount = privateKeyToAccount(generatePrivateKey());
        return createWalletClient({
            account: mockAccount,
            chain: polygonAmoy,
            transport: http()
        });
    }

    // Send USDC (Server Wallet -> Recipient)
    async sendUsdc(params: { to: Address; amountUsdc: Decimal; walletId?: string }): Promise<string> {
        if (this.isMockMode) {
            console.log(`[MOCK] Sending ${params.amountUsdc} USDC to ${params.to} from ${params.walletId || 'default'}`);
            return "0x" + "0".repeat(64); // Dummy hash
        }

        const client = await this.getWalletClient(params.walletId);

        const amountString = params.amountUsdc.toFixed(6);
        const amountWei = parseUnits(amountString, 6);

        try {
            const hash = await client.writeContract({
                address: this.usdcAddress,
                abi: [{
                    "type": "function",
                    "name": "transfer",
                    "inputs": [
                        { "name": "recipient", "type": "address" },
                        { "name": "amount", "type": "uint256" }
                    ],
                    "outputs": [{ "name": "", "type": "bool" }],
                    "stateMutability": "nonpayable"
                }],
                functionName: 'transfer',
                args: [params.to, amountWei],
                chain: polygonAmoy,
                account: client.account!
            });

            return hash;
        } catch (error) {
            console.error("Send USDC failed:", error);
            throw error;
        }
    }
}
