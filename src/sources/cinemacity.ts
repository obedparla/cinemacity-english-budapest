import {
  CinemaCityEvent,
  CinemaCityFilm,
  CinemaCityResponse,
  Showing,
  SourceResult,
} from "../types";

interface CinemaCityLocation {
  id: string;
  displayName: string;
  slug: string;
  website: string;
}

const BUDAPEST_CINEMAS: CinemaCityLocation[] = [
  {
    id: "1133",
    displayName: "Cinema City Allee",
    slug: "cc-allee",
    website: "https://www.cinemacity.hu/cinemas/allee",
  },
  {
    id: "1132",
    displayName: "Cinema City Aréna",
    slug: "cc-arena",
    website: "https://www.cinemacity.hu/cinemas/arena",
  },
  {
    id: "1139",
    displayName: "Cinema City Campona",
    slug: "cc-campona",
    website: "https://www.cinemacity.hu/cinemas/campona",
  },
  {
    id: "1141",
    displayName: "Cinema City Duna Pláza",
    slug: "cc-duna",
    website: "https://www.cinemacity.hu/cinemas/dunaplaza",
  },
  {
    id: "1144",
    displayName: "Cinema City Mammut",
    slug: "cc-mammut",
    website: "https://www.cinemacity.hu/cinemas/mammut",
  },
  {
    id: "1137",
    displayName: "Cinema City Westend",
    slug: "cc-westend",
    website: "https://www.cinemacity.hu/cinemas/westend",
  },
];

const FORMAT_ATTRIBUTES = new Set([
  "2d",
  "3d",
  "4dx",
  "imax",
  "imax-3d",
  "vip",
  "dolby-atmos",
  "screenx",
  "hfr",
  "4k",
]);

function buildUrl(cinemaId: string, date: string): string {
  return `/proxy/cinemacity/hu/data-api-service/v1/quickbook/10102/film-events/in-cinema/${cinemaId}/at-date/${date}`;
}

function isEnglishFilm(film: CinemaCityFilm): boolean {
  return film.attributeIds.some((attribute) => attribute.startsWith("original-lang-en"));
}

function eventIsSubbed(event: CinemaCityEvent): boolean {
  return event.attributeIds.includes("subbed") && !event.attributeIds.includes("dubbed");
}

function extractFormats(attributeIds: string[]): string[] {
  const formats = attributeIds.filter((attribute) => FORMAT_ATTRIBUTES.has(attribute));
  if (formats.length === 0) return ["2D"];
  return formats.map((format) => format.toUpperCase().replace("-", " "));
}

async function fetchCinemaCityDay(
  cinemaId: string,
  date: string,
): Promise<CinemaCityResponse> {
  const response = await fetch(buildUrl(cinemaId, date));
  if (!response.ok) throw new Error(`Cinema City ${cinemaId} ${date}: HTTP ${response.status}`);
  return response.json();
}

export async function fetchCinemaCityShowings(date: string): Promise<SourceResult> {
  const showings: Showing[] = [];
  const errors: string[] = [];

  const results = await Promise.allSettled(
    BUDAPEST_CINEMAS.map(async (cinema) => {
      const data = await fetchCinemaCityDay(cinema.id, date);
      const englishFilms = data.body.films.filter(isEnglishFilm);
      const filmById = new Map(englishFilms.map((film) => [film.id, film]));

      for (const event of data.body.events) {
        const film = filmById.get(event.filmId);
        if (!film) continue;
        if (!eventIsSubbed(event)) continue;

        showings.push({
          id: `cc-${event.id}`,
          cinemaName: cinema.displayName,
          cinemaSlug: cinema.slug,
          cinemaWebsite: cinema.website,
          auditorium: event.auditorium,
          movieTitle: film.name,
          posterUrl: film.posterLink,
          isoDateTime: event.eventDateTime,
          format: extractFormats(event.attributeIds),
          bookingUrl: event.bookingLink,
          filmLink: film.link,
          language: { audio: "English", subtitles: "Hungarian" },
          source: "cinemacity",
          durationMinutes: film.length,
        });
      }
    }),
  );

  results.forEach((result, index) => {
    if (result.status === "rejected") {
      errors.push(`${BUDAPEST_CINEMAS[index].displayName}: ${result.reason}`);
    }
  });

  return { source: "cinemacity", showings, errors };
}
