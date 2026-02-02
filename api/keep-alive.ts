import type { VercelRequest, VercelResponse } from '@vercel/node';

/**
 * Keep-alive endpoint for Supabase free tier.
 * Called by Vercel Cron to prevent project from pausing after 7 days of inactivity.
 */
export default async function handler(
  req: VercelRequest,
  res: VercelResponse
): Promise<void> {
  // Only allow GET, and optionally verify cron secret to prevent public abuse
  if (req.method !== 'GET') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const key = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY;

  if (!url || !key) {
    res.status(500).json({ error: 'Supabase not configured' });
    return;
  }

  try {
    // Minimal query: exchange_rates has public read policy, so anon key works
    const response = await fetch(
      `${url}/rest/v1/exchange_rates?limit=1`,
      {
        headers: {
          apikey: key,
          Authorization: `Bearer ${key}`,
          Accept: 'application/json',
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Supabase returned ${response.status}`);
    }

    res.status(200).json({ ok: true, message: 'Supabase keep-alive pinged' });
  } catch (err) {
    console.error('Keep-alive failed:', err);
    res.status(500).json({
      error: 'Keep-alive failed',
      message: err instanceof Error ? err.message : 'Unknown error',
    });
  }
}
