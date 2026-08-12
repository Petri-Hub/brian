# Brian

Bot de Telegram que extrai áudio de vídeos. Você manda um link ou pede pelo
nome; ele busca, você escolhe, confirma, e o áudio volta como mensagem de áudio
tocável.

## Testar local

**Precisa de ngrok.** O `chatSdkChannel` do eve é webhook puro: ele monta as
rotas `GET/POST /eve/v1/telegram` e nunca chama o `startPolling()` do adapter. O
adapter até tem long-polling, mas ninguém dirige o loop, então nada chega sem
túnel.

### 1. Preencher o `.env.local`

Falta só uma variável:

```bash
AUDIO_ALLOWED_HOSTS=youtube.com, youtu.be
```

Enquanto estiver vazia o bot recusa toda URL — é intencional. Um domínio já cobre
os subdomínios, e os CDNs de mídia entram sozinhos (mapa em `agent/lib/sources.ts`).

### 2. Docker ligado

O sandbox usa `defaultBackend()`: fora da Vercel ele escolhe Docker se o daemon
estiver de pé. É onde o yt-dlp roda.

```bash
docker info > /dev/null && echo ok
```

Sem Docker, o eve cai pro just-bash, que não tem binários reais — o yt-dlp não
roda lá e o `fetch_audio` falha.

### 3. Subir

```bash
npm run dev
```

### 4. Expor com ngrok

O eve entrega mensagens do Telegram só por webhook — o `chatSdkChannel` monta as
rotas e nunca dirige o long-polling do adapter. Então o dev precisa de túnel:

```bash
tmux new-session -d -s brian-ngrok "ngrok http 2000 --log stdout"
```

Em tmux porque o túnel precisa sobreviver ao terminal que o iniciou. Para ver o
que ele está fazendo, `tmux attach -t brian-ngrok` (saia com `Ctrl+B` depois `D`);
para derrubar, `tmux kill-session -t brian-ngrok`.

Pegue a URL https do ngrok e registre no Telegram:

```bash
source .env.local
curl -X POST "https://api.telegram.org/bot$TELEGRAM_BOT_TOKEN/setWebhook" \
  -d "url=https://SUA-URL.ngrok-free.dev/eve/v1/telegram" \
  -d "secret_token=$TELEGRAM_WEBHOOK_SECRET_TOKEN" \
  -d "drop_pending_updates=true"
```

A URL do ngrok muda a cada restart no plano free, então esse `setWebhook` se
repete sempre que você reabrir o túnel.

Sobe o servidor e o REPL do eve. O bot entra em polling junto: mande mensagem
pro `@brian_veloz_bot` no Telegram e acompanhe os logs no terminal.

Para rodar sem a TUI (útil pra deixar em background):

```bash
npm exec -- eve dev --no-ui
```

### O que testar, nesta ordem

1. **Texto solto** (`oi`) — confirma modelo, credencial e o caminho do Telegram.
2. **Busca** (`toca bicycle race do queen`) — confirma o `search_videos` e que a
   lista volta numerada.
3. **Escolha** (`o primeiro`) — deve aparecer um card de aprovação com botões.
4. **Confirmar** — é aqui que o yt-dlp roda de verdade. Primeira execução baixa o
   binário no sandbox, então demora mais.
5. **Verificar a entrega** — tem que chegar como player com barra de progresso,
   não como arquivo anexado. Se vier como documento, o `type: "audio"` do
   attachment se perdeu.

## Deploy

```bash
vercel link
npm exec -- eve deploy
```

Depois registre o webhook (o eve não chama `setWebhook` sozinho):

```bash
source .env.local
curl -X POST "https://api.telegram.org/bot$TELEGRAM_BOT_TOKEN/setWebhook" \
  -d "url=https://SEU-DEPLOY.vercel.app/eve/v1/telegram" \
  -d "secret_token=$TELEGRAM_WEBHOOK_SECRET_TOKEN"
```

Copie as variáveis do `.env.local` para o ambiente do projeto na Vercel. Em
produção o adapter entra em modo webhook sozinho (`process.env.VERCEL`), e o
`TELEGRAM_MODE=polling` do `.env.local` não vai junto.

## Diferenças entre local e produção

| | Local | Vercel |
|---|---|---|
| Telegram | webhook via ngrok | webhook no domínio do deploy |
| Sandbox | Docker | Vercel Sandbox |
| Egress | sem restrição | allowlist de domínios |
| Estado do chat | memória (perde no restart) | trocar por Redis antes de valer |

O item que mais engana é o egress: o yt-dlp roda no **seu** IP local e no IP de
datacenter na Vercel. O YouTube trata os dois de forma diferente, e um bot-check
que nunca aparece aqui pode aparecer lá. Funcionar local não prova produção.

## Pendências conhecidas

- `createMemoryState()` perde assinaturas de thread no restart. Trocar por um
  state adapter durável antes de considerar isso pronto.
- Nada limpa os downloads do `/workspace`. O sandbox é por sessão, então some
  junto, mas sessões longas acumulam.
- `fetch_audio` re-baixa se o step for repetido pelo runtime. Inofensivo, gasta
  banda.
