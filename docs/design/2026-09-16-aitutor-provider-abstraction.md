# AiTutor provider abstraction — design note (plan only)

**Status:** proposal, 2026-09-16. No code changes until the owner approves.
**Scope:** `src/shared/components/common/AiTutor.tsx` and one new module under
`src/shared/tutor/`. Nothing else in the app touches an AI provider.

## 1. Today

- The tutor is hard-wired to Google Gemini through `@google/generative-ai`
  (`^0.24.1` in `package.json`), model `gemini-2.0-flash`, with the Socratic
  `SYSTEM_INSTRUCTION` passed as `systemInstruction` and a `startChat()`
  session held in a ref (`AiTutor.tsx:197-201`).
- The student enters their own Gemini key; it is stored in `localStorage`
  under `emac_gemini_api_key` and cleared by the header key button.
- Calls go browser → Google directly. There is no backend, so every student
  prompt leaves the browser to Google's API regardless of where the site is
  hosted (see the hosting memo under `docs/hosting/` once written).
- Offline is detected with `useOnlineStatus`; errors collapse to one generic
  "check your API key" message; responses are non-streaming and rendered
  through `parseLatex` + `MathWrapper`.

### Finding: the current SDK is deprecated

`@google/generative-ai` is the deprecated Gemini SDK. Its repository
(`google-gemini/deprecated-generative-ai-js`) states that all support,
including critical bug fixes, ended 2025-11-30, and points to the unified
`@google/genai` SDK (`googleapis/js-genai`). Any provider work should migrate
Gemini first; keeping the dead SDK as the default is not an option.

## 2. Goals and non-goals

Goals

1. One `TutorProvider` interface so the component never imports a vendor SDK.
2. Three providers behind it: Gemini (default, migrated to `@google/genai`),
   Anthropic Claude (student-entered key), and a LUT-hosted or open-weight
   endpoint (institutional, details to confirm).
3. Same Socratic system prompt, same UI, same LaTeX rendering for all three.
4. Per-provider key storage, never bundled keys, never a shared proxy secret.
5. Streaming responses, because Claude and open-weight endpoints can take
   several seconds per turn and the current "loading dots" hide that.

Non-goals: a backend proxy, accounts, server-side logging, any change to the
predict-first sections, any change to the curriculum spine.

## 3. Interface

```ts
// src/shared/tutor/provider.ts
export type TutorRole = 'user' | 'assistant';
export interface TutorTurn { role: TutorRole; content: string }

export interface TutorProvider {
  readonly id: 'gemini' | 'anthropic' | 'lut';
  readonly label: string;                 // shown in the key prompt
  readonly needsKey: boolean;             // LUT endpoint may use none
  /** Streams assistant text for the next turn; resolves with the full text. */
  send(history: TutorTurn[], userMessage: string,
       onDelta: (chunk: string) => void, signal?: AbortSignal): Promise<string>;
}

export interface TutorProviderFactory {
  create(opts: { apiKey?: string; systemPrompt: string }): TutorProvider;
}
```

The component keeps `messages: TutorTurn[]` as today and passes the history
on every call. Providers own their session objects internally (Gemini's chat
session, Anthropic's message array); the component never sees vendor types.

Key storage becomes `emac_tutor_key:<providerId>` plus `emac_tutor_provider`
for the last choice. A one-time migration reads `emac_gemini_api_key` into
`emac_tutor_key:gemini` and deletes the old entry.

## 4. Providers

### 4.1 Gemini (default)

- Migrate to `@google/genai`. Same student-key model. Model string stays a
  single constant so it can move off `gemini-2.0-flash` in one place.
- Streaming: the unified SDK exposes a streaming chat call; wire it to
  `onDelta`. Verify the exact method name against the SDK docs at
  implementation time, not from memory.

### 4.2 Anthropic Claude (second provider)

Facts verified 2026-09-16 from the SDK repository and its `client.ts`:

- `@anthropic-ai/sdk` refuses to run in a browser unless the client is built
  with `dangerouslyAllowBrowser: true`. When that option is set, the SDK adds
  the request header `anthropic-dangerous-direct-browser-access: true`, which
  is what the API's CORS policy requires for direct browser calls.
- This is the same trust model as today's Gemini key: the key is the
  student's own, lives only in their `localStorage`, and is sent only to the
  vendor. The "dangerous" wording is about bundling a shared key, which we
  never do. The key prompt must say this in plain words.

Request shape (verify against the `claude-api` skill when implementing):

```ts
const client = new Anthropic({ apiKey, dangerouslyAllowBrowser: true });
const stream = client.messages.stream({
  model: 'claude-opus-5',            // default per the claude-api skill
  max_tokens: 1024,                  // tutor replies are 3-5 sentences by rule
  system: SYSTEM_INSTRUCTION,
  thinking: { type: 'adaptive' },
  output_config: { effort: 'low' },  // chat tutor: low effort is the right tier
  messages: history.map(t => ({ role: t.role, content: t.content }))
            .concat({ role: 'user', content: userMessage }),
});
stream.on('text', onDelta);
const final = await stream.finalMessage();
```

Handle `stop_reason === 'refusal'` with a tutor-voice message rather than the
generic error. Catch the SDK's typed errors (`AuthenticationError`,
`RateLimitError`, `APIError`) so a bad key and a rate limit read differently.
Fable-tier models are not the default here: a Socratic chat tutor does not
need them, and their pricing exceeds Opus-tier.

### 4.3 LUT-hosted or open-weight endpoint (third provider)

Owner confirmed on 2026-09-16 that a LUT-hosted or open-weight model is in
scope. Details are unknown, so the adapter is designed against the common
shape such servers expose (vLLM, Ollama, LiteLLM all serve an
OpenAI-compatible `POST /v1/chat/completions` with `stream: true` SSE):

- Plain `fetch`, no vendor SDK; base URL and model name from a small config
  object, not hard-coded.
- Auth: bearer token if the server requires one, else `needsKey: false`.
- CORS: the LUT server must allow the site's origin. If it does not, this
  provider cannot work from a static site without a proxy, which is a
  non-goal. This is the first question to ask LUT IT.
- Residency: this is the only provider where student prompts stay inside
  LUT. It should become the default the day it is available.

Open questions for the owner: endpoint URL, auth model, allowed origins,
model name, and whether LUT IT wants request logging on their side.

## 5. UI changes

- `ApiKeyPrompt` gains a provider selector (three radio cards) and per-provider
  copy: Gemini and Anthropic show "your own key, stored only in this browser";
  LUT shows "institutional, no key" when `needsKey` is false.
- The header key button becomes "Change provider or key".
- Streaming text renders progressively; `parseLatex` runs on the final text
  only, to avoid half-delimited `$` while streaming.
- Offline behaviour unchanged.

## 6. Tests

- Unit (vitest): one test file per adapter with the network mocked; assert
  the request body carries the system prompt and full history, that
  `onDelta` receives chunks in order, and that errors map to the three
  distinct messages (bad key, rate limit, refusal or server error).
- Unit: key migration from `emac_gemini_api_key`.
- Guard: a repo-wide test that no file outside `src/shared/tutor/` imports
  `@google/genai` or `@anthropic-ai/sdk`.
- E2E (Playwright): the tutor panel with a stubbed provider injected through a
  test-only route, covering select provider → enter key → send → streamed
  reply rendered with LaTeX. No real network in e2e.

## 7. Gate impact

- `npm run build`: two new dependencies (`@google/genai`, `@anthropic-ai/sdk`)
  and one removed (`@google/generative-ai`). Check the chunk report; the
  tutor is already lazy-mounted, so the SDKs should land in its chunk only.
- `npm run lint`: new files follow the flat config; no rule changes expected.
- Unit and e2e as in section 6. `MIN_CANVAS_*` and `DPR_MIGRATED` tables are
  untouched (no sim changes).
- PWA: no change to precache scope; the tutor already requires network.

## 8. Rollout

1. PR 1: interface + Gemini migrated to `@google/genai` + key migration +
   streaming + tests. Behaviour-preserving for students.
2. PR 2: Anthropic adapter + provider selector.
3. PR 3: LUT adapter, once endpoint details are known.

Each PR runs all four gates; CI is the arbiter.

## 9. Data-residency note

With any browser-direct provider, student prompts leave the browser to that
vendor. Hosting the site elsewhere does not change this. The hosting
evaluation under `docs/hosting/` should treat the tutor's data flow as its
own finding; the LUT endpoint in 4.3 is the only design that keeps prompts
inside the institution.
