// DHTMLX Gantt Initialization Wrapper
// Ensures gantt is available before other modules use it

// Wait for DHTMLX Gantt to be available
function waitForGantt() {
    return new Promise((resolve) => {
        // Check if gantt is already available
        if (typeof gantt !== 'undefined') {
            console.log('✅ DHTMLX Gantt is already loaded');
            resolve();
            return;
        }
        
        // Otherwise, poll for it
        let attempts = 0;
        const maxAttempts = 50; // 5 seconds max
        
        const checkInterval = setInterval(() => {
            attempts++;
            
            if (typeof gantt !== 'undefined') {
                clearInterval(checkInterval);
                console.log(`✅ DHTMLX Gantt loaded after ${attempts} attempts`);
                resolve();
            } else if (attempts >= maxAttempts) {
                clearInterval(checkInterval);
                console.error('❌ DHTMLX Gantt failed to load after 5 seconds');
                reject(new Error('DHTMLX Gantt not found'));
            }
        }, 100); // Check every 100ms
    });
}

// Initialize gantt when ready
export async function initializeGantt() {
    try {
        await waitForGantt();
        
        // Now we can safely initialize
        console.log('🚀 Initializing DHTMLX Gantt...');
        
        // Initialize the Gantt chart container
        const ganttContainer = document.getElementById('gantt_here');
        if (!ganttContainer) {
            throw new Error('Gantt container #gantt_here not found');
        }
        
        // Initialize Gantt
        gantt.init('gantt_here');
        console.log('✅ DHTMLX Gantt initialized successfully');
        
        // Update status
        if (typeof updateStatus === 'function') {
            updateStatus('Gantt chart initialized');
        }
        
        return true;
    } catch (error) {
        console.error('❌ Failed to initialize DHTMLX Gantt:', error);
        
        // Show error in UI
        const ganttContainer = document.getElementById('gantt_here');
        if (ganttContainer) {
            ganttContainer.innerHTML = `
                <div style="padding: 20px; text-align: center; color: #dc3545;">
                    <h3>Failed to load Gantt Chart</h3>
                    <p>${error.message}</p>
                    <p>Please check the browser console for more details.</p>
                </div>
            `;
        }
        
        return false;
    }
}

// Export the gantt check function for other modules
export { waitForGantt };