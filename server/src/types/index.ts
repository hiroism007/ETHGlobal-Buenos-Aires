import { z } from 'zod';
import { Address } from 'viem';
import Decimal from 'decimal.js';

// --- Domain Types ---
// 金額計算にはDecimal.jsを利用し、精度を担保する。

export type RateSource = 'Blue' | 'MEP' | 'CCL';
export type RateInfo = {
    source: RateSource;
    rateArsPerUsdc: Decimal; // ARS/USDCレート
};

export type OptimizedRateResult = {
    bestRate: RateInfo;
    allRates: RateInfo[];
};

// Proposal.detailsフィールドに対応する型
export type ProposalDetails = {
    salaryAmountArs: Decimal;
    convertPercent: number;
    convertArs: Decimal;
    amountUsdc: Decimal; // USDC額
    bestRate: RateInfo;
    allRates: RateInfo[];
};

// --- DTO Definitions (Zod Schemas) ---
// APIリクエストボディのバリデーションに使用

export const ChatRequestDTO = z.object({
    userId: z.string().uuid(),
    message: z.string().min(1),
});

export const SaveSettingsDTO = z.object({
    userId: z.string().uuid(),
    dayOfMonth: z.number().int().min(1).max(31),
    convertPercent: z.number().int().min(0).max(100),
});

export const ProposeRequestDTO = z.object({
    userId: z.string().uuid(),
});

export const ExecuteRequestDTO = z.object({
    userId: z.string().uuid(),
    proposalId: z.string().uuid(),
    action: z.enum(['confirm', 'skip']),
    // ユーザーのEmbedded Walletアドレス（送金先）
    userWalletAddress: z.string().refine((val): val is string => /^0x[a-fA-F0-9]{40}$/.test(val), {
        message: "Invalid Ethereum address",
    }).transform(val => val as Address).optional(),
    // ARS送金のTxHash（確認時用）
    arsTxHash: z.string().optional(),
});
