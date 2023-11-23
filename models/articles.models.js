const db = require("../db/connection");

exports.checkArticleExists = (article_id) => {
  return db
    .query(
      `
  SELECT *
  FROM articles
  WHERE article_id = $1
  `,
      [article_id]
    )
    .then(({ rows }) => {
      if (!rows.length) {
        return Promise.reject({ status: 404, msg: "Not Found" });
      }
    });
};

exports.selectArticleById = (article_id) => {
  const queryString = `
  SELECT articles.author, articles.title, articles.article_id, 
         articles.topic, articles.created_at, articles.votes, 
         articles.article_img_url, articles.body, COUNT(comments.comment_id)::INTEGER as comment_count
  FROM articles
  LEFT JOIN comments USING (article_id)
  WHERE articles.article_id = $1
  GROUP BY articles.article_id
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

exports.selectArticles = (topic, sort_by = "created_at", order = "desc") => {
  const validSortValues = [
    "topic",
    "created_at",
    "votes",
    "author",
    "title",
    "comment_count",
  ];
  if (!validSortValues.includes(sort_by)) {
    return Promise.reject({ status: 400, msg: "Bad Request" });
  }

  if (order.toUpperCase() !== "ASC" && order.toUpperCase() !== "DESC") {
    return Promise.reject({ status: 400, msg: "Bad Request" });
  }

  const queryValues = [];
  let queryString = `
  SELECT articles.author, articles.title, articles.article_id, articles.topic, 
         articles.created_at, articles.votes, articles.article_img_url,
         COUNT(comments.comment_id)::INTEGER as comment_count
  FROM articles
  LEFT JOIN comments USING (article_id)
  `;

  if (topic) {
    queryValues.push(topic);
    queryString += "WHERE topic = $1";
  }

  queryString += `
  GROUP BY articles.article_id
  ORDER BY ${sort_by} ${order}
  `;
  return db.query(queryString, queryValues).then(({ rows }) => {
    return rows;
  });
};

exports.selectArticleComments = (article_id) => {
  const queryString = `
  SELECT comments.comment_id, comments.votes, comments.created_at,
         comments.author, comments.body, comments.article_id
  FROM comments
  JOIN articles USING (article_id)
  WHERE articles.article_id = $1
  ORDER BY comments.created_at DESC
  `;
  return db.query(queryString, [article_id]).then(({ rows }) => {
    return rows;
  });
};

exports.updateArticle = (article_id, updateData) => {
  if (!updateData || updateData.inc_votes === undefined) {
    return Promise.reject({ status: 400, msg: "Bad Request" });
  }
  const queryString = `
  UPDATE articles
  SET votes = articles.votes + $1
  WHERE article_id = $2
  RETURNING *;
  `;
  return db
    .query(queryString, [updateData.inc_votes, article_id])
    .then(({ rows }) => {
      if (!rows.length) {
        return Promise.reject({ status: 404, msg: "Not Found" });
      }
      return rows[0];
    });
};

exports.insertArticleComment = (article_id, comment) => {
  const queryString = `
  INSERT INTO comments 
  (article_id, author, body)
  VALUES
  ($1, $2, $3)
  RETURNING *
  `;
  const queryValues = [article_id, comment.username, comment.body];
  return db.query(queryString, queryValues).then(({ rows }) => {
    return rows[0];
  });
};

exports.insertArticle = (articleData) => {
  const insertColumnNames = ["author", "title", "body", "topic"];
  const insertValuesList = ["$1", "$2", "$3", "$4"];
  const queryValues = [
    articleData.author,
    articleData.title,
    articleData.body,
    articleData.topic,
  ];

  if (articleData.article_img_url) {
    insertColumnNames.push("article_img_url");
    insertValuesList.push("$5");
    queryValues.push(articleData.article_img_url);
  }

  const queryString = `
  INSERT INTO articles (${insertColumnNames.join(",")})
  VALUES
  (${insertValuesList.join(", ")})
  RETURNING *, 0 AS comment_count;
  `;

  return db.query(queryString, queryValues).then(({ rows }) => {
    return rows[0];
  });
};
