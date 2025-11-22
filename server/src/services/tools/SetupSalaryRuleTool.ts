import { z } from 'zod';
import { SalaryRuleService } from '../SalaryRuleService';

export const createSetupSalaryRuleAction = (salaryRuleService: SalaryRuleService, userId: string) => ({
    name: 'setup_salary_rule',
    description: 'Set up or update the automatic salary dollarization rule based on user instructions in Spanish.',
    schema: z.object({
        dayOfMonth: z.number().int().min(1).max(31).describe('The day of the month (1-31).'),
        convertPercent: z.number().int().min(0).max(100).describe('The percentage to convert (0-100).'),
    }),
    invoke: async (args: any) => {
        const { dayOfMonth, convertPercent } = args;
        await salaryRuleService.upsertRule(userId, { dayOfMonth, convertPercent });
        return `Rule updated: ${convertPercent}% on day ${dayOfMonth}.`;
    }
});
