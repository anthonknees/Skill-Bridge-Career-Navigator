const RESUME_MAX_CHARS = 10000

export function sanitizeResumeInput(req, res, next) {
  if (req.body.resumeText !== undefined) {
    req.body.resumeText = req.body.resumeText.trim()
    if (req.body.resumeText.length > RESUME_MAX_CHARS) {
      return res.status(413).json({ error: `resumeText exceeds maximum length of ${RESUME_MAX_CHARS} characters` })
    }
  }
  next()
}
