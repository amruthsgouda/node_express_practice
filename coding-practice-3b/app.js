const express = require("express");
const gadgets = express();

gadgets.get("/gadgets", (request, response) => {
  response.sendFile("gadgets.html", { root: __dirname });
});

gadgets.listen(3000);

module.exports = gadgets;
