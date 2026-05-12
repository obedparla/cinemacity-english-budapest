import { Showing } from "../types";

export interface MovieGroup {
  movieTitle: string;
  posterUrl?: string;
  durationMinutes?: number;
  ageLimit?: string;
  byCinema: Map<string, CinemaGroup>;
  allFormats: Set<string>;
  earliestIso: string;
  filmLink?: string;
}

export interface CinemaGroup {
  cinemaName: string;
  cinemaSlug: string;
  cinemaWebsite?: string;
  source: Showing["source"];
  showings: Showing[];
}

export function getLocalDateKey(isoDateTime: string): string {
  // YYYY-MM-DD from the local date portion of an ISO string without tz offset
  return isoDateTime.slice(0, 10);
}

export function groupShowings(showings: Showing[]): MovieGroup[] {
  const byTitle = new Map<string, MovieGroup>();

  for (const showing of showings) {
    const key = showing.movieTitle.toLowerCase().trim();
    let group = byTitle.get(key);
    if (!group) {
      group = {
        movieTitle: showing.movieTitle,
        posterUrl: showing.posterUrl,
        durationMinutes: showing.durationMinutes,
        ageLimit: showing.ageLimit,
        byCinema: new Map(),
        allFormats: new Set(),
        earliestIso: showing.isoDateTime,
        filmLink: showing.filmLink,
      };
      byTitle.set(key, group);
    }
    if (!group.posterUrl && showing.posterUrl) group.posterUrl = showing.posterUrl;
    if (!group.durationMinutes && showing.durationMinutes)
      group.durationMinutes = showing.durationMinutes;
    if (!group.ageLimit && showing.ageLimit) group.ageLimit = showing.ageLimit;
    if (!group.filmLink && showing.filmLink) group.filmLink = showing.filmLink;
    if (showing.isoDateTime < group.earliestIso) group.earliestIso = showing.isoDateTime;
    showing.format.forEach((format) => group!.allFormats.add(format));

    let cinema = group.byCinema.get(showing.cinemaSlug);
    if (!cinema) {
      cinema = {
        cinemaName: showing.cinemaName,
        cinemaSlug: showing.cinemaSlug,
        cinemaWebsite: showing.cinemaWebsite,
        source: showing.source,
        showings: [],
      };
      group.byCinema.set(showing.cinemaSlug, cinema);
    }
    if (!cinema.cinemaWebsite && showing.cinemaWebsite) {
      cinema.cinemaWebsite = showing.cinemaWebsite;
    }
    cinema.showings.push(showing);
  }

  for (const group of byTitle.values()) {
    for (const cinema of group.byCinema.values()) {
      cinema.showings.sort((a, b) => a.isoDateTime.localeCompare(b.isoDateTime));
    }
  }

  return Array.from(byTitle.values()).sort((a, b) =>
    a.earliestIso.localeCompare(b.earliestIso),
  );
}

export function formatTime(isoDateTime: string): string {
  const time = isoDateTime.slice(11, 16);
  return time || isoDateTime;
}

export function dateLabel(dateKey: string, today: string): string {
  if (dateKey === today) return "Today";
  const date = new Date(dateKey + "T00:00:00");
  const tomorrow = new Date(today + "T00:00:00");
  tomorrow.setDate(tomorrow.getDate() + 1);
  if (date.getTime() === tomorrow.getTime()) return "Tomorrow";
  return date.toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

export function todayKey(): string {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, "0");
  const day = String(today.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function addDays(dateKey: string, days: number): string {
  const date = new Date(dateKey + "T00:00:00");
  date.setDate(date.getDate() + days);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}
