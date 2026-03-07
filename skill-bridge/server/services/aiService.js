import OpenAI from 'openai'

function getClient() {
  return new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
}

export async function extractSkills(resumeText) {
  const client = getClient()
  const response = await client.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      {
        role: 'user',
        content: `You are a resume analysis assistant. Extract technical skills from the following resume text.

Return ONLY a JSON array of skill names. Be specific (e.g., "React" not "frontend frameworks").
Include programming languages, tools, platforms, frameworks, and methodologies.

Resume:
---
${resumeText}
---

Output format: ["skill1", "skill2", ...]`,
      },
    ],
  })

  const content = response.choices[0].message.content
  const parsed = JSON.parse(content)

  // Handle both ["skill1", ...] and {"skills": [...]} shaped responses
  if (Array.isArray(parsed)) return parsed
  const key = Object.keys(parsed).find(k => Array.isArray(parsed[k]))
  if (key) return parsed[key]
  return []
}
