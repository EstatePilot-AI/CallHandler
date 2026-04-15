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
  
  const matchedPropertyId = extractedData?.matchedPropertyId?.value;
  
  const callType =
    webhookData.conversation_initiation_client_data.dynamic_variables
      .leadInfo__callType || "unknown";

  const backendRequestBody = buildBackendRequestBody({
    leadID,
    contactName,
    callId,
    summary: fullSummary,
    duration: callDuration,
    callOutcome,
    callType,
    propertyId: matchedPropertyId || null
  });

  await sendToBackend(backendRequestBody);
};

module.exports = {
  handleSalesPostCallTranscription,
};










// 10:20 % ملكيه فكريه
// 2% 2
// 1% 3

// 8: 80% التطبيق

// 1:
// 2:
// 3:
// 4:
// 5:
// 6:
// 7:
// 8:

// idea 20%
// 1: founder: 40% - Hanan
// 2: co-founder: 30% - Marslino 
// 3: early employee: 20% - George, Toba
// 4: advisor: 10%  - MazenEmad, MazenAtar, Pop, Khaled


// project structure: 80%

// 1: backend 30%
// Toba 50%, Hanan 50%

// 2: flutter 5%:
// george 100%

// 3: UI 5%:
// MazenEmad 80%, Pop 20%

// 4: front 25%
// Pop 50%, Khaled 50%

// 5: AI 35%
// Marslino 60%, MazenAtar 40%

// Marslino 6% + 16.8% = 22.8%
// Hanan 8% + 12% = 20%
// Toba 2% + 12% = 14%
// George 2% + 4% = 6%
// MazenEmad 0.5% + 3.2% = 3.7%
// MazenAtar 0.5% + 11.2% = 11.7%
// Pop 0.5% + 0.8% + 10% = 11.3%
// Khaled 0.5% + 10% = 10.5%