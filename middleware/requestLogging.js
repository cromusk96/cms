export default function requestLogging(req, res, next) {
  if (req.method?.toUpperCase() != "GET") {
    console.log(
      new Date().toISOString(),
      req.db,
      req.user,
      req.userId,
      req.method,
      req.originalUrl,
      JSON.stringify(req.body)
    );
  }
  next();
}
