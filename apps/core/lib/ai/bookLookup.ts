/**
 * Book lookup – validate OCR candidates against Open Library (+ Google Books fallback).
 * Uses q (general search), multi-result scoring, and fuzzy matching.
 */

import { distance } from 'fastest-levenshtein';

import type { BookDetection } from './types';

const OPEN_LIBRARY_SEARCH = 'https://openlibrary.org/search.json';
const GOOGLE_BOOKS_SEARCH = 'https://www.googleapis.com/books/v1/volumes';

const MIN_QUERY_LENGTH = 4;
const FUZZY_MATCH_THRESHOLD = 0.68;
const REQUEST_DELAY_MS = 50;
const CONCURRENCY = 3;
const MAX_RESULTS_PER_SOURCE = 12;

const LOG = (msg: string, data?: unknown) => {
  console.log(`[BookScan:Lookup] ${msg}`, data !== undefined ? data : '');
};

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function normalizeForMatch(s: string): string {
  return s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^\w\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/** Levenshtein similarity ratio: 1 = identical, 0 = no match */
function similarityRatio(a: string, b: string): number {
  const na = normalizeForMatch(a);
  const nb = normalizeForMatch(b);
  if (na === nb) return 1;
  const maxLen = Math.max(na.length, nb.length, 1);
  const d = distance(na, nb);
  return 1 - d / maxLen;
}

const STOPWORDS = new Set(['the', 'a', 'an', 'of', 'and', 'or', 'by', 'in', 'on', 'to', 'for']);

/**
 * OCR corrections – structural patterns only, not a per-title dictionary.
 * Fixes: stray punctuation (D)), truncation (Tho→The), digit swaps (2→U),
 * single-letter drops (ZON→ZONE), common typos, Unicode (ı→i).
 * Rely on fuzzy matching + author filtering for the rest.
 */
const OCR_CORRECTIONS: [RegExp, string][] = [
  [/\bj?D\)/g, 'D'],
  [/\bTho\b/g, 'The'],
  [/\bZON\b/g, 'ZONE'],
  [/\bZOR\b/g, 'ZONE'],
  [/2UNU/g, 'UNCUT'],
  [/2UGU/g, 'UNCUT'],
  [/COMLETE\b/g, 'COMPLETE'],
  [/COMPUETE\b/g, 'COMPLETE'],
  [/\bFIASH\b/g, 'FLASH'],
  [/\u0131/g, 'i'],
  [/\u0130/g, 'i'],
];

function correctOcrTypos(text: string): string {
  let s = text;
  for (const [re, repl] of OCR_CORRECTIONS) {
    s = s.replace(re, repl);
  }
  return s.trim();
}

/** Whether the query has obvious OCR typos that we can correct */
function hasCorrectableTypos(text: string): boolean {
  const corrected = correctOcrTypos(text);
  return corrected !== text.trim();
}

/** Single-word queries that are usually author names, not titles - require higher confidence */
const AMBIGUOUS_SINGLE_WORDS = new Set(['king', 'stephen', 'viking', 'the']);

/** Require author match when query suggests Stephen King (title + author on spine) */
function querySuggestsStephenKing(text: string): boolean {
  const t = text.toUpperCase();
  return t.includes('STEPHEN KING') || t.includes('KING STEPHEN');
}

/** Word overlap + content-word requirement (reject garbled multi-spine matches). */
function wordOverlapScore(ocrText: string, resultTitle: string): number {
  const ocrNorm = normalizeForMatch(ocrText);
  const titleNorm = normalizeForMatch(resultTitle);
  const ocrWords = ocrNorm.split(/\s+/).filter((w) => w.length >= 2);
  const titleWords = new Set(titleNorm.split(/\s+/));
  const contentWords = ocrWords.filter((w) => !STOPWORDS.has(w));
  const contentMatches = contentWords.filter(
    (w) => titleWords.has(w) || titleNorm.includes(w)
  );

  if (ocrWords.length === 0) return titleNorm.includes(ocrNorm) ? 0.8 : 0;
  if (contentWords.length > 0 && contentMatches.length === 0) return 0;
  if (contentWords.length >= 4 && contentMatches.length < 2) return 0;

  const matches = ocrWords.filter((w) => titleWords.has(w) || titleNorm.includes(w));
  return matches.length / ocrWords.length;
}

/** Reject when result title = query (author matched as book title, e.g. RITA MAE BROWN → Rita Mae Brown). */
function isAuthorAsTitle(ocrText: string, resultTitle: string): boolean {
  const q = normalizeForMatch(ocrText);
  const t = normalizeForMatch(resultTitle);
  if (q !== t) return false;
  const words = q.split(/\s+/).filter((w) => w.length >= 2);
  return words.length >= 2 && words.length <= 4;
}

/** Reject when single-word query and result author doesn't contain it (e.g. McPHERSON → Windy McPherson's son). */
function isWrongAuthorForSingleWord(
  ocrText: string,
  resultTitle: string,
  authors: string[] | undefined
): boolean {
  const words = ocrText.trim().split(/\s+/);
  if (words.length !== 1 || ocrText.length < 5) return false;
  const need = words[0].toLowerCase();
  if (!authors?.length) return false;
  const authorStr = authors.join(' ').toLowerCase();
  return !authorStr.includes(need);
}

/** Reject when result adds many words not implied by query (e.g. THE COMPLETE → Sherlock Holmes). */
function resultAddsTooManyUnrelatedWords(ocrText: string, resultTitle: string): boolean {
  const ocrNorm = normalizeForMatch(ocrText);
  const titleNorm = normalizeForMatch(resultTitle);
  const ocrWords = new Set(ocrNorm.split(/\s+/).filter((w) => w.length >= 2 && !STOPWORDS.has(w)));
  const titleContentWords = titleNorm.split(/\s+/).filter((w) => w.length >= 2 && !STOPWORDS.has(w));
  const extraWords = titleContentWords.filter(
    (w) => !ocrWords.has(w) && !Array.from(ocrWords).some((o) => o.includes(w) || w.includes(o))
  );
  return extraWords.length >= 3;
}

/** Combined score: word overlap + fuzzy. Accept if >= threshold. */
function scoreMatch(ocrText: string, resultTitle: string): number {
  const overlap = wordOverlapScore(ocrText, resultTitle);
  const fuzzy = similarityRatio(ocrText, resultTitle);
  return Math.max(overlap * 0.6 + fuzzy * 0.4, fuzzy);
}

function getEffectiveThreshold(ocrText: string): number {
  const trimmed = ocrText.trim().toLowerCase();
  if (AMBIGUOUS_SINGLE_WORDS.has(trimmed)) return 0.85;
  return FUZZY_MATCH_THRESHOLD;
}

function authorContains(authors: string[] | undefined, needle: string): boolean {
  if (!authors?.length) return false;
  const n = needle.toLowerCase();
  return authors.some((a) => (a || '').toLowerCase().includes(n));
}

interface OpenLibraryDoc {
  title?: string;
  author_name?: string[];
}

interface GoogleBooksItem {
  volumeInfo?: {
    title?: string;
    authors?: string[];
  };
}

/** Fetch from Open Library using q (general search). Returns best match or null. */
async function lookupOpenLibrary(ocrText: string): Promise<BookDetection | null> {
  const cleaned = ocrText.trim();
  if (cleaned.length < MIN_QUERY_LENGTH) return null;

  const query = cleaned.slice(0, 80);
  LOG('lookupOpenLibrary start', { query: query.slice(0, 40) });
  const url = `${OPEN_LIBRARY_SEARCH}?q=${encodeURIComponent(query)}&limit=${MAX_RESULTS_PER_SOURCE}&fields=title,author_name`;

  try {
    const res = await fetch(url);
    if (!res.ok) return null;

    const data = (await res.json()) as {
      num_found?: number;
      numFound?: number;
      docs?: OpenLibraryDoc[];
    };

    const docs: OpenLibraryDoc[] = data.docs ?? [];
    const numFound = data.numFound ?? data.num_found ?? docs.length;
    if (docs.length === 0) {
      LOG('lookupOpenLibrary no docs', { query: cleaned.slice(0, 40), numFound });
      return null;
    }

    const threshold = getEffectiveThreshold(cleaned);
    const wantsStephenKing = querySuggestsStephenKing(cleaned);
    let best: { score: number; doc: OpenLibraryDoc } | null = null;

    for (const doc of docs) {
      const title = doc?.title?.trim();
      if (!title) continue;

      if (resultAddsTooManyUnrelatedWords(cleaned, title)) continue;
      if (isAuthorAsTitle(cleaned, title)) continue;

      const score = scoreMatch(cleaned, title);
      if (score < threshold) continue;

      const authors = doc?.author_name;
      if (wantsStephenKing && !authorContains(authors, 'king')) continue;
      if (isWrongAuthorForSingleWord(cleaned, title, authors)) continue;

      if (!best || score > best.score) {
        best = { score, doc };
      }
    }

    LOG('lookupOpenLibrary', {
      query: cleaned.slice(0, 40),
      numFound,
      best: best ? { title: best.doc.title, score: best.score } : null,
    });

    if (!best) return null;

    const author = Array.isArray(best.doc.author_name) ? best.doc.author_name[0] : undefined;
    LOG('lookupOpenLibrary match', { title: best.doc.title, author, score: best.score });
    return {
      id: `ol_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
      title: best.doc.title!.trim(),
      author,
      confidence: Math.min(0.95, 0.7 + best.score * 0.2),
    };
  } catch (err) {
    LOG('lookupOpenLibrary failed', err);
    return null;
  }
}

/** Fetch from Google Books when Open Library has no match. */
async function lookupGoogleBooks(ocrText: string): Promise<BookDetection | null> {
  const cleaned = ocrText.trim();
  if (cleaned.length < MIN_QUERY_LENGTH) return null;

  const query = cleaned.slice(0, 80);
  LOG('lookupGoogleBooks start', { query: query.slice(0, 40) });
  const url = `${GOOGLE_BOOKS_SEARCH}?q=intitle:${encodeURIComponent(query)}&maxResults=${MAX_RESULTS_PER_SOURCE}`;

  try {
    const res = await fetch(url);
    if (!res.ok) return null;

    const data = (await res.json()) as { items?: GoogleBooksItem[] };
    const items = data.items ?? [];
    if (items.length === 0) return null;

    const threshold = getEffectiveThreshold(cleaned);
    const wantsStephenKing = querySuggestsStephenKing(cleaned);
    let best: { score: number; item: GoogleBooksItem } | null = null;

    for (const item of items) {
      const title = item?.volumeInfo?.title?.trim();
      if (!title) continue;

      if (resultAddsTooManyUnrelatedWords(cleaned, title)) continue;
      if (isAuthorAsTitle(cleaned, title)) continue;

      const score = scoreMatch(cleaned, title);
      if (score < threshold) continue;

      const authors = item?.volumeInfo?.authors;
      if (wantsStephenKing && !authorContains(authors, 'king')) continue;
      if (isWrongAuthorForSingleWord(cleaned, title, authors)) continue;

      if (!best || score > best.score) {
        best = { score, item };
      }
    }

    LOG('lookupGoogleBooks', {
      query: cleaned.slice(0, 40),
      items: items.length,
      best: best ? { title: best.item.volumeInfo?.title, score: best.score } : null,
    });

    if (!best) return null;

    const authors = best.item.volumeInfo?.authors;
    const author = Array.isArray(authors) && authors.length > 0 ? authors[0] : undefined;

    LOG('lookupGoogleBooks match', { title: best.item.volumeInfo?.title, author, score: best.score });
    return {
      id: `gb_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
      title: best.item.volumeInfo!.title!.trim(),
      author,
      confidence: Math.min(0.95, 0.7 + best.score * 0.2),
    };
  } catch (err) {
    LOG('lookupGoogleBooks failed', err);
    return null;
  }
}

/** Look up book: Open Library first, Google Books fallback. Tries OCR-corrected variant when original has typos. */
export async function lookupBookByTitle(ocrText: string): Promise<BookDetection | null> {
  const trimmed = ocrText.trim();
  LOG('lookupBookByTitle', { ocrText: trimmed.slice(0, 40) });

  const tryQuery = async (q: string) => {
    let r = await lookupOpenLibrary(q);
    if (r) return r;
    return lookupGoogleBooks(q);
  };

  let result = await tryQuery(trimmed);
  if (result) return result;

  if (hasCorrectableTypos(trimmed)) {
    const corrected = correctOcrTypos(trimmed);
    if (corrected.length >= MIN_QUERY_LENGTH) {
      LOG('lookupBookByTitle trying corrected', { corrected: corrected.slice(0, 40) });
      result = await tryQuery(corrected);
      if (result) return result;
    }
  }

  LOG('lookupBookByTitle no match', { ocrText: trimmed.slice(0, 40) });
  return null;
}

/** Look up multiple candidates in parallel batches. */
export async function lookupAndFilterBooks(
  candidates: { title: string }[],
  onProgress?: (done: number, total: number) => void
): Promise<BookDetection[]> {
  LOG('lookupAndFilterBooks start', { candidates: candidates.length });
  const results: BookDetection[] = [];
  const seenTitles = new Set<string>();

  for (let i = 0; i < candidates.length; i += CONCURRENCY) {
    const batch = candidates.slice(i, i + CONCURRENCY);
    const batchResults = await Promise.all(batch.map((c) => lookupBookByTitle(c.title)));

    for (const book of batchResults) {
      if (book && !seenTitles.has(book.title.toLowerCase())) {
        seenTitles.add(book.title.toLowerCase());
        results.push(book);
      }
    }

    onProgress?.(Math.min(i + batch.length, candidates.length), candidates.length);

    if (i + CONCURRENCY < candidates.length) {
      await sleep(REQUEST_DELAY_MS);
    }
  }

  onProgress?.(candidates.length, candidates.length);

  LOG('lookupAndFilterBooks done', {
    candidates: candidates.length,
    matched: results.length,
    books: results.map((r) => r.title),
  });

  return results;
}
