import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import OpenAI from 'openai';

dotenv.config();

const app = express();
const port = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// Initialize OpenAI client pointing to OpenRouter
const openai = new OpenAI({
  baseURL: 'https://openrouter.ai/api/v1',
  apiKey: process.env.OPENROUTER_API_KEY || 'dummy_key_if_not_set',
});

app.post('/api/orchestrate', async (req, res) => {
  try {
    const { query, model = 'google/gemini-2.5-flash' } = req.body;

    if (!query) {
      return res.status(400).json({ error: 'Query is required' });
    }

    if (!process.env.OPENROUTER_API_KEY) {
      return res.status(500).json({ 
        error: 'OPENROUTER_API_KEY is not configured in the environment.' 
      });
    }

    const startTime = performance.now();
    
    // Strip "openrouter/" prefix if it was inadvertently passed
    const apiModel = model.startsWith('openrouter/') ? model.replace('openrouter/', '') : model;

    // Call OpenRouter
    const completion = await openai.chat.completions.create({
      model: apiModel,
      max_tokens: 2000,
      messages: [
        {
          role: 'system',
          content: 'You are OrchestrAI, a premium enterprise AI operating system. Provide structured, authoritative answers. Format using Markdown.',
        },
        { role: 'user', content: query },
      ],
      // OpenRouter specific headers
      extra_headers: {
        'HTTP-Referer': 'http://localhost:5173',
        'X-Title': 'OrchestrAI Local Dev',
      },
    });

    const latencyMs = Math.round(performance.now() - startTime);

    const answer = completion.choices[0]?.message?.content || 'No response generated.';
    const finishReason = completion.choices[0]?.finish_reason || 'stop';
    
    // Attempt to extract provider from model string (e.g. "google/gemini" -> "google")
    const provider = model.includes('/') ? model.split('/')[0] : 'openrouter';

    res.json({ 
      answer,
      metadata: {
        provider,
        model: completion.model || model,
        usage: {
          prompt_tokens: completion.usage?.prompt_tokens || 0,
          completion_tokens: completion.usage?.completion_tokens || 0,
          total_tokens: completion.usage?.total_tokens || 0,
        },
        finish_reason: finishReason,
        latency: latencyMs,
        request_id: completion.id || `req_${Date.now()}`
      }
    });
  } catch (error: unknown) {
    const e = error as Error;
    console.error('Error calling OpenRouter:', e);
    res.status(500).json({ 
      error: 'Failed to generate response from OpenRouter', 
      details: e.message 
    });
  }
});

app.listen(port, () => {
  console.log(`Backend server running on http://localhost:${port}`);
});
