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
