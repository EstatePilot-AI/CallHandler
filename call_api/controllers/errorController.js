const AppError = require("../utils/AppError");

const handleExampleError = (err) =>
  new AppError(`ExampleError failed: ${err.message}`, xxx);

sendErrorProd = (err, res) => {
  let error = err;

  if (error.name === "Example") error = handleExampleError(error);

  if (error.isOperational) {
    return res.status(error.statusCode).json({
      status: error.status,
      message: error.message,
    });
  }

  res.status(500).json({
    status: "error",
    message: "Something went very wrong!",
  });
};

sendErrorDev = (err, res) => {
  res.status(err.statusCode).json({
    status: err.status,
    error: err,
    message: err.message,
    stack: err.stack,
  });
};

sendError = (err, res) => {
  if (
    process.env.NODE_ENV === "development" ||
    process.env.NODE_ENV === "testing"
  ) {
    sendErrorDev(err, res);
  } else {
    sendErrorProd(err, res);
  }
};

module.exports = (err, req, res, next) => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || "error";
  err.message = err.message || "Internal Server Error";

  console.log(
    `\x1b[3${err.statusCode.toString().startsWith("4") ? "3" : "1"}m%s\x1b[0m`,
    `${err.status.toString().toUpperCase()}: ` + err.message
  );

  sendError(err, res);
};
