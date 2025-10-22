import dotenv from 'dotenv';
import path from 'path';

dotenv.config();

export interface NotionConfig {
    apiKey: string;
    databaseId: string;
    projectId: string;
}

export interface TwitterConfig {
    appKey: string;
    appSecret: string;
    accessToken: string;
    accessSecret: string;
}

export interface PathsConfig {
    stateFile: string;
    scheduleFile: string;
    publicDir: string;
    tweetsFile: string;
    fileStateFile: string;
}

export interface Config {
    port: number;
    notion: NotionConfig;
    twitter: TwitterConfig;
    dryRun: boolean;
    postTime: string;
    paths: PathsConfig;
    validate: () => boolean;
}

const config: Config = {
    // Server
    port: parseInt(process.env.PORT || '3000', 10),

    // Notion
    notion: {
        apiKey: process.env.NOTION_API_KEY || '',
        databaseId: process.env.NOTION_DATABASE_ID || '',
        projectId: process.env.NOTION_PROJECT_ID || '',
    },

    // Twitter
    twitter: {
        appKey: process.env.TWITTER_APP_KEY || '',
        appSecret: process.env.TWITTER_APP_SECRET || '',
        accessToken: process.env.TWITTER_ACCESS_TOKEN || '',
        accessSecret: process.env.TWITTER_ACCESS_SECRET || '',
    },

    // App settings
    dryRun: process.env.DRY_RUN === 'true',
    postTime: process.env.POST_TIME || '10:00',

    // File paths
    paths: {
        stateFile: path.join(__dirname, '..', '..', 'sync-state.json'),
        scheduleFile: path.join(__dirname, '..', '..', 'schedule.json'),
        publicDir: path.join(__dirname, '..', '..', 'public'),
        tweetsFile: path.join(__dirname, '..', '..', 'tweets.txt'),
        fileStateFile: path.join(__dirname, '..', '..', 'file-state.json'),
    },

    // Validate required config
    validate(): boolean {
        const required = [
            'notion.apiKey',
            'notion.databaseId',
            'notion.projectId',
            'twitter.appKey',
            'twitter.appSecret',
            'twitter.accessToken',
            'twitter.accessSecret',
        ];

        const missing = required.filter(key => {
            const keys = key.split('.');
            let value: any = this;
            for (const k of keys) {
                value = value[k];
                if (!value) return true;
            }
            return false;
        });

        if (missing.length > 0) {
            throw new Error(`Missing required configuration: ${missing.join(', ')}`);
        }

        return true;
    }
};

export default config;
