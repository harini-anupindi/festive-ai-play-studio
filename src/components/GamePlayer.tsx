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
  step,
  total,
  onExit,
  children,
}: {
  game: FestivalGame;
  score: number;
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
          <div className="text-right">
            <p className="text-[11px] uppercase tracking-wide text-cream/50">Score</p>
            <p className="font-display text-2xl font-semibold text-marigold">{score}</p>
          </div>
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

function Finished({ score, onRestart }: { score: number; onRestart: () => void }) {
  return (
    <div className="rounded-xl bg-cream p-6 text-center ring-1 ring-black/10">
      <p className="font-display text-2xl font-semibold text-ink">Well played!</p>
      <p className="mt-1 text-sm text-ink/60">You finished with {score} points.</p>
      <button
        onClick={onRestart}
        className="mt-4 rounded-full bg-marigold px-5 py-2 text-sm font-semibold text-dusk-deep ring-1 ring-saffron/70 active:translate-y-px"
      >
        Play again
      </button>
    </div>
  );
}

function QuizGame({ game, onExit }: { game: FestivalGame; onExit: () => void }) {
  const [index, setIndex] = useState(0);
  const [picked, setPicked] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const questions = game.quizQuestions;
  const done = index >= questions.length;
  const q = questions[index]!;

  return (
    <Shell game={game} score={score} step={index} total={questions.length} onExit={onExit}>
      {done ? (
        <Finished
          score={score}
          onRestart={() => {
            setIndex(0);
            setScore(0);
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
                    if (isCorrect) setScore((s) => s + 100);
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
  const [score, setScore] = useState(0);
  const [note, setNote] = useState<string | null>(null);

  const flip = (tileId: string, pairId: number) => {
    if (flipped.includes(tileId) || matched.includes(pairId) || flipped.length === 2) return;
    const next = [...flipped, tileId];
    setFlipped(next);
    if (next.length === 2) {
      const first = tiles.find((t) => t.id === next[0])!;
      const second = tiles.find((t) => t.id === next[1])!;
      if (first.pairId === second.pairId) {
        setMatched((m) => [...m, first.pairId]);
        setScore((s) => s + 120);
        setNote(game.memoryPairs[first.pairId]!.fact);
        setFlipped([]);
      } else {
        setTimeout(() => setFlipped([]), 900);
      }
    }
  };

  const total = game.memoryPairs.length;

  return (
    <Shell game={game} score={score} step={matched.length} total={total} onExit={onExit}>
      {matched.length === total ? (
        <Finished
          score={score}
          onRestart={() => {
            setSeed((s) => s + 1);
            setMatched([]);
            setFlipped([]);
            setScore(0);
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

export function GamePlayer({ game, onExit }: { game: FestivalGame; onExit: () => void }) {
  if (game.gameKind === "quiz") return <QuizGame game={game} onExit={onExit} />;
  if (game.gameKind === "memory") return <MemoryGame game={game} onExit={onExit} />;
  if (game.gameKind === "word") return <WordGame game={game} onExit={onExit} />;
  if (game.gameKind === "scratch") return <ScratchGuide game={game} onExit={onExit} />;
  return <StoryGame game={game} onExit={onExit} />;
}
