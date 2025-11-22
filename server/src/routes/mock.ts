import { Hono } from 'hono'

const app = new Hono()

app.get('/rate/:source', async (c) => {
    const source = c.req.param('source')
    const authHeader = c.req.header('Authorization')

    // MVP: Simple check if Authorization header exists (simulating payment proof)
    // In real x402, we would verify the token/signature.
    if (authHeader) {
        // Payment received (or simulated)
        let rate = "1000.0"
        if (source === 'blue') rate = "1250.0"
        if (source === 'mep') rate = "1300.0"
        if (source === 'ccl') rate = "1180.0"

        return c.json({
            source: `${source.toUpperCase()} Mock`,
            rate: rate
        })
    }

    // 402 Payment Required
    const paymentDetails = {
        network: "polygon-amoy",
        token: process.env.POLYGON_AMOY_USDC_ADDRESS || "0x41e94eb019c0762f9bfcf9fb1e58725bfb0e7582",
        amount: "0.01", // 0.01 USDC
        recipient: process.env.MOCK_API_RECIPIENT_ADDRESS || "0x0000000000000000000000000000000000000000"
    }

    return c.json(
        { error: "Payment Required", paymentDetails },
        402
    )
})

export default app

