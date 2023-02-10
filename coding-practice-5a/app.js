const express = require("express");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const path = require("path");

const app = express();
app.use(express.json());
const dbPath = path.join(__dirname, "moviesData.db");
let db = null;

function snakeCaseToCamelCase(obj) {
  return {
    movieName: obj.movie_name,
  };
}

function snakeCaseToCameCaseDirectors(obj) {
  return {
    directorId: obj.director_id,
    directorName: obj.director_name,
  };
}

//initializing Server and Database
const initializeDbAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });

    app.listen(5000, () => {
      console.log("Server hosted at http://localhost:5000/");
    });
  } catch (error) {
    response.send(`server and db hosting API err: ${error.message}`);
    process.exit(1);
  }
};

initializeDbAndServer();

//Create API1 - get Movie Name
app.get("/movies/", async (request, response) => {
  try {
    const getMoviesQuery = `SELECT movie_name FROM movie ORDER BY movie_id;`;
    const dbResponseArr = await db.all(getMoviesQuery);
    const movieNames = dbResponseArr.map((eachMovie) =>
      snakeCaseToCamelCase(eachMovie)
    );
    response.send(movieNames);
  } catch (error) {
    response.send(`get all movies api err: ${error.message}`);
    process.exit(1);
  }
});

//Create API2 - post new movie in the table
app.post("/movies/", async (request, response) => {
  try {
    const movieDetails = request.body;
    const { directorId, movieName, leadActor } = movieDetails;
    const postMovieQuery = `
        INSERT INTO 
            movie (director_id, movie_name, lead_actor) 
        VALUES 
            ('${directorId}', '${movieName}', '${leadActor}'); `;
    await db.run(postMovieQuery);
    response.send("Movie Successfully Added");
  } catch (error) {
    response.send(`post all movie api err: ${error.message}`);
    process.exit(1);
  }
});

function getMovieInFormat(obj) {
  return {
    movieId: obj.movie_id,
    directorId: obj.director_id,
    movieName: obj.movie_name,
    leadActor: obj.lead_actor,
  };
}

//get movie by Id : API3
app.get("/movies/:movieId/", async (request, response) => {
  try {
    const { movieId } = request.params;
    const getMovieByIdQuery = `SELECT* FROM movie WHERE movie_id = ${movieId};`;
    const dbResponseArr = await db.get(getMovieByIdQuery);
    const formattedResponse = getMovieInFormat(dbResponseArr);
    response.send(formattedResponse);
  } catch (error) {
    response.send(`get movie API err: ${error.message}`);
    process.exit(1);
  }
});

//update movie by Id: API4
app.put("/movies/:movieId/", async (request, response) => {
  try {
    const { movieId } = request.params;
    const movieDetails = request.body;
    const { directorId, movieName, leadActor } = movieDetails;
    const updateMovieByIdQuery = `
        UPDATE 
            movie 
        SET 
            director_id = "${directorId}",
            movie_name = "${movieName}",
            lead_actor = "${leadActor}"
        WHERE
            movie_id = ${movieId};`;
    await db.run(updateMovieByIdQuery);
    response.send("Movie Details Updated");
  } catch (error) {
    response.send(`Update API err: ${error.message}`);
    process.exit(1);
  }
});

//Delete movie by Id: API5
app.delete("/movies/:movieId/", async (request, response) => {
  try {
    const { movieId } = request.params;
    const deleteMovieQuery = `DELETE FROM movie WHERE movie_id = ${movieId}`;
    await db.run(deleteMovieQuery);
    response.send("Movie Removed");
  } catch (error) {
    response.send(`Delete movie API err: ${error.message}`);
    process.exit(1);
  }
});

//Director name by Id: API6
app.get("/directors/", async (request, response) => {
  try {
    const getDirectorsQuery = `SELECT * FROM director ORDER BY director_id;`;
    const dbResponseArr = await db.all(getDirectorsQuery);
    const formatResponseArr = dbResponseArr.map((eachDir) =>
      snakeCaseToCameCaseDirectors(eachDir)
    );
    response.send(formatResponseArr);
  } catch (error) {
    response.send(`Director name list API: ${error.message}`);
    process.exit(1);
  }
});

//Director name and movie : API7
app.get("/directors/:directorId/movies/", async (request, response) => {
  try {
    const { directorId } = request.params;
    const movieNameByDirectorIdQuery = `SELECT movie_name FROM movie WHERE director_id = ${directorId} ORDER BY movie_id;`;
    const dbResponseArr = await db.all(movieNameByDirectorIdQuery);
    const formattedResponse = dbResponseArr.map((eachMovie) =>
      snakeCaseToCamelCase(eachMovie)
    );
    response.send(formattedResponse);
  } catch (error) {
    response.send(`DirectorName movieName API err: ${error.message}`);
    process.exit(1);
  }
});

module.exports = app;
