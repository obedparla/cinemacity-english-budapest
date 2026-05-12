const WIKIDATA_API = "https://www.wikidata.org/w/api.php";
const TYPE_KEYWORDS = ["film", "movie", "concert", "documentary", "anime"];

interface WbSearchResult {
  id: string;
  label?: string;
  description?: string;
  match?: { language?: string };
}

interface WbSearchResponse {
  search?: WbSearchResult[];
}

function cleanTitle(title: string): string {
  return title
    .replace(/\s*\([^)]*\)\s*$/g, "")
    .replace(/\s+-\s+(eredeti|original|magyar|szinkron|premier)[^-]*$/i, "")
    .trim();
}

function isFilmEntity(description: string | undefined): boolean {
  if (!description) return false;
  const lower = description.toLowerCase();
  return TYPE_KEYWORDS.some((keyword) => lower.includes(keyword));
}

export async function lookupEnglishTitle(hungarianTitle: string): Promise<string | null> {
  const cleaned = cleanTitle(hungarianTitle);
  if (!cleaned) return null;

  const params = new URLSearchParams({
    action: "wbsearchentities",
    search: cleaned,
    language: "hu",
    uselang: "en",
    format: "json",
    type: "item",
    limit: "8",
    origin: "*",
  });

  const response = await fetch(`${WIKIDATA_API}?${params.toString()}`);
  if (!response.ok) return null;
  const data = (await response.json()) as WbSearchResponse;
  const candidates = data.search ?? [];

  for (const candidate of candidates) {
    if (!isFilmEntity(candidate.description)) continue;
    const label = (candidate.label ?? "").trim();
    if (!label) continue;
    if (label.toLowerCase() === cleaned.toLowerCase()) return null;
    if (label.toLowerCase() === hungarianTitle.toLowerCase()) return null;
    return label;
  }

  return null;
}
