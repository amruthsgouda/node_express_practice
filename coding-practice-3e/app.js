const express = require("express");
const app = express();

app.get("/", (request, response) => {
  const date = new Date();
  const formatedDate = `${date.getDate()}-${
    date.getMonth() + 1
  }-${date.getFullYear()}`;
  response.send(formatedDate);
});

app.listen(3000);

module.exports = app;
