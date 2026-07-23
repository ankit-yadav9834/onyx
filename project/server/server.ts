import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { complete } from './provider.js';

dotenv.config();

const app = express();
const port = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

app.post('/api/orchestrate', async (req, res) => {
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

    res.json({
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
    res.status(500).json({
      error: 'Failed to generate response',
      details: e.message,
    });
  }
});

app.listen(port, () => {
  console.log(`Backend server running on http://localhost:${port}`);
});
