/**
 * AI Edge – on-device text recognition and book detection.
 * ML Kit OCR + Open Library/Google Books lookup. Fully free, no API keys.
 * Optional: Gemini vision (free tier) when EXPO_PUBLIC_GEMINI_API_KEY is set.
 */

import * as ImageManipulator from 'expo-image-manipulator';
import { Image } from 'react-native';

import { parseOcrToCandidates } from './bookDetector';
import {
  analyzeBookshelfWithGemini,
  isGeminiAvailable,
} from './geminiAnalyzer';
import { lookupAndFilterBooks } from './bookLookup';
import { recognize as ocrRecognize, isAvailable as ocrIsAvailable } from './ocrAdapter';
import type { BookDetection, OcrResult } from './types';

export type { BookDetection } from './types';

export const isTextRecognitionAvailable = ocrIsAvailable;
export const isGeminiVisionAvailable = isGeminiAvailable;

export type AnalyzeProgress = (done: number, total: number) => void;

const LOG = (msg: string, data?: unknown) => {
  const out = `[BookScan] ${msg}`;
  if (data !== undefined) {
    console.log(out, data);
  } else {
    console.log(out);
  }
};

const MIN_EDGE_PX = 600;
const TARGET_EDGE_PX = 720;

function getImageDimensions(uri: string): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    Image.getSize(
      uri,
      (width, height) => resolve({ width, height }),
      (err) => reject(err)
    );
  });
}

async function ensureMinResolution(imageUri: string): Promise<string> {
  try {
    const { width, height } = await getImageDimensions(imageUri);
    const longEdge = Math.max(width, height);
    LOG('ensureMinResolution', { width, height, longEdge, resized: longEdge < MIN_EDGE_PX });
    if (longEdge >= MIN_EDGE_PX) return imageUri;

    const scale = TARGET_EDGE_PX / longEdge;
    const newWidth = Math.round(width * scale);
    const newHeight = Math.round(height * scale);

    const result = await ImageManipulator.manipulateAsync(
      imageUri,
      [{ resize: { width: newWidth, height: newHeight } }],
      { compress: 0.9, format: ImageManipulator.SaveFormat.JPEG }
    );
    LOG('ensureMinResolution resized', { newWidth, newHeight });
    return result.uri;
  } catch (err) {
    LOG('ensureMinResolution failed, using original', err);
    return imageUri;
  }
}

/** Merge OCR results. Drops frame data when merging multiple orientations (coordinates are incompatible). */
function mergeOcrResults(results: OcrResult[], fromMultipleOrientations: boolean): OcrResult {
  const blocks = results.flatMap((r) => r.blocks || []);
  LOG('mergeOcrResults', { inputBlocks: results.map((r) => r.blocks?.length ?? 0), mergedBlocks: blocks.length });
  if (!fromMultipleOrientations) return { blocks };

  return {
    blocks: blocks.map((b) => ({
      text: b.text,
      lines: (b.lines || []).map((l) => ({ text: l.text })),
    })),
  };
}

async function ocrAtRotation(
  imageUri: string,
  degrees: number
): Promise<OcrResult> {
  try {
    const rotated = await ImageManipulator.manipulateAsync(
      imageUri,
      [{ rotate: degrees }],
      { compress: 0.9, format: ImageManipulator.SaveFormat.JPEG }
    );
    return ocrRecognize(rotated.uri);
  } catch (err) {
    LOG(`ocrAtRotation ${degrees}° failed`, err);
    return { blocks: [] };
  }
}

/**
 * Analyze a bookshelf photo. Uses Gemini vision if API key present, else ML Kit OCR.
 * ML Kit: OCR at 0°/90°/180°/270° + Open Library/Google Books lookup.
 */
export async function analyzeBookshelf(
  imageUri: string,
  onProgress?: AnalyzeProgress
): Promise<BookDetection[]> {
  console.log('[BookScan] *** ENTRY analyzeBookshelf ***', imageUri.slice(0, 60));
  LOG('analyzeBookshelf start', { imageUri: imageUri.slice(0, 60) });

  if (isGeminiAvailable()) {
    const geminiResult = await analyzeBookshelfWithGemini(imageUri);
    if (geminiResult && geminiResult.length > 0) {
      LOG('analyzeBookshelf done (Gemini)', { results: geminiResult.length, books: geminiResult.map((r) => r.title) });
      return geminiResult;
    }
    LOG('Gemini failed or empty, falling back to ML Kit');
  }

  const uri = await ensureMinResolution(imageUri);

  const [ocr0, ocr90, ocr180, ocr270] = await Promise.all([
    ocrRecognize(uri),
    ocrAtRotation(uri, 90),
    ocrAtRotation(uri, 180),
    ocrAtRotation(uri, 270),
  ]);

  LOG('OCR blocks per orientation', {
    '0°': ocr0.blocks?.length ?? 0,
    '90°': ocr90.blocks?.length ?? 0,
    '180°': ocr180.blocks?.length ?? 0,
    '270°': ocr270.blocks?.length ?? 0,
    '0° lines': ocr0.blocks?.flatMap((b) => b.lines || []).length ?? 0,
  });

  const merged = mergeOcrResults(
    [ocr0, ocr90, ocr180, ocr270],
    true
  );
  LOG('merged', { blocks: merged.blocks?.length ?? 0, totalLines: merged.blocks?.flatMap((b) => b.lines || []).length ?? 0 });

  const candidates = parseOcrToCandidates(merged);
  LOG('candidates from detector', { count: candidates.length, titles: candidates.map((c) => c.title) });

  const results = await lookupAndFilterBooks(candidates, onProgress);
  LOG('analyzeBookshelf done', { results: results.length, books: results.map((r) => r.title) });
  return results;
}
