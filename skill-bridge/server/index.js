import 'dotenv/config'
import express from 'express'
import jobsRouter from './routes/jobs.js'

const app = express()
const PORT = process.env.PORT || 3001

app.use(express.json())

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' })
})

app.use('/api/jobs', jobsRouter)

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`)
})

export default app
