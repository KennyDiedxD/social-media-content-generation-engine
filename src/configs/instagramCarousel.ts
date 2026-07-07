export const instagramCarouselConfig = {
  platform: "instagram-carousel" as const,

  output: {
    type: "carousel",
    language: "English",
    slideCount: 6,
    includeCaption: true,
    includeHashtags: true,
  },

  generation: {
    temperature: 0.7,
  },
};