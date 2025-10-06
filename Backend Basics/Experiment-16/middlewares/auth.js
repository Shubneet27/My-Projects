const VALID_TOKEN = process.env.BEARER_TOKEN || "mysecrettoken";

module.exports = (req, res, next) => {
  const authHeader = req.headers["authorization"] || "";
  const [scheme, token] = authHeader.split(" ");

  if (scheme === "Bearer" && token === VALID_TOKEN) {
    return next();
  }

  return res
    .status(401)
    .json({ message: "Authorization header missing or incorrect" });
};
