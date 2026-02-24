const express = require("express");
const {
  getConversationWithId,
  getConversationRecordings,
} = require("../controllers/convController");
const router = express.Router({ mergeParams: true });

router.route("/:id").get(getConversationWithId);
router.route("/:id/audio").get(getConversationRecordings);

module.exports = router;
