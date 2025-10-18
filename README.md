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

Run the script from your terminal, passing the artist and album title as arguments. Make sure to enclose arguments with spaces in quotes. You can also provide an optional third argument for the folder where the image will be saved. If omitted, it will save in the current directory.

**Syntax:**
```bash
node discogs-cli.js "<Artist Name>" "<Album Title>" ["<Target Folder>"]
```

**If you made it executable:**
```bash
./discogs-cli.js "<Artist Name>" "<Album Title>" ["<Target Folder>"]
```

### Examples

**Save to current directory:**
```bash
./discogs-cli.js "Daft Punk" "Discovery"
```

**Save to a specific directory (e.g., '~/Downloads/Covers'):**
```bash
./discogs-cli.js "Daft Punk" "Discovery" "~/Downloads/Covers"
```

If multiple matches are found, the script will prompt you to select the correct one from a list.