import { describe, it, expect, beforeAll, vi, afterAll } from 'vitest'
import app from '../src/index'
import { createTestWallet } from './utils'
import { PrismaClient } from '@prisma/client'

// Mock dependencies that hit external APIs
vi.mock('../src/services/CdpWalletService', () => {
  return {
    CdpWalletService: class {
      async init() {}
      async getWalletClient() { return {} }
      async sendUsdc() { return "0x" + "e".repeat(64) } // Mock TxHash
    }
  }
})

vi.mock('../src/services/X402Service', () => {
    return {
        X402Service: class {
            async init() {}
            async fetchJsonWithPayment(url: string) {
                // Return mock rates based on URL
                if (url.includes('blue')) return { rate: '1200' }
                if (url.includes('mep')) return { rate: '1150' } // Best rate
                if (url.includes('ccl')) return { rate: '1180' }
                return { rate: '1000' }
            }
        }
    }
})

vi.mock('../src/services/LlmService', () => {
  return {
    LlmService: class {
      async buildSalaryProposalMessage() {
        return "Mock Proposal Message: Based on MEP rate (1150), you will get 100 USDC."
      }
    }
  }
})

// Import initServices AFTER mocks are defined
import { initServices } from '../src/lib/services'

describe('DolarBlue Server Integration Test', () => {
  let userId: string
  let walletAddress: string
  let testWallet: ReturnType<typeof createTestWallet>
  let proposalId: string
  let prisma: PrismaClient

  beforeAll(async () => {
    // Initialize Prisma
    prisma = new PrismaClient()

    // Initialize services manually for test environment
    // This will use the MOCKED classes above because of vi.mock
    // Ensure we only initialize once
    await initServices()

    // Initialize test wallet
    testWallet = createTestWallet()
    walletAddress = testWallet.address
    
    // Clean up previous test data if any
    try {
        await prisma.user.deleteMany({ where: { embeddedWalletAddress: walletAddress.toLowerCase() } })
    } catch (e) {
        // Ignore if user doesn't exist
    }
  })

  afterAll(async () => {
      if (prisma) await prisma.$disconnect()
  })

  it('1. Auth Flow: Should login with wallet signature', async () => {
    const message = "Login to DolarBlue"
    const signature = await testWallet.signMessage(message)

    const res = await app.request('/api/auth/wallet/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        address: walletAddress,
        signature
      })
    })

    if (res.status !== 200) {
        console.error("Auth Error:", await res.text()) // Changed to text() to see raw error
    }

    expect(res.status).toBe(200)
    const data = await res.json()
    
    expect(data).toHaveProperty('userId')
    expect(data.address).toBe(walletAddress.toLowerCase())
    
    userId = data.userId
    console.log('Authenticated User ID:', userId)
  })

  it('2. Settings Flow: Should save salary rules', async () => {
    // Check if userId is set from previous test
    expect(userId).toBeDefined()

    const res = await app.request('/api/salary/settings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId,
        dayOfMonth: 25,
        convertPercent: 50
      })
    })
    
    if (res.status !== 200) {
        console.error("Settings Error:", await res.json())
    }

    expect(res.status).toBe(200)
    const data = await res.json()
    expect(data.dayOfMonth).toBe(25)
    expect(data.convertPercent).toBe(50)
    expect(data.userId).toBe(userId)

    // Verify GET
    const getRes = await app.request(`/api/salary/settings?userId=${userId}`)
    const getData = await getRes.json()
    expect(getData.convertPercent).toBe(50)
  })

  it('3. Proposal Flow: Should generate a proposal', async () => {
    expect(userId).toBeDefined()

    const res = await app.request('/api/salary/propose', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId })
    })

    if (res.status !== 200) {
        console.error("Propose Error:", await res.json())
    }

    expect(res.status).toBe(200)
    const data = await res.json()
    
    expect(data).toHaveProperty('proposalId')
    expect(data).toHaveProperty('details')
    expect(data.assistantText).toContain('Mock Proposal Message')
    
    proposalId = data.proposalId
    console.log('Generated Proposal ID:', proposalId)
    
    // Verify calculations
    // Salary: 150,000 (Fixed Env)
    // Convert: 50% = 75,000
    // Best Rate (MEP): 1150 (Mocked)
    // Expected USDC: 75000 / 1150 = 65.217391
    const details = data.details
    expect(details.bestRate.source).toBe('MEP')
    expect(Number(details.amountUsdc)).toBeCloseTo(65.217391, 4)
  })

  it('4. Execution Flow: Should execute the proposal', async () => {
      expect(userId).toBeDefined()
      expect(proposalId).toBeDefined()

      // Use a random hash to avoid unique constraint violations
      // Make sure it's long enough (64 chars) + 0x prefix
      const randomHex = Math.random().toString(16).substr(2) + Math.random().toString(16).substr(2)
      const arsTxHash = "0x" + (randomHex + "0".repeat(64)).slice(0, 64)
      
      const res = await app.request('/api/salary/execute', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
              userId,
              proposalId,
              action: 'confirm',
              userWalletAddress: walletAddress,
              arsTxHash
          })
      })
      
      if (res.status !== 200) {
        console.error("Execution Error:", await res.json())
      }

      expect(res.status).toBe(200)
      const data = await res.json()
      
      expect(data.status).toBe('executed')
      expect(data).toHaveProperty('txHash')
      expect(data.txHash).toMatch(/^0x[a-fA-F0-9]{64}$/) // Check if it's a valid-looking hash
  })

  it('5. Execution Flow: Should fail if already executed', async () => {
    expect(userId).toBeDefined()
    expect(proposalId).toBeDefined()

    const randomHex = Math.random().toString(16).substr(2) + Math.random().toString(16).substr(2)
    const arsTxHash = "0x" + (randomHex + "f".repeat(64)).slice(0, 64)
    
    const res = await app.request('/api/salary/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            userId,
            proposalId,
            action: 'confirm',
            userWalletAddress: walletAddress,
            arsTxHash
        })
    })

    // Should return 500 or 400 because state is not PENDING
    // The implementation throws "Invalid proposal state." -> 500
    expect(res.status).toBe(500)
    const data = await res.json()
    expect(data.error).toContain('Invalid proposal state')
  })
})
