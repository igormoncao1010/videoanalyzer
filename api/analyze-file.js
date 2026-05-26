const { analyzeUploadedAudio } = require("../lib/analyzer");
const { readBufferBody, sendError, sendJson, sendMethodNotAllowed } = require("../lib/http");

module.exports = async function handler(req, res) {
  if (req.method !== "POST") {
    sendMethodNotAllowed(res);
    return;
  }

  try {
    const contentType = req.headers["content-type"] || "application/octet-stream";
    const buffer = await readBufferBody(req);
    const result = await analyzeUploadedAudio(buffer, contentType);
    sendJson(res, 200, result);
  } catch (error) {
    sendError(res, error);
  }
};
