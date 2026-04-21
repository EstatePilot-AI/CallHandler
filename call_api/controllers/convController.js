const catchAsync = require("../utils/catchAsync");
const AppError = require("../utils/AppError");

// Helper function to fetch conversation data (reusable)
const fetchConversationData = async (conversationId) => {
  const response = await fetch(
    `https://api.elevenlabs.io/v1/convai/conversations/${conversationId}`,
    {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "xi-api-key": process.env.elvenLabsAPIKey,
      },
    },
  );

  if (!response.ok) {
    throw new Error(
      `Failed to fetch conversation data: ${response.statusText}`,
    );
  }

  return await response.json();
};

exports.fetchConversationData = fetchConversationData;

exports.getConversationRecordings = catchAsync(async (req, res, next) => {
  const conversationId = req.params.id;
  if (!conversationId) {
    return next(new AppError("Conversation ID parameter is missing", 400));
  } else {
    const response = await fetch(
      `https://api.elevenlabs.io/v1/convai/conversations/${conversationId}/audio`,
      {
        method: "GET",
        headers: {
          "xi-api-key": process.env.elvenLabsAPIKey,
        },
      },
    );
    if (!response.ok) {
      return next(
        new AppError(
          `Failed to fetch conversation audio: ${response.statusText}`,
          response.status,
        ),
      );
    }

    // Get the audio data as a buffer
    const audioBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(audioBuffer);

    // Set appropriate headers for audio response
    res.setHeader("Content-Type", "audio/mpeg");
    res.setHeader("Content-Length", buffer.length);
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="conversation_${conversationId}.mp3"`,
    );

    // Send the audio buffer
    res.status(200).send(buffer);
  }
});

exports.getConversationWithId = catchAsync(async (req, res, next) => {
  const conversationId = req.params.id;
  if (!conversationId) {
    return next(new AppError("Conversation ID parameter is missing", 400));
  }
  const conversationData = await fetchConversationData(conversationId);
  res.status(200).json({ status: "success", data: conversationData });
});

exports.getConversationData = catchAsync(async (req, res, next) => {
  const conversationId = req.params.id;
  if (!conversationId) {
    return next(new AppError("Conversation ID parameter is missing", 400));
  }

  const conversationData = await fetchConversationData(conversationId);
  const callCost =
    (0.187 * (conversationData?.metadata?.call_duration_secs || 0)) / 60;

  const evaluationCriteriaResultsList =
    conversationData?.analysis?.evaluation_criteria_results_list;
  const dataCollectionResultsList =
    conversationData?.analysis?.data_collection_results_list;
  const dynamicVariables =
    conversationData?.conversation_initiation_client_data?.dynamic_variables;
  const callType = dynamicVariables?.leadInfo__callType;
  const filteredDataCollectionResultsList =
    dataCollectionResultsList === undefined
      ? []
      : callType === "sales"
        ? dataCollectionResultsList.filter(
            (item) =>
              item?.data_collection_id === "unanswered_questions" ||
              item?.data_collection_id === "lead_state" ||
              item?.data_collection_id === "propertyId",
          )
        : dataCollectionResultsList.filter(
            (item) =>
              item?.data_collection_id !== "lead_state" &&
              item?.data_collection_id !== "propertyId",
          );
  const dynamicVariablesList =
    dynamicVariables === undefined
      ? []
      : Object.entries(dynamicVariables)
          .map(([key, value]) => ({
            dynamic_variable_id: key,
            value,
          }));
  const transcript = conversationData?.transcript;

  const structuredData = {
    metadata: {
      conversation_id: conversationData.conversation_id,
      agent_id: conversationData.agent_id,
      to_number: conversationData?.metadata?.phone_call?.external_number,
      from_number: conversationData?.metadata?.phone_call?.agent_number,
      conversation_duration_seconds:
        conversationData?.metadata?.call_duration_secs,
      charging: {
        call_cost: callCost,
        llm_cost: conversationData?.metadata?.charging?.llm_price || 0,
      },
    },
    evaluation_criteria_results_list:
      evaluationCriteriaResultsList === undefined
        ? []
        : evaluationCriteriaResultsList,
    data_collection_results_list: filteredDataCollectionResultsList,
    dynamic_variables_list: dynamicVariablesList,
    transcript: transcript === undefined ? [] : transcript,
  };
  res.status(200).json({ status: "success", data: structuredData });
});
