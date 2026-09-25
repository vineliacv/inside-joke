# Inside Joke

A multiplayer party game for 2–8 players. One player creates a room, shares its code, and friends answer and guess on their own devices. Includes bonus challenges and a shared scoreboard.

Play the published game: https://inside-joke-party.vinelialazaro.chatgpt.site

## Run locally

Requires Node.js 22.13+ and pnpm. Install dependencies with `pnpm install`, then run `npm run build`. On Windows, double-click `Iniciar_Inside_Joke.cmd` to prepare the local room database and open the game at http://localhost:3000.

The launcher must remain open while players use the game. For another device on the same Wi-Fi, open `http://YOUR-COMPUTER-IP:3000` on that device. The local database is stored under `.wrangler/state`.

## Hosting

The game uses a Cloudflare Worker and D1. The logical D1 binding is `DB`; the schema migration is in `drizzle/0000_fixed_mephisto.sql`.
