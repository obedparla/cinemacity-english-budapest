import {
  ArtmoziCinemaMeta,
  ArtmoziWeekResponse,
  ArtmoziWeeksIndexResponse,
  FilmLanguageMeta,
  SourceResult,
} from "../types";
import {
  buildIsoDateTime,
  dubSubLabel,
  isLikelyEnglish,
  parseFilmPageMeta,
  slugFromCanonicalUrl,
  visualEffectToLabel,
} from "./artmoziShared";

interface ArtmoziSourceConfig {
  source: "artmozi" | "corvin";
  apiBase: string;
  pageProxyBase: string;
  label: string;
}

const ARTMOZI_CONFIG: ArtmoziSourceConfig = {
  source: "artmozi",
  apiBase: "/proxy/artmozi-api",
  pageProxyBase: "/proxy/artmozi-page",
  label: "Artmozi network",
};

const CORVIN_CONFIG: ArtmoziSourceConfig = {
  source: "corvin",
  apiBase: "/proxy/corvin-api",
  pageProxyBase: "/proxy/corvin-page",
  label: "Corvin",
};

async function fetchWeekIndex(config: ArtmoziSourceConfig): Promise<ArtmoziWeeksIndexResponse> {
  const response = await fetch(`${config.apiBase}/schedule/week`);
  if (!response.ok) throw new Error(`${config.label} week index: HTTP ${response.status}`);
  return response.json();
}

async function fetchWeek(
  config: ArtmoziSourceConfig,
  week: number,
): Promise<ArtmoziWeekResponse> {
  const response = await fetch(`${config.apiBase}/schedule/week/${week}`);
  if (!response.ok) throw new Error(`${config.label} week ${week}: HTTP ${response.status}`);
  return response.json();
}

async function fetchFilmLanguageMeta(
  config: ArtmoziSourceConfig,
  canonicalUrl: string,
): Promise<FilmLanguageMeta> {
  const slug = slugFromCanonicalUrl(canonicalUrl);
  if (!slug) return { audioLanguages: [], subtitleLanguages: [], countries: [] };
  const response = await fetch(`${config.pageProxyBase}/filmek/${slug}`);
  if (!response.ok) {
    throw new Error(`${config.label} film page ${slug}: HTTP ${response.status}`);
  }
  const html = await response.text();
  return parseFilmPageMeta(html);
}

interface RawShowing {
  movieId: string;
  cinemaId: string;
  cinemaName: string;
  cinemaWebsite: string;
  dateKey: string;
  time: string;
  slotId: string;
  room: string;
  visualEffect: string;
  dubSub: string;
  dubSubCode: string;
  link: string;
  movieTitle: string;
  posterUrl: string;
  ageLimit: string;
  cannonicalUrl: string;
}

function flattenWeek(
  week: ArtmoziWeekResponse,
  cinemas: Record<string, ArtmoziCinemaMeta>,
): RawShowing[] {
  const showings: RawShowing[] = [];
  for (const [dateKey, byMovie] of Object.entries(week.schedule)) {
    for (const [movieId, byTime] of Object.entries(byMovie)) {
      const movie = week.movies[movieId];
      if (!movie) continue;
      for (const [time, bySlot] of Object.entries(byTime)) {
        for (const [slotId, slot] of Object.entries(bySlot)) {
          const cinemaMeta = cinemas[String(slot.cinema)];
          if (!cinemaMeta) continue;
          showings.push({
            movieId,
            cinemaId: String(slot.cinema),
            cinemaName: cinemaMeta.name,
            cinemaWebsite: cinemaMeta.url,
            dateKey,
            time,
            slotId,
            room: slot.cinema_room,
            visualEffect: slot.visualEffect,
            dubSub: slot.dubSub,
            dubSubCode: slot.dubSubCode,
            link: slot.link,
            movieTitle: movie.title,
            posterUrl: movie.imgUrl || movie.webpUrl,
            ageLimit: movie.ageLimit,
            cannonicalUrl: movie.cannonicalUrl,
          });
        }
      }
    }
  }
  return showings;
}

async function loadAllShowings(config: ArtmoziSourceConfig): Promise<{
  raw: RawShowing[];
  weekErrors: string[];
}> {
  const index = await fetchWeekIndex(config);
  const weeks = index.weeks ?? [];
  const cinemas = index.cinemas ?? {};
  // Fetch up to 2 weeks ahead so the UI can offer a date selector
  const weeksToFetch = weeks.slice(0, 2);
  const weekResults = await Promise.allSettled(
    weeksToFetch.map((week) => fetchWeek(config, week)),
  );
  const raw: RawShowing[] = [];
  const errors: string[] = [];
  weekResults.forEach((result, index) => {
    if (result.status === "fulfilled") {
      raw.push(...flattenWeek(result.value, cinemas));
    } else {
      errors.push(`${config.label} week ${weeksToFetch[index]}: ${result.reason}`);
    }
  });
  return { raw, weekErrors: errors };
}

async function buildEnglishShowings(
  config: ArtmoziSourceConfig,
): Promise<SourceResult> {
  const result: SourceResult = { source: config.source, showings: [], errors: [] };
  let raw: RawShowing[];
  try {
    const loaded = await loadAllShowings(config);
    raw = loaded.raw;
    result.errors.push(...loaded.weekErrors);
  } catch (error) {
    result.errors.push(`${config.label}: ${(error as Error).message}`);
    return result;
  }

  const uniqueMovies = new Map<string, RawShowing>();
  for (const showing of raw) {
    if (!uniqueMovies.has(showing.movieId)) {
      uniqueMovies.set(showing.movieId, showing);
    }
  }

  const metaByMovie = new Map<string, FilmLanguageMeta>();
  const metaResults = await Promise.allSettled(
    Array.from(uniqueMovies.entries()).map(async ([movieId, sample]) => {
      const meta = await fetchFilmLanguageMeta(config, sample.cannonicalUrl);
      return { movieId, meta };
    }),
  );
  metaResults.forEach((entry, index) => {
    const sample = Array.from(uniqueMovies.values())[index];
    if (entry.status === "fulfilled") {
      metaByMovie.set(entry.value.movieId, entry.value.meta);
    } else {
      result.errors.push(`${config.label} meta for "${sample.movieTitle}": ${entry.reason}`);
    }
  });

  for (const showing of raw) {
    if (showing.dubSubCode === "sz") continue;
    const meta = metaByMovie.get(showing.movieId);
    if (!meta) continue;
    if (!isLikelyEnglish(meta)) continue;

    const dubSub = dubSubLabel(showing.dubSub, showing.dubSubCode);
    result.showings.push({
      id: `${config.source}-${showing.slotId}`,
      cinemaName: showing.cinemaName,
      cinemaSlug: `am-${showing.cinemaId}`,
      cinemaWebsite: showing.cinemaWebsite,
      auditorium: showing.room,
      movieTitle: showing.movieTitle,
      posterUrl: showing.posterUrl,
      isoDateTime: buildIsoDateTime(showing.dateKey, showing.time),
      format: [visualEffectToLabel(showing.visualEffect)],
      bookingUrl: showing.link,
      filmLink: showing.cannonicalUrl,
      language: dubSub,
      source: config.source,
      durationMinutes: meta.durationMinutes,
      ageLimit: showing.ageLimit,
    });
  }

  return result;
}

export function fetchArtmoziNetworkShowings(): Promise<SourceResult> {
  return buildEnglishShowings(ARTMOZI_CONFIG);
}

export function fetchCorvinShowings(): Promise<SourceResult> {
  return buildEnglishShowings(CORVIN_CONFIG);
}
