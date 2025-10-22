import { Router } from 'express';
import TwitterController from './twitter.controller';
import { twitterService, scheduleService } from '../../services';

export const twitterRouter = Router();
const controller = new TwitterController(twitterService, scheduleService);

twitterRouter.post('/post-next', controller.postNext);
