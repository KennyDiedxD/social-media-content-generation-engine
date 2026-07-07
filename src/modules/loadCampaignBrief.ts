import fs from "fs/promises";
import path from "path";
import YAML from "yaml";

export type CampaignBrief = {
  campaignName: string;
  theme?: string;
  tone?: string[];
  audience?: string[];
  goal?: string;
  mustInclude?: string[];
  mustAvoid?: string[];
  referenceNotes?: string[];
  exampleMoment?: string;
  outputs?: {
    ideas?: number;
  };
};

export async function listCampaignBriefs(): Promise<string[]> {
  const campaignsDir = path.join(process.cwd(), "campaigns");

  try {
    const files = await fs.readdir(campaignsDir);
    return files
      .filter((file) => file.endsWith(".yaml") || file.endsWith(".yml"))
      .sort();
  } catch {
    await fs.mkdir(campaignsDir, { recursive: true });
    return [];
  }
}

export async function loadCampaignBrief(fileName: string): Promise<CampaignBrief> {
  const filePath = path.join(process.cwd(), "campaigns", fileName);
  const raw = await fs.readFile(filePath, "utf-8");
  return YAML.parse(raw) as CampaignBrief;
}