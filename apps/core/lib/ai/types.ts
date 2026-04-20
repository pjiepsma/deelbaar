/**
 * Shared types for AI Edge on-device text recognition and book detection.
 */

export interface BookDetection {
  id: string;
  title: string;
  author?: string;
  confidence: number;
  category?: string;
}

export interface OcrFrame {
  left: number;
  top: number;
  width: number;
  height: number;
}

/** Normalized OCR result – backend-agnostic for bookDetector */
export interface OcrResult {
  blocks: Array<{
    text: string;
    frame?: OcrFrame;
    lines: Array<{
      text: string;
      frame?: OcrFrame;
    }>;
  }>;
}
