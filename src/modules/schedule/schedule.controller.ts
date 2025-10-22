import { Request, Response } from 'express';
import { randomUUID } from 'crypto';
import ScheduleService from '../../services/ScheduleService';
import TwitterService from '../../services/TwitterService';

class ScheduleController {
    private scheduleService: ScheduleService;
    private twitterService: TwitterService;

    constructor(scheduleService: ScheduleService, twitterService: TwitterService) {
        this.scheduleService = scheduleService;
        this.twitterService = twitterService;
    }

    getStatus = (req: Request, res: Response): void => {
        const schedule = this.scheduleService.loadSchedule();
        res.json({
            queueSize: schedule.queue.length,
            postedCount: schedule.posted.length,
            dryRun: this.twitterService.isDryRun()
        });
    };

    getQueue = (req: Request, res: Response): void => {
        const schedule = this.scheduleService.loadSchedule();
        res.json(schedule.queue);
    };

    getPosted = (req: Request, res: Response): void => {
        const schedule = this.scheduleService.loadSchedule();
        res.json(schedule.posted);
    };

    updateQueueItem = (req: Request, res: Response): void => {
        const { id } = req.params;
        const { text } = req.body;

        if (!text || typeof text !== 'string' || text.trim() === '') {
            res.status(400).json({
                success: false,
                message: 'Tweet text is required'
            });
            return;
        }

        const success = this.scheduleService.updateQueueItem(id, text.trim());

        if (success) {
            res.json({
                success: true,
                message: 'Tweet updated successfully'
            });
        } else {
            res.status(404).json({
                success: false,
                message: 'Tweet not found in queue'
            });
        }
    };

    deleteQueueItem = (req: Request, res: Response): void => {
        const { id } = req.params;

        const success = this.scheduleService.deleteQueueItem(id);

        if (success) {
            res.json({
                success: true,
                message: 'Tweet deleted successfully'
            });
        } else {
            res.status(404).json({
                success: false,
                message: 'Tweet not found in queue'
            });
        }
    };

    addQueueItem = (req: Request, res: Response): void => {
        const { text } = req.body;

        if (!text || typeof text !== 'string' || text.trim() === '') {
            res.status(400).json({
                success: false,
                message: 'Tweet text is required'
            });
            return;
        }

        const newItem = {
            id: randomUUID(),
            taskName: 'Manual',
            text: text.trim(),
            addedAt: new Date().toISOString(),
            notionUrl: null
        };

        this.scheduleService.addToQueue(newItem);

        res.json({
            success: true,
            message: 'Tweet added to queue',
            item: newItem
        });
    };
}

export default ScheduleController;
