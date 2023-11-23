const {
  selectArticleById,
  selectArticles,
  selectArticleComments,
  checkArticleExists,
  updateArticle,
  insertArticleComment,
} = require("../models/articles.models");
const { checkTopicExists } = require("../models/topics.models");

//const { checkUserExistsByUsername } = require("../models/users.models");

exports.getArticleById = (req, res, next) => {
  const { article_id } = req.params;

  selectArticleById(article_id)
    .then((article) => {
      res.status(200).send({ article });
    })
    .catch(next);
};

exports.getArticles = (req, res, next) => {
  const { topic, sort_by, order } = req.query;

  const promises = [selectArticles(topic, sort_by, order)];
  if (topic) {
    promises.push(checkTopicExists(topic));
  }
  Promise.all(promises)
    .then(([articles, _]) => {
      res.status(200).send({ articles });
    })
    .catch(next);
};

exports.getArticleComments = (req, res, next) => {
  const { article_id } = req.params;

  const promises = [
    selectArticleComments(article_id),
    checkArticleExists(article_id),
  ];
  Promise.all(promises)
    .then(([comments, _]) => {
      res.status(200).send({ comments });
    })
    .catch(next);
};

exports.patchArticle = (req, res, next) => {
  const { article_id } = req.params;
  const updateData = req.body;
  checkArticleExists(article_id)
    .then(() => {
      return updateArticle(article_id, updateData);
    })
    .then((article) => {
      res.status(200).send({ article });
    })
    .catch(next);
};

exports.postArticleComment = (req, res, next) => {
  const { article_id } = req.params;
  const comment = req.body;
  if (!/^[0-9]+$/.test(article_id)) {
    next({ status: 400, msg: "Bad Request" });
  } else {
    checkArticleExists(article_id)
      .then(() => {
        return insertArticleComment(article_id, comment);
      })
      .then((comment) => {
        res.status(201).send({ comment });
      })
      .catch(next);
  }
};
