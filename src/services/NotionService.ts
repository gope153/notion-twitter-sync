import { Client } from '@notionhq/client';

interface RichText {
    plain_text: string;
    [key: string]: any;
}

interface NotionBlock {
    type: string;
    paragraph?: {
        rich_text: RichText[];
    };
    bulleted_list_item?: {
        rich_text: RichText[];
    };
    numbered_list_item?: {
        rich_text: RichText[];
    };
    [key: string]: any;
}

interface NotionProperty {
    title?: RichText[];
    [key: string]: any;
}

export interface NotionItem {
    id: string;
    properties: {
        [key: string]: NotionProperty;
    };
    [key: string]: any;
}

export interface QueueItem {
    id: string;
    taskName: string;
    text: string;
    addedAt: string;
    notionUrl: string;
}

class NotionService {
    private client: Client;
    private databaseId: string;
    private projectId: string;

    constructor(apiKey: string, databaseId: string, projectId: string) {
        this.client = new Client({ auth: apiKey });
        this.databaseId = databaseId;
        this.projectId = projectId;
    }

    /**
     * Extract text content from Notion rich text
     */
    private extractText(richTextArray: RichText[] | undefined): string {
        if (!richTextArray || !Array.isArray(richTextArray)) return '';
        return richTextArray.map(text => text.plain_text).join('');
    }

    /**
     * Fetch items from Notion database that are marked as "Done"
     */
    async fetchDoneItems(): Promise<NotionItem[]> {
        try {
            const response = await this.client.databases.query({
                database_id: this.databaseId,
                filter: {
                    and: [
                        {
                            property: 'Status',
                            status: {
                                equals: 'Done'
                            }
                        },
                        {
                            property: 'Project',
                            relation: {
                                contains: this.projectId
                            }
                        }
                    ]
                },
                sorts: [
                    {
                        timestamp: 'last_edited_time',
                        direction: 'descending'
                    }
                ]
            });

            return response.results as NotionItem[];
        } catch (error) {
            console.error('Error fetching from Notion:', (error as Error).message);
            return [];
        }
    }

    /**
     * Get page content (blocks) from Notion
     */
    async getPageContent(pageId: string): Promise<string> {
        try {
            const blocks = await this.client.blocks.children.list({
                block_id: pageId
            });

            // Extract text from all blocks
            let content = '';
            for (const block of blocks.results as NotionBlock[]) {
                if (block.type === 'paragraph' && block.paragraph?.rich_text.length) {
                    content += this.extractText(block.paragraph.rich_text) + '\n';
                } else if (block.type === 'bulleted_list_item' && block.bulleted_list_item?.rich_text.length) {
                    content += '• ' + this.extractText(block.bulleted_list_item.rich_text) + '\n';
                } else if (block.type === 'numbered_list_item' && block.numbered_list_item?.rich_text.length) {
                    content += this.extractText(block.numbered_list_item.rich_text) + '\n';
                }
            }

            return content.trim();
        } catch (error) {
            console.error('Error fetching page content:', (error as Error).message);
            return '';
        }
    }

    /**
     * Get task name from Notion item
     */
    getTaskName(item: NotionItem): string {
        const titleProperty = item.properties['Task name'];
        if (titleProperty && titleProperty.title) {
            return this.extractText(titleProperty.title);
        }
        return 'Untitled';
    }

    /**
     * Format Notion item for Twitter
     */
    async formatTweet(item: NotionItem): Promise<string> {
        // Get the page content (body text)
        const content = await this.getPageContent(item.id);

        if (!content) {
            // Fallback to task name if no content
            return '✅ ' + this.getTaskName(item);
        }

        // Truncate if too long (Twitter limit is 280 characters)
        if (content.length > 280) {
            return content.substring(0, 277) + '...';
        }

        return content;
    }

    /**
     * Get Notion URL for a page
     */
    getNotionUrl(pageId: string): string {
        return `https://notion.so/${pageId.replace(/-/g, '')}`;
    }
}

export default NotionService;
