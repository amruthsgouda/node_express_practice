const express = require("express");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const path = require("path");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");

const app = express();

const dbPath = path.join(__dirname, "covid19IndiaPortal.db");
let db = null;

// Express Middleware
app.use(express.json());

//Authentication Middleware
const authenticationToken = (request, response, next) => {
  let userJWToken;
  const authHeader = request.headers["authorization"];

  if (authHeader !== undefined) {
    userJWToken = authHeader.split(" ")[1];
  }
  if (userJWToken === undefined) {
    response.status(401);
    response.send("Invalid JWT Token");
  } else {
    jwt.verify(userJWToken, "SECRET_KEY", async (error, payload) => {
      if (error) {
        response.status(401);
        response.send("Invalid JWT Token");
      } else {
        request.username = payload.username;
        next();
      }
    });
  }
};

//API for server initialize and DB connection.
const initializeServerAndDb = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });

    app.listen(3000, () => {
      console.log("Server Hosted at http://localhost:3000/");
    });
  } catch (error) {
    console.log(`API initializing Server error: ${error.message}`);
    process.exit(1);
  }
};

initializeServerAndDb();

//Login API-1
app.post("/login/", async (request, response) => {
  try {
    const checkUserQuery = `SELECT * FROM user WHERE username = '${request.body.username}';`;

    const dbUser = await db.get(checkUserQuery);

    if (dbUser !== undefined) {
      if (dbUser.username === request.body.username) {
        const isPasswordMatch = await bcrypt.compare(
          request.body.password,
          dbUser.password
        );
        if (isPasswordMatch) {
          response.status(200);
          const payload = { username: dbUser.username };
          let jwtToken = await jwt.sign(payload, "SECRET_KEY");
          response.send({ jwtToken });
        } else {
          response.status(400);
          response.send("Invalid password");
        }
      } else {
        response.status(400);
        response.send("Invalid user");
      }
    } else {
      response.status(400);
      response.send("Invalid user");
    }
  } catch (error) {
    console.log(`Login API-1 error: ${error.message}`);
    process.exit(1);
  }
});

//get all states API-2
app.get("/states/", authenticationToken, async (request, response) => {
  try {
    const getAllStatesQuery = `SELECT * FROM state;`;
    const dbResponse = await db.all(getAllStatesQuery);
    function formatDbResponse(obj) {
      return {
        stateId: obj.state_id,
        stateName: obj.state_name,
        population: obj.population,
      };
    }
    const formattedDbResponse = dbResponse.map((eachstate) =>
      formatDbResponse(eachstate)
    );
    response.send(formattedDbResponse);
  } catch (error) {
    console.log(`Get States API-2 error: ${error.message}`);
    process.exit(1);
  }
});

//get states by id API-3
app.get("/states/:stateId/", authenticationToken, async (request, response) => {
  try {
    const { stateId } = request.params;
    const getStateByIdQuery = `SELECT * FROM state WHERE state_id = '${stateId}';`;
    const dbResponse = await db.get(getStateByIdQuery);
    response.send({
      stateId: dbResponse.state_id,
      stateName: dbResponse.state_name,
      population: dbResponse.population,
    });
  } catch (error) {
    console.log(`get states by id API-3 error: ${error.message}`);
    process.exit(1);
  }
});

//create district API-4
app.post("/districts/", authenticationToken, async (request, response) => {
  try {
    const {
      districtName,
      stateId,
      cases,
      cured,
      active,
      deaths,
    } = request.body;
    const createDistrictQuery = `INSERT INTO district (district_name, state_id, cases, cured, active, deaths) VALUES ('${districtName}', '${stateId}', '${cases}', '${cured}', '${active}', '${deaths}')`;
    await db.run(createDistrictQuery);
    response.send("District Successfully Added");
  } catch (error) {
    console.log(`create district API-4 error: ${error.message}`);
    process.exit(1);
  }
});

//get district by Id API5
app.get(
  "/districts/:districtId/",
  authenticationToken,
  async (request, response) => {
    try {
      const { districtId } = request.params;
      const getDistrictByIdQuery = `SELECT * FROM district WHERE district_id = '${districtId}';`;
      const dbResponse = await db.get(getDistrictByIdQuery);
      response.send({
        districtId: dbResponse.district_id,
        districtName: dbResponse.district_name,
        stateId: dbResponse.state_id,
        cases: dbResponse.cases,
        cured: dbResponse.cured,
        active: dbResponse.active,
        deaths: dbResponse.deaths,
      });
    } catch (error) {
      console.log(`get dist by id API-5 error: ${error.message}`);
      process.exit(1);
    }
  }
);

//Delete district API-6
app.delete(
  "/districts/:districtId/",
  authenticationToken,
  async (request, response) => {
    try {
      const { districtId } = request.params;
      const deleteDistrictQuery = `DELETE FROM district WHERE district_id = '${districtId}';`;
      await db.run(deleteDistrictQuery);
      response.send("District Removed");
    } catch (error) {
      console.log(`delete district API-6 error: ${error.message}`);
      process.exit(1);
    }
  }
);

//Update district details API-7
app.put(
  "/districts/:districtId/",
  authenticationToken,
  async (request, response) => {
    try {
      const {
        districtName,
        stateId,
        cases,
        cured,
        active,
        deaths,
      } = request.body;
      const { districtId } = request.params;
      const insertDistDetailsByIdQuery = `
        UPDATE
            district
        SET
            district_name= '${districtName}',
            state_id = '${stateId}',
            cases= '${cases}',
            cured= '${cured}',
            active= '${active}',
            deaths= '${deaths}'
        WHERE
            district_id = '${districtId}'`;
      await db.run(insertDistDetailsByIdQuery);
      response.send("District Details Updated");
    } catch (error) {
      console.log(`Update district details API-7 error: ${error.message}`);
      process.exit(1);
    }
  }
);

//get stats of states API-8
app.get(
  "/states/:stateId/stats/",
  authenticationToken,
  async (request, response) => {
    try {
      const { stateId } = request.params;
      const statsStateQuery = `
        SELECT
            SUM(cases) AS cases,
            SUM(cured) AS cured,
            SUM(active) AS active,
            SUM(deaths) AS deaths
        FROM
            district
        WHERE
            state_id ='${stateId}';`;
      const dbResponse = await db.get(statsStateQuery);
      response.send({
        totalCases: dbResponse.cases,
        totalCured: dbResponse.cured,
        totalActive: dbResponse.active,
        totalDeaths: dbResponse.deaths,
      });
    } catch (error) {
      console.log(`fetching stats API-8 error : ${error.message}`);
      process.exit(1);
    }
  }
);

module.exports = app;
