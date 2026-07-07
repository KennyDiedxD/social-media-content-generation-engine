import fs from "fs/promises";
import path from "path";
import type { ContentIdea } from "./generateIdeas";
import type { CampaignBlueprint } from "./generateBlueprint";
import type { LinkedInPost } from "./generateLinkedInPost";
import type { InstagramCarousel } from "./generateInstagramCarousel";

function formatDateForFolder(date = new Date()): string {
  const dd = String(date.getDate()).padStart(2, "0");
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const yy = String(date.getFullYear()).slice(-2);

  return `${dd}.${mm}.${yy}`;
}

function safeFileName(input: string): string {
  return input
    .replace(/[<>:"/\\|?*]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 80);
}

export async function createRunFolder(): Promise<string> {
  const folderName = `Social Media Content - ${formatDateForFolder()}`;
  const folderPath = path.join(process.cwd(), "outputs", folderName);

  await fs.mkdir(folderPath, { recursive: true });

  return folderPath;
}

export async function saveIdeaOutputs(params: {
  runFolder: string;
  ideaIndex: number;
  idea: ContentIdea;
  blueprint: CampaignBlueprint;
  linkedinPost: LinkedInPost;
  instagramCarousel: InstagramCarousel;
  }) {
  const {
    runFolder,
    ideaIndex,
    idea,
    blueprint,
    linkedinPost,
    instagramCarousel,
    } = params;

  const ideaFolderName = `${String(ideaIndex + 1).padStart(2, "0")} - ${safeFileName(
    idea.title
  )}`;

  const ideaFolder = path.join(runFolder, ideaFolderName);
  await fs.mkdir(ideaFolder, { recursive: true });

  await fs.writeFile(
    path.join(ideaFolder, "01-campaign-blueprint.md"),
    formatBlueprint(blueprint),
    "utf-8"
  );

  await fs.writeFile(
    path.join(ideaFolder, "02-linkedin-post.md"),
    formatLinkedInPost(linkedinPost),
    "utf-8"
  );

  await fs.writeFile(
    path.join(ideaFolder, "03-instagram-carousel.md"),
    formatInstagramCarousel(instagramCarousel),
    "utf-8"
  );

}

function formatBlueprint(blueprint: CampaignBlueprint): string {
  return `# Campaign Blueprint

## Idea

${blueprint.ideaTitle}

## Human Observation

${blueprint.humanObservation}

## Parent Tension

${blueprint.parentTension}

## Common Mistake

${blueprint.commonMistake}

## Sharper Insight

${blueprint.sharperInsight}

## Concrete Example

${blueprint.concreteExample}

## Eddy Point of View

${blueprint.eddyPointOfView}

## Avoid Angles

${blueprint.avoidAngles.map((item) => `- ${item}`).join("\n")}
`;
}

function formatLinkedInPost(post: LinkedInPost): string {
  return `# LinkedIn Post

## Hook

${post.hook}

## Body

${post.body}

## CTA

${post.cta}

## Hashtags

${post.hashtags.map((tag) => `#${tag.replace(/^#/, "")}`).join(" ")}
`;
}

function formatInstagramCarousel(carousel: InstagramCarousel): string {
  return `# Instagram Carousel

## Slide Count

${carousel.slideCount}

${carousel.slides
  .map(
    (slide) => `## Slide ${slide.slideNumber}

### Headline

${slide.headline}

### Body

${slide.body}

### Visual Direction

${slide.visualDirection}
`
  )
  .join("\n")}

## Caption

${carousel.caption}

## Hashtags

${carousel.hashtags.map((tag) => `#${tag.replace(/^#/, "")}`).join(" ")}
`;
}
