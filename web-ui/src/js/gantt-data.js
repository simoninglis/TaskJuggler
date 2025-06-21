// Data Loading and Conversion
// This file handles loading TaskJuggler data and converting it to DHTMLX format

// Load TaskJuggler data
function loadTaskJugglerData() {
    updateStatus("Loading TaskJuggler data...");
    
    fetch('data/sample-gantt.json')
        .then(response => response.json())
        .then(data => {
            updateStatus("Converting TaskJuggler data to DHTMLX format...");
            console.log("Raw data loaded:", data);
            
            // Convert TaskJuggler format to DHTMLX format
            const dhtmlxData = convertTaskJugglerToDHMLX(data);
            console.log("Converted DHTMLX data:", dhtmlxData);
            
            // Store original data for filtering
            originalData = dhtmlxData;
            
            // Load data into gantt
            gantt.parse(dhtmlxData);
            
            updateStatus(`Loaded ${data.tasks.length} tasks from TaskJuggler project: ${data.project}`);
            
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
            }
            
            // Set initial focus to the gantt chart and select first task
            setTimeout(() => {
                const tasks = gantt.getTaskByTime();
                if (tasks.length > 0) {
                    gantt.selectTask(tasks[0].id);
                    gantt.showTask(tasks[0].id);
                }
                // Focus the gantt container and ensure it's ready for keyboard nav
                const ganttContainer = document.getElementById('gantt_here');
                ganttContainer.focus();
                
                // Force DHTMLX to recognize focus
                gantt.focus();
            }, 100);
        })
        .catch(error => {
            console.error('Error loading data:', error);
            updateStatus("Error loading TaskJuggler data: " + error.message);
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