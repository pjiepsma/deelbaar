/**
 * Book detector – pure domain logic.
 * Uses frame data for spine clustering when available.
 * Extracts single lines, combined lines within same spine cluster, and blocks.
 * Actual validation happens via bookLookup.
 */

import type { OcrResult, OcrFrame } from './types';

/** Max candidates to send to lookup */
const MAX_CANDIDATES = 30;

const LOG = (msg: string, data?: unknown) => {
  console.log(`[BookScan:Detector] ${msg}`, data !== undefined ? data : '');
};

/** Horizontal bin width in px – lines in same bin = same spine */
const SPINE_BIN_PX = 80;

/** Common non-book patterns on spines/shelves */
const NON_BOOK_PATTERNS = [
  /\b(isbn|ean|ean-13|©|copyright|www\.|http|\.com|\.nl)\b/i,
  /^[0-9\s\-\.]+$/, // Pure numbers
  /^(pagina|page|blz|p\.|pp\.)\s*\d+/i,
  /^[a-z]{1,2}\d+$/i, // Shelf codes like "A12"
  /^\d+\s*[x×]\s*\d+/, // Dimensions
  /^(deel|volume|vol\.)\s*\d+$/i,
  /^[a-z]+\s*\d+$/i, // "editie 3" etc
];

const MAX_TITLE_WORDS = 6;
const MAX_TITLE_LENGTH = 65;

function looksLikeBookTitle(text: string): boolean {
  if (text.length < 4 || text.length > MAX_TITLE_LENGTH) return false;
  const words = text.split(/\s+/).filter((w) => w.length >= 2);
  if (words.length > MAX_TITLE_WORDS) return false;
  if (words.length < 1 && text.length < 20) return false;
  if (NON_BOOK_PATTERNS.some((re) => re.test(text))) return false;
  if (/@|http|\.com|\.nl|\.be/.test(text)) return false;
  if (/^\d{4}$/.test(text) || (/\d{4}/.test(text) && text.length < 15)) return false;
  return /^[A-Za-z]/.test(text) || /[a-zA-Z]{3,}/.test(text);
}

/** More permissive for combined lines (longer text = more likely a title) */
function looksLikeCombinedTitle(text: string): boolean {
  if (text.length < 10 || text.length > MAX_TITLE_LENGTH) return false;
  const words = text.split(/\s+/).filter((w) => w.length >= 2);
  if (words.length > MAX_TITLE_WORDS) return false;
  if (NON_BOOK_PATTERNS.some((re) => re.test(text))) return false;
  if (/@|http|\.com|\.nl|\.be/.test(text)) return false;
  return /[a-zA-Z]{2,}/.test(text);
}

function normalizeKey(s: string): string {
  return s
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim();
}

/** Strip trailing " by Author" or " - Author" (common on spines). Returns title part for lookup. */
function extractTitleFromSpine(text: string): string[] {
  const trimmed = text.trim();
  const candidates: string[] = [trimmed];

  const byMatch = trimmed.match(/^(.+?)\s+by\s+[\p{L}\s\-']+$/iu);
  if (byMatch && byMatch[1].trim().length >= 4) {
    candidates.unshift(byMatch[1].trim());
  }

  const dashMatch = trimmed.match(/^(.+?)\s+-\s+[\p{L}\s\-']{4,}$/iu);
  if (dashMatch && dashMatch[1].trim().length >= 4) {
    candidates.unshift(dashMatch[1].trim());
  }

  return [...new Set(candidates)];
}

/** Demote candidates with obvious OCR noise (punctuation, stray digits) */
function hasOcrNoise(text: string): boolean {
  return /[\)\]]|[Dd]\)|[0-9][A-Za-z]{2,}[A-Za-z]*/.test(text) || /^[0-9]/.test(text);
}

/**
 * Score candidate for prioritization (higher = better).
 * Boost clean single-word titles (e.g. Tommyknockers). Demote OCR garbage.
 */
function scoreCandidate(text: string): number {
  const words = text.split(/\s+/).filter((w) => w.length >= 2);
  let score = text.length;
  if (words.length >= 3) score += 20;
  else if (words.length >= 2) score += 10;
  else if (words.length === 1 && text.length >= 6 && /^[A-Za-z]+$/.test(text.trim())) {
    score += 25; // Single clean word like Tommyknockers
  }
  if (hasOcrNoise(text)) score -= 30;
  return Math.max(0, score);
}

interface LineWithFrame {
  text: string;
  frame?: OcrFrame;
}

/** Group lines by horizontal position (spine columns). Same bin = same spine. */
function clusterLinesBySpine(lines: LineWithFrame[]): LineWithFrame[][] {
  const withFrame = lines.filter((l) => l.frame && l.text?.trim());
  const withoutFrame = lines.filter((l) => !l.frame && l.text?.trim());

  if (withFrame.length === 0) {
    return withoutFrame.length > 0 ? [withoutFrame] : [];
  }

  const bins = new Map<number, LineWithFrame[]>();

  for (const line of withFrame) {
    const f = line.frame!;
    const centerX = f.left + f.width / 2;
    const bin = Math.floor(centerX / SPINE_BIN_PX) * SPINE_BIN_PX;

    if (!bins.has(bin)) bins.set(bin, []);
    bins.get(bin)!.push(line);
  }

  const clusters = Array.from(bins.values());
  clusters.sort((a, b) => {
    const ax = a[0]?.frame ? a[0].frame!.left + a[0].frame!.width / 2 : 0;
    const bx = b[0]?.frame ? b[0].frame!.left + b[0].frame!.width / 2 : 0;
    return ax - bx;
  });

  if (withoutFrame.length > 0) {
    clusters.push(withoutFrame);
  }

  return clusters;
}

/**
 * Parse OCR result into potential book title candidates (not yet validated).
 * Uses spine clustering when frame data available; combines only lines in same cluster.
 * Capped at MAX_CANDIDATES to avoid slow lookups.
 */
export function parseOcrToCandidates(ocrResult: OcrResult): { title: string }[] {
  LOG('parseOcrToCandidates input', {
    blocks: ocrResult.blocks?.length ?? 0,
    totalLines: ocrResult.blocks?.reduce((n, b) => n + (b.lines?.length ?? 0), 0) ?? 0,
    hasFrames: ocrResult.blocks?.some((b) => b.lines?.some((l) => l.frame)),
  });

  const seen = new Set<string>();
  const candidates: { title: string; score: number }[] = [];

  const addIfNew = (text: string, combined = false) => {
    for (const part of extractTitleFromSpine(text)) {
      const key = normalizeKey(part);
      if (!key || seen.has(key)) continue;
      const passes = combined ? looksLikeCombinedTitle(part) : looksLikeBookTitle(part);
      if (!passes) continue;
      seen.add(key);
      candidates.push({ title: part, score: scoreCandidate(part) });
    }
  };

  for (const block of ocrResult.blocks || []) {
    const linesWithFrame: LineWithFrame[] = (block.lines || []).map((l) => ({
      text: l.text?.trim() ?? '',
      frame: l.frame,
    }));
    const lines = linesWithFrame.map((l) => l.text).filter(Boolean);

    const clusters = clusterLinesBySpine(linesWithFrame);

    for (const cluster of clusters) {
      const clusterLines = cluster.map((l) => l.text).filter(Boolean);
      if (clusterLines.length === 0) continue;

      for (const line of clusterLines) {
        if (line) addIfNew(line);
      }

      for (let i = 0; i < clusterLines.length; i++) {
        const two = [clusterLines[i], clusterLines[i + 1]].filter(Boolean).join(' ').trim();
        if (two && i + 1 < clusterLines.length) addIfNew(two, true);

        const three = [clusterLines[i], clusterLines[i + 1], clusterLines[i + 2]]
          .filter(Boolean)
          .join(' ')
          .trim();
        if (three && i + 2 < clusterLines.length) addIfNew(three, true);
      }

      if (clusterLines.length <= 4) {
        const joined = clusterLines.join(' ').trim();
        if (joined) addIfNew(joined, true);
      }
    }

    const blockText = block.text?.trim();
    if (blockText) addIfNew(blockText);
  }

  const sorted = candidates
    .sort((a, b) => b.score - a.score)
    .filter((c, i, arr) => {
      const key = normalizeKey(c.title);
      return arr.findIndex((x) => normalizeKey(x.title) === key) === i;
    })
    .slice(0, MAX_CANDIDATES)
    .map((c) => ({ title: c.title }));

  LOG('parseOcrToCandidates output', {
    rawCandidates: candidates.length,
    afterDedupe: candidates.length,
    final: sorted.length,
    titles: sorted.map((c) => c.title),
  });

  return sorted;
}
