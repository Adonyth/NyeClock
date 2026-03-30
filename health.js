export async function onRequestGet() {
  return new Response(
    JSON.stringify({
      ok: true,
      service: 'nye-clock-cloudflare-pages',
    }),
    {
      headers: {
        'content-type': 'application/json; charset=utf-8',
        'cache-control': 'no-store',
      },
    }
  );
}
