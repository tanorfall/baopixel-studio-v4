import { NextRequest, NextResponse } from 'next/server'

export const runtime = 'edge'

export async function POST(req: NextRequest) {
  const token = process.env.NOTION_TOKEN
  if (!token) return NextResponse.json({ ok: false, error: 'NO_TOKEN' })

  try {
    const { pageId } = await req.json()
    const r = await fetch(`https://api.notion.com/v1/pages/${pageId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
        'Notion-Version': '2022-06-28',
      },
      body: JSON.stringify({ properties: { État: { status: { name: 'Publié' } } } }),
    })
    return NextResponse.json({ ok: r.ok })
  } catch {
    return NextResponse.json({ ok: false })
  }
}
