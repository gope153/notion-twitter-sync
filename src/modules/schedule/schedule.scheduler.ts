import cron from 'node-cron';
import { Config } from '../../config/config';

function setupScheduler(config: Config, port: number): void {
    const { postTime } = config;
    const [postHour, postMinute] = postTime.split(':').map(Number);

    console.log(`📅 Scheduled to post daily at ${postTime}`);

    // Prepare headers with optional Basic Auth (to pass global auth middleware)
    const baseHeaders: Record<string, string> = { 'Content-Type': 'application/json' };
    if (config.dashboardPassword) {
        const credentials = Buffer.from(`scheduler:${config.dashboardPassword}`).toString('base64');
        baseHeaders['Authorization'] = `Basic ${credentials}`;
    }

    // Schedule sync to run every 15 minutes (both Notion and tweets.txt file)
    cron.schedule('*/15 * * * *', async () => {
        console.log('\n[Scheduler] Checking for new items...');

        // Sync from Notion
        try {
            const res = await fetch(`http://localhost:${port}/api/pull-notion`, {
                method: 'POST',
                headers: baseHeaders
            });
            const data = await res.json() as any;
            console.log(`[Scheduler - Notion] ${data.message}`);
        } catch (error) {
            console.error('[Scheduler - Notion] Error:', (error as Error).message);
        }

        // Sync from tweets.txt file
        try {
            const res = await fetch(`http://localhost:${port}/api/pull-file`, {
                method: 'POST',
                headers: baseHeaders
            });
            const data = await res.json() as any;
            console.log(`[Scheduler - File] ${data.message}`);
        } catch (error) {
            console.error('[Scheduler - File] Error:', (error as Error).message);
        }
    });

    // Schedule posting once per day at specified time
    cron.schedule(`${postMinute} ${postHour} * * *`, async () => {
        console.log('\n[Scheduler] Posting next from queue...');
        try {
            const res = await fetch(`http://localhost:${port}/api/post-next`, {
                method: 'POST',
                headers: baseHeaders
            });
            const data = await res.json() as any;
            console.log(`[Scheduler] ${data.message}`);
        } catch (error) {
            console.error('[Scheduler] Error:', (error as Error).message);
        }
    });

    console.log('⏰ Scheduled tasks:');
    console.log('   - Check Notion & tweets.txt for new items: Every 15 minutes');
    console.log(`   - Post from queue: Daily at ${postTime}`);
}

export default setupScheduler;
