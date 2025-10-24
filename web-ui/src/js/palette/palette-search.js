/**
 * Command Palette - Search Functions
 *
 * Handles task search functionality including text search and month navigation
 *
 * @module palette/palette-search
 */

import { taskIndex } from '../search/task-index.js';
import { SEARCH } from '../config.js';

/**
 * Rebuild the task search index
 * Call this when task data changes (e.g., after loading new data)
 */
export function rebuildSearchIndex() {
    taskIndex.rebuild();
}

/**
 * Perform task search based on search term
 * Uses O(1) task index with substring fallback for fast search
 * Also checks for month navigation
 * @param {string} searchTerm - The search term to filter tasks
 * @returns {Array} Array of matching tasks or month navigation results
 */
export function performTaskSearch(searchTerm) {
    if (!searchTerm) {
        return [];
    }

    // Check if search term is a month
    const monthMatch = parseMonthSearch(searchTerm);
    const results = [];

    if (monthMatch) {
        results.push({
            id: 'month-jump',
            text: `Go to ${monthMatch.displayName}`,
            type: 'month',
            monthData: monthMatch,
            icon: '📅'
        });

        // Also search for tasks using task index
        const taskResults = taskIndex.searchWithSubstring(searchTerm);

        // Add task results after month result
        return results.concat(taskResults);
    } else {
        // Use task index with substring fallback (O(1) fast path, O(n) slow path)
        return taskIndex.searchWithSubstring(searchTerm);
    }
}

/**
 * Parse month names and abbreviations from search term
 * Supports month names, abbreviations, and relative terms like "next month"
 * @param {string} searchTerm - The search term to parse
 * @returns {Object|null} Month data object or null if no month found
 */
export function parseMonthSearch(searchTerm) {
    const term = searchTerm.toLowerCase().trim();

    // Month names and abbreviations
    const months = {
        'january': 0, 'jan': 0,
        'february': 1, 'feb': 1,
        'march': 2, 'mar': 2,
        'april': 3, 'apr': 3,
        'may': 4,
        'june': 5, 'jun': 5,
        'july': 6, 'jul': 6,
        'august': 7, 'aug': 7,
        'september': 8, 'sep': 8, 'sept': 8,
        'october': 9, 'oct': 9,
        'november': 10, 'nov': 10,
        'december': 11, 'dec': 11
    };

    // Check for month name
    for (const [monthName, monthIndex] of Object.entries(months)) {
        if (term.includes(monthName)) {
            const now = new Date();
            let year = now.getFullYear();

            // Check if year is specified (e.g., "june 2025")
            const yearMatch = term.match(/\d{4}/);
            if (yearMatch) {
                year = parseInt(yearMatch[0]);
            }

            // If month is in the past this year, assume next year
            if (monthIndex < now.getMonth() && !yearMatch) {
                year++;
            }

            const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
                              'July', 'August', 'September', 'October', 'November', 'December'];

            return {
                month: monthIndex,
                year: year,
                displayName: `${monthNames[monthIndex]} ${year}`,
                date: new Date(year, monthIndex, 1)
            };
        }
    }

    // Check for "next month" or "current month"
    if (term === 'next month' || term === 'next') {
        const now = new Date();
        const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
        const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
                          'July', 'August', 'September', 'October', 'November', 'December'];

        return {
            month: nextMonth.getMonth(),
            year: nextMonth.getFullYear(),
            displayName: `${monthNames[nextMonth.getMonth()]} ${nextMonth.getFullYear()}`,
            date: nextMonth
        };
    }

    if (term === 'current month' || term === 'current' || term === 'this month' || term === 'now') {
        const now = new Date();
        const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
                          'July', 'August', 'September', 'October', 'November', 'December'];

        return {
            month: now.getMonth(),
            year: now.getFullYear(),
            displayName: `${monthNames[now.getMonth()]} ${now.getFullYear()}`,
            date: new Date(now.getFullYear(), now.getMonth(), 1)
        };
    }

    return null;
}

/**
 * Filter commands based on search term
 * Searches command title, description, and keywords
 * @param {Array} commands - Array of command objects to filter
 * @param {string} searchTerm - The search term to filter by
 * @returns {Array} Filtered array of commands
 */
export function filterCommands(commands, searchTerm) {
    if (!searchTerm) {
        return commands;
    }

    const term = searchTerm.toLowerCase().trim();

    return commands.filter(command => {
        const searchText = `${command.title} ${command.description} ${command.keywords}`.toLowerCase();
        return searchText.includes(term);
    });
}

/**
 * Timer reference for debouncing search operations
 * @private
 */
let searchDebounceTimer = null;

/**
 * Perform debounced task search
 * Delays search execution until user stops typing and enforces minimum search length
 *
 * @param {string} searchTerm - The search term entered by user
 * @param {Function} callback - Callback function to receive search results
 *
 * @example
 * performSearchDebounced('dev', (results) => {
 *     console.log('Search results:', results);
 * });
 */
export function performSearchDebounced(searchTerm, callback) {
    clearTimeout(searchDebounceTimer);

    // Normalize input - handle null/undefined and trim whitespace
    const term = (searchTerm ?? '').trim();

    // Don't search if input is too short
    if (term.length < SEARCH.MIN_SEARCH_LENGTH) {
        callback([]);
        return;
    }

    // Delay search execution by DEBOUNCE_DELAY milliseconds
    searchDebounceTimer = setTimeout(() => {
        const results = performTaskSearch(term);
        callback(results);
    }, SEARCH.DEBOUNCE_DELAY);
}
