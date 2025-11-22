import { Hono } from 'hono'
import { getServices } from '../lib/services'
import { SaveSettingsDTO, ProposeRequestDTO, ExecuteRequestDTO } from '../types'

const app = new Hono()

// GET /settings?userId=...
app.get('/settings', async (c) => {
    try {
        const { salaryRuleService } = getServices()
        const userId = c.req.query('userId')

        if (!userId) {
            return c.json({ error: "userId is required" }, 400)
        }

        const rule = await salaryRuleService.getRuleByUserId(userId)
        return c.json(rule || {})
    } catch (error: any) {
        return c.json({ error: error.message }, 500)
    }
})

// POST /settings
app.post('/settings', async (c) => {
    try {
        const { salaryRuleService } = getServices()
        const body = await c.req.json()
        const validation = SaveSettingsDTO.safeParse(body)

        if (!validation.success) {
            return c.json({ error: validation.error.issues }, 400)
        }

        const { userId, dayOfMonth, convertPercent } = validation.data
        const rule = await salaryRuleService.upsertRule(userId, { dayOfMonth, convertPercent })

        return c.json(rule)
    } catch (error: any) {
        return c.json({ error: error.message }, 500)
    }
})

// POST /propose
app.post('/propose', async (c) => {
    try {
        const { proposalService } = getServices()
        const body = await c.req.json()
        const validation = ProposeRequestDTO.safeParse(body)

        if (!validation.success) {
            return c.json({ error: validation.error.issues }, 400)
        }

        const { userId } = validation.data
        const proposal = await proposalService.generateProposal(userId)

        return c.json(proposal)
    } catch (error: any) {
        return c.json({ error: error.message }, 500)
    }
})

// POST /execute
app.post('/execute', async (c) => {
    try {
        const { proposalService } = getServices()
        const body = await c.req.json()
        const validation = ExecuteRequestDTO.safeParse(body)

        if (!validation.success) {
            return c.json({ error: validation.error.issues }, 400)
        }

        const { userId, proposalId, action, userWalletAddress } = validation.data

        if (action === 'confirm') {
            if (!userWalletAddress) {
                return c.json({ error: 'userWalletAddress required for confirm' }, 400)
            }
            const result = await proposalService.executeProposal(userId, proposalId, userWalletAddress)
            return c.json(result)
        } else {
            const result = await proposalService.skipProposal(proposalId)
            return c.json(result)
        }
    } catch (error: any) {
        return c.json({ error: error.message }, 500)
    }
})

export default app

