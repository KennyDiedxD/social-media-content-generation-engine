import "dotenv/config";

import type { PostDraft } from "../../content/types";

const INSTAGRAM_ACCESS_TOKEN = process.env.INSTAGRAM_ACCESS_TOKEN;

const INSTAGRAM_ACCOUNT_ID = process.env.INSTAGRAM_ACCOUNT_ID;

const PUBLIC_MEDIA_BASE_URL = process.env.PUBLIC_MEDIA_BASE_URL;

const INSTAGRAM_API_VERSION = process.env.INSTAGRAM_API_VERSION ?? "v26.0";

function requireConfig() {
  if (!INSTAGRAM_ACCESS_TOKEN) {
    throw new Error("INSTAGRAM_ACCESS_TOKEN is not configured");
  }

  if (!INSTAGRAM_ACCOUNT_ID) {
    throw new Error("INSTAGRAM_ACCOUNT_ID is not configured");
  }

  if (!PUBLIC_MEDIA_BASE_URL) {
    throw new Error("PUBLIC_MEDIA_BASE_URL is not configured");
  }
}

function getCaption(draft: PostDraft): string {
  const caption = draft.caption?.trim() ?? "";

  const hashtags = draft.hashtags?.length ? draft.hashtags.join(" ") : "";

  return [caption, hashtags].filter(Boolean).join("\n\n");
}

async function waitForContainerReady(containerId: string): Promise<void> {
  for (let attempt = 0; attempt < 5; attempt++) {
    const response = await fetch(
      `https://graph.instagram.com/${INSTAGRAM_API_VERSION}/${containerId}?fields=status_code`,
      {
        headers: {
          Authorization: `Bearer ${INSTAGRAM_ACCESS_TOKEN}`,
        },
      },
    );

    const data = (await response.json()) as {
      status_code?: string;
      error?: {
        message?: string;
      };
    };

    if (!response.ok) {
      throw new Error(
        `Could not check Instagram container: ${
          data.error?.message ?? JSON.stringify(data)
        }`,
      );
    }

    console.log("Instagram container status:", data.status_code);

    if (data.status_code === "FINISHED" || data.status_code === "PUBLISHED") {
      return;
    }

    if (data.status_code === "ERROR" || data.status_code === "EXPIRED") {
      throw new Error(
        `Instagram container failed with status: ${data.status_code}`,
      );
    }

    await new Promise((resolve) => setTimeout(resolve, 5000));
  }

  throw new Error("Instagram media container did not become ready in time");
}

export async function publishInstagram(draft: PostDraft): Promise<string> {
  requireConfig();

  if (draft.postKind === "TEXT") {
    throw new Error("Instagram does not support text-only publishing");
  }

  const caption = getCaption(draft);
  const baseUrl = PUBLIC_MEDIA_BASE_URL!.replace(/\/$/, "");

  // -----------------------------
  // IMAGE
  // -----------------------------

  if (draft.postKind === "IMAGE") {
    if (!draft.mediaUrl) {
      throw new Error("Instagram IMAGE post has no attached media");
    }

    const publicImageUrl = `${baseUrl}${draft.mediaUrl}`;

    console.log("\n🟣 Publishing Instagram image");

    console.log("Media:", publicImageUrl);

    const containerResponse = await fetch(
      `https://graph.instagram.com/${INSTAGRAM_API_VERSION}/${INSTAGRAM_ACCOUNT_ID}/media`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${INSTAGRAM_ACCESS_TOKEN}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          image_url: publicImageUrl,
          caption,
          is_ai_generated: true,
        }),
      },
    );

    const containerData = (await containerResponse.json()) as {
      id?: string;
      error?: {
        message?: string;
      };
    };

    if (!containerResponse.ok || !containerData.id) {
      throw new Error(
        `Instagram container creation failed: ${
          containerData.error?.message ?? JSON.stringify(containerData)
        }`,
      );
    }

    console.log("Instagram container:", containerData.id);

    await waitForContainerReady(containerData.id);

    const publishResponse = await fetch(
      `https://graph.instagram.com/${INSTAGRAM_API_VERSION}/${INSTAGRAM_ACCOUNT_ID}/media_publish`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${INSTAGRAM_ACCESS_TOKEN}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          creation_id: containerData.id,
        }),
      },
    );

    const publishData = (await publishResponse.json()) as {
      id?: string;
      error?: {
        message?: string;
      };
    };

    if (!publishResponse.ok || !publishData.id) {
      throw new Error(
        `Instagram publish failed: ${
          publishData.error?.message ?? JSON.stringify(publishData)
        }`,
      );
    }

    console.log("✅ Instagram image published:", publishData.id);

    return publishData.id;
  }

  // -----------------------------
  // CAROUSEL
  // -----------------------------

  if (draft.postKind === "CAROUSEL") {
    if (!draft.mediaUrls || draft.mediaUrls.length < 2) {
      throw new Error("Instagram carousel requires at least 2 images");
    }

    if (draft.mediaUrls.length > 10) {
      throw new Error("Instagram carousel supports at most 10 images");
    }

    console.log(
      `\n🟣 Publishing Instagram carousel with ${draft.mediaUrls.length} images`,
    );

    const childIds: string[] = [];

    for (let index = 0; index < draft.mediaUrls.length; index++) {
      const publicImageUrl = `${baseUrl}${draft.mediaUrls[index]}`;

      console.log(`Creating carousel item ${index + 1}:`, publicImageUrl);

      const response = await fetch(
        `https://graph.instagram.com/${INSTAGRAM_API_VERSION}/${INSTAGRAM_ACCOUNT_ID}/media`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${INSTAGRAM_ACCESS_TOKEN}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            image_url: publicImageUrl,
            is_carousel_item: true,
          }),
        },
      );

      const data = (await response.json()) as {
        id?: string;
        error?: {
          message?: string;
        };
      };

      if (!response.ok || !data.id) {
        throw new Error(
          `Instagram carousel item ${index + 1} failed: ${
            data.error?.message ?? JSON.stringify(data)
          }`,
        );
      }

      await waitForContainerReady(data.id);

      childIds.push(data.id);
    }

    console.log("Carousel child containers:", childIds);

    // Create the parent carousel container
    const carouselResponse = await fetch(
      `https://graph.instagram.com/${INSTAGRAM_API_VERSION}/${INSTAGRAM_ACCOUNT_ID}/media`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${INSTAGRAM_ACCESS_TOKEN}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          media_type: "CAROUSEL",
          children: childIds.join(","),
          caption,
          is_ai_generated: true,
        }),
      },
    );

    const carouselData = (await carouselResponse.json()) as {
      id?: string;
      error?: {
        message?: string;
      };
    };

    if (!carouselResponse.ok || !carouselData.id) {
      throw new Error(
        `Instagram carousel creation failed: ${
          carouselData.error?.message ?? JSON.stringify(carouselData)
        }`,
      );
    }

    console.log("Instagram carousel container:", carouselData.id);

    await waitForContainerReady(carouselData.id);

    // Publish the parent carousel
    const publishResponse = await fetch(
      `https://graph.instagram.com/${INSTAGRAM_API_VERSION}/${INSTAGRAM_ACCOUNT_ID}/media_publish`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${INSTAGRAM_ACCESS_TOKEN}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          creation_id: carouselData.id,
        }),
      },
    );

    const publishData = (await publishResponse.json()) as {
      id?: string;
      error?: {
        message?: string;
      };
    };

    if (!publishResponse.ok || !publishData.id) {
      throw new Error(
        `Instagram carousel publish failed: ${
          publishData.error?.message ?? JSON.stringify(publishData)
        }`,
      );
    }

    console.log("✅ Instagram carousel published:", publishData.id);

    return publishData.id;
  }

  throw new Error(`Unsupported Instagram post type: ${draft.postKind}`);
}
