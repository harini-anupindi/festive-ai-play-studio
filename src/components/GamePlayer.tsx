import { useMemo, useState } from "react";
import type { FestivalGame } from "@/lib/game-types";
import { GAME_KIND_LABEL } from "@/lib/game-types";

function shuffle<T>(items: T[]): T[] {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    const tmp = copy[i]!;
    copy[i] = copy[j]!;
    copy[j] = tmp;
  }
  return copy;
}

function Shell({
  game,
  score,
  scores,
  step,
  total,
  onExit,
  children,
}: {
  game: FestivalGame;
  score: number;
  scores?: { label: string; value: number; active: boolean }[] | undefined;
  step: number;
  total: number;
  onExit: () => void;
  children: React.ReactNode;
}) {
  const pct = total > 0 ? Math.round((step / total) * 100) : 0;
  return (
    <div className="rounded-2xl bg-dusk-deep p-4 ring-1 ring-marigold/20 sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-saffron">
            Now playing · {GAME_KIND_LABEL[game.gameKind]}
          </p>
          <h2 className="mt-1 font-display text-2xl font-semibold tracking-tight text-cream sm:text-3xl">
            {game.title}
          </h2>
          <p className="mt-1 text-sm text-cream/60">{game.learningGoal}</p>
        </div>
        <div className="flex items-center gap-4">
          {scores ? (
            scores.map((s) => (
              <div
                key={s.label}
                className={`rounded-lg px-2.5 py-1 text-right ring-1 ${
                  s.active ? "bg-marigold/15 ring-marigold/60" : "ring-transparent"
                }`}
              >
                <p className="text-[11px] uppercase tracking-wide text-cream/50">
                  {s.active ? `${s.label} · turn` : s.label}
                </p>
                <p className="font-display text-2xl font-semibold text-marigold">{s.value}</p>
              </div>
            ))
          ) : (
            <div className="text-right">
              <p className="text-[11px] uppercase tracking-wide text-cream/50">Score</p>
              <p className="font-display text-2xl font-semibold text-marigold">{score}</p>
            </div>
          )}
          <div className="text-right">
            <p className="text-[11px] uppercase tracking-wide text-cream/50">Round</p>
            <p className="font-display text-2xl font-semibold text-cream">
              {Math.min(step + 1, total)} / {total}
            </p>
          </div>
          <button
            onClick={onExit}
            className="rounded-full border border-cream/25 px-3 py-1.5 text-sm text-cream/70 transition-colors hover:text-cream"
          >
            Close
          </button>
        </div>
      </div>

      <div className="mt-4 flex items-center gap-3">
        <span className="text-xs font-medium text-cream/60">Progress</span>
        <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-cream/15">
          <div className="h-full rounded-full bg-marigold transition-all" style={{ width: `${pct}%` }} />
        </div>
        <span className="text-xs font-semibold text-marigold">{pct}%</span>
      </div>

      <div className="mt-5">{children}</div>
    </div>
  );
}

function Finished({
  score,
  result,
  onRestart,
}: {
  score: number;
  result?: string | undefined;
  onRestart: () => void;
}) {
  return (
    <div className="rounded-xl bg-cream p-6 text-center ring-1 ring-black/10">
      <p className="font-display text-2xl font-semibold text-ink">Well played!</p>
      <p className="mt-1 text-sm text-ink/60">{result ?? `You finished with ${score} points.`}</p>
      <button
        onClick={onRestart}
        className="mt-4 rounded-full bg-marigold px-5 py-2 text-sm font-semibold text-dusk-deep ring-1 ring-saffron/70 active:translate-y-px"
      >
        Play again
      </button>
    </div>
  );
}

function quizResult(scores: [number, number], twoPlayer: boolean): string | undefined {
  if (!twoPlayer) return undefined;
  if (scores[0] === scores[1]) return `It's a tie — ${scores[0]} points each!`;
  const winner = scores[0] > scores[1] ? "Player 1" : "Player 2";
  return `${winner} wins ${Math.max(...scores)} – ${Math.min(...scores)}!`;
}

function QuizGame({ game, onExit }: { game: FestivalGame; onExit: () => void }) {
  const twoPlayer = game.playerCount === 2;
  const [index, setIndex] = useState(0);
  const [picked, setPicked] = useState<number | null>(null);
  const [scores, setScores] = useState<[number, number]>([0, 0]);
  const [turn, setTurn] = useState(0);
  const questions = game.quizQuestions;
  const done = index >= questions.length;
  const q = questions[index]!;
  const score = scores[0] + scores[1];

  return (
    <Shell
      game={game}
      score={score}
      scores={
        twoPlayer
          ? [
              { label: "Player 1", value: scores[0], active: turn === 0 },
              { label: "Player 2", value: scores[1], active: turn === 1 },
            ]
          : undefined
      }
      step={index}
      total={questions.length}
      onExit={onExit}
    >
      {done ? (
        <Finished
          score={score}
          result={quizResult(scores, twoPlayer)}
          onRestart={() => {
            setIndex(0);
            setScores([0, 0]);
            setTurn(0);
            setPicked(null);
          }}
        />
      ) : (
        <div className="rounded-xl bg-cream p-5 ring-1 ring-black/10">
          <p className="font-display text-lg font-semibold leading-snug text-ink">{q.prompt}</p>
          <div className="mt-4 grid gap-2 sm:grid-cols-2">
            {q.options.map((option, i) => {
              const isCorrect = i === q.correctIndex;
              const state =
                picked === null
                  ? "border-ink/15 text-ink"
                  : isCorrect
                    ? "border-teal bg-teal/15 text-teal"
                    : picked === i
                      ? "border-saffron bg-saffron/15 text-saffron"
                      : "border-ink/10 text-ink/40";
              return (
                <button
                  key={i}
                  disabled={picked !== null}
                  onClick={() => {
                    setPicked(i);
                    if (isCorrect)
                      setScores((s) => (turn === 0 ? [s[0] + 100, s[1]] : [s[0], s[1] + 100]));
                  }}
                  className={`rounded-lg border px-3 py-2.5 text-left text-sm font-semibold transition-colors active:translate-y-px ${state}`}
                >
                  {option}
                </button>
              );
            })}
          </div>
          {picked !== null && (
            <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-lg bg-turmeric/15 px-3 py-2.5">
              <p className="text-sm text-ink/75">{q.fact}</p>
              <button
                onClick={() => {
                  setPicked(null);
                  setIndex((i) => i + 1);
                  if (twoPlayer) setTurn((t) => 1 - t);
                }}
                className="rounded-full bg-marigold px-4 py-1.5 text-sm font-semibold text-dusk-deep ring-1 ring-saffron/70 active:translate-y-px"
              >
                Next
              </button>
            </div>
          )}
        </div>
      )}
    </Shell>
  );
}

function MemoryGame({ game, onExit }: { game: FestivalGame; onExit: () => void }) {
  const twoPlayer = game.playerCount === 2;
  const [seed, setSeed] = useState(0);
  const tiles = useMemo(
    () =>
      shuffle(
        game.memoryPairs.flatMap((pair, i) => [
          { id: `${i}-a`, pairId: i, label: pair.term },
          { id: `${i}-b`, pairId: i, label: pair.match },
        ]),
      ),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [game, seed],
  );
  const [flipped, setFlipped] = useState<string[]>([]);
  const [matched, setMatched] = useState<number[]>([]);
  const [scores, setScores] = useState<[number, number]>([0, 0]);
  const [turn, setTurn] = useState(0);
  const [note, setNote] = useState<string | null>(null);
  const score = scores[0] + scores[1];

  const flip = (tileId: string, pairId: number) => {
    if (flipped.includes(tileId) || matched.includes(pairId) || flipped.length === 2) return;
    const next = [...flipped, tileId];
    setFlipped(next);
    if (next.length === 2) {
      const first = tiles.find((t) => t.id === next[0])!;
      const second = tiles.find((t) => t.id === next[1])!;
      if (first.pairId === second.pairId) {
        setMatched((m) => [...m, first.pairId]);
        setScores((s) => (turn === 0 ? [s[0] + 120, s[1]] : [s[0], s[1] + 120]));
        setNote(game.memoryPairs[first.pairId]!.fact);
        setFlipped([]);
      } else {
        setTimeout(() => {
          setFlipped([]);
          if (twoPlayer) setTurn((t) => 1 - t);
        }, 900);
      }
    }
  };

  const total = game.memoryPairs.length;

  return (
    <Shell
      game={game}
      score={score}
      scores={
        twoPlayer
          ? [
              { label: "Player 1", value: scores[0], active: turn === 0 },
              { label: "Player 2", value: scores[1], active: turn === 1 },
            ]
          : undefined
      }
      step={matched.length}
      total={total}
      onExit={onExit}
    >
      {matched.length === total ? (
        <Finished
          score={score}
          result={quizResult(scores, twoPlayer)}
          onRestart={() => {
            setSeed((s) => s + 1);
            setMatched([]);
            setFlipped([]);
            setScores([0, 0]);
            setTurn(0);
            setNote(null);
          }}
        />
      ) : (
        <>
          <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
            {tiles.map((tile) => {
              const revealed = flipped.includes(tile.id) || matched.includes(tile.pairId);
              return (
                <button
                  key={tile.id}
                  onClick={() => flip(tile.id, tile.pairId)}
                  className={`flex min-h-24 items-center justify-center rounded-xl p-3 text-center text-sm font-semibold ring-1 transition-colors active:translate-y-px ${
                    revealed
                      ? "flip-in bg-cream text-ink ring-black/5"
                      : "bg-dusk text-cream/40 ring-marigold/25"
                  }`}
                >
                  {revealed ? tile.label : "✦"}
                </button>
              );
            })}
          </div>
          {note && <p className="mt-4 rounded-lg bg-turmeric/15 px-3 py-2.5 text-sm text-cream/80">{note}</p>}
        </>
      )}
    </Shell>
  );
}

function WordGame({ game, onExit }: { game: FestivalGame; onExit: () => void }) {
  const [index, setIndex] = useState(0);
  const [guess, setGuess] = useState("");
  const [score, setScore] = useState(0);
  const [solved, setSolved] = useState(false);
  const puzzles = game.wordPuzzles;
  const done = index >= puzzles.length;
  const puzzle = puzzles[index]!;
  const scrambled = useMemo(
    () => (puzzle ? shuffle(puzzle.word.toUpperCase().split("")).join(" ") : ""),
    [puzzle],
  );

  return (
    <Shell game={game} score={score} step={index} total={puzzles.length} onExit={onExit}>
      {done ? (
        <Finished
          score={score}
          onRestart={() => {
            setIndex(0);
            setScore(0);
            setGuess("");
            setSolved(false);
          }}
        />
      ) : (
        <div className="rounded-xl bg-cream p-5 ring-1 ring-black/10">
          <p className="font-display text-2xl font-semibold tracking-[0.3em] text-ink">{scrambled}</p>
          <p className="mt-2 text-sm text-ink/60">{puzzle.hint}</p>
          <form
            className="mt-4 flex flex-wrap gap-2"
            onSubmit={(e) => {
              e.preventDefault();
              if (guess.trim().toUpperCase() === puzzle.word.toUpperCase()) {
                setSolved(true);
                setScore((s) => s + 150);
              } else {
                setGuess("");
              }
            }}
          >
            <input
              value={guess}
              onChange={(e) => setGuess(e.target.value)}
              disabled={solved}
              placeholder="Type the word"
              className="min-w-48 flex-1 rounded-lg border border-ink/20 bg-cream px-3 py-2 text-sm text-ink outline-none placeholder:text-ink/40 focus:border-saffron"
            />
            {solved ? (
              <button
                type="button"
                onClick={() => {
                  setSolved(false);
                  setGuess("");
                  setIndex((i) => i + 1);
                }}
                className="rounded-full bg-marigold px-4 py-2 text-sm font-semibold text-dusk-deep ring-1 ring-saffron/70 active:translate-y-px"
              >
                Next word
              </button>
            ) : (
              <button
                type="submit"
                className="rounded-full bg-saffron px-4 py-2 text-sm font-semibold text-cream ring-1 ring-saffron/70 active:translate-y-px"
              >
                Check
              </button>
            )}
          </form>
          {solved && <p className="mt-4 rounded-lg bg-turmeric/15 px-3 py-2.5 text-sm text-ink/75">{puzzle.fact}</p>}
        </div>
      )}
    </Shell>
  );
}

function StoryGame({ game, onExit }: { game: FestivalGame; onExit: () => void }) {
  const [index, setIndex] = useState(0);
  const [story, setStory] = useState<string[]>([]);
  const steps = game.storySteps;
  const done = index >= steps.length;
  const step = steps[index]!;

  return (
    <Shell game={game} score={story.length * 80} step={index} total={steps.length} onExit={onExit}>
      {done ? (
        <div className="rounded-xl bg-cream p-5 ring-1 ring-black/10">
          <p className="font-display text-xl font-semibold text-ink">Your festival story</p>
          <ol className="mt-3 space-y-2">
            {story.map((line, i) => (
              <li key={i} className="rounded-lg bg-turmeric/15 px-3 py-2 text-sm text-ink/80">
                {i + 1}. {line}
              </li>
            ))}
          </ol>
          <button
            onClick={() => {
              setIndex(0);
              setStory([]);
            }}
            className="mt-4 rounded-full bg-marigold px-5 py-2 text-sm font-semibold text-dusk-deep ring-1 ring-saffron/70 active:translate-y-px"
          >
            Tell another
          </button>
        </div>
      ) : (
        <div className="rounded-xl bg-cream p-5 ring-1 ring-black/10">
          <p className="font-display text-lg font-semibold leading-snug text-ink">{step.scene}</p>
          <div className="mt-4 grid gap-2">
            {step.choices.map((choice, i) => (
              <button
                key={i}
                onClick={() => {
                  setStory((s) => [...s, choice]);
                  setIndex((n) => n + 1);
                }}
                className="rounded-lg border border-ink/15 px-3 py-2.5 text-left text-sm font-semibold text-ink transition-colors hover:border-saffron active:translate-y-px"
              >
                {choice}
              </button>
            ))}
          </div>
          <p className="mt-4 rounded-lg bg-turmeric/15 px-3 py-2.5 text-sm text-ink/75">{step.fact}</p>
        </div>
      )}
    </Shell>
  );
}

function ScratchGuide({ game, onExit }: { game: FestivalGame; onExit: () => void }) {
  const [done, setDone] = useState<number[]>([]);
  const steps = game.scratchSteps;
  const toggle = (i: number) =>
    setDone((d) => (d.includes(i) ? d.filter((n) => n !== i) : [...d, i]));

  return (
    <Shell game={game} score={done.length * 100} step={done.length} total={steps.length} onExit={onExit}>
      <div className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-turmeric/15 px-4 py-3">
          <p className="text-sm text-cream/80">
            Open Scratch in another tab and follow the steps — tick each one as you build it.
          </p>
          <a
            href="https://scratch.mit.edu/projects/editor/"
            target="_blank"
            rel="noreferrer noopener"
            className="rounded-full bg-marigold px-4 py-1.5 text-sm font-semibold text-dusk-deep ring-1 ring-saffron/70 active:translate-y-px"
          >
            Open Scratch editor
          </a>
        </div>

        {game.scratchSprites.length > 0 && (
          <div className="rounded-xl bg-cream p-5 ring-1 ring-black/10">
            <p className="font-display text-lg font-semibold text-ink">Sprites to make</p>
            <div className="mt-3 grid gap-2.5 sm:grid-cols-2">
              {game.scratchSprites.map((sprite, i) => (
                <div key={i} className="rounded-lg border border-ink/15 px-3 py-2.5">
                  <p className="text-sm font-semibold text-ink">{sprite.name}</p>
                  <p className="mt-0.5 text-xs text-ink/65">{sprite.role}</p>
                  <p className="mt-1 text-xs text-saffron">Draw it: {sprite.costumeIdea}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        <ol className="space-y-3">
          {steps.map((step, i) => {
            const checked = done.includes(i);
            return (
              <li key={i} className="rounded-xl bg-cream p-5 ring-1 ring-black/10">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-wide text-saffron">
                      Step {i + 1} · {step.target}
                    </p>
                    <p className="font-display text-lg font-semibold leading-snug text-ink">{step.title}</p>
                  </div>
                  <button
                    onClick={() => toggle(i)}
                    className={`rounded-full px-3 py-1.5 text-sm font-semibold ring-1 active:translate-y-px ${
                      checked ? "bg-teal text-cream ring-teal/70" : "border border-ink/20 text-ink ring-transparent"
                    }`}
                  >
                    {checked ? "Built ✓" : "Mark built"}
                  </button>
                </div>
                <div className="mt-3 space-y-1.5">
                  {step.blocks.map((block, b) => (
                    <p
                      key={b}
                      className="rounded-lg bg-dusk-deep px-3 py-2 font-mono text-xs text-marigold"
                      style={{ marginLeft: `${Math.min(b, 3) * 10}px` }}
                    >
                      {block}
                    </p>
                  ))}
                </div>
                <p className="mt-3 rounded-lg bg-turmeric/15 px-3 py-2 text-sm text-ink/75">{step.why}</p>
              </li>
            );
          })}
        </ol>

        {game.scratchExtras.length > 0 && (
          <div className="rounded-xl bg-cream p-5 ring-1 ring-black/10">
            <p className="font-display text-lg font-semibold text-ink">Try next</p>
            <ul className="mt-2 space-y-1.5">
              {game.scratchExtras.map((extra, i) => (
                <li key={i} className="text-sm text-ink/70">
                  · {extra}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </Shell>
  );
}

const DIRS = [
  [0, 1],
  [1, 0],
  [1, 1],
  [1, -1],
  [0, -1],
  [-1, 0],
  [-1, -1],
  [-1, 1],
] as const;

const LETTERS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";

function buildGrid(words: string[], size: number) {
  const grid: (string | null)[][] = Array.from({ length: size }, () => Array(size).fill(null));
  const placed: { word: string; cells: string[] }[] = [];

  for (const word of words) {
    let done = false;
    for (let attempt = 0; attempt < 250 && !done; attempt++) {
      const dir = DIRS[Math.floor(Math.random() * DIRS.length)]!;
      const row = Math.floor(Math.random() * size);
      const col = Math.floor(Math.random() * size);
      const endRow = row + dir[0] * (word.length - 1);
      const endCol = col + dir[1] * (word.length - 1);
      if (endRow < 0 || endRow >= size || endCol < 0 || endCol >= size) continue;
      let fits = true;
      for (let i = 0; i < word.length; i++) {
        const cell = grid[row + dir[0] * i]![col + dir[1] * i]!;
        if (cell !== null && cell !== word[i]) {
          fits = false;
          break;
        }
      }
      if (!fits) continue;
      const cells: string[] = [];
      for (let i = 0; i < word.length; i++) {
        const r = row + dir[0] * i;
        const c = col + dir[1] * i;
        grid[r]![c] = word[i]!;
        cells.push(`${r}-${c}`);
      }
      placed.push({ word, cells });
      done = true;
    }
  }

  const letters = grid.map((row) =>
    row.map((cell) => cell ?? LETTERS[Math.floor(Math.random() * LETTERS.length)]!),
  );
  return { letters, placed };
}

function WordSearchGame({ game, onExit }: { game: FestivalGame; onExit: () => void }) {
  const twoPlayer = game.playerCount === 2;
  const size = Math.min(8, Math.max(4, game.gridSize || 6));
  const [seed, setSeed] = useState(0);
  const { letters, placed } = useMemo(
    () => buildGrid(game.searchWords.map((w) => w.word.toUpperCase()), size),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [game, size, seed],
  );
  const [found, setFound] = useState<string[]>([]);
  const [start, setStart] = useState<string | null>(null);
  const [scores, setScores] = useState<[number, number]>([0, 0]);
  const [turn, setTurn] = useState(0);
  const [note, setNote] = useState<string | null>(null);
  const score = scores[0] + scores[1];

  const foundCells = new Set(placed.filter((p) => found.includes(p.word)).flatMap((p) => p.cells));

  const pick = (key: string) => {
    if (!start) {
      setStart(key);
      return;
    }
    if (start === key) {
      setStart(null);
      return;
    }
    const [r1, c1] = start.split("-").map(Number) as [number, number];
    const [r2, c2] = key.split("-").map(Number) as [number, number];
    const dr = Math.sign(r2 - r1);
    const dc = Math.sign(c2 - c1);
    const len = Math.max(Math.abs(r2 - r1), Math.abs(c2 - c1)) + 1;
    const straight =
      r1 === r2 || c1 === c2 || Math.abs(r2 - r1) === Math.abs(c2 - c1);
    setStart(null);
    if (!straight) return;
    let text = "";
    for (let i = 0; i < len; i++) text += letters[r1 + dr * i]![c1 + dc * i]!;
    const reversed = [...text].reverse().join("");
    const hit = placed.find(
      (p) => !found.includes(p.word) && (p.word === text || p.word === reversed),
    );
    if (hit) {
      setFound((f) => [...f, hit.word]);
      setScores((s) => (turn === 0 ? [s[0] + 130, s[1]] : [s[0], s[1] + 130]));
      setNote(game.searchWords.find((w) => w.word.toUpperCase() === hit.word)?.fact ?? null);
    } else if (twoPlayer) {
      setTurn((t) => 1 - t);
    }
  };

  const total = placed.length;

  return (
    <Shell
      game={game}
      score={score}
      scores={
        twoPlayer
          ? [
              { label: "Player 1", value: scores[0], active: turn === 0 },
              { label: "Player 2", value: scores[1], active: turn === 1 },
            ]
          : undefined
      }
      step={found.length}
      total={total}
      onExit={onExit}
    >
      {total > 0 && found.length === total ? (
        <Finished
          score={score}
          result={quizResult(scores, twoPlayer)}
          onRestart={() => {
            setSeed((s) => s + 1);
            setFound([]);
            setScores([0, 0]);
            setTurn(0);
            setNote(null);
            setStart(null);
          }}
        />
      ) : (
        <div className="grid gap-4 lg:grid-cols-[auto_1fr]">
          <div className="rounded-xl bg-cream p-3 ring-1 ring-black/10">
            <div
              className="grid gap-1"
              style={{ gridTemplateColumns: `repeat(${size}, minmax(0, 1fr))` }}
            >
              {letters.map((row, r) =>
                row.map((letter, c) => {
                  const key = `${r}-${c}`;
                  const isFound = foundCells.has(key);
                  const isStart = start === key;
                  return (
                    <button
                      key={key}
                      onClick={() => pick(key)}
                      className={`aspect-square min-w-9 rounded-md text-sm font-semibold uppercase ring-1 transition-colors active:translate-y-px ${
                        isFound
                          ? "bg-teal text-cream ring-teal/70"
                          : isStart
                            ? "bg-saffron text-cream ring-saffron/70"
                            : "bg-cream text-ink ring-ink/15 hover:bg-turmeric/20"
                      }`}
                    >
                      {letter}
                    </button>
                  );
                }),
              )}
            </div>
            <p className="mt-2 text-center text-xs text-ink/55">
              Tap the first letter, then the last letter of a word.
            </p>
          </div>

          <div className="rounded-xl bg-cream p-4 ring-1 ring-black/10">
            <p className="font-display text-lg font-semibold text-ink">Words to find</p>
            <ul className="mt-3 space-y-2">
              {placed.map((p) => {
                const entry = game.searchWords.find((w) => w.word.toUpperCase() === p.word);
                const isFound = found.includes(p.word);
                return (
                  <li key={p.word} className="text-sm">
                    <span
                      className={`font-semibold tracking-widest ${
                        isFound ? "text-teal line-through" : "text-ink"
                      }`}
                    >
                      {p.word}
                    </span>
                    {entry?.hint && <span className="ml-2 text-xs text-ink/55">{entry.hint}</span>}
                  </li>
                );
              })}
            </ul>
            {note && <p className="mt-4 rounded-lg bg-turmeric/15 px-3 py-2.5 text-sm text-ink/75">{note}</p>}
          </div>
        </div>
      )}
    </Shell>
  );
}

export function GamePlayer({ game, onExit }: { game: FestivalGame; onExit: () => void }) {
  if (game.gameKind === "quiz") return <QuizGame game={game} onExit={onExit} />;
  if (game.gameKind === "memory") return <MemoryGame game={game} onExit={onExit} />;
  if (game.gameKind === "word") return <WordGame game={game} onExit={onExit} />;
  if (game.gameKind === "wordsearch") return <WordSearchGame game={game} onExit={onExit} />;
  if (game.gameKind === "scratch") return <ScratchGuide game={game} onExit={onExit} />;
  return <StoryGame game={game} onExit={onExit} />;
}
