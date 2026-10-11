// Reads the text files WinTD saves (pairing sheets and wall charts) and turns
// them into plain data the pages can put in tables.
//
// The files live in data/results/<season folder>/. Any .txt file there is
// picked up automatically, whatever it is called. What a file is gets decided by its
// first lines: "Pairing Sheet" or "Wall Chart".

import fs from "node:fs";
import path from "node:path";

// ---------- Types ----------

export type PairingSide = {
  name: string;
  score: number;
  rating: number;
  result: string | null; // filled in only if the sheet has results typed in
};

export type Pairing = { board: number; white: PairingSide; black: PairingSide };

export type PairingSheet = {
  round: number;
  title: string;
  pairings: Pairing[];
  raw: string;
  file: string;
};

export type TeamRound = {
  color: "W" | "B" | null;
  opponent: number | null; // the opponent's number in the wall chart
  gamePoints: number | null; // board points this team scored in the match
  total: number | null; // match points after this round; null = not played yet
};

export type Team = {
  number: number;
  name: string;
  rating: number;
  rounds: TeamRound[];
};

export type Player = {
  number: number;
  name: string;
  rating: number | null; // null = unrated
  slot: string; // "Board 1", "Alt 1", ...
  score: number;
  games: number;
};

export type Roster = { number: number; name: string; rating: number; players: Player[] };

export type WallChart = {
  title: string;
  roundCount: number;
  teams: Team[];
  rosters: Roster[];
  raw: string;
  file: string;
};

export type Standing = {
  place: number;
  team: Team;
  matchPoints: number;
  gamePoints: number;
  wins: number;
  draws: number;
  losses: number;
};

// ---------- Small helpers ----------

// "F1.0" -> 1, " 2.0 " -> 2, "" -> null
function num(text: string): number | null {
  const match = text.match(/-?\d+(\.\d+)?/);
  return match ? Number(match[0]) : null;
}

// A wall chart row looks like:  "  1. Name      | 1471.00 |  B4,4.0  |  ---  |"
// Splitting on "|" gives the name part first, then one cell per column.
function cells(line: string): string[] {
  const parts = line.split("|");
  parts.pop(); // whatever follows the last "|" (nothing)
  return parts;
}

// ---------- Pairing sheets ----------

const RESULT = String.raw`(?:(_+|[01](?:\.[05])?|½)\s+)?`;
const SIDE = String.raw`(.+?)\s*\(\s*(\d+(?:\.\d+)?)\s*,\s*(\d+)\s*\)`;
const PAIRING_ROW = new RegExp(String.raw`^\s*(\d+)\.\s+${RESULT}${SIDE}\s+${RESULT}${SIDE}\s*$`);

export function parsePairings(raw: string, file = ""): PairingSheet | null {
  const lines = raw.split(/\r?\n/);
  const header = lines.find((line) => line.includes("Pairing Sheet")) ?? "";
  const round = header.match(/Round\s+(\d+)/i);
  if (!round) return null;

  const pairings: Pairing[] = [];
  for (const line of lines) {
    const m = line.match(PAIRING_ROW);
    if (!m) continue;
    const side = (result: string | undefined, name: string, score: string, rating: string) => ({
      name: name.trim(),
      score: Number(score),
      rating: Number(rating),
      result: result && !result.startsWith("_") ? result : null,
    });
    pairings.push({
      board: Number(m[1]),
      white: side(m[2], m[3], m[4], m[5]),
      black: side(m[6], m[7], m[8], m[9]),
    });
  }

  return {
    round: Number(round[1]),
    title: header.split(/\s{2,}/)[0].trim(),
    pairings,
    raw,
    file,
  };
}

// ---------- Wall charts ----------

export function parseWallChart(raw: string, file = ""): WallChart | null {
  if (!raw.includes("Wall Chart")) return null;
  const lines = raw.split(/\r?\n/);

  const teams: Team[] = [];
  const rosters: Roster[] = [];
  let title = "";
  let mode: "team" | "individual" | null = null;
  let lastTeam: Team | null = null;
  let lastPlayer: Player | null = null;

  for (const line of lines) {
    // Page headers. A long file repeats them on every page.
    if (line.includes("Wall Chart")) {
      mode = line.includes("Individual Wall Chart") ? "individual" : "team";
      if (!title) title = line.split(/\s{2,}/)[0].trim();
      continue;
    }
    if (mode === null) continue;

    // In the individual chart, each team starts with "3. Back Rankers(1329)".
    const section = line.match(/^(\d+)\.\s+(.+?)\s*\((\d+)\)\s*$/);
    if (mode === "individual" && section) {
      rosters.push({
        number: Number(section[1]),
        name: section[2],
        rating: Number(section[3]),
        players: [],
      });
      continue;
    }

    if (!line.includes("|")) continue;
    const [first, rate, ...rounds] = cells(line);
    const numbered = first.match(/^\s*(\d+)\.\s+(.+?)\s*$/);

    if (mode === "team") {
      if (numbered) {
        // First line of a team: color + opponent number, then game points.
        lastTeam = {
          number: Number(numbered[1]),
          name: numbered[2],
          rating: num(rate) ?? 0,
          rounds: rounds.map((cell) => {
            const m = cell.match(/([WB])\s*(\d+)\s*,\s*(\d+(?:\.\d+)?)/);
            return {
              color: m ? (m[1] as "W" | "B") : null,
              opponent: m ? Number(m[2]) : null,
              gamePoints: m ? Number(m[3]) : null,
              total: null,
            };
          }),
        };
        teams.push(lastTeam);
      } else if (lastTeam && first.trim() === "") {
        // Second line of a team: match points after each round.
        rounds.forEach((cell, i) => {
          if (lastTeam!.rounds[i]) lastTeam!.rounds[i].total = num(cell);
        });
        lastTeam = null;
      }
      continue;
    }

    // mode === "individual"
    const roster = rosters[rosters.length - 1];
    if (!roster) continue;
    if (numbered) {
      // First line of a player: name, rating, who they played each round.
      lastPlayer = {
        number: Number(numbered[1]),
        name: numbered[2],
        rating: num(rate),
        slot: "",
        score: 0,
        games: rounds.filter((cell) => /P\s*\d+/.test(cell)).length,
      };
      roster.players.push(lastPlayer);
    } else if (lastPlayer) {
      // Second line: state, US Chess ID, board, then the running score.
      const slot = first.match(/((?:Board|Alt)\s*\d+)\s*$/i);
      lastPlayer.slot = slot ? slot[1].replace(/\s+/g, " ") : "";
      const totals = rounds.map(num).filter((value): value is number => value !== null);
      lastPlayer.score = totals.length ? totals[totals.length - 1] : 0;
      lastPlayer = null;
    }
  }

  if (teams.length === 0) return null;
  const roundCount = Math.max(...teams.map((team) => team.rounds.length));
  return { title, roundCount, teams, rosters, raw, file };
}

// ---------- Standings ----------

// How many rounds have results entered.
export function roundsCompleted(chart: WallChart): number {
  let completed = 0;
  for (const team of chart.teams) {
    team.rounds.forEach((round, i) => {
      if (round.total !== null) completed = Math.max(completed, i + 1);
    });
  }
  return completed;
}

// Match points first, then game points, then team rating.
// Change the sort at the bottom if the league breaks ties another way.
export function standings(chart: WallChart): Standing[] {
  const rows = chart.teams.map((team) => {
    let matchPoints = 0;
    let gamePoints = 0;
    let wins = 0;
    let draws = 0;
    let losses = 0;
    let previous = 0;

    for (const round of team.rounds) {
      if (round.total === null) continue; // not played yet
      const gained = round.total - previous;
      previous = round.total;
      matchPoints = round.total;
      if (round.opponent === null) continue; // bye or unplayed round
      gamePoints += round.gamePoints ?? 0;
      if (gained >= 1) wins++;
      else if (gained > 0) draws++;
      else losses++;
    }
    return { place: 0, team, matchPoints, gamePoints, wins, draws, losses };
  });

  rows.sort(
    (a, b) =>
      b.matchPoints - a.matchPoints ||
      b.gamePoints - a.gamePoints ||
      b.team.rating - a.team.rating,
  );
  rows.forEach((row, i) => (row.place = i + 1));
  return rows;
}

// ---------- Loading the files ----------

const RESULTS_DIR = path.join(process.cwd(), "data", "results");

// Reads every file in one season's folder, e.g. loadResults("season-1").
export function loadResults(folder: string): {
  chart: WallChart | null;
  sheets: PairingSheet[];
  unreadable: { file: string; raw: string }[];
} {
  const dir = path.join(RESULTS_DIR, folder);
  const files = fs.existsSync(dir)
    ? fs.readdirSync(dir).filter((name) => name.toLowerCase().endsWith(".txt"))
    : [];
  files.sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));

  let chart: WallChart | null = null;
  const byRound = new Map<number, PairingSheet>();
  const unreadable: { file: string; raw: string }[] = [];

  for (const file of files) {
    const raw = fs.readFileSync(path.join(dir, file), "utf8");

    if (raw.includes("Pairing Sheet")) {
      const sheet = parsePairings(raw, file);
      if (sheet && sheet.pairings.length > 0) byRound.set(sheet.round, sheet);
      else unreadable.push({ file, raw });
    } else if (raw.includes("Wall Chart")) {
      const parsed = parseWallChart(raw, file);
      if (!parsed) unreadable.push({ file, raw });
      // Keep the chart with the most rounds played; later file names win ties.
      else if (!chart || roundsCompleted(parsed) >= roundsCompleted(chart)) chart = parsed;
    } else {
      unreadable.push({ file, raw });
    }
  }

  const sheets = [...byRound.values()].sort((a, b) => a.round - b.round);
  return { chart, sheets, unreadable };
}
