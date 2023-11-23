const express = require("express");
const {
  handle404,
  handleServerError,
  handlePostgresError,
} = require("./errors");

const apiRouter = require("./routes/api-router");

const app = express();
app.use(express.json());

app.use("/api", apiRouter);

app.all("*", handle404);

app.use(handlePostgresError);
app.use(handleServerError);

exports.app = app;
