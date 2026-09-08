import { generateText } from 'ai'
import { gateway } from '@ai-sdk/gateway'

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Metoda niedozwolona' })
  const { type, context } = req.body || {}
  if (!['summary', 'experience', 'education', 'project'].includes(type) || typeof context !== 'string') return res.status(400).json({ error: 'Nieprawidłowe dane' })
  const safeContext = context.trim().slice(0, 4000)
  if (!safeContext) return res.status(400).json({ error: 'Uzupełnij informacje, aby AI mogło przygotować opis.' })
  try {
    const { text } = await generateText({
      model: gateway('openai/gpt-5-mini'),
      system: 'Jesteś polskim doradcą kariery. Pisz konkretnie, profesjonalnie i zgodnie z faktami podanymi przez użytkownika. Nie wymyślaj danych. Zwróć wyłącznie gotowy tekst bez wstępu i cudzysłowów.',
      prompt: `${type === 'summary' ? 'Napisz podsumowanie zawodowe do CV' : 'Napisz opis sekcji CV'} na podstawie: ${safeContext}. Użyj języka polskiego, 2-4 zdań i czasowników pokazujących wpływ.`
    })
    return res.status(200).json({ text: text.trim() })
  } catch (error) {
    console.error('[cv-description]', error)
    return res.status(500).json({ error: 'Nie udało się wygenerować opisu. Spróbuj ponownie.' })
  }
}
