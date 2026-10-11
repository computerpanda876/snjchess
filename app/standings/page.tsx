// Standings, pairings, and rosters, built from the WinTD files in data/results/.
// Each season has its own folder there and its own tab on this page.
// This page is generated when the site is deployed, so it changes when you push
// a new file.

import type { Metadata } from "next";
import { league } from "@/data/league";
import { Tabs } from "@/app/tabs";
import { loadResults, roundsCompleted, standings, type Team, type TeamRound } from "@/lib/wintd";

export const metadata: Metadata = { title: "Standings and pairings" };

// 2 -> "2", 3.5 -> "3.5"
const pts = (value: number) => (Number.isInteger(value) ? String(value) : value.toFixed(1));

const th = "px-3 py-3 text-left text-sm font-semibold whitespace-nowrap";
const td = "px-3 py-4 align-top whitespace-nowrap";

// One round's cell in the standings table: "W 3.5–0.5" over the opponent's name.
function RoundCell({
  round,
  index,
  previous,
  teams,
}: {
  round: TeamRound;
  index: number; // 0 for round 1, 1 for round 2, ...
  previous: number; // match points before this round
  teams: Team[];
}) {
  if (round.total === null && round.opponent === null) return <span className="text-muted">–</span>;

  const opponent = teams.find((team) => team.number === round.opponent);
  if (round.opponent === null) {
    const gained = (round.total ?? 0) - previous;
    return <span className="text-muted">{gained > 0 ? `Bye, ${pts(gained)}` : "No match"}</span>;
  }
  if (round.total === null) {
    return (
      <>
        <span className="text-muted">Plays</span>
        <span className="block text-sm text-muted">{opponent?.name}</span>
      </>
    );
  }

  const gained = round.total - previous;
  const letter = gained >= 1 ? "W" : gained > 0 ? "D" : "L";
  // The opponent's own row has the board points they scored in the same round.
  const theirRound = opponent?.rounds[index];
  return (
    <>
      <span className="font-semibold tabular-nums">
        {letter} {pts(round.gamePoints ?? 0)}
        {theirRound && `–${pts(theirRound.gamePoints ?? 0)}`}
      </span>
      <span className="block text-sm text-muted">{opponent?.name}</span>
    </>
  );
}

function Original({ file, raw }: { file: string; raw: string }) {
  return (
    <details className="mt-6 text-sm">
      <summary className="cursor-pointer text-muted hover:text-accent">Original WinTD file ({file})</summary>
      <pre className="mt-4 overflow-x-auto bg-wash p-5 text-xs leading-relaxed">{raw}</pre>
    </details>
  );
}

export default function StandingsPage() {
  return (
    <>
      <section className="pt-16 pb-10 sm:pt-24">
        <h1 className="text-5xl leading-[0.95] font-extrabold tracking-tight sm:text-7xl">Standings</h1>
      </section>
      <Tabs
        name="Seasons"
        labels={league.seasons.map((season) => season.name)}
        panels={league.seasons.map((season) => (
          <Season key={season.folder} folder={season.folder} />
        ))}
      />
    </>
  );
}

// Everything for one season: standings, pairings by round, and rosters.
function Season({ folder }: { folder: string }) {
  const { chart, sheets, unreadable } = loadResults(folder);
  const rows = chart ? standings(chart) : [];
  const completed = chart ? roundsCompleted(chart) : 0;

  return (
    <>
      <section className="pt-10 pb-12">
        <p className="text-lg text-muted">
          {chart
            ? completed > 0
              ? `${chart.title.replace(/\s*--\s*/, ", ")}. After round ${completed}.`
              : `${chart.title.replace(/\s*--\s*/, ", ")}. No rounds played yet.`
            : "Standings appear here after the first round."}
        </p>
        {chart && (
          <nav className="mt-8 flex flex-wrap gap-x-6 gap-y-2 text-sm font-semibold">
            <a href="#standings" className="underline underline-offset-4 hover:text-accent">
              Standings
            </a>
            <a href="#pairings" className="underline underline-offset-4 hover:text-accent">
              Pairings
            </a>
            <a href="#rosters" className="underline underline-offset-4 hover:text-accent">
              Rosters
            </a>
          </nav>
        )}
      </section>

      {/* Standings */}
      {chart && (
        <section id="standings" className="scroll-mt-8 border-t border-ink py-12">
          <h2 className="text-2xl font-bold tracking-tight">Team standings</h2>
          <div className="mt-6 overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b border-ink">
                  <th className={th}>Place</th>
                  <th className={th}>Team</th>
                  <th className={`${th} text-right`}>Match pts</th>
                  <th className={`${th} text-right`}>Game pts</th>
                  <th className={`${th} text-right`}>Rating</th>
                  {Array.from({ length: chart.roundCount }, (_, i) => (
                    <th key={i} className={th}>
                      Round {i + 1}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.team.number} className="border-b border-line">
                    <td className={`${td} tabular-nums text-muted`}>{row.place}</td>
                    <td className="min-w-36 px-3 py-4 align-top font-semibold sm:whitespace-nowrap">
                      {row.team.name}
                      <span className="block text-sm font-normal text-muted tabular-nums">
                        {row.wins}–{row.draws}–{row.losses}
                      </span>
                    </td>
                    <td className={`${td} text-right text-xl font-extrabold tabular-nums text-accent`}>
                      {pts(row.matchPoints)}
                    </td>
                    <td className={`${td} text-right tabular-nums`}>{pts(row.gamePoints)}</td>
                    <td className={`${td} text-right tabular-nums text-muted`}>
                      {Math.round(row.team.rating)}
                    </td>
                    {row.team.rounds.map((round, i) => (
                      <td key={i} className={td}>
                        <RoundCell
                          round={round}
                          index={i}
                          previous={row.team.rounds
                            .slice(0, i)
                            .reduce<number>((last, r) => r.total ?? last, 0)}
                          teams={chart.teams}
                        />
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="mt-4 text-sm text-muted">
            Sorted by match points, then game points. The line under each team is wins, draws, losses.
          </p>
          <Original file={chart.file} raw={chart.raw} />
        </section>
      )}

      {/* Pairings */}
      <section id="pairings" className="scroll-mt-8 border-t border-ink py-12">
        <h2 className="text-2xl font-bold tracking-tight">Pairings</h2>
        {sheets.length === 0 && (
          <p className="mt-6 text-muted">Pairings are posted here before each round.</p>
        )}
        {sheets.length > 0 && (
          <div className="mt-4">
            <Tabs
              name="Rounds"
              labels={sheets.map((sheet) => `Round ${sheet.round}`)}
              initial={sheets.length - 1}
              panels={sheets.map((sheet) => (
                <div key={sheet.round}>
                  <div className="mt-3 overflow-x-auto">
                    <table className="w-full border-collapse">
                      <thead>
                        <tr className="border-b border-ink">
                          <th className={th}>Board</th>
                          <th className={th}>White</th>
                          <th className={th}>Black</th>
                        </tr>
                      </thead>
                      <tbody>
                        {sheet.pairings.map((pairing) => (
                          <tr key={pairing.board} className="border-b border-line">
                            <td className={`${td} tabular-nums text-muted`}>{pairing.board}</td>
                            {[pairing.white, pairing.black].map((side, i) => (
                              <td key={i} className="px-3 py-4 align-top">
                                <span className="font-semibold">{side.name}</span>
                                {side.result && (
                                  <span className="ml-3 font-extrabold text-accent">{side.result}</span>
                                )}
                                <span className="block text-sm text-muted tabular-nums">
                                  {pts(side.score)} pts, rated {side.rating}
                                </span>
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <Original file={sheet.file} raw={sheet.raw} />
                </div>
              ))}
            />
          </div>
        )}
      </section>

      {/* Rosters */}
      {chart && chart.rosters.length > 0 && (
        <section id="rosters" className="scroll-mt-8 border-t border-ink py-12">
          <h2 className="text-2xl font-bold tracking-tight">Rosters</h2>
          <div className="mt-8 grid gap-x-12 gap-y-12 md:grid-cols-2">
            {chart.rosters.map((roster) => (
              <div key={roster.number}>
                <h3 className="flex items-baseline justify-between border-b border-ink pb-2 font-bold">
                  {roster.name}
                  <span className="text-sm font-normal text-muted tabular-nums">avg {roster.rating}</span>
                </h3>
                <table className="w-full border-collapse text-sm">
                  <tbody>
                    {roster.players.map((player) => (
                      <tr key={player.number} className="border-b border-line">
                        <td className="w-20 py-2.5 text-muted">{player.slot}</td>
                        <td className="py-2.5">{player.name}</td>
                        <td className="py-2.5 text-right tabular-nums text-muted">
                          {player.rating ?? "Unrated"}
                        </td>
                        <td className="w-20 py-2.5 text-right tabular-nums">
                          {player.games > 0 ? `${pts(player.score)} / ${player.games}` : ""}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ))}
          </div>
          <p className="mt-8 text-sm text-muted">The last column is points scored out of games played.</p>
        </section>
      )}

      {/* Files the parser could not read are shown as they are, so nothing goes missing. */}
      {unreadable.map((item) => (
        <section key={item.file} className="border-t border-ink py-12">
          <h2 className="text-2xl font-bold tracking-tight">{item.file}</h2>
          <pre className="mt-6 overflow-x-auto bg-wash p-5 text-xs leading-relaxed">{item.raw}</pre>
        </section>
      ))}
    </>
  );
}
