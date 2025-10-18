/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import { GoogleGenAI } from '@google/genai';

const searchButton = document.getElementById('search-button') as HTMLButtonElement;
const artistInput = document.getElementById('artist-name') as HTMLInputElement;
const albumInput = document.getElementById('album-title') as HTMLInputElement;
const discogsKeyInput = document.getElementById('discogs-key') as HTMLInputElement;
const discogsSecretInput = document.getElementById('discogs-secret') as HTMLInputElement;
const resultsContainer = document.getElementById('results-container');
const loader = document.getElementById('loader');
const geminiOutputContainer = document.getElementById('gemini-output');
const geminiTextContainer = document.getElementById('gemini-text');

let ai: GoogleGenAI;

searchButton.addEventListener('click', async () => {
  const artist = artistInput.value.trim();
  const album = albumInput.value.trim();
  const discogsKey = discogsKeyInput.value.trim();
  const discogsSecret = discogsSecretInput.value.trim();

  if (!discogsKey || !discogsSecret) {
    displayError('Please enter your Discogs API Key and Secret.');
    return;
  }
  if (!artist || !album) {
    displayError('Please enter both an artist and an album title.');
    return;
  }

  clearResults();
  showLoader(true);

  try {
    const response = await fetch(
      `https://api.discogs.com/database/search?release_title=${encodeURIComponent(album)}&artist=${encodeURIComponent(artist)}&type=master&key=${discogsKey}&secret=${discogsSecret}`
    );

    if (!response.ok) {
      throw new Error(`Discogs API error: ${response.statusText}`);
    }

    const data = await response.json();

    if (data.results && data.results.length > 0) {
      handleResults(data.results);
    } else {
      displayError('No results found for this artist and album.');
    }
  } catch (error) {
    console.error('Search failed:', error);
    displayError('Failed to fetch data from Discogs. Check your credentials and network connection.');
  } finally {
    showLoader(false);
  }
});

function handleResults(results: any[]) {
  if (results.length === 1) {
    displayCover(results[0]);
  } else {
    // Prompt user to select the correct item
    const selectionTitle = document.createElement('h3');
    selectionTitle.textContent = 'Multiple results found. Please select the correct one:';
    resultsContainer.appendChild(selectionTitle);

    const selectionList = document.createElement('ul');
    selectionList.className = 'selection-list';

    results.forEach(item => {
      const listItem = document.createElement('li');
      const button = document.createElement('button');
      button.textContent = `${item.title} (${item.year || 'N/A'})`;
      button.addEventListener('click', () => {
        clearResults();
        displayCover(item);
      });
      listItem.appendChild(button);
      selectionList.appendChild(listItem);
    });
    resultsContainer.appendChild(selectionList);
  }
}

function displayCover(item: any) {
  const coverUrl = item.cover_image;
  
  if (!coverUrl || coverUrl.includes('default-release.png')) {
      displayError('No cover image available for this release.');
      return;
  }

  const artist = item.title.split(' - ')[0];
  const album = item.title.split(' - ')[1];

  const img = document.createElement('img');
  img.src = coverUrl;
  img.alt = `Cover art for ${item.title}`;
  img.className = 'cover-art';

  const geminiButton = document.createElement('button');
  geminiButton.textContent = 'Tell me about this album';
  geminiButton.className = 'gemini-button';
  geminiButton.onclick = () => getGeminiFacts(artist, album, geminiButton);

  resultsContainer.append(img, geminiButton);
}

async function getGeminiFacts(artist: string, album: string, button: HTMLButtonElement) {
    button.disabled = true;
    button.textContent = 'Getting facts...';
    geminiOutputContainer.classList.remove('hidden');
    geminiTextContainer.innerHTML = '';

    try {
        // Lazily initialize AI instance
        if (!ai) {
             ai = new GoogleGenAI({apiKey: process.env.API_KEY});
        }
       
        const prompt = `Tell me some interesting facts about the album "${album}" by the artist "${artist}". Format the response as simple HTML paragraphs.`;
        const response = await ai.models.generateContentStream({
            model: 'gemini-2.5-flash',
            contents: prompt,
        });

        for await (const chunk of response) {
            geminiTextContainer.innerHTML += chunk.text.replace(/\n/g, '<br>');
        }
    } catch (error) {
        console.error('Gemini API error:', error);
        geminiTextContainer.textContent = 'Sorry, I couldn\'t fetch facts for this album.';
    } finally {
        button.disabled = false;
        button.textContent = 'Tell me about this album';
    }
}

function displayError(message: string) {
  resultsContainer.innerHTML = `<p class="error">${message}</p>`;
}

function clearResults() {
  resultsContainer.innerHTML = '';
  geminiOutputContainer.classList.add('hidden');
  geminiTextContainer.innerHTML = '';
}

function showLoader(isLoading: boolean) {
  loader.classList.toggle('hidden', !isLoading);
}
