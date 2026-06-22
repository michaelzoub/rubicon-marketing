export interface ExtractedPayload {
  sourcePlatform: "substack" | "x";
  sourceUrl: string;
  title: string | null;
  subtitle: string | null;
  authorName: string | null;
  authorHandle: string | null;
  publishedAt: string | null;
  body: string | null;
  sections: Array<{ heading: string | null; text: string }>;
  media: Array<{ type: string; url: string | null; alt: string | null }>;
  rawExtractedText: string | null;
  warnings: string[];
  isPartial: boolean;
}
export function extractSubstack(doc: Document, pageUrl: string): ExtractedPayload;
export function extractX(doc: Document, pageUrl: string): ExtractedPayload;
