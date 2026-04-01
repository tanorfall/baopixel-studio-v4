import { NextRequest, NextResponse } from 'next/server'

export const runtime = 'edge'

export async function POST(req: NextRequest) {
  try {
    const { prompt, system } = await req.json()
    
    const systemMsg = system || 'Tu es un expert en marketing digital et réseaux sociaux pour les agences africaines. Réponds en français de manière concise et professionnelle.'
    
    const r = await fetch('http://localhost:11434/api/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'mistral',
        messages: [
          { role: 'system', content: systemMsg },
          { role: 'user', content: prompt }
        ],
        stream: false,
        temperature: 0.7,
      }),
    })
    
    const d = await r.json()
    
    if (!r.ok) {
      return NextResponse.json({ 
        text: `⚠️ Ollama pas accessible (http://localhost:11434). Lancez: ollama run mistral` 
      })
    }
    
    return NextResponse.json({ text: d.message?.content || 'Erreur.' })
  } catch (e) {
    return NextResponse.json({ 
      text: `⚠️ Ollama ne répond pas. Installez d'abord: ollama.ai` 
    })
  }
}
