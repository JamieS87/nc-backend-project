const db = require("../db/connection");

exports.selectArticleById = (article_id) => {
  const queryString = `
  SELECT *
  FROM articles
  WHERE article_id = $1
  `;
  const queryValues = [article_id];
  return db.query(queryString, queryValues).then(({ rows }) => {
    if (!rows.length) {
      return Promise.reject({ status: 404, msg: "Not Found" });
    } else {
      return rows[0];
    }
  });
};
//test
exports.selectArticles = () => {
  const queryString = `
  SELECT articles.author, articles.title, articles.article_id, articles.topic, 
         articles.created_at, articles.votes, articles.article_img_url,
         COUNT(comments.comment_id)::INTEGER as comment_count
  FROM articles
  LEFT JOIN comments USING (article_id)
  GROUP BY articles.article_id
  ORDER BY created_at DESC
  `;
  return db.query(queryString).then(({ rows }) => {
    return rows;
  });
};
