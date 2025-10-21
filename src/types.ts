export interface DiscogsSearchResult {
    id: number;
    title: string;
    cover_image: string;
    resource_url: string;
}

export interface DiscogsSearchResponse {
    results: DiscogsSearchResult[];
}

export interface DiscogsMasterReleaseResponse {
    images: {
        uri: string;
        type: 'primary' | 'secondary';
    }[];
}

export interface DiscogsCoverOptions {
    artist: string;
    title: string;
    strategy?: 'first' | 'prompt';
    token?: string;
}
