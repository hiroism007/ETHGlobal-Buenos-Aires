import { PrismaClient, SalaryRule } from '@prisma/client';

export class SalaryRuleService {
    constructor(private prisma: PrismaClient) { }

    async getRuleByUserId(userId: string): Promise<SalaryRule | null> {
        return this.prisma.salaryRule.findUnique({
            where: { userId },
        });
    }

    async upsertRule(userId: string, data: { dayOfMonth: number, convertPercent: number }): Promise<SalaryRule> {
        if (data.dayOfMonth < 1 || data.dayOfMonth > 31) throw new Error("Invalid dayOfMonth");
        if (data.convertPercent < 0 || data.convertPercent > 100) throw new Error("Invalid convertPercent");

        return this.prisma.salaryRule.upsert({
            where: { userId },
            update: data,
            create: { userId, ...data },
        });
    }
}
