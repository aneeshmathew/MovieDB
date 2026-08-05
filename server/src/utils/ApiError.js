class ApiError extends Error {
  constructor(message, statusCode = 500, code = "INTERNAL_ERROR") {
    super(message);
    this.name = "ApiError";
    this.statusCode = statusCode;
    this.code = code;
  }

  static badRequest(message, code = "BAD_REQUEST") {
    return new ApiError(message, 400, code);
  }

  static unauthorized(message = "Not authenticated", code = "UNAUTHENTICATED") {
    return new ApiError(message, 401, code);
  }

  static forbidden(message = "Not authorized", code = "FORBIDDEN") {
    return new ApiError(message, 403, code);
  }

  static notFound(message = "Not found", code = "NOT_FOUND") {
    return new ApiError(message, 404, code);
  }

  static conflict(message, code = "CONFLICT") {
    return new ApiError(message, 409, code);
  }

  static badGateway(message = "Upstream service error", code = "UPSTREAM_ERROR") {
    return new ApiError(message, 502, code);
  }
}

module.exports = ApiError;
