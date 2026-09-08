async function handler(request, response) {
  if (request.method !== 'GET') {
    response.setHeader('Allow', 'GET')
    return response.status(405).json({ error: 'Method Not Allowed' })
  }

  const apiKey = process.env.API_KEY || process.env.JOOBLE_API_KEY
  if (!apiKey) {
    return response.status(500).json({ error: 'Brak konfiguracji klucza Jooble (API_KEY)' })
  }

  const keywords = String(request.query?.keywords || 'praca').trim().replace(/\s+/g, ' ').slice(0, 120)
  const location = String(request.query?.location || 'Polska').trim().replace(/\s+/g, ' ').slice(0, 120)
  const page = Math.max(1, Math.min(100, Number.parseInt(request.query?.page || '1', 10) || 1))

  try {
    const joobleResponse = await fetch(`https://jooble.org/api/${encodeURIComponent(apiKey)}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ keywords, location, page }),
    })

    if (!joobleResponse.ok) {
      return response.status(joobleResponse.status).json({ error: 'Jooble zwrócił błąd' })
    }

    const data = await joobleResponse.json()
    return response.status(200).json(data)
  } catch (error) {
    console.error('[Jooble API]', error)
    return response.status(502).json({ error: 'Nie udało się połączyć z Jooble' })
  }
}

module.exports = handler
