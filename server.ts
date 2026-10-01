import express, { Request, Response } from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

  const allowedOrigins = new Set([
    'https://localhost',
    'http://localhost',
    ...(process.env.CORS_ORIGINS || '')
      .split(',')
      .map((origin) => origin.trim())
      .filter(Boolean),
  ]);

  app.use((req: Request, res: Response, next) => {
    const origin = req.get('Origin');
    if (origin && allowedOrigins.has(origin)) {
      res.setHeader('Access-Control-Allow-Origin', origin);
      res.setHeader('Vary', 'Origin');
      res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    }

    if (req.method === 'OPTIONS') {
      return res.sendStatus(204);
    }

    next();
  });

  app.use(express.json({ limit: '10mb' }));

  // Helper to initialize GenAI client with either user-provided key or server env key
  const getGenAIClient = (userKey?: string) => {
    const key = (userKey && userKey.trim()) ? userKey.trim() : process.env.GEMINI_API_KEY;
    if (!key) {
      throw new Error('No Gemini API key provided. Please enter your API key in Settings or configure GEMINI_API_KEY.');
    }
    return new GoogleGenAI({
      apiKey: key,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  };

  // Test connection endpoint
  app.post('/api/ai/test-key', async (req: Request, res: Response) => {
    try {
      const { apiKey, model } = req.body;
      const ai = getGenAIClient(apiKey);
      const targetModel = model?.trim() || 'gemini-3.8-flash';

      const response = await ai.models.generateContent({
        model: targetModel,
        contents: 'Ping: return the word "READY" if connected.',
      });

      res.json({
        success: true,
        message: 'Successfully connected to Gemini API',
        sample: response.text?.trim() || 'READY',
        model: targetModel,
      });
    } catch (err: any) {
      console.error('Test key error:', err);
      res.status(400).json({
        success: false,
        error: err.message || 'Failed to authenticate with Gemini API',
      });
    }
  });

  // AI Character Generator endpoint using JSON response mode
  app.post('/api/ai/generate-character', async (req: Request, res: Response) => {
    try {
      const { apiKey, model, genre, role, concept, gender } = req.body;
      const ai = getGenAIClient(apiKey);
      const targetModel = model?.trim() || 'gemini-3.8-flash';

      const systemPrompt = `You are an elite novelist and character outline designer. 
You generate rich, cohesive, three-dimensional character profiles for fictional novels. 
Ensure the character feels incredibly authentic, multi-layered, and free of flat clichés. 

You MUST output your response as a valid, pure JSON object with the following fields and no extra explanation, markdown wrappers, or surrounding text.

JSON Schema:
{
  "name": "Full name of the character",
  "role": "${role || 'Supporting'}",
  "archetype": "Literary archetype",
  "age": "Age as a string (e.g., 28 or 'Late 40s')",
  "occupation": "Occupation or trade",
  "appearance": "Physical appearance and notable habits (2-3 sentences)",
  "traits": ["Trait 1", "Trait 2", "Trait 3", "Trait 4"],
  "motivation": "Core internal/external motivation (1-2 sentences)",
  "conflict": "Fatal flaw or primary struggle (1-2 sentences)",
  "backstory": "A rich, evocative backstory of 3-4 sentences"
}`;

      const userPrompt = `Generate a high-fidelity ${role || 'supporting'} character profile for a story in the "${genre || 'General Fiction'}" genre.
The character's concept or archetype theme is: "${concept || 'Mystery Figure'}"
Gender/Aesthetic preference is: "${gender || 'Any'}".

Ensure the backstory, traits, and motivations form a highly compelling, dramatic character arc.`;

      const response = await ai.models.generateContent({
        model: targetModel,
        contents: userPrompt,
        config: {
          systemInstruction: systemPrompt,
          temperature: 0.85,
          responseMimeType: "application/json"
        },
      });

      const responseText = response.text || '';
      const cleanedJson = responseText.replace(/```json/gi, '').replace(/```/g, '').trim();
      const parsedCharacter = JSON.parse(cleanedJson);

      res.json({
        success: true,
        character: parsedCharacter
      });
    } catch (err: any) {
      console.error('Character generation error:', err);
      res.status(400).json({
        success: false,
        error: err.message || 'Failed to generate character with AI'
      });
    }
  });

  // Main AI action endpoint
  app.post('/api/ai/action', async (req: Request, res: Response) => {
    try {
      const {
        apiKey,
        model,
        action,
        instruction,
        selectedText,
        sceneContent,
        sceneTitle,
        chapterTitle,
        bookTitle,
        projectInfo,
        characters,
        locations,
        plotNotes,
        tone,
        targetWords,
        dialogueSpeakers,
      } = req.body;

      const ai = getGenAIClient(apiKey);
      const targetModel = model?.trim() || 'gemini-3.8-flash';

      // Build context dossier
      const charContext = (characters && characters.length > 0)
        ? characters.map((c: any) => `- ${c.name} (${c.role}): ${c.description || ''}. Traits: ${c.traits?.join(', ') || 'N/A'}. Motive: ${c.motivation || 'N/A'}`).join('\n')
        : 'None defined yet.';

      const locContext = (locations && locations.length > 0)
        ? locations.map((l: any) => `- ${l.name} (${l.type}): ${l.sensoryDetails || l.description || ''}`).join('\n')
        : 'None defined yet.';

      const plotContext = (plotNotes && plotNotes.length > 0)
        ? plotNotes.map((p: any) => `- [${p.act || 'Plot'}] ${p.title}: ${p.summary || ''}`).join('\n')
        : 'None defined yet.';

      const systemPrompt = `You are WriteAI, an elite author's assistant and co-novelist.
You assist professional fiction writers with crafting compelling narrative prose, dialogue, worldbuilding, and editing.

CRITICAL RULES:
1. Always maintain strict narrative consistency with the project's genre, POV (${projectInfo?.pov || 'Third Person'}), tone, established characters, and locations.
2. Respect existing characters: do not contradict their known traits, motivations, speech patterns, or backstories.
3. Unless explicitly asked to rewrite the whole document, focus your output on the relevant passage, continuation, or edit.
4. Output must ALWAYS strictly follow this format:

### AI_OUTPUT
[Your proposed prose, edited text, continued scene, dialogue, or generated content goes here without code fence markers]

### EXPLANATION
[2-4 concise sentences detailing what you changed or why this creative direction was chosen]

### CONFIDENCE
[A single integer from 1 to 5, where 5 is maximum confidence in literary quality and continuity]`;

      let promptTask = '';

      switch (action) {
        case 'proofread':
          promptTask = `ACTION: PROOFREAD & POLISH
Review the target text for grammar, punctuation, typos, flow, repetitive phrasing, and passive voice while preserving the author's unique voice.
${selectedText ? `TARGET PASSAGE:\n"""${selectedText}"""` : `FULL SCENE CONTENT:\n"""${sceneContent}"""`}`;
          break;

        case 'suggest':
          promptTask = `ACTION: PROSE SUGGESTIONS & TIGHTENING
Provide a significantly tightened, more visceral, and evocative rewrite of the passage. Show, don't tell. Strengthen verbs and sensory imagery.
${selectedText ? `TARGET PASSAGE:\n"""${selectedText}"""` : `TARGET PASSAGE:\n"""${sceneContent}"""`}`;
          break;

        case 'tone':
          promptTask = `ACTION: TONE ADJUSTMENT
Rewrite the following passage with a specific tone: ${tone || 'suspenseful and atmospheric'}.
Ensure the emotional resonance and pacing match this requested tone.
TARGET PASSAGE:\n"""${selectedText || sceneContent}"""`;
          break;

        case 'continue':
          promptTask = `ACTION: SCENE CONTINUATION
Continue the narrative from the last paragraph of the scene naturally.
Keep the same characters, viewpoint, narrative tension, and momentum.
Approximate continuation length: ${targetWords || '150-300'} words.

PREVIOUS SCENE CONTENT UP TO THIS MOMENT:
"""${sceneContent}"""`;
          break;

        case 'expand':
          promptTask = `ACTION: EXPAND OUTLINE / NOTE INTO PROSE
Take the following brief notes/summary and expand it into a full, vivid narrative scene with sensory details, character interiority, and pacing.
OUTLINE/NOTES TO EXPAND:
"""${selectedText || instruction || sceneContent}"""`;
          break;

        case 'summarize':
          promptTask = `ACTION: SUMMARIZE SCENE/CHAPTER
Provide a concise, beat-by-beat dramatic summary of what happens in this scene, highlighting key revelations, character decisions, and ending hook.
SCENE TO SUMMARIZE:
"""${sceneContent}"""`;
          break;

        case 'dialogue':
          promptTask = `ACTION: CHARACTER DIALOGUE GENERATOR
Generate a natural, character-authentic exchange between ${dialogueSpeakers?.speakerA || 'Character A'} and ${dialogueSpeakers?.speakerB || 'Character B'}.
Subtext & Objective: ${instruction || 'Tension over a hidden secret'}
SCENE SITUATION:
"""${sceneContent ? sceneContent.slice(-800) : 'In the middle of an encounter'}"""`;
          break;

        case 'plothole':
          promptTask = `ACTION: PLOT HOLE & CONTINUITY CHECK
Analyze the current scene against the story bible (characters, locations, plot notes).
Detect any plot holes, contradictions, timeline errors, character out-of-character behavior, or unexplained leaps of logic.
Point them out clearly and offer solutions in the output.
SCENE TO CHECK:
"""${sceneContent}"""`;
          break;

        case 'worldbuild':
          promptTask = `ACTION: WORLDBUILDING ASSISTANT
Develop rich, cohesive lore for the following prompt:
"${instruction || 'A technological or magical system that drives conflict'}"
Integrate it harmoniously with the existing world setting.`;
          break;

        case 'titles':
          promptTask = `ACTION: TITLE & TAGLINE GENERATOR
Generate 5 compelling, memorable, evocative titles and punchy taglines for this ${sceneTitle ? 'scene' : 'book/project'}.
Context:
Project: ${projectInfo?.title} (${projectInfo?.genre})
Synopsis: ${projectInfo?.synopsis || ''}
Current Scene: ${sceneTitle || ''}
Prose excerpt:
"""${sceneContent ? sceneContent.slice(0, 1000) : ''}"""`;
          break;

        case 'custom':
        default:
          promptTask = `ACTION: CUSTOM AUTHOR ASSISTANCE
User prompt: "${instruction}"
${selectedText ? `Selected text to work with:\n"""${selectedText}"""\n` : ''}
${sceneContent ? `Full current scene for context:\n"""${sceneContent}"""\n` : ''}`;
          break;
      }

      const fullPrompt = `${promptTask}

---
STORY CONTEXT & BIBLE:
Project: ${projectInfo?.title || 'Untitled'} (${projectInfo?.genre || 'Fiction'})
POV: ${projectInfo?.pov || 'Third Person Limited'}
Current Book: ${bookTitle || 'Book 1'}
Current Chapter: ${chapterTitle || 'Chapter 1'}
Current Scene: ${sceneTitle || 'Scene 1'}

CHARACTERS IN BIBLE:
${charContext}

LOCATIONS IN BIBLE:
${locContext}

ACTIVE PLOT NOTES:
${plotContext}`;

      const response = await ai.models.generateContent({
        model: targetModel,
        contents: fullPrompt,
        config: {
          systemInstruction: systemPrompt,
          temperature: 0.8,
        },
      });

      const responseText = response.text || '';

      // Parse structured sections
      let outputText = '';
      let explanation = '';
      let confidence = 5;

      const outputMatch = responseText.match(/### AI_OUTPUT\s*([\s\S]*?)(?=### EXPLANATION|$)/i);
      const explMatch = responseText.match(/### EXPLANATION\s*([\s\S]*?)(?=### CONFIDENCE|$)/i);
      const confMatch = responseText.match(/### CONFIDENCE\s*(\d)/i);

      if (outputMatch && outputMatch[1]) {
        outputText = outputMatch[1].trim();
      } else {
        // Fallback: clean out header markers if present
        outputText = responseText
          .replace(/### AI_OUTPUT/gi, '')
          .replace(/### EXPLANATION[\s\S]*/gi, '')
          .trim();
      }

      if (explMatch && explMatch[1]) {
        explanation = explMatch[1].trim();
      } else {
        explanation = 'Generated with respect to your active narrative context and character bible.';
      }

      if (confMatch && confMatch[1]) {
        confidence = Math.min(5, Math.max(1, parseInt(confMatch[1], 10)));
      }

      res.json({
        success: true,
        output: outputText,
        explanation,
        confidence,
        raw: responseText,
        modelUsed: targetModel,
      });
    } catch (err: any) {
      console.error('AI action error:', err);
      res.status(500).json({
        success: false,
        error: err.message || 'An error occurred while communicating with Gemini API.',
      });
    }
  });

  // AI 3-Act Outline Generator endpoint
  app.post('/api/ai/outline', async (req: Request, res: Response) => {
    try {
      const {
        apiKey,
        model,
        synopsis,
        bookTitle,
        projectTitle,
        genre,
        arcType = 'Classic 3-Act Structure',
        beatCount = 12,
        characters = [],
        locations = [],
        customFocus = '',
      } = req.body;

      if (!synopsis || !synopsis.trim()) {
        return res.status(400).json({
          success: false,
          error: 'A synopsis is required to generate the 3-act story outline.',
        });
      }

      const targetModel = model?.trim() || 'gemini-3.8-flash';
      const key = (apiKey && apiKey.trim()) ? apiKey.trim() : process.env.GEMINI_API_KEY;

      // If key is not present, use the intelligent narrative fallback
      if (!key) {
        const fallback = generateFallbackOutline(synopsis, genre, arcType, beatCount, characters, bookTitle);
        return res.json({
          success: true,
          model: 'fallback-narrative-engine',
          isSimulated: true,
          ...fallback,
        });
      }

      const ai = getGenAIClient(apiKey);

      const charContext = (characters && characters.length > 0)
        ? characters.map((c: any) => `- ${c.name} (${c.role}): ${c.traits?.join(', ') || ''}. Goal: ${c.motivation || ''}`).join('\n')
        : 'None specified.';

      const prompt = `You are an elite narrative architect and fiction editor.
Your objective is to generate an exceptional, dramatic 3-Act Story Arc with approximately ${beatCount} suggested chapter beats based on the book's synopsis.

BOOK DETAILS:
Title: ${bookTitle || projectTitle || 'Untitled Story'}
Genre: ${genre || 'Fiction'}
Story Arc Model: ${arcType}
Target Beats: ${beatCount}
Author's Custom Focus: ${customFocus || 'None'}

BOOK SYNOPSIS:
"""${synopsis}"""

KEY CHARACTERS:
${charContext}

NARRATIVE SPECIFICATIONS:
1. Divide the storyline across exactly three distinct acts:
   - Act I (0% - 25%): The Setup, Ordinary World, Inciting Incident, Debate/Reluctance, Plot Point 1 (Crossing the Threshold).
   - Act II (25% - 75%): Confrontation, Tests & Allies, Midpoint Revelation/Shift, Escalating Stakes, Dark Night of the Soul / Lowest Point.
   - Act III (75% - 100%): Gathering Forces, The Climax Confrontation, Climax Peak/Sacrifice, Resolution & New Normal.
2. For each Act, provide:
   - "act": "Act I", "Act II", or "Act III"
   - "actTitle": An evocative, thematic act subtitle (e.g. "The Catalyst & Fracture", "The Long Descent", "The Reckoning")
   - "synopsis": 2-3 sentences summarizing the major character and plot trajectory of this act
   - "beats": An array of suggested chapter beats
3. For each beat, provide:
   - "chapterNumber": Sequential chapter number (1, 2, 3...)
   - "title": Evocative, professional chapter title (e.g. "Chapter 1: The Broken Seal")
   - "milestone": Story beat label (e.g. "Opening Hook", "Inciting Incident", "Crossing Threshold", "Midpoint Shift", "Dark Night of the Soul", "Climax", "Resolution")
   - "summary": 2-3 sentences detailing what happens, the dramatic conflict, and the consequence
   - "characterFocus": Character(s) prominent in this beat
   - "coreConflict": Central dilemma or question driving this scene

Respond strictly with valid JSON conforming to this schema:
{
  "projectOverview": "string",
  "acts": [
    {
      "act": "Act I",
      "actTitle": "string",
      "synopsis": "string",
      "beats": [
        {
          "chapterNumber": 1,
          "title": "string",
          "milestone": "string",
          "summary": "string",
          "characterFocus": "string",
          "coreConflict": "string"
        }
      ]
    }
  ]
}`;

      const response = await ai.models.generateContent({
        model: targetModel,
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          temperature: 0.7,
        },
      });

      const responseText = response.text || '';
      try {
        const parsed = JSON.parse(responseText);
        res.json({
          success: true,
          model: targetModel,
          ...parsed,
        });
      } catch (parseErr) {
        const cleaned = responseText.replace(/```json/g, '').replace(/```/g, '').trim();
        const parsed = JSON.parse(cleaned);
        res.json({
          success: true,
          model: targetModel,
          ...parsed,
        });
      }
    } catch (err: any) {
      console.error('Outline generator error:', err);
      // Resilient fallback on API errors
      const { synopsis, genre, arcType, beatCount, characters, bookTitle } = req.body;
      const fallback = generateFallbackOutline(synopsis || 'An untold journey', genre, arcType, beatCount, characters, bookTitle);
      res.json({
        success: true,
        model: 'fallback-narrative-engine',
        isSimulated: true,
        fallbackNotice: err.message || 'Gemini API call timed out or failed; generated via narrative engine.',
        ...fallback,
      });
    }
  });

  // Sentence Simplification AI endpoint
  app.post('/api/ai/simplify-sentence', async (req: Request, res: Response) => {
    try {
      const { apiKey, model, sentence, context, tone } = req.body;
      if (!sentence || !sentence.trim()) {
        return res.status(400).json({ success: false, error: 'No sentence provided' });
      }

      const ai = getGenAIClient(apiKey);
      const targetModel = model?.trim() || 'gemini-3.8-flash';

      const prompt = `You are an elite literary fiction editor and prose stylist.
Analyze and simplify the following complex sentence from a novel scene.
Your goal is to lower its reading difficulty, eliminate convoluted syntax, trim bloated filler phrases, and improve dramatic pacing while strictly preserving the author's original voice, meaning, and emotional subtext.

Sentence to simplify:
"${sentence}"

${context ? `Surrounding Scene Context:\n"${context.slice(0, 300)}..."\n` : ''}
${tone ? `Desired Tone: ${tone}\n` : ''}

Provide 3 distinct simplified variations formatted strictly as JSON:
{
  "punchy": "Direct, crisp, high-impact phrasing that cuts all unnecessary filler words",
  "fluid": "Graceful, natural rhythm with smooth cadence that reads effortlessly",
  "split": "Two clean, balanced sentences split at a natural logical or dramatic boundary",
  "explanation": "Brief explanation of what was tightened (e.g. passive voice removed, clause split, filler trimmed)"
}`;

      const response = await ai.models.generateContent({
        model: targetModel,
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          temperature: 0.6,
        },
      });

      const responseText = response.text || '';
      try {
        const parsed = JSON.parse(responseText);
        res.json({
          success: true,
          model: targetModel,
          ...parsed,
        });
      } catch (parseErr) {
        const cleaned = responseText.replace(/```json/g, '').replace(/```/g, '').trim();
        const parsed = JSON.parse(cleaned);
        res.json({
          success: true,
          model: targetModel,
          ...parsed,
        });
      }
    } catch (err: any) {
      console.error('Sentence simplification error:', err);
      // Fallback rule-based simplification
      const { sentence } = req.body;
      const fallback = generateRuleBasedSimplification(sentence || '');
      res.json({
        success: true,
        model: 'heuristic-simplifier',
        isSimulated: true,
        ...fallback,
      });
    }
  });

  function generateRuleBasedSimplification(sentence: string) {
    const cleaned = sentence
      .replace(/\bin order to\b/gi, 'to')
      .replace(/\bdue to the fact that\b/gi, 'because')
      .replace(/\bat the present time\b/gi, 'now')
      .replace(/\bin spite of the fact that\b/gi, 'although')
      .replace(/\bfor the purpose of\b/gi, 'to')
      .replace(/\bin the event that\b/gi, 'if')
      .replace(/\bwith the exception of\b/gi, 'except')
      .replace(/\bis able to\b/gi, 'can')
      .replace(/\bare able to\b/gi, 'can')
      .replace(/\bhas the ability to\b/gi, 'can')
      .replace(/\bhave the ability to\b/gi, 'can')
      .replace(/\bin close proximity to\b/gi, 'near')
      .replace(/\buntil such time as\b/gi, 'until')
      .replace(/\bmake an attempt to\b/gi, 'try to')
      .replace(/\btake into consideration\b/gi, 'consider')
      .replace(/\bgive an indication of\b/gi, 'indicate')
      .replace(/\bcome to a conclusion\b/gi, 'conclude');

    return {
      punchy: cleaned,
      fluid: cleaned,
      split: cleaned,
      explanation: 'Trimmed wordy filler phrases and streamlined clause structure.',
    };
  }

  // Smart Paragraphing AI endpoint
  app.post('/api/ai/smart-paragraph', async (req: Request, res: Response) => {
    try {
      const { apiKey, model, text, genre, tone } = req.body;
      if (!text || !text.trim()) {
        return res.status(400).json({ success: false, error: 'No text provided' });
      }

      const ai = getGenAIClient(apiKey);
      const targetModel = model?.trim() || 'gemini-3.8-flash';

      const prompt = `You are an elite, award-winning fiction editor and line editor.
Analyze the following scene's prose and intelligently insert line breaks (paragraph splits) to improve readability, dramatic pacing, tension, and flow.

Follow these strict rules of professional literary paragraphing:
1. Break up excessively dense "walls of text" (exposition blocks longer than 4-5 sentences) into shorter, more focus-driven paragraphs.
2. In fiction dialogue, start a new paragraph EVERY TIME a different character speaks or acts. Avoid bundling character A's speech and character B's action in the same paragraph.
3. Isolate poignant thoughts, sudden reveals, major realizations, or high-impact actions into their own single-line paragraphs to emphasize them for dramatic pacing.
4. Ensure physical beats (actions) and internal monologue are logically sequenced and have rhythm.
5. Strictly do NOT add, remove, or modify any words of the text itself. Do not fix spelling, change words, or rewrite sentences. ONLY add line breaks (double line breaks \\n\\n).

Text to parse and paragraph:
"""
${text}
"""

Genre: ${genre || 'Fiction'}
Tone/Pacing target: ${tone || 'Standard Novel Pacing'}

Respond strictly with valid JSON conforming to this schema:
{
  "originalText": "the original text",
  "paragraphedText": "the beautiful, newly formatted, paced, and paragraphed text preserving all words exactly as-is but with smart double line breaks (\\\\n\\\\n)",
  "explanation": "A bulleted description of what pacing splits were made (e.g. separated character dialogue, isolated dramatic single-line focus beat, split expository wall-of-text block)."
}`;

      const response = await ai.models.generateContent({
        model: targetModel,
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          temperature: 0.3,
        },
      });

      const responseText = response.text || '';
      try {
        const parsed = JSON.parse(responseText);
        res.json({
          success: true,
          model: targetModel,
          ...parsed,
        });
      } catch (parseErr) {
        const cleaned = responseText.replace(/```json/g, '').replace(/```/g, '').trim();
        const parsed = JSON.parse(cleaned);
        res.json({
          success: true,
          model: targetModel,
          ...parsed,
        });
      }
    } catch (err: any) {
      console.error('Smart paragraphing error:', err);
      // Fallback rule-based paragraphing
      const { text } = req.body;
      const fallback = generateRuleBasedParagraphs(text || '');
      res.json({
        success: true,
        model: 'heuristic-paragrapher',
        isSimulated: true,
        ...fallback,
      });
    }
  });

  function generateRuleBasedParagraphs(text: string) {
    const sentences = text.split(/(?<=[.!?])\s+/);
    let paragraphed = '';
    let currentParagraphCount = 0;

    for (let i = 0; i < sentences.length; i++) {
      const sentence = sentences[i];
      if (!sentence.trim()) continue;
      paragraphed += sentence + ' ';
      currentParagraphCount++;

      const hasDialogue = sentence.includes('"') || sentence.includes('“') || sentence.includes('”') || sentence.includes('—');
      if (currentParagraphCount >= 3 || hasDialogue) {
        paragraphed = paragraphed.trim() + '\n\n';
        currentParagraphCount = 0;
      }
    }

    return {
      originalText: text,
      paragraphedText: paragraphed.trim(),
      explanation: 'Heuristically separated dialogue and split long sentence sequences into smaller digestible beats.',
    };
  }

  // Grammarly-style Prose Style Critiquer & Suggester
  app.post('/api/ai/prose-style', async (req: Request, res: Response) => {
    try {
      const { apiKey, model, text } = req.body;
      if (!text || !text.trim()) {
        return res.status(400).json({ success: false, error: 'No text provided' });
      }

      const ai = getGenAIClient(apiKey);
      const targetModel = model?.trim() || 'gemini-3.8-flash';

      const prompt = `You are an elite, sharp fiction copyeditor and line editor.
Analyze the following scene's text and identify stylistic flaws or opportunities for improvement.
Focus strictly on these four categories of edits:
1. "wordiness": Phrases that are excessively wordy, redundant, or passive (e.g. "in order to", "at this point in time").
2. "passive_voice": Sentences where subject-action is reversed, making them feel dry (e.g. "The glass was broken by him").
3. "weak_verb": Dull verbs or verb-adverb clichés that can be elevated to high-potency literary verbs (e.g. "walked very quickly" -> "dashed").
4. "cliché": Common narrative or dialogue clichés that weaken prose impact.

Ensure that "originalText" matches the EXACT substring in the source prose so it can be replaced automatically in the editor.

Text to inspect:
"""
${text}
"""

Respond strictly with a JSON object containing a "suggestions" array with exactly this format:
{
  "suggestions": [
    {
      "originalText": "exact substring to replace",
      "replacementText": "proposed replacement substring",
      "category": "wordiness" | "passive_voice" | "weak_verb" | "cliché",
      "explanation": "Brief 1-sentence explanation of why this improves the line."
    }
  ]
}`;

      const response = await ai.models.generateContent({
        model: targetModel,
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          temperature: 0.2,
        },
      });

      const responseText = response.text || '';
      try {
        const parsed = JSON.parse(responseText);
        res.json({
          success: true,
          ...parsed,
        });
      } catch {
        const cleaned = responseText.replace(/```json/g, '').replace(/```/g, '').trim();
        res.json({
          success: true,
          ...JSON.parse(cleaned),
        });
      }
    } catch (err: any) {
      console.error('Prose style analysis error:', err);
      const suggestions = generateRuleBasedStyleSuggestions(req.body.text || '');
      res.json({
        success: true,
        suggestions,
        isSimulated: true,
      });
    }
  });

  function generateRuleBasedStyleSuggestions(text: string) {
    const suggestions = [];
    const rules = [
      { regex: /\bin order to\b/gi, replacement: 'to', category: 'wordiness', desc: 'Removes unnecessary filler words.' },
      { regex: /\bat this point in time\b/gi, replacement: 'now', category: 'wordiness', desc: 'Simplifies wordy timeline reference.' },
      { regex: /\bwith the exception of\b/gi, replacement: 'except', category: 'wordiness', desc: 'Reduces wordy preposition.' },
      { regex: /\blooked very angry\b/gi, replacement: 'glared', category: 'weak_verb', desc: 'Replaces weak verb and modifier with active sensory verb.' },
      { regex: /\bwalked slowly\b/gi, replacement: 'sauntered', category: 'weak_verb', desc: 'Elevates to character-revealing active verb.' },
      { regex: /\bthought to himself\b/gi, replacement: 'thought', category: 'cliché', desc: 'Removes redundant dialogue tag.' },
      { regex: /\bthought to herself\b/gi, replacement: 'thought', category: 'cliché', desc: 'Removes redundant dialogue tag.' }
    ];

    for (const rule of rules) {
      const matches = [...text.matchAll(rule.regex)];
      for (const match of matches) {
        suggestions.push({
          originalText: match[0],
          replacementText: rule.replacement,
          category: rule.category,
          explanation: rule.desc
        });
      }
    }

    return suggestions.slice(0, 10);
  }

  function generateFallbackOutline(
    synopsis: string,
    genre: string = 'Fiction',
    arcType: string = 'Classic 3-Act Structure',
    beatCount: number = 12,
    characters: any[] = [],
    bookTitle?: string
  ) {
    const protagonist = characters[0]?.name || 'The Protagonist';
    const antagonist = characters[1]?.name || 'The Antagonist';
    const confidant = characters[2]?.name || 'The Trusted Ally';

    let currentChapter = 1;

    return {
      projectOverview: `A cohesive 3-act story arc structured around: "${synopsis.slice(0, 140)}..."`,
      acts: [
        {
          act: 'Act I',
          actTitle: 'The Catalyst & Fracture',
          synopsis: `Establishes ${protagonist}'s status quo and internal wound, introduces the disruptive catalyst, and pushes the protagonist across the point of no return.`,
          beats: [
            {
              chapterNumber: currentChapter++,
              title: 'Chapter 1: The Status Quo & Shadow',
              milestone: 'Opening Hook & Normal World',
              summary: `Introduce ${protagonist} in their familiar world, establishing their primary desire and the hidden flaws beneath daily life. Subtle portents of the looming disruption emerge.`,
              characterFocus: protagonist,
              coreConflict: 'Complacency versus the uneasy premonition that change is imminent.',
            },
            {
              chapterNumber: currentChapter++,
              title: 'Chapter 2: The Catalyst',
              milestone: 'Inciting Incident',
              summary: `A dramatic event connected to "${synopsis.slice(0, 80)}..." shatters all routine, thrusting ${protagonist} into an unavoidable predicament.`,
              characterFocus: protagonist,
              coreConflict: 'The instinct to look away versus the impossibility of denial.',
            },
            {
              chapterNumber: currentChapter++,
              title: 'Chapter 3: Hesitation & High Stakes',
              milestone: 'Debate & Preparation',
              summary: `${protagonist} confides in ${confidant}, assessing risks. When the consequences of doing nothing become unbearable, safety ceases to be an option.`,
              characterFocus: `${protagonist} & ${confidant}`,
              coreConflict: 'Personal self-preservation versus ethical imperative.',
            },
            {
              chapterNumber: currentChapter++,
              title: 'Chapter 4: Crossing the Threshold',
              milestone: 'Plot Point 1',
              summary: `${protagonist} commits to action and leaves the familiar world behind. The threshold is crossed, and there is no longer a path in reverse.`,
              characterFocus: protagonist,
              coreConflict: 'Accepting the irreversible step into the unknown.',
            },
          ],
        },
        {
          act: 'Act II',
          actTitle: 'Confrontation & The Long Descent',
          synopsis: `Expands the scope of conflict with trials, tactical victories, and deceptive truces, culminating in a seismic Midpoint shift and the eventual Dark Night of the Soul.`,
          beats: [
            {
              chapterNumber: currentChapter++,
              title: `Chapter ${currentChapter}: The New Arena`,
              milestone: 'Tests & Rising Action',
              summary: `Venturing deeper into unfamiliar territory, ${protagonist} encounters proxy agents of ${antagonist} and learns the unwritten rules of survival.`,
              characterFocus: protagonist,
              coreConflict: 'Navigating deception with incomplete information.',
            },
            {
              chapterNumber: currentChapter++,
              title: `Chapter ${currentChapter}: The First Skirmish`,
              milestone: 'Rising Stakes',
              summary: `A calculated gamble produces critical intelligence but exposes ${protagonist}'s position to ${antagonist}, heightening immediate danger.`,
              characterFocus: `${protagonist} & ${antagonist}`,
              coreConflict: 'A hard-won victory that exacts an unforeseen price.',
            },
            {
              chapterNumber: currentChapter++,
              title: `Chapter ${currentChapter}: The Midpoint Reversal`,
              milestone: 'Midpoint Shift',
              summary: `A central revelation overturns key assumptions: the true nature of the stakes is unveiled, forcing ${protagonist} from passive reaction to aggressive offensive strategy.`,
              characterFocus: protagonist,
              coreConflict: 'Re-evaluating truth and loyalty after foundations crumble.',
            },
            {
              chapterNumber: currentChapter++,
              title: `Chapter ${currentChapter}: The Tightening Net`,
              milestone: 'Escalation & Crisis',
              summary: `${antagonist} unleashes an offensive that cuts off resources and tests bonds with ${confidant}. Every easy exit is methodically eliminated.`,
              characterFocus: `${protagonist} & ${confidant}`,
              coreConflict: 'Holding together an alliance when collapse appears certain.',
            },
            {
              chapterNumber: currentChapter++,
              title: `Chapter ${currentChapter}: Dark Night of the Soul`,
              milestone: 'All Hope Lost',
              summary: `The lowest point: an ambush or betrayal strips away all external advantages. Isolated and exhausted, ${protagonist} must conquer their primary internal doubt.`,
              characterFocus: protagonist,
              coreConflict: 'Surrendering to hopelessness versus discovering authentic purpose.',
            },
          ],
        },
        {
          act: 'Act III',
          actTitle: 'The Reckoning & New Dawn',
          synopsis: `Consolidates remaining strength into an audacious final stand, resolves the core thematic conflict at the Climax, and establishes a hard-won new equilibrium.`,
          beats: [
            {
              chapterNumber: currentChapter++,
              title: `Chapter ${currentChapter}: The Final Scheme`,
              milestone: 'Plot Point 2 / Rallying Forces',
              summary: `With newfound clarity, ${protagonist} synthesizes everything learned to forge an unconventional final strategy. Allies regroup for the inevitable collision.`,
              characterFocus: `${protagonist} & ${confidant}`,
              coreConflict: 'Executing an all-or-nothing plan with zero margin for error.',
            },
            {
              chapterNumber: currentChapter++,
              title: `Chapter ${currentChapter}: The Climax`,
              milestone: 'The Final Confrontation',
              summary: `The definitive showdown between ${protagonist} and ${antagonist}. External forces collide as the moral argument at the heart of the story is tested to its breaking point.`,
              characterFocus: `${protagonist} vs ${antagonist}`,
              coreConflict: 'The ultimate battle of conviction, sacrifice, and survival.',
            },
            {
              chapterNumber: currentChapter++,
              title: `Chapter ${currentChapter}: The New Dawn`,
              milestone: 'Resolution & Aftermath',
              summary: `The aftermath of the battle reveals a forever altered landscape. ${protagonist} returns to life transformed, having paid the necessary toll for growth.`,
              characterFocus: protagonist,
              coreConflict: 'Finding peace and direction in a remade world.',
            },
          ],
        },
      ],
    };
  }

  // Frontend static / dev middleware
  if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.join(__dirname, 'dist')));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.join(__dirname, 'dist', 'index.html'));
    });
  } else {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`WriteAI server running on port ${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
