import OpenAI from 'openai';
import { ProposalDetails } from '../types';
import Decimal from 'decimal.js';

export class LlmService {
    private openai: OpenAI;

    constructor() {
        this.openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    }

    async buildSalaryProposalMessage(details: ProposalDetails): Promise<string> {
        const { bestRate, allRates, amountUsdc, convertPercent } = details;

        const prompt = `Generate a concise proposal message in Argentine Spanish (use "vos").
    Inform the user about the result of the Adaptive Rate Strategy (ARS).
    Current Rates: ${allRates.map(r => `${r.source}: ${r.rateArsPerUsdc.toFixed(2)}`).join(', ')}.
    Best Rate Selected: ${bestRate.source} (${bestRate.rateArsPerUsdc.toFixed(2)} ARS/USDC).
    Action: Convert ${convertPercent}% of salary.
    Result: User will receive approximately ${amountUsdc.toFixed(2)} USDC.
    Tone: Professional yet friendly.`;

        try {
            const completion = await this.openai.chat.completions.create({
                model: "gpt-4o-mini",
                messages: [{ role: "system", content: prompt }],
                max_tokens: 150,
            });
            return completion.choices[0].message.content || "Proposal generated.";
        } catch (error) {
            console.error("LLM generation failed:", error);
            return `¡Hola! Comparamos Blue, MEP y CCL. La mejor tasa hoy es ${bestRate.source} (${bestRate.rateArsPerUsdc.toFixed(2)} ARS/USDC). Si convertimos el ${convertPercent}%, recibirás aprox ${amountUsdc.toFixed(2)} USDC. ¿Lo hacemos?`;
        }
    }
}
