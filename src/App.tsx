import { useMemo, useState } from "react";
import { useQueries, useQuery } from "react-query";
import { Filters, type FilterState } from "./components/Filters";
import { MovieCard } from "./components/MovieCard";
import { addDays, getLocalDateKey, groupShowings, todayKey } from "./lib/groupShowings";
import { fetchCinemaCityShowings } from "./sources/cinemacity";
import { fetchArtmoziNetworkShowings, fetchCorvinShowings } from "./sources/artmozi";
import { lookupEnglishTitle } from "./sources/wikidata";
import { SourceResult } from "./types";

const SOURCES = ["cinemacity", "artmozi", "corvin"] as const;

function emptyFilters(): FilterState {
  return {
    searchText: "",
    selectedDate: todayKey(),
    selectedCinemas: new Set(),
    selectedFormats: new Set(),
    selectedSources: new Set(),
  };
}

function App() {
  const [filters, setFilters] = useState<FilterState>(emptyFilters);

  const cinemaCityQueries = useQueries(
    Array.from({ length: 8 }, (_, i) => addDays(todayKey(), i)).map((date) => ({
      queryKey: ["cinemacity", date],
      queryFn: () => fetchCinemaCityShowings(date),
      staleTime: 1000 * 60 * 10,
    })),
  );

  const artmoziQuery = useQuery<SourceResult>(
    "artmozi",
    fetchArtmoziNetworkShowings,
    { staleTime: 1000 * 60 * 10 },
  );
  const corvinQuery = useQuery<SourceResult>("corvin", fetchCorvinShowings, {
    staleTime: 1000 * 60 * 10,
  });

  const allShowings = useMemo(() => {
    const showings = [];
    for (const query of cinemaCityQueries) {
      if (query.data) showings.push(...query.data.showings);
    }
    if (artmoziQuery.data) showings.push(...artmoziQuery.data.showings);
    if (corvinQuery.data) showings.push(...corvinQuery.data.showings);
    return showings;
  }, [cinemaCityQueries, artmoziQuery.data, corvinQuery.data]);

  const errors = useMemo(() => {
    const list: string[] = [];
    cinemaCityQueries.forEach((query) => {
      if (query.data) list.push(...query.data.errors);
      if (query.error) list.push(String(query.error));
    });
    if (artmoziQuery.data) list.push(...artmoziQuery.data.errors);
    if (artmoziQuery.error) list.push(String(artmoziQuery.error));
    if (corvinQuery.data) list.push(...corvinQuery.data.errors);
    if (corvinQuery.error) list.push(String(corvinQuery.error));
    return list;
  }, [cinemaCityQueries, artmoziQuery.data, artmoziQuery.error, corvinQuery.data, corvinQuery.error]);

  const isLoading =
    cinemaCityQueries.some((query) => query.isLoading) ||
    artmoziQuery.isLoading ||
    corvinQuery.isLoading;

  const dateFiltered = useMemo(
    () =>
      allShowings.filter(
        (showing) => getLocalDateKey(showing.isoDateTime) === filters.selectedDate,
      ),
    [allShowings, filters.selectedDate],
  );

  const availableCinemas = useMemo(() => {
    const map = new Map<string, string>();
    for (const showing of dateFiltered) {
      map.set(showing.cinemaSlug, showing.cinemaName);
    }
    return Array.from(map.entries())
      .map(([slug, name]) => ({ slug, name }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [dateFiltered]);

  const availableFormats = useMemo(() => {
    const formats = new Set<string>();
    dateFiltered.forEach((showing) => showing.format.forEach((format) => formats.add(format)));
    return Array.from(formats).sort();
  }, [dateFiltered]);

  const availableSources = useMemo(() => {
    const sources = new Set<string>();
    dateFiltered.forEach((showing) => sources.add(showing.source));
    return SOURCES.filter((source) => sources.has(source));
  }, [dateFiltered]);

  const uniqueTitles = useMemo(() => {
    const titles = new Set<string>();
    allShowings.forEach((showing) => titles.add(showing.movieTitle));
    return Array.from(titles).sort();
  }, [allShowings]);

  const englishTitleQueries = useQueries(
    uniqueTitles.map((title) => ({
      queryKey: ["wikidata-title", title],
      queryFn: () => lookupEnglishTitle(title),
      staleTime: 1000 * 60 * 60 * 24,
      cacheTime: 1000 * 60 * 60 * 24,
      retry: 1,
    })),
  );

  const englishTitleMap = useMemo(() => {
    const map = new Map<string, string>();
    englishTitleQueries.forEach((query, index) => {
      const value = query.data;
      if (typeof value === "string" && value.length > 0) {
        map.set(uniqueTitles[index], value);
      }
    });
    return map;
  }, [englishTitleQueries, uniqueTitles]);

  const filtered = useMemo(() => {
    const text = filters.searchText.trim().toLowerCase();
    return dateFiltered.filter((showing) => {
      if (text) {
        const englishTitle = englishTitleMap.get(showing.movieTitle)?.toLowerCase() ?? "";
        const hungarianTitle = showing.movieTitle.toLowerCase();
        if (!hungarianTitle.includes(text) && !englishTitle.includes(text)) return false;
      }
      if (filters.selectedCinemas.size > 0 && !filters.selectedCinemas.has(showing.cinemaSlug)) {
        return false;
      }
      if (
        filters.selectedFormats.size > 0 &&
        !showing.format.some((format) => filters.selectedFormats.has(format))
      ) {
        return false;
      }
      if (filters.selectedSources.size > 0 && !filters.selectedSources.has(showing.source)) {
        return false;
      }
      return true;
    });
  }, [dateFiltered, filters, englishTitleMap]);

  const grouped = useMemo(() => groupShowings(filtered), [filtered]);
  const totalGrouped = useMemo(() => groupShowings(dateFiltered), [dateFiltered]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-zinc-950 via-zinc-950 to-black text-zinc-100">
      <div className="max-w-6xl mx-auto px-4 py-4 md:py-10">
        <header className="mb-4 md:mb-10">
          <h1 className="text-2xl md:text-5xl font-bold tracking-tight">
            English movies in Budapest
          </h1>
          <p className="mt-1 md:mt-2 text-zinc-400 text-xs md:text-base">
            Cinema City · Művész · Puskin · Toldi · Tabán · Kino Cafe · Corvin
          </p>
        </header>

        <div className="sticky top-0 -mx-4 px-4 py-3 md:py-4 mb-4 md:mb-6 bg-zinc-950/90 backdrop-blur z-10 border-b border-white/5">
          <Filters
            filters={filters}
            setFilters={setFilters}
            availableCinemas={availableCinemas}
            availableFormats={availableFormats}
            availableSources={availableSources}
            resultCount={grouped.length}
            totalCount={totalGrouped.length}
          />
        </div>

        {isLoading && grouped.length === 0 ? (
          <div className="grid place-items-center py-24 text-zinc-400">
            <div className="animate-pulse">Loading showings...</div>
          </div>
        ) : grouped.length === 0 ? (
          <div className="grid place-items-center py-24 text-zinc-500 text-center">
            <div>
              <div className="text-lg">No English screenings match.</div>
              <div className="text-sm mt-1">Try a different date or clear filters.</div>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {grouped.map((movie) => (
              <MovieCard
                key={movie.movieTitle}
                movie={movie}
                englishTitle={englishTitleMap.get(movie.movieTitle)}
              />
            ))}
          </div>
        )}

        {errors.length > 0 ? (
          <details className="mt-10 text-xs text-zinc-500">
            <summary className="cursor-pointer hover:text-zinc-300">
              {errors.length} fetch warning(s)
            </summary>
            <ul className="mt-2 space-y-1">
              {errors.map((error, index) => (
                <li key={index} className="font-mono">
                  {error}
                </li>
              ))}
            </ul>
          </details>
        ) : null}
      </div>
    </div>
  );
}

export default App;
