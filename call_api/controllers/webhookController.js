const catchAsync = require("../utils/catchAsync");
const AppError = require("../utils/AppError");

// Import handlers
const {
  handleCallInitiationFailure,
  handleUnknownWebhook,
} = require("../config/webhookConfig/commonHandlers");
const {
  handleSalesPostCallTranscription,
} = require("../config/webhookConfig/salesHandlers");
const {
  handleResalesPostCallTranscription,
} = require("../config/webhookConfig/resalesHandlers");

exports.reciveCallSummary = catchAsync(async (req, res, next) => {
  // Validate request body exists
  if (!req.body || !req.body.data) {
    return next(
      new AppError("Invalid webhook payload: missing body or data", 400),
    );
  }

  // console.log("Received Webhook:", JSON.stringify(req.body, null, 2));
  const webhookType = req.body.type;
  const webhookData = req.body.data;

  try {
    // Route based on webhook type, then by callType for post_call_transcription
    switch (webhookType) {
      case "call_initiation_failure":
        // Common handler for both sales and resales
        await handleCallInitiationFailure(webhookData);
        break;

      case "post_call_transcription":
        // Separate handling based on callType
        const callType =
          webhookData.conversation_initiation_client_data.dynamic_variables
            .leadInfo__callType || "unknown";
        switch (callType) {
          case "sales":
            await handleSalesPostCallTranscription(webhookData);
            break;

          case "resales":
            await handleResalesPostCallTranscription(webhookData);
            break;

          default:
            await handleUnknownWebhook(webhookData);
        }
        break;

      default:
        await handleUnknownWebhook(webhookData);
        break;
    }

    res.status(200).send("Webhook received and processed");
  } catch (error) {
    console.error("Error processing webhook:", error);
    return next(new AppError("Failed to process webhook.", 500));
  }
});
