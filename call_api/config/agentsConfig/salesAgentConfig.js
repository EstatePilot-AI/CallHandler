// Agent Configuration for Sales
const getAgentConfigForSales = (requestBody) => {
  const salesAgentPrompt =
    process.env.SALES_AGENT_PROMPT ||
    "You are Hazem from Estate Pilot. Qualify the lead, keep responses concise, and stay focused on property sales using provided dynamic variables only.";

  return {
    dynamic_variables: {
      leadInfo__ID: requestBody.leadInfo.id || "null",
      leadInfo__callType: requestBody.callType || "null",
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
    prompt: salesAgentPrompt,
    first_message:
      "سلام عليكم! مع حضرتك حازم من Estate Pilot. هل بكلم أستاذ {{leadInfo__name}}؟",
  };
};

module.exports = getAgentConfigForSales;
