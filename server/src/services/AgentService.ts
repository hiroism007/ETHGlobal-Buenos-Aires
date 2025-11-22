import { AgentKit } from '@coinbase/agentkit';
import { getLangChainTools } from '@coinbase/agentkit-langchain';
import { ChatOpenAI } from '@langchain/openai';
import { createToolCallingAgent, AgentExecutor } from 'langchain/agents';
import { ChatPromptTemplate } from "@langchain/core/prompts";
import { DynamicStructuredTool } from '@langchain/core/tools';
import { SalaryRuleService } from './SalaryRuleService';
import { createSetupSalaryRuleAction } from './tools/SetupSalaryRuleTool';

const SYSTEM_PROMPT = `You are DólarBlue Agent, a financial assistant for users in Argentina.
Respond in Argentine Spanish (use "vos" instead of "tú").

If the user agrees to a salary conversion proposal (e.g., says "OK" or "Yes" to a proposal):
- Do NOT execute any transaction yourself.
- Instruct the user to click the "Execute" button on the action card in the chat to sign the transaction securely.
- Explain that this is for their security (signing with their own wallet).

When the user expresses an intent to set up or change their salary conversion rules, use the 'setup_salary_rule' tool.
Be concise and helpful.`;

export class AgentService {
    private agentKit: AgentKit | null = null;
    private walletTools: any[] = [];
    private salaryRuleService: SalaryRuleService | null = null;

    async initialize(salaryRuleService: SalaryRuleService) {
        this.salaryRuleService = salaryRuleService;

        let walletProvider: any;

        if (process.env.CDP_API_KEY_ID && process.env.CDP_API_KEY_SECRET) {
            try {
                // Dynamic import to avoid static analysis error if type is missing
                const agentKitModule = await import('@coinbase/agentkit');
                const CdpWalletProvider = (agentKitModule as any).CdpWalletProvider || (agentKitModule as any).CdpEvmWalletProvider;
                
                if (CdpWalletProvider && typeof CdpWalletProvider.configureWithWallet === 'function') {
                    walletProvider = await CdpWalletProvider.configureWithWallet({
                        apiKeyName: process.env.CDP_API_KEY_ID,
                        apiKeyPrivateKey: process.env.CDP_API_KEY_SECRET.replace(/\\n/g, "\n"),
                        // networkId: "polygon-amoy", // Removed to avoid UrlRequiredError for now
                    });
                    console.log("CdpWalletProvider initialized successfully");
                }
            } catch (e) {
                console.warn("Failed to initialize CdpWalletProvider:", e);
            }
        }

        this.agentKit = await AgentKit.from({
            walletProvider,
            cdpApiKeyId: process.env.CDP_API_KEY_ID,
            cdpApiKeySecret: process.env.CDP_API_KEY_SECRET?.replace(/\\n/g, "\n"),
        });

        this.walletTools = await getLangChainTools(this.agentKit);
       console.log("AgentService initialized");
    }

    async handleChatMessage(userId: string, message: string) {
        if (!this.agentKit || !this.salaryRuleService) throw new Error("AgentService not initialized");

        const llm = new ChatOpenAI({
            model: 'gpt-4o-mini',
            apiKey: process.env.OPENAI_API_KEY
        });

        const actionConfig = createSetupSalaryRuleAction(this.salaryRuleService, userId);
        
        const salaryTool = new DynamicStructuredTool({
            name: actionConfig.name,
            description: actionConfig.description,
            schema: actionConfig.schema,
            func: actionConfig.invoke,
        });

        const tools = [...this.walletTools, salaryTool];

        const prompt = ChatPromptTemplate.fromMessages([
            ["system", SYSTEM_PROMPT],
            ["human", "{input}"],
            ["placeholder", "{agent_scratchpad}"],
        ]);

        const agent = await createToolCallingAgent({
            llm,
            tools,
            prompt,
        });

        const agentExecutor = new AgentExecutor({
            agent,
            tools,
        });

        const result = await agentExecutor.invoke({
            input: message,
        });

        return result.output;
    }
}
