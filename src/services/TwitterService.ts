import { TwitterApi } from 'twitter-api-v2';

class TwitterService {
    private client: any;
    private dryRun: boolean;

    constructor(appKey: string, appSecret: string, accessToken: string, accessSecret: string, dryRun: boolean = false) {
        const client = new TwitterApi({
            appKey,
            appSecret,
            accessToken,
            accessSecret,
        });

        this.client = client.readWrite;
        this.dryRun = dryRun;
    }

    /**
     * Post a tweet to Twitter
     * @param text - The tweet text
     * @returns Tweet ID or null on failure
     */
    async postTweet(text: string): Promise<string | null> {
        if (this.dryRun) {
            console.log('🔍 [DRY RUN] Would post to Twitter:', text);
            return 'dry-run-' + Date.now();
        }

        try {
            // Try v1.1 API first (for Free tier accounts)
            console.log('Attempting to post with v1.1 API...');
            const tweet = await this.client.v1.tweet(text);
            console.log('✓ Posted to Twitter:', text.substring(0, 50) + '...');
            return tweet.id_str;
        } catch (v1Error: any) {
            console.error('v1.1 API failed:', v1Error.message);

            // Fallback to v2 API
            try {
                console.log('Attempting to post with v2 API...');
                const tweet = await this.client.v2.tweet(text);
                console.log('✓ Posted to Twitter:', text.substring(0, 50) + '...');
                return tweet.data.id;
            } catch (v2Error: any) {
                console.error('v2 API also failed:', v2Error.message);
                console.error('Error code:', v2Error.code);
                console.error('Error data:', v2Error.data);
                return null;
            }
        }
    }

    /**
     * Check if service is in dry run mode
     */
    isDryRun(): boolean {
        return this.dryRun;
    }
}

export default TwitterService;
