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
        expect(body.msg).toBe("Not Found");
      });
  });

  test("GET: 400 responds with an appropriate message when article_id is of invalid type", () => {
    return request(app)
      .get(`/api/articles/banana`)
      .expect(400)
      .then(({ body }) => {
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
