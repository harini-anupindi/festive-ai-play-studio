import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import type { FestivalGame, GameKind } from "./game-types";

const Input = z.object({
  prompt: z.string().min(1).max(600),
  gameKind: z.enum(["quiz", "memory", "word", "wordsearch", "story", "scratch"]),
  ageRange: z.string().min(1).max(40),
  playerCount: z.union([z.literal(1), z.literal(2)]),
  gridSize: z.number().int().min(4).max(8).optional(),
});

const gameSchema = {
  type: "object",
  additionalProperties: false,
  required: [
    "title",
    "tagline",
    "festival",
    "learningGoal",
    "quizQuestions",
    "memoryPairs",
    "wordPuzzles",
    "searchWords",
    "storySteps",
    "scratchSprites",
    "scratchSteps",
    "scratchExtras",
  ],
  properties: {
    title: { type: "string" },
    tagline: { type: "string" },
    festival: { type: "string" },
    learningGoal: { type: "string" },
    quizQuestions: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["prompt", "options", "correctIndex", "fact"],
        properties: {
          prompt: { type: "string" },
          options: { type: "array", items: { type: "string" } },
          correctIndex: { type: "integer" },
          fact: { type: "string" },
        },
      },
    },
    memoryPairs: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["term", "match", "fact"],
        properties: {
          term: { type: "string" },
          match: { type: "string" },
          fact: { type: "string" },
        },
      },
    },
    wordPuzzles: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["word", "hint", "fact"],
        properties: {
          word: { type: "string" },
          hint: { type: "string" },
          fact: { type: "string" },
        },
      },
    },
    searchWords: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["word", "hint", "fact"],
        properties: {
          word: { type: "string" },
          hint: { type: "string" },
          fact: { type: "string" },
        },
      },
    },
    storySteps: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["scene", "choices", "fact"],
        properties: {
          scene: { type: "string" },
          choices: { type: "array", items: { type: "string" } },
          fact: { type: "string" },
        },
      },
    },
    scratchSprites: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["name", "role", "costumeIdea"],
        properties: {
          name: { type: "string" },
          role: { type: "string" },
          costumeIdea: { type: "string" },
        },
      },
    },
    scratchSteps: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["title", "target", "blocks", "why"],
        properties: {
          title: { type: "string" },
          target: { type: "string" },
          blocks: { type: "array", items: { type: "string" } },
          why: { type: "string" },
        },
      },
    },
    scratchExtras: { type: "array", items: { type: "string" } },
  },
} as const;

const kindBrief: Record<GameKind, string> = {
  quiz: "Fill quizQuestions with exactly 6 multiple-choice questions, each with exactly 4 options and one correct answer. Leave the other arrays empty.",
  memory:
    "Fill memoryPairs with exactly 6 pairs (term and its matching partner, e.g. a ritual and its meaning). Leave the other arrays empty.",
  word: "Fill wordPuzzles with exactly 6 single festival words (uppercase A-Z only, 4-9 letters, no spaces) each with a playful hint. Leave the other arrays empty.",
  wordsearch:
    "Fill searchWords with festival words for a word-search grid (uppercase A-Z only, no spaces or accents) each with a short clue and a fact. Leave the other arrays empty.",
  story:
    "Fill storySteps with exactly 5 story scenes, each with exactly 3 creative choices the child can pick. Leave the other arrays empty.",
  scratch:
    "Design a real, buildable game in Scratch 3 (scratch.mit.edu) on this festival theme. Fill scratchSprites with 3-4 sprites (name, what it does in the game, a costume/drawing idea) and scratchSteps with exactly 6 build steps in order. Each step names the target sprite or Stage, gives 3-6 blocks written exactly as Scratch block text (e.g. 'when green flag clicked', 'forever', 'if <touching [Modak v]?> then', 'change [score v] by (1)'), and one short line on what the child learns. Fill scratchExtras with 3 challenge ideas to extend the game. Leave the other arrays empty.",
};

export const generateGame = createServerFn({ method: "POST" })
  .validator((data: unknown) => Input.parse(data))
  .handler(async ({ data }): Promise<FestivalGame> => {
    const apiKey = process.env["LOVABLE_API_KEY"];
    if (!apiKey) throw new Error("AI is not configured yet.");

    const instructions = [
      "You design warm, educational, creative mini-games for children based on Indian and world festival themes.",
      "Content must be culturally respectful, factually accurate and age-appropriate.",
      `Target audience: ${data.ageRange}.`,
      data.playerCount === 2
        ? "Two children will play together taking turns on the same device, so make prompts and facts friendly for turn-taking."
        : "One child will play solo.",
      kindBrief[data.gameKind],
      data.gameKind === "wordsearch"
        ? `The grid is ${gridSize}x${gridSize}, so every word must be between 3 and ${gridSize} letters long. Give exactly ${gridSize <= 5 ? 4 : 6} words.`
        : "",
      "Keep every text field short: titles under 40 characters, tagline under 90 characters, facts under 140 characters.",
    ]
      .filter(Boolean)
      .join(" ");

    const res = await fetch("https://ai.gateway.lovable.dev/v1/responses", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Lovable-API-Key": apiKey,
        "X-Lovable-AIG-SDK": "fetch",
      },
      body: JSON.stringify({
        model: "openai/gpt-6-astra",
        instructions,
        input: `Festival theme prompt from the user: "${data.prompt}"`,
        stream: true,
        reasoning: { effort: "low" },
        text: {
          format: {
            type: "json_schema",
            name: "festival_game",
            strict: true,
            schema: gameSchema,
          },
        },
      }),
    });

    if (!res.ok || !res.body) {
      const detail = await res.text().catch(() => "");
      if (res.status === 429) throw new Error("Too many requests right now — please try again in a moment.");
      if (res.status === 402)
        throw new Error("The AI workspace is out of credits. Add credits to keep generating games.");
      throw new Error(detail || `AI request failed (${res.status})`);
    }

    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";
    let text = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() ?? "";
      for (const line of lines) {
        if (!line.startsWith("data:")) continue;
        const payload = line.slice(5).trim();
        if (!payload || payload === "[DONE]") continue;
        try {
          const evt = JSON.parse(payload);
          if (evt.type === "response.output_text.delta" && typeof evt.delta === "string") {
            text += evt.delta;
          } else if (evt.type === "response.completed" && typeof evt.response?.output_text === "string") {
            if (!text) text = evt.response.output_text;
          }
        } catch {
          // ignore partial frames
        }
      }
    }

    if (!text.trim()) throw new Error("The AI didn't return a game. Try rephrasing your theme.");

    let parsed: Omit<FestivalGame, "id" | "gameKind" | "ageRange">;
    try {
      parsed = JSON.parse(text);
    } catch {
      throw new Error("The AI returned something unexpected. Try again.");
    }

    return {
      id: crypto.randomUUID(),
      gameKind: data.gameKind,
      ageRange: data.ageRange,
      playerCount: data.playerCount,
      title: parsed.title,
      tagline: parsed.tagline,
      festival: parsed.festival,
      learningGoal: parsed.learningGoal,
      quizQuestions: parsed.quizQuestions ?? [],
      memoryPairs: parsed.memoryPairs ?? [],
      wordPuzzles: parsed.wordPuzzles ?? [],
      storySteps: parsed.storySteps ?? [],
      scratchSprites: parsed.scratchSprites ?? [],
      scratchSteps: parsed.scratchSteps ?? [],
      scratchExtras: parsed.scratchExtras ?? [],
    };
  });
