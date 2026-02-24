const express = require("express");
const {
  outboundCallViaTwillo,
  doSomethingWithId,
} = require("../controllers/callController");
const router = express.Router({ mergeParams: true });

router.route("/").post(outboundCallViaTwillo);

router.route("/:id").get(doSomethingWithId);

module.exports = router;
