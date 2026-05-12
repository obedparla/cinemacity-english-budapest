import { FilmLanguageMeta } from "../types";

const ENGLISH_COUNTRIES = new Set([
  "amerikai",
  "brit",
  "ír",
  "ausztrál",
  "új-zélandi",
  "kanadai",
]);

export function isLikelyEnglish(meta: FilmLanguageMeta): boolean {
  if (meta.audioLanguages.some((language) => language.toLowerCase().includes("angol"))) {
    return true;
  }
  if (meta.audioLanguages.length === 0 && meta.countries.length > 0) {
    return meta.countries.some((country) =>
      ENGLISH_COUNTRIES.has(country.trim().toLowerCase()),
    );
  }
  return false;
}

function extractFieldItems(html: string, fieldName: string): string[] {
  const fieldMarker = `field--name-${fieldName}`;
  const fieldStart = html.indexOf(fieldMarker);
  if (fieldStart < 0) return [];
  const block = html.slice(fieldStart, fieldStart + 3000);
  const sectionEnd = block.indexOf("</section>");
  const scoped = sectionEnd > 0 ? block.slice(0, sectionEnd) : block;
  const items: string[] = [];
  const itemRegex = /class="field--item"[^>]*>\s*<a[^>]*>([^<]+)<\/a>/g;
  let match: RegExpExecArray | null;
  while ((match = itemRegex.exec(scoped)) !== null) {
    items.push(match[1].trim());
  }
  if (items.length === 0) {
    const plainRegex = /class="field--item">([^<]+)</g;
    while ((match = plainRegex.exec(scoped)) !== null) {
      const value = match[1].trim();
      if (value) items.push(value);
    }
  }
  return items;
}

function extractDuration(html: string): number | undefined {
  const fieldStart = html.indexOf("field--name-art-movie-duration");
  if (fieldStart < 0) return undefined;
  const block = html.slice(fieldStart, fieldStart + 1000);
  const match = block.match(/>(\d{1,3})\s*(perc|min)?/i);
  if (!match) return undefined;
  const parsed = parseInt(match[1], 10);
  return Number.isFinite(parsed) ? parsed : undefined;
}

export function parseFilmPageMeta(html: string): FilmLanguageMeta {
  return {
    audioLanguages: extractFieldItems(html, "art-movie-langdubs"),
    subtitleLanguages: extractFieldItems(html, "art-movie-langsubs"),
    countries: extractFieldItems(html, "art-movie-country-tax"),
    durationMinutes: extractDuration(html),
  };
}

export function visualEffectToLabel(effect: string): string {
  // visual-effect-2d -> 2D, visual-effect-3d -> 3D
  const value = effect.replace(/^visual-effect-/, "").toUpperCase();
  return value || "2D";
}

export function dubSubLabel(dubSub: string, dubSubCode: string): {
  audio: string;
  subtitles?: string;
} {
  const lower = dubSub.toLowerCase();
  if (dubSubCode === "sz" || lower.includes("szinkron")) {
    return { audio: "Hungarian (dubbed)" };
  }
  if (lower.includes("original version") || lower === "eredeti nyelven") {
    return { audio: "Original" };
  }
  if (lower.includes("magyar és angol felirat")) {
    return { audio: "Original", subtitles: "Hungarian + English" };
  }
  if (lower.includes("magyar felirat")) {
    return { audio: "Original", subtitles: "Hungarian" };
  }
  if (lower.includes("angol felirat")) {
    return { audio: "Original", subtitles: "English" };
  }
  return { audio: dubSub || "Original" };
}

export function slugFromCanonicalUrl(canonicalUrl: string): string | undefined {
  const match = canonicalUrl.match(/\/filmek\/([^/?#]+)/);
  return match ? match[1] : undefined;
}

export function dateStringFromKey(key: string): string {
  // 20260512 -> 2026-05-12
  if (key.length !== 8) return key;
  return `${key.slice(0, 4)}-${key.slice(4, 6)}-${key.slice(6, 8)}`;
}

export function buildIsoDateTime(dateKey: string, time: string): string {
  // "20260512" + "16:30" -> "2026-05-12T16:30:00"
  const date = dateStringFromKey(dateKey);
  return `${date}T${time}:00`;
}
