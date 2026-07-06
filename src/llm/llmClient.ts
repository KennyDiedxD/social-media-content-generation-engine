import "dotenv/config";

const OLLAMA_URL = process.env.OLLAMA_URL || "http://localhost:11434";
const OLLAMA_MODEL = process.env.OLLAMA_MODEL || "gemma3:4b";
const MOCK_LLM = process.env.MOCK_LLM === "true";

type OllamaGenerateResponse = {
  response?: string;
  done?: boolean;
  error?: string;
};

function mockGenerateText(prompt: string): string {
if (prompt.includes("Generate exactly 3 content ideas")) {    return JSON.stringify(
      [
  {
    title: "Most AI tutors wait. Children need guidance.",
    pillar: "AI Tutor Myths",
    angle:
      "Most AI tools assume the child knows what to ask. Eddy starts with guidance.",
    audience: "Parents",
    whyItMatters:
      "This directly supports Eddy's positioning as a guided learning platform.",
    suggestedPlatforms: ["LinkedIn", "Instagram"],
  },
  {
    title: "Studying longer is not the same as learning better.",
    pillar: "Learning How to Learn",
    angle:
      "Parents often measure effort by time, but understanding needs feedback and correction.",
    audience: "Parents",
    whyItMatters:
      "This speaks to a common parent concern and connects to Eddy's learning philosophy.",
    suggestedPlatforms: ["Instagram", "LinkedIn"],
  },
  {
    title: "Marks are a late signal.",
    pillar: "Parent Visibility",
    angle:
      "By the time marks arrive, the learning gap has already formed.",
    audience: "Parents",
    whyItMatters:
      "This frames Eddy as a system that gives earlier learning visibility.",
    suggestedPlatforms: ["LinkedIn", "Instagram"],
  }
],
      null,
      2
    );
  }

  return "Eddy's content should focus on helping parents understand why guided learning, not instant answers, builds stronger students.";
}

export async function generateText(prompt: string): Promise<string> {
  if (MOCK_LLM) {
    console.log("🧪 Using mock LLM response");
    return mockGenerateText(prompt);
  }

  const response = await fetch(`${OLLAMA_URL}/api/generate`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: OLLAMA_MODEL,
      prompt,
      stream: false,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Ollama request failed: ${response.status} ${errorText}`);
  }

  const data = (await response.json()) as OllamaGenerateResponse;

  if (data.error) {
    throw new Error(`Ollama error: ${data.error}`);
  }

  return data.response?.trim() || "";
}