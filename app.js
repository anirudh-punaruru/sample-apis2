const express = require("express");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");

const path = require("path");
const dbPath = path.join(__dirname, "covid19India.db");

const app = express();
app.use(express.json());

let db = null;

const initializeDbAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Server Running at http://localhost:3000/");
    });
  } catch (e) {
    console.log(`DB Error: '${e.message}'`);
    process.exit(1);
  }
};

initializeDbAndServer();

const convertStateDbObjToResponseObj = (dbObj) => {
  return {
    stateId: dbObj.state_id,
    stateName: dbObj.state_name,
    population: dbObj.population,
  };
};

const convertDistrictDbObjToResponseObj = (dbObj) => {
  return {
    districtId: dbObj.district_id,
    districtName: dbObj.district_name,
    stateId: dbObj.state_id,
    cases: dbObj.cases,
    cured: dbObj.cured,
    active: dbObj.active,
    deaths: dbObj.deaths,
  };
};

app.get("/states/", async (req, res) => {
  const getStatesQuery = `
    select *
    from state;`;
  const statesArr = await db.all(getStatesQuery);
  res.send(statesArr.map((each) => convertStateDbObjToResponseObj(each)));
});

app.get("/states/:stateId/", async (req, res) => {
  const { stateId } = req.params;
  const getStateQuery = `
    select *
    from state
    where state_id= '${stateId}';`;
  const state = await db.get(getStateQuery);
  res.send(convertStateDbObjToResponseObj(state));
});

app.post("/districts/", async (req, res) => {
  const { districtName, stateId, cases, cured, active, deaths } = req.body;
  const postDistrictQuery = `
    insert into 
    district (district_name, state_id, cases, cured, active, deaths)
    values ('${districtName}', '${stateId}', '${cases}', '${cured}', '${active}', '${deaths}');`;
  await db.run(postDistrictQuery);
  res.send("District Successfully Added");
});

app.get("/districts/:districtId/", async (req, res) => {
  const { districtId } = req.params;
  const getDistrictQuery = `
    select *
    from district
    where district_id= '${districtId}';`;
  const district = await db.get(getDistrictQuery);
  res.send(convertDistrictDbObjToResponseObj(district));
});

app.delete("/districts/:districtId/", async (req, res) => {
  const { districtId } = req.params;
  const deleteDistrictQuery = `
    delete 
    from district
    where district_id= '${districtId}';`;
  await db.run(deleteDistrictQuery);
  res.send("District Removed");
});

app.put("/districts/:districtId/", async (req, res) => {
  const { districtName, stateId, cases, cured, active, deaths } = req.body;
  const { districtId } = req.params;
  const updateDistrictQuery = `
    update district
    set district_name= '${districtName}', state_id= '${stateId}', cases= '${cases}', cured= '${cured}', active= '${active}', deaths= '${deaths}'
    where district_id= '${districtId}';`;
  await db.run(updateDistrictQuery);
  res.send("District Details Updated");
});

app.get("/states/:stateId/stats/", async (req, res) => {
  const { stateId } = req.params;
  const getStateStatsQuery = `
    select sum(cases), sum(cured), sum(active), sum(deaths)
    from district
    where state_id= '${stateId}';`;
  const stats = await db.get(getStateStatsQuery);
  res.send({
    totalCases: stats["sum(cases)"],
    totalCured: stats["sum(cured)"],
    totalActive: stats["sum(active)"],
    totalDeaths: stats["sum(deaths)"],
  });
});

app.get("/districts/:districtId/details/", async (req, res) => {
  const { districtId } = req.params;
  const getStateNameQuery = `
    select state_name
    from district natural join state
    where district_id= '${districtId}';`;
  const state = await db.get(getStateNameQuery);
  res.send({ stateName: state.state_name });
});
module.exports = app;
