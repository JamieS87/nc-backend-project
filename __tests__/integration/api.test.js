const request = require("supertest");
const { app } = require("../../app");
const db = require("../../db/connection");
const seed = require("../../db/seeds/seed");
const testData = require("../../db/data/test-data");
const fs = require("fs/promises");

let endpointsData;

beforeAll(() => {
  return fs
    .readFile(`${__dirname}/../../endpoints.json`, "utf-8")
    .then((fileData) => {
      endpointsData = JSON.parse(fileData);
    });
});

afterAll(() => {
  return db.end();
});

beforeEach(() => {
  return seed(testData);
});

describe("endpointsData", () => {
  test("endpointsData should have the correct data", () => {
    Object.values(endpointsData).forEach((endpointEntry) => {
      expect(endpointEntry).toMatchObject({
        description: expect.any(String),
        queries: expect.any(Array),
        exampleResponse: expect.any(Object),
      });
    });
  });
});

describe("base app behaviour", () => {
  test("GET: 404 returns status 404 and a message when requesting an endpoint that doesn't exist", () => {
    return request(app)
      .get("/BadEndPoint")
      .expect(404)
      .then(({ body }) => {
        expect(body.status).toBe(404);
        expect(body.msg).toBe("Not Found");
      });
  });
});

describe("/api", () => {
  test(`GET: 200 responds with an object`, () => {
    return request(app)
      .get("/api")
      .expect(200)
      .then(({ body }) => {
        const { endpoints } = body;
        expect(typeof endpoints).toBe("object");
      });
  });
  test(`GET: 200 response object contains everything in endpoints.json`, () => {
    return request(app)
      .get("/api")
      .expect(200)
      .then(({ body }) => {
        const { endpoints } = body;
        expect(endpoints).toEqual(endpointsData);
      });
  });
});

describe("/api/articles/:article_id", () => {
  test("GET: 200 responds with an article object with the correct properties", () => {
    return request(app)
      .get("/api/articles/1")
      .expect(200)
      .then(({ body }) => {
        const { article } = body;
        expect(article).toMatchObject({
          title: expect.any(String),
          topic: expect.any(String),
          author: expect.any(String),
          body: expect.any(String),
          created_at: expect.any(String),
          votes: expect.any(Number),
          article_img_url: expect.any(String),
        });
      });
  });

  test("GET: 404 responds with appropriate message when attempting to GET an article that doesn't exist", () => {
    const { articleData: testArticleData } = testData;
    return request(app)
      .get(`/api/articles/${testArticleData.length + 1}`)
      .expect(404)
      .then(({ body }) => {
        expect(body.status).toBe(404);
        expect(body.msg).toBe("Not Found");
      });
  });

  test("GET: 400 responds with an appropriate message when article_id is of invalid type", () => {
    return request(app)
      .get(`/api/articles/banana`)
      .expect(400)
      .then(({ body }) => {
        expect(body.status).toBe(400);
        expect(body.msg).toBe("Bad Request");
      });
  });
});

describe("/api/articles", () => {
  test("GET: 200 gets all articles", () => {
    const { articleData: testArticleData } = testData;
    const { commentData: testCommentData } = testData;

    return request(app)
      .get("/api/articles")
      .expect(200)
      .then(({ body }) => {
        const { articles } = body;
        expect(articles.length).toBe(testArticleData.length);
      });
  });

  test("GET: 200 returned articles have the correct properties", () => {
    const { articleData: testArticleData } = testData;
    const { commentData: testCommentData } = testData;

    return request(app)
      .get("/api/articles")
      .expect(200)
      .then(({ body }) => {
        const { articles } = body;
        expect(articles.length).toBe(testArticleData.length);
        articles.forEach((article) => {
          expect(article).toMatchObject({
            title: expect.any(String),
            topic: expect.any(String),
            author: expect.any(String),
            created_at: expect.any(String),
            votes: expect.any(Number),
            article_img_url: expect.any(String),
            comment_count: expect.any(Number),
          });
        });
      });
  });

  test("GET: 200 returned articles do not have a body property", () => {
    const { articleData: testArticleData } = testData;
    return request(app)
      .get("/api/articles")
      .expect(200)
      .then(({ body }) => {
        const { articles } = body;
        expect(articles.length).toBe(testArticleData.length);
        articles.forEach((article) => {
          expect(article.body).toBe(undefined);
        });
      });
  });

  test("GET: 200 returned articles have the correct comment_count", () => {
    const { articleData: testArticleData } = testData;
    const { commentData: testCommentData } = testData;

    return request(app)
      .get("/api/articles")
      .expect(200)
      .then(({ body }) => {
        const { articles } = body;
        expect(articles.length).toBe(testArticleData.length);
        articles.forEach((article) => {
          const expectedCommentCount = testCommentData.filter((comment) => {
            return comment.article_id === article.article_id;
          }).length;

          expect(article.comment_count).toBe(expectedCommentCount);
        });
      });
  });

  test("GET: 200 articles are sorted by date in descending order", () => {
    const { articleData: testArticleData } = testData;
    return request(app)
      .get("/api/articles")
      .expect(200)
      .then(({ body }) => {
        const { articles } = body;
        expect(articles.length).toBe(testArticleData.length);
        expect(articles).toBeSortedBy("created_at", { descending: true });
      });
  });

  test("PATCH: 200 increments an article's vote count and returns the article", () => {
    const testArticle = { ...testData.articleData[0] };
    testArticle.created_at = new Date(testArticle.created_at).toISOString();
    testArticle.article_id = 1;
    testArticle.votes += 10;

    return request(app)
      .patch("/api/articles/1")
      .send({ inc_votes: 10 })
      .expect(200)
      .then(({ body }) => {
        const { article } = body;
        expect(article).toEqual(testArticle);
      });
  });

  test("PATCH: 200 increments an article's vote count by a negative amount and returns the article", () => {
    const testArticle = { ...testData.articleData[0] };
    testArticle.created_at = new Date(testArticle.created_at).toISOString();
    testArticle.article_id = 1;
    testArticle.votes -= 30;

    return request(app)
      .patch("/api/articles/1")
      .send({ inc_votes: -30 })
      .expect(200)
      .then(({ body }) => {
        const { article } = body;
        expect(article).toEqual(testArticle);
      });
  });

  test("PATCH: 200 when inc_votes is 0, returns the article unchanged", () => {
    const testArticle = { ...testData.articleData[0] };
    testArticle.article_id = 1;
    testArticle.created_at = new Date(testArticle.created_at).toISOString();

    return request(app)
      .patch("/api/articles/1")
      .send({ inc_votes: 0 })
      .expect(200)
      .then(({ body }) => {
        const { article } = body;
        expect(article).toEqual(testArticle);
      });
  });

  test("PATCH: 200 ignores unnecessary fields in the request body", () => {
    const testArticle = { ...testData.articleData[0] };
    testArticle.created_at = new Date(testArticle.created_at).toISOString();
    testArticle.article_id = 1;
    testArticle.votes += 10;

    return request(app)
      .patch("/api/articles/1")
      .send({ inc_votes: 10, article_id: 5 })
      .expect(200)
      .then(({ body }) => {
        const { article } = body;
        expect(article).toEqual(testArticle);
      });
  });

  test("PATCH: 400 returns bad request when inc_votes is not a number", () => {
    return request(app)
      .patch("/api/articles/1")
      .send({ inc_votes: "banana" })
      .expect(400)
      .then(({ body }) => {
        expect(body.status).toBe(400);
        expect(body.msg).toBe("Bad Request");
      });
  });

  test("PATCH: 400 returns bad request when inc_votes is missing from the request body", () => {
    return request(app)
      .patch("/api/articles/1")
      .send({})
      .expect(400)
      .then(({ body }) => {
        expect(body.status).toBe(400);
        expect(body.msg).toBe("Bad Request");
      });
  });

  test("PATCH: 404 returns error when article_id doesn't exist", () => {
    return request(app)
      .patch(`/api/articles/${testData.articleData.length + 1}`)
      .send({})
      .expect(404)
      .then(({ body }) => {
        expect(body.status).toBe(404);
        expect(body.msg).toBe("Not Found");
      });
  });

  test("PATCH: 400 returns error when article_id is of invalid type", () => {
    return request(app)
      .patch("/api/articles/banana")
      .send({})
      .expect(400)
      .then(({ body }) => {
        expect(body.status).toBe(400);
        expect(body.msg).toBe("Bad Request");
      });
  });
});

describe("/api/topics", () => {
  test("GET: 200 returns an array of all topics", () => {
    return request(app)
      .get("/api/topics")
      .expect(200)
      .then(({ body }) => {
        const { topics } = body;
        expect(topics.length).toBe(3);
        topics.forEach((topic) => {
          expect(topic).toMatchObject({
            slug: expect.any(String),
            description: expect.any(String),
          });
        });
      });
  });
});

describe("/api/articles/:article_id/comments", () => {
  //GET
  test("GET: 200 responds with an array of an article's comments", () => {
    const { commentData: testCommentData } = testData;
    return request(app)
      .get("/api/articles/1/comments")
      .expect(200)
      .then(({ body }) => {
        const { comments } = body;
        const expectedNumberOfComments = testCommentData.filter((comment) => {
          return comment.article_id === 1;
        }).length;
        expect(comments.length).toBe(expectedNumberOfComments);
      });
  });

  test("GET: 200 returns an empty array if article doesn't have any comments", () => {
    return request(app)
      .get("/api/articles/2/comments")
      .expect(200)
      .then(({ body }) => {
        const { comments } = body;
        expect(comments).toEqual([]);
      });
  });

  test("GET: 200 returned comments have the correct properties", () => {
    const { commentData: testCommentData } = testData;
    return request(app)
      .get("/api/articles/1/comments")
      .expect(200)
      .then(({ body }) => {
        const { comments } = body;
        const expectedNumberOfComments = testCommentData.filter((comment) => {
          return comment.article_id === 1;
        }).length;
        expect(comments.length).toBe(expectedNumberOfComments);
        comments.forEach((comment) => {
          expect(comment).toMatchObject({
            comment_id: expect.any(Number),
            votes: expect.any(Number),
            created_at: expect.any(String),
            author: expect.any(String),
            body: expect.any(String),
            article_id: 1,
          });
        });
      });
  });

  test("GET: 200 returns the most recent comments first", () => {
    return request(app)
      .get("/api/articles/1/comments")
      .expect(200)
      .then(({ body }) => {
        const { comments } = body;
        expect(comments).toBeSortedBy("created_at", { descending: true });
      });
  });

  test("GET: 404 returns an appropriate message if an article doesn't exist", () => {
    const { articleData: testArticleData } = testData;
    return request(app)
      .get(`/api/articles/${testArticleData.length + 1}/comments`)
      .expect(404)
      .then(({ body }) => {
        expect(body.status).toBe(404);
        expect(body.msg).toBe("Not Found");
      });
  });

  test("GET: 400 returns an appropriate message when article_id is of invalid type", () => {
    return request(app)
      .get(`/api/articles/banana/comments`)
      .expect(400)
      .then(({ body }) => {
        expect(body.status).toBe(400);
        expect(body.msg).toBe("Bad Request");
      });
  });

  //POST
  test("POST: 201 responds with the posted comment", () => {
    return request(app)
      .post("/api/articles/1/comments")
      .send({ username: "butter_bridge", body: "Hello World!" })
      .expect(201)
      .then(({ body }) => {
        const { comment } = body;
        expect(comment).toEqual({
          author: "butter_bridge",
          body: "Hello World!",
          created_at: expect.any(String),
          comment_id: expect.any(Number),
          votes: 0,
          article_id: 1,
        });
      });
  });

  test("POST: 201 ignores unnecessary properties", () => {
    return request(app)
      .post("/api/articles/1/comments")
      .send({
        username: "butter_bridge",
        body: "Hello World!",
        banana: "Fyffes",
      })
      .expect(201)
      .then(({ body }) => {
        const { comment } = body;
        expect(comment).toEqual({
          author: "butter_bridge",
          body: "Hello World!",
          created_at: expect.any(String),
          comment_id: expect.any(Number),
          votes: 0,
          article_id: 1,
        });
      });
  });

  test("POST: 404 responds with an appropriate message when article with requested id doesn't exist", () => {
    const { articleData: testArticleData } = testData;
    return request(app)
      .post(`/api/articles/${testArticleData.length + 1}/comments`)
      .send({ username: "butter_bridge", body: "Hello World!" })
      .expect(404)
      .then(({ body }) => {
        expect(body.status).toBe(404);
        expect(body.msg).toBe("Not Found");
      });
  });

  test("POST: 400 responds with an appropriate message when article_id is of invalid type", () => {
    return request(app)
      .post(`/api/articles/banana/comments`)
      .send({ username: "butter_bridge", body: "Hello World!" })
      .expect(400)
      .then(({ body }) => {
        expect(body.status).toBe(400);
        expect(body.msg).toBe("Bad Request");
      });
  });

  test("POST: 400 responds with an appropriate message when request body is missing username field", () => {
    const { articleData: testArticleData } = testData;
    return request(app)
      .post(`/api/articles/1/comments`)
      .send({ body: "Hello World!" })
      .expect(400)
      .then(({ body }) => {
        expect(body.status).toBe(400);
        expect(body.msg).toBe("Bad Request");
      });
  });

  test("POST: 400 responds with an appropriate message when request body is missing body field", () => {
    const { articleData: testArticleData } = testData;
    return request(app)
      .post(`/api/articles/1/comments`)
      .send({ username: "butter_bridge" })
      .expect(400)
      .then(({ body }) => {
        expect(body.status).toBe(400);
        expect(body.msg).toBe("Bad Request");
      });
  });

  test("POST: 400 responds with an appropriate message when request body is empty", () => {
    const { articleData: testArticleData } = testData;
    return request(app)
      .post(`/api/articles/1/comments`)
      .send({})
      .expect(400)
      .then(({ body }) => {
        expect(body.status).toBe(400);
        expect(body.msg).toBe("Bad Request");
      });
  });

  test("POST: 400 responds with an appropriate message when no user with username exists", () => {
    const { articleData: testArticleData } = testData;
    return request(app)
      .post(`/api/articles/1/comments`)
      .send({ username: "bad_user", body: "Hello World!" })
      .expect(400)
      .then(({ body }) => {
        expect(body.status).toBe(400);
        expect(body.msg).toBe("Bad Request");
      });
  });
});
