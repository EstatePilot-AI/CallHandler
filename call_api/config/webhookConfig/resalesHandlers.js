const AppError = require("../../utils/AppError");
const {
  extractLeadInfo,
  buildBackendRequestBody,
  sendToBackend,
} = require("../../services/backendService");

// Handler for post call transcription (Resales - Underdeveloped)
const handleResalesPostCallTranscription = async (webhookData) => {
  console.log("Resales Post Call Transcription - Underdeveloped");
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
    seller_state: {
      value: data_collection_results.seller_state?.value || "notinterested",
      rationale:
        data_collection_results.seller_state?.rationale ||
        "No rationale provided",
    },
  };

  // Extract property data points from data_collection_results
  const propertyData = {
    propertyType: data_collection_results.propertyType?.value || null,
    price: data_collection_results.price?.value || null,
    area: data_collection_results.area?.value || null,
    rooms: data_collection_results.rooms?.value || null,
    bathrooms: data_collection_results.bathrooms?.value || null,
    finishingType: data_collection_results.finishingType?.value || null,
    negotiable: data_collection_results.negotiable?.value || null,
    additionalInfo: data_collection_results.additionalInfo?.value || null,
    downPayment: data_collection_results.downPayment?.value || null,
    paymentMethod: data_collection_results.paymentMethod?.value || null,
    listingType: data_collection_results.listingType?.value || null,
    country: data_collection_results.country?.value || null,
    governorate: data_collection_results.governorate?.value || null,
    city: data_collection_results.city?.value || null,
    district: data_collection_results.district?.value || null,
    street: data_collection_results.street?.value || null,
    buildingNumber: data_collection_results.buildingNumber?.value || null,
    floorNumber: data_collection_results.floorNumber?.value || null,
    apartmentNumber: data_collection_results.apartmentNumber?.value || null,
  };

  console.log("Summary:", summary);
  console.log("Extracted Data:");
  Object.keys(extractedData).forEach((key) => {
    console.log(
      `${key}: ${extractedData[key].value} (Rationale: ${extractedData[key].rationale})`,
    );
  });

  console.log("Property Data:");
  Object.keys(propertyData).forEach((key) => {
    if (propertyData[key] !== null) {
      console.log(`  ${key}: ${propertyData[key]}`);
    }
  });

  console.log("Dynamic Variables:");
  Object.keys(
    webhookData.conversation_initiation_client_data.dynamic_variables || {},
  ).forEach((key) => {
    console.log(
      `  ${key}: ${webhookData.conversation_initiation_client_data.dynamic_variables[key]}`,
    );
  });

  // Determine call outcome based on extracted data
  let callOutcome = extractedData.seller_state.value || "unknown";

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
    propertyDto: {
      propertyInfo: {
        propertyType: propertyData.propertyType,
        price: propertyData.price,
        area: propertyData.area,
        rooms: propertyData.rooms,
        bathrooms: propertyData.bathrooms,
        finishingType: propertyData.finishingType,
        negotiable: propertyData.negotiable,
        additionalInfo: propertyData.additionalInfo,
      },
      propertyPayment: {
        downPayment: propertyData.downPayment,
        paymentMethod: propertyData.paymentMethod,
        listingType: propertyData.listingType,
      },
      propertyLocation: {
        country: propertyData.country,
        governorate: propertyData.governorate,
        city: propertyData.city,
        district: propertyData.district,
        street: propertyData.street,
        buildingNumber: propertyData.buildingNumber,
        floorNumber: propertyData.floorNumber,
        apartmentNumber: propertyData.apartmentNumber,
      },
    },
  });

  await sendToBackend(backendRequestBody);
};

module.exports = {
  handleResalesPostCallTranscription,
};
