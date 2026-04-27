export interface Env {
  SUPABASE_URL: string;
  SUPABASE_SERVICE_ROLE_KEY: string;
}

type Visitor = {
  id: string;
  face_hash: string;
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

  if (status === 204) {
    return { data: null, error: null, status };
  }

  let json: any = null;
  try {
    json = await res.json();
  } catch {
    // ignore
  }

  if (!res.ok) {
    const message =
      (json && (json.message || json.error || JSON.stringify(json))) ||
      `Supabase error (status ${status})`;
    return { data: null, error: message, status };
  }

  return { data: json as T, error: null, status };
}

async function handlePostVote(request: Request, env: Env): Promise<Response> {
  let body: any;
  try {
    body = await request.json();
  } catch {
    return new Response(
      JSON.stringify({ error: 'Invalid JSON body' }),
      { status: 400, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } }
    );
  }

  const face_hash = body?.face_hash as string | undefined;
  const club_id = body?.club_id as number | undefined;

  if (!face_hash || !club_id) {
    return new Response(
      JSON.stringify({ error: 'face_hash and club_id are required' }),
      { status: 400, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } }
    );
  }

  // 1. face_hash で visitors を検索
  const { data: visitors, error: visitorsError } = await supabaseRequest<Visitor[]>(
    env,
    `/visitors?select=id,face_hash,created_at&face_hash=eq.${encodeURIComponent(
      face_hash
    )}&limit=1`
  );

  if (visitorsError) {
    return new Response(
      JSON.stringify({ error: 'Failed to fetch visitor', detail: visitorsError }),
      { status: 500, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } }
    );
  }

  let visitor_id: string;

  if (visitors && visitors.length > 0) {
    visitor_id = visitors[0].id;
  } else {
    // 1-2. なければ作成
    const { data: insertedVisitors, error: insertVisitorError } =
      await supabaseRequest<Visitor[]>(
        env,
        `/visitors`,
        {
          method: 'POST',
          headers: {
            Prefer: 'return=representation',
          },
          body: JSON.stringify({ face_hash }),
        }
      );

    if (insertVisitorError || !insertedVisitors || insertedVisitors.length === 0) {
      return new Response(
        JSON.stringify({
          error: 'Failed to create visitor',
          detail: insertVisitorError,
        }),
        { status: 500, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } }
      );
    }

    visitor_id = insertedVisitors[0].id;
  }

  // 2. votes へ記録（UNIQUE(visitor_id) による重複チェック）
  const { data: insertedVotes, error: insertVoteError, status: voteStatus } =
    await supabaseRequest<Vote[]>(
      env,
      `/votes`,
      {
        method: 'POST',
        headers: {
          Prefer: 'return=representation',
        },
        body: JSON.stringify({ visitor_id, club_id }),
      }
    );

  if (voteStatus === 409 || (insertVoteError && insertVoteError.includes('duplicate'))) {
    return new Response(
      JSON.stringify({ error: 'Already voted' }),
      { status: 400, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } }
    );
  }

  if (insertVoteError || !insertedVotes || insertedVotes.length === 0) {
    return new Response(
      JSON.stringify({
        error: 'Failed to create vote',
        detail: insertVoteError,
      }),
      { status: 500, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } }
    );
  }

  // 3. clubs の votes_count をインクリメント（RPC）
  const { error: incrementError } = await supabaseRequest<null>(
    env,
    `/rpc/increment_club_votes`,
    {
      method: 'POST',
      body: JSON.stringify({ p_club_id: club_id }),
    }
  );

  if (incrementError) {
    return new Response(
      JSON.stringify({
        error: 'Vote recorded but failed to increment club votes_count',
        detail: incrementError,
        visitor_id,
      }),
      { status: 500, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } }
    );
  }

  // 4. visitor_id を返却
  return new Response(
    JSON.stringify({ visitor_id }),
    { status: 200, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } }
  );
}

async function handleGetResults(env: Env): Promise<Response> {
  const { data: clubs, error } = await supabaseRequest<Club[]>(
    env,
    `/clubs?select=id,name,votes_count&order=votes_count.desc`
  );

  if (error) {
    return new Response(
      JSON.stringify({ error: 'Failed to fetch results', detail: error }),
      { status: 500, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } }
    );
  }

  return new Response(
    JSON.stringify({ clubs: clubs || [] }),
    { status: 200, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } }
  );
}

async function handleGetMyPage(request: Request, env: Env): Promise<Response> {
  const url = new URL(request.url);
  const id = url.searchParams.get('id');

  if (!id) {
    return new Response(
      JSON.stringify({ error: 'id is required' }),
      { status: 400, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } }
    );
  }

  const { data: votes, error } = await supabaseRequest<
    Array<{
      id: number;
      visitor_id: string;
      club_id: number;
      club: Club;
    }>
  >(
    env,
    `/votes?visitor_id=eq.${encodeURIComponent(
      id
    )}&select=id,visitor_id,club_id,club:clubs(id,name,votes_count)&limit=1`
  );

  if (error) {
    return new Response(
      JSON.stringify({ error: 'Failed to fetch my page', detail: error }),
      { status: 500, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } }
    );
  }

  if (!votes || votes.length === 0) {
    return new Response(
      JSON.stringify({ visitor_id: id, voted: false, club: null }),
      { status: 200, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } }
    );
  }

  const vote = votes[0];

  return new Response(
    JSON.stringify({
      visitor_id: id,
      voted: true,
      club: vote.club,
    }),
    { status: 200, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } }
  );
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    const pathname = url.pathname;

    // Handle Preflight CORS
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, apikey, Authorization',
        },
      });
    }

    if (pathname === '/api/vote' && request.method === 'POST') {
      return handlePostVote(request, env);
    }

    if (pathname === '/api/results' && request.method === 'GET') {
      return handleGetResults(env);
    }

    if (pathname === '/api/my-page' && request.method === 'GET') {
      return handleGetMyPage(request, env);
    }

    return new Response('Not Found', { status: 404 });
  },
};
