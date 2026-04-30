import "dotenv/config";
import { promises as fs } from "node:fs";
import path from "node:path";
import { VOICE_LINES } from "../src/voice-lines.js";
import { MODEL_ID, VOICE_ID, VOICE_SETTINGS } from "./voice-config.mjs";

const apiKey = process.env.ELEVENLABS_API_KEY;
if (!apiKey) {
  console.error("Missing ELEVENLABS_API_KEY in .env or shell environment");
  process.exit(1);
}

const force = process.argv.includes("--force");

for (const line of VOICE_LINES) {
  const outFile = path.resolve(line.path);
  await fs.mkdir(path.dirname(outFile), { recursive: true });

  const exists = await fs.stat(outFile).then(() => true).catch(() => false);
  if (exists && !force) {
    console.log(`  skip  ${line.id} (already exists; pass --force to regenerate)`);
    continue;
  }

  const url = `https://api.elevenlabs.io/v1/text-to-speech/${VOICE_ID}?output_format=mp3_44100_128`;
  const res = await fetch(url, {
    method: "POST",
    headers: {
      "xi-api-key": apiKey,
      "content-type": "application/json"
    },
    body: JSON.stringify({
      text: line.text,
      model_id: MODEL_ID,
      voice_settings: VOICE_SETTINGS
    })
  });

  if (!res.ok) {
    console.error(`  FAIL  ${line.id}: ${res.status} ${await res.text()}`);
    process.exit(1);
  }

  await fs.writeFile(outFile, Buffer.from(await res.arrayBuffer()));
  console.log(`  ok    ${line.id} -> ${path.relative(process.cwd(), outFile)}`);
}

console.log("Done.");
