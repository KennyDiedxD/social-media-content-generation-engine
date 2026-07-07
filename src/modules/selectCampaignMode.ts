import readline from "readline/promises";
import { stdin as input, stdout as output } from "process";
import {
  listCampaignBriefs,
  loadCampaignBrief,
  type CampaignBrief,
} from "./loadCampaignBrief";

export type CampaignMode =
  | { mode: "auto"; brief?: undefined }
  | { mode: "brief"; brief: CampaignBrief };

export async function selectCampaignMode(): Promise<CampaignMode> {
  const rl = readline.createInterface({ input, output });

  try {
    console.log("\nChoose generation mode:");
    console.log("1. Automatic");
    console.log("2. From brief");

    const modeAnswer = await rl.question("\nSelect 1 or 2: ");

    if (modeAnswer.trim() !== "2") {
      return { mode: "auto" };
    }

    const briefs = await listCampaignBriefs();

    if (briefs.length === 0) {
      console.log("\nNo campaign briefs found. Running automatic mode.");
      return { mode: "auto" };
    }

    console.log("\nAvailable campaign briefs:");
    briefs.forEach((brief, index) => {
      console.log(`${index + 1}. ${brief}`);
    });

    const briefAnswer = await rl.question("\nSelect brief number: ");
    const selectedIndex = Number(briefAnswer.trim()) - 1;

    if (
      !Number.isInteger(selectedIndex) ||
      selectedIndex < 0 ||
      selectedIndex >= briefs.length
    ) {
      throw new Error("Invalid brief selection");
    }

    const brief = await loadCampaignBrief(briefs[selectedIndex]);
    return { mode: "brief", brief };
  } finally {
    rl.close();
  }
}