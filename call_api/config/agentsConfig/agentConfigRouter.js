const getAgentConfigForSales = require("./salesAgentConfig");
const getAgentConfigForResales = require("./resalesAgentConfig");

// Main Agent Configuration Router
const getAgentConfig = (callType, requestBody, to_number) => {
  let agentPrompt;
  switch (callType) {
    case "sales":
      agentPrompt = getAgentConfigForSales(requestBody);
      break;
    case "resales":
      agentPrompt = getAgentConfigForResales(requestBody);
      break;
    default:
      throw new Error("Invalid call type. Supported types: 'sales', 'resales'");
  }
  const agentConfig = {
    agent_id: process.env.elvenLabsAgentId,
    agent_phone_number_id: process.env.agent_phone_number_id,
    to_number: to_number,
    conversation_initiation_client_data: {
      dynamic_variables: agentPrompt.dynamic_variables,

      conversation_config_override: {
        // turn: {
        //   speculative_turn: true,
        //   turn_eagerness: 0.8,
        // },
        tts: {
          voice_id: process.env.elevenLabsVoiceID,
          // voice_settings: {
          //   stability: 0.5,
          //   speed: 1.20,
          //   similarity_boost: 0.75,
          // },
        },
        agent: {
          prompt: {
            prompt: agentPrompt.prompt,
          },
          first_message: agentPrompt.first_message,
          language: "ar",
        },
      },
    },
  };
  return agentConfig;
};

module.exports = getAgentConfig;
