# Plottr-Style Multi-Plotline Timeline & Story Arc Matrix

A dedicated visual narrative matrix inspired by Plottr, Scrivener, and Dabble that plots multiple story threads (main plot, romantic subplots, mystery arcs, character journeys) horizontally across chapters and acts, featuring an instant side-by-side drawer for seamless cross-referencing between scene prose, character bibles, and world lore.

## User Review & Critical Decisions

> [!IMPORTANT]
> The following design decisions were confirmed during Phase 1 clarification:
> - **Core Feature Selection**: Plottr-style visual multi-plotline timeline and story arc matrix.
> - **Workspace Integration**: Dedicated top navigation tab (`Timeline` / `Story Arc Matrix`) alongside Dashboard, Manuscript, and Plot Board.
> - **Primary Workflow Benefit**: Seamless cross-referencing between scenes and notes, allowing authors to inspect connected character dossiers, scene text, and worldbuilding notes directly within the matrix without losing narrative context.

---

## 1. Overview & Core Concept

- **What It Does**: Renders a 2D interactive matrix where horizontal swimlanes represent distinct narrative threads (Main Plot, A-Plot, Romance Subplot, Antagonist Arc, etc.) and vertical columns represent book chapters or story beats. Authors can plot beat cards at intersections, track narrative tension (1–5 scale), and open any beat to inspect or edit linked manuscript scenes, character motivations, and location sensory details.
- **Target Audience / Persona**: Novelists, series writers, and narrative designers managing complex multi-POV stories and intertwining subplots who need visual clarity over pacing and causal threads.
- **Key Value**: Eliminates plot holes and forgotten subplot threads by providing bird's-eye pacing visibility, paired with instant 1-click cross-referencing to the manuscript editor.

---

## 2. User Experience & Visual Design

### Key User Flows
1. **Matrix Exploration**:
   - Access via the **Timeline** tab in the top navigation.
   - The matrix renders a clean, horizontal-scrolling board:
     - **Top Column Headers**: Chapters ordered by Act (e.g. Act I: Ch 1, Ch 2, Ch 3; Act II: Ch 4, Ch 5...) with chapter titles and scene counts.
     - **Left Row Headers**: Plotlines with color badges (Crimson, Sapphire, Emerald, Amber, Violet), thread category, and character anchors.
     - **Intersection Cells**: Interactive Beat Cards displaying beat title, synopsis, status, and narrative tension flames.
2. **Adding & Rearranging Story Beats**:
   - Hovering over an empty cell reveals a quick `+ Add Beat` button.
   - Authors can create or edit beats: title, summary, conflict/resolution, narrative tension rating (1–5), linked manuscript scene, and involved characters.
3. **Cross-Reference Inspector Drawer (Side-by-Side)**:
   - Clicking any beat card slides out an editorial inspection drawer on the right side:
     - **Tab 1: Beat Outline**: Title, summary, tension level, status.
     - **Tab 2: Linked Scene Prose**: Shows the actual draft text of the connected scene with word count and a "Jump to Editor" button that opens the scene directly in the Manuscript workspace.
     - **Tab 3: Character & World Dossier**: Pulls active character profiles (motivation, conflict, appearance) and location sensory details involved in this beat for instant reference while plotting.
4. **Plotline & Act Filtering**:
   - Filter matrix by specific plotlines (e.g. focus strictly on the "Murder Mystery" or "Romantic Subplot") or zoom by Act.

### Visual Identity & Theme
- **Color Discipline (60-30-10)**:
  - *Canvas*: 60% neutral background using theme variables (`bg-background` and `bg-card`).
  - *Structural Matrix*: 30% hairline dividers (`border-border/60`), muted sticky column/row headers (`bg-muted/40 backdrop-blur`).
  - *Accent Budget*: 10% concentrated on plotline color threads (crimson, cobalt, emerald, violet, amber) and active beat highlights.
- **Zero-Pill Metadata**:
  - Chapter labels and tension levels render with clean typographic separators (`·`), avoiding cluttered capsule badges.
- **Typography**:
  - Headers: Display font `font-sans font-semibold tracking-tight`.
  - Metrics & Numbers: Tabular numerals `font-mono tabular-nums`.

---

## 3. Key Product Decisions & Trade-Offs

- **Dedicated Tab vs. Sub-view in Plot Board**:
  - *Chosen Approach*: First-class navigation tab (`Timeline` / `Story Arc Matrix`) in `Header.tsx` and `MobileBottomNav.tsx`.
  - *Why*: The existing `Plot Board` is a status-oriented Kanban board (Idea -> Outlined -> Drafted -> Revised -> Done). A multi-plotline timeline matrix serves a completely different mental model (chronological plotting across narrative threads). Giving it a dedicated tab prevents UI cramming and honors the user's explicit preference.
  - *Alternatives Considered*: Tab toggle inside PlotBoard (would overwhelm the Kanban workflow).

- **Data Model Synchronization**:
  - *Chosen Approach*: First-class `plotlines` and `timelineBeats` in `Project` state, with automatic default seeding for projects without existing matrix data, and two-way linking to `project.books[].acts[].chapters[].scenes[]`.
  - *Why*: Ensures that changes to scenes in the manuscript editor reflect in the timeline matrix, and beats linked to scenes maintain real-time sync with local storage autosave.

- **Split-Drawer Architecture for Seamless Cross-Referencing**:
  - *Chosen Approach*: Collapsible side-by-side inspector drawer ($360\text{px}$–$420\text{px}$) that opens alongside the matrix without unloading the timeline canvas.
  - *Why*: Allows writers to read character backstory or scene prose while visually seeing how the beat fits into the surrounding chapters.

---

## 4. Technical Architecture & Data Strategy

### System Diagram

```
┌────────────────────────────────────────────────────────────────────────┐
│ App Component (State & Navigation)                                     │
│  - activeView: 'dashboard' | 'manuscript' | 'plotboard' | 'timeline'   │
│  - project: Project (persisted in storage with autosave)               │
│                                                                        │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │ TimelineMatrixView Component                                     │  │
│  │                                                                  │  │
│  │  ┌──────────────────────┐  ┌──────────────────────────────────┐  │  │
│  │  │ Top Action Bar       │  │ Filter & Plotline Controls       │  │  │
│  │  │ - Act Selector       │  │ - "+ New Plotline" modal         │  │  │
│  │  │ - Tension Curve View │  │ - Color thread selector          │  │  │
│  │  └──────────────────────┘  └──────────────────────────────────┘  │  │
│  │                                                                  │  │
│  │  ┌─────────────────────────────────────────────────────────────┐ │  │
│  │  │ Horizontal 2D Matrix (Sticky Headers)                       │ │  │
│  │  │  ┌───────────────┬──────────────┬──────────────┬──────────┐ │ │  │
│  │  │  │ Plotline / Ch │ Chapter 1    │ Chapter 2    │ Chapter 3│ │ │  │
│  │  │  ├───────────────┼──────────────┼──────────────┼──────────┤ │ │  │
│  │  │  │ Main Plotline │ [Beat Card]  │ [Beat Card]  │ [+ Beat] │ │ │  │
│  │  │  │ Romance Arc   │ [Beat Card]  │ [+ Beat]     │ [Beat]   │ │ │  │
│  │  │  │ Mystery B-Plot│ [+ Beat]     │ [Beat Card]  │ [Beat]   │ │ │  │
│  │  │  └───────────────┴──────────────┴──────────────┴──────────┘ │ │  │
│  │  └─────────────────────────────────────────────────────────────┘ │  │
│  │                                                                  │  │
│  │  ┌─────────────────────────────────────────────────────────────┐ │  │
│  │  │ Cross-Reference Inspector Drawer (Slide-out)                │ │  │
│  │  │  - Beat Details & Narrative Tension Slider (1-5)            │ │  │
│  │  │  - Linked Scene Preview (Prose text, word count, edit link) │ │  │
│  │  │  - Linked Character Dossier (Goals, conflict, traits)       │ │  │
│  │  │  - Location Sensory Details                                 │ │  │
│  │  └─────────────────────────────────────────────────────────────┘ │  │
│  └──────────────────────────────────────────────────────────────────┘  │
└────────────────────────────────────────────────────────────────────────┘
```

### Data Model Additions
```typescript
export interface Plotline {
  id: string;
  title: string;
  description?: string;
  color: string;
  category: 'Main Plot' | 'Subplot' | 'Character Arc' | 'Theme' | 'World Event';
  characterId?: string;
}

export interface TimelineBeat {
  id: string;
  plotlineId: string;
  chapterId: string;
  title: string;
  summary: string;
  tensionLevel: number; // 1 to 5
  sceneId?: string;
  characterIds?: string[];
  locationId?: string;
  notes?: string;
  status: 'Idea' | 'Outlined' | 'Drafted' | 'Revised';
}
```
