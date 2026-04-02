// Client Supabase simplifié (fetch-based)
interface Post {
  id: string
  name: string
  pub: string
  platform: string
  type: string
  status: string
  source: string
  client: string
}

interface AppData {
  key: string
  value: any
}

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

async function supabaseQuery(table: string, method: string = 'GET', body?: any) {
  const url = `${SUPABASE_URL}/rest/v1/${table}`
  
  const res = await fetch(url, {
    method,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${SUPABASE_KEY}`,
      apikey: SUPABASE_KEY,
    },
    body: body ? JSON.stringify(body) : undefined,
  })
  
  if (!res.ok) {
    const err = await res.text()
    console.error(`Supabase error: ${res.status}`, err)
    return null
  }
  
  return await res.json()
}

// Posts API
export async function getPosts(): Promise<Post[]> {
  return (await supabaseQuery('posts?order=pub.asc')) || []
}

export async function insertPosts(posts: Post[]) {
  // Supprimer les anciens posts et insérer les nouveaux
  await supabaseQuery('posts', 'DELETE')
  return await supabaseQuery('posts', 'POST', posts)
}

// App Data API
export async function getAppData(key: string) {
  const res = await supabaseQuery(`app_data?key=eq.${key}`)
  return res?.[0]?.value || null
}

export async function saveAppData(key: string, value: any) {
  return await supabaseQuery('app_data', 'POST', [{ key, value }])
}

// Done Posts API
export async function getDonePosts(): Promise<string[]> {
  const res = await supabaseQuery('done_posts')
  return res?.map((r: any) => r.post_id) || []
}

export async function markPostDone(postId: string) {
  return await supabaseQuery('done_posts', 'POST', [{ post_id: postId }])
}

export async function unmarkPostDone(postId: string) {
  return await supabaseQuery(`done_posts?post_id=eq.${postId}`, 'DELETE')
}
