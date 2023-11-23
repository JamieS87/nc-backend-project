const {
  getArticles,
  getArticleById,
  getArticleComments,
  postArticleComment,
  patchArticle,
} = require("../controllers/articles.controllers");

const articlesRouter = require("express").Router();

articlesRouter.get("/", getArticles);
articlesRouter
  .route("/:article_id")
  .get(getArticleById)
  .patch(patchArticle)
  .get(getArticleComments);

articlesRouter
  .route("/:article_id/comments")
  .get(getArticleComments)
  .post(postArticleComment);

module.exports = articlesRouter;
