# Album Art Finder CLI

A command-line tool to find and download album art from Discogs.

## Prerequisites

- Node.js (v18 or higher recommended)
- A Discogs account and a **Personal Access Token**. You can generate one from your [Discogs developer settings page](https://www.discogs.com/settings/developers).

## Setup

1.  **Clone the repository or download the files.**

2.  **Install dependencies:**
    Open your terminal in the project directory and run:
    ```bash
    npm install
    ```

3.  **Set Environment Variables:**
    This tool loads API keys from a `.env` file in the project's root directory.

    a. Create a `.env` file by copying the example file (if one exists) or creating a new one.
    
    b. Open the `.env` file in a text editor.

    c. Add your Discogs Personal Access Token:
    ```
    DISCOGS_TOKEN=your_discogs_personal_access_token
    ```
    **Important:** The `.env` file contains sensitive information. Do not commit it to version control. The `.gitignore` file (if you are using one) should contain a line for `.env`.

4.  **Make the script executable (optional, for macOS/Linux):**
    This allows you to run the script directly.
    ```bash
    chmod +x discogs-cli.js
    ```

## Usage

Run the script from your terminal using named arguments. The `-artist` and `-title` arguments are required. The order of arguments does not matter. Make sure to enclose values with spaces in quotes.

**Syntax:**
```bash
node discogs-cli.js -artist="<Artist Name>" -title="<Album Title>" [-target="<Target Folder>"]
```

**If you made it executable:**
```bash
./discogs-cli.js -artist="<Artist Name>" -title="<Album Title>" [-target="<Target Folder>"]
```

### Examples

**Save to current directory:**
```bash
./discogs-cli.js -artist="Daft Punk" -title="Discovery"
```

**Different order:**
```bash
./discogs-cli.js -title="Discovery" -artist="Daft Punk"
```

**Save to a specific directory (e.g., '~/Downloads/Covers'):**
```bash
./discogs-cli.js -artist="Daft Punk" -title="Discovery" -target="~/Downloads/Covers"
```

If multiple matches are found, the script will prompt you to select the correct one from a list.