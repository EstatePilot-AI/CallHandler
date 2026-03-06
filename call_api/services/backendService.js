/**
 * Backend Service
 * Handles all interactions with the backend webhook URL
 */

// Helper function to extract lead info from conversation data
const extractLeadInfo = (conversationData) => {
  const clientData =
    conversationData?.conversation_initiation_client_data?.dynamic_variables ||
    {};
  return {
    leadID: String(clientData.leadInfo__ID || "null"),
    contactName: clientData.leadInfo__name || "null",
  };
};

// Helper function to build backend request body with defaults
const buildBackendRequestBody = ({
  leadID = "null",
  contactName = "null",
  callId = "null",
  summary = "",
  duration = 0,
  callOutcome = "unknown",
  propertyDto = null,
}) => {
  const requestBody = {
    leadID: String(leadID),
    contactName: contactName || "null",
    callId: callId || "null",
    summary: summary || "",
    duration: duration || 0,
    callOutcome: callOutcome || "unknown",
  };

  // Include propertyDto only if provided (for resales)
  if (propertyDto) {
    requestBody.propertyDto = propertyDto;
  }

  return requestBody;
}; 

// Helper function to send data to backend webhook
const sendToBackend = async (requestBody) => {
  const backendUrl = process.env.BACKEND_Webhook_URL;

  if (!backendUrl) {
    throw new Error("BACKEND_Webhook_URL is not configured");
  }

  try {
    const response = await fetch(backendUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestBody),
    });

    const data = await response.json();
    console.log("Data sent to Backend successfully:", requestBody);
    console.log("Response from Backend:", data);
    return data;
  } catch (err) {
    console.error("Error sending data to Backend:", err);
    throw err;
  }
};

module.exports = {
  extractLeadInfo,
  buildBackendRequestBody,
  sendToBackend,
};
