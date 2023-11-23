const db = require("../db/connection");

exports.checkUserExistsByUsername = (username) => {
  return db
    .query("SELECT * FROM users WHERE username = $1", [username])
    .then(({ rows }) => {
      if (!rows.length) {
        return Promise.reject({ status: 404, msg: "Not Found" });
      }
    });
};

exports.selectUsers = () => {
  return db
    .query(
      `
  SELECT * FROM users`
    )
    .then(({ rows }) => {
      return rows;
    });
};

exports.selectUserByUsername = (username) => {
  return db
    .query(
      `
  SELECT username, name, avatar_url
  FROM users
  WHERE username = $1
  `,
      [username]
    )
    .then(({ rows }) => {
      if (!rows.length) {
        return Promise.reject({ status: 404, msg: "Not Found" });
      } else {
        return rows[0];
      }
    });
};
