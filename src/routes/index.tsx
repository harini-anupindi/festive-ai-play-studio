import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { generateGame } from "@/lib/games.functions";
import type { FestivalGame, GameKind } from "@/lib/game-types";
import { GAME_KIND_LABEL } from "@/lib/game-types";
import { GamePlayer } from "@/components/GamePlayer";
import quizArt from "@/assets/game-quiz.jpg";
import memoryArt from "@/assets/game-memory.jpg";
import wordArt from "@/assets/game-word.jpg";
import storyArt from "@/assets/game-story.jpg";
import scratchArt from "@/assets/game-scratch.jpg";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Utsav Studio — AI festival games for kids" },
      {
        name: "description",
        content:
          "Describe a festival like Ganesh Chaturthi and Utsav Studio builds playable, educational mini-games in seconds.",
      },
      { property: "og:title", content: "Utsav Studio — AI festival games for kids" },
      {
        property: "og:description",
        content:
          "Describe a festival like Ganesh Chaturthi and Utsav Studio builds playable, educational mini-games in seconds.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

const KIND_ART: Record<GameKind, string> = {
  quiz: quizArt,
  memory: memoryArt,
  word: wordArt,
  story: storyArt,
  scratch: scratchArt,
};

const KINDS: GameKind[] = ["quiz", "memory", "word", "story", "scratch"];
const AGES = ["Ages 5–8", "Ages 8–12", "Ages 12–15"];

function Lanterns() {
  const lamps = [
    { delay: "0s", stem: "h-3", size: "size-3", tone: "bg-marigold/50 shadow-marigold/50" },
    { delay: ".6s", stem: "h-4", size: "size-2.5", tone: "bg-saffron/60 shadow-saffron/40" },
    { delay: "1.2s", stem: "h-2", size: "size-3", tone: "bg-turmeric/50 shadow-turmeric/50" },
    { delay: ".3s", stem: "h-5", size: "size-2.5", tone: "bg-marigold/60 shadow-marigold/40" },
    { delay: ".9s", stem: "h-3", size: "size-3", tone: "bg-saffron/50 shadow-saffron/40" },
    { delay: "1.5s", stem: "h-2", size: "size-2.5", tone: "bg-turmeric/60 shadow-turmeric/50" },
  ];
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-x-0 top-0 z-30 flex justify-center gap-4 overflow-hidden"
    >
      {lamps.map((lamp, i) => (
        <span key={i} className="animate-floaty flex flex-col items-center" style={{ animationDelay: lamp.delay }}>
          <span className={`${lamp.stem} w-px bg-marigold/40`} />
          <span className={`block ${lamp.size} rounded-full shadow-[0_0_12px_2px] ${lamp.tone}`} />
        </span>
      ))}
    </div>
  );
}

function GameCard({
  game,
  featured,
  onPlay,
  delay,
}: {
  game: FestivalGame;
  featured: boolean;
  onPlay: () => void;
  delay: number;
}) {
  return (
    <article
      className={`rise flex flex-col rounded-2xl p-3 ring-1 active:translate-y-px ${
        featured ? "bg-marigold ring-saffron/70" : "bg-cream ring-black/10"
      }`}
      style={{ animationDelay: `${delay}s` }}
    >
      <img
        src={KIND_ART[game.gameKind]}
        alt={game.title}
        loading="lazy"
        width={640}
        height={512}
        className="mb-3 aspect-[4/3] w-full rounded-xl object-cover outline-1 -outline-offset-1 outline-black/5"
      />
      <span
        className={`self-start rounded-md px-1.5 py-0.5 text-[11px] font-semibold ${
          featured ? "bg-dusk-deep/15 text-dusk-deep" : "bg-saffron/15 text-saffron"
        }`}
      >
        {GAME_KIND_LABEL[game.gameKind]}
      </span>
      <h3
        className={`mt-2 font-display text-[15px] font-semibold leading-snug ${featured ? "text-dusk-deep" : "text-ink"}`}
      >
        {game.title}
      </h3>
      <p className={`mt-1 text-xs leading-relaxed text-pretty ${featured ? "text-dusk-deep/70" : "text-ink/60"}`}>
        {game.tagline}
      </p>
      <div
        className={`mt-2 flex flex-wrap items-center gap-3 text-[11px] font-medium ${
          featured ? "text-dusk-deep/60" : "text-ink/55"
        }`}
      >
        <span>{game.ageRange}</span>
        <span>{game.playerCount === 2 ? "2 players" : "1 player"}</span>
        <span>{game.festival}</span>
      </div>
      <button
        onClick={onPlay}
        className={`mt-3 rounded-lg py-1.5 text-sm font-semibold ring-1 active:translate-y-px ${
          featured
            ? "bg-dusk-deep text-marigold ring-dusk-deep"
            : "bg-marigold text-dusk-deep ring-saffron/70"
        }`}
      >
        {game.gameKind === "scratch" ? "Open guide" : "Play"}
      </button>
    </article>
  );
}

function Index() {
  const [prompt, setPrompt] = useState(
    "A shy elephant who loves marigolds and wants to plan the Ganesh Chaturthi immersion for the whole lane.",
  );
  const [kind, setKind] = useState<GameKind>("memory");
  const [age, setAge] = useState(AGES[1]!);
  const [players, setPlayers] = useState<1 | 2>(1);
  const [games, setGames] = useState<FestivalGame[]>([]);
  const [playing, setPlaying] = useState<FestivalGame | null>(null);
  const [plays, setPlays] = useState<Record<string, number>>({});

  const callGenerate = useServerFn(generateGame);
  const mutation = useMutation({
    mutationFn: (input: { prompt: string; gameKind: GameKind; ageRange: string; playerCount: 1 | 2 }) =>
      callGenerate({ data: input }),
    onSuccess: (game) => {
      setGames((g) => [game, ...g]);
      setPlaying(game);
    },
  });

  const play = (game: FestivalGame) => {
    setPlays((p) => ({ ...p, [game.id]: (p[game.id] ?? 0) + 1 }));
    setPlaying(game);
  };

  return (
    <div className="relative min-h-screen bg-dusk text-cream">
      <div aria-hidden="true" className="pointer-events-none fixed top-4 right-4 z-40 hidden lg:block">
        <div className="size-24 rounded-full border border-marigold/40" />
        <div className="absolute inset-3 rounded-full border border-saffron/30" />
        <div className="absolute inset-6 rounded-full border border-turmeric/30" />
        <div className="absolute inset-[44%] size-2 rounded-full bg-marigold/70" />
      </div>
      <Lanterns />

      <header className="relative z-20 border-b border-marigold/15">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-3">
          <div className="flex items-center gap-2.5">
            <span className="grid size-8 place-items-center rounded-md bg-marigold font-display text-lg font-semibold text-dusk-deep">
              U
            </span>
            <span className="font-display text-lg font-semibold tracking-tight">Utsav Studio</span>
            <span className="hidden rounded-full border border-marigold/30 px-2 py-0.5 text-[11px] font-medium tracking-wide text-marigold/80 sm:inline">
              Festival games
            </span>
          </div>
          <nav className="flex items-center gap-5 text-sm text-cream/70">
            <a href="#studio" className="transition-colors hover:text-cream">
              Studio
            </a>
            <a href="#games" className="transition-colors hover:text-cream">
              Games
            </a>
          </nav>
        </div>
      </header>

      <main className="relative mx-auto max-w-6xl px-5 pt-10 pb-16">
        <section id="studio" className="rise flex flex-col gap-8 lg:flex-row lg:items-end">
          <div className="lg:max-w-[46ch]">
            <p className="mb-3 text-xs font-semibold tracking-[0.2em] text-saffron uppercase">
              Festival game workshop
            </p>
            <h1 className="max-w-[16ch] font-display text-4xl leading-none font-semibold tracking-tight text-balance sm:text-5xl">
              Turn a festival into a game your kids will actually play.
            </h1>
            <p className="mt-4 max-w-[46ch] text-base leading-relaxed text-pretty text-cream/70">
              Describe the mood, rituals and what you want them to learn. Utsav weaves it into a warm, playable
              festival game in seconds.
            </p>
          </div>

          <div className="flex-1 lg:pl-6">
            <div className="rounded-2xl bg-cream p-4 ring-1 ring-black/10">
              <label
                htmlFor="theme"
                className="mb-2 block text-xs font-semibold tracking-[0.15em] text-ink/60 uppercase"
              >
                Your prompt
              </label>
              <textarea
                id="theme"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                rows={3}
                placeholder="e.g. Ganesh Chaturthi modak traditions for curious 8-year-olds"
                className="w-full resize-none rounded-xl bg-dusk-deep/90 p-3 font-display text-[15px] leading-snug text-cream outline-none placeholder:text-cream/40"
              />
              <div className="mt-3 flex flex-wrap gap-2">
                {KINDS.map((k) => (
                  <button
                    key={k}
                    onClick={() => setKind(k)}
                    className={`rounded-full px-3 py-1.5 text-sm font-semibold ring-1 active:translate-y-px ${
                      kind === k
                        ? "bg-saffron text-cream ring-saffron/70"
                        : "border border-ink/20 text-ink ring-transparent"
                    }`}
                  >
                    {GAME_KIND_LABEL[k]}
                  </button>
                ))}
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                {AGES.map((a) => (
                  <button
                    key={a}
                    onClick={() => setAge(a)}
                    className={`rounded-full px-3 py-1 text-xs font-semibold ring-1 active:translate-y-px ${
                      age === a ? "bg-teal text-cream ring-teal/70" : "border border-ink/20 text-ink/70 ring-transparent"
                    }`}
                  >
                    {a}
                  </button>
                ))}
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                {([1, 2] as const).map((p) => (
                  <button
                    key={p}
                    onClick={() => setPlayers(p)}
                    className={`rounded-full px-3 py-1 text-xs font-semibold ring-1 active:translate-y-px ${
                      players === p
                        ? "bg-dusk-deep text-marigold ring-dusk-deep"
                        : "border border-ink/20 text-ink/70 ring-transparent"
                    }`}
                  >
                    {p === 1 ? "1 player" : "2 players · take turns"}
                  </button>
                ))}
              </div>
              <div className="mt-4 flex items-center justify-between gap-3">
                <span className="text-xs text-ink/50">
                  {age} · {players === 2 ? "2 players" : "1 player"}
                </span>
                <button
                  disabled={mutation.isPending || prompt.trim().length === 0}
                  onClick={() => mutation.mutate({ prompt, gameKind: kind, ageRange: age, playerCount: players })}
                  className="rounded-full bg-marigold px-4 py-2 text-sm font-semibold text-dusk-deep ring-1 ring-saffron/70 active:translate-y-px disabled:opacity-60"
                >
                  {mutation.isPending ? "Weaving…" : "Generate game"}
                </button>
              </div>
            </div>
          </div>
        </section>

        {mutation.isPending && (
          <section className="rise mt-8 flex items-center gap-4 rounded-2xl border border-marigold/25 bg-dusk-deep/60 px-4 py-3">
            <span className="relative flex size-9 shrink-0 items-center justify-center">
              <span className="animate-glow absolute inset-0 rounded-full bg-marigold/30" />
              <span className="relative grid size-9 place-items-center rounded-full bg-marigold font-display text-lg font-semibold text-dusk-deep">
                G
              </span>
            </span>
            <div className="flex-1">
              <p className="text-sm font-semibold text-cream">
                Weaving a {GAME_KIND_LABEL[kind].toLowerCase()} for {age.toLowerCase()}…
              </p>
              <p className="text-xs text-cream/55">Shaping rounds · setting a learning goal · tuning difficulty</p>
            </div>
          </section>
        )}

        {mutation.isError && (
          <p className="mt-8 rounded-2xl border border-saffron/40 bg-saffron/10 px-4 py-3 text-sm text-cream">
            {(mutation.error as Error).message}
          </p>
        )}

        {playing && (
          <section className="rise mt-10">
            <GamePlayer key={playing.id} game={playing} onExit={() => setPlaying(null)} />
          </section>
        )}

        <section id="games" className="mt-9">
          <div className="mb-4 flex items-end justify-between">
            <div>
              <h2 className="font-display text-xl font-semibold tracking-tight text-balance">
                Fresh from the courtyard
              </h2>
              <p className="text-sm text-cream/55">
                {games.length === 0
                  ? "Your generated games will appear here"
                  : `${games.length} game${games.length > 1 ? "s" : ""} generated this session`}
              </p>
            </div>
          </div>

          {games.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-marigold/30 px-5 py-12 text-center text-sm text-cream/55">
              Describe a festival above — Ganesh Chaturthi, Diwali, Onam — and press Generate game.
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4">
              {games.map((game, i) => (
                <GameCard
                  key={game.id}
                  game={game}
                  featured={i === 0}
                  delay={0.05 * (i + 1)}
                  onPlay={() => play(game)}
                />
              ))}
            </div>
          )}
        </section>

        {games.length > 0 && (
          <section className="rise mt-10">
            <div className="mb-4 flex items-end justify-between">
              <h2 className="font-display text-xl font-semibold tracking-tight text-balance">Your game library</h2>
            </div>
            <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-3">
              {games.map((game) => (
                <button
                  key={game.id}
                  onClick={() => play(game)}
                  className="flex items-center gap-3 rounded-xl bg-cream/95 p-3 text-left ring-1 ring-black/10 active:translate-y-px"
                >
                  <span className="grid size-10 shrink-0 place-items-center rounded-lg bg-saffron/20 font-display text-base font-semibold text-saffron">
                    {game.title.charAt(0)}
                  </span>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-ink">{game.title}</p>
                    <p className="text-xs text-ink/55">
                      {game.ageRange} · Played {plays[game.id] ?? 0}×
                    </p>
                  </div>
                </button>
              ))}
            </div>
          </section>
        )}
      </main>
    </div>
  );
}
