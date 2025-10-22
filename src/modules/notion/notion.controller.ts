import { Request, Response } from 'express';
import NotionService from '../../services/NotionService';
import ScheduleService from '../../services/ScheduleService';

class NotionController {
    private notionService: NotionService;
    private scheduleService: ScheduleService;

    constructor(notionService: NotionService, scheduleService: ScheduleService) {
        this.notionService = notionService;
        this.scheduleService = scheduleService;
    }

    pullFromNotion = async (req: Request, res: Response): Promise<void> => {
        try {
            console.log('\n[Manual] Pulling from Notion...');
            const doneItems = await this.notionService.fetchDoneItems();

            let newItemsCount = 0;

            for (const item of doneItems) {
                if (this.scheduleService.isProcessed(item.id)) {
                    continue;
                }

                const tweetText = await this.notionService.formatTweet(item);
                const taskName = this.notionService.getTaskName(item);
                const notionUrl = this.notionService.getNotionUrl(item.id);

                this.scheduleService.addToQueue({
                    id: item.id,
                    taskName: taskName,
                    text: tweetText,
                    addedAt: new Date().toISOString(),
                    notionUrl: notionUrl
                });

                this.scheduleService.markAsProcessed(item.id);
                newItemsCount++;
            }

            res.json({
                success: true,
                message: `Added ${newItemsCount} new item(s) to queue`,
                newItems: newItemsCount,
                queueSize: this.scheduleService.getQueueSize()
            });
        } catch (error) {
            console.error('Error pulling from Notion:', error);
            res.status(500).json({
                success: false,
                error: (error as Error).message
            });
        }
    };
}

export default NotionController;
