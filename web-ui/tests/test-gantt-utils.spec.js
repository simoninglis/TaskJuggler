import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  addAllChildren,
  addParentHierarchy,
  addAllDescendants,
  addAncestorHierarchy,
  createHierarchicalFilter,
  createHierarchicalFilterFromIds
} from '../src/js/gantt-utils.js';

describe('Gantt Utility Functions', () => {
  let consoleErrorSpy;
  let consoleWarnSpy;

  beforeEach(() => {
    // Spy on console methods
    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

    // Clear gantt from global scope before tests that should fail
    delete global.gantt;
  });

  describe('addAllChildren (array-based)', () => {
    it('should add all direct children to the set', () => {
      const tasks = [
        { id: 'parent1', parent: 0 },
        { id: 'child1', parent: 'parent1' },
        { id: 'child2', parent: 'parent1' },
        { id: 'other', parent: 0 }
      ];
      const includeSet = new Set();

      addAllChildren('parent1', tasks, includeSet);

      expect(includeSet.has('child1')).toBe(true);
      expect(includeSet.has('child2')).toBe(true);
      expect(includeSet.has('other')).toBe(false);
      expect(includeSet.has('parent1')).toBe(false);
    });

    it('should recursively add all descendants (grandchildren)', () => {
      const tasks = [
        { id: 'parent', parent: 0 },
        { id: 'child1', parent: 'parent' },
        { id: 'grandchild1', parent: 'child1' },
        { id: 'grandchild2', parent: 'child1' },
        { id: 'child2', parent: 'parent' }
      ];
      const includeSet = new Set();

      addAllChildren('parent', tasks, includeSet);

      expect(includeSet.has('child1')).toBe(true);
      expect(includeSet.has('child2')).toBe(true);
      expect(includeSet.has('grandchild1')).toBe(true);
      expect(includeSet.has('grandchild2')).toBe(true);
      expect(includeSet.size).toBe(4);
    });

    it('should handle tasks with no children', () => {
      const tasks = [
        { id: 'parent', parent: 0 },
        { id: 'other', parent: 0 }
      ];
      const includeSet = new Set();

      addAllChildren('parent', tasks, includeSet);

      expect(includeSet.size).toBe(0);
    });

    it('should handle empty task array', () => {
      const tasks = [];
      const includeSet = new Set();

      addAllChildren('parent', tasks, includeSet);

      expect(includeSet.size).toBe(0);
    });

    it('should handle deep nesting (3+ levels)', () => {
      const tasks = [
        { id: 'root', parent: 0 },
        { id: 'level1', parent: 'root' },
        { id: 'level2', parent: 'level1' },
        { id: 'level3', parent: 'level2' },
        { id: 'level4', parent: 'level3' }
      ];
      const includeSet = new Set();

      addAllChildren('root', tasks, includeSet);

      expect(includeSet.has('level1')).toBe(true);
      expect(includeSet.has('level2')).toBe(true);
      expect(includeSet.has('level3')).toBe(true);
      expect(includeSet.has('level4')).toBe(true);
      expect(includeSet.size).toBe(4);
    });
  });

  describe('addParentHierarchy (array-based)', () => {
    it('should add all parent tasks up the hierarchy', () => {
      const tasks = [
        { id: 'grandparent', parent: 0 },
        { id: 'parent', parent: 'grandparent' },
        { id: 'child', parent: 'parent' }
      ];
      const includeSet = new Set();

      addParentHierarchy('child', tasks, includeSet);

      expect(includeSet.has('parent')).toBe(true);
      expect(includeSet.has('grandparent')).toBe(true);
      expect(includeSet.has('child')).toBe(false);
      expect(includeSet.size).toBe(2);
    });

    it('should stop at root task (parent === 0)', () => {
      const tasks = [
        { id: 'root', parent: 0 },
        { id: 'child', parent: 'root' }
      ];
      const includeSet = new Set();

      addParentHierarchy('child', tasks, includeSet);

      expect(includeSet.has('root')).toBe(true);
      expect(includeSet.size).toBe(1);
    });

    it('should handle task with no parent', () => {
      const tasks = [
        { id: 'orphan', parent: 0 }
      ];
      const includeSet = new Set();

      addParentHierarchy('orphan', tasks, includeSet);

      expect(includeSet.size).toBe(0);
    });

    it('should handle task not found in array', () => {
      const tasks = [
        { id: 'task1', parent: 0 }
      ];
      const includeSet = new Set();

      addParentHierarchy('nonexistent', tasks, includeSet);

      expect(includeSet.size).toBe(0);
    });

    it('should handle deep hierarchy (4+ levels)', () => {
      const tasks = [
        { id: 'level0', parent: 0 },
        { id: 'level1', parent: 'level0' },
        { id: 'level2', parent: 'level1' },
        { id: 'level3', parent: 'level2' },
        { id: 'level4', parent: 'level3' }
      ];
      const includeSet = new Set();

      addParentHierarchy('level4', tasks, includeSet);

      expect(includeSet.has('level3')).toBe(true);
      expect(includeSet.has('level2')).toBe(true);
      expect(includeSet.has('level1')).toBe(true);
      expect(includeSet.has('level0')).toBe(true);
      expect(includeSet.size).toBe(4);
    });
  });

  describe('addAllDescendants (gantt API-based)', () => {
    it('should log error when gantt is undefined', () => {
      const includeSet = new Set();

      addAllDescendants('parent', includeSet);

      expect(consoleErrorSpy).toHaveBeenCalledWith('addAllDescendants: gantt is not defined');
      expect(includeSet.size).toBe(0);
    });

    it('should add all descendants using gantt.eachTask', () => {
      const ganttMock = {
        eachTask: vi.fn((callback, parentId) => {
          // Simulate gantt.eachTask calling callback for each child
          const children = [
            { id: 'child1' },
            { id: 'child2' }
          ];
          children.forEach(callback);
        }),
        hasChild: vi.fn(() => false)
      };
      global.gantt = ganttMock;

      const includeSet = new Set();
      addAllDescendants('parent', includeSet);

      expect(ganttMock.eachTask).toHaveBeenCalledWith(expect.any(Function), 'parent');
      expect(includeSet.has('child1')).toBe(true);
      expect(includeSet.has('child2')).toBe(true);
      expect(includeSet.size).toBe(2);
    });

    it('should recursively add descendants when task has children', () => {
      const ganttMock = {
        eachTask: vi.fn((callback, parentId) => {
          if (parentId === 'parent') {
            callback({ id: 'child1' });
          } else if (parentId === 'child1') {
            callback({ id: 'grandchild1' });
          }
        }),
        hasChild: vi.fn((taskId) => taskId === 'child1')
      };
      global.gantt = ganttMock;

      const includeSet = new Set();
      addAllDescendants('parent', includeSet);

      expect(includeSet.has('child1')).toBe(true);
      expect(includeSet.has('grandchild1')).toBe(true);
      expect(includeSet.size).toBe(2);
    });
  });

  describe('addAncestorHierarchy (gantt API-based)', () => {
    it('should log error when gantt is undefined', () => {
      const includeSet = new Set();

      addAncestorHierarchy('task', includeSet);

      expect(consoleErrorSpy).toHaveBeenCalledWith('addAncestorHierarchy: gantt is not defined');
      expect(includeSet.size).toBe(0);
    });

    it('should add all ancestors using gantt.getTask', () => {
      const ganttMock = {
        getTask: vi.fn((taskId) => {
          const tasks = {
            'child': { id: 'child', parent: 'parent' },
            'parent': { id: 'parent', parent: 0 }
          };
          return tasks[taskId];
        })
      };
      global.gantt = ganttMock;

      const includeSet = new Set();
      addAncestorHierarchy('child', includeSet);

      expect(ganttMock.getTask).toHaveBeenCalledWith('child');
      expect(ganttMock.getTask).toHaveBeenCalledWith('parent');
      expect(includeSet.has('parent')).toBe(true);
      expect(includeSet.size).toBe(1);
    });

    it('should stop at root task (parent === 0)', () => {
      const ganttMock = {
        getTask: vi.fn((taskId) => {
          if (taskId === 'child') {
            return { id: 'child', parent: 'root' };
          } else if (taskId === 'root') {
            return { id: 'root', parent: 0 };
          }
          return null;
        })
      };
      global.gantt = ganttMock;

      const includeSet = new Set();
      addAncestorHierarchy('child', includeSet);

      expect(includeSet.has('root')).toBe(true);
      expect(includeSet.size).toBe(1);
    });

    it('should handle error when task not found', () => {
      const ganttMock = {
        getTask: vi.fn(() => {
          throw new Error('Task not found');
        })
      };
      global.gantt = ganttMock;

      const includeSet = new Set();
      addAncestorHierarchy('nonexistent', includeSet);

      expect(consoleWarnSpy).toHaveBeenCalledWith(
        'addAncestorHierarchy: Could not find task nonexistent',
        expect.any(Error)
      );
      expect(includeSet.size).toBe(0);
    });

    it('should handle task with no parent field', () => {
      const ganttMock = {
        getTask: vi.fn(() => ({ id: 'task' })) // No parent field
      };
      global.gantt = ganttMock;

      const includeSet = new Set();
      addAncestorHierarchy('task', includeSet);

      expect(includeSet.size).toBe(0);
    });
  });

  describe('createHierarchicalFilter (array-based)', () => {
    it('should include matching tasks, their children, and parents', () => {
      const allTasks = [
        { id: 'grandparent', parent: 0 },
        { id: 'parent', parent: 'grandparent' },
        { id: 'match', parent: 'parent' },
        { id: 'child', parent: 'match' },
        { id: 'other', parent: 0 }
      ];
      const matchingTasks = [
        { id: 'match', parent: 'parent' }
      ];

      const result = createHierarchicalFilter(matchingTasks, allTasks);

      expect(result.has('match')).toBe(true);
      expect(result.has('child')).toBe(true);
      expect(result.has('parent')).toBe(true);
      expect(result.has('grandparent')).toBe(true);
      expect(result.has('other')).toBe(false);
      expect(result.size).toBe(4);
    });

    it('should handle multiple matching tasks', () => {
      const allTasks = [
        { id: 'root', parent: 0 },
        { id: 'match1', parent: 'root' },
        { id: 'match2', parent: 'root' },
        { id: 'child1', parent: 'match1' }
      ];
      const matchingTasks = [
        { id: 'match1', parent: 'root' },
        { id: 'match2', parent: 'root' }
      ];

      const result = createHierarchicalFilter(matchingTasks, allTasks);

      expect(result.has('match1')).toBe(true);
      expect(result.has('match2')).toBe(true);
      expect(result.has('child1')).toBe(true);
      expect(result.has('root')).toBe(true);
      expect(result.size).toBe(4);
    });

    it('should handle matching task with no relatives', () => {
      const allTasks = [
        { id: 'orphan', parent: 0 }
      ];
      const matchingTasks = [
        { id: 'orphan', parent: 0 }
      ];

      const result = createHierarchicalFilter(matchingTasks, allTasks);

      expect(result.has('orphan')).toBe(true);
      expect(result.size).toBe(1);
    });

    it('should handle empty matching tasks', () => {
      const allTasks = [
        { id: 'task1', parent: 0 },
        { id: 'task2', parent: 0 }
      ];
      const matchingTasks = [];

      const result = createHierarchicalFilter(matchingTasks, allTasks);

      expect(result.size).toBe(0);
    });

    it('should handle overlapping hierarchies correctly', () => {
      const allTasks = [
        { id: 'root', parent: 0 },
        { id: 'parent1', parent: 'root' },
        { id: 'parent2', parent: 'root' },
        { id: 'child1', parent: 'parent1' },
        { id: 'child2', parent: 'parent2' }
      ];
      const matchingTasks = [
        { id: 'child1', parent: 'parent1' },
        { id: 'child2', parent: 'parent2' }
      ];

      const result = createHierarchicalFilter(matchingTasks, allTasks);

      // Both should share 'root' parent
      expect(result.has('child1')).toBe(true);
      expect(result.has('child2')).toBe(true);
      expect(result.has('parent1')).toBe(true);
      expect(result.has('parent2')).toBe(true);
      expect(result.has('root')).toBe(true);
      expect(result.size).toBe(5); // Not 6 - root counted once
    });
  });

  describe('createHierarchicalFilterFromIds (gantt API-based)', () => {
    it('should create filter using gantt API', () => {
      const ganttMock = {
        eachTask: vi.fn((callback, parentId) => {
          const childMap = {
            'match': [{ id: 'child1' }]
          };
          if (childMap[parentId]) {
            childMap[parentId].forEach(callback);
          }
        }),
        hasChild: vi.fn((taskId) => taskId === 'match'),
        getTask: vi.fn((taskId) => {
          const tasks = {
            'match': { id: 'match', parent: 'root' },
            'root': { id: 'root', parent: 0 },
            'child1': { id: 'child1', parent: 'match' }
          };
          return tasks[taskId];
        })
      };
      global.gantt = ganttMock;

      const result = createHierarchicalFilterFromIds(['match']);

      expect(result.has('match')).toBe(true);
      expect(result.has('child1')).toBe(true);
      expect(result.has('root')).toBe(true);
    });

    it('should handle multiple matching task IDs', () => {
      const ganttMock = {
        eachTask: vi.fn(),
        hasChild: vi.fn(() => false),
        getTask: vi.fn((taskId) => {
          const tasks = {
            'match1': { id: 'match1', parent: 'root' },
            'match2': { id: 'match2', parent: 'root' },
            'root': { id: 'root', parent: 0 }
          };
          return tasks[taskId];
        })
      };
      global.gantt = ganttMock;

      const result = createHierarchicalFilterFromIds(['match1', 'match2']);

      expect(result.has('match1')).toBe(true);
      expect(result.has('match2')).toBe(true);
      expect(result.has('root')).toBe(true);
    });

    it('should handle empty matching task IDs', () => {
      global.gantt = {
        eachTask: vi.fn(),
        hasChild: vi.fn(),
        getTask: vi.fn()
      };

      const result = createHierarchicalFilterFromIds([]);

      expect(result.size).toBe(0);
    });

    it('should gracefully handle missing gantt object', () => {
      // gantt is undefined from beforeEach
      const result = createHierarchicalFilterFromIds(['task1']);

      // Should still create set with the matching IDs even if ancestors/descendants fail
      expect(result.has('task1')).toBe(true);
      expect(consoleErrorSpy).toHaveBeenCalled();
    });
  });

  describe('Edge Cases and Integration', () => {
    it('should handle numeric task IDs', () => {
      const tasks = [
        { id: 1, parent: 0 },
        { id: 2, parent: 1 },
        { id: 3, parent: 2 }
      ];
      const includeSet = new Set();

      addAllChildren(1, tasks, includeSet);

      expect(includeSet.has(2)).toBe(true);
      expect(includeSet.has(3)).toBe(true);
      expect(includeSet.size).toBe(2);
    });

    it('should handle mixed string and numeric IDs', () => {
      const tasks = [
        { id: 'parent', parent: 0 },
        { id: 1, parent: 'parent' },
        { id: 'child', parent: 1 }
      ];
      const includeSet = new Set();

      addAllChildren('parent', tasks, includeSet);

      expect(includeSet.has(1)).toBe(true);
      expect(includeSet.has('child')).toBe(true);
    });

    it('should not modify original arrays in createHierarchicalFilter', () => {
      const allTasks = [
        { id: 'task1', parent: 0 },
        { id: 'task2', parent: 'task1' }
      ];
      const matchingTasks = [
        { id: 'task2', parent: 'task1' }
      ];

      const originalAllTasksLength = allTasks.length;
      const originalMatchingLength = matchingTasks.length;

      createHierarchicalFilter(matchingTasks, allTasks);

      expect(allTasks.length).toBe(originalAllTasksLength);
      expect(matchingTasks.length).toBe(originalMatchingLength);
    });
  });
});
