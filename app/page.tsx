// The home page. All of its text comes from data/league.ts.

import Link from "next/link";
import { cacheLife } from "next/cache";
import { league } from "@/data/league";

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

// "2026-10-16" -> { month: "Oct", day: 16 }
function parts(date: string) {
  const [, month, day] = date.split("-").map(Number);
  return { month: MONTHS[month - 1], day };
}

// Today's date in New Jersey, as YYYY-MM-DD, so it can be compared to the round dates.
function today() {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "America/New_York" }).format(new Date());
}

export default async function Home() {
  // Keep a saved copy of this page and rebuild it about once an hour,
  // so the "next round" marker stays current without a new deploy.
  "use cache";
  cacheLife("hours");

  const nextRound = league.rounds.findIndex((date) => date >= today());
  const first = parts(league.rounds[0]);
  const last = parts(league.rounds[league.rounds.length - 1]);

  return (
    <>
      {/* Title */}
      <section className="pt-20 pb-16 sm:pt-32 sm:pb-24">
        <p className="text-muted">{league.seasons[0].name}</p>
        <h1 className="mt-4 max-w-4xl text-5xl leading-[0.95] font-extrabold tracking-tight sm:text-7xl lg:text-8xl">
          {league.name}
        </h1>
        <p className="mt-8 max-w-xl text-lg leading-relaxed text-muted">
          Team chess on Friday nights. {league.rounds.length} rounds from {first.month} {first.day}{" "}
          to {last.month} {last.day}, four boards a match.
        </p>

        <div className="mt-10 flex flex-wrap items-center gap-x-8 gap-y-4">
          {league.registrationUrl ? (
            <a
              href={league.registrationUrl}
              className="bg-accent px-7 py-4 font-semibold text-white hover:bg-ink"
            >
              Register a team
            </a>
          ) : (
            <span className="border border-line px-7 py-4 font-semibold text-muted">
              Registration opens soon
            </span>
          )}
          <Link href="/standings" className="font-semibold underline underline-offset-4 hover:text-accent">
            Standings and pairings
          </Link>
        </div>
      </section>

      {/* Round dates */}
      <section className="border-t border-ink py-12 sm:py-16">
        <h2 className="text-2xl font-bold tracking-tight">Round dates</h2>
        <ol className="mt-8 grid grid-cols-2 gap-x-6 gap-y-10 sm:grid-cols-5">
          {league.rounds.map((date, i) => {
            const { month, day } = parts(date);
            const isNext = i === nextRound;
            return (
              <li key={date} className={`border-t-2 pt-4 ${isNext ? "border-accent" : "border-line"}`}>
                <p className={`text-sm ${isNext ? "font-semibold text-accent" : "text-muted"}`}>
                  Round {i + 1}
                  {isNext && ", next"}
                </p>
                <p className="mt-2 text-4xl font-extrabold tracking-tight tabular-nums lg:text-5xl">
                  {month} {day}
                </p>
                <p className="mt-2 text-sm text-muted">Friday, {league.startTime}</p>
              </li>
            );
          })}
        </ol>
      </section>

      {/* Details */}
      <section className="border-t border-ink py-12 sm:py-16">
        <h2 className="text-2xl font-bold tracking-tight">How the league works</h2>
        <dl className="mt-8">
          {league.details.map((detail) => (
            <div
              key={detail.label}
              className="grid gap-x-8 gap-y-1 border-t border-line py-6 sm:grid-cols-[14rem_1fr]"
            >
              <dt className="font-semibold">{detail.label}</dt>
              <dd className="max-w-2xl leading-relaxed text-muted">
                {detail.text}
                {detail.link && (
                  <a
                    href={detail.link.href}
                    className="mt-2 block font-semibold text-accent underline underline-offset-4"
                  >
                    {detail.link.label}
                  </a>
                )}
              </dd>
            </div>
          ))}
        </dl>
      </section>
    </>
  );
}
