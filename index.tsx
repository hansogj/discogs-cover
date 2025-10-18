import * as dotenv from 'dotenv';
import * as readline from 'node:readline';
import * as fs from 'node:fs';
import * as path from 'node:path';

dotenv.config();

// Type Definitions
interface DiscogsSearchResult {
    id: number;
    title: string;
    cover_image: string;
    resource_url: string;
}

interface DiscogsSearchResponse {
    results: DiscogsSearchResult[];
}

interface DiscogsMasterReleaseResponse {
    images: {
        uri: string;
        type: 'primary' | 'secondary';
    }[];
}

interface DiscogsCoverOptions {
    artist: string;
    title: string;
    strategy?: 'first' | 'prompt';
    token?: string;
}

const DISCOGS_API_URL = 'https://api.discogs.com';
const USER_AGENT = 'DiscogsCover/1.2.0';

async function fetchDiscogs<T>(url: string, token: string): Promise<T> {
    const response = await fetch(url, {
        headers: {
            'User-Agent': USER_AGENT,
            'Authorization': `Discogs token=${token}`,
        },
    });

    if (!response.ok) {
        throw new Error(`Discogs API error: ${response.status} ${response.statusText}`);
    }

    return response.json() as Promise<T>;
}

async function downloadImage(url: string): Promise<Buffer> {
    const response = await fetch(url, { headers: { 'User-Agent': USER_AGENT } });
    if (!response.ok) {
        throw new Error(`Failed to download image: ${response.status} ${response.statusText}`);
    }
    const arrayBuffer = await response.arrayBuffer();
    return Buffer.from(arrayBuffer);
}

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
        }discogsMainCover
        throw new Error('No primary image found for the selected release.');
    }

    return downloadImage(primaryImage.uri);
}

// --- CLI Logic ---
async function runCli() {
    try {
        const args = process.argv.slice(2).reduce((acc, arg) => {
            const [key, value] = arg.split('=');
            acc[key.replace(/^-+/, '')] = value.replace(/"/g, '');
            return acc;
        }, {} as Record<string, string>);

        const { artist, title, target = '.' } = args;

        if (!artist || !title) {
            console.error('Usage: discogs-cover -artist="<Artist Name>" -title="<Album Title>" [-target="</path/to/save>"]');
            process.exit(1);
        }

        console.log(`Searching for "${artist} - ${title}"...`);
        const imageBuffer = await discogsMainCover({ artist, title, strategy: 'prompt' });

        const targetPath = path.resolve(target);
        if (!fs.existsSync(targetPath)) {
            fs.mkdirSync(targetPath, { recursive: true });
        }
        const filePath = path.join(targetPath, 'cover.jpg');
        fs.writeFileSync(filePath, imageBuffer);

        console.log(`Cover art successfully saved to ${filePath}`);

    } catch (error) {
        if (error instanceof Error) {
            console.error(`Error: ${error.message}`);
        } else {
            console.error('An unknown error occurred', error);
        }
        process.exit(1);
    }
}

// Check if running as a script
if (require.main === module) {
    runCli();
}
