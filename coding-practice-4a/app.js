const express = require("express");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const path = require("path");

const app = express();
app.use(express.json());
const dbPath = path.join(__dirname, "cricketTeam.db");
let db = null;

const convertDbObjToResponseObj = (dbObject) => {
  return {
    playerId: dbObject.player_id,
    playerName: dbObject.player_name,
    jerseyNumber: dbObject.jersey_number,
    role: dbObject.role,
  };
};

//Server and DB initializing API
const initializeServerAndDb = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });

    app.listen(5000, () => {
      console.log("Server hosted at http://localhost:5000/");
    });
  } catch (err) {
    response.send(`DB error: ${err.message}`);
    process.exit(1);
  }
};

initializeServerAndDb();

//Get All player details API
app.get("/players/", async (request, response) => {
  try {
    const playerDetailsQuery = `
    SELECT
        *
    FROM
        cricket_team
    ORDER BY
        player_id;`;
    const playerArr = await db.all(playerDetailsQuery);
    const playerArrInCamelCase = playerArr.map((eachplayer) =>
      convertDbObjToResponseObj(eachplayer)
    );
    response.send(playerArrInCamelCase);
  } catch (error) {
    response.send(`Get Player Details API err: ${error.message}`);
    process.exit(1);
  }
});

//Post new player API
app.post("/players/", async (request, response) => {
  try {
    const playerDetails = request.body;
    const { playerName, jerseyNumber, role } = playerDetails;
    const playerAddQuery = `
        INSERT INTO
            cricket_team (player_name, jersey_number, role)
        VALUES
            (
                '${playerName}',
                '${jerseyNumber}',
                '${role}'
            )`;
    const dbResponse = await db.run(playerAddQuery);
    const playerId = dbResponse.lastId;
    response.send("Player Added to Team");
  } catch (error) {
    response.send(`Post player error: ${error.message}`);
    process.exit(1);
  }
});

//Get player based on Id API
app.get("/players/:playerId/", async (request, response) => {
  try {
    const { playerId } = request.params;
    const getPlayerByIdQuery = `SELECT* FROM cricket_team WHERE player_id = ${playerId}`;
    const playerByIdArr = await db.get(getPlayerByIdQuery);
    const playerInCamelCase = convertDbObjToResponseObj(playerByIdArr);
    response.send(playerInCamelCase);
  } catch (error) {
    response.send(`get player by Id err: ${error.message}`);
    process.exit(1);
  }
});

//Update player based on Id API
app.put("/players/:playerId/", async (request, response) => {
  try {
    const { playerId } = request.params;
    const playerDetails = request.body;
    const { playerName, jerseyNumber, role } = playerDetails;
    const updatePlayerQuery = `UPDATE cricket_team SET player_name="${playerName}", jersey_number= "${jerseyNumber}", role= "${role}" WHERE player_id=${playerId}`;
    await db.run(updatePlayerQuery);
    response.send("Player Details Updated");
  } catch (error) {
    response.send(`Update Player by Id Err: ${error.message}`);
    process.exit(1);
  }
});

//Delete player by ID API
app.delete("/players/:playerId/", async (request, response) => {
  try {
    const { playerId } = request.params;
    const deletePlayerQuery = `DELETE FROM cricket_team WHERE player_id = ${playerId}`;
    await db.run(deletePlayerQuery);
    response.send("Player Removed");
  } catch (error) {
    response.send(`Delete Player API err: ${error.message}`);
    process.exit(1);
  }
});

module.exports = app;
