import express from "express";
import {
  createContentIdeas,
  createPostDrafts,
} from "../workflows/contentWorkflow";
import { approvePost, rejectPost } from "../workflows/approvalWorkflow";
import {
  getPostDrafts,
  updatePostContent,
  updatePostMedia,
  updatePostMediaUrls,
  deletePostDraft,
} from "../storage/postStore";
import cors from "cors";
import { publishPost } from "../workflows/publishingWorkflow";
import { addSignal, getSignals } from "../storage/signalStore";
import fs from "fs";
import path from "path";
import multer from "multer";
import { randomUUID } from "node:crypto";
import { generateImageFromPrompt } from "../services/imageProviderService";
import sharp from "sharp";

const uploadsPath = path.join(process.cwd(), "uploads");
let linkedInOAuthState: string | null = null;
let linkedInAccessToken: string | null = null;
let linkedInPersonUrn: string | null = null;

const linkedInAuthPath = path.join(
  process.cwd(),
  "src/data/linkedin-auth.json",
);

try {
  const savedLinkedInAuth = JSON.parse(
    fs.readFileSync(linkedInAuthPath, "utf8"),
  );

  linkedInAccessToken = savedLinkedInAuth.accessToken ?? null;
  linkedInPersonUrn = savedLinkedInAuth.personUrn ?? null;
} catch {
  // No saved LinkedIn connection yet.
}

fs.mkdirSync(uploadsPath, {
  recursive: true,
});

const storage = multer.diskStorage({
  destination: (_req, _file, callback) => {
    callback(null, uploadsPath);
  },

  filename: (_req, file, callback) => {
    const extension = path.extname(file.originalname).toLowerCase();

    callback(null, `${randomUUID()}${extension}`);
  },
});

const upload = multer({
  storage,

  limits: {
    fileSize: 10 * 1024 * 1024,
  },

  fileFilter: (_req, file, callback) => {
    if (!file.mimetype.startsWith("image/")) {
      callback(new Error("Only image files can be uploaded"));

      return;
    }

    callback(null, true);
  },
});

export function createServer() {
  const app = express();

  app.use(cors());
  app.use(express.json());

  app.use("/uploads", express.static(uploadsPath));

  app.get("/health", (_req, res) => {
    res.json({
      status: "ok",
      service: "Eddy Social Manager",
    });
  });

  app.get("/auth/linkedin", (_req, res) => {
    const clientId = process.env.LINKEDIN_CLIENT_ID;
    const redirectUri = process.env.LINKEDIN_REDIRECT_URI;

    if (!clientId || !redirectUri) {
      return res.status(500).json({
        error: "LinkedIn OAuth is not configured",
      });
    }

    linkedInOAuthState = randomUUID();

    const params = new URLSearchParams({
      response_type: "code",
      client_id: clientId,
      redirect_uri: redirectUri,
      state: linkedInOAuthState,
      scope: "openid profile email w_member_social",
    });

    res.redirect(
      `https://www.linkedin.com/oauth/v2/authorization?${params.toString()}`,
    );
  });

  app.get("/auth/linkedin/callback", async (req, res) => {
    try {
      const code = req.query.code;
      const state = req.query.state;

      if (typeof code !== "string" || typeof state !== "string") {
        return res.status(400).send("Missing LinkedIn authorization code");
      }

      if (!linkedInOAuthState || state !== linkedInOAuthState) {
        return res.status(400).send("Invalid LinkedIn OAuth state");
      }

      const clientId = process.env.LINKEDIN_CLIENT_ID;
      const clientSecret = process.env.LINKEDIN_CLIENT_SECRET;
      const redirectUri = process.env.LINKEDIN_REDIRECT_URI;

      if (!clientId || !clientSecret || !redirectUri) {
        return res.status(500).send("LinkedIn OAuth is not configured");
      }

      const tokenResponse = await fetch(
        "https://www.linkedin.com/oauth/v2/accessToken",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
          },
          body: new URLSearchParams({
            grant_type: "authorization_code",
            code,
            client_id: clientId,
            client_secret: clientSecret,
            redirect_uri: redirectUri,
          }),
        },
      );

      if (!tokenResponse.ok) {
        const errorText = await tokenResponse.text();

        console.error("LinkedIn token exchange failed:", errorText);

        return res.status(500).send("LinkedIn token exchange failed");
      }

      const tokenData = (await tokenResponse.json()) as {
        access_token: string;
        expires_in?: number;
        id_token?: string;
      };

      linkedInAccessToken = tokenData.access_token;

      const userInfoResponse = await fetch(
        "https://api.linkedin.com/v2/userinfo",
        {
          headers: {
            Authorization: `Bearer ${linkedInAccessToken}`,
          },
        },
      );

      if (!userInfoResponse.ok) {
        const errorText = await userInfoResponse.text();

        console.error("LinkedIn user info failed:", errorText);

        return res.status(500).send("Could not retrieve LinkedIn profile");
      }

      const userInfo = (await userInfoResponse.json()) as {
        sub: string;
        name?: string;
        email?: string;
      };

      linkedInPersonUrn = `urn:li:person:${userInfo.sub}`;

      await fs.promises.writeFile(
        path.join(process.cwd(), "src/data/linkedin-auth.json"),
        JSON.stringify(
          {
            accessToken: linkedInAccessToken,
            personUrn: linkedInPersonUrn,
            expiresIn: tokenData.expires_in,
            savedAt: Date.now(),
          },
          null,
          2,
        ),
      );

      console.log("LinkedIn authentication successful");
      console.log("LinkedIn member:", userInfo.name);
      console.log("LinkedIn Person URN:", linkedInPersonUrn);
      console.log("LinkedIn token expires in:", tokenData.expires_in);

      linkedInOAuthState = null;

      res.send(
        `LinkedIn connected successfully as ${userInfo.name ?? "member"}. You can close this tab.`,
      );
    } catch (error) {
      console.error("LinkedIn OAuth callback failed:", error);

      res.status(500).send("LinkedIn authentication failed");
    }
  });

  app.post("/ideas/generate", async (req, res) => {
    try {
      const contentRequest = req.body;

      if (
        !Array.isArray(contentRequest.platforms) ||
        contentRequest.platforms.length === 0 ||
        !contentRequest.postKind ||
        !contentRequest.objective
      ) {
        return res.status(400).json({
          error: "Invalid content request",
        });
      }

      if (
        contentRequest.platforms.includes("Instagram") &&
        contentRequest.postKind === "TEXT"
      ) {
        return res.status(400).json({
          error: "Instagram does not support text-only posts",
        });
      }

      const ideas = await createContentIdeas(contentRequest);

      res.json({
        ideas,
      });
    } catch (error) {
      console.error("Failed to generate ideas:", error);

      res.status(500).json({
        error: "Failed to generate ideas",
      });
    }
  });

  app.post("/drafts/generate", async (req, res) => {
    try {
      const body = req.body;

      const idea = body?.idea ?? body;

      const imageProvider =
        body?.idea !== undefined ? body.imageProvider : undefined;

      if (
        imageProvider !== undefined &&
        imageProvider !== "gemini" &&
        imageProvider !== "klein"
      ) {
        return res.status(400).json({
          error: "Invalid image provider",
        });
      }

      if (!idea?.title || !idea?.pillar || !idea?.audience) {
        return res.status(400).json({
          error: "Invalid content idea",
        });
      }

      const drafts = await createPostDrafts(idea, imageProvider);
      res.json({
        drafts,
      });
    } catch (error) {
      console.error("Failed to generate drafts:", error);

      res.status(500).json({
        error: "Failed to generate drafts",
      });
    }
  });

  app.post("/drafts/:id/approve", async (req, res) => {
    try {
      const drafts = await getPostDrafts();

      const draft = drafts.find((item) => item.id === req.params.id);

      if (!draft) {
        return res.status(404).json({
          error: "Draft not found",
        });
      }

      const approved = await approvePost(draft);

      res.json({
        draft: approved,
      });
    } catch (error) {
      console.error("Failed to approve draft:", error);

      res.status(500).json({
        error: "Failed to approve draft",
      });
    }
  });

  app.post("/drafts/:id/reject", async (req, res) => {
    try {
      const drafts = await getPostDrafts();

      const draft = drafts.find((item) => item.id === req.params.id);

      if (!draft) {
        return res.status(404).json({
          error: "Draft not found",
        });
      }

      const rejected = await rejectPost(draft);

      res.json({
        draft: rejected,
      });
    } catch (error) {
      console.error("Failed to reject draft:", error);

      res.status(500).json({
        error: "Failed to reject draft",
      });
    }
  });

  app.get("/drafts", async (_req, res) => {
    try {
      const drafts = await getPostDrafts();

      res.json({
        drafts,
      });
    } catch (error) {
      console.error("Failed to load drafts:", error);

      res.status(500).json({
        error: "Failed to load drafts",
      });
    }
  });

  app.delete("/drafts/:id", async (req, res) => {
    try {
      const draftId = req.params.id as string;

      const drafts = await getPostDrafts();
      const draft = drafts.find((item) => item.id === draftId);

      if (!draft) {
        return res.status(404).json({
          error: "Draft not found",
        });
      }

      const mediaFiles = [
        ...(draft.mediaUrl ? [draft.mediaUrl] : []),
        ...(draft.mediaUrls ?? []),
      ];

      const deleted = await deletePostDraft(draftId);

      if (!deleted) {
        return res.status(404).json({
          error: "Draft not found",
        });
      }

      await Promise.all(
        mediaFiles.map(async (mediaUrl) => {
          const fileName = path.basename(mediaUrl);
          const filePath = path.join(uploadsPath, fileName);

          try {
            await fs.promises.unlink(filePath);
          } catch (error: any) {
            if (error?.code !== "ENOENT") {
              console.error("Could not delete media file:", filePath, error);
            }
          }
        }),
      );

      res.json({
        success: true,
      });
    } catch (error) {
      console.error("Failed to delete draft:", error);

      res.status(500).json({
        error: "Failed to delete draft",
      });
    }
  });

  app.patch("/drafts/:id", async (req, res) => {
    try {
      const draftId = req.params.id as string;

      const { text, caption, hashtags, visualBrief, carouselSlides } = req.body;

      const updates = {
        ...(typeof text === "string" ? { text } : {}),
        ...(typeof caption === "string" ? { caption } : {}),
        ...(Array.isArray(hashtags) ? { hashtags } : {}),
        ...(typeof visualBrief === "string" ? { visualBrief } : {}),
        ...(Array.isArray(carouselSlides) ? { carouselSlides } : {}),
      };

      const updatedDraft = await updatePostContent(draftId, updates);

      if (!updatedDraft) {
        return res.status(404).json({
          error: "Draft not found",
        });
      }

      res.json({
        draft: updatedDraft,
      });
    } catch (error) {
      console.error("Failed to update draft:", error);

      res.status(500).json({
        error: "Failed to update draft",
      });
    }
  });

  app.post(
    "/drafts/:id/media",

    async (req, res, next) => {
      try {
        const drafts = await getPostDrafts();

        const draft = drafts.find((item) => item.id === req.params.id);

        if (!draft) {
          return res.status(404).json({
            error: "Draft not found",
          });
        }

        if ((draft.postKind ?? "TEXT") === "TEXT") {
          return res.status(400).json({
            error: "Text posts do not require media",
          });
        }

        next();
      } catch (error) {
        console.error("Failed to validate media upload:", error);

        res.status(500).json({
          error: "Failed to validate media upload",
        });
      }
    },

    upload.single("file"),

    async (req, res) => {
      try {
        if (!req.file) {
          return res.status(400).json({
            error: "Image file is required",
          });
        }

        const mediaUrl = `/uploads/${req.file.filename}`;

        const draftId = req.params.id as string;

        const drafts = await getPostDrafts();
        const existingDraft = drafts.find((item) => item.id === draftId);

        const oldMediaUrl = existingDraft?.mediaUrl;

        const updatedDraft = await updatePostMedia(draftId, mediaUrl);
        if (!updatedDraft) {
          return res.status(404).json({
            error: "Draft not found",
          });
        }

        if (
          oldMediaUrl &&
          oldMediaUrl !== mediaUrl &&
          oldMediaUrl.startsWith("/uploads/")
        ) {
          const oldFilePath = path.join(
            uploadsPath,
            path.basename(oldMediaUrl),
          );

          try {
            await fs.promises.unlink(oldFilePath);
          } catch (error: any) {
            if (error?.code !== "ENOENT") {
              console.error(
                "Could not delete previous image:",
                oldFilePath,
                error,
              );
            }
          }
        }

        res.json({
          draft: updatedDraft,
        });
      } catch (error) {
        console.error("Failed to attach media:", error);

        res.status(500).json({
          error: "Failed to attach media",
        });
      }
    },
  );

  app.post(
    "/drafts/:id/carousel-media",
    upload.array("files", 10),
    async (req, res) => {
      try {
        const draftId = req.params.id as string;

        const drafts = await getPostDrafts();

        const draft = drafts.find((item) => item.id === draftId);

        if (!draft) {
          return res.status(404).json({
            error: "Draft not found",
          });
        }

        if (draft.postKind !== "CAROUSEL") {
          return res.status(400).json({
            error: "This draft is not a carousel",
          });
        }

        const files = req.files as Express.Multer.File[];

        if (!files || files.length < 2) {
          return res.status(400).json({
            error: "At least 2 images are required",
          });
        }

        const oldMediaUrls = draft.mediaUrls ?? [];

        const mediaUrls = files.map((file) => `/uploads/${file.filename}`);

        const updatedDraft = await updatePostMediaUrls(draftId, mediaUrls);

        await Promise.all(
          oldMediaUrls
            .filter((oldUrl) => !mediaUrls.includes(oldUrl))
            .map(async (oldUrl) => {
              const fileName = path.basename(oldUrl);
              const filePath = path.join(uploadsPath, fileName);

              try {
                await fs.promises.unlink(filePath);
              } catch (error: any) {
                if (error?.code !== "ENOENT") {
                  console.error(
                    "Could not delete previous carousel image:",
                    filePath,
                    error,
                  );
                }
              }
            }),
        );

        res.json({
          draft: updatedDraft,
        });
      } catch (error) {
        console.error("Failed to attach carousel media:", error);

        res.status(500).json({
          error: "Failed to attach carousel media",
        });
      }
    },
  );

  app.post("/drafts/:id/publish", async (req, res) => {
    try {
      const drafts = await getPostDrafts();

      const draft = drafts.find((item) => item.id === req.params.id);

      if (!draft) {
        return res.status(404).json({
          error: "Draft not found",
        });
      }

      if (
        draft.platform === "Instagram" &&
        (draft.postKind ?? "TEXT") === "TEXT"
      ) {
        return res.status(400).json({
          error: "Instagram does not support text-only posts",
        });
      }

      const requiresMedia = (draft.postKind ?? "TEXT") !== "TEXT";

      if (requiresMedia && draft.mediaStatus !== "ATTACHED") {
        return res.status(400).json({
          error: "Media must be attached before publishing",
        });
      }

      const published = await publishPost(draft);

      res.json({
        draft: published,
      });
    } catch (error) {
      console.error("Failed to publish draft:", error);

      res.status(500).json({
        error: "Failed to publish draft",
      });
    }
  });

  app.get("/signals", async (_req, res) => {
    try {
      const signals = await getSignals();

      res.json({
        signals,
      });
    } catch (error) {
      console.error("Failed to load signals:", error);

      res.status(500).json({
        error: "Failed to load signals",
      });
    }
  });

  app.post("/signals", async (req, res) => {
    try {
      const { type, title, content, sourceUrl, sourceName } = req.body;

      if (!type || !content?.trim()) {
        return res.status(400).json({
          error: "Signal type and content are required",
        });
      }

      const signal = await addSignal({
        type,
        title,
        content: content.trim(),
        sourceUrl,
        sourceName,
      });

      res.status(201).json({
        signal,
      });
    } catch (error) {
      console.error("Failed to add signal:", error);

      res.status(500).json({
        error: "Failed to add signal",
      });
    }
  });

  app.post("/drafts/:id/generate-image", async (req, res) => {
    try {
      const draftId = req.params.id as string;

      const requestedProvider = req.body?.provider;

      if (
        requestedProvider !== undefined &&
        requestedProvider !== "gemini" &&
        requestedProvider !== "klein"
      ) {
        return res.status(400).json({
          error: "Invalid image provider",
        });
      }

      const drafts = await getPostDrafts();
      const draft = drafts.find((item) => item.id === draftId);

      if (!draft) {
        return res.status(404).json({
          error: "Draft not found",
        });
      }

      if ((draft.postKind ?? "TEXT") !== "IMAGE") {
        return res.status(400).json({
          error: "Only IMAGE drafts can use AI image generation",
        });
      }

      if (!draft.imagePrompt?.trim()) {
        return res.status(400).json({
          error: "No image prompt found for this draft",
        });
      }

      const oldMediaUrl = draft.mediaUrl;

      const generatedImageBuffer = await generateImageFromPrompt(
        draft.imagePrompt,
        requestedProvider,
      );

      const metadata = await sharp(generatedImageBuffer).metadata();

      const imageWidth = metadata.width ?? 1024;

      const logoWidth = Math.round(imageWidth * 0.08);
      const padding = 24;

      const logoOnlyBuffer = await sharp(
        path.join(process.cwd(), "src/assets/eddy-logo.png"),
      )
        .resize({
          width: logoWidth,
        })
        .png()
        .toBuffer();

      const imageBuffer = await sharp(generatedImageBuffer)
        .composite([
          {
            input: logoOnlyBuffer,
            left: imageWidth - logoWidth - padding,
            top: padding,
          },
        ])
        .jpeg({
          quality: 90,
        })
        .toBuffer();

      const fileName = `${randomUUID()}.jpg`;
      const filePath = path.join(uploadsPath, fileName);

      await fs.promises.writeFile(filePath, imageBuffer);

      const mediaUrl = `/uploads/${fileName}`;

      const updatedDraft = await updatePostMedia(draftId, mediaUrl);

      if (!updatedDraft) {
        return res.status(404).json({
          error: "Draft not found after image generation",
        });
      }

      if (
        oldMediaUrl &&
        oldMediaUrl !== mediaUrl &&
        oldMediaUrl.startsWith("/uploads/")
      ) {
        const oldFileName = path.basename(oldMediaUrl);
        const oldFilePath = path.join(uploadsPath, oldFileName);

        try {
          await fs.promises.unlink(oldFilePath);
        } catch (error: any) {
          if (error?.code !== "ENOENT") {
            console.error(
              "Could not delete previous generated image:",
              oldFilePath,
              error,
            );
          }
        }
      }

      res.json({
        draft: updatedDraft,
      });
    } catch (error) {
      console.error("Failed to generate AI image:", error);

      res.status(500).json({
        error: "Failed to generate AI image",
      });
    }
  });

  app.post("/drafts/:id/generate-carousel-images", async (req, res) => {
    try {
      const draftId = req.params.id as string;
      const requestedProvider = req.body?.provider;

      if (
        requestedProvider !== undefined &&
        requestedProvider !== "gemini" &&
        requestedProvider !== "klein"
      ) {
        return res.status(400).json({
          error: "Invalid image provider",
        });
      }

      const drafts = await getPostDrafts();
      const draft = drafts.find((item) => item.id === draftId);

      if (!draft) {
        return res.status(404).json({
          error: "Draft not found",
        });
      }

      if ((draft.postKind ?? "TEXT") !== "CAROUSEL") {
        return res.status(400).json({
          error: "Only CAROUSEL drafts can generate carousel images",
        });
      }

      if (!draft.carouselSlides || draft.carouselSlides.length === 0) {
        return res.status(400).json({
          error: "No carousel slides found",
        });
      }

      const oldMediaUrls = draft.mediaUrls ?? [];

      const mediaUrls: string[] = [];

      for (let index = 0; index < draft.carouselSlides.length; index++) {
        const slideText = draft.carouselSlides[index];

        const prompt = `
Create one slide for a premium educational social-media carousel.

OVERALL VISUAL DIRECTION:
${draft.visualBrief ?? "Modern editorial educational illustration"}

SLIDE:
${index + 1} of ${draft.carouselSlides.length}

SLIDE CONTENT:
${slideText}

Keep this slide visually consistent with the rest of the carousel.
Use a polished 4:5 portrait social-media composition.
`;

        const generatedImageBuffer = await generateImageFromPrompt(
          prompt,
          requestedProvider,
        );
        const metadata = await sharp(generatedImageBuffer).metadata();

        const imageWidth = metadata.width ?? 1024;

        const logoWidth = Math.round(imageWidth * 0.08);
        const padding = 24;

        const logoOnlyBuffer = await sharp(
          path.join(process.cwd(), "src/assets/eddy-logo.png"),
        )
          .resize({
            width: logoWidth,
          })
          .png()
          .toBuffer();

        const imageBuffer = await sharp(generatedImageBuffer)
          .composite([
            {
              input: logoOnlyBuffer,
              left: imageWidth - logoWidth - padding,
              top: padding,
            },
          ])
          .jpeg({
            quality: 90,
          })
          .toBuffer();

        const fileName = `${randomUUID()}.jpg`;

        const filePath = path.join(uploadsPath, fileName);

        await fs.promises.writeFile(filePath, imageBuffer);

        mediaUrls.push(`/uploads/${fileName}`);
      }

      const updatedDraft = await updatePostMediaUrls(draftId, mediaUrls);

      await Promise.all(
        oldMediaUrls
          .filter((oldUrl) => !mediaUrls.includes(oldUrl))
          .map(async (oldUrl) => {
            const fileName = path.basename(oldUrl);
            const filePath = path.join(uploadsPath, fileName);

            try {
              await fs.promises.unlink(filePath);
            } catch (error: any) {
              if (error?.code !== "ENOENT") {
                console.error(
                  "Could not delete previous carousel image:",
                  filePath,
                  error,
                );
              }
            }
          }),
      );

      res.json({
        draft: updatedDraft,
      });
    } catch (error) {
      console.error("Failed to generate carousel images:", error);

      res.status(500).json({
        error: "Failed to generate carousel images",
      });
    }
  });

  return app;
}
