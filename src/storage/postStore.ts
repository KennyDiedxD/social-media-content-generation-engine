import fs from "fs/promises";
import path from "path";
import type { PostDraft } from "../content/types";

const storePath = path.join(process.cwd(), "src/data/post-drafts.json");

async function readStore(): Promise<PostDraft[]> {
  try {
    const raw = await fs.readFile(storePath, "utf-8");
    return JSON.parse(raw) as PostDraft[];
  } catch {
    return [];
  }
}

async function writeStore(drafts: PostDraft[]): Promise<void> {
  await fs.writeFile(storePath, JSON.stringify(drafts, null, 2), "utf-8");
}

export async function savePostDrafts(newDrafts: PostDraft[]): Promise<void> {
  const existing = await readStore();

  await writeStore([...existing, ...newDrafts]);
}

export async function getPostDrafts(): Promise<PostDraft[]> {
  return readStore();
}

export async function updatePostDraft(updatedDraft: PostDraft): Promise<void> {
  const drafts = await readStore();

  const updatedDrafts = drafts.map((draft) =>
    draft.id === updatedDraft.id ? updatedDraft : draft,
  );

  await writeStore(updatedDrafts);
}

export async function updatePostText(
  id: string,
  text: string,
): Promise<PostDraft | null> {
  const drafts = await readStore();

  const index = drafts.findIndex((draft) => draft.id === id);

  if (index === -1) {
    return null;
  }

  const updatedDraft: PostDraft = {
    ...drafts[index],
    text,
  };

  drafts[index] = updatedDraft;

  await writeStore(drafts);

  return updatedDraft;
}

export type PostDraftContentUpdate = {
  text?: string;
  caption?: string;
  hashtags?: string[];
  visualBrief?: string;
  carouselSlides?: string[];
};

export async function updatePostContent(
  id: string,
  updates: PostDraftContentUpdate,
): Promise<PostDraft | null> {
  const drafts = await readStore();

  const index = drafts.findIndex((draft) => draft.id === id);

  if (index === -1) {
    return null;
  }

  const updatedDraft: PostDraft = {
    ...drafts[index],
    ...updates,
  };

  drafts[index] = updatedDraft;

  await writeStore(drafts);

  return updatedDraft;
}

export async function updatePostMedia(
  id: string,
  mediaUrl: string,
): Promise<PostDraft | null> {
  const drafts = await readStore();

  const index = drafts.findIndex((draft) => draft.id === id);

  if (index === -1) {
    return null;
  }

  const updatedDraft: PostDraft = {
    ...drafts[index],
    mediaStatus: "ATTACHED",
    mediaUrl,
  };

  drafts[index] = updatedDraft;

  await writeStore(drafts);

  return updatedDraft;
}

export async function updatePostMediaUrls(
  id: string,
  mediaUrls: string[],
): Promise<PostDraft | null> {
  const drafts = await readStore();

  const index = drafts.findIndex((draft) => draft.id === id);

  if (index === -1) {
    return null;
  }

  const updatedDraft: PostDraft = {
    ...drafts[index],
    mediaStatus: "ATTACHED",
    mediaUrls,
  };

  drafts[index] = updatedDraft;

  await writeStore(drafts);

  return updatedDraft;
}

export async function markPostPublished(
  id: string,
  platformPostId?: string,
): Promise<PostDraft | null> {
  const drafts = await readStore();

  const index = drafts.findIndex((draft) => draft.id === id);

  if (index === -1) {
    return null;
  }

  const updatedDraft: PostDraft = {
    ...drafts[index],
    status: "PUBLISHED",
    publishedAt: new Date().toISOString(),
    ...(platformPostId ? { platformPostId } : {}),
  };

  drafts[index] = updatedDraft;

  await writeStore(drafts);

  return updatedDraft;
}

export async function deletePostDraft(id: string): Promise<boolean> {
  const drafts = await readStore();

  const exists = drafts.some((draft) => draft.id === id);

  if (!exists) {
    return false;
  }

  const remainingDrafts = drafts.filter((draft) => draft.id !== id);

  await writeStore(remainingDrafts);

  return true;
}
