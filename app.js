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
  getArticleComments,
  patchArticle,
  postArticleComment,
} = require("./controllers/articles.controllers");
const { deleteComment } = require("./controllers/comments.controllers");

const { getAPI } = require("./controllers/api.controllers");

const app = express();
app.use(express.json());

app.get("/api/topics", getTopics);
app.get("/api/articles", getArticles);
app.get("/api/articles/:article_id/comments", getArticleComments);
app.post("/api/articles/:article_id/comments", postArticleComment);
app.get("/api/articles/:article_id", getArticleById);
app.patch("/api/articles/:article_id", patchArticle);
app.delete("/api/comments/:comment_id", deleteComment);
app.get("/api", getAPI);

app.all("*", handle404);

app.use(handlePostgresError);
app.use(handleServerError);

exports.app = app;
