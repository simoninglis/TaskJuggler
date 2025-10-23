// Data file watcher for auto-refresh
import { DATA_WATCHER } from './config.js';

export class DataWatcher {
    constructor() {
        this.dataUrl = '/data/web-ui-demo.json';
        this.lastModified = null;
        this.checkInterval = DATA_WATCHER.POLL_INTERVAL;
        this.intervalId = null;
    }

    start() {
        // Stop any existing interval to prevent duplicates
        this.stop();

        console.log('📡 Starting data file watcher...');

        // Initial load
        this.checkForUpdates();

        // Start polling
        this.intervalId = setInterval(() => {
            this.checkForUpdates();
        }, this.checkInterval);
    }

    stop() {
        if (this.intervalId) {
            clearInterval(this.intervalId);
            this.intervalId = null;
            console.log('🛑 Stopped data file watcher');
        }
    }

    async checkForUpdates() {
        try {
            const response = await fetch(this.dataUrl, {
                method: 'HEAD'
            });
            
            const currentModified = response.headers.get('last-modified');
            
            if (this.lastModified && currentModified !== this.lastModified) {
                console.log('🔄 Data file changed! Reloading...');
                this.onDataChanged();
            }
            
            this.lastModified = currentModified;
        } catch (error) {
            console.error('Error checking for updates:', error);
        }
    }

    onDataChanged() {
        // Dispatch custom event
        window.dispatchEvent(new CustomEvent('taskjuggler-data-changed'));
        
        // Auto reload the gantt data
        if (typeof window.loadTaskJugglerData === 'function') {
            window.loadTaskJugglerData();
        }
    }
}

// WebSocket approach for real-time updates
export class WebSocketDataWatcher {
    constructor() {
        this.ws = null;
        this.reconnectInterval = 5000;
    }

    connect() {
        const wsUrl = `ws://${window.location.hostname}:8002/ws`;
        console.log('🔌 Connecting to WebSocket for data updates...');
        
        try {
            this.ws = new WebSocket(wsUrl);
            
            this.ws.onopen = () => {
                console.log('✅ WebSocket connected for data updates');
                this.ws.send(JSON.stringify({
                    type: 'subscribe',
                    channel: 'data-updates'
                }));
            };
            
            this.ws.onmessage = (event) => {
                const data = JSON.parse(event.data);
                if (data.type === 'data-updated') {
                    console.log('📥 Received data update notification');
                    this.onDataChanged();
                }
            };
            
            this.ws.onclose = () => {
                console.log('❌ WebSocket disconnected, reconnecting...');
                setTimeout(() => this.connect(), this.reconnectInterval);
            };
            
        } catch (error) {
            console.error('WebSocket connection error:', error);
        }
    }

    onDataChanged() {
        // Dispatch custom event
        window.dispatchEvent(new CustomEvent('taskjuggler-data-changed'));
        
        // Auto reload the gantt data
        if (typeof window.loadTaskJugglerData === 'function') {
            window.loadTaskJugglerData();
        }
    }
}

// File system watcher integration (requires server support)
export class FileSystemWatcher {
    constructor() {
        this.eventSource = null;
    }

    connect() {
        this.eventSource = new EventSource('/api/watch-data');
        
        this.eventSource.onmessage = (event) => {
            const data = JSON.parse(event.data);
            if (data.type === 'file-changed' && data.file.includes('web-ui-demo.json')) {
                console.log('📁 File system change detected');
                this.onDataChanged();
            }
        };
        
        this.eventSource.onerror = (error) => {
            console.error('EventSource error:', error);
        };
    }

    onDataChanged() {
        // Dispatch custom event
        window.dispatchEvent(new CustomEvent('taskjuggler-data-changed'));
        
        // Auto reload the gantt data
        if (typeof window.loadTaskJugglerData === 'function') {
            window.loadTaskJugglerData();
        }
    }
}

// Export a singleton instance
export const dataWatcher = new DataWatcher();
export const wsDataWatcher = new WebSocketDataWatcher();
export const fsWatcher = new FileSystemWatcher();