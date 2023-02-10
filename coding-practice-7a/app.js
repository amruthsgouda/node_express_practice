const express = require("express");
const path = require("path");
const sqlite3 = require("sqlite3");
const { open } = require("sqlite");

const app = express();
app.use(express.json());

const dbPath = path.join(__dirname, "cricketMatchDetails.db");
let db = null;

//initialize server and db API
const initializeServerAndDb = async (request, response) => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });

    app.listen(5000, () => {
      console.log("Hosted server at http://localhost:5000/");
    });
  } catch (error) {
    response.send(`Initializing Server and DB error: ${error.message}`);
    process.exit(1);
  }
};

initializeServerAndDb();

function formattedPlayerList(obj) {
  return {
    playerId: obj.player_id,
    playerName: obj.player_name,
  };
}

//get all players from players table API1
app.get("/players/", async (request, response) => {
  try {
    const getAllPlayersQuery = `SELECT* FROM player_details ORDER BY player_id;`;
    const dbResponse = await db.all(getAllPlayersQuery);
    const formattedDbResponse = dbResponse.map((eachPlayer) =>
      formattedPlayerList(eachPlayer)
    );
    response.send(formattedDbResponse);
  } catch (error) {
    response.send(`get all players API1 error: ${error.message}`);
    process.exit(1);
  }
});

//player by player ID API2
app.get("/players/:playerId/", async (request, response) => {
  try {
    const { playerId } = request.params;
    const playerByIdQuery = `SELECT * FROM player_details WHERE player_id=${playerId};`;
    const dbResponse = await db.get(playerByIdQuery);
    const formattedResponse = formattedPlayerList(dbResponse);
    response.send(formattedResponse);
  } catch (error) {
    response.send(`player by playerId API2 error: ${error.message}`);
    process.exit(1);
  }
});

//Update details of player by player ID API3
app.put("/players/:playerId/", async (request, response) => {
  try {
    const { playerId } = request.params;
    const playerDetails = request.body;
    const { playerName } = playerDetails;
    const playerUpdateQuery = `
        UPDATE 
            player_details
        SET 
            player_name = "${playerName}"
        WHERE
            player_id =${playerId};`;
    await db.run(playerUpdateQuery);
    response.send("Player Details Updated");
  } catch (error) {
    response.send(`update player by Id API3 error: ${error.message}`);
    process.exit(1);
  }
});

//match details by id API4
app.get("/matches/:matchId/", async (request, response) => {
  try {
    const { matchId } = request.params;
    const getMatchDetailsByIdQuery = `
        SELECT
            * 
        FROM
            match_details 
        WHERE 
            match_id =${matchId};
        `;
    const dbResponse = await db.get(getMatchDetailsByIdQuery);
    response.send({
      matchId: dbResponse.match_id,
      match: dbResponse.match,
      year: dbResponse.year,
    });
  } catch (error) {
    response.send(`match details by Id API4 error: ${error.message}`);
    process.exit(1);
  }
});

function formattedCamelCasePlayerMatches(obj) {
  return {
    matchId: obj.match_id,
    match: obj.match,
    year: obj.year,
  };
}

//matches list of player API5
app.get("/players/:playerId/matches", async (request, response) => {
  try {
    const { playerId } = request.params;
    const playerMatchesQuery = `
        SELECT
            *
        FROM
            player_match_score
        NATURAL JOIN
            match_details
        WHERE
            player_id =${playerId};`;
    const dbResponse = await db.all(playerMatchesQuery);
    response.send(
      dbResponse.map((eachMatches) =>
        formattedCamelCasePlayerMatches(eachMatches)
      )
    );
  } catch (error) {
    response.send(`matches list by player API5 error: ${error.message}`);
    process.exit(1);
  }
});

function playerNameByMatch(obj) {
  return {
    playerId: obj.player_id,
    playerName: obj.player_name,
  };
}

//list of player by match id API6
app.get("/matches/:matchId/players", async (request, response) => {
  try {
    const { matchId } = request.params;
    const playersByMatchQuery = `
        SELECT
            *
        FROM
            player_details
        NATURAL JOIN
            player_match_score
        WHERE
            match_id =${matchId};`;
    const dbResponse = await db.all(playersByMatchQuery);
    response.send(
      dbResponse.map((eachPlayer) => playerNameByMatch(eachPlayer))
    );
  } catch (error) {
    response.send(`matches list by player API6 error: ${error.message}`);
    process.exit(1);
  }
});

//statistics of player by ID API7
app.get("/players/:playerId/playerScores", async (request, response) => {
  try {
    const { playerId } = request.params;
    const statsOfPlayerQuery = `
        SELECT
            player_match_score.player_id AS playerId,
            player_details.player_name AS playerName,
            SUM(player_match_score.score) AS totalScore,
            SUM(player_match_score.fours) AS totalFours,
            SUM(player_match_score.sixes) AS totalSixes
        FROM
            player_match_score
        INNER JOIN
            player_details
        ON 
            player_match_score.player_id = player_details.player_id
        WHERE 
            player_match_score.player_id = ${playerId}
        GROUP BY
            player_match_score.player_id;`;
    const dbResponse = await db.get(statsOfPlayerQuery);
    response.send(dbResponse);
  } catch (error) {
    response.send(`stats of player API7 error: ${error.message}`);
    process.exit(1);
  }
});

module.exports = app;
