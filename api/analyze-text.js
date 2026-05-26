const { analyzeManualText } = require("../lib/analyzer");
const { readJsonBody, sendError, sendJson, sendMethodNotAllowed } = require("../lib/http");

module.exports = async function handler(req, res) {
  if (req.method !== "POST") {
    sendMethodNotAllowed(res);
    return;
  }

  try {
    const body = await readJsonBody(req);
    const result = await analyzeManualText(body.transcript);
    sendJson(res, 200, result);
  } catch (error) {
    sendError(res, error);
  }
};
