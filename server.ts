import express from 'express';
import path from 'path';
import config from './src/config/config';
import { notionRouter } from './src/modules/notion/notion.routes';
import { twitterRouter } from './src/modules/twitter/twitter.routes';
import { scheduleRouter } from './src/modules/schedule/schedule.routes';
import { fileRouter } from './src/modules/file/file.routes';
import setupScheduler from './src/modules/schedule/schedule.scheduler';

// Validate configuration
try {
    config.validate();
} catch (error) {
    console.error('❌ Configuration error:', (error as Error).message);
    process.exit(1);
}

// Initialize Express app
const app = express();

// Middleware
app.use(express.json());
app.use(express.static(config.paths.publicDir));

// Request logging middleware
app.use((req, res, next) => {
    const timestamp = new Date().toISOString();
    const method = req.method;
    const url = req.url;
    const userAgent = req.get('User-Agent') || 'Unknown';

    console.log(`[${timestamp}] ${method} ${url} - ${userAgent}`);
    next();
});

// Mount routers
app.use('/api', scheduleRouter);
app.use('/api', notionRouter);
app.use('/api', twitterRouter);
app.use('/api', fileRouter);

// Serve dashboard
app.get('/', (req, res) => {
    res.sendFile(path.join(config.paths.publicDir, 'index.html'));
});

// Start server
app.listen(config.port, () => {
    console.log(`📊 Dashboard: http://localhost:${config.port}`);
    console.log(`⚠️  DRY RUN: ${config.dryRun}`);

    // Setup schedulers
    setupScheduler(config, config.port);

    console.log('\nPress Ctrl+C to stop');
});

// Handle graceful shutdown
process.on('SIGINT', () => {
    console.log('\n👋 Shutting down gracefully...');
    process.exit(0);
});
