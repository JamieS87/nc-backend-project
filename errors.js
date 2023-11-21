exports.handle404 = (req, res, next) => {
  res.status(404).send({ status: 404, msg: "Not Found" });
};

exports.handlePostgresError = (err, req, res, next) => {
  if (err.code === "22P02" || err.code === "23502" || err.code === "23503") {
    res.status(400).send({ status: 400, msg: "Bad Request" });
  } else {
    next(err);
  }
};

exports.handleServerError = (err, req, res, next) => {
  console.log(err);
  if (err.status) {
    res.status(err.status).send({ status: err.status, msg: err.msg });
  } else {
    res.status(500).send({ msg: "Internal Server Error" });
  }
};
