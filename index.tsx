/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

const searchButton = document.getElementById('search-button') as HTMLButtonElement;
const artistInput = document.getElementById('artist-name') as HTMLInputElement;
const albumInput = document.getElementById('album-title') as HTMLInputElement;
const discogsTokenInput = document.getElementById('discogs-token') as HTMLInputElement;
const resultsContainer = document.getElementById('results-container');
const loader = document.getElementById('loader');

searchButton.addEventListener('click', async () => {
  const artist = artistInput.value.trim();
  const album = albumInput.value.trim();
  const discogsToken = discogsTokenInput.value.trim();

  if (!discogsToken) {
    displayError('Please enter your Discogs Personal Access Token.');
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
      `https://api.discogs.com/database/search?release_title=${encodeURIComponent(album)}&artist=${encodeURIComponent(artist)}&type=master`,
      {
        headers: {
          'User-Agent': 'GeminiAlbumArtWebApp/1.0',
          'Authorization': `Discogs token=${discogsToken}`,
        },
      }
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

  const img = document.createElement('img');
  img.src = coverUrl;
  img.alt = `Cover art for ${item.title}`;
  img.className = 'cover-art';

  const downloadButton = document.createElement('button');
  downloadButton.textContent = 'Download Cover';
  downloadButton.className = 'download-button';
  downloadButton.onclick = () => downloadImage(coverUrl);
  
  resultsContainer.append(img, downloadButton);
}

async function downloadImage(url: string) {
    try {
        const response = await fetch(url);
        if (!response.ok) throw new Error('Network response was not ok.');
        const blob = await response.blob();
        
        const objectUrl = URL.createObjectURL(blob);
        const a = document.createElement('a');
        
        a.href = objectUrl;
        a.download = `cover.jpg`;
        document.body.appendChild(a);
        a.click();
        
        document.body.removeChild(a);
        URL.revokeObjectURL(objectUrl);

    } catch (error) {
        console.error('Download failed:', error);
        displayError('Could not download image.');
    }
}

function displayError(message: string) {
  resultsContainer.innerHTML = `<p class="error">${message}</p>`;
}

function clearResults() {
  resultsContainer.innerHTML = '';
}

function showLoader(isLoading: boolean) {
  loader.classList.toggle('hidden', !isLoading);
}