# WriteAI

WriteAI is a writing and story-planning studio for novelists and other fiction writers. It combines a multi-project manuscript workspace with planning boards, character and location references, writing-progress tracking, manuscript analysis, and optional Google Gemini assistance.

## Features

### Projects and manuscript organization

- Create and manage multiple writing projects, including novels, series, novellas, and short stories.
- Store project metadata such as title, subtitle, author, genre, point of view, synopsis, target word count, daily goal, and deadline.
- Organize a manuscript into books, acts, chapters, and scenes; create, rename, reorder, and remove outline items.
- Track scene status, synopsis, point-of-view character, location, notes, target words, and word count.
- Start with an example project to explore the workspace.

### Writing workspace

- Write and edit scene prose in a manuscript editor with Markdown-style formatting controls for headings, emphasis, lists, blockquotes, and scene breaks.
- View scene, chapter, book, and daily word-count progress while writing.
- Use undo/redo, in-scene find and replace, and distraction-free focus mode.
- Adjust editor font family, font size, and application theme (dark, light, or sepia); configure spellcheck and the daily word goal.
- Save scene snapshots, add revision comments to selected text, and review or restore previous versions.
- Open a reader preview and a split reference panel while drafting.
- Switch between the manuscript editor and a visual scene corkboard.

### Story planning and reference

- **Dashboard:** Review project progress, activity heatmap, plot timeline, and core cast at a glance; switch between projects and create or delete projects.
- **Plot board:** Create and organize plot beats by act, with summaries, tags, status, and links to related characters, locations, and scenes.
- **AI outline generator:** Generate story beats using a three-act structure, Hero's Journey, mystery/thriller beats, Save the Cat, or a character-driven arc. Copy the result, apply it to the plot board, or sync it with manuscript chapters.
- **Character bible:** Maintain character roles, archetypes, appearance, traits, motivations, conflicts, backstory, goals, personality tags, images, and relationships.
- **Locations index:** Document settings, sensory details, lore, and notes; search the location list.
- **Global search:** Search across scenes, characters, locations, and plot beats, then navigate to matching project content.
- **Schedule and velocity:** Track daily writing, goals, streaks, manuscript progress, and projected completion; log a manual writing session.

### Editing and analysis tools

- **AI Co-Author:** Ask Gemini to proofread, tighten prose, adjust tone, continue or expand a scene, summarize, write dialogue, check for plot holes, build the world, suggest titles, or follow a custom instruction. Apply output by replacing or inserting prose.
- **Interactive style critique:** Analyze prose for wordiness, passive voice, weak verbs, and clichés, and review or dismiss suggestions.
- **Readability inspector:** Review readability and flagged prose, inspect sentence-level suggestions, and apply rule-based or AI-assisted sentence simplifications.
- **Smart paragraphing:** Request pacing-oriented paragraph breaks and compare the proposed layout with the original text.
- Configure and test a Gemini API key, choose a listed model, or enter a custom model name. AI features require a working API key and a reachable API server.

### Export

- Export a formatted PDF for the whole project or a selected book, with options for paper size, font, title page, table of contents, synopsis, page numbers, and running headers.
- Export the manuscript as standalone HTML, EPUB, or an ODT-named document.
- Download a JSON project backup.

### Keyboard shortcuts and mobile

- Browse and search the keyboard-shortcut reference (`Ctrl+/` or `Cmd+/`).
- Common shortcuts include focus mode (`Ctrl/Cmd+F`), global project search (`Ctrl/Cmd+P`), AI panel (`Ctrl/Cmd+K`), split reference (`Ctrl/Cmd+\\`), and save status (`Ctrl/Cmd+S`).
- Responsive layout includes mobile navigation. The project includes a Capacitor Android wrapper.

## Getting started

### Requirements

- Node.js and npm
- A Google Gemini API key to use Gemini-backed features (or configure a server-side `GEMINI_API_KEY`)

### Install and run locally

```bash
npm install
npm run dev
```

The development server starts the Express API and Vite middleware together. By default it listens on port `3000`; set `PORT` to use a different port. Open the URL printed by the server.

To create a production frontend bundle and serve it with Express:

```bash
npm run build
NODE_ENV=production npm start
```

The production server serves the built `dist/` application and the AI API from the same origin.

### Configuration

Copy `.env.example` to `.env` when configuring environment variables:

| Variable | Purpose |
| --- | --- |
| `GEMINI_API_KEY` | Optional server-side Gemini key. A key entered in the app's Settings takes precedence for that request. |
| `PORT` | Express server port; defaults to `3000`. |
| `CORS_ORIGINS` | Comma-separated list of origins permitted to call the API. `http://localhost` and `https://localhost` are allowed by default for the Capacitor app. |
| `VITE_API_BASE_URL` | API server base URL for a separately hosted client, especially a native build. Set this to the publicly reachable HTTPS API URL before building the APK. Leave unset for the same-origin web app. |

Do not commit `.env` files or API keys. `.env.example` is provided as a template.

### Android

The repository includes a Capacitor Android project. Configure `VITE_API_BASE_URL` for the deployed API before building a native package so the app can reach the Express AI endpoints. After building the web assets, sync the Capacitor project:

```bash
npm run build
npx cap sync android
```

Open `android/` in Android Studio to build or run the native app.

## Available scripts

| Command | Description |
| --- | --- |
| `npm run dev` | Start Express with Vite development middleware. |
| `npm run build` | Build the frontend into `dist/`. |
| `npm start` | Start the Express server (set `NODE_ENV=production` to serve the production bundle). |
| `npm run preview` | Run Vite's static build preview. |
| `npm run lint` | Run the TypeScript compiler in no-emit checking mode. |

## AI API

The Express server provides these endpoints:

| Endpoint | Function |
| --- | --- |
| `POST /api/ai/test-key` | Check Gemini API connectivity and model access. |
| `POST /api/ai/action` | Run the selected writing-assistant action. |
| `POST /api/ai/generate-character` | Generate a character profile from the supplied genre, role, concept, and aesthetic preferences. |
| `POST /api/ai/outline` | Generate a story outline. |
| `POST /api/ai/simplify-sentence` | Return sentence-simplification options. |
| `POST /api/ai/smart-paragraph` | Suggest paragraph breaks while preserving wording. |
| `POST /api/ai/prose-style` | Return prose-style critique suggestions. |

The server allows JSON request bodies up to 10 MB. AI requests use the configured user key or fall back to `GEMINI_API_KEY`.

## Data and privacy

Projects, settings, and writing statistics are stored in the browser's local storage on the current device and browser profile. They are not synchronized between devices. Download a JSON backup to keep a separate copy. Gemini-backed requests send the relevant prompt and project context to the configured AI API.

## Technology

React, TypeScript, Vite, Tailwind CSS, Express, Google GenAI SDK, jsPDF, D3, and Capacitor.
