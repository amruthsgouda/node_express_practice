const addDays = require("date-fns/addDays");

const returnDaysAfterXDays = (days) => {
  const resultDate = addDays(new Date(2020, 7, 22), days);

  return `${resultDate.getDate()}-${
    resultDate.getMonth() + 1
  }-${resultDate.getFullYear()}`;
};

module.exports = returnDaysAfterXDays;
