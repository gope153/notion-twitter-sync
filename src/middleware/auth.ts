import { Request, Response, NextFunction } from 'express';
import config from '../config/config';

export function authMiddleware(req: Request, res: Response, next: NextFunction): void {
    // Skip auth if no password is configured
    if (!config.dashboardPassword) {
        next();
        return;
    }

    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Basic ')) {
        res.setHeader('WWW-Authenticate', 'Basic realm="Dashboard"');
        res.status(401).json({ error: 'Authentication required' });
        return;
    }

    const base64Credentials = authHeader.split(' ')[1];
    const credentials = Buffer.from(base64Credentials, 'base64').toString('ascii');
    const [username, password] = credentials.split(':');

    // We only check password, username can be anything
    if (password === config.dashboardPassword) {
        next();
    } else {
        res.setHeader('WWW-Authenticate', 'Basic realm="Dashboard"');
        res.status(401).json({ error: 'Invalid credentials' });
    }
}
