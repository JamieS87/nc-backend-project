const request = require("supertest");
const db = require("../../db/connection");
const seed = require("../../db/seeds/seed");
const testData = require("../../db/data/test-data");
const { app } = require("../../app");

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
          title: "Living in the shadow of a great man",
          topic: "mitch",
          author: "butter_bridge",
          body: "I find this existence challenging",
          created_at: 1594329060000,
          votes: 100,
          article_img_url:
            "https://images.pexels.com/photos/158651/news-newsletter-newspaper-information-158651.jpeg?w=700&h=700",
        });
      });
  });

  test("GET: 404 responds with appropriate message when attempting to GET an article that doesn't exist", () => {
    const { testArticleData } = testData;
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
