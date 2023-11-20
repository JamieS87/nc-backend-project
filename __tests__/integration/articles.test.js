const request = require("supertest");
const db = require("../../db/connection");
const seed = require("../../db/seeds/seed");
const testData = require("../../db/data/test-data");
const { app } = require("../../app");

//Test

afterAll(() => {
  return db.end();
});

beforeEach(() => {
  return seed(testData);
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
