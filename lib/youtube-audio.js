const MAX_AUDIO_BYTES = Number(process.env.MAX_AUDIO_BYTES || 18 * 1024 * 1024);

async function downloadYoutubeAudio(videoId) {
  let ytdl;
  try {
    ytdl = require("@distube/ytdl-core");
  } catch {
    const error = new Error("Dependencia @distube/ytdl-core nao instalada. Faça redeploy na Vercel apos atualizar o package.json.");
    error.statusCode = 500;
    throw error;
  }

  const url = `https://www.youtube.com/watch?v=${videoId}`;
  const stream = ytdl(url, {
    filter: "audioonly",
    quality: "lowestaudio",
    highWaterMark: 1 << 25,
  });

  const chunks = [];
  let total = 0;
  let contentType = "audio/webm";

  return await new Promise((resolve, reject) => {
    stream.on("response", (response) => {
      contentType = response.headers["content-type"] || contentType;
    });

    stream.on("data", (chunk) => {
      total += chunk.length;
      if (total > MAX_AUDIO_BYTES) {
        stream.destroy(
          new Error("O audio ficou grande demais para esta versao. Teste com um video mais curto ou aumente MAX_AUDIO_BYTES.")
        );
        return;
      }
      chunks.push(chunk);
    });

    stream.on("end", () => {
      resolve({
        buffer: Buffer.concat(chunks),
        contentType,
      });
    });

    stream.on("error", reject);
  });
}

module.exports = {
  downloadYoutubeAudio,
};
