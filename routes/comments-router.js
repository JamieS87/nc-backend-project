const {
  deleteComment,
  patchComment,
} = require("../controllers/comments.controllers");

const commentsRouter = require("express").Router();

commentsRouter.route("/:comment_id").patch(patchComment).delete(deleteComment);

module.exports = commentsRouter;
