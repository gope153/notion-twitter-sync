import { Router } from 'express';
import ScheduleController from './schedule.controller';
import { scheduleService, twitterService } from '../../services';

export const scheduleRouter = Router();
const controller = new ScheduleController(scheduleService, twitterService);

scheduleRouter.get('/status', controller.getStatus);
scheduleRouter.get('/queue', controller.getQueue);
scheduleRouter.get('/posted', controller.getPosted);
scheduleRouter.put('/queue/:id', controller.updateQueueItem);
scheduleRouter.delete('/queue/:id', controller.deleteQueueItem);
scheduleRouter.post('/queue', controller.addQueueItem);
