import * as readline from 'node:readline';
import { fetchDiscogs, downloadImage, DISCOGS_API_URL } from './discogs-client.js';
import type { DiscogsCoverOptions, DiscogsSearchResponse, DiscogsSearchResult, DiscogsMasterReleaseResponse } from './types.js';

function promptUser(query: string): Promise<string> {
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
    });
    return new Promise((resolve) => {
        rl.question(query, (answer) => {
            rl.close();
            resolve(answer);
        });
    });
}

export async function discogsMainCover({
    artist,
    title,
    strategy = 'first',
    token = process.env.DISCOGS_TOKEN,
}: DiscogsCoverOptions): Promise<Buffer> {
    if (!token) {
        throw new Error('Discogs token is missing. Please provide it via options or .env file (DISCOGS_TOKEN).');
    }

    const searchUrl = `${DISCOGS_API_URL}/database/search?type=master&artist=${encodeURIComponent(artist)}&title=${encodeURIComponent(title)}`;
    const searchData = await fetchDiscogs<DiscogsSearchResponse>(searchUrl, token);

    if (!searchData.results || searchData.results.length === 0) {
        throw new Error(`No results found for "${artist} - ${title}"`);
    }

    let selectedRelease: DiscogsSearchResult | undefined;

    if (strategy === 'first' || searchData.results.length === 1) {
        selectedRelease = searchData.results[0];
    } else if (strategy === 'prompt') {
        console.log('Multiple results found. Please choose one:');
        searchData.results.forEach((result, index) => {
            console.log(`[${index + 1}] ${result.title}`);
        });

        const answer = await promptUser('Enter the number of your choice: ');
        const choice = parseInt(answer, 10);

        if (isNaN(choice) || choice < 1 || choice > searchData.results.length) {
            throw new Error('Invalid choice.');
        }
        selectedRelease = searchData.results[choice - 1];
    }
    
    if (!selectedRelease) {
         throw new Error('Could not determine a release to fetch cover from.');
    }

    const masterData = await fetchDiscogs<DiscogsMasterReleaseResponse>(selectedRelease.resource_url, token);
    const primaryImage = masterData.images?.find(img => img.type === 'primary');
    
    if (!primaryImage?.uri) {
        if (selectedRelease.cover_image) {
             return downloadImage(selectedRelease.cover_image);
        }
        throw new Error('No primary image found for the selected release.');
    }

    return downloadImage(primaryImage.uri);
}