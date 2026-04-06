const express = require("express");
const {
  getConversationWithId,
  getConversationRecordings,
  getConversationData,
} = require("../controllers/convController");
const router = express.Router({ mergeParams: true });

router.route("/:id").get(getConversationWithId);
router.route("/:id/data").get(getConversationData);
router.route("/:id/audio").get(getConversationRecordings);

module.exports = router;
