# Discogs Cover Art Finder

A simple and powerful tool to find and download the main cover art for any album from Discogs. It can be used as a command-line tool or as a library in your own Node.js projects. Now in TypeScript!

## Setup

1.  **Clone the repository and install dependencies:**
    ```bash
    npm install
    ```

2.  **Create a `.env` file:**
    Copy the `.env.example` to a new file named `.env`.

    ```bash
    cp .env.example .env
    ```

3.  **Get a Discogs Personal Access Token:**
    *   Go to your Discogs [Developer Settings](https://www.discogs.com/settings/developers).
    *   Click "Generate new token".
    *   Copy the generated token.

4.  **Add your token to the `.env` file:**
    Open your `.env` file and paste your token:
    ```
    DISCOGS_TOKEN=YourDiscogsTokenGoesHere
    ```
5.  **Build the project:**
    This project is written in TypeScript. You need to compile it to JavaScript before running.
    ```bash
    npm run build
    ```

## CLI Usage

After building the project (`npm run build`), you can run the CLI. It will interactively prompt you if multiple matches are found.

**Syntax:**
```bash
node dist/discogs-cover-cli.js -artist="<Artist Name>" -title="<Album Title>" [-target="</path/to/save>"]
```

Or using npm:
```bash
npm start -- -artist="<Artist Name>" -title="<Album Title>" [-target="</path/to/save>"]
```

**Arguments:**
*   `-artist`: The name of the artist (required).
*   `-title`: The title of the album (required).
*   `-target`: The folder where `cover.jpg` will be saved. Defaults to the current directory (`.`).

**Example:**
```bash
npm start -- -artist="Daft Punk" -title="Discovery" -target="./downloads"
```

If you install the package globally (`npm install -g .`), you can use the command directly:
```bash
discogs-cover -artist="Daft Punk" -title="Discovery"
```

## Library Usage

You can import the core function into your own Node.js projects to programmatically fetch cover art.

**Installation:**
```bash
npm install @hansogj/discogs-cover
```

**Example (TypeScript):**
```typescript
import { discogsMainCover } from '@hansogj/discogs-cover';
import * as fs from 'node:fs';

// --- Get the first result automatically (using async/await) ---
async function getFirstCover() {
  try {
    const imageBuffer: Buffer = await discogsMainCover({
      artist: 'Daft Punk',
      title: 'Discovery',
      strategy: 'first', // 'first' is the default
    });
    fs.writeFileSync('daft-punk-cover.jpg', imageBuffer);
    console.log('Cover saved!');
  } catch (error) {
    if (error instanceof Error) {
      console.error(error.message);
    } else {
      console.error('An unknown error occurred', error);
    }
  }
}

getFirstCover();


// --- Prompt the user if multiple matches exist ---
async function getCoverWithPrompt() {
  try {
    const imageBuffer: Buffer = await discogsMainCover({
      artist: 'Radiohead',
      title: 'OK Computer',
      strategy: 'prompt', // Will ask user to choose from a list
    });
    fs.writeFileSync('radiohead-cover.jpg', imageBuffer);
    console.log('Cover saved!');
  } catch (error) {
    if (error instanceof Error) {
      console.error(error.message);
    } else {
      console.error('An unknown error occurred', error);
    }
  }
}

getCoverWithPrompt();
```