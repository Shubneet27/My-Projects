const express = require("express");
const logger = require("./middlewares/logger");
const auth = require("./middlewares/auth");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(logger);

app.get("/public", (req, res) => {
  res.status(200).send("This is a public route. No authentication required.");
});

app.get("/protected", auth, (req, res) => {
  res
    .status(200)
    .send("You have accessed a protected route with a valid Bearer token!");
});

app.use((req, res) => {
  res.status(404).json({ message: "Not found" });
});

app.listen(PORT, () => {
  console.log(`Server listening on http://localhost:${PORT}`);
});
