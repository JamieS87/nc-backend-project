const express = require("express");
const {
  handle404,
  handleServerError,
  handlePostgresError,
} = require("./errors");
const { getTopics } = require("./controllers/topics.controllers");
const { getArticleById } = require("./controllers/articles.controllers");

const app = express();

app.get("/api/topics", getTopics);
app.get("/api/articles/:article_id", getArticleById);

app.all("*", handle404);

app.use(handlePostgresError);
app.use(handleServerError);

exports.app = app;
//test
