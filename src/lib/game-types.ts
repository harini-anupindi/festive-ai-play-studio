export type GameKind = "quiz" | "memory" | "word" | "wordsearch" | "story" | "scratch";

export interface ScratchSprite {
  name: string;
  role: string;
  costumeIdea: string;
}

export interface ScratchStep {
  title: string;
  target: string;
  blocks: string[];
  why: string;
}

export interface QuizQuestion {
  prompt: string;
  options: string[];
  correctIndex: number;
  fact: string;
}

export interface MemoryPair {
  term: string;
  match: string;
  fact: string;
}

export interface WordPuzzle {
  word: string;
  hint: string;
  fact: string;
}

export interface StoryStep {
  scene: string;
  choices: string[];
  fact: string;
}

export interface FestivalGame {
  id: string;
  title: string;
  tagline: string;
  festival: string;
  gameKind: GameKind;
  ageRange: string;
  playerCount: 1 | 2;
  gridSize: number;
  learningGoal: string;
  quizQuestions: QuizQuestion[];
  memoryPairs: MemoryPair[];
  wordPuzzles: WordPuzzle[];
  searchWords: WordPuzzle[];
  storySteps: StoryStep[];
  scratchSprites: ScratchSprite[];
  scratchSteps: ScratchStep[];
  scratchExtras: string[];
}

export const GAME_KIND_LABEL: Record<GameKind, string> = {
  quiz: "Quiz",
  memory: "Memory match",
  word: "Word puzzle",
  wordsearch: "Word search",
  story: "Story builder",
  scratch: "Scratch build guide",
};
