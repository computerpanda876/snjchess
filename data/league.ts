// Everything on the home page comes from this file.
// Edit the text here, save, commit, and push. No other file needs to change.

export type Detail = {
  label: string;
  text: string;
  // Optional link shown under the text.
  link?: { label: string; href: string };
};

export const league = {
  name: "South Jersey Chess League",

  // Seasons, newest first. The first one is the current season.
  // "folder" is the folder inside data/results/ that holds that season's
  // WinTD files. To start a new season, add a line at the top.
  seasons: [
    { name: "Season 2", folder: "season-2" },
    { name: "Season 1", folder: "season-1" },
  ],

  // Paste the Jumbula registration link between the quotes.
  // While it is empty, the button reads "Registration opens soon".
  registrationUrl: "",

  // Round dates as YYYY-MM-DD, in order.
  rounds: ["2026-10-16", "2026-10-30", "2026-11-13", "2026-12-04", "2026-12-18"],
  startTime: "7:00 PM",

  details: [
    {
      label: "Schedule",
      text: "Five rounds on Friday nights. Every round starts at 7:00 PM.",
    },
    {
      label: "Time control",
      text: "G/60;d10. Each player has 60 minutes for the game, with a 10-second delay on every move.",
    },
    {
      label: "Teams",
      text: "A team needs at least 4 players and can add up to 3 alternates.",
    },
    {
      label: "Ratings",
      text: "Boards and pairings use each player's October 2026 published US Chess rating.",
    },
    {
      label: "Membership",
      text: "Every player needs a US Chess membership that expires in December 2026 or later. If yours runs out sooner, renew it before your first game.",
      link: {
        label: "Renew at uschess.org",
        href: "https://new.uschess.org/form/quick-membership-form",
      },
    },
    {
      label: "Rules",
      text: "To be announced.",
    },
    {
      label: "Prizes",
      text: "To be announced.",
    },
  ] as Detail[],
};
