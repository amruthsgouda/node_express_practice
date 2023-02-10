const express = require("express");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const path = require("path");

const app = express();
app.use(express.json());
let db = null;

const dbPath = path.join(__dirname, "covid19India.db");

const initializeServerAndDb = async (request, response) => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });

    app.listen(5000, () => {
      console.log("Server hoisted at http://localhost:5000/");
    });
  } catch (error) {
    response.send(`initialize Server API err: ${error.message}`);
    process.exit(1);
  }
};

initializeServerAndDb();

function getAllStatesFormatted(obj) {
  return {
    stateId: obj.state_id,
    stateName: obj.state_name,
    population: obj.population,
  };
}

//get all states API1
app.get("/states/", async (request, response) => {
  try {
    const getAllStatesQuery = `SELECT * FROM state ORDER BY state_id;`;
    const dbResponseArr = await db.all(getAllStatesQuery);
    const formattedResponse = dbResponseArr.map((eachState) =>
      getAllStatesFormatted(eachState)
    );
    response.send(formattedResponse);
  } catch (error) {
    response.send(`Get all states API error: ${error.message}`);
    process.exit(1);
  }
});

//get state by Id API2
app.get("/states/:stateId/", async (request, response) => {
  try {
    const { stateId } = request.params;
    const getStateByIdQuery = `SELECT* FROM state WHERE state_id = ${stateId};`;
    const dbResponse = await db.get(getStateByIdQuery);
    const formattedResponse = getAllStatesFormatted(dbResponse);
    response.send(formattedResponse);
  } catch (error) {
    response.send(`Get state by Id API err: ${error.message}`);
    process.exit(1);
  }
});

//Create District in District Table API3
app.post("/districts/", async (request, response) => {
  try {
    const districtDetails = request.body;
    const {
      districtName,
      stateId,
      cases,
      cured,
      active,
      deaths,
    } = districtDetails;
    const postDistrictQuery = `
        INSERT INTO
            district (district_name, state_id, cases, cured, active, deaths)
        VALUES
            ("${districtName}", "${stateId}", "${cases}", "${cured}", "${active}", "${deaths}");
        `;
    await db.run(postDistrictQuery);
    response.send("District Successfully Added");
  } catch (error) {
    response.send(`Create District API error: ${error.message}`);
    process.exit(1);
  }
});

function formatedDistrictResponse(obj) {
  return {
    districtId: obj.district_id,
    districtName: obj.district_name,
    stateId: obj.state_id,
    cases: obj.cases,
    cured: obj.cured,
    active: obj.active,
    deaths: obj.deaths,
  };
}

//return district based on district ID API4
app.get("/districts/:districtId/", async (request, response) => {
  try {
    const { districtId } = request.params;
    const districtByIdQuery = `SELECT * FROM district WHERE district_id = ${districtId}`;
    const dbResponse = await db.get(districtByIdQuery);
    const formatedResponse = formatedDistrictResponse(dbResponse);
    response.send(formatedResponse);
  } catch (error) {
    response.send(`District by District ID API error: ${error.message}`);
    process.exit(1);
  }
});

//Delete District API5
app.delete("/districts/:districtId/", async (request, response) => {
  try {
    const { districtId } = request.params;
    const deleteDistrictQuery = `DELETE FROM district WHERE district_id =${districtId};`;
    await db.run(deleteDistrictQuery);
    response.send("District Removed");
  } catch (error) {
    response.send(`Delete District API error: ${error.message}`);
    process.exit(1);
  }
});

//Update Details of District by Id API6
app.put("/districts/:districtId/", async (request, response) => {
  try {
    const { districtId } = request.params;
    const districtDetails = request.body;
    const {
      districtName,
      stateId,
      cases,
      cured,
      active,
      deaths,
    } = districtDetails;
    const updateDistrictByIdQuery = `
        UPDATE
            district
        SET
            district_name = "${districtName}",
            state_id = "${stateId}",
            cases ="${cases}",
            cured = "${cured}",
            active = "${active}",
            deaths ="${deaths}"
        WHERE
            district_id = ${districtId};`;
    await db.run(updateDistrictByIdQuery);
    response.send("District Details Updated");
  } catch (error) {
    response.send(`update district by id API error: ${error.message}`);
    process.exit(1);
  }
});

//returns cases stats based on stateId API7
app.get("/states/:stateId/stats/", async (request, response) => {
  try {
    const { stateId } = request.params;
    const getStateCasesStatsQuery = `
        SELECT
            SUM(cases),
            SUM(cured),
            SUM(active),
            SUM(deaths)
        FROM
            district
        WHERE state_id = ${stateId}
        `;
    const dbResponse = await db.get(getStateCasesStatsQuery);
    response.send({
      totalCases: dbResponse["SUM(cases)"],
      totalCured: dbResponse["SUM(cured)"],
      totalActive: dbResponse["SUM(active)"],
      totalDeaths: dbResponse["SUM(deaths)"],
    });
  } catch (error) {
    response.send(`Cases stats by state id API error: ${error.message}`);
    process.exit(1);
  }
});

//return state based on district ID API8
app.get("/districts/:districtId/details/", async (request, response) => {
  try {
    const { districtId } = request.params;
    const stateByDistrictIdQuery = `
    SELECT
        state_name
    FROM 
        state 
    INNER JOIN 
        district 
    ON 
        state.state_id = district.state_id
    WHERE 
        district.district_id = ${districtId};
    `;
    const dbResponse = await db.get(stateByDistrictIdQuery);
    response.send({
      stateName: dbResponse.state_name,
    });
  } catch (error) {
    response.send(`state by district ID API error: ${error.message}`);
    process.exit(1);
  }
});

module.exports = app;
