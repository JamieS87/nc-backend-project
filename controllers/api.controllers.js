const fs = require("fs/promises");

exports.getAPI = (req, res, next) => {
  fs.readFile(`${__dirname}/../endpoints.json`, "utf-8")
    .then((endpointsData) => {
      const endpoints = JSON.parse(endpointsData);
      res.status(200).send({ endpoints });
    })
    .catch(next);
};
