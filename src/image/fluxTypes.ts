export type FluxTextAlignment = "left" | "center" | "right";

export type FluxTextZone = {
  xRatio: number;
  yRatio: number;
  widthRatio: number;
  heightRatio: number;
  alignment: FluxTextAlignment;
};

export type FluxImagePlan = {
  /**
   * The exact text Eddy will render afterwards.
   * FLUX itself must NOT render this text.
   */
  overlayText: string;

  /**
   * Prompt sent to FLUX.
   * Should describe artwork and reserved text space.
   */
  visualPrompt: string;

  /**
   * Where our renderer should place overlayText.
   * All values are ratios from 0 to 1.
   */
  textZone: FluxTextZone;

  /**
   * Whether the renderer should add a
   * subtle readability treatment behind the text.
   */
  textBackdrop: "NONE" | "GRADIENT" | "TRANSLUCENT_PANEL";

  /**
   * Optional stylistic instruction for the renderer.
   */
  textStyle: "HEADLINE" | "EDITORIAL" | "QUOTE";
};
