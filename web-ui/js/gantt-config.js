// DHTMLX Gantt Configuration
// This file contains all initial configuration for the DHTMLX Gantt library

// Initialize DHTMLX Gantt configuration
function initializeGanttConfig() {
    // Configure DHTMLX Gantt
    gantt.config.date_format = "%Y-%m-%d";
    
    // Use new scales configuration (DHTMLX Gantt 7.0+)
    gantt.config.scales = [
        {unit: "month", step: 1, format: "%F %Y"},
        {unit: "day", step: 1, format: "%d %M"}
    ];
    gantt.config.scale_height = 50;
    gantt.config.min_column_width = 60;
    
    // Enable features
    gantt.plugins({
        tooltip: true,
        marker: true,
        keyboard_navigation: true
    });
    
    // Disable DHTMLX's built-in keyboard navigation to prevent conflicts
    gantt.config.keyboard_navigation = false;
    gantt.config.keyboard_navigation_cells = false;
    
    // Add today line
    gantt.addMarker({
        start_date: new Date(),
        css: "today",
        text: "Today",
        title: "Today: " + gantt.date.date_to_str(gantt.config.date_format)(new Date())
    });
    
    // Configure task text template for search highlighting
    gantt.templates.task_text = function(start, end, task) {
        const searchInput = document.getElementById('searchInput');
        const searchTerm = searchInput ? searchInput.value.trim() : '';
        
        if (searchTerm && task.text) {
            // Case-insensitive search with proper escaping
            const regex = new RegExp(`(${escapeRegex(searchTerm)})`, 'gi');
            return task.text.replace(regex, '<span class="highlight">$1</span>');
        }
        return task.text;
    };
    
    // Initialize the gantt chart
    gantt.config.readonly = true;  // Start in read-only mode
    gantt.init("gantt_here");
    
    // Ensure gantt container is focusable
    const ganttContainer = document.getElementById('gantt_here');
    ganttContainer.setAttribute('tabindex', '0');
    
    // Keep focus on gantt when clicking on it
    ganttContainer.addEventListener('click', function() {
        if (window.debugLog) window.debugLog('debug', 'Gantt container clicked - focusing');
        this.focus();
    });
    
    // Monitor focus changes
    document.addEventListener('focusin', function(e) {
        if (window.debugLog) {
            window.debugLog('event', 'Focus changed', {
                newFocus: e.target.tagName + (e.target.id ? '#' + e.target.id : ''),
                className: e.target.className
            });
        }
    });
    
    // Event handlers for Claude Code integration (placeholder)
    gantt.attachEvent("onAfterTaskAdd", function(id, task) {
        updateStatus(`Task added: ${task.text}`);
        // TODO: Send to Claude Code for TJP file update
    });
    
    gantt.attachEvent("onAfterTaskUpdate", function(id, task) {
        updateStatus(`Task updated: ${task.text}`);
        // TODO: Send to Claude Code for TJP file update  
    });
    
    gantt.attachEvent("onAfterTaskDelete", function(id, task) {
        updateStatus(`Task deleted: ${task.text}`);
        // TODO: Send to Claude Code for TJP file update
    });
    
    gantt.attachEvent("onAfterTaskDrag", function(id, mode, task) {
        updateStatus(`Task moved: ${task.text}`);
        // TODO: Send to Claude Code for TJP file update
    });
}

// Helper function for escaping regex patterns
function escapeRegex(string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}