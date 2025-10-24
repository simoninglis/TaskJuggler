// Data Loading and Conversion
// This file handles loading TaskJuggler data and converting it to DHTMLX format

import { rebuildSearchIndex } from './palette/palette-search.js';
import { registerTaskIndexHooks } from './search/task-index.js';

// Store original data for filtering
let originalData = null;

// Load TaskJuggler data - make available globally
window.loadTaskJugglerData = function loadTaskJugglerData() {
    console.log("🔄 loadTaskJugglerData called");
    if (typeof updateStatus === 'function') {
        updateStatus("Loading TaskJuggler data...");
    }
    
    const dataUrl = '/data/web-ui-demo.json';
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

            // Rebuild search index after loading new data
            console.log("📊 Rebuilding search index...");
            rebuildSearchIndex();
            console.log("✅ Search index rebuilt");

            // Register gantt hooks for incremental index updates (deferred until gantt is initialized)
            if (typeof gantt !== 'undefined') {
                registerTaskIndexHooks(gantt);
                console.log("✅ Task index hooks registered");
            }

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
    // Handle both old simple format and new comprehensive format
    const isNewFormat = tjData.version && tjData.version === '1.0';
    
    if (isNewFormat) {
        return convertComprehensiveFormat(tjData);
    }
    
    // Legacy format conversion
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

// Convert comprehensive format from JsonReport
function convertComprehensiveFormat(tjData) {
    const tasks = [];
    const links = [];
    let linkId = 1;
    
    // Process tasks
    tjData.tasks.forEach(task => {
        // Use the first scenario if multiple scenarios exist
        const scenarioId = tjData.scenarios ? tjData.scenarios[0].id : 'plan';
        const scenario = task.scenarios[scenarioId] || task;
        
        const dhtmlxTask = {
            id: task.id,
            text: task.name,
            start_date: scenario.start || task.start,
            end_date: scenario.end || task.end,
            duration: scenario.duration || task.duration,
            progress: (scenario.complete || 0) / 100,
            type: task.type === 'milestone' ? gantt.config.types.milestone :
                  task.type === 'container' ? gantt.config.types.project : 
                  gantt.config.types.task,
            parent: task.parent || getParentId(task.id),
            // Additional attributes for enhanced display
            effort: scenario.effort,
            cost: scenario.cost,
            status: scenario.status,
            priority: scenario.priority,
            responsible: scenario.responsible,
            allocations: task.allocations || [],
            flags: scenario.flags || [],
            note: scenario.note
        };
        
        tasks.push(dhtmlxTask);
        
        // Process dependencies
        if (task.dependencies && task.dependencies.length > 0) {
            task.dependencies.forEach(dep => {
                const depTask = typeof dep === 'string' ? dep : dep.task;
                const depType = typeof dep === 'object' ? 
                    convertDependencyType(dep.type) : '0';
                
                links.push({
                    id: linkId++,
                    source: depTask,
                    target: task.id,
                    type: depType,
                    lag: dep.gapDuration || 0
                });
            });
        }
    });
    
    // Store additional project data globally for reference
    if (window.debugLog) {
        window.debugLog('info', 'Loaded comprehensive TaskJuggler data', {
            projectName: tjData.project?.name,
            taskCount: tasks.length,
            resourceCount: tjData.resources?.length || 0,
            scenarioCount: tjData.scenarios?.length || 0
        });
    }
    
    // Store the full data for future use
    window.taskJugglerData = tjData;
    
    return {
        data: tasks,
        links: links
    };
}

// Convert dependency type string to DHTMLX numeric type
function convertDependencyType(typeStr) {
    const typeMap = {
        'finish-to-start': '0',
        'start-to-start': '1',
        'finish-to-finish': '2',
        'start-to-finish': '3'
    };
    return typeMap[typeStr] || '0';
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