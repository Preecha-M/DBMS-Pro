export function errorHandler(err, req, res, next) {
  res.status(500).json({
    message: "Internal Server Error",
    error: String(err?.message || err)
  })
}