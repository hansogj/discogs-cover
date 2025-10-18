# Album Art Finder CLI

A command-line tool to find album art from Discogs and get interesting facts about the album using the Google Gemini API.

## Prerequisites

- Node.js (v18 or higher recommended)
- A Discogs account and API credentials (Consumer Key and Secret). You can get them from the [Discogs developers page](https://www.discogs.com/developers).
- A Google Gemini API Key. You can get one from [Google AI Studio](https://aistudio.google.com/app/apikey).

## Setup

1.  **Clone the repository or download the files.**

2.  **Install dependencies:**
    Open your terminal in the project directory and run:
    ```bash
    npm install
    ```

3.  **Set Environment Variables:**
    This tool loads API keys from a `.env` file in the project's root directory.

    a. Create a `.env` file by copying the example file:
    ```bash
    cp .env.example .env
    ```
    (On Windows, you can use `copy .env.example .env`)

    b. Open the newly created `.env` file in a text editor.

    c. Replace the placeholder values with your actual API keys:
    ```
    DISCOGS_KEY=your_discogs_consumer_key
    DISCOGS_SECRET=your_discogs_consumer_secret
    API_KEY=your_gemini_api_key
    ```
    **Important:** The `.env` file contains sensitive information. Do not commit it to version control. The `.gitignore` file (if you are using one) should contain a line for `.env`.

4.  **Make the script executable (optional, for macOS/Linux):**
    This allows you to run the script directly.
    ```bash
    chmod +x discogs-cli.js
    ```

## Usage

Run the script from your terminal, passing the artist and album title as arguments. Make sure to enclose arguments with spaces in quotes.

**Syntax:**
```bash
node discogs-cli.js "<Artist Name>" "<Album Title>"
```

**If you made it executable:**
```bash
./discogs-cli.js "<Artist Name>" "<Album Title>"
```

### Example

```bash
./discogs-cli.js "Daft Punk" "Discovery"
```

If multiple matches are found, the script will prompt you to select the correct one from a list. After finding the album, it will ask if you want to fetch facts from Gemini.