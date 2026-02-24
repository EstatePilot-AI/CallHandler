const express = require("express");
const {
  reciveCallSummary
} = require("../controllers/webhookController");

const router = express.Router({ mergeParams: true });

router.route("/reciveCallSummary").post(reciveCallSummary);

module.exports = router; 
