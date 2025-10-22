#!/usr/bin/env node
import * as dotenv from 'dotenv';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { discogsMainCover } from './main.js';

dotenv.config();

// --- CLI Logic ---
async function runCli() {
    try {
        const args = process.argv.slice(2).reduce((acc, arg) => {
            const [key, value] = arg.split('=');
            if (key && value) {
                acc[key.replace(/^-+/, '')] = value.replace(/"/g, '');
            }
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

runCli();