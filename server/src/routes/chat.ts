import { Hono } from 'hono'
import { getServices } from '../lib/services'
import { ChatRequestDTO } from '../types'

const app = new Hono()

app.post('/', async (c) => {
    try {
        const { agentService } = getServices()

        const body = await c.req.json()
        const validation = ChatRequestDTO.safeParse(body)

        if (!validation.success) {
            return c.json({ error: validation.error.issues }, 400)
        }

        const { userId, message } = validation.data
        const response = await agentService.handleChatMessage(userId, message)

        // Wrap response to match spec/Next.js behavior
        return c.json({
            reply: typeof response === 'string' ? response : JSON.stringify(response),
        })

    } catch (error: any) {
        console.error("Chat API Error:", error)
        return c.json({ error: error.message }, 500)
    }
})

export default app

