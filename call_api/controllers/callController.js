const catchAsync = require("../utils/catchAsync");
const AppError = require("../utils/AppError");
const {
  buildBackendRequestBody,
  sendToBackend,
} = require("../services/backendService");

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

  const agent_phone_number_id = process.env.agent_phone_number_id;
  let agent_id;

  if (callType === "sales") {
    agent_id = process.env.elvenLabsSalesAgentId;
  } else {
    return next(new AppError("Invalid call type, e.g. 'sales'", 400));
  }

  const response = await fetch(
    "https://api.elevenlabs.io/v1/convai/twilio/outbound-call",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "xi-api-key": process.env.elvenLabsAPIKey,
      },
      body: JSON.stringify({
        agent_id: agent_id,
        agent_phone_number_id: agent_phone_number_id,
        to_number: to_number,
        conversation_initiation_client_data: {
          dynamic_variables: {
            leadInfo__ID: req.body.leadInfo.id || "null",
            leadInfo__name: req.body.leadInfo.name || "null",
            leadInfo__phone: req.body.leadInfo.phone || "null",
            propInfo__type: req.body.propInfo.type || "null",
            propInfo__finishing: req.body.propInfo.finishing || "null",
            propInfo__price: req.body.propInfo.price || "null",
            propInfo__area: req.body.propInfo.area || "null",
            propInfo__rooms: req.body.propInfo.rooms || "null",
            propInfo__bathrooms: req.body.propInfo.bathrooms || "null",
            propInfo__location__country:
              req.body.propInfo.location.country || "null",
            propInfo__location__governorate:
              req.body.propInfo.location.governorate || "null",
            propInfo__location__city: req.body.propInfo.location.city || "null",
            propInfo__location__street:
              req.body.propInfo.location.street || "null",
            propInfo__location__building:
              req.body.propInfo.location.building || "null",
            propInfo__location__buildingNumber:
              req.body.propInfo.location.buildingNumber || "null",
            propInfo__location__floor:
              req.body.propInfo.location.floor || "null",
            propInfo__location__apartmentNumber:
              req.body.propInfo.location.apartmentNumber || "null",
            propInfo__additionalInfo:
              req.body.propInfo.additional_info || "null",
          },
        },
      }),
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
