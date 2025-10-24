/**
 * Task Index for Efficient Search
 *
 * Maintains an inverted index for O(1) word lookup:
 * - word → Set<taskId> (inverted index)
 * - taskId → task object (task cache)
 * - taskId → {parent, children} (hierarchy cache)
 *
 * Auto-updates via gantt event hooks for incremental synchronization.
 *
 * @module search/task-index
 */

/**
 * TaskIndex class - Manages task search index with incremental updates
 */
class TaskIndex {
    constructor() {
        /**
         * Inverted index: word → Set<taskId>
         * Enables O(1) word lookup
         */
        this.index = new Map();

        /**
         * Task cache: taskId → task object
         * Avoids repeated gantt API calls
         */
        this.taskCache = new Map();

        /**
         * Hierarchy cache: taskId → {parent, children}
         * Quick access to task relationships
         */
        this.hierarchyCache = new Map();

        /**
         * Index initialization flag
         */
        this.initialized = false;
    }

    /**
     * Initial index build from all tasks
     * Complexity: O(n * m) where n = tasks, m = avg words per task
     */
    rebuild() {
        this.index.clear();
        this.taskCache.clear();
        this.hierarchyCache.clear();

        const tasks = gantt.getTaskByTime();

        // First pass: Index all tasks and cache parent references
        tasks.forEach(task => {
            this._indexTask(task);
        });

        // Second pass: Populate children arrays now that all tasks are in taskCache
        tasks.forEach(task => {
            const children = Array.from(this.taskCache.values()).filter(t => t.parent === task.id);
            const hierarchy = this.hierarchyCache.get(task.id);
            if (hierarchy) {
                hierarchy.children = children;
            }
        });

        this.initialized = true;
    }

    /**
     * Incremental update: Add or update single task
     * Complexity: O(m) where m = words in task
     *
     * @param {Object} task - Task object to update
     */
    updateTask(task) {
        // Remove old index entries if task exists
        if (this.taskCache.has(task.id)) {
            this.removeTask(task.id);
        }

        // Add new index entries
        this._indexTask(task);

        // Update children arrays for affected parents
        this._updateHierarchyCache(task);
    }

    /**
     * Incremental update: Remove single task
     * Complexity: O(m) where m = words in task
     *
     * @param {string|number} taskId - ID of task to remove
     */
    removeTask(taskId) {
        const task = this.taskCache.get(taskId);
        if (!task) return;

        // Remove from word index
        const words = task.text.toLowerCase().split(/\s+/);
        words.forEach(word => {
            const taskIds = this.index.get(word);
            if (taskIds) {
                taskIds.delete(taskId);
                if (taskIds.size === 0) {
                    this.index.delete(word);
                }
            }
        });

        // Remove from caches
        this.taskCache.delete(taskId);
        this.hierarchyCache.delete(taskId);

        // Update children arrays for affected parents
        if (task.parent) {
            const parentHierarchy = this.hierarchyCache.get(task.parent);
            if (parentHierarchy && parentHierarchy.children) {
                parentHierarchy.children = parentHierarchy.children.filter(child => child.id !== taskId);
            }
        }
    }

    /**
     * Helper: Index a single task
     *
     * @param {Object} task - Task object to index
     * @private
     */
    _indexTask(task) {
        // Cache the task object
        this.taskCache.set(task.id, task);

        // Tokenize task text into words
        const words = task.text.toLowerCase().split(/\s+/);

        // Add each word to inverted index
        words.forEach(word => {
            if (!word) return; // Skip empty strings

            if (!this.index.has(word)) {
                this.index.set(word, new Set());
            }
            this.index.get(word).add(task.id);
        });

        // Initialize hierarchy cache entry
        const parent = task.parent ? this.taskCache.get(task.parent) : null;
        this.hierarchyCache.set(task.id, { parent, children: [] });
    }

    /**
     * Helper: Update hierarchy cache after task update
     *
     * @param {Object} task - Updated task
     * @private
     */
    _updateHierarchyCache(task) {
        // Update this task's children list
        const children = Array.from(this.taskCache.values()).filter(t => t.parent === task.id);
        const hierarchy = this.hierarchyCache.get(task.id);
        if (hierarchy) {
            hierarchy.children = children;
        }

        // Update parent's children list if task has a parent
        if (task.parent) {
            const parentHierarchy = this.hierarchyCache.get(task.parent);
            if (parentHierarchy) {
                const parentChildren = Array.from(this.taskCache.values()).filter(t => t.parent === task.parent);
                parentHierarchy.children = parentChildren;
            }
        }
    }

    /**
     * Search for tasks matching term (exact word match only)
     * Complexity: O(1) for word lookup + O(k) where k = matching tasks
     *
     * @param {string} searchTerm - Search term (single word)
     * @returns {Array} Array of matching task objects
     */
    search(searchTerm) {
        const term = searchTerm.toLowerCase().trim();
        if (!term) return [];

        // Try exact word match (fast path - O(1))
        const matchingIds = this.index.get(term);
        if (matchingIds && matchingIds.size > 0) {
            return Array.from(matchingIds).map(id => this.taskCache.get(id)).filter(Boolean);
        }

        // No exact match found
        return [];
    }

    /**
     * Search with substring fallback
     * Complexity: O(1) for exact match, O(n) for substring
     *
     * Fast path: Try exact word match first (O(1) index lookup)
     * Slow path: Fall back to substring search if no exact match (O(n) linear scan)
     *
     * @param {string} searchTerm - Search term (single word or partial word)
     * @returns {Array} Array of matching task objects
     */
    searchWithSubstring(searchTerm) {
        const term = searchTerm.toLowerCase().trim();
        if (!term) return [];

        // Try exact word match first (O(1) fast path)
        const exactMatches = this.index.get(term);
        if (exactMatches && exactMatches.size > 0) {
            return Array.from(exactMatches).map(id => this.taskCache.get(id)).filter(Boolean);
        }

        // No exact match - fall back to substring search (O(n) slow path)
        // Only use when necessary (e.g., user types partial word like "dev" instead of "development")
        const results = [];
        this.taskCache.forEach(task => {
            if (task.text.toLowerCase().includes(term)) {
                results.push(task);
            }
        });

        return results;
    }

    /**
     * Multi-word search with Set intersection (future enhancement)
     * Example: "development server" → find tasks with BOTH words
     * Complexity: O(word_count) index lookups + O(k) for intersection
     *
     * @param {string} searchTerm - Search term (multiple words)
     * @returns {Array} Array of tasks matching ALL words
     */
    searchMultiWord(searchTerm) {
        const words = searchTerm.toLowerCase().trim().split(/\s+/);
        if (words.length === 0) return [];
        if (words.length === 1) return this.searchWithSubstring(words[0]);

        // Get matching task IDs for each word
        const matchSets = words.map(word => {
            const matches = this.index.get(word);
            return matches ? Array.from(matches) : [];
        });

        // Find intersection (tasks matching ALL words)
        const intersection = matchSets.reduce((acc, matches) => {
            if (acc.length === 0) return matches;
            return acc.filter(id => matches.includes(id));
        });

        return intersection.map(id => this.taskCache.get(id)).filter(Boolean);
    }

    /**
     * Get hierarchy information for a task
     *
     * @param {string|number} taskId - Task ID
     * @returns {Object|null} Hierarchy object {parent, children} or null
     */
    getHierarchy(taskId) {
        return this.hierarchyCache.get(taskId) || null;
    }

    /**
     * Get index statistics for debugging
     *
     * @returns {Object} Statistics object
     */
    getStats() {
        return {
            initialized: this.initialized,
            totalWords: this.index.size,
            totalTasks: this.taskCache.size,
            avgWordsPerTask: this.taskCache.size > 0 ?
                Array.from(this.taskCache.values())
                    .reduce((sum, task) => sum + task.text.split(/\s+/).length, 0) / this.taskCache.size : 0
        };
    }
}

/**
 * Singleton task index instance
 */
export const taskIndex = new TaskIndex();

/**
 * Idempotency guard to prevent duplicate hook registration
 */
let hooksRegistered = false;

/**
 * Register gantt event hooks for incremental updates
 * Call this AFTER gantt is initialized (deferred registration)
 *
 * @param {Object} ganttInstance - The initialized gantt instance
 */
export function registerTaskIndexHooks(ganttInstance) {
    if (hooksRegistered) {
        console.warn('Task index hooks already registered, skipping duplicate registration');
        return;
    }

    hooksRegistered = true;
    console.log('Registering task index hooks for incremental updates');

    // Hook: onAfterTaskAdd - Task added to gantt
    ganttInstance.attachEvent("onAfterTaskAdd", function(id, task) {
        if (taskIndex.initialized) {
            taskIndex.updateTask(task);
            console.debug(`Task index: Added task ${id}`);
        }
        return true;
    });

    // Hook: onAfterTaskUpdate - Task updated in gantt
    ganttInstance.attachEvent("onAfterTaskUpdate", function(id, task) {
        if (taskIndex.initialized) {
            taskIndex.updateTask(task);
            console.debug(`Task index: Updated task ${id}`);
        }
        return true;
    });

    // Hook: onAfterTaskDelete - Task deleted from gantt
    ganttInstance.attachEvent("onAfterTaskDelete", function(id, task) {
        if (taskIndex.initialized) {
            taskIndex.removeTask(id);
            console.debug(`Task index: Removed task ${id}`);
        }
        return true;
    });
}

/**
 * Reset hook registration (for testing)
 * @private
 */
export function _resetHooksForTesting() {
    hooksRegistered = false;
}
