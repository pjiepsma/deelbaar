/**
 * OCR adapter – ML Kit Text Recognition wrapper (Google AI Edge).
 * Passes frame data for spine clustering.
 */

import type { OcrResult } from './types';

let TextRecognition: {
  recognize: (imagePath: string, script?: string) => Promise<{
    text: string;
    blocks: Array<{
      text: string;
      frame?: { left: number; top: number; width: number; height: number };
      lines: Array<{
        text: string;
        frame?: { left: number; top: number; width: number; height: number };
      }>;
    }>;
  }>;
} | null = null;

try {
  const mlkit = require('@react-native-ml-kit/text-recognition');
  TextRecognition = mlkit.default;
} catch {
  // ML Kit not available (e.g. web, or module not linked)
}

const TEXT_SCRIPT_LATIN = 'Latin';

const LOG = (msg: string, data?: unknown) => {
  console.log(`[BookScan:OCR] ${msg}`, data !== undefined ? data : '');
};

const UNAVAILABLE_MESSAGE =
  'Boekherkenning werkt alleen op een telefoon. Voer "expo prebuild" uit als developer.';

export function isAvailable(): boolean {
  return TextRecognition != null;
}

function mapFrame(f?: { left: number; top: number; width: number; height: number }) {
  if (!f || typeof f.left !== 'number') return undefined;
  return { left: f.left, top: f.top, width: f.width, height: f.height };
}

/**
 * Recognize text in an image. On-device, no cloud, no API keys.
 * Uses Latin script for Dutch/English book spines.
 */
export async function recognize(imageUri: string): Promise<OcrResult> {
  LOG('recognize start', { uri: imageUri.slice(0, 50) });

  if (!TextRecognition) {
    throw new Error(UNAVAILABLE_MESSAGE);
  }

  const result = await TextRecognition.recognize(imageUri, TEXT_SCRIPT_LATIN);

  const blocks = (result.blocks || []).map((block) => ({
    text: block.text ?? '',
    frame: mapFrame(block.frame),
    lines: (block.lines || []).map((line) => ({
      text: line.text ?? '',
      frame: mapFrame(line.frame),
    })),
  }));

  LOG('recognize done', {
    blocks: blocks.length,
    lines: blocks.flatMap((b) => b.lines || []).length,
    sample: blocks.slice(0, 2).map((b) => ({ text: b.text?.slice(0, 40), lines: b.lines?.length })),
  });

  return { blocks };
}
