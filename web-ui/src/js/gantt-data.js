// Data Loading and Conversion
// This file handles loading TaskJuggler data and converting it to DHTMLX format

// Store original data for filtering
let originalData = null;

// Load TaskJuggler data - make available globally
window.loadTaskJugglerData = function loadTaskJugglerData() {
    console.log("🔄 loadTaskJugglerData called");
    if (typeof updateStatus === 'function') {
        updateStatus("Loading TaskJuggler data...");
    }
    
    const dataUrl = '/data/sample-gantt.json';
    console.log(`📁 Fetching data from: ${dataUrl}`);
    
    fetch(dataUrl)
        .then(response => {
            console.log(`📨 Response received: status=${response.status}, ok=${response.ok}`);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return response.json();
        })
        .then(data => {
            if (typeof updateStatus === 'function') {
                updateStatus("Converting TaskJuggler data to DHTMLX format...");
            }
            console.log("✅ Raw data loaded:", data);
            console.log(`📊 Tasks count: ${data.tasks ? data.tasks.length : 0}`);
            
            // Convert TaskJuggler format to DHTMLX format
            const dhtmlxData = convertTaskJugglerToDHMLX(data);
            console.log("✅ Converted DHTMLX data:", dhtmlxData);
            console.log(`📊 Converted tasks: ${dhtmlxData.data ? dhtmlxData.data.length : 0}`);
            
            // Store original data for filtering
            originalData = dhtmlxData;
            window.originalData = dhtmlxData; // Make it globally accessible for debugging
            
            // Load data into gantt
            console.log("📥 Parsing data into Gantt...");
            gantt.parse(dhtmlxData);
            console.log("✅ Data parsed into Gantt");
            
            if (typeof updateStatus === 'function') {
                updateStatus(`Loaded ${data.tasks.length} tasks from TaskJuggler project: ${data.project}`);
            }
            
            // Debug milestone presence
            if (window.debugLog) {
                const loadedTasks = gantt.getTaskByTime();
                const milestones = loadedTasks.filter(t => t.type === gantt.config.types.milestone);
                
                window.debugLog('milestone', 'Data loaded - milestone check', {
                    totalTasksLoaded: loadedTasks.length,
                    milestonesFound: milestones.length,
                    milestoneList: milestones.map(m => ({
                        id: m.id,
                        text: m.text,
                        type: m.type,
                        date: m.start_date,
                        duration: m.duration
                    })),
                    milestoneTypeValue: gantt.config.types.milestone
                });
            }
            
            // Update the project title in the header
            const projectTitleElement = document.getElementById('projectTitle');
            if (projectTitleElement && data.project) {
                projectTitleElement.textContent = data.project;
                console.log(`✅ Project title updated to: ${data.project}`);
            }
            
            // Set initial focus to the gantt chart and select first task
            setTimeout(() => {
                const tasks = gantt.getTaskByTime();
                console.log(`📊 Final task count in Gantt: ${tasks.length}`);
                if (tasks.length > 0) {
                    gantt.selectTask(tasks[0].id);
                    gantt.showTask(tasks[0].id);
                    console.log(`✅ Selected first task: ${tasks[0].text}`);
                }
                // Focus the gantt container and ensure it's ready for keyboard nav
                const ganttContainer = document.getElementById('gantt_here');
                if (ganttContainer) {
                    ganttContainer.focus();
                    // Force DHTMLX to recognize focus
                    gantt.focus();
                }
            }, 100);
        })
        .catch(error => {
            console.error('❌ Error loading data:', error);
            console.error('Stack trace:', error.stack);
            if (typeof updateStatus === 'function') {
                updateStatus("Error loading TaskJuggler data: " + error.message);
            }
        });
}

// Convert TaskJuggler JSON to DHTMLX format
function convertTaskJugglerToDHMLX(tjData) {
    const tasks = tjData.tasks.map(task => ({
        id: task.id,
        text: task.name,
        start_date: task.start,
        end_date: task.end,
        duration: task.duration,
        progress: task.progress / 100,
        type: task.type === 'milestone' ? gantt.config.types.milestone :
              task.type === 'container' ? gantt.config.types.project : 
              gantt.config.types.task,
        parent: getParentId(task.id),
        dependencies: task.dependencies ? task.dependencies.join(',') : ''
    }));
    
    return {
        data: tasks,
        links: generateLinks(tjData.tasks)
    };
}

// Extract parent ID from hierarchical task ID
function getParentId(taskId) {
    const parts = taskId.split('.');
    if (parts.length <= 1) return 0; // Root task
    return parts.slice(0, -1).join('.');
}

// Generate dependency links
function generateLinks(tasks) {
    const links = [];
    let linkId = 1;
    
    tasks.forEach(task => {
        task.dependencies.forEach(depId => {
            links.push({
                id: linkId++,
                source: depId,
                target: task.id,
                type: "0" // finish-to-start
            });
        });
    });
    
    return links;
}