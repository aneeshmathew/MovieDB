// Wraps an Express route handler: (req, res, next) => Promise
// so any rejected promise / thrown error is forwarded to next() automatically.
function asyncHandler(fn) {
  return function wrapped(req, res, next) {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

module.exports = asyncHandler;
