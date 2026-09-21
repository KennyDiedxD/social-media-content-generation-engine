import {
  createContentIdeas,
  createPostDrafts,
} from "../workflows/contentWorkflow";
import type { ContentRequest } from "../content/types";
import { approvePost } from "../workflows/approvalWorkflow";

async function main() {
  console.log("\n💡 Generating content ideas...");

  const request: ContentRequest = {
    platforms: ["LinkedIn", "Instagram"],
    postKind: "TEXT",
    objective: "PARENT_EDUCATION",
  };

  const ideas = await createContentIdeas(request);
  console.log(`\nGenerated ${ideas.length} ideas:\n`);

  for (const idea of ideas) {
    console.log(`- ${idea.title}`);
    console.log(`  Pillar: ${idea.pillar}`);
    console.log(`  Audience: ${idea.audience}`);
    console.log("");
  }

  // Temporary CLI behaviour.
  // Later the frontend user will select the idea.
  const selectedIdea = ideas[0];

  console.log(`\n🧠 Selected idea: ${selectedIdea.title}`);

  const drafts = await createPostDrafts(selectedIdea);

  const approvedLinkedInPost = await approvePost(drafts[0]);

  console.log("\n✅ APPROVED POST:\n");
  console.log(approvedLinkedInPost);

  for (const draft of drafts) {
    console.log(`\n--- ${draft.platform.toUpperCase()} ---\n`);
    console.log(draft.text);
  }
}

main().catch((error) => {
  console.error("Engine failed:", error);
  process.exit(1);
});
