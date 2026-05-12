import { addDays, dateLabel, todayKey } from "../lib/groupShowings";

interface FilterState {
  searchText: string;
  selectedDate: string;
  selectedCinemas: Set<string>;
  selectedFormats: Set<string>;
  selectedSources: Set<string>;
}

interface Props {
  filters: FilterState;
  setFilters: (next: FilterState) => void;
  availableCinemas: { slug: string; name: string }[];
  availableFormats: string[];
  availableSources: string[];
  resultCount: number;
  totalCount: number;
}

const DATE_RANGE_DAYS = 8;

function buildDateOptions(): string[] {
  const today = todayKey();
  return Array.from({ length: DATE_RANGE_DAYS }, (_, i) => addDays(today, i));
}

function toggle(set: Set<string>, value: string): Set<string> {
  const next = new Set(set);
  if (next.has(value)) next.delete(value);
  else next.add(value);
  return next;
}

export function Filters({
  filters,
  setFilters,
  availableCinemas,
  availableFormats,
  availableSources,
  resultCount,
  totalCount,
}: Props) {
  const today = todayKey();
  const dateOptions = buildDateOptions();

  return (
    <div className="space-y-3 md:space-y-4">
      <div className="flex items-center gap-2 md:gap-3">
        <div className="relative flex-1 min-w-0">
          <input
            type="text"
            value={filters.searchText}
            onChange={(event) => setFilters({ ...filters, searchText: event.target.value })}
            placeholder="Search by title..."
            className="w-full bg-zinc-900/70 ring-1 ring-white/10 focus:ring-indigo-400/60 focus:outline-none rounded-xl px-3 py-2 md:px-4 md:py-3 text-sm md:text-base text-zinc-100 placeholder:text-zinc-500"
          />
        </div>
        <div className="shrink-0 text-xs md:text-sm text-zinc-400 tabular-nums">
          {resultCount} / {totalCount}
        </div>
      </div>

      <div className="flex md:flex-wrap gap-1.5 overflow-x-auto -mx-4 px-4 md:mx-0 md:px-0">
        {dateOptions.map((dateKey) => {
          const active = filters.selectedDate === dateKey;
          return (
            <button
              key={dateKey}
              type="button"
              onClick={() => setFilters({ ...filters, selectedDate: dateKey })}
              className={`shrink-0 whitespace-nowrap px-3 py-1.5 rounded-lg text-sm transition ${
                active
                  ? "bg-indigo-500 text-white"
                  : "bg-zinc-900/60 text-zinc-300 ring-1 ring-white/10 hover:ring-white/30"
              }`}
            >
              {dateLabel(dateKey, today)}
            </button>
          );
        })}
      </div>

      {availableCinemas.length > 0 ? (
        <div>
          <div className="text-[11px] uppercase tracking-wider text-zinc-500 mb-1.5">
            Cinemas
          </div>
          <div className="flex md:flex-wrap gap-1.5 overflow-x-auto -mx-4 px-4 md:mx-0 md:px-0">
            {availableCinemas.map((cinema) => {
              const active = filters.selectedCinemas.has(cinema.slug);
              return (
                <button
                  key={cinema.slug}
                  type="button"
                  onClick={() =>
                    setFilters({
                      ...filters,
                      selectedCinemas: toggle(filters.selectedCinemas, cinema.slug),
                    })
                  }
                  className={`shrink-0 whitespace-nowrap px-2.5 py-1 rounded-md text-xs transition ${
                    active
                      ? "bg-emerald-500/20 ring-1 ring-emerald-400/50 text-emerald-100"
                      : "bg-zinc-900/60 ring-1 ring-white/10 text-zinc-300 hover:ring-white/30"
                  }`}
                >
                  {cinema.name}
                </button>
              );
            })}
          </div>
        </div>
      ) : null}

      <div className="flex flex-wrap gap-x-6 gap-y-3">
        {availableFormats.length > 0 ? (
          <div>
            <div className="text-[11px] uppercase tracking-wider text-zinc-500 mb-1.5">
              Format
            </div>
            <div className="flex flex-wrap gap-1.5">
              {availableFormats.map((format) => {
                const active = filters.selectedFormats.has(format);
                return (
                  <button
                    key={format}
                    type="button"
                    onClick={() =>
                      setFilters({
                        ...filters,
                        selectedFormats: toggle(filters.selectedFormats, format),
                      })
                    }
                    className={`px-2.5 py-1 rounded-md text-xs transition ${
                      active
                        ? "bg-indigo-500/20 ring-1 ring-indigo-400/50 text-indigo-100"
                        : "bg-zinc-900/60 ring-1 ring-white/10 text-zinc-300 hover:ring-white/30"
                    }`}
                  >
                    {format}
                  </button>
                );
              })}
            </div>
          </div>
        ) : null}

        {availableSources.length > 1 ? (
          <div>
            <div className="text-[11px] uppercase tracking-wider text-zinc-500 mb-1.5">
              Source
            </div>
            <div className="flex flex-wrap gap-1.5">
              {availableSources.map((source) => {
                const active = filters.selectedSources.has(source);
                return (
                  <button
                    key={source}
                    type="button"
                    onClick={() =>
                      setFilters({
                        ...filters,
                        selectedSources: toggle(filters.selectedSources, source),
                      })
                    }
                    className={`px-2.5 py-1 rounded-md text-xs transition ${
                      active
                        ? "bg-rose-500/20 ring-1 ring-rose-400/50 text-rose-100"
                        : "bg-zinc-900/60 ring-1 ring-white/10 text-zinc-300 hover:ring-white/30"
                    }`}
                  >
                    {source}
                  </button>
                );
              })}
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}

export type { FilterState };
