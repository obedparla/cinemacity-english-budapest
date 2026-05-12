export interface Showing {
  id: string;
  cinemaName: string;
  cinemaSlug: string;
  cinemaWebsite?: string;
  auditorium?: string;
  movieTitle: string;
  posterUrl?: string;
  isoDateTime: string;
  format: string[];
  bookingUrl?: string;
  filmLink?: string;
  language: {
    audio: string;
    subtitles?: string;
  };
  source: "cinemacity" | "artmozi" | "corvin";
  durationMinutes?: number;
  ageLimit?: string;
}

export interface SourceResult {
  source: "cinemacity" | "artmozi" | "corvin";
  showings: Showing[];
  errors: string[];
}

// Raw Cinema City API shape (subset used)
export interface CinemaCityFilm {
  id: string;
  name: string;
  length: number;
  posterLink: string;
  link: string;
  releaseYear: string;
  attributeIds: string[];
}

export interface CinemaCityEvent {
  id: string;
  filmId: string;
  cinemaId: string;
  businessDay: string;
  eventDateTime: string;
  attributeIds: string[];
  bookingLink: string;
  auditorium: string;
  soldOut: boolean;
}

export interface CinemaCityResponse {
  body: {
    films: CinemaCityFilm[];
    events: CinemaCityEvent[];
  };
}

export interface ArtmoziCinemaMeta {
  name: string;
  logo: string;
  url: string;
  node_id: string;
  weight: string;
}

export interface ArtmoziMovieMeta {
  title: string;
  ageLimit: string;
  imgUrl: string;
  webpUrl: string;
  cannonicalUrl: string;
}

export interface ArtmoziShowingSlot {
  cinema: number;
  cinema_room: string;
  link: string;
  visualEffect: string;
  dubSub: string;
  dubSubCode: string;
  premiere: string;
  accessible: boolean;
}

// schedule[date][movieId][time][slotId] = ArtmoziShowingSlot
export type ArtmoziSchedule = Record<
  string,
  Record<string, Record<string, Record<string, ArtmoziShowingSlot>>>
>;

export interface ArtmoziWeekResponse {
  generated: string;
  week: number;
  movies: Record<string, ArtmoziMovieMeta>;
  schedule: ArtmoziSchedule;
}

export interface ArtmoziWeeksIndexResponse {
  generated: string;
  weeks: number[];
  cinemas: Record<string, ArtmoziCinemaMeta>;
}

export interface FilmLanguageMeta {
  audioLanguages: string[];
  subtitleLanguages: string[];
  countries: string[];
  durationMinutes?: number;
}
