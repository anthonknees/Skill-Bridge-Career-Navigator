import 'dotenv/config'
import express from 'express'
import jobsRouter from './routes/jobs.js'
import analyzeRouter from './routes/analyze.js'
import roadmapRouter from './routes/roadmap.js'
import samplesRouter from './routes/samples.js'
import { generalLimiter, aiLimiter } from './middleware/rateLimiter.js'
import { sanitizeResumeInput } from './middleware/validation.js'

const app = express()
const PORT = process.env.PORT || 3001

app.use(express.json())
app.use('/api/', generalLimiter)

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' })
})

app.use('/api/jobs', jobsRouter)
app.use('/api/samples', samplesRouter)
app.use('/api/analyze-resume', aiLimiter, sanitizeResumeInput, analyzeRouter)
app.use('/api/generate-roadmap', aiLimiter, roadmapRouter)

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`)
})

export default app
