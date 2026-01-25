import { barGames } from "./src/data/barGames";
import { TAXONOMY_PLAY, TAXONOMY_FEATURES } from "./src/data/taxonomy";

console.log("--- TAXONOMY CHECK ---");
console.log("Has Pull Tabs in PLAY?", TAXONOMY_PLAY.includes("Pull Tabs"));
console.log("Has Jukebox in FEATURES?", TAXONOMY_FEATURES.includes("Jukebox"));

console.log("\n--- DATA CHECK ---");
const allGameNames = barGames.flatMap((c) => c.games.map((g) => g.name));
console.log("BarGames includes Pull Tabs?", allGameNames.includes("Pull Tabs"));
console.log("BarGames includes Jukebox?", allGameNames.includes("Jukebox"));
