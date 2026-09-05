async function handler(request, response) {
  if (request.method !== 'GET') {
    response.setHeader('Allow', 'GET')
    return response.status(405).json({ error: 'Method Not Allowed' })
  }

  const apiKey = process.env.JOOBLE_API_KEY
  if (!apiKey) {
    return response.status(500).json({ error: 'Brak konfiguracji JOOBLE_API_KEY' })
  }

  const keywords = String(request.query?.keywords || 'praca').trim().slice(0, 120)
  const location = String(request.query?.location || 'Polska').trim().slice(0, 120)
  const page = Math.min(100, Math.max(1, Number.parseInt(request.query?.page || '1', 10) || 1))
  const radius = Math.min(100, Math.max(0, Number.parseInt(request.query?.radius || '0', 10) || 0))
  const salary = Math.max(0, Number.parseInt(request.query?.salary || '0', 10) || 0)
  const date = Math.min(30, Math.max(0, Number.parseInt(request.query?.date || '0', 10) || 0))
  const sort = ['date', 'salary', 'relevance'].includes(request.query?.sort) ? request.query.sort : 'relevance'
  const category = String(request.query?.category || '').trim().slice(0, 80)
  const workMode = String(request.query?.workMode || '').trim().slice(0, 40)

  try {
    const joobleResponse = await fetch(`https://jooble.org/api/${encodeURIComponent(apiKey)}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ keywords, location, page, radius, salary, date, sort, category, workMode }),
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
