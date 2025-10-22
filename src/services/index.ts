// Service instances (Singleton pattern)
import config from '../config/config';
import NotionService from './NotionService';
import TwitterService from './TwitterService';
import ScheduleService from './ScheduleService';
import FileService from './FileService';

export const notionService = new NotionService(
    config.notion.apiKey,
    config.notion.databaseId,
    config.notion.projectId
);

export const twitterService = new TwitterService(
    config.twitter.appKey,
    config.twitter.appSecret,
    config.twitter.accessToken,
    config.twitter.accessSecret,
    config.dryRun
);

export const scheduleService = new ScheduleService(
    config.paths.stateFile,
    config.paths.scheduleFile
);

export const fileService = new FileService(
    config.paths.tweetsFile,
    config.paths.fileStateFile
);
