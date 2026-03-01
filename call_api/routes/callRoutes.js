const express = require("express");
const { outboundCallViaTwillo } = require("../controllers/callController");
const router = express.Router({ mergeParams: true });

router.route("/").post(outboundCallViaTwillo);

module.exports = router;
