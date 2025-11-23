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
    const cronExpression = `${postMinute} ${postHour} * * *`;
    console.log(`[Scheduler] Cron expression for posting: ${cronExpression}`);
    
    // Calculate next run time for logging
    const now = new Date();
    const scheduledTime = new Date();
    scheduledTime.setHours(postHour, postMinute, 0, 0);
    if (scheduledTime <= now) {
        scheduledTime.setDate(scheduledTime.getDate() + 1); // Next day
    }
    console.log(`[Scheduler] Next post scheduled for: ${scheduledTime.toISOString()}`);
    
    cron.schedule(cronExpression, async () => {
        console.log(`\n[Scheduler] ⏰ Triggered at ${new Date().toISOString()}`);
        console.log('[Scheduler] Posting next from queue...');
        try {
            const url = `http://localhost:${port}/api/post-next`;
            console.log(`[Scheduler] Calling: ${url}`);
            
            const res = await fetch(url, {
                method: 'POST',
                headers: baseHeaders
            });
            
            console.log(`[Scheduler] Response status: ${res.status} ${res.statusText}`);
            
            if (!res.ok) {
                const errorText = await res.text();
                console.error(`[Scheduler] API Error (${res.status}): ${errorText}`);
                return;
            }
            
            const data = await res.json() as any;
            console.log(`[Scheduler] ✅ ${data.message || JSON.stringify(data)}`);
            
            if (data.success === false) {
                console.error(`[Scheduler] ⚠️ Post failed: ${data.message}`);
            }
        } catch (error) {
            console.error('[Scheduler] ❌ Exception:', (error as Error).message);
            console.error('[Scheduler] Stack:', (error as Error).stack);
        }
    });

    console.log('⏰ Scheduled tasks:');
    console.log('   - Check Notion & tweets.txt for new items: Every 15 minutes');
    console.log(`   - Post from queue: Daily at ${postTime}`);
}

export default setupScheduler;
