/**
 * Centralized Express error handler.
 *
 * Converts thrown errors into consistent JSON responses. Service-layer errors
 * carry an optional `.status` property (see rideService.httpError); anything
 * else defaults to 500. Mongoose validation and duplicate-key errors are
 * translated into friendly 400/409 messages so the client can surface a clear
 * toast.
 *
 * @param {Error} err
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} _next
 */
export default function errorHandler(err, req, res, _next) {
  let status = err.status || 500;
  let message = err.message || "Internal server error";

  // Mongoose validation error → 400 with the first field message.
  if (err.name === "ValidationError") {
    status = 400;
    message = Object.values(err.errors)[0]?.message || "Validation failed";
  }

  // Duplicate unique key (e.g. email / license plate) → 409.
  if (err.code === 11000) {
    status = 409;
    const field = Object.keys(err.keyValue || {})[0] || "field";
    message = `${field} already exists`;
  }

  // Invalid ObjectId in a route param → 400.
  if (err.name === "CastError") {
    status = 400;
    message = `Invalid ${err.path}`;
  }

  if (status >= 500) {
    // Log server-side faults for observability; keep client message generic.
    console.error("[error]", err);
  }

  res.status(status).json({ message });
}
