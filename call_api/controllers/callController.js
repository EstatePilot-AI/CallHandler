const catchAsync = require("../utils/catchAsync");
const AppError = require("../utils/AppError");
const {
  buildBackendRequestBody,
  sendToBackend,
} = require("../services/backendService");

// Agent Configuration for Sales
const getAgentConfigForSales = (requestBody) => {
  return {
    agent_id: process.env.elvenLabsSalesAgentId,
    agent_phone_number_id: process.env.agent_phone_number_id,
    dynamic_variables: {
      leadInfo__ID: requestBody.leadInfo.id || "null",
      leadInfo__name: requestBody.leadInfo.name || "null",
      leadInfo__phone: requestBody.leadInfo.phone || "null",
      propInfo__type: requestBody.propInfo.type || "null",
      propInfo__finishing: requestBody.propInfo.finishing || "null",
      propInfo__price: requestBody.propInfo.price || "null",
      propInfo__area: requestBody.propInfo.area || "null",
      propInfo__rooms: requestBody.propInfo.rooms || "null",
      propInfo__bathrooms: requestBody.propInfo.bathrooms || "null",
      propInfo__location__country:
        requestBody.propInfo.location.country || "null",
      propInfo__location__governorate:
        requestBody.propInfo.location.governorate || "null",
      propInfo__location__city: requestBody.propInfo.location.city || "null",
      propInfo__location__street:
        requestBody.propInfo.location.street || "null",
      propInfo__location__building:
        requestBody.propInfo.location.building || "null",
      propInfo__location__buildingNumber:
        requestBody.propInfo.location.buildingNumber || "null",
      propInfo__location__floor: requestBody.propInfo.location.floor || "null",
      propInfo__location__apartmentNumber:
        requestBody.propInfo.location.apartmentNumber || "null",
      propInfo__additionalInfo: requestBody.propInfo.additional_info || "null",
    },
    prompt: `# Personality

You are Hazem, a top-tier Egyptian real estate consultant at Estate Pilot. You aren't just an agent; you are a sales closer. You speak with a warm, authentic Egyptian accent (using "ya basha," "ya fandem," "ya handasa"). You are energetic, persuasive, and build trust quickly. You adapt your vibe to the client: if they are formal, be professional; if they joke, be light-hearted and witty.

# Environment

You are calling a lead over the phone to qualify them and sell them a property. You have access to information about the lead ({{leadInfo__name}}) and the property ({{propInfo__type}}, {{propInfo__location__city}}, {{propInfo__price}}, etc.). The lead may be busy or have limited knowledge of the property.

# Tone

Your tone is warm, authentic, and persuasive, with an Egyptian accent. Be energetic and build trust quickly. Adapt your vibe to the client: be professional if they are formal, and light-hearted and witty if they joke.

# Goal

Your goal is to qualify the lead and sell the value of the property.

Verification & Greeting:

Start: "سلام عليكم! مع حضرتك حازم من Estate Pilot. هل بكلم أستاذ {{leadInfo__name}}؟"

If YES: "أهلاً بك يا فندم، منورنا! كنت بكلمك بخصوص لقطة العقار الـ {{propInfo__type}} اللي في {{propInfo__location__city}}.. أخبارك إيه يا هندسة؟"

If NO: Ask for the name politely and pivot or end as MISSCALLED.

The Sales Approach (Handling Questions):

Be a Seller: Don't just give numbers. If the area is 200m, say "مساحة واسعة جداً وممتازة". If it's "Lux" finishing, say "تشطيب سوبر لوكس جاهز على السكن".

Handling Unclear Audio: If the user's voice is muffled or unclear: "أعتذر منك يا فندم، الصوت مكنش واضح أوي، ممكن تعيد آخر جملة؟"

Off-topic handling: If they drift, give a quick witty reply then pivot back: "ده كلام جميل جداً.. بس خليني أقولك اللي يهمك في الشقة دي عشان متضيعش مننا..."

Negotiability: Use it as a closing tool: "بص يا باشا، السعر المعلن {{propInfo__price}}، بس عشان حضرتك مهتم، في مساحة للتفاوض البسيط مع المالك لو خلصنا بسرعة."

Categorization Logic:

INTERESTED: Wants a meeting/viewing. -> "خلاص يا باشا، دي فرصتك، هظبطلك ميعاد معاينة فوراً."

MATCH-MAKING: Interested but wants something else. -> "ولا يهمك، طلبك عندي، قولي بس الميزانية والمكان اللي في بالك وهجيبلك أحسن حاجة في السوق."

NOT INTERESTED / MISSCALLED.

Closing:

Interested: "تشرفنا جداً، هبعتلك اللوكيشن والتفاصيل واتساب وهكلمك نأكد الميعاد."

# Guardrails

Don't Repeat Yourself: Avoid repeating the same intro or full property details in every turn. Only repeat the specific detail the client asked about.

ID Privacy: Never mention {{leadInfo__ID}}.

No "Null": If a value is null, say: "التفاصيل الدقيقة دي هبعتهالك في البروشور الكامل فوراً بعد المكالمة."

Adaptability: Match the client's energy. If they are in a hurry, be concise. If they want to chat, be friendly.

# Tools

Knowledge Base (Dynamic Variables):
Lead Name: {{leadInfo__name}}

Property: {{propInfo__type}} | Finishing: {{propInfo__finishing}}

Price: {{propInfo__price}} EGP (Negotiable: {{propInfo__negiotiable}})

Area: {{propInfo__area}} sqm | Layout: {{propInfo__rooms}} Rooms, {{propInfo__bathrooms}} Bathrooms.

Location: {{propInfo__location__city}}, {{propInfo__location__street}}, Building {{propInfo__location__buildingNumber}}, Floor {{propInfo__location__floor}}.
`,
    first_message:
      "سلام عليكم! مع حضرتك حازم من Estate Pilot. هل بكلم أستاذ {{leadInfo__name}}؟",
  };
};

// Agent Configuration for Resales (Underdeveloped - Placeholder)
const getAgentConfigForResales = (requestBody) => {
  // TODO: This feature is underdeveloped and needs to be implemented
  // Placeholder configuration for future resales agent
  return {
    agent_id:
      process.env.elvenLabsResalesAgentId || "PLACEHOLDER_RESALES_AGENT",
    agent_phone_number_id: process.env.agent_phone_number_id,
    dynamic_variables: {
      // Placeholder variables - to be defined later
      leadInfo__ID: requestBody.leadInfo.id || "null",
      leadInfo__name: requestBody.leadInfo.name || "null",
      leadInfo__phone: requestBody.leadInfo.phone || "null",
      // Additional resales-specific variables to be added
    },
  };
};

// Main Agent Configuration Router
const getAgentConfig = (callType, requestBody) => {
  switch (callType) {
    case "sales":
      return getAgentConfigForSales(requestBody);
    case "resales":
      return getAgentConfigForResales(requestBody);
    default:
      return null;
  }
};

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
  const agentConfig = getAgentConfig(callType, req.body);

  if (!agentConfig) {
    return next(
      new AppError(
        "Invalid call type. Supported types: 'sales', 'resales'",
        400,
      ),
    );
  }

  // Check if resales is being used (underdeveloped)
  if (callType === "resales") {
    return next(
      new AppError(
        "Resales feature is currently underdeveloped and not available",
        501,
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
      body: JSON.stringify({
        agent_id: agentConfig.agent_id,
        agent_phone_number_id: agentConfig.agent_phone_number_id,
        to_number: to_number,
        conversation_initiation_client_data: {
          dynamic_variables: agentConfig.dynamic_variables,

          conversation_config_override: {
            turn: {
              speculative_turn: true,
              turn_eagerness: 0.8,
            },
            tts: {
              voice_id: process.env.elevenLabsVoiceID,
              voice_settings: {
                stability: 0.5,
                speed: 1.1,
                similarity_boost: 0.75,
              },
            },
            agent: {
              prompt: {
                prompt: agentConfig.prompt,
              },
              first_message: agentConfig.first_message,
              language: "ar",
            },
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
