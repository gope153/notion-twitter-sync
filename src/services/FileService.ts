import fs from 'fs';
import path from 'path';
import { randomUUID } from 'crypto';

interface FileState {
    processedLines: number;
    lastChecked: string;
}

class FileService {
    private tweetsFilePath: string;
    private stateFilePath: string;

    constructor(tweetsFilePath: string, stateFilePath: string) {
        this.tweetsFilePath = tweetsFilePath;
        this.stateFilePath = stateFilePath;
        this.ensureStateFile();
    }

    private ensureStateFile(): void {
        if (!fs.existsSync(this.stateFilePath)) {
            const initialState: FileState = {
                processedLines: 0,
                lastChecked: new Date().toISOString()
            };
            fs.writeFileSync(this.stateFilePath, JSON.stringify(initialState, null, 2));
        }
    }

    private loadState(): FileState {
        const data = fs.readFileSync(this.stateFilePath, 'utf-8');
        return JSON.parse(data);
    }

    private saveState(state: FileState): void {
        fs.writeFileSync(this.stateFilePath, JSON.stringify(state, null, 2));
    }

    /**
     * Read new tweets from tweets.txt file
     * @returns Array of new tweet texts
     */
    async fetchNewTweets(): Promise<Array<{ id: string; text: string }>> {
        if (!fs.existsSync(this.tweetsFilePath)) {
            console.log('tweets.txt not found, skipping file sync');
            return [];
        }

        const content = fs.readFileSync(this.tweetsFilePath, 'utf-8');
        const lines = content.split('\n');

        const state = this.loadState();
        const processedLines = state.processedLines;

        // Filter out empty lines and comments
        const validLines: string[] = [];
        for (let i = 0; i < lines.length; i++) {
            const line = lines[i].trim();
            if (line && !line.startsWith('#')) {
                validLines.push(line);
            }
        }
        console.log("valid lines", validLines);
        console.log("processed lines", processedLines);

        // Get only new lines
        const newLines = validLines.slice(processedLines);

        if (newLines.length === 0) {
            console.log('No new tweets in tweets.txt');
            return [];
        }

        console.log(`Found ${newLines.length} new tweet(s) in tweets.txt`);

        // Update state
        state.processedLines = validLines.length;
        state.lastChecked = new Date().toISOString();
        this.saveState(state);

        // Convert to tweet objects
        return newLines.map(text => ({
            id: randomUUID(),
            text
        }));
    }
}

export default FileService;
