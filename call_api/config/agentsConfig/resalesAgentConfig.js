// Agent Configuration for Resales (Underdeveloped - Placeholder)
const getAgentConfigForResales = (requestBody) => {
  const resalesAgentPrompt =
    process.env.RESALES_AGENT_PROMPT ||
    "You are Hazem from Estate Pilot. Convince owners to list for free and collect complete resale property details step by step.";

  return {
    dynamic_variables: {
      // Placeholder variables - to be defined later
      leadInfo__ID: requestBody.leadInfo.id || "null",
      leadInfo__callType: requestBody.callType || "null",
      leadInfo__name: requestBody.leadInfo.name || "null",
      leadInfo__phone: requestBody.leadInfo.phone || "null",
      // Additional resales-specific variables to be added
    },
    prompt: resalesAgentPrompt,
    first_message:
      "سلام عليكم! مع حضرتك حازم من Estate Pilot. هل بكلم أستاذ {{leadInfo__name}}؟",
  };
};

module.exports = getAgentConfigForResales;
