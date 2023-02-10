const addDays = require("date-fns/addDays");
const express = require("express");

const app = express();

app.get("/", (request, response) => {
  const addedDate = addDays(new Date(), 100);
  const formatedDate = `${addedDate.getDate()}/${
    addedDate.getMonth() + 1
  }/${addedDate.getFullYear()}`;
  response.send(formatedDate);
});

module.exports = app;
