export interface Env {
  SUPABASE_URL: string;
  SUPABASE_SERVICE_ROLE_KEY: string;
}

type Visitor = {
  id: string;
  face_embedding: string;
  created_at: string;
};

type Club = {
  id: number;
  name: string;
  votes_count: number;
};

type Vote = {
  id: number;
  visitor_id: string;
  club_id: number;
};

async function supabaseRequest<T>(
  env: Env,
  path: string,
  init: RequestInit = {}
): Promise<{ data: T | null; error: string | null; status: number }> {
  const url = `${env.SUPABASE_URL}/rest/v1${path}`;
  const headers: HeadersInit = {
    apikey: env.SUPABASE_SERVICE_ROLE_KEY,
    Authorization: `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`,
    'Content-Type': 'application/json',
    ...(init.headers || {}),
  };

  const res = await fetch(url, { ...init, headers });
  const status = res.status;

  if (status === 204) return { data: null, error: null, status };

  let json: any = null;
  try { json = await res.json(); } catch { }

  if (!res.ok) {
    const message = (json && (json.message || json.error || JSON.stringify(json))) || `Supabase error (status ${status})`;
    return { data: null, error: message, status };
  }

  return { data: json as T, error: null, status };
}

async function handlePostVote(request: Request, env: Env): Promise<Response> {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Content-Type': 'application/json',
  };

  let body: any;
  try { body = await request.json(); } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON body' }), { status: 400, headers: corsHeaders });
  }

  const face_embedding = body?.face_embedding as number[] | undefined;
  const club_id = body?.club_id as number | undefined;

  if (!face_embedding || !club_id) {
    return new Response(JSON.stringify({ error: 'face_embedding and club_id are required' }), { status: 400, headers: corsHeaders });
  }

  const vectorString = `[${face_embedding.join(',')}]`;

  // 1. Search for similar faces using vector similarity (pgvector <=> operator)
  const { data: matched, error: matchError } = await supabaseRequest<Array<{ id: string, distance: number }>>(
    env,
    `/rpc/match_visitor`,
    {
      method: 'POST',
      body: JSON.stringify({ 
        p_embedding: vectorString, 
        p_threshold: 0.5 // Similarity threshold (Euclidean distance)
      }),
    }
  );

  if (matchError) {
    return new Response(JSON.stringify({ error: 'Failed to match face', detail: matchError }), { status: 500, headers: corsHeaders });
  }

  let visitor_id: string;

  if (matched && matched.length > 0) {
    visitor_id = matched[0].id;
  } else {
    // 2. Create new visitor with embedding
    const { data: insertedVisitors, error: insertVisitorError } = await supabaseRequest<Visitor[]>(
      env,
      `/visitors`,
      {
        method: 'POST',
        headers: { Prefer: 'return=representation' },
        body: JSON.stringify({ 
          face_embedding: vectorString,
          face_hash: `biometric-${Date.now()}` // Keeping this for backward compatibility if needed
        }),
      }
    );

    if (insertVisitorError || !insertedVisitors || insertedVisitors.length === 0) {
      return new Response(JSON.stringify({ error: 'Failed to create visitor', detail: insertVisitorError }), { status: 500, headers: corsHeaders });
    }
    visitor_id = insertedVisitors[0].id;
  }

  // 3. Record the vote (Unique constraint on visitor_id prevents double voting)
  const { data: insertedVotes, error: insertVoteError, status: voteStatus } = await supabaseRequest<Vote[]>(
    env,
    `/votes`,
    {
      method: 'POST',
      headers: { Prefer: 'return=representation' },
      body: JSON.stringify({ visitor_id, club_id }),
    }
  );

  if (voteStatus === 409 || (insertVoteError && insertVoteError.includes('duplicate'))) {
    return new Response(JSON.stringify({ error: 'Already voted' }), { status: 400, headers: corsHeaders });
  }

  if (insertVoteError) {
    return new Response(JSON.stringify({ error: 'Failed to create vote', detail: insertVoteError }), { status: 500, headers: corsHeaders });
  }

  // 4. Increment club votes_count
  const { error: incrementError } = await supabaseRequest<null>(
    env,
    `/rpc/increment_club_votes`,
    { method: 'POST', body: JSON.stringify({ p_club_id: club_id }) }
  );

  return new Response(JSON.stringify({ visitor_id }), { status: 200, headers: corsHeaders });
}

// Result and My Page handlers remain similar but need CORS headers
async function handleGetResults(env: Env): Promise<Response> {
  const { data: clubs, error } = await supabaseRequest<Club[]>(env, `/clubs?select=id,name,votes_count&order=votes_count.desc`);
  const headers = { 'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json' };
  if (error) return new Response(JSON.stringify({ error: 'Failed to fetch results', detail: error }), { status: 500, headers });
  return new Response(JSON.stringify({ clubs: clubs || [] }), { status: 200, headers });
}

async function handleGetMyPage(request: Request, env: Env): Promise<Response> {
  const url = new URL(request.url);
  const id = url.searchParams.get('id');
  const headers = { 'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json' };

  if (!id) return new Response(JSON.stringify({ error: 'id is required' }), { status: 400, headers });

  const { data: votes, error } = await supabaseRequest<Array<{ id: number; visitor_id: string; club_id: number; club: Club }>>(
    env,
    `/votes?visitor_id=eq.${id}&select=id,visitor_id,club_id,club:clubs(id,name,votes_count)&limit=1`
  );

  if (error) return new Response(JSON.stringify({ error: 'Failed to fetch my page', detail: error }), { status: 500, headers });

  if (!votes || votes.length === 0) {
    return new Response(JSON.stringify({ visitor_id: id, voted: false, club: null }), { status: 200, headers });
  }

  return new Response(JSON.stringify({ visitor_id: id, voted: true, club: votes[0].club }), { status: 200, headers });
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    const pathname = url.pathname;

    if (request.method === 'OPTIONS') {
      return new Response(null, {
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, apikey, Authorization',
        },
      });
    }

    if (pathname === '/api/vote' && request.method === 'POST') return handlePostVote(request, env);
    if (pathname === '/api/results' && request.method === 'GET') return handleGetResults(env);
    if (pathname === '/api/my-page' && request.method === 'GET') return handleGetMyPage(request, env);

    return new Response('Not Found', { status: 404 });
  },
};
