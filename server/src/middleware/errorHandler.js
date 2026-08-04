const ApiError = require("../utils/ApiError");

// Must be registered last, after all routes.
function errorHandler(err, req, res, next) { // eslint-disable-line no-unused-vars
  if (err instanceof ApiError) {
    return res.status(err.statusCode).json({
      error: { message: err.message, code: err.code },
    });
  }

  console.error("Unhandled error:", err);
  return res.status(500).json({
    error: { message: "Internal server error", code: "INTERNAL_ERROR" },
  });
}

module.exports = { errorHandler };
