const request = require("supertest");
const { app } = require("../../app");

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
