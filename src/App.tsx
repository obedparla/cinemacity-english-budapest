import "./App.css";
import { useQuery } from "react-query";
import { MoviesData } from "./types.ts";

function fetchCinema<T>(cinemaId: number, date: string): Promise<T> {
  return fetch(
    "https://corsproxy.io/?" +
      encodeURIComponent(
        `https://www.cinemacity.hu/hu/data-api-service/v1/quickbook/10102/film-events/in-cinema/${cinemaId}/at-date/${date}`,
      ),
  ).then((r) => r.json() as unknown as Promise<T>);
}

function getFormattedDate(date: Date) {
  return `${date.getFullYear()}`;
}

function App() {
  const query = useQuery("alle", () => fetchCinema<MoviesData>(1133));

  if (query.isLoading) {
    return "loading";
  }

  if (query.error || !query.data) {
    return "error";
  }

  const englishMovies = query.data.body.films.filter(
    (film) =>
      film.attributeIds.find((id) => id === "subbed") &&
      film.attributeIds.find((id) => id === "original-lang-en-us"),
  );

  console.log(englishMovies);

  return (
    <>
      <h1>List of english movies in budapest</h1>

      <div className={"text-2xl font-bold"}> Alle Mall</div>

      {englishMovies.map((movie) => {
        const times = query.data.body.events
          .filter(
            (event) =>
              event.filmId === movie.id &&
              event.attributeIds.find((id) => id === "subbed"),
          )
          .map((event) => event.eventDateTime);

        return (
          <div className={"mt-2"} key={movie.id}>
            <div>{movie.name}</div>
            <img
              src={movie.posterLink}
              className={"max-w-36"}
              alt={`${movie.name} posted`}
            />

            {times.map((time) => {
              const hours = new Date(time).getHours();
              const minutes = new Date(time).getMinutes();

              return (
                <div key={time}>
                  {hours}:{minutes}
                </div>
              );
            })}
          </div>
        );
      })}
    </>
  );
}

export default App;
