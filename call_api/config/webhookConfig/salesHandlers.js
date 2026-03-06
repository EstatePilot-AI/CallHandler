const AppError = require("../../utils/AppError");
const {
  extractLeadInfo,
  buildBackendRequestBody,
  sendToBackend,
} = require("../../services/backendService");

// Handler for post call transcription (Sales)
const handleSalesPostCallTranscription = async (webhookData) => {
  // Validate required fields
  if (
    !webhookData.conversation_id ||
    !webhookData.agent_id ||
    !webhookData.status
  ) {
    throw new AppError("Invalid webhook payload: missing required fields", 400);
  }

  const { leadID, contactName } = extractLeadInfo(webhookData);
  const callId = webhookData.conversation_id;
  const callDuration = webhookData.metadata.call_duration_secs;
  const summary = webhookData.analysis.transcript_summary;
  const data_collection_results = webhookData.analysis.data_collection_results;

  console.log(data_collection_results);

  // Extract data collection results with safe defaults
  const extractedData = {
    unanswered_questions: {
      value: data_collection_results.unanswered_questions?.value || null,
      rationale:
        data_collection_results.unanswered_questions?.rationale ||
        "No rationale provided",
    },
    lead_state: {
      value: data_collection_results.lead_state?.value || "notinterested",
      rationale:
        data_collection_results.lead_state?.rationale ||
        "No rationale provided",
    },
  };

  console.log("Summary:", summary);
  console.log("Extracted Data:");
  Object.keys(extractedData).forEach((key) => {
    console.log(
      `${key}: ${extractedData[key].value} (Rationale: ${extractedData[key].rationale})`,
    );
  });

  console.log("Dynamic Variable:");

  Object.keys(
    webhookData.conversation_initiation_client_data.dynamic_variables || {},
  ).forEach((key) => {
    console.log(
      `  ${key}: ${webhookData.conversation_initiation_client_data.dynamic_variables[key]}`,
    );
  });

  // Determine call outcome based on extracted data
  let callOutcome = extractedData.lead_state.value || "unknown";

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

module.exports = {
  handleSalesPostCallTranscription,
};
