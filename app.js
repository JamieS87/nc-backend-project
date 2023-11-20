const express = require("express");
const { handle404, handleServerError } = require("./errors");
const { getTopics } = require("./controllers/topics.controllers");

const app = express();

app.get("/api/topics", getTopics);

app.all("*", handle404);

app.use(handleServerError);

exports.app = app;
