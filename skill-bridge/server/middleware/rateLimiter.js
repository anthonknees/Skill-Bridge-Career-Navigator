import { rateLimit } from 'express-rate-limit'

const isTest = process.env.NODE_ENV === 'test'

export const generalLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: isTest ? 10000 : 50,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests, please try again later.' },
})

export const aiLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: isTest ? 10000 : 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests to AI endpoint, please try again later.' },
})
