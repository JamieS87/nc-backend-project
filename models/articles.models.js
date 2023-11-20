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
