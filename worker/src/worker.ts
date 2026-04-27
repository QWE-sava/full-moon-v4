export interface Env {
  SUPABASE_URL: string;
  SUPABASE_SERVICE_ROLE_KEY: string;
}

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
  const corsHeaders = { 'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json' };
  let body: any;
  try { body = await request.json(); } catch { return new Response(JSON.stringify({ error: 'Invalid JSON' }), { status: 400, headers: corsHeaders }); }
  
  const face_embedding = body?.face_embedding;
  const club_id = body?.club_id;
  if (!face_embedding || !club_id) return new Response(JSON.stringify({ error: 'Missing data' }), { status: 400, headers: corsHeaders });

  const vectorString = `[${face_embedding.join(',')}]`;

  const { data: matched } = await supabaseRequest<any[]>(env, `/rpc/match_visitor`, {
    method: 'POST',
    body: JSON.stringify({ p_embedding: vectorString, p_threshold: 0.5 }),
  });

  let visitor_id: string;
  if (matched && matched.length > 0) {
    visitor_id = matched[0].id;
  } else {
    const { data: inserted } = await supabaseRequest<any[]>(env, `/visitors`, {
      method: 'POST',
      headers: { Prefer: 'return=representation' },
      body: JSON.stringify({ face_embedding: vectorString, face_hash: 'v3' }),
    });
    if (!inserted) return new Response(JSON.stringify({ error: 'DB Error' }), { status: 500, headers: corsHeaders });
    visitor_id = inserted[0].id;
  }

  const { error: voteError, status: vStatus } = await supabaseRequest<any[]>(env, `/votes`, {
    method: 'POST',
    body: JSON.stringify({ visitor_id, club_id }),
  });

  if (vStatus === 409) return new Response(JSON.stringify({ error: 'Already voted' }), { status: 400, headers: corsHeaders });

  await supabaseRequest(env, `/rpc/increment_club_votes`, { method: 'POST', body: JSON.stringify({ p_club_id: club_id }) });

  return new Response(JSON.stringify({ visitor_id }), { status: 200, headers: corsHeaders });
}

async function handleGetMyPage(request: Request, env: Env): Promise<Response> {
  const corsHeaders = { 'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json' };
  const id = new URL(request.url).searchParams.get('id');
  if (!id) return new Response('Missing ID', { status: 400, headers: corsHeaders });

  // Get Vote and Club
  const { data: votes } = await supabaseRequest<any[]>(
    env,
    `/votes?visitor_id=eq.${id}&select=id,created_at,club_id,club:clubs(id,name)&limit=1`
  );

  if (!votes || votes.length === 0) {
    return new Response(JSON.stringify({ voted: false }), { status: 200, headers: corsHeaders });
  }

  const vote = votes[0];

  // Calculate Rank via RPC (Calling the SQL function we created)
  const { data: rank } = await supabaseRequest<number>(
    env,
    `/rpc/get_vote_rank`,
    {
      method: 'POST',
      body: JSON.stringify({ p_visitor_id: id })
    }
  );
  
  return new Response(JSON.stringify({ 
    voted: true, 
    visitor_id: id, 
    club: vote.club,
    rank: rank || 0,
    vote_timestamp: vote.created_at
  }), { status: 200, headers: corsHeaders });
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
          'Access-Control-Allow-Headers': '*',
        },
      });
    }

    if (pathname === '/api/vote' && request.method === 'POST') return handlePostVote(request, env);
    if (pathname === '/api/results' && request.method === 'GET') {
      const { data } = await supabaseRequest<any[]>(env, `/clubs?select=id,name,votes_count&order=votes_count.desc`);
      return new Response(JSON.stringify({ clubs: data || [] }), { status: 200, headers: { 'Access-Control-Allow-Origin': '*' } });
    }
    if (pathname === '/api/my-page' && request.method === 'GET') return handleGetMyPage(request, env);

    return new Response('Not Found', { status: 404 });
  },
};
