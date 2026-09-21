import type { PostDraft } from "../content/types";
import { updatePostDraft } from "../storage/postStore";

export async function approvePost(draft: PostDraft): Promise<PostDraft> {
  if (draft.status !== "READY_FOR_REVIEW") {
    throw new Error(`Cannot approve post with status ${draft.status}`);
  }

  const approvedDraft: PostDraft = {
    ...draft,
    status: "APPROVED",
  };

  await updatePostDraft(approvedDraft);

  return approvedDraft;
}

export async function rejectPost(draft: PostDraft): Promise<PostDraft> {
  if (draft.status !== "READY_FOR_REVIEW") {
    throw new Error(`Cannot reject post with status ${draft.status}`);
  }

  const rejectedDraft: PostDraft = {
    ...draft,
    status: "REJECTED",
  };

  await updatePostDraft(rejectedDraft);

  return rejectedDraft;
}
