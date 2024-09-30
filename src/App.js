import { clear } from "@testing-library/user-event/dist/clear";
import { useEffect, useState } from "react";
import StarRating from "./StarRating";

const average = (arr) =>
  arr.reduce((acc, cur, i, arr) => acc + cur / arr.length, 0);
const KEY = "2e9fdece";
export default function App() {
  const [isDesktop, setIsDesktop] = useState(window.innerWidth >= 800);

  const [movies, setMovies] = useState([]);
  const [watched, setWatched] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [query, setQuery] = useState("inception");
  const [selectedMovieId, setSelectedMovie] = useState();
  const [error, setIsError] = useState("");

  useEffect(() => {
    const handleResize = () => {
      setIsDesktop(window.innerWidth >= 800);
    };

    window.addEventListener("resize", handleResize);
    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    const getData = async () => {
      try {
        setIsLoading(true);
        const response = await fetch(
          `http://www.omdbapi.com/?apikey=${KEY}&s=${query}`,
          { signal: controller.signal }
        );

        if (Number(response.status) !== 200)
          throw new Error("something went wrong");
        const data = await response.json();

        if (data.Response === "False") {
          throw new Error("No movie found..😒😒");
        }

        setMovies(data.Search);
        setIsLoading(false);
      } catch (err) {
        if (err.name !== "AbortError") {
          setIsError(err.message);
        }
      } finally {
        setIsLoading(false);
      }
    };
    if (!query.length) {
      setMovies([]);
      setWatched([]);
      return;
    }
    handleClose();
    getData();

    return function () {
      setIsError("");

      controller.abort();
    };
  }, [query]);

  const handleSelection = (movieId) => {
    setSelectedMovie((currId) => (currId == movieId ? "" : movieId));
  };
  const handleClose = () => {
    setSelectedMovie("");
  };
  const handleWatchedMovie = (movie) => {
    setWatched((prev) => [...prev, movie]);
  };
  const handleDeleteWatchedMovie = (movieId) => {
    setWatched((prev) => prev.filter((m) => m.imdbID !== movieId));
  };
  if (!isDesktop) {
    return (
      <>
        <div style={{ textAlign: "center", marginTop: "20%" }}>
          <h1>This application is only accessible on desktop devices.</h1>
        </div>
      </>
    );
  }

  return (
    <>
      <Navbar>
        <Logo />
        <Search query={query} setQuery={setQuery} />
        <NumResults movies={movies} />
      </Navbar>
      <Main>
        <Box>
          {isLoading && <Loading />}
          {!isLoading && !error && (
            <MovieList movies={movies} handleSelection={handleSelection} />
          )}
          {error && <ErrorDetails message={error} />}
        </Box>
        <Box>
          {selectedMovieId ? (
            <MovieDetails
              selectedMovieId={selectedMovieId}
              handleClose={handleClose}
              handleWatchedMovie={handleWatchedMovie}
              watched={watched}
            />
          ) : (
            <>
              {" "}
              <WatchedSummary watched={watched} />
              <WatchedMoviesList
                watched={watched}
                handleDeleteWatchedMovie={handleDeleteWatchedMovie}
              />
            </>
          )}
        </Box>
      </Main>
    </>
  );
}
function ErrorDetails({ message }) {
  return <h3 className="error">❌{message}❌</h3>;
}
function MovieDetails({
  selectedMovieId,
  handleClose,
  handleWatchedMovie,
  watched,
}) {
  const [clickedMovie, setClickedMovie] = useState("");
  const [userRating, setUserRating] = useState(0);
  const isWatched = watched.map((ele) => ele.imdbID).includes(selectedMovieId);
  const watchedUserRating = watched.find(
    (movie) => movie.imdbID === selectedMovieId
  )?.userRating;
  const stars = Array.from({ length: watchedUserRating }, (_, i) => (
    <span key={i}>⭐</span>
  ));

  const {
    Title: title,
    Year: year,
    Poster: poster,
    Runtime: runtime,
    imdbRating,
    Plot: plot,
    Released: released,
    Actors: actors,
    Director: director,
    Genre: genre,
  } = clickedMovie;
  useEffect(() => {
    const selectedMovie = async () => {
      try {
        const response = await fetch(
          `http://www.omdbapi.com/?apikey=${KEY}&i=${selectedMovieId}`
        );
        if (!response.ok) throw new Error("kuchh galat hai bro..");
        const data = await response.json();
        setClickedMovie(data);
      } catch (err) {
        console.log(err.message);
      }
    };
    selectedMovie();
  }, [clickedMovie]);
  useEffect(() => {
    if (!title) return;
    document.title = `Movie | ${title}`;
    return function () {
      document.title = "Rate-Movie";
    };
  }, [title]);

  const handleAdd = () => {
    const newWatchedMovie = {
      imdbID: selectedMovieId,
      title,
      year,
      poster,
      runtime: Number(runtime.split(" ").at(0)),
      imdbRating: Number(imdbRating),
      userRating,
    };
    handleWatchedMovie(newWatchedMovie);
  };
  useEffect(() => {
    function callBack(e) {
      if (e.code == "Escape") {
        handleClose();
      }
    }
    document.addEventListener("keydown", callBack);
    return () => document.removeEventListener("keydown", callBack);
  }, [handleClose]);
  return (
    <div className="details">
      <header>
        <button className="btn-back" onClick={handleClose}>
          &larr;
        </button>
        <img src={poster} alt={`poster of ${title}`} />
        <div className="details-overview">
          <h2>{title}</h2>
          <p>
            {released} &bull; {runtime}{" "}
          </p>
          <p>{genre}</p>
          <p>
            <span>⭐ </span> {imdbRating} IMDb Rating
          </p>
        </div>
      </header>
      <section>
        <>
          {isWatched ? (
            <p
              style={{
                padding: "2px",
                fontSize: "2rem",
                textTransform: "capitalize",
                fontWeight: "bold",
              }}
            >
              you rated {stars} this movie
            </p>
          ) : (
            <>
              <div>
                <StarRating
                  maxRating={10}
                  size={24}
                  onSetRating={setUserRating}
                />
              </div>
              {userRating && (
                <button className="btn-add" onClick={handleAdd}>
                  + Add to watchList
                </button>
              )}
            </>
          )}
        </>

        <p>
          <em>{plot}</em>
        </p>
        <p>starring {actors}</p>
        <p>Directed by {director}</p>
      </section>
    </div>
  );
}

function Loading() {
  return (
    <div
      style={{ position: "relative", left: "40%", top: "30%" }}
      className="spinner"
    ></div>
  );
}
function Navbar({ children }) {
  return <nav className="nav-bar">{children}</nav>;
}
const Logo = () => {
  return (
    <div className="logo">
      <span role="img">📺</span>
      <h1> Rate-Movies </h1>
    </div>
  );
};
function NumResults({ movies }) {
  return (
    <p className="num-results">
      Found <strong>{movies.length} </strong> results
    </p>
  );
}

function Search({ query, setQuery }) {
  return (
    <input
      className="search"
      type="text"
      placeholder="Search movies..."
      value={query}
      onChange={(e) => setQuery(e.target.value)}
    />
  );
}
function Main({ children }) {
  return <main className="main">{children}</main>;
}
function Box({ children }) {
  const [isOpen, setIsOpen] = useState(true);
  return (
    <div className="box">
      <button className="btn-toggle" onClick={() => setIsOpen((open) => !open)}>
        {isOpen ? "–" : "+"}
      </button>
      {isOpen && children}
    </div>
  );
}
// function WatchedBox() {
//   const [watched, setWatched] = useState(tempWatchedData);

//   const [isOpen2, setIsOpen2] = useState(true);
//   const avgImdbRating = average(watched.map((movie) => movie.imdbRating));
//   const avgUserRating = average(watched.map((movie) => movie.userRating));
//   const avgRuntime = average(watched.map((movie) => movie.runtime));
//   return (
//     <div className="box">
//       <button
//         className="btn-toggle"
//         onClick={() => setIsOpen2((open) => !open)}
//       >
//         {isOpen2 ? "–" : "+"}
//       </button>
//       {isOpen2 && (
//         <>
//           <WatchedSummary watched={watched} />
//           <WatchedMoviesList watched={watched} />
//         </>
//       )}
//     </div>
//   );
// }
function MovieList({ movies, handleSelection }) {
  return (
    <ul className="list list-movies">
      {movies?.map((movie) => (
        <Movie
          movie={movie}
          key={movie.imdbID}
          handleSelection={handleSelection}
        />
      ))}
    </ul>
  );
}
function Movie({ movie, handleSelection }) {
  return (
    <li onClick={() => handleSelection(movie.imdbID)}>
      <img src={movie.Poster} alt={`${movie.Title} poster`} />
      <h3>{movie.Title}</h3>
      <div>
        <p>
          <span>🗓</span>
          <span>{movie.Year}</span>
        </p>
      </div>
    </li>
  );
}
function WatchedSummary({ watched }) {
  const avgImdbRating = average(watched.map((movie) => movie.imdbRating));
  const avgUserRating = average(watched.map((movie) => movie.userRating));
  const avgRuntime = average(watched.map((movie) => movie.runtime));
  return (
    <div className="summary">
      <h2>Movies you watched</h2>
      <div>
        <p>
          <span>#️⃣</span>
          <span>{watched.length} movies</span>
        </p>
        <p>
          <span>⭐️</span>
          <span>{avgImdbRating.toFixed(2)}</span>
        </p>
        <p>
          <span>🌟</span>
          <span>{avgUserRating.toFixed(2)}</span>
        </p>
        <p>
          <span>⏳</span>
          <span>{avgRuntime.toFixed(2)} min</span>
        </p>
      </div>
    </div>
  );
}
function WatchedMoviesList({ watched, handleDeleteWatchedMovie }) {
  return (
    <ul className="list">
      {watched.map((movie) => (
        <WatchedMovie
          movie={movie}
          key={movie.imdbID}
          handleDeleteWatchedMovie={handleDeleteWatchedMovie}
        />
      ))}
    </ul>
  );
}
function WatchedMovie({ movie, handleDeleteWatchedMovie }) {
  const { poster, title, userRating, year, imdbRating, runtime } = movie;
  return (
    <li>
      <img src={movie.poster} alt={`${title} poster`} />
      <h3>{title}</h3>
      <div>
        <p>
          <span>⭐️</span>
          <span>{imdbRating}</span>
        </p>
        <p>
          <span>🌟</span>
          <span>{userRating}</span>
        </p>
        <p>
          <span>⏳</span>
          <span>{runtime} min</span>
        </p>
        <button onClick={() => handleDeleteWatchedMovie(movie.imdbID)}>
          <span>❌</span>
        </button>
      </div>
    </li>
  );
}
