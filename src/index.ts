import { loadCoreContext } from "./modules/loadContext";
import { generateIdeas } from "./modules/generateIdeas";
import { generateBlueprint } from "./modules/generateBlueprint";
import { generateLinkedInPost } from "./modules/generateLinkedInPost";
import { generateInstagramCarousel } from "./modules/generateInstagramCarousel";
import { createRunFolder, saveIdeaOutputs } from "./modules/saveOutputs";
import { generateInstagramVisualDirections } from "./modules/generateInstagramVisualDirections";
import { selectCampaignMode } from "./modules/selectCampaignMode";

async function main() {
  const context = await loadCoreContext();

  const campaignMode = await selectCampaignMode();

  if (campaignMode.mode === "brief") {
    console.log(`\n📌 Campaign brief loaded: ${campaignMode.brief.campaignName}`);
  } else {
    console.log("\n🤖 Running in automatic mode");
  }

  console.log("✅ Eddy Brand Brain loaded");
  console.log("✅ Eddy Creative Brain loaded");
  console.log("✅ Content signals loaded");

  console.log("\n💡 Generating content ideas...");
  const ideas = await generateIdeas(context, campaignMode.brief);

  console.log(`\nGenerated ${ideas.length} selected ideas:\n`);

  for (const idea of ideas) {
    console.log(`- ${idea.title}`);
    console.log(`  Pillar: ${idea.pillar}`);
    console.log(`  Audience: ${idea.audience}`);
    console.log("");
  }

  const runFolder = await createRunFolder();

  console.log(`\n📁 Output folder created: ${runFolder}`);

  for (let i = 0; i < ideas.length; i++) {
  const idea = ideas[i];

  console.log(`\n==============================`);
  console.log(`Generating assets for idea ${i + 1}: ${idea.title}`);
  console.log(`==============================`);

  console.log("\n🧭 Generating campaign blueprint...");
  const blueprint = await generateBlueprint(idea, context);
  
  console.log("\n💼 Generating LinkedIn post...");
  const linkedinPost = await generateLinkedInPost(idea, blueprint);

  console.log("\n📲 Generating Instagram carousel...");
  const instagramCarousel = await generateInstagramCarousel(idea, blueprint);

  console.log("\n🎨 Generating Instagram visual directions...");
  const instagramVisualDirections = await generateInstagramVisualDirections(
  instagramCarousel,
  blueprint,
  context
  );

  instagramCarousel.slides = instagramCarousel.slides.map((slide) => ({
  ...slide,
  visualDirection:
    instagramVisualDirections.slides.find(
      (visual) => visual.slideNumber === slide.slideNumber
    )?.visualDirection ?? "",
}));

   await saveIdeaOutputs({
  runFolder,
  ideaIndex: i,
  idea,
  blueprint,
  linkedinPost,
  instagramCarousel
});

  console.log(`✅ Saved outputs for idea ${i + 1}`);
}
}

main().catch((error) => {
  console.error("Engine failed:", error);
  process.exit(1);
});