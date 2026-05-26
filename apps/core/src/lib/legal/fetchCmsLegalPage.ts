import { getPayloadRuntime } from '../api/payloadRuntime';
import type { CmsLegalDocument, CmsLegalGlobal, CmsLegalPage } from './cmsLegal.types';

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function parseLegalPage(value: unknown, page: CmsLegalPage): CmsLegalDocument {
  if (!isRecord(value)) {
    throw new Error(`CMS legal global is missing "${page}" content.`);
  }
  const title = value.title;
  const body = value.body;
  if (typeof title !== 'string' || title.trim() === '') {
    throw new Error(`CMS legal "${page}" is missing a title.`);
  }
  if (typeof body !== 'string' || body.trim() === '') {
    throw new Error(`CMS legal "${page}" is missing body text.`);
  }
  return { title: title.trim(), body: body.trim() };
}

function parseLegalGlobal(payload: unknown): CmsLegalGlobal {
  if (!isRecord(payload)) {
    throw new Error('CMS legal global response was invalid.');
  }
  return {
    terms: parseLegalPage(payload.terms, 'terms'),
    privacy: parseLegalPage(payload.privacy, 'privacy'),
    about: parseLegalPage(payload.about, 'about'),
  };
}

export async function fetchCmsLegalPage(page: CmsLegalPage): Promise<CmsLegalDocument> {
  const { baseURL } = getPayloadRuntime();
  const response = await fetch(`${baseURL}/globals/legal`, {
    headers: { Accept: 'application/json' },
  });
  if (!response.ok) {
    throw new Error(`CMS legal global request failed (${response.status}).`);
  }
  const json: unknown = await response.json();
  const global = parseLegalGlobal(json);
  return global[page];
}
