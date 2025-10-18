/// <reference types="node" />

export type DiscogsCoverStrategy = 'first' | 'prompt';

export interface DiscogsCoverOptions {
  /** The name of the artist. */
  artist: string;
  /** The title of the album. */
  title: string;
  /**
   * The strategy to use when multiple results are found.
   * 'first' - (Default) Selects the first result automatically.
   * 'prompt' - Asks the user to select from a list in the console.
   */
  strategy?: DiscogsCoverStrategy;
}

/**
 * Finds the main cover for a given artist and album title from Discogs.
 * @param options An object containing the artist, title, and optional strategy.
 * @returns A Promise that resolves with a Buffer containing the cover image data.
 */
export function discogsMainCover(options: DiscogsCoverOptions): Promise<Buffer>;
