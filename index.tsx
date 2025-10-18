/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import 'dotenv/config';
import * as readline from 'node:readline/promises';
// Fix: Import `process` from `node:process` to resolve type errors for Node.js-specific properties like `stdin`, `stdout`, `argv`, and `exit`.
import { process } from 'node:process';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';

// --- TYPE DEFINITIONS & LIBRARY ---

interface DiscogsSearchResultItem {
  title: string;
  year?: string;
  cover_image: string;
  resource_url: string;
}

interface DiscogsSearchResponse {
  results: DiscogsSearchResultItem[];
}

export type DiscogsCoverStrategy = 'first' | 'prompt';

export interface DiscogsCoverOptions {
  /** The name of the artist. */
  artist: string;
  /** The title of the album. */
  title: string;
  /**
   * The strategy to use when multiple results are found.
   * 'first' - (Default) Selects the first result automatically.
   * 'prompt' - Asks the user to select from a list in the console.
   */
  strategy?: DiscogsCoverStrategy;
}

/**
 * Fetches data from a given Discogs API URL.
 * @param url The Discogs API URL to fetch.
 * @returns The JSON response from the API.
 */
async function fetchDiscogs<T>(url: string): Promise<T> {
  const token = process.env.DISCOGS_TOKEN;
  if (!token) {
    throw new Error('DISCOGS_TOKEN is not set in your environment.');
  }
  const response = await fetch(url, {
    headers: {
      'User-Agent': 'HansogjDiscogsCover/1.0',
      Authorization: `Discogs token=${token}`,
    },
  });
  if (!response.ok) {
    throw new Error(`Discogs API error: ${response.status} ${response.statusText}`);
  }
  return response.json() as Promise<T>;
}

/**
 * Downloads an image from a URL and returns it as a Buffer.
 * @param url The URL of the image to download.
 * @returns A Buffer containing the image data.
 */
async function downloadImage(url: string): Promise<Buffer> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to download image: ${response.statusText}`);
  }
  const arrayBuffer = await response.arrayBuffer();
  return Buffer.from(arrayBuffer);
}

/**
 * Prompts the user to select an item from a list of results.
 * @param results The list of results from the Discogs API.
 * @returns The item selected by the user.
 */
async function promptUser(
  results: DiscogsSearchResultItem[]
): Promise<DiscogsSearchResultItem> {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  console.log('\nMultiple results found. Please select one:');
  results.forEach((item, index) => {
    console.log(`${index + 1}: ${item.title} (${item.year || 'N/A'})`);
  });

  let selectedIndex = -1;
  while (selectedIndex < 0 || selectedIndex >= results.length) {
    const answer = await rl.question(
      `Enter a number (1-${results.length}): `
    );
    const num = parseInt(answer, 10) - 1;
    if (!isNaN(num) && num >= 0 && num < results.length) {
      selectedIndex = num;
    } else {
      console.log('Invalid selection. Please try again.');
    }
  }
  rl.close();
  return results[selectedIndex];
}

/**
 * Finds the main cover for a given artist and album title from Discogs.
 * @param options An object containing the artist, title, and optional strategy.
 * @returns A Promise that resolves with a Buffer containing the cover image data.
 */
export async function discogsMainCover({
  artist,
  title,
  strategy = 'first',
}: DiscogsCoverOptions): Promise<Buffer> {
  if (!artist || !title) {
    throw new Error('Artist and title are required.');
  }

  const searchUrl = `https://api.discogs.com/database/search?release_title=${encodeURIComponent(
    title
  )}&artist=${encodeURIComponent(artist)}&type=master`;
  const data = await fetchDiscogs<DiscogsSearchResponse>(searchUrl);

  if (!data.results || data.results.length === 0) {
    throw new Error('No results found for this artist and album.');
  }

  let selectedItem: DiscogsSearchResultItem;
  if (data.results.length > 1 && strategy === 'prompt') {
    selectedItem = await promptUser(data.results);
  } else {
    selectedItem = data.results[0];
  }

  const coverUrl = selectedItem.cover_image;
  if (!coverUrl || coverUrl.includes('default-release.png')) {
    throw new Error('No cover image available for this release.');
  }

  return downloadImage(coverUrl);
}

// --- CLI LOGIC ---

interface CliArgs {
  [key: string]: string | undefined;
}

function parseArgs(): CliArgs {
  return process.argv.slice(2).reduce<CliArgs>((acc, arg) => {
    const [key, value] = arg.split('=');
    const cleanKey = key.replace(/^-{1,2}/, '');
    const cleanValue =
      value && value.startsWith('"') && value.endsWith('"')
        ? value.slice(1, -1)
        : value;
    acc[cleanKey] = cleanValue;
    return acc;
  }, {});
}

async function runCli(): Promise<void> {
  const args = parseArgs();
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

  try {
    console.log(`Searching for "${title}" by ${artist}...`);
    const imageBuffer = await discogsMainCover({
      artist,
      title,
      strategy: 'prompt',
    });
    await fs.promises.mkdir(targetFolder, { recursive: true });
    const filename = `cover.jpg`;
    const fullPath = path.resolve(targetFolder, filename);
    await fs.promises.writeFile(fullPath, imageBuffer);
    console.log(`\n✅ Cover image saved to ${fullPath}`);
  } catch (error: any) {
    console.error(`\nAn error occurred: ${error.message}`);
    process.exit(1);
  }
}

// --- EXECUTION ---

// Run the CLI only when the script is executed directly
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  runCli();
}
