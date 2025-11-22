import { serve } from '@hono/node-server'
import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { logger } from 'hono/logger'
import { initServices } from './lib/services'
import * as dotenv from 'dotenv'
import { authHandler, initAuthConfig } from '@hono/auth-js'
import { authConfig } from './lib/auth-config'

// Import routes
import chatRoute from './routes/chat'
import salaryRoute from './routes/salary'
import mockRoute from './routes/mock'
import authRoute from './routes/auth'

dotenv.config()

const app = new Hono()

app.use('*', logger())
app.use('*', cors({
  origin: process.env.ALLOWED_ORIGIN || 'http://localhost:5173',
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
}))

// Auth Middleware
// Skip Auth.js middleware in tests to avoid UnknownAction error on non-standard routes
if (process.env.NODE_ENV !== 'test') {
  app.use('*', initAuthConfig((c) => authConfig))
  app.use('/api/auth/*', authHandler())
}

// API Routes
app.route('/api/chat', chatRoute)
app.route('/api/salary', salaryRoute)
app.route('/api/mock', mockRoute)
app.route('/api/auth/wallet', authRoute)

app.get('/', (c) => {
  return c.text('DolarBlue Agent Server is running!')
})

const port = 3000
console.log(`Server is starting on port ${port}...`)

// Initialize services then start server
// Only run if not imported as a module (for tests)
if (process.env.NODE_ENV !== 'test') {
  initServices().then(() => {
    serve({
      fetch: app.fetch,
      port
    }, (info) => {
      console.log(`Server is running on http://localhost:${info.port}`)
    })
  }).catch((err) => {
    console.error('Failed to initialize services:', err)
    process.exit(1)
  })
}

export default app
