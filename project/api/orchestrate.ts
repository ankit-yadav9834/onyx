import type { VercelRequest, VercelResponse } from '@vercel/node';
import { complete } from '../server/provider.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { model = 'google/gemini-2.5-flash' } = req.body;
    let { messages } = req.body;

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      if (req.body.query) {
        messages = [{ role: 'user', content: req.body.query }];
      } else {
        return res.status(400).json({ error: 'Messages array is required' });
      }
    }

    const result = await complete({
      messages: messages.map((m: any) => ({
        role: m.role === 'user' ? 'user' : 'assistant',
        content: m.content || '',
      })),
      model,
    });

    return res.json({
      answer: result.answer,
      metadata: {
        provider: result.provider,
        model: result.model,
        usage: result.usage,
        finish_reason: result.finish_reason,
        latency: result.latency,
        request_id: result.request_id,
        estimated_cost: result.estimated_cost,
        created_at: result.created_at,
      },
    });
  } catch (error: unknown) {
    const e = error as Error;
    console.error('Error calling provider:', e);
    return res.status(500).json({
      error: 'Failed to generate response',
      details: e.message,
    });
  }
}
