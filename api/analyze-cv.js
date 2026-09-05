const MAX_TEXT_LENGTH = 24000

async function fetchResumeText(url) {
  const parsed = new URL(url)
  if (!['http:', 'https:'].includes(parsed.protocol)) throw new Error('URL musi używać protokołu HTTP lub HTTPS')
  const response = await fetch(parsed, { headers: { Accept: 'application/pdf,text/plain,text/html' } })
  if (!response.ok) throw new Error('Nie udało się pobrać CV z podanego URL')
  const contentType = response.headers.get('content-type') || ''
  const buffer = Buffer.from(await response.arrayBuffer())
  if (contentType.includes('pdf') || parsed.pathname.toLowerCase().endsWith('.pdf')) {
    const pdfParse = (await import('pdf-parse')).default
    return (await pdfParse(buffer)).text.slice(0, MAX_TEXT_LENGTH)
  }
  return buffer.toString('utf8').replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').slice(0, MAX_TEXT_LENGTH)
}

module.exports = async function handler(request, response) {
  if (request.method !== 'POST') return response.status(405).json({ error: 'Method Not Allowed' })
  try {
    const { url } = request.body || {}
    if (!url) return response.status(400).json({ error: 'Podaj publiczny URL do CV' })
    const resumeText = await fetchResumeText(url)
    if (resumeText.trim().length < 80) return response.status(422).json({ error: 'Nie udało się odczytać wystarczającej treści CV' })

    const { generateObject } = await import('ai')
    const { gateway } = await import('@ai-sdk/gateway')
    const { z } = await import('zod')
    const result = await generateObject({
      model: gateway('openai/gpt-4.1-mini'),
      schema: z.object({
        summary: z.string(),
        targetRoles: z.array(z.string()).min(1).max(8),
        skills: z.array(z.string()).min(1).max(20),
        location: z.string().default('Polska'),
        seniority: z.string().default('mid'),
      }),
      prompt: `Przeanalizuj CV i zwróć profil kandydata po polsku. Nie wymyślaj danych. Wyciągnij role, umiejętności, lokalizację i poziom doświadczenia.\n\nCV:\n${resumeText}`,
    })
    return response.status(200).json({ profile: result.object })
  } catch (error) {
    console.error('[CV analysis]', error)
    return response.status(500).json({ error: error.message || 'Analiza CV nie powiodła się' })
  }
}
