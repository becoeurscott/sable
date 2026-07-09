/**
 * AI client wrapper (§4). One choke point for all model calls, supporting two
 * providers, chosen by env (OpenRouter preferred):
 *   - OpenRouter — OpenAI-compatible API, access to Gemma (google/gemma-*) + more
 *   - Google AI Studio — @google/generative-ai SDK
 * Graceful degradation: with neither configured, isGemmaAvailable() is false and
 * callers fall back to deterministic heuristics. AI is an assistant layer, never
 * the source of financial truth (§3).
 */
import { GoogleGenerativeAI } from '@google/generative-ai';
import { env, aiProvider } from '../config/env.js';
import { logger } from '../config/logger.js';

let googleModel: ReturnType<GoogleGenerativeAI['getGenerativeModel']> | null = null;
if (aiProvider === 'google') {
  const genAI = new GoogleGenerativeAI(env.GEMMA_API_KEY!);
  googleModel = genAI.getGenerativeModel({ model: env.GEMMA_MODEL });
}

export const isGemmaAvailable = (): boolean => aiProvider !== null;

/** Raw text generation. Throws if no provider is configured. */
export async function generate(prompt: string): Promise<string> {
  if (aiProvider === 'openrouter') return generateOpenRouter(prompt);
  if (aiProvider === 'google') {
    const result = await googleModel!.generateContent(prompt);
    return result.response.text().trim();
  }
  throw new Error('AI is not configured');
}

async function generateOpenRouter(prompt: string): Promise<string> {
  const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${env.OPENROUTER_API_KEY}`,
      'Content-Type': 'application/json',
      // Optional attribution headers OpenRouter uses for rankings.
      'HTTP-Referer': 'https://sable.app',
      'X-Title': 'Sable',
    },
    body: JSON.stringify({
      model: env.OPENROUTER_MODEL,
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.2,
    }),
  });
  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(`OpenRouter ${res.status}: ${body.slice(0, 200)}`);
  }
  const data = (await res.json()) as { choices?: { message?: { content?: string } }[] };
  const text = data.choices?.[0]?.message?.content;
  if (typeof text !== 'string') throw new Error('OpenRouter returned no content');
  return text.trim();
}

/** Generate and parse a JSON object response, stripping markdown fences. */
export async function generateJson<T>(prompt: string): Promise<T> {
  const text = await generate(prompt);
  const cleaned = text.replace(/```json/gi, '').replace(/```/g, '').trim();
  try {
    return JSON.parse(cleaned) as T;
  } catch (err) {
    logger.warn({ err, sample: cleaned.slice(0, 200) }, 'AI returned non-JSON');
    throw new Error('Model returned malformed JSON');
  }
}
