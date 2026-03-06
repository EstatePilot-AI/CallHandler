const { fetchConversationData } = require("../../controllers/convController");
const {
  extractLeadInfo,
  buildBackendRequestBody,
  sendToBackend,
} = require("../../services/backendService");

// Handler for call initiation failure (Common for both Sales & Resales)
const handleCallInitiationFailure = async (webhookData) => {
  console.log("Call Initiation Failure Response:", webhookData);

  const conversationId = webhookData.conversation_id;
  const conversationData = await fetchConversationData(conversationId);

  const { leadID, contactName } = extractLeadInfo(conversationData);
  const failureReason = webhookData.failure_reason || "Unknown reason";

  // Determine call outcome based on failure reason
  const failureReasonLower = failureReason.toLowerCase();
  let callOutcome = "failed";
  if (failureReasonLower.includes("busy")) {
    callOutcome = "busy";
  } else if (
    failureReasonLower.includes("no-answer") ||
    failureReasonLower.includes("noanswer")
  ) {
    callOutcome = "noanswer";
  }

  const backendRequestBody = buildBackendRequestBody({
    leadID,
    contactName,
    callId: conversationId,
    summary: `Call initiation failed: ${failureReason}`,
    duration: 0,
    callOutcome,
  });

  await sendToBackend(backendRequestBody);
};

// Handler for unhandled webhook types
const handleUnknownWebhook = async (webhookData) => {
  const conversationId =
    webhookData.conversation_id || "unknown_conversation_id";
  const backendRequestBody = buildBackendRequestBody({
    callId: conversationId,
    summary: `Received unhandled webhook type: ${webhookData.type}`,
    callOutcome: "unhandled_webhook",
    duration: 0,
    leadID: "null",
    contactName: "null",
  });

  await sendToBackend(backendRequestBody);
};

module.exports = {
  handleCallInitiationFailure,
  handleUnknownWebhook,
};
