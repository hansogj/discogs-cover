
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import 'dotenv/config';
import * as readline from 'node:readline/promises';
import { stdin as input, stdout as output } from 'node:process';

/**
 * Fetches data from a given Discogs API URL.
 * @param {string} url The Discogs API URL to fetch.
 * @returns {Promise<any>} The JSON response from the API.
 */
async function fetchDiscogs(url) {
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
  return response.json();
}

/**
 * Downloads an image from a URL and returns it as a Buffer.
 * @param {string} url The URL of the image to download.
 * @returns {Promise<Buffer>} A Buffer containing the image data.
 */
async function downloadImage(url) {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to download image: ${response.statusText}`);
  }
  const arrayBuffer = await response.arrayBuffer();
  return Buffer.from(arrayBuffer);
}

/**
 * Prompts the user to select an item from a list of results.
 * @param {Array<any>} results The list of results from the Discogs API.
 * @returns {Promise<any>} The item selected by the user.
 */
async function promptUser(results) {
  const rl = readline.createInterface({ input, output });
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
 * @param {{artist: string, title: string, strategy?: 'first' | 'prompt'}} options
 * @returns {Promise<Buffer>} A Buffer containing the cover image data.
 */
export async function discogsMainCover({ artist, title, strategy = 'first' }) {
  if (!artist || !title) {
    throw new Error('Artist and title are required.');
  }

  const searchUrl = `https://api.discogs.com/database/search?release_title=${encodeURIComponent(
    title
  )}&artist=${encodeURIComponent(artist)}&type=master`;
  const data = await fetchDiscogs(searchUrl);

  if (!data.results || data.results.length === 0) {
    throw new Error('No results found for this artist and album.');
  }

  let selectedItem;
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
