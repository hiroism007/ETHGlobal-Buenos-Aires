import { wrapFetchWithPayment, Signer } from "x402-fetch";
import { CdpWalletService } from "./CdpWalletService";

export class X402Service {
    private fetchWithPayment: typeof fetch | null = null;

    constructor(private walletService: CdpWalletService) { }

    async init() {
        try {
            const walletClient = await this.walletService.getWalletClient();
            // Wrap global fetch
            // Cast walletClient to Signer (assuming it satisfies the interface or x402 is flexible)
            this.fetchWithPayment = wrapFetchWithPayment(fetch, walletClient as unknown as Signer) as typeof fetch;
        } catch (error) {
            console.warn("X402Service: Failed to initialize wallet client, autonomous payments disabled.", error);
        }
    }

    async fetchJsonWithPayment<T>(url: string): Promise<T> {
        if (!this.fetchWithPayment) throw new Error("X402Service not initialized");

        const res = await this.fetchWithPayment(url);

        if (!res.ok) {
            throw new Error(`x402 fetch failed: ${res.status} ${res.statusText}`);
        }
        return res.json() as Promise<T>;
    }
}
