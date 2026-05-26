# Analisador de videos do YouTube

MVP local para colar um link do YouTube, buscar legendas publicas/automaticas, transcrever e classificar o conteudo por regras simples. Tambem inclui analise de transcricao colada manualmente.

## Como rodar

Use Node.js 18+:

```powershell
node server.js
```

Depois abra:

```text
http://localhost:5173
```

## Limites desta primeira versao

- Funciona quando o video tem legendas publicas acessiveis pelo YouTube.
- A analise manual de texto funciona mesmo sem acesso ao YouTube.
- Ainda nao baixa audio nem faz speech-to-text quando nao ha legenda.
- A classificacao e uma sugestao automatica baseada em palavras-chave, nao uma classificacao indicativa oficial.
- O proximo passo natural e conectar uma API de transcricao para videos sem legenda.

## Deploy com GitHub e Vercel

1. Crie um repositorio no GitHub e envie estes arquivos.
2. Entre na Vercel e escolha `Add New Project`.
3. Importe o repositorio do GitHub.
4. Mantenha as configuracoes padrao. Nao precisa de build command.
5. Em `Settings > Environment Variables`, adicione `HF_TOKEN`.
6. Clique em `Deploy`.

A Vercel vai publicar os arquivos de `public/` como site estatico e as rotas em `api/` como funcoes serverless:

- `/api/analyze`
- `/api/analyze-text`

Variaveis opcionais:

- `HF_TOKEN`: token do Hugging Face com permissao de Inference Providers.
- `HF_TEXT_MODEL`: modelo usado na analise de texto. Padrao: `openai/gpt-oss-120b`.
- `HF_ASR_MODEL`: modelo usado para transcrever audio quando o video nao tem legenda. Padrao: `openai/whisper-large-v3-turbo`.
- `MAX_AUDIO_BYTES`: limite de audio baixado antes de enviar ao Hugging Face. Padrao: `18874368`.

Observacao: a rota do YouTube tenta usar legendas publicas primeiro. Se nao houver legenda, ela baixa o audio e envia para o Hugging Face transcrever. Se o YouTube bloquear o download do audio, se o video for grande demais, ou se `HF_TOKEN` nao estiver configurado, o fallback de transcricao manual continua funcionando.
