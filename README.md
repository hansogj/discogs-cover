
# Discogs Cover Art Finder

A simple and powerful tool to find and download the main cover art for any album from Discogs. It can be used as a command-line tool or as a library in your own Node.js projects.

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

## CLI Usage

The command-line tool allows you to quickly download cover art from your terminal. It will interactively prompt you if multiple matches are found.

**Syntax:**
```bash
node discogs-cover-cli.js -artist="<Artist Name>" -title="<Album Title>" [-target="</path/to/save>"]
```

**Arguments:**
*   `-artist`: The name of the artist (required).
*   `-title`: The title of the album (required).
*   `-target`: The folder where `cover.jpg` will be saved. Defaults to the current directory (`.`).

**Example:**
```bash
node discogs-cover-cli.js -artist="Daft Punk" -title="Discovery" -target="./downloads"
```

## Library Usage

You can import the core function into your own Node.js projects to programmatically fetch cover art.

**Installation:**
```bash
npm install @hansogj/discogs-cover
```

**Example:**
```javascript
import { discogsMainCover } from '@hansogj/discogs-cover';
import * as fs from 'node:fs';

// --- Option 1: Get the first result automatically ---
try {
  const imageBuffer = await discogsMainCover({
    artist: 'Daft Punk',
    title: 'Discovery',
    strategy: 'first', // 'first' is the default
  });
  fs.writeFileSync('daft-punk-cover.jpg', imageBuffer);
  console.log('Cover saved!');
} catch (error) {
  console.error(error.message);
}


// --- Option 2: Prompt the user in the console if multiple matches exist ---
try {
  const imageBuffer = await discogsMainCover({
    artist: 'Radiohead',
    title: 'OK Computer',
    strategy: 'prompt', // Will ask user to choose from a list
  });
  fs.writeFileSync('radiohead-cover.jpg', imageBuffer);
  console.log('Cover saved!');
} catch (error) {
  console.error(error.message);
}
```
