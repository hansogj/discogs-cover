#!/usr/bin/env node

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import 'dotenv/config';
import { GoogleGenAI } from '@google/genai';
import * as readline from 'node:readline/promises';
import { stdin as input, stdout as output } from 'node:process';

// Check for required environment variables
const { DISCOGS_KEY, DISCOGS_SECRET, API_KEY } = process.env;

if (!DISCOGS_KEY || !DISCOGS_SECRET || !API_KEY) {
  console.error(
    'Error: Missing required environment variables.'
  );
  console.error('Please create a .env file and set DISCOGS_KEY, DISCOGS_SECRET, and API_KEY. See README.md for details.');
  process.exit(1);
}

// Get command-line arguments
const [artist, album] = process.argv.slice(2);

if (!artist || !album) {
  console.error('Error: Artist and album title are required.');
  console.error('Usage: ./discogs-cli.js "Artist Name" "Album Title"');
  process.exit(1);
}

const ai = new GoogleGenAI({apiKey: API_KEY});
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
          'User-Agent': 'GeminiAlbumArtCLI/1.0',
          'Authorization': `Discogs key=${DISCOGS_KEY}, secret=${DISCOGS_SECRET}`,
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
    }

    const getFacts = await rl.question('\nWould you like to get interesting facts about this album? (y/n) ');
    if (getFacts.toLowerCase() === 'y') {
        const [artistName, albumName] = item.title.split(' - ');
        await getGeminiFacts(artistName, albumName);
    }
}

async function getGeminiFacts(artistName, albumName) {
    console.log('\n🤖 Asking Gemini for facts...');
    try {
        const prompt = `Tell me some interesting facts about the album "${albumName}" by the artist "${artistName}".`;
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
        });
        
        console.log('\n--- Album Facts ---');
        console.log(response.text);
        console.log('-------------------');

    } catch (error) {
        console.error('Gemini API error:', error);
    }
}


main();