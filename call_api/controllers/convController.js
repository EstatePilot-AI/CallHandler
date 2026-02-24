const catchAsync = require("../utils/catchAsync");
const AppError = require("../utils/AppError");
exports.getConversationWithId = catchAsync(async (req, res, next) => {
  const conversationId = req.params.id;
  if (!conversationId) {
    return next(new AppError("Conversation ID parameter is missing", 400));
  } else {
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
      return next(
        new AppError(
          `Failed to fetch conversation data: ${response.statusText}`,
          response.status,
        ),
      );
    }
    const conversationData = await response.json();
    res.status(200).json({ status: "success", data: conversationData });
  }
});
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
