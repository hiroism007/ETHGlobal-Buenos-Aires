import { generatePrivateKey, privateKeyToAccount } from 'viem/accounts'

export const createTestWallet = () => {
  const privateKey = generatePrivateKey()
  const account = privateKeyToAccount(privateKey)
  
  return {
    account,
    address: account.address,
    signMessage: async (message: string) => {
      return await account.signMessage({ message })
    }
  }
}

