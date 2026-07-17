# mailr — AI HTML Email Template Generator

Upload a reference screenshot + a content JSON file, describe any extra
instructions, and Gemini generates a production-ready, table-based, inline-CSS
HTML email that matches the reference layout and uses your real content.

## Stack

- **Vite + React 19**
- **Tailwind CSS v4** (CSS-first `@theme` tokens, no config file needed)
- **Zustand** for app state
- **@google/genai** — official Gemini SDK, used directly from the browser
- **lucide-react** for icons

## How it works

Generation runs as a two-stage Gemini pipeline (`src/services/geminiService.js`):

1. **Design analysis (vision).** The screenshot is sent to Gemini
   (`analyzeScreenshot`) with a structured `responseSchema`, and comes back as
   a design-token JSON: ordered layout blocks, color palette, typography, and
   spacing — a blueprint of the reference design, independent of copy.
2. **HTML generation (text).** That blueprint is merged with your content
   JSON and any free-text instructions (`generateEmailHtml`) into one prompt
   that compiles a self-contained HTML document: 600px, table-based, fully
   inline CSS, Outlook-safe conditional comments, bulletproof buttons.

Both prompts live in `src/services/promptTemplates.js` — tune them there if
you want stricter brand rules, different fallback fonts, etc.

## Setup

```bash
npm install
cp .env.example .env
```

Add your Gemini API key to `.env` (get one at
https://aistudio.google.com/apikey):

```
VITE_GEMINI_API_KEY=your_key_here
```

Then:

```bash
npm run dev
```

> **Note on the API key:** this key is used directly in the browser (`import.meta.env.VITE_GEMINI_API_KEY`), which is fine for a local/internal tool but means the key is visible in the built bundle. For anything shipped to end users, proxy the Gemini calls through a small backend instead so the key never reaches the client.

## Using it

1. Click **Screenshot** and upload an image of the email design you want to
   replicate.
2. Click **Content JSON** and upload your real content (see
   `sample-data/example-content.json` for the expected shape — headline,
   body copy, CTA, footer, image URLs, brand colors, etc.). Any shape works;
   Gemini adapts to whatever fields you provide.
3. Optionally type extra instructions in the composer (tone, a section to
   drop, a color override, "make the CTA red", etc).
4. Hit send. The main panel shows **Preview** (rendered in a sandboxed
   iframe) and **Code** (raw HTML) tabs, plus **Copy** and **Download**.
5. Every generated template is auto-saved to the **Select Template** dropdown
   in the header (stored in `localStorage`) so you can revisit past runs.

## Project structure

```
src/
  components/       Header, Composer, EmptyState, LoadingState, ResultView
  services/         geminiService.js, promptTemplates.js
  store/            useEmailStore.js (Zustand)
  utils/            fileHelpers.js (base64, JSON parsing, download, copy)
```

## Customizing the email output rules

The hard requirements Gemini must follow (600px width, table layout, inline
CSS, bulletproof buttons, MSO conditional comments, etc.) are spelled out
explicitly in `buildHtmlGenerationPrompt` inside
`src/services/promptTemplates.js`. Edit that list directly if your target ESP
needs different conventions (e.g. stricter Gmail clipping limits, dark-mode
meta tags, AMP for Email).
