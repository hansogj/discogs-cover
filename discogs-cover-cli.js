
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import 'dotenv/config';
import { discogsMainCover } from './index.js';
import * as fs from 'node:fs';
import * as path from 'node:path';

// --- Argument Parser ---
const args = process.argv.slice(2).reduce((acc, arg) => {
  const [key, value] = arg.split('=');
  const cleanKey = key.replace(/^-{1,2}/, ''); // Remove leading dashes
  // Remove quotes from value if they exist
  const cleanValue =
    value && value.startsWith('"') && value.endsWith('"')
      ? value.slice(1, -1)
      : value;
  acc[cleanKey] = cleanValue;
  return acc;
}, {});

// --- Configuration and Validation ---
const artist = args.artist;
const title = args.title;
const targetFolder = args.target || '.';

if (!artist || !title) {
  console.error('Error: -artist and -title are required arguments.');
  console.error(
    'Usage: discogs-cover -artist="Artist Name" -title="Album Title" [-target="/path/to/folder"]'
  );
  process.exit(1);
}

async function runCli() {
  try {
    console.log(`Searching for "${title}" by ${artist}...`);

    // Call the library function to get the image buffer
    const imageBuffer = await discogsMainCover({
      artist,
      title,
      strategy: 'prompt',
    });

    // Ensure the target directory exists
    await fs.promises.mkdir(targetFolder, { recursive: true });

    const filename = `cover.jpg`;
    const fullPath = path.resolve(targetFolder, filename);

    // Save the buffer to a file
    await fs.promises.writeFile(fullPath, imageBuffer);

    console.log(`\n✅ Cover image saved to ${fullPath}`);
  } catch (error) {
    console.error(`\nAn error occurred: ${error.message}`);
    process.exit(1);
  }
}

runCli();
