exports.handle404 = (req, res, next) => {
  res.status(404).send({ msg: "Not Found" });
};

exports.handleServerError = (err, req, res, next) => {
  console.log(err);
  res.status(500).send({ msg: "Internal Server Error" });
};
