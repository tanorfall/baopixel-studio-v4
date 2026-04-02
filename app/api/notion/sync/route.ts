import { NextResponse } from 'next/server'

export const runtime = 'edge'

const NOTION_DBS = [
  { id: process.env.NOTION_DB_BAOPIXEL || '', name: 'BaoPixel' },
  { id: process.env.NOTION_DB_AVRIL2026 || '', name: 'Avril 2026' },
]

function getUpcomingFilter() {
  const now = new Date()
  const future = new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000)
  return {
    filter: {
      and: [
        { property: 'Date de publication', date: { on_or_after: now.toISOString().slice(0, 10) } },
        { property: 'Date de publication', date: { on_or_before: future.toISOString().slice(0, 10) } },
        { property: 'État', status: { does_not_equal: 'Publié' } },
      ],
    },
    sorts: [{ property: 'Date de publication', direction: 'ascending' }],
  }
}

async function queryNotion(dbId: string, body: object, token: string) {
  try {
    const r = await fetch(`https://api.notion.com/v1/databases/${dbId}/query`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
        'Notion-Version': '2022-06-28',
      },
      body: JSON.stringify(body),
    })
    if (!r.ok) return []
    const d = await r.json()
    return d.results || []
  } catch {
    return []
  }
}

async function saveToSupabase(posts: any[]) {
  try {
    const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
    const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    
    if (!SUPABASE_URL || !SUPABASE_KEY) return false
    
    // Supprimer et insérer les posts
    await fetch(`${SUPABASE_URL}/rest/v1/posts`, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${SUPABASE_KEY}`,
        apikey: SUPABASE_KEY,
      },
    })
    
    const res = await fetch(`${SUPABASE_URL}/rest/v1/posts`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${SUPABASE_KEY}`,
        apikey: SUPABASE_KEY,
      },
      body: JSON.stringify(posts),
    })
    
    return res.ok
  } catch {
    return false
  }
}

export async function GET() {
  const token = process.env.NOTION_TOKEN
  if (!token) {
    return NextResponse.json({ posts: [], error: 'NO_TOKEN' })
  }

  try {
    // Fetch posts from all Notion databases
    const postsRaw = await Promise.all(
      NOTION_DBS.map((db) => queryNotion(db.id, getUpcomingFilter(), token))
    )

    const posts: any[] = []
    NOTION_DBS.forEach((db, i) => {
      ;(postsRaw[i] as any[]).forEach((r) => {
        const p = r.properties || {}
        posts.push({
          id: r.id,
          name: p['Nom du contenu']?.title?.[0]?.text?.content || 'Sans titre',
          pub: p['Date de publication']?.date?.start || '',
          platform: p['Plateforme']?.multi_select?.[0]?.name || '',
          type: p['Type de contenu']?.select?.name || '',
          status: p['État']?.status?.name || '',
          source: db.name,
          client: p['Client']?.select?.name || db.name,
        })
      })
    })

    // Save to Supabase
    await saveToSupabase(posts)

    return NextResponse.json({ posts, synced: true })
  } catch (e) {
    console.error('Sync error:', e)
    return NextResponse.json({ posts: [], error: 'SYNC_ERROR' })
  }
}

    const tasksRaw = await queryNotion(
      TASKS_DB,
      {
        filter: { property: 'État', status: { does_not_equal: 'Fait' } },
        sorts: [{ property: 'Échéance', direction: 'ascending' }],
        page_size: 20,
      },
      token
    )

    const tasks = tasksRaw.map((r: any) => {
      const p = r.properties || {}
      return {
        id: r.id,
        title:
          p['Nom de la tâche']?.title?.[0]?.text?.content ||
          p['Name']?.title?.[0]?.text?.content ||
          'Tâche',
        due: p['Échéance']?.date?.start || '',
        status: p['État']?.status?.name || '',
      }
    })

    return NextResponse.json({
      posts,
      tasks,
      synced: new Date().toISOString(),
    })
  } catch (e) {
    return NextResponse.json({ posts: [], tasks: [], error: 'FETCH_ERROR' })
  }
}
