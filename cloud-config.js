export async function onRequestGet(context) {
  const env = context.env || {};
  const supabaseUrl = String(env.SUPABASE_URL || '').trim();
  const supabaseAnonKey = String(env.SUPABASE_ANON_KEY || '').trim();
  const oauthRedirect = String(env.OAUTH_REDIRECT || '').trim();

  if (!supabaseUrl || !supabaseAnonKey) {
    return new Response(
      JSON.stringify({
        error: 'cloud_not_configured',
        message: 'SUPABASE_URL or SUPABASE_ANON_KEY is missing in Cloudflare Pages env vars',
      }),
      {
        status: 503,
        headers: {
          'content-type': 'application/json; charset=utf-8',
          'cache-control': 'no-store',
        },
      }
    );
  }

  return new Response(
    JSON.stringify({
      supabaseUrl,
      supabaseAnonKey,
      oauthRedirect: oauthRedirect || undefined,
    }),
    {
      headers: {
        'content-type': 'application/json; charset=utf-8',
        'cache-control': 'no-store',
      },
    }
  );
}
