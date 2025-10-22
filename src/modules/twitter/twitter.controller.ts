import { Request, Response } from 'express';
import TwitterService from '../../services/TwitterService';
import ScheduleService from '../../services/ScheduleService';

class TwitterController {
    private twitterService: TwitterService;
    private scheduleService: ScheduleService;

    constructor(twitterService: TwitterService, scheduleService: ScheduleService) {
        this.twitterService = twitterService;
        this.scheduleService = scheduleService;
    }

    postNext = async (req: Request, res: Response): Promise<void> => {
        try {
            console.log('\n[Manual] Posting next from queue...');

            const queueSize = this.scheduleService.getQueueSize();

            if (queueSize === 0) {
                res.json({
                    success: false,
                    message: 'Queue is empty'
                });
                return;
            }

            const nextPost = this.scheduleService.popQueue();
            if (!nextPost) {
                res.json({
                    success: false,
                    message: 'Queue is empty'
                });
                return;
            }

            const tweetId = await this.twitterService.postTweet(nextPost.text);

            if (tweetId) {
                this.scheduleService.addToPosted({
                    ...nextPost,
                    postedAt: new Date().toISOString(),
                    tweetId: tweetId
                });

                res.json({
                    success: true,
                    message: 'Successfully posted!',
                    post: nextPost,
                    tweetId: tweetId,
                    remainingQueue: this.scheduleService.getQueueSize()
                });
            } else {
                this.scheduleService.returnToQueue(nextPost);
                res.status(500).json({
                    success: false,
                    message: 'Posting failed - item returned to queue'
                });
            }
        } catch (error) {
            console.error('Error posting:', error);
            res.status(500).json({
                success: false,
                error: (error as Error).message
            });
        }
    };
}

export default TwitterController;
