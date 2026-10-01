export type POVType = 'First Person' | 'Third Person Limited' | 'Third Person Omniscient' | 'Second Person';

export type CharacterRole = 'Protagonist' | 'Antagonist' | 'Deuteragonist' | 'Supporting' | 'Minor';

export type SceneStatus = 'Idea' | 'Outlined' | 'In Progress' | 'First Draft' | 'Revised' | 'Polished';

export type PlotStatus = 'Idea' | 'Outlined' | 'Drafted' | 'Revised' | 'Done';

export interface SceneComment {
  id: string;
  author: string;
  text: string;
  createdAt: string;
  resolved: boolean;
  selectedSnippet?: string;
}

export interface SceneVersion {
  id: string;
  timestamp: string;
  title: string;
  content: string;
  wordCount: number;
}

export interface Scene {
  id: string;
  chapterId: string;
  title: string;
  order: number;
  synopsis: string;
  content: string;
  status: SceneStatus;
  povCharacterId?: string;
  locationId?: string;
  notes?: string;
  wordCount: number;
  targetWords?: number;
  comments: SceneComment[];
  versions: SceneVersion[];
  updatedAt: string;
}

export interface Chapter {
  id: string;
  actId: string;
  title: string;
  order: number;
  synopsis?: string;
  scenes: Scene[];
}

export interface Act {
  id: string;
  bookId: string;
  title: string;
  order: number;
  synopsis?: string;
  chapters: Chapter[];
}

export interface Book {
  id: string;
  projectId: string;
  title: string;
  volumeNumber: number;
  synopsis?: string;
  targetWords: number;
  acts: Act[];
}

export interface Character {
  id: string;
  name: string;
  role: CharacterRole;
  archetype?: string;
  age?: string;
  occupation?: string;
  appearance: string;
  traits: string[];
  motivation: string;
  conflict: string;
  backstory?: string;
  notes?: string;
  colorTag?: string;
  imageUrl?: string;
  personalityTags?: string[];
  relationships?: { characterId: string; type: string; description: string }[];
  goals?: string[];
}

export interface Location {
  id: string;
  name: string;
  type: string;
  eraOrClimate?: string;
  sensoryDetails: string;
  loreAndSignificance: string;
  notes?: string;
}

export interface PlotCard {
  id: string;
  act: string;
  title: string;
  summary: string;
  tags: string[];
  status: PlotStatus;
  characterIds?: string[];
  locationIds?: string[];
  sceneId?: string;
  order: number;
}

export interface DailyStat {
  date: string; // YYYY-MM-DD
  wordsAdded: number;
  totalWords: number;
  writingMinutes: number;
}

export interface Project {
  id: string;
  title: string;
  subtitle?: string;
  author: string;
  genre: string;
  format: 'Novel' | 'Series' | 'Novella' | 'Short Story';
  pov: POVType;
  synopsis: string;
  targetWordCount: number;
  dailyWordGoal: number;
  deadline?: string;
  createdAt: string;
  updatedAt: string;
  books: Book[];
  characters: Character[];
  locations: Location[];
  plotCards: PlotCard[];
  stats: DailyStat[];
}

export interface UserSettings {
  apiKey: string;
  selectedModel: string;
  theme: 'dark' | 'light' | 'sepia';
  editorFontSize: number;
  editorFontFamily: 'Newsreader' | 'Plus Jakarta Sans' | 'JetBrains Mono' | 'Lora' | 'Playfair Display';
  autoSaveIntervalMs: number;
  soundEffects: boolean;
  dailyWordGoal?: number;
  spellcheckEnabled?: boolean;
}

export type AIActionType =
  | 'proofread'
  | 'suggest'
  | 'tone'
  | 'continue'
  | 'expand'
  | 'summarize'
  | 'dialogue'
  | 'plothole'
  | 'worldbuild'
  | 'titles'
  | 'custom';

export interface AIResponsePayload {
  success: boolean;
  output: string;
  explanation: string;
  confidence: number;
  modelUsed?: string;
  error?: string;
}

export const AVAILABLE_GEMINI_MODELS = [
  { id: 'gemini-3.8-flash', label: 'gemini-3.8-flash (Recommended Fast & Fluid)' },
  { id: 'gemini-3.1-flash-lite', label: 'gemini-3.1-flash-lite (Flash Lite - Fast & Efficient)' },
  { id: 'gemini-3.5-flash-lite', label: 'gemini-3.5-flash-lite (Flash Lite Next)' },
  { id: 'gemini-2.5-flash', label: 'gemini-2.5-flash (Standard Flash)' },
  { id: 'gemini-2.5-pro', label: 'gemini-2.5-pro (Deep Literary Fiction)' },
  { id: 'gemini-3.1-pro-preview', label: 'gemini-3.1-pro-preview (Flagship Pro)' },
  { id: 'gemini-2.0-flash', label: 'gemini-2.0-flash' },
  { id: 'gemini-1.5-pro', label: 'gemini-1.5-pro' },
];

