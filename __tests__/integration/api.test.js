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

  describe("/api/articles/:article_id", () => {
    test("GET 200 returned article has a comment_count property with the correct value", () => {
      return request(app)
        .get("/api/articles/1")
        .expect(200)
        .then(({ body }) => {
          const { article } = body;
          expect(article.comment_count).toBe(11);
        });
    });
  });

  test("GET: 200 responds with the correct article", () => {
    const expectedArticle = { ...testData.articleData[0] };
    expectedArticle.created_at = new Date(
      expectedArticle.created_at
    ).toISOString();
    expectedArticle.article_id = 1;
    expectedArticle.comment_count = testData.commentData.filter(
      (comment) => comment.article_id === 1
    ).length;

    return request(app)
      .get("/api/articles/1")
      .expect(200)
      .then(({ body }) => {
        const { article } = body;
        expect(article).toEqual(expectedArticle);
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
      .send({ inc_votes: 10 })
      .expect(404)
      .then(({ body }) => {
        expect(body.status).toBe(404);
        expect(body.msg).toBe("Not Found");
      });
  });

  test("PATCH: 400 returns error when article_id is of invalid type", () => {
    return request(app)
      .patch("/api/articles/banana")
      .send({ inc_votes: 50 })
      .expect(400)
      .then(({ body }) => {
        expect(body.status).toBe(400);
        expect(body.msg).toBe("Bad Request");
      });
  });

  test("GET: 200 returns a list of articles filtered by topic", () => {
    const queryTopic = "mitch";
    const expectedLength = testData.articleData.filter(
      (article) => article.topic === queryTopic
    ).length;
    return request(app)
      .get("/api/articles")
      .query({ topic: queryTopic })
      .expect(200)
      .then(({ body }) => {
        const { articles } = body;
        const isCorrectTopic = (article) => article.topic === queryTopic;
        expect(articles).toHaveLength(expectedLength);
        expect(articles).toSatisfyAll(isCorrectTopic);
      });
  });

  test("GET: 404 returns not found when topic query value is not a topic that exists", () => {
    return request(app)
      .get("/api/articles")
      .query({ topic: "bananas" })
      .expect(404)
      .then(({ body }) => {
        expect(body.status).toBe(404);
        expect(body.msg).toBe("Not Found");
      });
  });

  test("GET: 200 returns empty array when topic exists, but no articles match", () => {
    return request(app)
      .get("/api/articles")
      .query({ topic: "paper" })
      .expect(200)
      .then(({ body }) => {
        const { articles } = body;
        expect(articles).toBeArrayOfSize(0);
      });
  });

  test("GET: 200 returned articles are sorted by sort_by query value", () => {
    return request(app)
      .get("/api/articles")
      .query({ sort_by: "topic" })
      .expect(200)
      .then(({ body }) => {
        const { articles } = body;
        expect(articles.length).toBe(testData.articleData.length);
        expect(articles).toBeSortedBy("topic", { descending: true });
      });
  });

  test("GET: 400 returns bad request when sort_by is not a valid sorting option", () => {
    return request(app)
      .get("/api/articles")
      .query({ sort_by: "bananas" })
      .expect(400)
      .then(({ body }) => {
        expect(body.status).toBe(400);
        expect(body.msg).toBe("Bad Request");
      });
  });

  test("GET: 200 articles can be ordered by order query", () => {
    return request(app)
      .get("/api/articles")
      .query({ order: "asc" })
      .expect(200)
      .then(({ body }) => {
        const { articles } = body;
        expect(articles.length).toBe(testData.articleData.length);
        expect(articles).toBeSortedBy("created_at", { descending: false });
      });
  });

  test("GET: 400 returns bad request if order query is invalid", () => {
    return request(app)
      .get("/api/articles")
      .query({ order: "bananas" })
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

describe("/api/comments/:comment_id", () => {
  test("DELETE: 204 deletes a comment and returns no content", () => {
    return request(app).delete("/api/comments/1").expect(204);
  });

  test("DELETE: 404 when attempting to delete a comment that does not exist", () => {
    const testCommentsLength = testData.commentData.length;
    return request(app)
      .delete(`/api/comments/${testCommentsLength + 1}`)
      .expect(404)
      .then(({ body }) => {
        expect(body.status).toBe(404);
        expect(body.msg).toBe("Not Found");
      });
  });

  test("DELETE: 400 when attempting to delete a comment with an invalid type for comment_id", () => {
    return request(app)
      .delete(`/api/comments/banana`)
      .expect(400)
      .then(({ body }) => {
        expect(body.status).toBe(400);
        expect(body.msg).toBe("Bad Request");
      });
  });

  test("PATCH: 200 updates a comment's votes and returns the comment", () => {
    const expectedComment = { ...testData.commentData[0] };
    expectedComment.votes += 10;
    expectedComment.created_at = new Date(
      expectedComment.created_at
    ).toISOString();
    expectedComment.comment_id = 1;
    return request(app)
      .patch("/api/comments/1")
      .send({ inc_votes: 10 })
      .expect(200)
      .then(({ body }) => {
        const { comment } = body;
        expect(comment).toMatchObject(expectedComment);
        //expect(comment.votes).toBe(expectedVotes);
        //expect(comment.comment_id).toBe(1);
      });
  });

  test("PATCH: 200 inc_votes with a negative value decreases a comment's votes", () => {
    const expectedVotes = testData.commentData[0].votes - 10;
    return request(app)
      .patch("/api/comments/1")
      .send({ inc_votes: -10 })
      .expect(200)
      .then(({ body }) => {
        const { comment } = body;
        expect(comment.votes).toBe(expectedVotes);
        expect(comment.comment_id).toBe(1);
      });
  });

  test("PATCH: 200 inc_votes with a 0 value doesn't change an article's votes", () => {
    const expectedVotes = testData.commentData[0].votes;
    return request(app)
      .patch("/api/comments/1")
      .send({ inc_votes: 0 })
      .expect(200)
      .then(({ body }) => {
        const { comment } = body;
        expect(comment.votes).toBe(expectedVotes);
        expect(comment.comment_id).toBe(1);
      });
  });

  test("PATCH: 400 when attempting to patch a comment with invalid comment_id type", () => {
    return request(app)
      .patch("/api/comments/banana")
      .send({ inc_votes: 10 })
      .expect(400)
      .then(({ body }) => {
        expect(body.status).toBe(400);
        expect(body.msg).toBe("Bad Request");
      });
  });

  test("PATCH: 404 not found when attempting to update a non-existent comment", () => {
    const testCommentsLength = testData.commentData.length;
    return request(app)
      .patch(`/api/comments/${testCommentsLength + 1}`)
      .send({ inc_votes: 10 })
      .expect(404)
      .then(({ body }) => {
        expect(body.status).toBe(404);
        expect(body.msg).toBe("Not Found");
      });
  });

  test("PATCH: 400 bad request when request body doesn't contain inc_votes", () => {
    return request(app)
      .patch("/api/comments/1")
      .send({ not_inc_votes: 20 })
      .expect(400)
      .then(({ body }) => {
        expect(body.status).toBe(400);
        expect(body.msg).toBe("Bad Request");
      });
  });

  test("PATCH: 400 bad request when inc_votes is of invalid type", () => {
    return request(app)
      .patch("/api/comments/1")
      .send({ inc_votes: "banana" })
      .expect(400)
      .then(({ body }) => {
        expect(body.status).toBe(400);
        expect(body.msg).toBe("Bad Request");
      });
  });

  test("PATCH: 200 silently ignores extra fields in request body", () => {
    return request(app)
      .patch("/api/comments/1")
      .send({ inc_votes: 10, extra_prop: "Hello" })
      .expect(200);
  });
});

describe("/api/users", () => {
  test("GET: 200 returns an array of all users", () => {
    const testUsers = testData.userData;
    return request(app)
      .get("/api/users")
      .expect(200)
      .then(({ body }) => {
        const { users } = body;
        expect(users).toHaveLength(testUsers.length);
        testUsers.forEach((testUser) => {
          expect(users).toContainEqual(testUser);
        });
      });
  });

  test("GET: 200 returns a user object with the correct properties", () => {
    return request(app)
      .get("/api/users/butter_bridge")
      .expect(200)
      .then(({ body }) => {
        const { user } = body;
        expect(user).toMatchObject({
          username: "butter_bridge",
          name: "jonny",
          avatar_url:
            "https://www.healthytherapies.com/wp-content/uploads/2016/06/Lime3.jpg",
        });
      });
  });

  test("GET: 404 returns not found when retrieving a non-existent user", () => {
    return request(app)
      .get("/api/users/the_scarlet_pimpernel")
      .expect(404)
      .then(({ body }) => {
        expect(body.status).toBe(404);
        expect(body.msg).toBe("Not Found");
      });
  });
});
