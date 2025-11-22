import { prisma } from './prisma';
import { CdpWalletService } from '../services/CdpWalletService';
import { X402Service } from '../services/X402Service';
import { SalaryRuleService } from '../services/SalaryRuleService';
import { RateService } from '../services/RateService';
import { LlmService } from '../services/LlmService';
import { ProposalService } from '../services/ProposalService';
import { AgentService } from '../services/AgentService';

// Lazy singleton instances - only created when getServices() is called
let servicesInstance: {
    walletService: CdpWalletService;
    x402Service: X402Service;
    salaryRuleService: SalaryRuleService;
    rateService: RateService;
    llmService: LlmService;
    proposalService: ProposalService;
    agentService: AgentService;
} | null = null;

let initialized = false;

// Get or create services
function getServicesInternal() {
    if (!servicesInstance) {
        const walletService = new CdpWalletService();
        const x402Service = new X402Service(walletService);
        const salaryRuleService = new SalaryRuleService(prisma);
        const rateService = new RateService(x402Service);
        const llmService = new LlmService();
        const proposalService = new ProposalService(prisma, rateService, salaryRuleService, walletService, llmService);
        const agentService = new AgentService();

        servicesInstance = {
            walletService,
            x402Service,
            salaryRuleService,
            rateService,
            llmService,
            proposalService,
            agentService
        };
    }
    return servicesInstance!;
}

export async function initServices() {
    if (initialized) return getServicesInternal();

    // Create services if not already created
    const services = getServicesInternal();

    // Initialize services that require async setup
    try {
        await services.walletService.init();
        await services.x402Service.init();
        await services.agentService.initialize(services.salaryRuleService);
        initialized = true;
        console.log("Services initialized successfully");
    } catch (error) {
        console.error("Failed to initialize services:", error);
        throw error;
    }

    return services;
}

// Export getters for services (lazy, will create if needed but not initialize)
export function getServices() {
    if (!initialized) {
        throw new Error("Services not initialized. Call initServices() first.");
    }
    return getServicesInternal();
}
