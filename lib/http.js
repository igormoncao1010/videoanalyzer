async function readJsonBody(req) {
  if (req.body && typeof req.body === "object") return req.body;
  if (typeof req.body === "string") return JSON.parse(req.body || "{}");

  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  const raw = Buffer.concat(chunks).toString("utf8");
  return raw ? JSON.parse(raw) : {};
}

function sendJson(res, status, data) {
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.end(JSON.stringify(data));
}

function sendMethodNotAllowed(res) {
  sendJson(res, 405, { error: "Metodo nao permitido." });
}

function sendError(res, error) {
  sendJson(res, error.statusCode || 500, {
    error: error.message || "Nao foi possivel concluir a analise agora.",
  });
}

module.exports = {
  readJsonBody,
  sendError,
  sendJson,
  sendMethodNotAllowed,
};
