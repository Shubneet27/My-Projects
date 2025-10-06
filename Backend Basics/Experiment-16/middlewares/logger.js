
module.exports = (req, _res, next) => {
  const time = new Date().toISOString();
  const method = req.method;
  const url = req.originalUrl;
  console.log(`[${time}] ${method} ${url}`);
  next();
};