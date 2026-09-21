import type { PostDraft } from "../content/types";
import { publishLinkedIn } from "../platforms/linkedin/publish";
import { publishInstagram } from "../platforms/instagram/publish";
import { markPostPublished } from "../storage/postStore";

export async function publishPost(draft: PostDraft): Promise<PostDraft> {
  if (draft.status !== "APPROVED") {
    throw new Error(`Cannot publish post with status ${draft.status}`);
  }

  let platformPostId: string | null = null;

  if (draft.platform === "LinkedIn") {
    platformPostId = await publishLinkedIn(draft);
  }

  if (draft.platform === "Instagram") {
    platformPostId = await publishInstagram(draft);
  }

  const publishedDraft = await markPostPublished(
    draft.id,
    platformPostId ?? undefined,
  );

  if (!publishedDraft) {
    throw new Error("Could not save published post");
  }

  return publishedDraft;
}
