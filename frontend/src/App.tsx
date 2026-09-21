import { useEffect, useState } from "react";
import "./App.css";

type DraftStatus =
  | "DRAFT"
  | "READY_FOR_REVIEW"
  | "APPROVED"
  | "REJECTED"
  | "PUBLISHED";

type Draft = {
  id: string;
  ideaTitle: string;
  platform: Platform;
  postKind?: PostKind;

  text?: string;
  caption?: string;
  hashtags?: string[];

  visualBrief?: string;
  imagePrompt?: string;

  carouselSlides?: string[];

  status: DraftStatus;
  mediaStatus?: "NOT_REQUIRED" | "MISSING" | "ATTACHED";
  mediaUrl?: string;
  mediaUrls?: string[];

  publishedAt?: string;
  platformPostId?: string;
};

type ContentIdea = {
  title: string;
  pillar: string;
  angle: string;
  audience: string;
  whyItMatters: string;

  suggestedPlatforms: Platform[];

  postKind: PostKind;
  objective: ContentObjective;

  archetype?: ContentArchetype;

  visualConcept?: string;
};

type Platform = "LinkedIn" | "Instagram";

type PostKind = "TEXT" | "IMAGE" | "CAROUSEL";

type ContentArchetype =
  | "INSIGHT_REFRAME"
  | "STRUCTURED_LIST"
  | "SEQUENCE"
  | "CONTRAST"
  | "PROBLEM_BETTER_WAY"
  | "FRAMEWORK_MODEL"
  | "EXPLAINER_QA"
  | "EVIDENCE_DATA_STORY"
  | "STORY_CASE"
  | "INTERACTIVE_SWIPE"
  | "MEME_RELATABLE"
  | "SOCIAL_TEXT_COMMENTARY";

type SignalType =
  | "NOTE"
  | "ARTICLE"
  | "SOCIAL_POST"
  | "NEWS"
  | "PRODUCT_UPDATE";

type ContentObjective =
  | "THOUGHT_LEADERSHIP"
  | "PARENT_EDUCATION"
  | "PRODUCT_AWARENESS"
  | "ENGAGEMENT";

const API_URL = "http://localhost:3001";

function App() {
  const [drafts, setDrafts] = useState<Draft[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionId, setActionId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingCaption, setEditingCaption] = useState("");
  const [editingHashtags, setEditingHashtags] = useState("");
  const [editingVisualBrief, setEditingVisualBrief] = useState("");
  const [editingCarouselSlides, setEditingCarouselSlides] = useState<string[]>(
    [],
  );
  const [editingText, setEditingText] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [ideas, setIdeas] = useState<ContentIdea[]>([]);
  const [generatingIdeas, setGeneratingIdeas] = useState(false);
  const [generatingDraftsFor, setGeneratingDraftsFor] = useState<string | null>(
    null,
  );
  const [selectedPlatforms, setSelectedPlatforms] = useState<Platform[]>([
    "LinkedIn",
    "Instagram",
  ]);
  const [imageProvider, setImageProvider] = useState<"gemini" | "klein">(
    "gemini",
  );

  const [signalType, setSignalType] = useState<SignalType>("NOTE");

  const [signalTitle, setSignalTitle] = useState("");
  const [signalContent, setSignalContent] = useState("");
  const [signalUrl, setSignalUrl] = useState("");

  const [savingSignal, setSavingSignal] = useState(false);

  const [postKind, setPostKind] = useState<PostKind>("IMAGE");
  useEffect(() => {
    if (selectedPlatforms.includes("Instagram") && postKind === "TEXT") {
      setPostKind("IMAGE");
    }
  }, [selectedPlatforms, postKind]);
  const [objective, setObjective] =
    useState<ContentObjective>("PARENT_EDUCATION");
  const [archetype, setArchetype] =
    useState<ContentArchetype>("INSIGHT_REFRAME");

  const [draftTab, setDraftTab] = useState<"ACTIVE" | "HISTORY">("ACTIVE");
  const [historyFilter, setHistoryFilter] = useState<
    "ALL" | "PUBLISHED" | "REJECTED"
  >("ALL");
  const [generationOpen, setGenerationOpen] = useState(false);
  useEffect(() => {
    loadDrafts();
  }, []);

  async function loadDrafts() {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`${API_URL}/drafts`);

      if (!response.ok) {
        throw new Error("Could not load drafts");
      }

      const data = await response.json();
      setDrafts(data.drafts);
    } catch (err) {
      console.error(err);
      setError("Could not connect to the Eddy Social Manager backend.");
    } finally {
      setLoading(false);
    }
  }

  async function saveCurrentSignal() {
    if (!signalContent.trim()) {
      return null;
    }

    try {
      setSavingSignal(true);

      const response = await fetch(`${API_URL}/signals`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          type: signalType,
          title: signalTitle.trim() || undefined,
          content: signalContent.trim(),
          sourceUrl: signalUrl.trim() || undefined,
        }),
      });

      if (!response.ok) {
        throw new Error("Could not save inspiration");
      }

      const data = await response.json();

      return data.signal;
    } catch (error) {
      console.error("Failed to save inspiration:", error);
      setError("Could not save the inspiration input.");
      return null;
    } finally {
      setSavingSignal(false);
    }
  }

  async function uploadDraftMedia(draftId: string, file: File) {
    try {
      setActionId(draftId);
      setError(null);

      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch(`${API_URL}/drafts/${draftId}/media`, {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Media upload failed");
      }

      const data = await response.json();

      setDrafts((current) =>
        current.map((draft) => (draft.id === draftId ? data.draft : draft)),
      );
    } catch (error) {
      console.error(error);
      setError("Could not upload media.");
    } finally {
      setActionId(null);
    }
  }

  async function uploadCarouselMedia(draftId: string, files: File[]) {
    try {
      setActionId(draftId);
      setError(null);

      const formData = new FormData();

      files.forEach((file) => {
        formData.append("files", file);
      });

      const response = await fetch(
        `${API_URL}/drafts/${draftId}/carousel-media`,
        {
          method: "POST",
          body: formData,
        },
      );

      if (!response.ok) {
        throw new Error("Carousel upload failed");
      }

      const data = await response.json();

      setDrafts((current) =>
        current.map((draft) => (draft.id === draftId ? data.draft : draft)),
      );
    } catch (error) {
      console.error(error);
      setError("Could not upload carousel images.");
    } finally {
      setActionId(null);
    }
  }

  async function generateDraftImage(draftId: string) {
    try {
      setActionId(draftId);
      setError(null);

      const response = await fetch(
        `${API_URL}/drafts/${draftId}/generate-image`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            provider: imageProvider,
          }),
        },
      );

      if (!response.ok) {
        throw new Error("Image generation failed");
      }

      const data = await response.json();

      setDrafts((current) =>
        current.map((draft) => (draft.id === draftId ? data.draft : draft)),
      );
    } catch (error) {
      console.error(error);
      setError("Could not generate image.");
    } finally {
      setActionId(null);
    }
  }

  async function generateCarouselImages(draftId: string) {
    try {
      setActionId(draftId);
      setError(null);

      const response = await fetch(
        `${API_URL}/drafts/${draftId}/generate-carousel-images`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            provider: imageProvider,
          }),
        },
      );

      if (!response.ok) {
        throw new Error("Carousel generation failed");
      }

      const data = await response.json();

      setDrafts((current) =>
        current.map((draft) => (draft.id === draftId ? data.draft : draft)),
      );
    } catch (error) {
      console.error(error);

      setError("Could not generate carousel images.");
    } finally {
      setActionId(null);
    }
  }

  async function approveDraft(id: string) {
    try {
      setActionId(id);

      const response = await fetch(`${API_URL}/drafts/${id}/approve`, {
        method: "POST",
      });

      if (!response.ok) {
        throw new Error("Approval failed");
      }

      const data = await response.json();

      setDrafts((current) =>
        current.map((draft) => (draft.id === id ? data.draft : draft)),
      );
    } catch (err) {
      console.error(err);
      setError("Could not approve the draft.");
    } finally {
      setActionId(null);
    }
  }

  async function generateIdeas() {
    try {
      setGeneratingIdeas(true);
      setError(null);

      let signalIds: string[] = [];

      // If the user entered inspiration,
      // save it automatically before generating.
      if (signalContent.trim()) {
        const signal = await saveCurrentSignal();

        if (!signal) {
          return;
        }

        signalIds = [signal.id];
      }

      const response = await fetch(`${API_URL}/ideas/generate`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          platforms: selectedPlatforms,
          postKind,
          objective,

          archetype: postKind === "CAROUSEL" ? archetype : undefined,

          signalIds,
        }),
      });

      if (!response.ok) {
        throw new Error("Could not generate ideas");
      }

      const data = await response.json();

      setIdeas(data.ideas);
    } catch (error) {
      console.error(error);
      setError("Could not generate content ideas.");
    } finally {
      setGeneratingIdeas(false);
    }
  }

  async function generateDrafts(idea: ContentIdea) {
    try {
      setGeneratingDraftsFor(idea.title);
      setError(null);

      const response = await fetch(`${API_URL}/drafts/generate`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          idea,
          imageProvider,
        }),
      });

      if (!response.ok) {
        throw new Error("Could not generate drafts");
      }

      const data = await response.json();

      setDrafts((current) => {
        const incomingIds = new Set(
          data.drafts.map((draft: Draft) => draft.id),
        );

        return [
          ...data.drafts,
          ...current.filter((draft) => !incomingIds.has(draft.id)),
        ];
      });
    } catch (err) {
      console.error(err);
      setError("Could not generate drafts for this idea.");
    } finally {
      setGeneratingDraftsFor(null);
    }
  }

  async function publishDraft(id: string) {
    try {
      setActionId(id);
      setError(null);

      const response = await fetch(`${API_URL}/drafts/${id}/publish`, {
        method: "POST",
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error ?? "Publishing failed");
      }

      setDrafts((current) =>
        current.map((draft) => (draft.id === id ? data.draft : draft)),
      );
    } catch (err) {
      console.error(err);

      setError(
        err instanceof Error ? err.message : "Could not publish the draft.",
      );
    } finally {
      setActionId(null);
    }
  }

  async function deleteDraft(id: string) {
    const confirmed = window.confirm("Delete this post permanently?");

    if (!confirmed) {
      return;
    }

    try {
      setActionId(id);
      setError(null);

      const response = await fetch(`${API_URL}/drafts/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Delete failed");
      }

      setDrafts((current) => current.filter((draft) => draft.id !== id));
    } catch (error) {
      console.error(error);
      setError("Could not delete the post.");
    } finally {
      setActionId(null);
    }
  }

  async function rejectDraft(id: string) {
    try {
      setActionId(id);

      const response = await fetch(`${API_URL}/drafts/${id}/reject`, {
        method: "POST",
      });

      if (!response.ok) {
        throw new Error("Rejection failed");
      }

      const data = await response.json();

      setDrafts((current) =>
        current.map((draft) => (draft.id === id ? data.draft : draft)),
      );
    } catch (err) {
      console.error(err);
      setError("Could not reject the draft.");
    } finally {
      setActionId(null);
    }
  }

  function closeGenerationModal() {
    setGenerationOpen(false);
  }

  function startEditing(draft: Draft) {
    setEditingId(draft.id);

    setEditingText(draft.text ?? "");

    setEditingCaption(draft.caption ?? "");

    setEditingHashtags(draft.hashtags?.join(" ") ?? "");

    setEditingVisualBrief(draft.visualBrief ?? "");

    setEditingCarouselSlides(draft.carouselSlides ?? []);
  }

  function cancelEditing() {
    setEditingId(null);
    setEditingText("");
  }

  function togglePlatform(platform: Platform) {
    setSelectedPlatforms((current) => {
      if (current.includes(platform)) {
        return current.filter((item) => item !== platform);
      }

      return [...current, platform];
    });
  }

  async function saveDraft(draft: Draft) {
    try {
      setActionId(draft.id);

      const postKind = draft.postKind ?? "TEXT";

      const updates =
        postKind === "TEXT"
          ? {
              text: editingText,
            }
          : postKind === "IMAGE"
            ? {
                caption: editingCaption,
                hashtags: editingHashtags.split(/\s+/).filter(Boolean),
                visualBrief: editingVisualBrief,
              }
            : {
                caption: editingCaption,
                hashtags: editingHashtags.split(/\s+/).filter(Boolean),
                visualBrief: editingVisualBrief,
                carouselSlides: editingCarouselSlides,
              };

      const response = await fetch(`${API_URL}/drafts/${draft.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(updates),
      });

      if (!response.ok) {
        throw new Error("Update failed");
      }

      const data = await response.json();

      setDrafts((current) =>
        current.map((item) => (item.id === draft.id ? data.draft : item)),
      );

      setEditingId(null);
      setEditingText("");
      setEditingCaption("");
      setEditingHashtags("");
      setEditingVisualBrief("");
      setEditingCarouselSlides([]);
    } catch (err) {
      console.error(err);
      setError("Could not save the draft.");
    } finally {
      setActionId(null);
    }
  }

  function getStatusLabel(status: DraftStatus) {
    switch (status) {
      case "READY_FOR_REVIEW":
        return "Needs review";
      case "APPROVED":
        return "Approved";
      case "REJECTED":
        return "Rejected";
      default:
        return "Draft";
    }
  }

  if (loading) {
    return (
      <div className="page">
        <div className="loading">Loading Eddy Social Manager...</div>
      </div>
    );
  }

  const pendingCount = drafts.filter(
    (draft) => draft.status === "READY_FOR_REVIEW",
  ).length;

  const approvedCount = drafts.filter(
    (draft) => draft.status === "APPROVED",
  ).length;

  const activeDrafts = drafts.filter(
    (draft) => draft.status !== "PUBLISHED" && draft.status !== "REJECTED",
  );

  const historyDrafts = drafts.filter(
    (draft) => draft.status === "PUBLISHED" || draft.status === "REJECTED",
  );

  const filteredHistoryDrafts =
    historyFilter === "ALL"
      ? historyDrafts
      : historyDrafts.filter((draft) => draft.status === historyFilter);

  const visibleDrafts =
    draftTab === "ACTIVE" ? activeDrafts : filteredHistoryDrafts;

  return (
    <div className="page">
      <header className="topbar">
        <div>
          <div className="eyebrow">EDDY</div>
          <h1>Social Manager</h1>
          <p className="subtitle">
            Review and approve social content before it goes live.
          </p>
        </div>

        <button className="secondaryButton" onClick={loadDrafts}>
          Refresh
        </button>
      </header>

      <main>
        <section className="summary">
          <div className="summaryCard">
            <span className="summaryNumber">{drafts.length}</span>
            <span className="summaryLabel">Total drafts</span>
          </div>

          <div className="summaryCard">
            <span className="summaryNumber">{pendingCount}</span>
            <span className="summaryLabel">Needs review</span>
          </div>

          <div className="summaryCard">
            <span className="summaryNumber">{approvedCount}</span>
            <span className="summaryLabel">Approved</span>
          </div>
        </section>

        <section className="generatePanel">
          <div>
            <h2>Create content</h2>
            <p>Generate new social content ideas for Eddy.</p>
          </div>

          <button
            className="primaryButton"
            onClick={() => setGenerationOpen(true)}
          >
            Generate content
          </button>
        </section>

        {error && <div className="errorMessage">{error}</div>}

        <section className="contentHeader">
          <div>
            <h2>Content drafts</h2>
            <p>Review the posts prepared for each platform.</p>
          </div>
        </section>

        <div className="draftTabs">
          <button
            className={draftTab === "ACTIVE" ? "draftTab active" : "draftTab"}
            onClick={() => setDraftTab("ACTIVE")}
          >
            Active
            <span>{activeDrafts.length}</span>
          </button>

          <button
            className={draftTab === "HISTORY" ? "draftTab active" : "draftTab"}
            onClick={() => setDraftTab("HISTORY")}
          >
            Completed
            <span>{historyDrafts.length}</span>
          </button>
        </div>

        {draftTab === "HISTORY" && (
          <div className="draftTabs">
            <button
              className={
                historyFilter === "ALL" ? "draftTab active" : "draftTab"
              }
              onClick={() => setHistoryFilter("ALL")}
            >
              All
              <span>{historyDrafts.length}</span>
            </button>

            <button
              className={
                historyFilter === "PUBLISHED" ? "draftTab active" : "draftTab"
              }
              onClick={() => setHistoryFilter("PUBLISHED")}
            >
              Published
              <span>
                {
                  historyDrafts.filter((draft) => draft.status === "PUBLISHED")
                    .length
                }
              </span>
            </button>

            <button
              className={
                historyFilter === "REJECTED" ? "draftTab active" : "draftTab"
              }
              onClick={() => setHistoryFilter("REJECTED")}
            >
              Rejected
              <span>
                {
                  historyDrafts.filter((draft) => draft.status === "REJECTED")
                    .length
                }
              </span>
            </button>
          </div>
        )}

        <section className="draftGrid">
          {visibleDrafts.map((draft) => {
            const isEditing = editingId === draft.id;

            return (
              <article className="draftCard" key={draft.id}>
                <div className="draftTop">
                  <div className="draftMeta">
                    <span
                      className={`platformBadge ${draft.platform.toLowerCase()}`}
                    >
                      {draft.platform}
                    </span>

                    <span className="postKindBadge">
                      {draft.postKind ?? "TEXT"}
                    </span>
                  </div>

                  <span className={`statusBadge ${draft.status.toLowerCase()}`}>
                    {getStatusLabel(draft.status)}
                  </span>
                </div>

                <div className="draftBody">
                  <h3>{draft.ideaTitle}</h3>

                  {isEditing ? (
                    <div className="postPreview">
                      {(draft.postKind ?? "TEXT") === "TEXT" && (
                        <textarea
                          className="postEditor"
                          value={editingText}
                          onChange={(event) =>
                            setEditingText(event.target.value)
                          }
                        />
                      )}

                      {draft.postKind === "IMAGE" && (
                        <div className="contentBlock">
                          <span className="contentLabel">Image media</span>

                          <div className="mediaActions">
                            <label className="secondaryButton compactButton">
                              Upload image
                              <input
                                type="file"
                                accept="image/*"
                                style={{ display: "none" }}
                                onChange={(event) => {
                                  const file = event.target.files?.[0];

                                  if (file) {
                                    uploadDraftMedia(draft.id, file);
                                  }
                                }}
                              />
                            </label>
                          </div>

                          {draft.mediaUrl && (
                            <div className="mediaPreviewGrid">
                              <img
                                src={`${API_URL}${draft.mediaUrl}`}
                                alt="Draft media"
                                className="mediaPreviewImage"
                              />
                            </div>
                          )}
                        </div>
                      )}

                      {draft.postKind === "CAROUSEL" && (
                        <>
                          <div className="contentBlock">
                            <span className="contentLabel">Caption</span>

                            <textarea
                              className="postEditor"
                              value={editingCaption}
                              onChange={(event) =>
                                setEditingCaption(event.target.value)
                              }
                            />
                          </div>

                          <div className="contentBlock">
                            <span className="contentLabel">Hashtags</span>

                            <textarea
                              className="postEditor"
                              value={editingHashtags}
                              onChange={(event) =>
                                setEditingHashtags(event.target.value)
                              }
                            />
                          </div>

                          <div className="contentBlock">
                            <span className="contentLabel">Visual brief</span>

                            <textarea
                              className="postEditor"
                              value={editingVisualBrief}
                              onChange={(event) =>
                                setEditingVisualBrief(event.target.value)
                              }
                            />
                          </div>

                          {editingCarouselSlides.map((slide, index) => (
                            <div className="contentBlock" key={index}>
                              <span className="contentLabel">
                                Slide {index + 1}
                              </span>

                              <textarea
                                className="postEditor"
                                value={slide}
                                onChange={(event) => {
                                  const updatedSlides = [
                                    ...editingCarouselSlides,
                                  ];

                                  updatedSlides[index] = event.target.value;

                                  setEditingCarouselSlides(updatedSlides);
                                }}
                              />
                            </div>
                          ))}
                        </>
                      )}
                    </div>
                  ) : (
                    <div className="postPreview">
                      {(draft.postKind ?? "TEXT") === "TEXT" && (
                        <div className="postText">{draft.text}</div>
                      )}

                      {draft.postKind === "IMAGE" && (
                        <>
                          {draft.caption && (
                            <div className="contentBlock">
                              <span className="contentLabel">Caption</span>
                              <div>{draft.caption}</div>
                            </div>
                          )}

                          {draft.hashtags && draft.hashtags.length > 0 && (
                            <div className="contentBlock">
                              <span className="contentLabel">Hashtags</span>

                              <div className="hashtagList">
                                {draft.hashtags.map((hashtag) => (
                                  <span key={hashtag}>{hashtag}</span>
                                ))}
                              </div>
                            </div>
                          )}

                          {draft.visualBrief && (
                            <div className="contentBlock">
                              <span className="contentLabel">Visual brief</span>
                              <div>{draft.visualBrief}</div>
                            </div>
                          )}

                          {draft.imagePrompt && (
                            <div className="contentBlock imagePromptBlock">
                              <span className="contentLabel">Image prompt</span>

                              <div className="imagePromptText">
                                {draft.imagePrompt}
                              </div>

                              <div className="imagePromptActions">
                                <button
                                  className="secondaryButton compactButton"
                                  onClick={() =>
                                    navigator.clipboard.writeText(
                                      draft.imagePrompt ?? "",
                                    )
                                  }
                                >
                                  Copy
                                </button>

                                <div className="imageGenerationControls">
                                  <button
                                    type="button"
                                    className={`modelSwitch ${
                                      imageProvider === "klein"
                                        ? "klein"
                                        : "gemini"
                                    }`}
                                    disabled={actionId === draft.id}
                                    onClick={() =>
                                      setImageProvider(
                                        imageProvider === "gemini"
                                          ? "klein"
                                          : "gemini",
                                      )
                                    }
                                  >
                                    <span className="modelSwitchSlider" />
                                    <span className="modelSwitchOption">
                                      Gemini
                                    </span>
                                    <span className="modelSwitchOption">
                                      Klein
                                    </span>
                                  </button>

                                  <button
                                    className="primaryButton compactButton"
                                    disabled={actionId === draft.id}
                                    onClick={() => generateDraftImage(draft.id)}
                                  >
                                    {actionId === draft.id
                                      ? "Generating..."
                                      : draft.mediaUrl
                                        ? "Generate again"
                                        : "Generate image"}
                                  </button>
                                </div>
                              </div>
                            </div>
                          )}
                          <div className="contentBlock">
                            <span className="contentLabel">Media</span>

                            {draft.mediaStatus === "ATTACHED" &&
                            draft.mediaUrl ? (
                              <img
                                src={`${API_URL}${draft.mediaUrl}`}
                                alt="Attached post media"
                                style={{
                                  width: "100%",
                                  maxWidth: "420px",
                                  borderRadius: "12px",
                                  display: "block",
                                  marginTop: "8px",
                                }}
                              />
                            ) : (
                              <>
                                <div style={{ marginBottom: "8px" }}>
                                  No image attached
                                </div>

                                <input
                                  type="file"
                                  accept="image/*"
                                  disabled={actionId === draft.id}
                                  onChange={(event) => {
                                    const file = event.target.files?.[0];

                                    if (file) {
                                      uploadDraftMedia(draft.id, file);
                                    }
                                  }}
                                />
                              </>
                            )}
                          </div>
                        </>
                      )}

                      {draft.postKind === "CAROUSEL" && (
                        <>
                          {draft.caption && (
                            <div className="contentBlock">
                              <span className="contentLabel">Caption</span>
                              <div>{draft.caption}</div>
                            </div>
                          )}

                          {draft.hashtags && draft.hashtags.length > 0 && (
                            <div className="contentBlock">
                              <span className="contentLabel">Hashtags</span>

                              <div className="hashtagList">
                                {draft.hashtags.map((hashtag) => (
                                  <span key={hashtag}>{hashtag}</span>
                                ))}
                              </div>
                            </div>
                          )}

                          {draft.carouselSlides && (
                            <div className="contentBlock imagePromptBlock">
                              <span className="contentLabel">
                                Carousel slides
                              </span>

                              <div className="carouselPreview">
                                {draft.carouselSlides.map((slide, index) => (
                                  <div className="carouselSlide" key={index}>
                                    <span>Slide {index + 1}</span>
                                    <p>{slide}</p>
                                  </div>
                                ))}
                              </div>

                              <div className="imagePromptActions">
                                <button
                                  className="primaryButton compactButton"
                                  disabled={
                                    actionId === draft.id ||
                                    !draft.carouselSlides?.length
                                  }
                                  onClick={() =>
                                    generateCarouselImages(draft.id)
                                  }
                                >
                                  {actionId === draft.id
                                    ? `Generating ${draft.carouselSlides.length} slides...`
                                    : draft.mediaUrls?.length
                                      ? "Generate carousel again"
                                      : "Generate carousel"}
                                </button>
                              </div>
                            </div>
                          )}
                          <div className="contentBlock">
                            <span className="contentLabel">Carousel media</span>

                            {draft.mediaStatus === "ATTACHED" &&
                            draft.mediaUrls &&
                            draft.mediaUrls.length > 0 ? (
                              <div
                                style={{
                                  display: "grid",
                                  gridTemplateColumns:
                                    "repeat(2, minmax(0, 1fr))",
                                  gap: "8px",
                                  marginTop: "8px",
                                }}
                              >
                                {draft.mediaUrls.map((url, index) => (
                                  <img
                                    key={url}
                                    src={`${API_URL}${url}`}
                                    alt={`Carousel slide ${index + 1}`}
                                    style={{
                                      width: "100%",
                                      borderRadius: "10px",
                                      display: "block",
                                    }}
                                  />
                                ))}
                              </div>
                            ) : (
                              <>
                                <div style={{ marginBottom: "8px" }}>
                                  No carousel images attached
                                </div>

                                <input
                                  type="file"
                                  accept="image/*"
                                  multiple
                                  disabled={actionId === draft.id}
                                  onChange={(event) => {
                                    const files = Array.from(
                                      event.target.files ?? [],
                                    );

                                    if (files.length >= 2) {
                                      uploadCarouselMedia(draft.id, files);
                                    } else {
                                      setError(
                                        "Select at least 2 images for a carousel.",
                                      );
                                    }
                                  }}
                                />
                              </>
                            )}
                          </div>
                        </>
                      )}
                    </div>
                  )}
                </div>

                <div className="draftFooter">
                  {isEditing ? (
                    <>
                      <button
                        className="approveButton"
                        disabled={
                          actionId === draft.id ||
                          ((draft.postKind ?? "TEXT") === "TEXT"
                            ? !editingText.trim()
                            : !editingCaption.trim())
                        }
                        onClick={() => saveDraft(draft)}
                      >
                        {actionId === draft.id ? "Saving..." : "Save"}
                      </button>

                      <button className="rejectButton" onClick={cancelEditing}>
                        Cancel
                      </button>
                    </>
                  ) : draft.status === "READY_FOR_REVIEW" ? (
                    <>
                      <button
                        className="approveButton"
                        disabled={actionId === draft.id}
                        onClick={() => approveDraft(draft.id)}
                      >
                        {actionId === draft.id ? "Working..." : "Approve"}
                      </button>

                      <button
                        className="secondaryButton"
                        onClick={() => startEditing(draft)}
                      >
                        Edit
                      </button>

                      <button
                        className="rejectButton"
                        disabled={actionId === draft.id}
                        onClick={() => rejectDraft(draft.id)}
                      >
                        Reject
                      </button>
                    </>
                  ) : draft.status === "APPROVED" ? (
                    <>
                      <button
                        className="secondaryButton"
                        onClick={() => startEditing(draft)}
                      >
                        Edit
                      </button>

                      <button
                        className="publishButton"
                        disabled={
                          actionId === draft.id ||
                          ((draft.postKind ?? "TEXT") !== "TEXT" &&
                            draft.mediaStatus !== "ATTACHED")
                        }
                        onClick={() => publishDraft(draft.id)}
                      >
                        {actionId === draft.id
                          ? "Publishing..."
                          : (draft.postKind ?? "TEXT") !== "TEXT" &&
                              draft.mediaStatus !== "ATTACHED"
                            ? "Attach media to publish"
                            : "Publish"}
                      </button>
                    </>
                  ) : draft.status === "PUBLISHED" ? (
                    <>
                      <span className="decisionText">✓ Published</span>

                      <button
                        className="rejectButton"
                        disabled={actionId === draft.id}
                        onClick={() => deleteDraft(draft.id)}
                      >
                        Delete
                      </button>
                    </>
                  ) : (
                    <>
                      <span className="decisionText">Rejected</span>

                      <button
                        className="rejectButton"
                        disabled={actionId === draft.id}
                        onClick={() => deleteDraft(draft.id)}
                      >
                        Delete
                      </button>
                    </>
                  )}
                </div>
              </article>
            );
          })}
        </section>

        {visibleDrafts.length === 0 && (
          <div className="emptyState">
            <h3>
              {draftTab === "ACTIVE"
                ? "No active drafts"
                : "No completed posts yet"}
            </h3>

            <p>
              {draftTab === "ACTIVE"
                ? "Generate some content ideas to get started."
                : "Published and rejected posts will appear here."}
            </p>
          </div>
        )}
      </main>
      {generationOpen && (
        <div className="modalOverlay" onClick={closeGenerationModal}>
          <div
            className="generationModal"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="modalHeader">
              <div>
                <h2>Generate content</h2>
                <p>Choose what Eddy should create.</p>
              </div>

              <button
                className="modalClose"
                onClick={closeGenerationModal}
                aria-label="Close"
              >
                ×
              </button>
            </div>

            <div className="modalSection">
              <label className="modalLabel">Platforms</label>

              <div className="optionRow">
                {(["LinkedIn", "Instagram"] as Platform[]).map((platform) => (
                  <button
                    key={platform}
                    className={
                      selectedPlatforms.includes(platform)
                        ? "optionButton selected"
                        : "optionButton"
                    }
                    onClick={() => togglePlatform(platform)}
                  >
                    {platform}
                  </button>
                ))}
              </div>
            </div>

            <div className="modalSection">
              <label className="modalLabel">Post type</label>

              <div className="optionRow">
                {(selectedPlatforms.includes("Instagram")
                  ? (["IMAGE", "CAROUSEL"] as PostKind[])
                  : (["TEXT", "IMAGE", "CAROUSEL"] as PostKind[])
                ).map((kind) => (
                  <button
                    key={kind}
                    className={
                      postKind === kind
                        ? "optionButton selected"
                        : "optionButton"
                    }
                    onClick={() => setPostKind(kind)}
                  >
                    {kind === "TEXT"
                      ? "Text"
                      : kind === "IMAGE"
                        ? "Image"
                        : "Carousel"}
                  </button>
                ))}
              </div>
            </div>
            {postKind === "CAROUSEL" && (
              <>
                <div className="modalSection">
                  <label className="modalLabel">Content type</label>

                  <select
                    className="objectiveSelect"
                    value={archetype}
                    onChange={(event) =>
                      setArchetype(event.target.value as ContentArchetype)
                    }
                  >
                    <option value="INSIGHT_REFRAME">Insight / Reframe</option>
                  </select>
                </div>

                <div className="modalSection">
                  <label className="modalLabel">Visual model</label>

                  <button
                    type="button"
                    className={`modelSwitch ${
                      imageProvider === "klein" ? "klein" : "gemini"
                    }`}
                    onClick={() =>
                      setImageProvider(
                        imageProvider === "gemini" ? "klein" : "gemini",
                      )
                    }
                  >
                    <span className="modelSwitchSlider" />
                    <span className="modelSwitchOption">Gemini</span>
                    <span className="modelSwitchOption">Klein</span>
                  </button>
                </div>
              </>
            )}
            <div className="modalSection">
              <label className="modalLabel">Objective</label>

              <select
                className="objectiveSelect"
                value={objective}
                onChange={(event) =>
                  setObjective(event.target.value as ContentObjective)
                }
              >
                <option value="THOUGHT_LEADERSHIP">Thought leadership</option>

                <option value="PARENT_EDUCATION">Parent education</option>

                <option value="PRODUCT_AWARENESS">Product awareness</option>

                <option value="ENGAGEMENT">Engagement</option>
              </select>
            </div>

            <div className="inspirationCard">
              <div className="inspirationHeader">
                <div>
                  <div className="inspirationTitleRow">
                    <h3>Inspiration</h3>
                    <span className="optionalPill">Optional</span>
                  </div>

                  <p>
                    Give Eddy a note, article, post or update to build ideas
                    around.
                  </p>
                </div>
              </div>

              <div className="signalTypeRow">
                {(
                  [
                    ["NOTE", "Note"],
                    ["ARTICLE", "Article"],
                    ["SOCIAL_POST", "Social post"],
                    ["NEWS", "News"],
                    ["PRODUCT_UPDATE", "Product update"],
                  ] as [SignalType, string][]
                ).map(([value, label]) => (
                  <button
                    key={value}
                    type="button"
                    className={
                      signalType === value
                        ? "signalTypeButton selected"
                        : "signalTypeButton"
                    }
                    onClick={() => setSignalType(value)}
                  >
                    {label}
                  </button>
                ))}
              </div>

              <input
                className="inspirationTitleInput"
                placeholder="Give this input a title..."
                value={signalTitle}
                onChange={(event) => setSignalTitle(event.target.value)}
              />

              <textarea
                className="inspirationEditor"
                placeholder="Paste the idea, article extract, post, news item or product update here..."
                value={signalContent}
                onChange={(event) => setSignalContent(event.target.value)}
              />

              <div className="inspirationFooter">
                <input
                  className="inspirationSourceInput"
                  placeholder="Source URL (optional)"
                  value={signalUrl}
                  onChange={(event) => setSignalUrl(event.target.value)}
                />

                <span className="inspirationHint">
                  Used only for this generation
                </span>
              </div>
            </div>

            <div className="modalActions">
              <button
                className="secondaryButton"
                onClick={closeGenerationModal}
              >
                Cancel
              </button>

              <button
                className="primaryButton"
                onClick={generateIdeas}
                disabled={
                  generatingIdeas ||
                  savingSignal ||
                  selectedPlatforms.length === 0
                }
              >
                {generatingIdeas || savingSignal
                  ? "Generating..."
                  : "Generate ideas"}{" "}
              </button>
            </div>

            {ideas.length > 0 && (
              <div className="modalIdeas">
                <div className="modalIdeasHeader">
                  <h3>Ideas</h3>
                  <p>Select one to create drafts.</p>
                </div>

                <div className="ideaGrid modalIdeaGrid">
                  {ideas.map((idea, index) => (
                    <article
                      className="ideaCard"
                      key={`${idea.title}-${index}`}
                    >
                      <div className="ideaMeta">
                        <span>{idea.pillar}</span>
                        <span>{idea.audience}</span>
                        <span>{idea.postKind}</span>
                      </div>

                      <h3>{idea.title}</h3>

                      <p>{idea.angle}</p>

                      {idea.visualConcept && (
                        <div className="visualConcept">
                          <span className="visualLabel">Visual concept</span>

                          <p>{idea.visualConcept}</p>
                        </div>
                      )}

                      <div className="platformList">
                        {idea.suggestedPlatforms.map((platform) => (
                          <span key={platform}>{platform}</span>
                        ))}
                      </div>

                      <button
                        className="ideaActionButton"
                        onClick={() => generateDrafts(idea)}
                        disabled={generatingDraftsFor === idea.title}
                      >
                        {generatingDraftsFor === idea.title
                          ? "Creating drafts..."
                          : "Create drafts"}
                      </button>
                    </article>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
