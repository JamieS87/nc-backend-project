const express = require("express");
const {
  handle404,
  handleServerError,
  handlePostgresError,
} = require("./errors");
const { getTopics } = require("./controllers/topics.controllers");
const {
  getArticleById,
  getArticles,
} = require("./controllers/articles.controllers");
const { getAPI } = require("./controllers/api.controllers");

const app = express();

app.get("/api/topics", getTopics);
app.get("/api/articles", getArticles);
app.get("/api/articles/:article_id", getArticleById);
app.get("/api", getAPI);

app.all("*", handle404);

app.use(handlePostgresError);
app.use(handleServerError);

exports.app = app;
//test
