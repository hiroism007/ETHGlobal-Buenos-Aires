import { X402Service } from './X402Service';
import { RateInfo, OptimizedRateResult, RateSource } from '../types';
import Decimal from 'decimal.js';

export class RateService {
    private baseUrl = process.env.MOCK_RATE_API_BASE_URL || "http://localhost:3000/api/mock/rate";

    constructor(private x402Service: X402Service) { }

    async getOptimizedRate(): Promise<OptimizedRateResult> {
        const sources: { url: string, name: RateSource }[] = [
            { url: `${this.baseUrl}/blue`, name: "Blue" },
            { url: `${this.baseUrl}/mep`, name: "MEP" },
            { url: `${this.baseUrl}/ccl`, name: "CCL" }
        ];

        // 1. Fetch rates in parallel (autonomous payments handled by x402Service)
        const results = await Promise.all(sources.map(s => this.fetchRate(s.url, s.name)));

        // 2. Filter out failed requests
        const validRates = results.filter(r => r !== null) as RateInfo[];
        if (validRates.length === 0) throw new Error("ARS Failed: Could not fetch any rates.");

        // 3. Select the best rate (lowest ARS/USDC is better for buying USDC? No, wait.)
        // If I have ARS and want to buy USDC.
        // Exchange Rate: X ARS = 1 USDC.
        // If I have 1000 ARS.
        // Rate 1000: 1000/1000 = 1 USDC.
        // Rate 500: 1000/500 = 2 USDC.
        // So LOWER rate is better for the user (more USDC for same ARS).
        // "Blue" rate usually means how much ARS you need to buy 1 USD.
        // So yes, lower is better.

        const bestRate = validRates.reduce((min, current) =>
            current.rateArsPerUsdc.lt(min.rateArsPerUsdc) ? current : min
        );
        return { bestRate: bestRate, allRates: validRates };
    }

    private async fetchRate(url: string, source: RateSource): Promise<RateInfo | null> {
        try {
            // Mock API returns { source: string, rate: string }
            const data = await this.x402Service.fetchJsonWithPayment<{ rate: string }>(url);
            return { rateArsPerUsdc: new Decimal(data.rate), source: source };
        } catch (error) {
            console.error(`[ARS] Failed to fetch rate from ${source}:`, error);
            return null;
        }
    }
}
