const db = require("../db/connection");

exports.removeComment = (comment_id) => {
  return db
    .query(
      `
  DELETE FROM comments
  WHERE comment_id = $1
  RETURNING *`,
      [comment_id]
    )
    .then(({ rows }) => {
      if (!rows.length) {
        return Promise.reject({ status: 404, msg: "Not Found" });
      }
    });
};

exports.updateComment = (comment_id, commentData) => {
  return db
    .query(
      `
  UPDATE comments
  SET votes = votes + $1
  WHERE comment_id = $2
  RETURNING *
  `,
      [commentData.inc_votes, comment_id]
    )
    .then(({ rows }) => {
      if (!rows.length) {
        return Promise.reject({ status: 404, msg: "Not Found" });
      } else {
        return rows[0];
      }
    });
};
