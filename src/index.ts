import { loadContext } from "./modules/loadContext";
import { generateIdeas } from "./modules/generateIdeas";

async function main() {
  const context = await loadContext();

  console.log("✅ Eddy Brand Brain loaded");
  console.log("✅ Content signals loaded");

  console.log("\n💡 Generating content ideas...");

  const ideas = await generateIdeas(context);

console.log(`\nGenerated ${ideas.length} selected ideas:\n`);

  for (const idea of ideas) {
    console.log(`- ${idea.title}`);
    console.log(`  Pillar: ${idea.pillar}`);
    console.log(`  Audience: ${idea.audience}`);
    console.log("");
  }
}

main().catch((error) => {
  console.error("Engine failed:", error);
  process.exit(1);
});