const {
  getArticles,
  patchArticle,
  postArticle,
  deleteArticle,
  getArticleById,
  getArticleComments,
  postArticleComment,
} = require("../controllers/articles.controllers");

const articlesRouter = require("express").Router();

articlesRouter.route("/").get(getArticles).post(postArticle);
articlesRouter
  .route("/:article_id")
  .get(getArticleById)
  .patch(patchArticle)
  .delete(deleteArticle);

articlesRouter
  .route("/:article_id/comments")
  .get(getArticleComments)
  .post(postArticleComment);

module.exports = articlesRouter;
