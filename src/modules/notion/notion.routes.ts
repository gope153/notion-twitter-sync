import { Router } from 'express';
import NotionController from './notion.controller';
import { notionService, scheduleService } from '../../services';

export const notionRouter = Router();
const controller = new NotionController(notionService, scheduleService);

notionRouter.post('/pull-notion', controller.pullFromNotion);
