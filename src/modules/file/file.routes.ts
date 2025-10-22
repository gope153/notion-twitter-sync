import { Router } from 'express';
import FileController from './file.controller';
import { fileService, scheduleService } from '../../services';

export const fileRouter = Router();
const controller = new FileController(fileService, scheduleService);

fileRouter.post('/pull-file', controller.pullFromFile);
