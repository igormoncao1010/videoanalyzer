const HF_CHAT_URL = "https://router.huggingface.co/v1/chat/completions";
const DEFAULT_HF_MODEL = "openai/gpt-oss-120b";
const DEFAULT_HF_ASR_MODEL = "openai/whisper-large-v3-turbo";

function compactTranscript(transcript, maxChars = 12000) {
  const text = String(transcript || "").replace(/\s+/g, " ").trim();
  if (text.length <= maxChars) return text;
  return `${text.slice(0, maxChars)}\n\n[transcricao cortada por limite de tamanho]`;
}

function extractJson(text) {
  const source = String(text || "").trim();
  const start = source.indexOf("{");
  const end = source.lastIndexOf("}");
  if (start === -1 || end === -1 || end <= start) return null;
  return JSON.parse(source.slice(start, end + 1));
}

function normalizeHuggingFaceAnalysis(value) {
  return {
    summary: String(value.summary || "").trim(),
    suggestedAgeRating: String(value.suggestedAgeRating || "").trim(),
    topics: Array.isArray(value.topics) ? value.topics.map(String).slice(0, 8) : [],
    reasons: Array.isArray(value.reasons) ? value.reasons.map(String).slice(0, 8) : [],
    sensitiveContent: Array.isArray(value.sensitiveContent) ? value.sensitiveContent.map(String).slice(0, 8) : [],
  };
}

async function analyzeTranscriptWithHuggingFace(transcript) {
  const token = process.env.HF_TOKEN;
  if (!token) return null;

  const model = process.env.HF_TEXT_MODEL || DEFAULT_HF_MODEL;
  const prompt = `Analise a transcricao abaixo em portugues do Brasil e responda somente JSON valido.

Schema:
{
  "summary": "resumo curto do video",
  "suggestedAgeRating": "Livre | 10+ | 12+ | 14+ | 16+ | 18+",
  "topics": ["temas principais"],
  "reasons": ["motivos da classificacao"],
  "sensitiveContent": ["linguagem forte, violencia, sexo, drogas, medo, discurso de odio, ou nenhum"]
}

Transcricao:
${compactTranscript(transcript)}`;

  const response = await fetch(HF_CHAT_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      messages: [
        {
          role: "system",
          content:
            "Voce classifica conteudo audiovisual para orientar pais e criadores. Seja conservador, objetivo e responda apenas JSON valido.",
        },
        { role: "user", content: prompt },
      ],
      temperature: 0.2,
      max_tokens: 700,
      stream: false,
    }),
  });

  if (!response.ok) {
    const detail = await response.text();
    throw new Error(`Hugging Face respondeu com status ${response.status}: ${detail.slice(0, 180)}`);
  }

  const data = await response.json();
  const content = data.choices?.[0]?.message?.content || data.choices?.[0]?.text || "";
  const parsed = extractJson(content);
  if (!parsed) throw new Error("Hugging Face nao retornou JSON valido.");

  return {
    provider: "huggingface",
    model,
    ...normalizeHuggingFaceAnalysis(parsed),
  };
}

async function transcribeAudioWithHuggingFace(audioBuffer, contentType = "audio/webm") {
  const token = process.env.HF_TOKEN;
  if (!token) {
    const error = new Error("Configure HF_TOKEN na Vercel para transcrever videos sem legenda.");
    error.statusCode = 400;
    throw error;
  }

  const model = process.env.HF_ASR_MODEL || DEFAULT_HF_ASR_MODEL;
  const response = await fetch(`https://api-inference.huggingface.co/models/${model}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": contentType,
    },
    body: audioBuffer,
  });

  if (!response.ok) {
    const detail = await response.text();
    throw new Error(`Hugging Face ASR respondeu com status ${response.status}: ${detail.slice(0, 180)}`);
  }

  const data = await response.json();
  const text = data.text || data.transcription || data[0]?.text || "";
  if (!text.trim()) throw new Error("Hugging Face nao conseguiu transcrever o audio.");

  return {
    provider: "huggingface",
    model,
    text: text.trim(),
  };
}

module.exports = {
  analyzeTranscriptWithHuggingFace,
  transcribeAudioWithHuggingFace,
};
