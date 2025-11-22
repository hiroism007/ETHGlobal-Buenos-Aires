import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['server/test/**/*.test.ts'],
    // setupFiles: ['server/test/setup.ts'], 
    hookTimeout: 30000, 
    env: {
        AUTH_SECRET: "dummy-secret-for-tests",
        DATABASE_URL: process.env.DATABASE_URL || "file:./dev.db"
    }
  },
})
