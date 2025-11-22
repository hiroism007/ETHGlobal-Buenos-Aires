import { PrismaClient } from '@prisma/client';
import { RateService } from './RateService';
import { SalaryRuleService } from './SalaryRuleService';
import { CdpWalletService } from './CdpWalletService';
import { LlmService } from './LlmService';
import { ProposalDetails } from '../types';
import { Address } from 'viem';
import Decimal from 'decimal.js';

// Define Status constants since Enum is not supported in SQLite
export const ProposalStatus = {
    PENDING: 'PENDING',
    EXECUTED: 'EXECUTED',
    SKIPPED: 'SKIPPED',
    FAILED: 'FAILED'
} as const;

export class ProposalService {
    constructor(
        private prisma: PrismaClient,
        private rateService: RateService,
        private ruleService: SalaryRuleService,
        private walletService: CdpWalletService,
        private llmService: LlmService
    ) { }

    async generateProposal(userId: string) {
        const rule = await this.ruleService.getRuleByUserId(userId);
        if (!rule || !rule.isActive) return null;

        // 1. ARS Execution
        const { bestRate, allRates } = await this.rateService.getOptimizedRate();

        // 2. Calculation Logic
        const salaryAmountArs = new Decimal(process.env.FIXED_SALARY_AMOUNT_ARS || "150000");
        const convertPercent = rule.convertPercent;
        const convertArs = salaryAmountArs.mul(convertPercent).div(100);
        // Calculate USDC amount (round to 6 decimal places)
        const amountUsdc = convertArs.div(bestRate.rateArsPerUsdc).toDecimalPlaces(6, Decimal.ROUND_HALF_UP);

        const details: ProposalDetails = {
            salaryAmountArs, convertPercent, convertArs, amountUsdc, bestRate, allRates
        };

        // 3. Proposal Text Generation (LLM)
        const assistantText = await this.llmService.buildSalaryProposalMessage(details);

        // 4. DB Save (status: PENDING)
        // SQLite stores JSON as String
        const detailsForDb = JSON.stringify(details);

        const proposal = await this.prisma.proposal.create({
            data: {
                userId,
                details: detailsForDb,
                status: ProposalStatus.PENDING,
            }
        });

        return { proposalId: proposal.id, assistantText, details };
    }

    async executeProposal(userId: string, proposalId: string, userWalletAddress: Address) {
        const proposal = await this.prisma.proposal.findUnique({ where: { id: proposalId, userId } });
        if (!proposal || proposal.status !== ProposalStatus.PENDING) {
            throw new Error("Invalid proposal state.");
        }

        // Parse JSON string from SQLite
        const rawDetails = JSON.parse(proposal.details) as any;
        const amountUsdcDecimal = new Decimal(rawDetails.amountUsdc);

        // 1. Execute USDC Transfer (Server Wallet -> User Embedded Wallet)
        const txHash = await this.walletService.sendUsdc({
            to: userWalletAddress,
            amountUsdc: amountUsdcDecimal
        });

        // 2. Update DB (status: EXECUTED)
        await this.prisma.proposal.update({
            where: { id: proposalId },
            data: {
                status: ProposalStatus.EXECUTED,
                txHash,
                executedAt: new Date()
            }
        });

        return {
            status: "executed",
            txHash,
            explorerUrl: `https://amoy.polygonscan.com/tx/${txHash}`
        };
    }

    async skipProposal(proposalId: string) {
        await this.prisma.proposal.update({
            where: { id: proposalId },
            data: {
                status: ProposalStatus.SKIPPED
            }
        });

        return { status: "skipped" };
    }
}
