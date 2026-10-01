# Implementation Plan: Scrivener-style Corkboard & Grammarly-style AI Co-Writer Panel

An actionable, highly detailed blueprint to expand WriteAI Studio with powerful visual planning and real-time stylistic prose refinement tools, tailored strictly to the author's workflow.

---

## User Review & Critical Decisions

> [!IMPORTANT]
> The primary focus areas have been selected based on your direct preferences. We are proposing two core flagship features to elevate the manuscript workspace:

- **Confirmed Feature 1 (Scrivener Core)**: A virtual visual **Corkboard View** representing scene outline index cards, complete with color tags, status markers, and drag/button-based chronological reordering.
- **Confirmed Feature 2 (Grammarly/AI Core)**: A collapsible **Interactive Co-Writer & Stylistic Suggestions Panel** that highlights weak verbs, passive voice, wordiness, or dialogue clichés in real-time, offering instant, contextual inline replacements.

---

## 1. Overview & Core Concept

This update integrates the best organizational tools of **Scrivener** with the active prose refinement of **Grammarly** right into WriteAI Studio's unified full-stack React workspace.

### Key Value Additions:
1. **The Plotting Corkboard**: Authors can step back from the granular prose and view their book as a sequence of physical index cards pinned to a board. Reordering these cards dynamically syncs the master book/chapter order.
2. **Interactive Co-Writer Pane**: Rather than running slow manual prompts, a persistent, smart side panel highlights structural improvements (style, clarity, pacing, vocabulary) and lets the author preview and merge suggested changes instantly.

---

## 2. User Experience & Visual Design

### A. View 1: Scrivener-style Virtual Corkboard (Unified Grid / Board)
- **Visual Aesthetic**: A warm, textured canvas (tactile wooden desk theme in light mode; elegant slate mesh background in dark mode).
- **Index Cards**:
  - Each card represents a Scene in the active chapter or act.
  - Displays: Scene Title, Synopsis snippet, color status tag (e.g., *Idea* as blue, *First Draft* as amber, *Polished* as green), and current word count.
  - **Reordering Control**: Simple interactive arrow keys (`Move Left` / `Move Right`) or grab handles for visual re-sequencing.
  - **Double-click Action**: Instantly navigates to and opens that scene in the main rich text editor.

### B. View 2: Grammarly-style Interactive Co-Writer Side Panel (Right Dock)
- **Visual Aesthetic**: Collapsible right drawer alongside the AI Assistant and Split Reference panels.
- **Real-Time Highlights**:
  - Identifies styling alerts grouped by category:
    - **Clarity / Wordiness** (e.g., "in order to" -> "to")
    - **Strength / Passive Voice** (e.g., "was hit by" -> "struck")
    - **Pacing / Dialogue Cliché** (e.g., "screamed loudly" -> "screamed")
- **Inline Action Card**: Clicking an alert highlights the text in the editor, shows a brief explanation, and displays a purple **"Accept Suggestion"** button to replace the text in real-time.

```
┌────────────────────────────────────────────────────────────────────────┐
│                              TOP HEADER                                │
├───────────────┬──────────────────────────────────────┬─────────────────┤
│               │             CORKBOARD VIEW           │                 │
│  MANUSCRIPT   │ ┌──────────────┐ ┌──────────────┐    │  CO-WRITER PANE │
│  OUTLINE TREE │ │ Scene Card 1 │ │ Scene Card 2 │    │                 │
│               │ │ [Synopsis]   │ │ [Synopsis]   │    │ [Style Alert]   │
│  - Act I      │ │  Gr. Amber   │ │  Gr. Green   │    │  Wordy Phrase   │
│  - Chap 1     │ └──────────────┘ └──────────────┘    │  > "Accept"     │
│  - Chap 2     │ ┌──────────────┐                     │                 │
│               │ │ Scene Card 3 │                     │ [Tone Alert]    │
│               │ │ [Synopsis]   │                     │  Passive Voice  │
│               │ └──────────────┘                     │  > "Accept"     │
└───────────────┴──────────────────────────────────────┴─────────────────┘
```

---

## 3. Technical Architecture & Data Strategy

### System Component Diagram
```
┌────────────────────────────────────────────────────────────────────────┐
│                          React State & Context                         │
│            (currentProject, activeScene, activeView, settings)          │
└───────────────────┬──────────────────────────────────┬─────────────────┘
                    │                                  │
                    ▼                                  ▼
┌────────────────────────────────────────┐ ┌─────────────────────────────┐
│          Visual Corkboard View         │ │    Style Suggestions Pane   │
│ - Render scenes as cards inside grid   │ │ - POST /api/ai/prose-style  │
│ - Sync reordering back to project tree │ │ - Select suggestions        │
│ - Single-click synopsis quick edits    │ │ - Replace prose range       │
└────────────────────────────────────────┘ └─────────────────────────────┘
```

### Server API Route Implementation:
- **`POST /api/ai/prose-style`**:
  - Receives the scene's active prose.
  - Prompts Gemini to find stylistic suggestions (passive voice, wordy phrases, dialogue clichés).
  - Returns a clean JSON array of suggestions with target substrings, replacement options, and concise explanations:
  ```json
  {
    "suggestions": [
      {
        "originalText": "in order to find",
        "replacementText": "to find",
        "type": "clarity",
        "explanation": "Streamlines wordy prepositional phrases."
      }
    ]
  }
  ```

---

## 4. Execution Plan & Mileposts

### Milestone 1: Corkboard Board Interface & Chronology Reordering
- Create a dedicated canvas layout for `CorkboardView.tsx`.
- Connect the index card shifts back to the project structure so clicking cards opens the editor.

### Milestone 2: Style & Suggestions Parsing Route
- Create `/api/ai/prose-style` in `server.ts` utilizing low-temperature Gemini schemas.
- Implement rule-based fallback regex parsers for offline stability.

### Milestone 3: Real-Time Interactive Co-Writer Drawer
- Design the style drawer component displaying actionable suggestion cards with click-to-accept logic.
- Add real-time visual highlighting of suggestions directly in the main prose text area.
