<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

## Architecture
- Chats and settings live in browser localStorage via `src/lib/store.ts` (useSyncExternalStore); no backend database yet, so the user can add Cloud later without UI changes.
- Model calls go only through `sendChat` in `src/lib/chat.functions.ts`, an OpenAI-compatible call driven by server secrets (`AI_API_KEY`, `GOOGLE_API_KEY`, `AI_BASE_URL`, `AI_MODEL`, `SEARCH_API_KEY`); `GROQ_API_KEY` (Groq, openai/gpt-oss-120b) takes priority over `GOOGLE_API_KEY`, which falls back to Gemini's OpenAI-compatible endpoint with `gemini-2.5-flash` unless `AI_API_KEY`/`AI_BASE_URL`/`AI_MODEL` are set; without any key it returns demo replies so the UI always works.
- Charts and checklists are fenced Markdown blocks (`chart` JSON, `tasks` lines) rendered by `src/components/chat/markdown.tsx`, so any provider can produce them.
- Agent-to-GitHub-project links and honest integration statuses live in `src/lib/agent-integrations.ts`; repos are separate backend services, never frontend dependencies, so statuses change only after a real connection is verified.
- Projects are stored with chats in the same localStorage store; picked folders are read in the browser (text files only, ignore rules and size caps in `src/lib/project-files.ts`, `.env` never read) and passed to `sendChat` as `projectContext`, so no file upload or backend is needed.
