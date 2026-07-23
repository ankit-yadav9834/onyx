/**
 * Provider Service – Single LLM abstraction layer.
 *
 * All LLM calls flow through this module.
 * Switching provider later (OpenAI, Anthropic, Ollama, etc.)
 * requires only configuration changes.
 */

import OpenAI from 'openai';
import * as dotenv from 'dotenv';

dotenv.config();

export interface ProviderConfig {
  baseURL: string;
  apiKey: string;
  defaultModel: string;
  referer?: string;
  title?: string;
}

export interface CompletionRequest {
  messages: { role: string; content: string }[];
  model?: string;
  maxTokens?: number;
}

export interface CompletionResponse {
  answer: string;
  provider: string;
  model: string;
  usage: { prompt_tokens: number; completion_tokens: number; total_tokens: number };
  finish_reason: string;
  latency: number;
  request_id: string;
  estimated_cost: number;
  created_at: number;
}

const config: ProviderConfig = {
  baseURL: process.env.LLM_BASE_URL || 'https://openrouter.ai/api/v1',
  apiKey: process.env.OPENROUTER_API_KEY || '',
  defaultModel: process.env.LLM_DEFAULT_MODEL || 'google/gemini-2.5-flash',
  referer: process.env.LLM_REFERER || 'http://localhost:5173',
  title: process.env.LLM_TITLE || 'OrchestrAI Local Dev',
};

const client = new OpenAI({
  baseURL: config.baseURL,
  apiKey: config.apiKey,
  defaultHeaders: {
    'HTTP-Referer': config.referer || '',
    'X-Title': config.title || '',
  },
});

export async function complete(req: CompletionRequest): Promise<CompletionResponse> {
  if (!config.apiKey) {
    throw new Error('LLM API key is not configured in the environment.');
  }

  const model = req.model || config.defaultModel;
  // Strip "openrouter/" prefix if passed
  const apiModel = model.startsWith('openrouter/') ? model.replace('openrouter/', '') : model;

  const startTime = performance.now();

  const completion = await client.chat.completions.create({
    model: apiModel,
    max_tokens: req.maxTokens || 2000,
    messages: [
      {
        role: 'system',
        content: 'You are OrchestrAI, a premium enterprise AI operating system. Provide structured, authoritative answers. Format using Markdown.',
      },
      ...req.messages
        .map(m => ({ role: m.role as 'user' | 'assistant', content: m.content || '' }))
        .filter(m => m.content.length > 0),
    ],
  });

  const latency = Math.round(performance.now() - startTime);
  const answer = completion.choices[0]?.message?.content || 'No response generated.';
  const finishReason = completion.choices[0]?.finish_reason || 'stop';
  const provider = model.includes('/') ? model.split('/')[0] : 'openrouter';

  const pTokens = completion.usage?.prompt_tokens || 0;
  const cTokens = completion.usage?.completion_tokens || 0;
  const estimatedCost = pTokens * 0.0001 + cTokens * 0.0002;

  return {
    answer,
    provider,
    model: completion.model || model,
    usage: {
      prompt_tokens: pTokens,
      completion_tokens: cTokens,
      total_tokens: completion.usage?.total_tokens || pTokens + cTokens,
    },
    finish_reason: finishReason,
    latency,
    request_id: completion.id || `req_${Date.now()}`,
    estimated_cost: estimatedCost,
    created_at: completion.created || Math.floor(Date.now() / 1000),
  };
}
