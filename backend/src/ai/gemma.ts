/**
 * Gemma client wrapper (§4). Single choke point for all model calls so we get
 * consistent error handling, JSON extraction, and — critically — graceful
 * degradation: when GEMMA_API_KEY is unset the backend still runs, and callers
 * fall back to deterministic heuristics. The AI is an assistant layer, never
 * the source of financial truth (§3 Gemma Philosophy).
 */
import { GoogleGenerativeAI } from '@google/generative-ai';
import { env, gemmaEnabled } from '../config/env.js';
import { logger } from '../config/logger.js';

let model: ReturnType<GoogleGenerativeAI['getGenerativeModel']> | null = null;
if (gemmaEnabled) {
  const genAI = new GoogleGenerativeAI(env.GEMMA_API_KEY!);
  model = genAI.getGenerativeModel({ model: env.GEMMA_MODEL });
}

export const isGemmaAvailable = (): boolean => model !== null;

/** Raw text generation. Throws if the model is not configured. */
export async function generate(prompt: string): Promise<string> {
  if (!model) throw new Error('Gemma is not configured');
  const result = await model.generateContent(prompt);
  return result.response.text().trim();
}

/** Generate and parse a JSON object response, stripping markdown fences. */
export async function generateJson<T>(prompt: string): Promise<T> {
  const text = await generate(prompt);
  const cleaned = text.replace(/```json/gi, '').replace(/```/g, '').trim();
  try {
    return JSON.parse(cleaned) as T;
  } catch (err) {
    logger.warn({ err, sample: cleaned.slice(0, 200) }, 'Gemma returned non-JSON');
    throw new Error('Model returned malformed JSON');
  }
}
