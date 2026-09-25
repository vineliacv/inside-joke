# Inside Joke — local test

Requires Node.js 22.13+ and pnpm (`corepack enable`). After the initial install, on Windows you can double-click `Iniciar_Inside_Joke.cmd` in this folder to rebuild and open the game. Keep its window open while playing. The launcher prepares the local room table automatically and listens on your local network.

```bash
pnpm install
npm run build
node --import ./scripts/sites-env.mjs ./node_modules/wrangler/bin/wrangler.js d1 execute DB --local --config dist/server/wrangler.json --persist-to .wrangler/state --file drizzle/0000_fixed_mephisto.sql
npm start -- --port 8787
```

Open **http://localhost:8787** on your computer. Keep this terminal open. Open a second browser profile or private window to join the room as another player. For phones on the same Wi-Fi, change the `--ip 127.0.0.1` in package.json's `start` script to `--ip 0.0.0.0`, restart, and use `http://YOUR_COMPUTER_LAN_IP:8787` on each phone. Allow that port through your computer's firewall if necessary.

The initial version has two bonus games (number puzzle and hidden star); voice chat and drawing are planned for the polish phase. Rooms update about every 1.5 seconds. The local database is stored under `.wrangler/state`; do not rerun the SQL migration against the same local database.
