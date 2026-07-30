/**
 * Wrap an async Express handler so rejected promises are forwarded to the
 * centralized error handler instead of crashing the process or hanging the
 * request. Lets controllers use plain `await` without repetitive try/catch.
 *
 * @param {Function} fn - async (req, res, next) => {...}
 * @returns {Function} Express middleware
 */
const asyncHandler = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

export default asyncHandler;
