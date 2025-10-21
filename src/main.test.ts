import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as discogsClient from './discogs-client';
import * as readline from 'node:readline';
import { discogsMainCover } from './main';
import type { DiscogsMasterReleaseResponse, DiscogsSearchResponse } from './types';

// Mock the entire discogs-client module
vi.mock('./discogs-client');

// Mock the readline module
vi.mock('node:readline');

// --- Mock Data ---
const mockImageBuffer = Buffer.from('mock-image-data');

const mockSearchResponse: DiscogsSearchResponse = {
    results: [
        { id: 1, title: 'Artist - Album 1', cover_image: 'http://cover1.jpg', resource_url: 'http://resource1.url' },
        { id: 2, title: 'Artist - Album 2', cover_image: 'http://cover2.jpg', resource_url: 'http://resource2.url' },
    ],
};

const mockMasterReleaseWithPrimary: DiscogsMasterReleaseResponse = {
    images: [{ type: 'primary', uri: 'http://primary.jpg' }],
};

const mockMasterReleaseWithoutPrimary: DiscogsMasterReleaseResponse = {
    images: [{ type: 'secondary', uri: 'http://secondary.jpg' }],
};

describe('discogsMainCover', () => {
    // Cast mocks to the correct type for type safety
    const mockedFetchDiscogs = vi.mocked(discogsClient.fetchDiscogs);
    const mockedDownloadImage = vi.mocked(discogsClient.downloadImage);
    const mockedCreateInterface = vi.mocked(readline.createInterface);

    beforeEach(() => {
        vi.resetAllMocks();
        // Default mock implementations
        mockedDownloadImage.mockResolvedValue(mockImageBuffer);
    });

    it('should throw an error if no Discogs token is provided', async () => {
        await expect(discogsMainCover({ artist: 'A', title: 'B', token: undefined }))
            .rejects.toThrow('Discogs token is missing.');
    });

    it('should throw an error if no search results are found', async () => {
        mockedFetchDiscogs.mockResolvedValue({ results: [] });
        await expect(discogsMainCover({ artist: 'A', title: 'B', token: 'test' }))
            .rejects.toThrow('No results found for "A - B"');
    });

    describe("strategy: 'first'", () => {
        it('should fetch the primary image of the first result', async () => {
            mockedFetchDiscogs
                .mockResolvedValueOnce(mockSearchResponse) // for search
                .mockResolvedValueOnce(mockMasterReleaseWithPrimary); // for master release

            const result = await discogsMainCover({ artist: 'A', title: 'B', token: 'test', strategy: 'first' });

            expect(mockedFetchDiscogs).toHaveBeenCalledTimes(2);
            expect(mockedFetchDiscogs).toHaveBeenCalledWith(expect.stringContaining('database/search'), 'test');
            expect(mockedFetchDiscogs).toHaveBeenCalledWith(mockSearchResponse.results[0].resource_url, 'test');
            expect(mockedDownloadImage).toHaveBeenCalledWith(mockMasterReleaseWithPrimary.images[0].uri);
            expect(result).toEqual(mockImageBuffer);
        });

        it('should fall back to cover_image if master release has no primary image', async () => {
             mockedFetchDiscogs
                .mockResolvedValueOnce(mockSearchResponse) // for search
                .mockResolvedValueOnce(mockMasterReleaseWithoutPrimary); // for master release
            
            const result = await discogsMainCover({ artist: 'A', title: 'B', token: 'test', strategy: 'first' });

            expect(mockedDownloadImage).toHaveBeenCalledWith(mockSearchResponse.results[0].cover_image);
            expect(result).toEqual(mockImageBuffer);
        });

        it('should throw an error if no primary or cover_image is found', async () => {
            const searchResultWithoutCover = { ...mockSearchResponse.results[0], cover_image: '' };
            mockedFetchDiscogs
                .mockResolvedValueOnce({ results: [searchResultWithoutCover] })
                .mockResolvedValueOnce(mockMasterReleaseWithoutPrimary);

            await expect(discogsMainCover({ artist: 'A', title: 'B', token: 'test', strategy: 'first' }))
                .rejects.toThrow('No primary image found for the selected release.');
        });
    });

    describe("strategy: 'prompt'", () => {
        const mockReadline = {
            question: vi.fn(),
            close: vi.fn(),
        };

        beforeEach(() => {
            // Reset mocks for readline before each test in this suite
            mockReadline.question.mockClear();
            mockReadline.close.mockClear();
            // eslint-disable-next-line @typescript-eslint/ban-ts-comment
            // @ts-ignore
            mockedCreateInterface.mockReturnValue(mockReadline);
            vi.spyOn(console, 'log').mockImplementation(() => {}); // Suppress console.log
        });

        it('should prompt user and fetch the chosen release cover', async () => {
            // Simulate user choosing the second option
            mockReadline.question.mockImplementation((_, cb) => cb('2'));

            mockedFetchDiscogs
                .mockResolvedValueOnce(mockSearchResponse)
                .mockResolvedValueOnce(mockMasterReleaseWithPrimary);

            const result = await discogsMainCover({ artist: 'A', title: 'B', token: 'test', strategy: 'prompt' });

            expect(mockedCreateInterface).toHaveBeenCalled();
            expect(mockReadline.question).toHaveBeenCalled();
            expect(mockedFetchDiscogs).toHaveBeenCalledWith(mockSearchResponse.results[1].resource_url, 'test');
            expect(mockedDownloadImage).toHaveBeenCalledWith(mockMasterReleaseWithPrimary.images[0].uri);
            expect(result).toEqual(mockImageBuffer);
        });
        
        it('should throw an error for invalid numeric input', async () => {
            mockReadline.question.mockImplementation((_, cb) => cb('99')); // Out of bounds
            mockedFetchDiscogs.mockResolvedValueOnce(mockSearchResponse);

            await expect(discogsMainCover({ artist: 'A', title: 'B', token: 'test', strategy: 'prompt' }))
                .rejects.toThrow('Invalid choice.');
        });
        
        it('should throw an error for non-numeric input', async () => {
            mockReadline.question.mockImplementation((_, cb) => cb('abc'));
            mockedFetchDiscogs.mockResolvedValueOnce(mockSearchResponse);

            await expect(discogsMainCover({ artist: 'A', title: 'B', token: 'test', strategy: 'prompt' }))
                .rejects.toThrow('Invalid choice.');
        });
    });
});
