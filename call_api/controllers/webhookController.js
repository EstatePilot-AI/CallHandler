const catchAsync = require("../utils/catchAsync");
const AppError = require("../utils/AppError");
const { fetchConversationData } = require("./convController");
const {
  extractLeadInfo,
  buildBackendRequestBody,
  sendToBackend,
} = require("../services/backendService");

// Handler for call initiation failure
const handleCallInitiationFailure = async (webhookData) => {
  console.log("Call Initiation Failure Response:", webhookData);

  const conversationId = webhookData.data.conversation_id;
  const conversationData = await fetchConversationData(conversationId);

  const { leadID, contactName } = extractLeadInfo(conversationData);
  const failureReason = webhookData.data.failure_reason || "Unknown reason";

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

// Handler for post call transcription
const handlePostCallTranscription = async (webhookData) => {
  const { data, event_timestamp } = webhookData;

  // Validate required fields
  if (!data.conversation_id || !data.agent_id || !data.status) {
    throw new AppError(
      "Invalid webhook payload: missing required fields",
      400,
    );
  }

  if (!data.metadata || !data.analysis || !data.transcript) {
    throw new AppError(
      "Invalid webhook payload: missing metadata, analysis, or transcript",
      400,
    );
  }

  if (!Array.isArray(data.transcript)) {
    throw new AppError(
      "Invalid webhook payload: transcript must be an array",
      400,
    );
  }

  const callId = data.conversation_id;
  const agentId = data.agent_id;
  const { leadID, contactName } = extractLeadInfo(data);
  const status = data.status;
  const timestampms = event_timestamp;
  const callDuration = data.metadata.call_duration_secs;
  const summary = data.analysis.transcript_summary;
  const transcript = data.transcript;
  const data_collection_results = data.analysis.data_collection_results;

  console.log(data_collection_results);

  // Extract data collection results with safe defaults
  const extractedData = {
    is_interested: {
      value: data_collection_results.is_interested?.value || null,
      rationale:
        data_collection_results.is_interested?.rationale ||
        "No rationale provided",
    },
    needs_matchmaking: {
      value: data_collection_results.needs_matchmaking?.value || null,
      rationale:
        data_collection_results.needs_matchmaking?.rationale ||
        "No rationale provided",
    },
    unanswered_questions: {
      value: data_collection_results.unanswered_questions?.value || null,
      rationale:
        data_collection_results.unanswered_questions?.rationale ||
        "No rationale provided",
    },
  };

  // Log call details
  console.log("Call Transcript:");
  transcript.forEach((turn, i) => {
    console.log(
      `[${i + 1}] ${turn.role?.toUpperCase() || "UNKNOWN"}: ${turn.message || ""}`,
    );
  });

  console.log(
    `Call Summary Received - Call ID: ${callId}, Agent ID: ${agentId}, Status: ${status}, Timestamp: ${new Date(
      timestampms * 1000,
    ).toISOString()}, Duration: ${callDuration} seconds`,
  );
  console.log("Summary:", summary);

  console.log("Extracted Data:");
  Object.keys(extractedData).forEach((key) => {
    console.log(
      `${key}: ${extractedData[key].value} (Rationale: ${extractedData[key].rationale})`,
    );
  });

  // Determine call outcome based on extracted data
  let callOutcome = "notinterested";
  if (extractedData.needs_matchmaking.value === true) {
    callOutcome = "need_matchmaking";
  } else if (extractedData.is_interested.value === true) {
    callOutcome = "interested";
  }

  // Build summary with unanswered questions if applicable
  let fullSummary = summary;
  if (extractedData.unanswered_questions.value === true) {
    fullSummary += `, Unanswered Questions: ${extractedData.unanswered_questions.rationale}`;
  }

  const backendRequestBody = buildBackendRequestBody({
    leadID,
    contactName,
    callId,
    summary: fullSummary,
    duration: callDuration,
    callOutcome,
  });

  await sendToBackend(backendRequestBody);
};

// Handler for unhandled webhook types
const handleUnknownWebhook = async (webhookData) => {
  const backendRequestBody = buildBackendRequestBody({
    callId: webhookData.data?.conversation_id,
    summary: `Received unhandled webhook type: ${webhookData.type}`,
  });

  await sendToBackend(backendRequestBody);
};

exports.reciveCallSummary = catchAsync(async (req, res, next) => {
  // Validate request body exists
  if (!req.body || !req.body.data) {
    return next(
      new AppError("Invalid webhook payload: missing body or data", 400),
    );
  }

  const webhookType = req.body.type;

  try {
    switch (webhookType) {
      case "call_initiation_failure":
        await handleCallInitiationFailure(req.body);
        break;

      case "post_call_transcription":
        await handlePostCallTranscription(req.body);
        break;

      default:
        await handleUnknownWebhook(req.body);
        break;
    }

    res.status(200).send("Webhook received and processed");
  } catch (error) {
    console.error("Error processing webhook:", error);
    return next(error);
  }
});
