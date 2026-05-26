export type CmsLegalPage = 'terms' | 'privacy' | 'about';

export type CmsLegalDocument = {
  title: string;
  body: string;
};

export type CmsLegalGlobal = Record<CmsLegalPage, CmsLegalDocument>;
