# Notion-Twitter Sync

Automatic sync tool with web dashboard that manages your Twitter posting queue from multiple sources:
- Notion database (checks every 15 minutes for "Done" items)
- Text file (checks tweets.txt every 15 minutes)
- Manual entry via dashboard

## Features

- **Web Dashboard** at http://localhost:3000
  - View posting queue and posted tweets
  - Add, edit, and delete tweets
  - Manual triggers for Notion and file sync
  - Character count display for tweets
- **Notion Integration** - Auto-sync items marked as "Done"
- **File-Based Queue** - Add tweets via tweets.txt file
- **Scheduled Posting** - Posts tweets at regular intervals
- **Dry Run Mode** - Test without actually posting to Twitter

## Setup

### 1. Notion API Setup

1. Go to https://www.notion.so/my-integrations
2. Click "+ New integration"
3. Enter a name (e.g., "Twitter Sync")
4. Copy the "Internal Integration Token" - this is your `NOTION_API_KEY`
5. Go to your Notion database
6. Click the three dots in the top right → "Add connections" → Select your integration
7. Copy the Database ID from the URL:
   - URL Format: `notion.so/workspace/{database_id}?v=...`
   - The Database ID is the part between the last `/` and `?`

### 2. Twitter API Setup

1. Go to https://developer.twitter.com/en/portal/dashboard
2. Create a new project and app (if not already done)
3. Go to your app → "Keys and tokens"
4. Generate the following credentials:
   - API Key and Secret (App Key/Secret)
   - Access Token and Secret
5. Make sure the app has "Read and Write" permissions

### 3. Installation

```bash
cd notion-twitter-sync
npm install
```

### 4. Configuration

1. Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```

2. Fill in the `.env` file with your credentials:
   ```
   NOTION_API_KEY=secret_xxx...
   NOTION_DATABASE_ID=xxx...
   TWITTER_APP_KEY=xxx...
   TWITTER_APP_SECRET=xxx...
   TWITTER_ACCESS_TOKEN=xxx...
   TWITTER_ACCESS_SECRET=xxx...
   DRY_RUN=true
   PORT=3000
   ```

3. Set up the tweets file:
   ```bash
   cp tweets.example.txt tweets.txt
   ```

   Edit `tweets.txt` and add your tweets (one per line). Empty lines and lines starting with `#` are ignored.

### 5. Notion Database Requirements

Your Notion database must have the following properties:
- **Status** (Type: Status) - with a value "Done"
- **Name**, **Title**, or **Task** (Type: Title) - for the tweet text

The script automatically searches for these standard property names.

## Usage

### Start

```bash
npm run dev
```

The application:
- Starts the web dashboard at http://localhost:3000
- Checks immediately for new Done items in Notion
- Checks immediately for new tweets in tweets.txt
- Runs both checks automatically every 15 minutes
- Posts only new items (no duplicates)
- Saves state in `sync-state.json` and `file-state.json`

### Stop

Press `Ctrl+C` to stop the application.

### Web Dashboard

Access the dashboard at http://localhost:3000 to:

1. **View Queue**: See all tweets waiting to be posted with character counts
2. **View Posted**: See all tweets that have been posted
3. **Add Tweets**: Manually add new tweets to the queue
4. **Edit/Delete**: Modify or remove tweets from the queue
5. **Manual Sync**:
   - "Pull from Notion" - Manually trigger Notion sync
   - "Pull from tweets.txt" - Manually trigger file sync
   - "Post Next Tweet" - Immediately post the next tweet in queue

### File-Based Queue (tweets.txt)

The `tweets.txt` file allows you to queue tweets without using the dashboard:

1. Edit `tweets.txt` and add your tweets (one per line)
2. Empty lines and lines starting with `#` are ignored
3. The file is checked every 15 minutes
4. New tweets are automatically added to the posting queue

Example `tweets.txt`:
```
# My Tweet Queue
# Add one tweet per line

Just shipped a new feature! Check it out.

Working on something exciting. More details soon.

# This is a comment and will be ignored

Another tweet to post later.
```

## How It Works

1. **Every 15 Minutes**:
   - Queries Notion API for all items with Status "Done"
   - Checks tweets.txt for new lines
   - Compares with already posted items (stored in state files)
   - Adds new items to the posting queue

2. **Avoiding Duplicates**:
   - Each Notion Page ID is saved after first sync
   - Each line number in tweets.txt is tracked
   - Already processed items are skipped

3. **Posting**:
   - Posts are sent to Twitter (or logged if DRY_RUN=true)
   - Posted items are moved to the "Posted" section
   - Character limit: 280 characters

## Configuration Options

### Dry Run Mode

Set `DRY_RUN=true` in `.env` to test without posting to Twitter. Posts will only be logged to the console.

### Change Port

Change the `PORT` value in `.env` (default: 3000).

### Change Interval

To change from 15 minutes to another interval, edit `src/modules/schedule/schedule.scheduler.ts`:

```typescript
// For 30 minutes
cron.schedule('*/30 * * * *', async () => {
```

### Different Status Than "Done"

Edit the Notion filter in `src/services/NotionService.ts`:

```typescript
status: {
  equals: 'In Progress'  // or another status name
}
```

## Autostart on System Boot (Optional)

### macOS (with launchd)

1. Create the file `~/Library/LaunchAgents/com.notion-twitter-sync.plist`:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>Label</key>
    <string>com.notion-twitter-sync</string>
    <key>ProgramArguments</key>
    <array>
        <string>/usr/local/bin/node</string>
        <string>/Users/YOUR_USERNAME/work/projects/notion-twitter-sync/dist/server.js</string>
    </array>
    <key>RunAtLoad</key>
    <true/>
    <key>KeepAlive</key>
    <true/>
    <key>StandardOutPath</key>
    <string>/Users/YOUR_USERNAME/work/projects/notion-twitter-sync/output.log</string>
    <key>StandardErrorPath</key>
    <string>/Users/YOUR_USERNAME/work/projects/notion-twitter-sync/error.log</string>
</dict>
</plist>
```

2. Adjust the path (replace `YOUR_USERNAME`)

3. Load the service:
```bash
launchctl load ~/Library/LaunchAgents/com.notion-twitter-sync.plist
```

4. Start service:
```bash
launchctl start com.notion-twitter-sync
```

### Windows (with Task Scheduler)

1. Open Task Scheduler
2. Create a new task
3. Trigger: At logon
4. Action: `node.exe` with argument to path of `dist/server.js`

### Linux (with systemd)

1. Create `/etc/systemd/system/notion-twitter-sync.service`:

```ini
[Unit]
Description=Notion Twitter Sync
After=network.target

[Service]
Type=simple
User=YOUR_USERNAME
WorkingDirectory=/path/to/notion-twitter-sync
ExecStart=/usr/bin/node dist/server.js
Restart=always

[Install]
WantedBy=multi-user.target
```

2. Enable service:
```bash
sudo systemctl enable notion-twitter-sync
sudo systemctl start notion-twitter-sync
```

## Troubleshooting

### "Missing required environment variables"
- Check if the `.env` file exists and all values are filled in

### "Error fetching from Notion"
- Make sure the integration has access to the database
- Check if the Database ID is correct
- Verify that the property "Status" with value "Done" exists

### "Error posting to Twitter"
- Check the Twitter API credentials
- Make sure the app has "Read and Write" permissions
- Rate Limits: Twitter allows 300 tweets per 3 hours

### No new posts despite Done items
- Check the `sync-state.json` file
- Delete it to re-process all items (Warning: may create duplicates!)
- Check the logs in the console

### tweets.txt not being processed
- Check `file-state.json` - it tracks which lines have been processed
- Make sure tweets.txt has new lines after the `processedLines` count
- Reset `file-state.json` by setting `processedLines` to 0 if needed

## Project Structure

```
notion-twitter-sync/
├── src/
│   ├── config/          # Configuration management
│   ├── modules/         # Feature modules (notion, twitter, schedule, file)
│   ├── services/        # Business logic services
│   └── types/           # TypeScript type definitions
├── public/              # Web dashboard (HTML/CSS/JS)
├── dist/                # Compiled JavaScript (generated)
├── tweets.txt           # File-based tweet queue
├── tweets.example.txt   # Example file to get started
├── sync-state.json      # Notion sync state
├── file-state.json      # File sync state
├── queue-state.json     # Posting queue state
└── server.ts            # Application entry point
```

## Security

- The `.env` file is in `.gitignore` and won't be committed to Git
- Never share your API keys publicly
- The `sync-state.json` contains only Notion Page IDs (no sensitive data)
- The `queue-state.json` contains tweet texts and metadata

## License

MIT
