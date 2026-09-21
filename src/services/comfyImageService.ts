import workflowTemplate from "../integrations/comfy/workflows/eddy_flux2_klein_api.json";

type ComfyWorkflow = Record<string, any>;

const COMFYUI_URL = process.env.COMFYUI_URL ?? "http://192.168.0.217:8188";

function cloneWorkflow(): ComfyWorkflow {
  return JSON.parse(JSON.stringify(workflowTemplate)) as ComfyWorkflow;
}

function buildWorkflow(prompt: string): ComfyWorkflow {
  const workflow = cloneWorkflow();

  workflow["76"].inputs.value = prompt;
  workflow["75:68"].inputs.value = 768;
  workflow["75:69"].inputs.value = 768;
  workflow["75:62"].inputs.steps = 20;
  workflow["75:73"].inputs.noise_seed = Math.floor(
    Math.random() * 1_000_000_000_000_000,
  );
  workflow["9"].inputs.filename_prefix = "Eddy-Flux2-Klein";

  return workflow;
}

async function queuePrompt(workflow: ComfyWorkflow): Promise<string> {
  const response = await fetch(`${COMFYUI_URL}/prompt`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      prompt: workflow,
    }),
  });

  const data = (await response.json()) as {
    prompt_id?: string;
    error?: unknown;
  };

  if (!response.ok || !data.prompt_id) {
    throw new Error(`Failed to queue ComfyUI prompt: ${JSON.stringify(data)}`);
  }

  return data.prompt_id;
}

async function sleep(ms: number): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, ms));
}

async function waitForImage(
  promptId: string,
  timeoutMs = 5 * 60 * 1000,
): Promise<{
  filename: string;
  subfolder: string;
  type: string;
}> {
  const startedAt = Date.now();

  while (Date.now() - startedAt < timeoutMs) {
    const response = await fetch(`${COMFYUI_URL}/history/${promptId}`);
    const data = (await response.json()) as Record<string, any>;

    const run = data[promptId];

    if (run?.outputs?.["9"]?.images?.length) {
      return run.outputs["9"].images[0] as {
        filename: string;
        subfolder: string;
        type: string;
      };
    }

    await sleep(1500);
  }

  throw new Error("Timed out waiting for ComfyUI image output");
}

async function downloadImageFile(image: {
  filename: string;
  subfolder: string;
  type: string;
}): Promise<Buffer> {
  const params = new URLSearchParams({
    filename: image.filename,
    subfolder: image.subfolder ?? "",
    type: image.type ?? "output",
  });

  const response = await fetch(`${COMFYUI_URL}/view?${params.toString()}`);

  if (!response.ok) {
    throw new Error(`Failed to download ComfyUI image: ${response.status}`);
  }

  const arrayBuffer = await response.arrayBuffer();
  return Buffer.from(arrayBuffer);
}

export async function generateImageFromPrompt(prompt: string): Promise<Buffer> {
  const workflow = buildWorkflow(prompt);
  const promptId = await queuePrompt(workflow);
  const imageInfo = await waitForImage(promptId);
  return downloadImageFile(imageInfo);
}
