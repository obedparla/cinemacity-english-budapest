import { CinemaGroup, MovieGroup, formatTime } from "../lib/groupShowings";

interface Props {
  movie: MovieGroup;
  englishTitle?: string;
}

const SOURCE_COLOR: Record<string, string> = {
  cinemacity: "bg-rose-500/20 text-rose-200 ring-rose-400/30",
  artmozi: "bg-emerald-500/20 text-emerald-200 ring-emerald-400/30",
  corvin: "bg-amber-500/20 text-amber-200 ring-amber-400/30",
};

function CinemaBlock({ cinema }: { cinema: CinemaGroup }) {
  const cinemaNameNode = cinema.cinemaWebsite ? (
    <a
      href={cinema.cinemaWebsite}
      target="_blank"
      rel="noopener noreferrer"
      className="text-sm font-semibold text-zinc-100 hover:text-indigo-300 hover:underline underline-offset-2"
    >
      {cinema.cinemaName}
      <span aria-hidden className="ml-1 text-zinc-500">↗</span>
    </a>
  ) : (
    <span className="text-sm font-semibold text-zinc-100">{cinema.cinemaName}</span>
  );

  return (
    <div className="rounded-lg bg-white/5 ring-1 ring-white/10 p-2.5 sm:p-3">
      <div className="flex items-center justify-between mb-2 gap-2">
        {cinemaNameNode}
        <span
          className={`shrink-0 text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full ring-1 ${
            SOURCE_COLOR[cinema.source] ?? "bg-zinc-500/20 text-zinc-300 ring-zinc-400/30"
          }`}
        >
          {cinema.source}
        </span>
      </div>
      <div className="flex flex-wrap gap-1.5">
        {cinema.showings.map((showing) => (
          <a
            key={showing.id}
            href={showing.bookingUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="group/tag flex flex-col items-start gap-0.5 px-3 py-1.5 sm:px-2.5 sm:py-1 rounded-md bg-zinc-900/60 hover:bg-zinc-800 active:bg-zinc-800 ring-1 ring-white/5 hover:ring-white/20 transition"
            title={`${showing.auditorium ?? ""} - ${showing.format.join(", ")}`}
          >
            <span className="text-base sm:text-sm tabular-nums text-zinc-100">
              {formatTime(showing.isoDateTime)}
            </span>
            <span className="text-[10px] uppercase tracking-wider text-zinc-400 group-hover/tag:text-zinc-200">
              {showing.format.join(" · ")}
              {showing.language.subtitles ? ` · ${showing.language.subtitles} subs` : ""}
            </span>
          </a>
        ))}
      </div>
    </div>
  );
}

function titlesAreEquivalent(a: string, b: string): boolean {
  const normalize = (value: string) =>
    value
      .toLowerCase()
      .replace(/[.,;:!?-]/g, "")
      .replace(/\s+/g, " ")
      .trim();
  return normalize(a) === normalize(b);
}

export function MovieCard({ movie, englishTitle }: Props) {
  const cinemas = Array.from(movie.byCinema.values()).sort((a, b) =>
    a.cinemaName.localeCompare(b.cinemaName),
  );

  const showBothTitles =
    englishTitle && !titlesAreEquivalent(englishTitle, movie.movieTitle);
  const primaryTitle = showBothTitles ? englishTitle : movie.movieTitle;

  return (
    <article className="grid grid-cols-[120px,1fr] sm:grid-cols-[160px,1fr] gap-3 sm:gap-4 p-3 sm:p-4 rounded-2xl bg-zinc-900/60 ring-1 ring-white/10 hover:ring-white/20 transition-shadow">
      <a
        href={movie.filmLink}
        target="_blank"
        rel="noopener noreferrer"
        className="block aspect-[2/3] overflow-hidden rounded-lg bg-zinc-800 self-start"
      >
        {movie.posterUrl ? (
          <img
            src={movie.posterUrl}
            alt={movie.movieTitle}
            loading="lazy"
            className="w-full h-full object-cover transition-transform hover:scale-105"
          />
        ) : (
          <div className="w-full h-full grid place-items-center text-zinc-500 text-xs">
            no poster
          </div>
        )}
      </a>
      <div className="flex flex-col min-w-0">
        <div className="flex items-baseline gap-2 flex-wrap">
          <h2 className="text-lg md:text-xl font-semibold text-white">{primaryTitle}</h2>
          {movie.durationMinutes ? (
            <span className="text-xs text-zinc-400">{movie.durationMinutes} min</span>
          ) : null}
          {movie.ageLimit ? (
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-zinc-800 ring-1 ring-white/10 text-zinc-300">
              {movie.ageLimit}+
            </span>
          ) : null}
        </div>
        {showBothTitles ? (
          <div className="text-xs text-zinc-500 mt-0.5">({movie.movieTitle})</div>
        ) : null}
        {movie.allFormats.size > 0 ? (
          <div className="mt-1.5 flex flex-wrap gap-1">
            {Array.from(movie.allFormats).map((format) => (
              <span
                key={format}
                className="text-[10px] uppercase tracking-wider px-1.5 py-0.5 rounded bg-indigo-500/20 ring-1 ring-indigo-400/30 text-indigo-200"
              >
                {format}
              </span>
            ))}
          </div>
        ) : null}
        <div className="mt-3 flex flex-col gap-2">
          {cinemas.map((cinema) => (
            <CinemaBlock key={cinema.cinemaSlug} cinema={cinema} />
          ))}
        </div>
      </div>
    </article>
  );
}
