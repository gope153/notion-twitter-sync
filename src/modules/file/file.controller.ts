import { Request, Response } from 'express';
import FileService from '../../services/FileService';
import ScheduleService from '../../services/ScheduleService';

class FileController {
    private fileService: FileService;
    private scheduleService: ScheduleService;

    constructor(fileService: FileService, scheduleService: ScheduleService) {
        this.fileService = fileService;
        this.scheduleService = scheduleService;
    }

    pullFromFile = async (req: Request, res: Response): Promise<void> => {
        console.log("pullFromFile");

        try {
            console.log('\n[Manual] Pulling from tweets.txt...');

            const newTweets = await this.fileService.fetchNewTweets();

            if (newTweets.length === 0) {
                res.json({
                    success: true,
                    message: 'No new tweets in file',
                    added: 0
                });
                return;
            }

            // Add tweets to queue
            for (const tweet of newTweets) {
                this.scheduleService.addToQueue({
                    id: tweet.id,
                    taskName: 'File',
                    text: tweet.text,
                    addedAt: new Date().toISOString(),
                    notionUrl: null
                });
            }

            console.log(`✓ Added ${newTweets.length} new tweet(s) to queue from file`);

            res.json({
                success: true,
                message: `Added ${newTweets.length} new tweet(s) to queue`,
                added: newTweets.length
            });
        } catch (error) {
            console.error('Error pulling from file:', error);
            res.status(500).json({
                success: false,
                error: (error as Error).message
            });
        }
    };
}

export default FileController;
