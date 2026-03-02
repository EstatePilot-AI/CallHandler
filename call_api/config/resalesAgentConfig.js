// Agent Configuration for Resales (Underdeveloped - Placeholder)
const getAgentConfigForResales = (requestBody) => {
  // TODO: This feature is underdeveloped and needs to be implemented
  // Placeholder configuration for future resales agent
  return {
    dynamic_variables: {
      // Placeholder variables - to be defined later
      leadInfo__ID: requestBody.leadInfo.id || "null",
      leadInfo__name: requestBody.leadInfo.name || "null",
      leadInfo__phone: requestBody.leadInfo.phone || "null",
      // Additional resales-specific variables to be added
    },
  };
};

module.exports = getAgentConfigForResales;
