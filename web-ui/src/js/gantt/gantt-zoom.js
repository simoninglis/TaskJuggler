/**
 * Gantt Zoom Functions
 *
 * Handles zoom level management and timeline scale configuration
 *
 * @module gantt/gantt-zoom
 */

import stateStore from '../stateStore.js';
import { GANTT, KEYBOARD } from '../config.js';

/**
 * Zoom in to a more detailed view
 */
export function zoomIn() {
    const zooms = ["hour", "day", "week", "month", "quarter", "year"];
    const currentZoom = stateStore.getZoom();
    const currentIndex = zooms.indexOf(currentZoom);
    if (currentIndex > 0) {
        const newZoom = zooms[currentIndex - 1];
        setZoom(newZoom);
    }
}

/**
 * Zoom out to a less detailed view
 */
export function zoomOut() {
    const zooms = ["hour", "day", "week", "month", "quarter", "year"];
    const currentZoom = stateStore.getZoom();
    const currentIndex = zooms.indexOf(currentZoom);
    if (currentIndex < zooms.length - 1) {
        const newZoom = zooms[currentIndex + 1];
        setZoom(newZoom);
    }
}

/**
 * Set the zoom level to a specific scale
 * @param {string} zoom - One of: "hour", "day", "week", "month", "quarter", "year"
 */
export function setZoom(zoom) {
    // Update zoom level in state store
    stateStore.setZoom(zoom);

    // Configure scales based on zoom level (using new scales configuration)
    switch(zoom) {
        case "hour":
            gantt.config.scales = [
                {unit: "day", step: 1, format: "%d %M"},
                {unit: "hour", step: 1, format: "%H:%i"}
            ];
            gantt.config.min_column_width = GANTT.MIN_COLUMN_WIDTH.hour;
            break;
        case "day":
            gantt.config.scales = [
                {unit: "month", step: 1, format: "%F %Y"},
                {unit: "day", step: 1, format: "%d %M"}
            ];
            gantt.config.min_column_width = GANTT.MIN_COLUMN_WIDTH.day;
            break;
        case "week":
            gantt.config.scales = [
                {unit: "week", step: 1, format: "Week #%W"},
                {unit: "day", step: 1, format: "%d"}
            ];
            gantt.config.min_column_width = GANTT.MIN_COLUMN_WIDTH.week;
            break;
        case "month":
            gantt.config.scales = [
                {unit: "month", step: 1, format: "%F %Y"},
                {unit: "week", step: 1, format: "#%W"}
            ];
            gantt.config.min_column_width = GANTT.MIN_COLUMN_WIDTH.month;
            break;
        case "quarter":
            gantt.config.scales = [
                {unit: "quarter", step: 1, format: function(date) {
                    const quarter = Math.floor(date.getMonth() / 3) + 1;
                    return "Q" + quarter + " " + date.getFullYear();
                }},
                {unit: "month", step: 1, format: "%M"}
            ];
            gantt.config.min_column_width = GANTT.MIN_COLUMN_WIDTH.quarter;
            break;
        case "year":
            gantt.config.scales = [
                {unit: "year", step: 1, format: "%Y"},
                {unit: "quarter", step: 1, format: function(date) {
                    const quarter = Math.floor(date.getMonth() / 3) + 1;
                    return "Q" + quarter;
                }}
            ];
            gantt.config.min_column_width = GANTT.MIN_COLUMN_WIDTH.year;
            break;
    }
    gantt.render();
    window.updateStatus(`Zoom level: ${zoom}`);
}

/**
 * Calculate the scroll amount based on current zoom level
 * Returns pixels needed to scroll one minor unit of the current scale
 * @returns {number} Scroll amount in pixels
 */
export function calculateScrollAmount() {
    // Calculate scroll amount based on the minor unit size of current zoom level
    // This makes scrolling consistent - one keypress = one minor grid unit

    // Get the current date range visible in the gantt
    const state = gantt.getState();
    const minDate = state.min_date;
    const maxDate = state.max_date;

    // Calculate dates for one minor unit movement
    let nextDate;
    const currentZoom = stateStore.getZoom();
    switch(currentZoom) {
        case "hour":
            // Minor unit is hour - scroll by 1 hour
            nextDate = gantt.date.add(minDate, 1, "hour");
            break;
        case "day":
            // Minor unit is day - scroll by 1 day
            nextDate = gantt.date.add(minDate, 1, "day");
            break;
        case "week":
            // Minor unit is day (subscale) - scroll by 1 day
            nextDate = gantt.date.add(minDate, 1, "day");
            break;
        case "month":
            // Minor unit is week (subscale) - scroll by 1 week
            nextDate = gantt.date.add(minDate, 1, "week");
            break;
        case "quarter":
            // Minor unit is month (subscale) - scroll by 1 month
            nextDate = gantt.date.add(minDate, 1, "month");
            break;
        case "year":
            // Minor unit is quarter (subscale) - scroll by 3 months
            nextDate = gantt.date.add(minDate, 3, "month");
            break;
        default:
            // Default to 1 day
            nextDate = gantt.date.add(minDate, 1, "day");
    }

    // Convert the date difference to pixels
    const startPos = gantt.posFromDate(minDate);
    const nextPos = gantt.posFromDate(nextDate);
    const scrollAmount = Math.abs(nextPos - startPos);

    // Ensure minimum scroll amount
    return Math.max(scrollAmount, KEYBOARD.MIN_SCROLL_AMOUNT);
}

/**
 * Initialize mouse wheel zoom functionality
 * Allows Ctrl+Scroll or Cmd+Scroll to zoom in/out
 */
export function initializeMouseWheelZoom() {
    const ganttElement = document.getElementById('gantt_here');
    if (!ganttElement) return;

    ganttElement.addEventListener('wheel', function(event) {
        // Check if Ctrl (Windows/Linux) or Cmd (Mac) is pressed
        const isModifierPressed = event.ctrlKey || event.metaKey;

        // Only zoom if modifier key is pressed and it's vertical scrolling
        if (isModifierPressed && Math.abs(event.deltaY) > Math.abs(event.deltaX)) {
            // Prevent default scrolling/zooming behavior
            event.preventDefault();
            event.stopPropagation();

            // Determine zoom direction
            if (event.deltaY < 0) {
                // Scroll up = zoom in
                zoomIn();
                window.updateStatus('Zoomed in');
            } else {
                // Scroll down = zoom out
                zoomOut();
                window.updateStatus('Zoomed out');
            }

            // Log for debugging
            if (window.debugLog) {
                window.debugLog('zoom', 'Mouse wheel zoom', {
                    deltaY: event.deltaY,
                    currentZoom: stateStore.getZoom()
                });
            }
        }
        // Without modifier, let browser handle scrolling naturally
    }, { passive: false });

    // Log initialization
    if (window.debugLog) {
        window.debugLog('info', 'Mouse wheel zoom initialized (Ctrl/Cmd+Scroll)');
    }
}
