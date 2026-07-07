export const linkedinConfig = {
  platform: "linkedin" as const,

  output: {
    type: "text_post",
    language: "English",
    maxWords: 250,
    allowEmojis: false,
    includeHashtags: true,
    includeCTA: true,
  },

  generation: {
    temperature: 0.6,
  },
};