const catchAsync = require("../utils/catchAsync");
const AppError = require("../utils/AppError");
const {
  buildBackendRequestBody,
  sendToBackend,
} = require("../services/backendService");
const getAgentConfig = require("../config/agentsConfig/agentConfigRouter");

exports.outboundCallViaTwillo = catchAsync(async (req, res, next) => {
  console.log("Request Body:", req.body);

  // Extract data from request body
  if (
    !req.body ||
    !req.body.callType ||
    !req.body.leadInfo.id ||
    !req.body.leadInfo.phone
  ) {
    return next(
      new AppError("Missing required field(s): callType, id, and phone", 400),
    );
  }
  const { callType, to_number } = {
    callType: req.body.callType,
    to_number: req.body.leadInfo.phone,
  };

  // Get agent configuration based on call type
  const agentConfig = getAgentConfig(callType, req.body, to_number);

  if (!agentConfig) {
    return next(
      new AppError(
        "Invalid call type. Supported types: 'sales', 'resales'",
        400,
      ),
    );
  }

  const response = await fetch(
    "https://api.elevenlabs.io/v1/convai/twilio/outbound-call",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "xi-api-key": process.env.elvenLabsAPIKey,
      },
      body: JSON.stringify(agentConfig),
    },
  );

  const data = await response.json();
  if (!response.ok || data.success === false) {
    console.log(response);

    const backendRequestBody = buildBackendRequestBody({
      leadID: req.body.leadInfo.id,
      contactName: req.body.leadInfo.name,
      summary: `Call initiation failed: ${data.message || "Unknown error"}${
        data.error ? ` - ${data.error}` : ""
      }`,
      duration: 0,
      callOutcome: "failed",
    });

    try {
      await sendToBackend(backendRequestBody);
    } catch (err) {
      // Error already logged in sendToBackend
    }

    return next(
      new AppError(
        `Failed to initiate call with ElevenLabs: ${
          data.message || "Unknown error"
        }`,
        500,
      ),
    );
  }

  res.status(200).json({
    status: "success",
    data: {
      message: "Outbound call initiated successfully",
      to_number,
      callType,
      responseStatus: response.status,
    },
  });
});
