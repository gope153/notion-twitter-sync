import fs from 'fs';

interface State {
    processedItems: string[];
}

export interface QueueItem {
    id: string;
    taskName: string;
    text: string;
    addedAt: string;
    notionUrl: string | null;
}

export interface PostedItem extends QueueItem {
    postedAt: string;
    tweetId: string;
}

interface Schedule {
    queue: QueueItem[];
    posted: PostedItem[];
}

class ScheduleService {
    private stateFile: string;
    private scheduleFile: string;

    constructor(stateFilePath: string, scheduleFilePath: string) {
        this.stateFile = stateFilePath;
        this.scheduleFile = scheduleFilePath;
    }

    /**
     * Load state from file
     */
    loadState(): State {
        try {
            if (fs.existsSync(this.stateFile)) {
                const data = fs.readFileSync(this.stateFile, 'utf8');
                return JSON.parse(data);
            }
        } catch (error) {
            console.error('Error loading state:', (error as Error).message);
        }
        return { processedItems: [] };
    }

    /**
     * Save state to file
     */
    saveState(state: State): void {
        try {
            fs.writeFileSync(this.stateFile, JSON.stringify(state, null, 2));
        } catch (error) {
            console.error('Error saving state:', (error as Error).message);
        }
    }

    /**
     * Load schedule from file
     */
    loadSchedule(): Schedule {
        try {
            if (fs.existsSync(this.scheduleFile)) {
                const data = fs.readFileSync(this.scheduleFile, 'utf8');
                return JSON.parse(data);
            }
        } catch (error) {
            console.error('Error loading schedule:', (error as Error).message);
        }
        return { queue: [], posted: [] };
    }

    /**
     * Save schedule to file
     */
    saveSchedule(schedule: Schedule): void {
        try {
            fs.writeFileSync(this.scheduleFile, JSON.stringify(schedule, null, 2));
        } catch (error) {
            console.error('Error saving schedule:', (error as Error).message);
        }
    }

    /**
     * Check if an item has been processed
     */
    isProcessed(itemId: string): boolean {
        const state = this.loadState();
        return state.processedItems.includes(itemId);
    }

    /**
     * Mark an item as processed
     */
    markAsProcessed(itemId: string): void {
        const state = this.loadState();
        if (!state.processedItems.includes(itemId)) {
            state.processedItems.push(itemId);
            this.saveState(state);
        }
    }

    /**
     * Add an item to the queue
     */
    addToQueue(item: QueueItem): void {
        const schedule = this.loadSchedule();
        schedule.queue.push(item);
        this.saveSchedule(schedule);
    }

    /**
     * Get the next item from queue without removing it
     */
    peekQueue(): QueueItem | null {
        const schedule = this.loadSchedule();
        return schedule.queue.length > 0 ? schedule.queue[0] : null;
    }

    /**
     * Remove and return the next item from queue
     */
    popQueue(): QueueItem | null {
        const schedule = this.loadSchedule();
        if (schedule.queue.length > 0) {
            const item = schedule.queue.shift();
            this.saveSchedule(schedule);
            return item || null;
        }
        return null;
    }

    /**
     * Move item back to front of queue (e.g., after failed posting)
     */
    returnToQueue(item: QueueItem): void {
        const schedule = this.loadSchedule();
        schedule.queue.unshift(item);
        this.saveSchedule(schedule);
    }

    /**
     * Add to posted history
     */
    addToPosted(item: PostedItem): void {
        const schedule = this.loadSchedule();
        schedule.posted.push(item);
        this.saveSchedule(schedule);
    }

    /**
     * Get queue size
     */
    getQueueSize(): number {
        const schedule = this.loadSchedule();
        return schedule.queue.length;
    }

    /**
     * Get posted count
     */
    getPostedCount(): number {
        const schedule = this.loadSchedule();
        return schedule.posted.length;
    }

    /**
     * Get entire queue
     */
    getQueue(): QueueItem[] {
        const schedule = this.loadSchedule();
        return schedule.queue;
    }

    /**
     * Get entire posted history
     */
    getPosted(): PostedItem[] {
        const schedule = this.loadSchedule();
        return schedule.posted;
    }

    /**
     * Update queue item text by ID
     */
    updateQueueItem(id: string, newText: string): boolean {
        const schedule = this.loadSchedule();
        const item = schedule.queue.find(q => q.id === id);

        if (item) {
            item.text = newText;
            this.saveSchedule(schedule);
            return true;
        }

        return false;
    }

    /**
     * Delete queue item by ID
     */
    deleteQueueItem(id: string): boolean {
        const schedule = this.loadSchedule();
        const initialLength = schedule.queue.length;

        schedule.queue = schedule.queue.filter(q => q.id !== id);

        if (schedule.queue.length < initialLength) {
            this.saveSchedule(schedule);
            return true;
        }

        return false;
    }
}

export default ScheduleService;
