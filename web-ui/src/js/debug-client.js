// Debug WebSocket Client for Vite
// Provides debug logging and auto-reload functionality

class DebugClient {
    constructor() {
        this.ws = null;
        this.reconnectInterval = null;
        this.clientId = null;
        this.reconnectDelay = 1000;
        this.maxReconnectDelay = 30000;
        this.currentReconnectDelay = this.reconnectDelay;
        
        // Initialize on load
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.init());
        } else {
            this.init();
        }
    }
    
    init() {
        console.log('🔌 Initializing debug WebSocket client...');
        this.connectWebSocket();
        this.setupDebugLog();
    }
    
    connectWebSocket() {
        try {
            // Connect to WebSocket server on port 8002
            this.ws = new WebSocket('ws://localhost:8002');
            
            this.ws.onopen = () => {
                console.log('✅ Debug WebSocket connected');
                this.currentReconnectDelay = this.reconnectDelay;
                
                // Clear any reconnect interval
                if (this.reconnectInterval) {
                    clearInterval(this.reconnectInterval);
                    this.reconnectInterval = null;
                }
                
                // Send initial connection message
                this.send('connect', 'Client connected', {
                    userAgent: navigator.userAgent,
                    timestamp: new Date().toISOString()
                });
            };
            
            this.ws.onmessage = (event) => {
                try {
                    const data = JSON.parse(event.data);
                    this.handleMessage(data);
                } catch (e) {
                    console.error('Failed to parse WebSocket message:', e);
                }
            };
            
            this.ws.onclose = () => {
                console.log('❌ Debug WebSocket disconnected');
                this.scheduleReconnect();
            };
            
            this.ws.onerror = (error) => {
                console.error('WebSocket error:', error);
            };
            
        } catch (error) {
            console.error('Failed to connect WebSocket:', error);
            this.scheduleReconnect();
        }
    }
    
    scheduleReconnect() {
        if (!this.reconnectInterval) {
            this.reconnectInterval = setInterval(() => {
                console.log('🔄 Attempting to reconnect WebSocket...');
                this.connectWebSocket();
            }, this.currentReconnectDelay);
            
            // Exponential backoff
            this.currentReconnectDelay = Math.min(
                this.currentReconnectDelay * 2,
                this.maxReconnectDelay
            );
        }
    }
    
    handleMessage(data) {
        console.log('📨 WebSocket message:', data);
        
        switch (data.type) {
            case 'client_id':
                this.clientId = data.data;
                console.log('Client ID assigned:', this.clientId);
                break;
                
            case 'reload':
                console.log('🔄 Reload command received');
                // Use Vite's HMR instead of full reload when possible
                if (import.meta.hot) {
                    import.meta.hot.invalidate();
                } else {
                    window.location.reload();
                }
                break;
                
            case 'file_changed':
                console.log('📝 File changed:', data.data);
                // Vite handles this automatically, but we can log it
                break;
                
            case 'server_push':
                console.log('📤 Server push:', data.message, data.data);
                // Handle custom server messages
                this.handleServerPush(data.message, data.data);
                break;
                
            default:
                console.log('Unknown message type:', data.type);
        }
    }
    
    handleServerPush(message, data) {
        // Custom handling for server push messages
        // Can be extended for specific use cases
        if (window.customHandleServerPush) {
            window.customHandleServerPush(message, data);
        }
    }
    
    send(type, message, data = {}) {
        if (this.ws && this.ws.readyState === WebSocket.OPEN) {
            const payload = {
                type,
                message,
                data,
                clientId: this.clientId,
                timestamp: new Date().toISOString()
            };
            this.ws.send(JSON.stringify(payload));
        }
    }
    
    setupDebugLog() {
        // Create global debugLog function
        window.debugLog = (category, message, data = {}) => {
            // Log to console
            console.log(`[${this.clientId || 'no-id'}] [${category}] ${message}`, data);
            
            // Send to WebSocket server
            this.send('debug', message, {
                category,
                ...data
            });
            
            // Also log to debug panel if it exists
            if (window.debugPanel) {
                window.debugPanel.log(category, message, data);
            }
        };
        
        console.log('✅ window.debugLog function installed');
    }
}

// Initialize debug client
const debugClient = new DebugClient();

// Export for use in other modules
export default debugClient;

// Also make available globally for debugging
window.debugClient = debugClient;

// Log that debug mode is active
console.log('🐛 Debug mode active - WebSocket client initialized');