/**
 * Gemini vision analyzer – optional backend for book spine recognition.
 * Uses Gemini 2.5 Flash (free tier: 7.5k–30k scans/month). Requires EXPO_PUBLIC_GEMINI_API_KEY.
 */

import * as FileSystem from 'expo-file-system/legacy';
import * as ImageManipulator from 'expo-image-manipulator';
import { Image } from 'react-native';

import type { BookDetection } from './types';

const MAX_IMAGE_DIM = 1024;

/** JSON schema for strict structured output – prevents malformed JSON from Gemini. */
const RESPONSE_SCHEMA = {
  type: 'array',
  items: {
    type: 'object',
    properties: {
      title: { type: 'string', description: 'Book title as shown on spine' },
      author: { type: 'string', description: 'Author name as shown on spine' },
    },
    required: ['title'],
  },
} as const;

const GEMINI_BASE = 'https://generativelanguage.googleapis.com/v1beta';
const MODEL_PRO = 'gemini-2.5-pro';   // better quality, lower free-tier limit
const MODEL_FALLBACK = 'gemini-2.5-flash';  // switch here when Pro quota exhausted

const LOG = (msg: string, data?: unknown) => {
  console.log(`[BookScan:Gemini] ${msg}`, data !== undefined ? data : '');
};

const PROMPT = `Identify every book visible in this bookshelf image. List each book with its title and author exactly as shown (or reasonably inferred) from the spine. If author is unclear, use empty string.`;

function getApiKey(): string | null {
  const key = process.env.EXPO_PUBLIC_GEMINI_API_KEY;
  return (typeof key === 'string' && key.trim().length > 0) ? key.trim() : null;
}

export function isGeminiAvailable(): boolean {
  return getApiKey() != null;
}

function getImageDimensions(uri: string): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    Image.getSize(uri, (width, height) => resolve({ width, height }), reject);
  });
}

async function prepareImageForGemini(uri: string): Promise<string> {
  try {
    const { width, height } = await getImageDimensions(uri);
    const longEdge = Math.max(width, height);
    if (longEdge <= MAX_IMAGE_DIM) {
      return FileSystem.readAsStringAsync(uri, {
        encoding: FileSystem.EncodingType.Base64,
      });
    }
    const resizeAction = width >= height
      ? { resize: { width: MAX_IMAGE_DIM } as const }
      : { resize: { height: MAX_IMAGE_DIM } as const };
    const resized = await ImageManipulator.manipulateAsync(
      uri,
      [resizeAction],
      { compress: 0.85, format: ImageManipulator.SaveFormat.JPEG }
    );
    return FileSystem.readAsStringAsync(resized.uri, {
      encoding: FileSystem.EncodingType.Base64,
    });
  } catch (e) {
    LOG('image resize failed, using original', e);
    return FileSystem.readAsStringAsync(uri, {
      encoding: FileSystem.EncodingType.Base64,
    });
  }
}

function parseBooksFromResponse(text: string): BookDetection[] {
  let jsonStr = text.trim();
  const codeBlock = jsonStr.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (codeBlock) jsonStr = codeBlock[1].trim();

  const fixUnquotedKeys = (s: string) =>
    s.replace(/(\{|,)\s*([a-zA-Z_][a-zA-Z0-9_]*)\s*:/g, '$1"$2":').replace(/,\s*([}\]])/g, '$1');

  type BookItem = { title?: string; author?: string; Title?: string; Author?: string };
  let arr: BookItem[] = [];

  const tryParse = (raw: string): BookItem[] | null => {
    try {
      const parsed = JSON.parse(fixUnquotedKeys(raw)) as unknown;
      if (Array.isArray(parsed)) return parsed;
      if (parsed && typeof parsed === 'object') {
        const nested = (parsed as Record<string, unknown>).books ?? (parsed as Record<string, unknown>).items ?? (parsed as Record<string, unknown>).data;
        if (Array.isArray(nested)) return nested;
      }
      return null;
    } catch {
      return null;
    }
  };

  arr = tryParse(jsonStr) ?? tryParse((jsonStr.match(/\[\s*[\s\S]*\s*\]/)?.[0] ?? '')) ?? [];
  if (arr.length === 0 && jsonStr.length > 0) {
    LOG('parseBooksFromResponse failed', { len: jsonStr.length, sample: jsonStr.slice(0, 300) });
  }

  const results: BookDetection[] = [];
  const seen = new Set<string>();

  for (const item of arr) {
    const title = (item?.title ?? item?.Title ?? '').trim();
    if (!title || title.length < 2) continue;

    const key = `${title.toLowerCase()}`;
    if (seen.has(key)) continue;
    seen.add(key);

    results.push({
      id: `gemini_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
      title,
      author: (item?.author ?? item?.Author ?? '').trim() || undefined,
      confidence: 0.9,
    });
  }

  return results;
}

/** Returns true if error indicates quota/rate limit – should retry with Flash. */
function isQuotaOrRateLimitError(status: number, errBody: string): boolean {
  if (status === 429 || status === 503) return true;
  const lower = errBody.toLowerCase();
  return lower.includes('resource_exhausted') || lower.includes('quota') || lower.includes('rate limit');
}

/** Call Gemini API with a specific model. Returns null on failure; throws on quota so caller can retry. */
async function callGeminiApi(
  base64: string,
  model: string,
  apiKey: string
): Promise<BookDetection[] | null> {
  const url = `${GEMINI_BASE}/models/${model}:generateContent?key=${apiKey}`;
  const body = {
    contents: [
      {
        parts: [
          { inline_data: { mime_type: 'image/jpeg', data: base64 } },
          { text: PROMPT },
        ],
      },
    ],
    generationConfig: {
      temperature: 0.1,
      maxOutputTokens: 2048,
      responseMimeType: 'application/json',
      responseJsonSchema: RESPONSE_SCHEMA,
    },
  };

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  const errText = await res.text();

  if (!res.ok) {
    if (isQuotaOrRateLimitError(res.status, errText)) {
      const err = new Error(`Gemini quota/rate limit (${res.status})`);
      (err as Error & { retryWithFlash?: boolean }).retryWithFlash = true;
      throw err;
    }
    LOG('API error', { status: res.status, model, body: errText?.slice(0, 200) });
    return null;
  }

  let data: { candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }> };
  try {
    data = JSON.parse(errText) as typeof data;
  } catch {
    LOG('API response parse failed', { sample: errText?.slice(0, 100) });
    return null;
  }

  const text = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
  if (!text) {
    LOG('no text in response', { model });
    return null;
  }

  return parseBooksFromResponse(text);
}

/** Text-only call: correct raw spine readings to canonical title/author using book knowledge. */
const LOOKUP_PROMPT = (raw: BookDetection[]) =>
  `These book titles and authors were read from a bookshelf photo. Some may have OCR or spelling errors. For each, return the correct canonical title and full author name. Return a JSON array only: [{"title": "...", "author": "..."}] for each book. Keep the same order. Input:\n${raw.map((b, i) => `${i + 1}. ${b.title}${b.author ? ` - ${b.author}` : ''}`).join('\n')}`;

async function lookupBookTitlesWithGemini(raw: BookDetection[]): Promise<BookDetection[]> {
  const apiKey = getApiKey();
  if (!apiKey || raw.length === 0) return raw;

  const url = `${GEMINI_BASE}/models/${MODEL_FALLBACK}:generateContent?key=${apiKey}`;
  const body = {
    contents: [{ parts: [{ text: LOOKUP_PROMPT(raw) }] }],
    generationConfig: {
      temperature: 0.1,
      maxOutputTokens: 2048,
      responseMimeType: 'application/json',
      responseJsonSchema: RESPONSE_SCHEMA,
    },
  };

  try {
    const res = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    const text = await res.text();
    if (!res.ok) {
      LOG('lookupBookTitlesWithGemini API error', res.status);
      return raw;
    }
    const data = JSON.parse(text) as { candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }> };
    const out = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
    if (!out) return raw;
    const corrected = parseBooksFromResponse(out);
    if (corrected.length > 0) {
      LOG('lookupBookTitlesWithGemini done', { in: raw.length, out: corrected.length });
      return corrected.map((b, i) => ({ ...b, id: raw[i]?.id ?? b.id }));
    }
  } catch (e) {
    LOG('lookupBookTitlesWithGemini failed', e);
  }
  return raw;
}

/**
 * Analyze a bookshelf image using Gemini vision. Uses Pro first; falls back to Flash on quota/rate limit.
 */
export async function analyzeBookshelfWithGemini(
  imageUri: string
): Promise<BookDetection[] | null> {
  LOG('analyzeBookshelfWithGemini start', { uri: imageUri.slice(0, 50) });

  const apiKey = getApiKey();
  if (!apiKey) {
    LOG('no API key, skipping');
    return null;
  }

  try {
    LOG('reading image as base64');
    const base64 = await prepareImageForGemini(imageUri);
    LOG('sending to Gemini API', { model: MODEL_PRO, payloadSize: Math.round(base64.length / 1024) + ' KB' });

    let books = await callGeminiApi(base64, MODEL_PRO, apiKey);
    if (books !== null) {
      LOG('analyzeBookshelfWithGemini done (Pro)', { count: books.length });
      return lookupBookTitlesWithGemini(books);
    }
    return null;
  } catch (err) {
    const e = err as Error & { retryWithFlash?: boolean };
    if (e.retryWithFlash) {
      try {
        LOG('Pro failed with quota, retrying with Flash');
        const base64 = await prepareImageForGemini(imageUri);
        let books = await callGeminiApi(base64, MODEL_FALLBACK, apiKey);
        if (books !== null) {
          LOG('analyzeBookshelfWithGemini done (Flash fallback)', { count: books.length });
          return lookupBookTitlesWithGemini(books);
        }
      } catch (fallbackErr) {
        LOG('Flash fallback also failed', fallbackErr);
      }
    } else {
      LOG('analyzeBookshelfWithGemini failed', err);
    }
    return null;
  }
}
