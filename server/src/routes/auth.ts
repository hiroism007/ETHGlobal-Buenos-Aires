import { Hono } from 'hono'
import { z } from 'zod'
import { verifyMessage } from 'viem'
import { PrismaClient } from '@prisma/client'

const app = new Hono()
const prisma = new PrismaClient()

// Validation schemas
const LoginRequestDTO = z.object({
    address: z.string().refine(val => /^0x[a-fA-F0-9]{40}$/.test(val), "Invalid address format"),
    signature: z.string().min(1, "Signature required"),
})

app.post('/login', async (c) => {
    try {
        const body = await c.req.json()
        const validation = LoginRequestDTO.safeParse(body)

        if (!validation.success) {
            return c.json({ error: validation.error.issues }, 400)
        }

        const { address, signature } = validation.data
        const normalizedAddress = address.toLowerCase()

        // 1. Verify Signature
        // The message must match exactly what the frontend signs.
        // For MVP simplicity, we use a static message or "Login to DolarBlue".
        // Ideally, this should include a nonce to prevent replay attacks.
        const message = "Login to DolarBlue"
        
        const valid = await verifyMessage({
            address: address as `0x${string}`,
            message: message,
            signature: signature as `0x${string}`,
        })

        if (!valid) {
            return c.json({ error: "Invalid signature" }, 401)
        }

        // 2. Find or Create User
        let user = await prisma.user.findUnique({
            where: { embeddedWalletAddress: normalizedAddress } // Check schema @unique
        })

        let isNewUser = false
        if (!user) {
            // Create new user
            isNewUser = true
            user = await prisma.user.create({
                data: {
                    embeddedWalletAddress: normalizedAddress,
                    name: `User ${normalizedAddress.slice(0, 6)}`,
                }
            })
        }

        // 3. Return Session Info (Just userId for MVP)
        return c.json({
            userId: user.id,
            isNewUser,
            address: normalizedAddress
        })

    } catch (error: any) {
        console.error("Login error:", error)
        return c.json({ error: error.message }, 500)
    }
})

export default app

