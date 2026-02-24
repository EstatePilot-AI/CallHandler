const catchAsync = require("../utils/catchAsync");
const AppError = require("../utils/AppError");

exports.reciveCallSummary = catchAsync(async (req, res, next) => {
  const backendUrl = process.env.BACKEND_Webhook_URL;

  // Validate request body exists
  if (!req.body || !req.body.data) {
    return next(
      new AppError("Invalid webhook payload: missing body or data", 400),
    );
  }

  if (req.body.type === "call_initiation_failure") {
    console.log("Call Initiation Failure Response:", req.body);

    await fetch(
      `https://api.elevenlabs.io/v1/convai/conversations/${req.body.data.conversation_id}`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "xi-api-key": process.env.elvenLabsAPIKey,
        },
      },
    )
      .then((res) => res.json())
      .then(async (conversationData) => {
        const backendRequestBody = {
          leadID: String(
            conversationData.conversation_initiation_client_data
              ?.dynamic_variables?.leadInfo__ID || "null",
          ),
          callId: req.body.data.conversation_id,
          summary:
            "Call initiation failed: " +
            (req.body.data.failure_reason || "Unknown reason"),
          duration: 0,
          callOutcome: (() => {
            const failureReason =
              req.body.data.failure_reason?.toLowerCase() || "";
            if (failureReason.includes("busy")) {
              return "busy";
            } else if (
              failureReason.includes("no-answer") ||
              failureReason.includes("noanswer")
            ) {
              return "noanswer";
            } else {
              return "failed";
            }
          })(),
        };

        await fetch(backendUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(backendRequestBody),
        })
          .then((res) => res.json())
          .then((data) => {
            console.log("Data sent to Backend successfully:", {
              ...backendRequestBody,
              summary: "Call initiation failed",
            });
            console.log("Response from Backend:", data);
          })
          .catch((err) => {
            console.error("Error sending data to Backend:", err);
          });
      })
      .catch((err) => {
        console.error("Error fetching conversation details:", err);
      });
  } else if (req.body.type === "post_call_transcription") {
    // Validate required fields
    const { data, event_timestamp } = req.body;

    if (!data.conversation_id || !data.agent_id || !data.status) {
      return next(
        new AppError("Invalid webhook payload: missing required fields", 400),
      );
    }

    if (!data.metadata || !data.analysis || !data.transcript) {
      return next(
        new AppError(
          "Invalid webhook payload: missing metadata, analysis, or transcript",
          400,
        ),
      );
    }

    if (!Array.isArray(data.transcript)) {
      return next(
        new AppError(
          "Invalid webhook payload: transcript must be an array",
          400,
        ),
      );
    }

    const callId = data.conversation_id;
    const agentId = data.agent_id;
    const clientId =
      data.conversation_initiation_client_data.dynamic_variables.leadInfo__ID ||
      "null";
    const status = data.status;
    const timestampms = event_timestamp;
    const callDuration = data.metadata.call_duration_secs;
    const summary = data.analysis.transcript_summary;
    const transcript = data.transcript;
    const data_collection_results = data.analysis.data_collection_results;
    console.log(data_collection_results);

    let extractedData = {
      is_interested: {
        value: data_collection_results.is_interested.value || "null",
        rationale:
          data_collection_results.is_interested.rationale ||
          "No rationale provided",
      },
      needs_matchmaking: {
        value: data_collection_results.needs_matchmaking.value || "null",
        rationale:
          data_collection_results.needs_matchmaking.rationale ||
          "No rationale provided",
      },
      unanswered_questions: {
        value: data_collection_results.unanswered_questions.value || "null",
        rationale:
          data_collection_results.unanswered_questions.rationale ||
          "No rationale provided",
      },
    };

    // extracting data:
    // is_interested: {extractedData.is_interested.value, extractedData.is_interested.rationale},
    // needs_matchmaking: {extractedData.follow_up_action.value, extractedData.follow_up_action.rationale},
    // unanswered_questions: {extractedData.follow_up_time.value, extractedData.follow_up_time.rationale},
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
    //   body: {
    //   type: 'post_call_transcription',
    //   event_timestamp: 1765894037,
    //   data: {
    //     agent_id: 'agent_9201kc0rrz0neyt8afwfketf30re',
    //     conversation_id: 'conv_4001kckqqzfwe0nsx4hy8w2j2c3d',
    //     status: 'done',
    //     user_id: null,
    //     branch_id: null,
    //     transcript: [Array],
    //     metadata: [Object],
    //     analysis: [Object],
    //     conversation_initiation_client_data: [Object]
    //   }
    // },

    // send to Backend the Data to the webhook for post_call_transcription
    const backendRequestBody = {
      leadID: String(clientId),
      callId,
      summary:
        summary +
        (extractedData.unanswered_questions.value === true
          ? ", Unanswered Questions: " +
            extractedData.unanswered_questions.rationale
          : ""),
      duration: callDuration,
      callOutcome: (() => {
        if (extractedData.needs_matchmaking.value === true) {
          return "need_matchmaking";
        } else if (extractedData.is_interested.value === true) {
          return "interested";
        } else {
          return "notinterested";
        }
      })(),
    };

    await fetch(backendUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(backendRequestBody),
    })
      .then((res) => res.json())
      .then((data) => {
        console.log("Data sent to Backend successfully:", backendRequestBody);
        console.log("Response from Backend:", data);
      })
      .catch((err) => {
        console.error("Error sending data to Backend:", err);
      });
  } else {
    const backendRequestBody = {
      leadID: "null",
      callId: req.body.data.conversation_id || "null",
      summary: "Received unhandled webhook type: " + req.body.type,
      duration: 0,
      callOutcome: "unknown",
    };
    await fetch(backendUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(backendRequestBody),
    })
      .then((res) => res.json())
      .then((data) => {
        console.log(
          "Data sent to Backend for unhandled webhook type:",
          backendRequestBody,
        );
        console.log("Response from Backend:", data);
      })
      .catch((err) => {
        console.error(
          "Error sending data to Backend for unhandled webhook type:",
          err,
        );
      });
  }

  res.status(200).send("Webhook received and processed");
});
