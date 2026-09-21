import fs from "fs";
import path from "path";
import type { PostDraft } from "../../content/types";

const LINKEDIN_VERSION = "202608";

type LinkedInAuth = {
  accessToken?: string;
  personUrn?: string;
};

function loadLinkedInAuth(): LinkedInAuth {
  const authPath = path.join(process.cwd(), "src/data/linkedin-auth.json");

  try {
    return JSON.parse(fs.readFileSync(authPath, "utf8")) as LinkedInAuth;
  } catch {
    throw new Error(
      "LinkedIn is not connected. Authenticate at /auth/linkedin first.",
    );
  }
}

async function uploadLinkedInImage(
  mediaUrl: string,
  accessToken: string,
  personUrn: string,
): Promise<string> {
  const registerResponse = await fetch(
    "https://api.linkedin.com/v2/assets?action=registerUpload",
    {
      method: "POST",

      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
        "X-Restli-Protocol-Version": "2.0.0",
      },

      body: JSON.stringify({
        registerUploadRequest: {
          recipes: ["urn:li:digitalmediaRecipe:feedshare-image"],

          owner: personUrn,

          serviceRelationships: [
            {
              relationshipType: "OWNER",
              identifier: "urn:li:userGeneratedContent",
            },
          ],
        },
      }),
    },
  );

  if (!registerResponse.ok) {
    const errorText = await registerResponse.text();

    console.error(
      "LinkedIn image registration failed:",
      registerResponse.status,
      errorText,
    );

    throw new Error(
      `LinkedIn image registration failed: ${registerResponse.status}`,
    );
  }

  const registerData = (await registerResponse.json()) as {
    value: {
      asset: string;

      uploadMechanism: {
        "com.linkedin.digitalmedia.uploading.MediaUploadHttpRequest": {
          uploadUrl: string;
        };
      };
    };
  };

  const asset = registerData.value.asset;

  const uploadUrl =
    registerData.value.uploadMechanism[
      "com.linkedin.digitalmedia.uploading.MediaUploadHttpRequest"
    ].uploadUrl;

  const fileName = path.basename(mediaUrl);

  const filePath = path.join(process.cwd(), "uploads", fileName);

  const imageBuffer = await fs.promises.readFile(filePath);

  const uploadResponse = await fetch(uploadUrl, {
    method: "PUT",

    headers: {
      Authorization: `Bearer ${accessToken}`,
    },

    body: imageBuffer,
  });

  if (!uploadResponse.ok) {
    const errorText = await uploadResponse.text();

    console.error(
      "LinkedIn image upload failed:",
      uploadResponse.status,
      errorText,
    );

    throw new Error(`LinkedIn image upload failed: ${uploadResponse.status}`);
  }

  return asset;
}

async function uploadLinkedInImageV2(
  mediaUrl: string,
  accessToken: string,
  personUrn: string,
): Promise<string> {
  const initializeResponse = await fetch(
    "https://api.linkedin.com/rest/images?action=initializeUpload",
    {
      method: "POST",

      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
        "Linkedin-Version": LINKEDIN_VERSION,
        "X-Restli-Protocol-Version": "2.0.0",
      },

      body: JSON.stringify({
        initializeUploadRequest: {
          owner: personUrn,
        },
      }),
    },
  );

  if (!initializeResponse.ok) {
    const errorText = await initializeResponse.text();

    console.error(
      "LinkedIn image initialization failed:",
      initializeResponse.status,
      errorText,
    );

    throw new Error(
      `LinkedIn image initialization failed: ${initializeResponse.status}`,
    );
  }

  const initializeData = (await initializeResponse.json()) as {
    value: {
      uploadUrl: string;
      image: string;
    };
  };

  const { uploadUrl, image } = initializeData.value;

  const fileName = path.basename(mediaUrl);

  const filePath = path.join(process.cwd(), "uploads", fileName);

  const imageBuffer = await fs.promises.readFile(filePath);

  const uploadResponse = await fetch(uploadUrl, {
    method: "PUT",

    headers: {
      Authorization: `Bearer ${accessToken}`,
    },

    body: imageBuffer,
  });

  if (!uploadResponse.ok) {
    const errorText = await uploadResponse.text();

    console.error(
      "LinkedIn V2 image upload failed:",
      uploadResponse.status,
      errorText,
    );

    throw new Error(
      `LinkedIn V2 image upload failed: ${uploadResponse.status}`,
    );
  }

  return image;
}

export async function publishLinkedIn(
  draft: PostDraft,
): Promise<string | null> {
  const postKind = draft.postKind ?? "TEXT";

  if (postKind !== "TEXT" && postKind !== "IMAGE" && postKind !== "CAROUSEL") {
    throw new Error(`LinkedIn ${postKind} publishing is not implemented yet`);
  }

  const { accessToken, personUrn } = loadLinkedInAuth();

  if (!accessToken || !personUrn) {
    throw new Error("LinkedIn authentication information is missing.");
  }

  if (postKind === "TEXT") {
    if (!draft.text?.trim()) {
      throw new Error("LinkedIn post text is empty");
    }

    const response = await fetch("https://api.linkedin.com/v2/ugcPosts", {
      method: "POST",

      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
        "X-Restli-Protocol-Version": "2.0.0",
      },

      body: JSON.stringify({
        author: personUrn,

        lifecycleState: "PUBLISHED",

        specificContent: {
          "com.linkedin.ugc.ShareContent": {
            shareCommentary: {
              text: draft.text.trim(),
            },

            shareMediaCategory: "NONE",
          },
        },

        visibility: {
          "com.linkedin.ugc.MemberNetworkVisibility": "PUBLIC",
        },
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();

      console.error("LinkedIn publishing failed:", response.status, errorText);

      throw new Error(`LinkedIn publishing failed: ${response.status}`);
    }

    const postId = response.headers.get("X-RestLi-Id");

    console.log("LinkedIn post published:", postId);

    return postId;
  }

  if (postKind === "CAROUSEL") {
    if (!draft.mediaUrls || draft.mediaUrls.length < 2) {
      throw new Error("LinkedIn multi-image post requires at least 2 images");
    }

    if (draft.mediaUrls.length > 20) {
      throw new Error(
        "LinkedIn multi-image post supports a maximum of 20 images",
      );
    }

    const imageUrns: string[] = [];

    for (const mediaUrl of draft.mediaUrls) {
      const imageUrn = await uploadLinkedInImageV2(
        mediaUrl,
        accessToken,
        personUrn,
      );

      imageUrns.push(imageUrn);
    }

    const postText = [
      draft.caption?.trim(),
      draft.hashtags?.length ? draft.hashtags.join(" ") : null,
    ]
      .filter(Boolean)
      .join("\n\n");

    const response = await fetch("https://api.linkedin.com/rest/posts", {
      method: "POST",

      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
        "Linkedin-Version": LINKEDIN_VERSION,
        "X-Restli-Protocol-Version": "2.0.0",
      },

      body: JSON.stringify({
        author: personUrn,

        commentary: postText,

        visibility: "PUBLIC",

        distribution: {
          feedDistribution: "MAIN_FEED",
          targetEntities: [],
          thirdPartyDistributionChannels: [],
        },

        lifecycleState: "PUBLISHED",

        isReshareDisabledByAuthor: false,

        content: {
          multiImage: {
            images: imageUrns.map((id, index) => ({
              id,
              altText: `Carousel image ${index + 1}`,
            })),
          },
        },
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();

      console.error(
        "LinkedIn multi-image post failed:",
        response.status,
        errorText,
      );

      throw new Error(`LinkedIn multi-image post failed: ${response.status}`);
    }

    const postId = response.headers.get("X-RestLi-Id");

    console.log("LinkedIn multi-image post published:", postId);

    return postId;
  }

  // IMAGE
  if (!draft.mediaUrl) {
    throw new Error("LinkedIn image is missing");
  }

  const asset = await uploadLinkedInImage(
    draft.mediaUrl,
    accessToken,
    personUrn,
  );

  const postText = [
    draft.caption?.trim(),
    draft.hashtags?.length ? draft.hashtags.join(" ") : null,
  ]
    .filter(Boolean)
    .join("\n\n");

  const response = await fetch("https://api.linkedin.com/v2/ugcPosts", {
    method: "POST",

    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
      "X-Restli-Protocol-Version": "2.0.0",
    },

    body: JSON.stringify({
      author: personUrn,

      lifecycleState: "PUBLISHED",

      specificContent: {
        "com.linkedin.ugc.ShareContent": {
          shareCommentary: {
            text: postText,
          },

          shareMediaCategory: "IMAGE",

          media: [
            {
              status: "READY",
              media: asset,
            },
          ],
        },
      },

      visibility: {
        "com.linkedin.ugc.MemberNetworkVisibility": "PUBLIC",
      },
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();

    console.error("LinkedIn image post failed:", response.status, errorText);

    throw new Error(`LinkedIn image post failed: ${response.status}`);
  }

  const postId = response.headers.get("X-RestLi-Id");

  console.log("LinkedIn image post published:", postId);

  return postId;
}
