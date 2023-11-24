# Northcoders News API 🗞

This project provides a Reddit-like REST API with articles, topics, comments and voting.

🚀 [**Try it LIVE!**](https://nc-news-bdi7.onrender.com/api) 🚀

## API Features

### Articles

- List articles
- Post articles
- Delete articles
- Vote on articles
- Comment on articles

### Comments

- Vote on comments
- Delete comments

### Topics

- Post articles to a topic
- Retrieve topics
- Delete topics

### Users

- List users
- Retrieve a specific user

---

A complete list of endpoints with HTTP methods, example responses, example request bodies and supported queries can be found in [endpoints.json](./endpoints.json) or by visitng /api/endpoints.

## Requirements 📝

This API was developed using **`Postgres v14.9`**. and **`node v20.5.0`**.

**Older versions may work, but no guarantees are provided.**

## Installation 📦

To install this project locally, clone the repository:

```bash
git clone https://github.com/JamieS87/nc-backend-project
```

Change into the project's base directory

```bash
cd ./nc-backend-project
```

And install the project's dependencies with npm

```bash
npm install
```

## Setup 🔧

### Create the databases

Before running the project, you will need to create the required databases by running the following command from the project's base directory.

```
npm setup-dbs
```

The above command will create the `nc_news_test` and `nc_news` databases on your local machine.

### Create the .env files

The project needs to know which database to connect to when running tests and which to connect to when running the server.

Create the file `.env.test` in the base directory. It should contain:

```
PGDATABASE=nc_news_test
```

Create the file `.env.development` in the base directory. It should contain:

```
PGDATABASE=nc_news
```

## Seeding 🌱

To seed the development database, a "seed" script is provided in package.json. Run it with the command

```bash
npm run seed
```

The test database doesn't need to be seeded manually. It will be seeded automatically when running the tests.

## Starting the Server 🐹

To start the server and serve the API on port 9090, run

```bash
npm start
```

To check everything is working correctly, visit http://localhost:9090/api and you should be greeted with a list of available endpoints.

## Running the tests 🧪

The project's tests can be run using

```bash
npm test
```
