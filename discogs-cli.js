#!/usr/bin/env node

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import 'dotenv/config';
import * as readline from 'node:readline/promises';
import { stdin as input, stdout as output } from 'node:process';
import * as fs from 'node:fs';
import * as path from 'node:path';
import * as https from 'node:https';

// Check for required environment variables
const { DISCOGS_TOKEN } = process.env;

if (!DISCOGS_TOKEN) {
  console.error(
    'Error: Missing required environment variables.'
  );
  console.error('Please create a .env file and set DISCOGS_TOKEN. See README.md for details.');
  process.exit(1);
}

// Get command-line arguments
const [artist, album, targetFolder = '.'] = process.argv.slice(2);

if (!artist || !album) {
  console.error('Error: Artist and album title are required.');
  console.error('Usage: ./discogs-cli.js "Artist Name" "Album Title" ["/path/to/folder"]');
  process.exit(1);
}

const rl = readline.createInterface({ input, output });

async function main() {
  console.log(`Searching for "${album}" by ${artist}...`);
  try {
    const response = await fetch(
      `https://api.discogs.com/database/search?release_title=${encodeURIComponent(
        album
      )}&artist=${encodeURIComponent(artist)}&type=master`,
      {
        headers: {
          'User-Agent': 'AlbumArtCLI/1.0',
          'Authorization': `Discogs token=${DISCOGS_TOKEN}`,
        }
      }
    );

    if (!response.ok) {
      throw new Error(`Discogs API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();

    if (!data.results || data.results.length === 0) {
      console.log('No results found for this artist and album.');
      return;
    }

    let selectedItem;
    if (data.results.length === 1) {
      selectedItem = data.results[0];
    } else {
      selectedItem = await promptForSelection(data.results);
    }
    
    if (selectedItem) {
        await processSelectedItem(selectedItem);
    }

  } catch (error) {
    console.error('\nAn error occurred:', error.message);
  } finally {
    rl.close();
  }
}

async function promptForSelection(results) {
  console.log('\nMultiple results found. Please select the correct one:');
  results.forEach((item, index) => {
    console.log(`${index + 1}: ${item.title} (${item.year || 'N/A'})`);
  });

  const answer = await rl.question('Enter the number of your choice (or 0 to cancel): ');
  const choice = parseInt(answer, 10);

  if (isNaN(choice) || choice < 0 || choice > results.length) {
    console.log('Invalid selection.');
    return null;
  }
  
  if (choice === 0) {
    console.log('Selection cancelled.');
    return null;
  }

  return results[choice - 1];
}

async function processSelectedItem(item) {
    const coverUrl = item.cover_image;

    if (!coverUrl || coverUrl.includes('default-release.png')) {
        console.log('\nNo cover image available for this release.');
    } else {
        console.log('\n✅ Cover Image URL:');
        console.log(coverUrl);
        await downloadImage(coverUrl);
    }
}

async function downloadImage(url) {
    const filename = `cover.jpg`;
    const fullPath = path.resolve(targetFolder, filename);

    try {
        // Ensure the target directory exists
        await fs.promises.mkdir(targetFolder, { recursive: true });

        console.log(`\nDownloading to ${fullPath}...`);

        const fileStream = fs.createWriteStream(fullPath);
        
        await new Promise((resolve, reject) => {
            https.get(url, (response) => {
                response.pipe(fileStream);
                fileStream.on('finish', () => {
                    fileStream.close();
                    console.log('✅ Download complete!');
                    resolve();
                });
            }).on('error', (err) => {
                fs.unlink(fullPath, () => {}); // Delete the file on error
                reject(err);
            });
        });

    } catch (error) {
        console.error('Failed to download image:', error.message);
    }
}

main();