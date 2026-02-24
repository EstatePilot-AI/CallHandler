const path = require("path");
const dotenv = require("dotenv");
const app = require("../index");

dotenv.config({ path: path.join(__dirname, "../config.env"), quiet: true });

module.exports = async (req, res) => {
  return app(req, res);
};
