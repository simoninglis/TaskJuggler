import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  selectNextTask,
  selectPreviousTask,
  navigateToNextMilestone,
  navigateToPreviousMilestone
} from '../src/js/gantt/gantt-navigation.js';

describe('Gantt Navigation Functions', () => {
  let ganttMock;
  let consoleLogSpy;
  let updateStatusSpy;
  let debugLogSpy;

  beforeEach(() => {
    // Reset mocks before each test
    consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

    // Mock window.updateStatus
    updateStatusSpy = vi.fn();
    global.window = global.window || {};
    global.window.updateStatus = updateStatusSpy;

    // Mock window.debugLog
    debugLogSpy = vi.fn();
    global.window.debugLog = debugLogSpy;

    // Create gantt mock with default behavior
    ganttMock = {
      config: {
        types: {
          task: 'task',
          milestone: 'milestone',
          project: 'project'
        }
      },
      getTaskByTime: vi.fn(() => []),
      getSelectedId: vi.fn(() => null),
      selectTask: vi.fn(),
      showTask: vi.fn(),
      getTask: vi.fn()
    };

    // Make gantt available globally
    global.gantt = ganttMock;
  });

  describe('selectNextTask', () => {
    it('should select first task when no task is selected', () => {
      const tasks = [
        { id: 'task1', text: 'Task 1' },
        { id: 'task2', text: 'Task 2' },
        { id: 'task3', text: 'Task 3' }
      ];

      ganttMock.getTaskByTime.mockReturnValue(tasks);
      ganttMock.getSelectedId.mockReturnValue(null);

      selectNextTask();

      expect(ganttMock.selectTask).toHaveBeenCalledWith('task1');
      expect(ganttMock.showTask).toHaveBeenCalledWith('task1');
    });

    it('should select next task when a task is already selected', () => {
      const tasks = [
        { id: 'task1', text: 'Task 1' },
        { id: 'task2', text: 'Task 2' },
        { id: 'task3', text: 'Task 3' }
      ];

      ganttMock.getTaskByTime.mockReturnValue(tasks);
      ganttMock.getSelectedId.mockReturnValue('task1');

      selectNextTask();

      expect(ganttMock.selectTask).toHaveBeenCalledWith('task2');
      expect(ganttMock.showTask).toHaveBeenCalledWith('task2');
    });

    it('should not navigate beyond last task', () => {
      const tasks = [
        { id: 'task1', text: 'Task 1' },
        { id: 'task2', text: 'Task 2' }
      ];

      ganttMock.getTaskByTime.mockReturnValue(tasks);
      ganttMock.getSelectedId.mockReturnValue('task2'); // last task

      selectNextTask();

      // Should not call selectTask because already at end
      expect(ganttMock.selectTask).not.toHaveBeenCalled();
      expect(ganttMock.showTask).not.toHaveBeenCalled();
    });

    it('should handle empty task list', () => {
      ganttMock.getTaskByTime.mockReturnValue([]);

      selectNextTask();

      expect(ganttMock.selectTask).not.toHaveBeenCalled();
      expect(ganttMock.showTask).not.toHaveBeenCalled();
    });

    it('should select first task if current selection not in list', () => {
      const tasks = [
        { id: 'task1', text: 'Task 1' },
        { id: 'task2', text: 'Task 2' }
      ];

      ganttMock.getTaskByTime.mockReturnValue(tasks);
      ganttMock.getSelectedId.mockReturnValue('non-existent-task');

      selectNextTask();

      expect(ganttMock.selectTask).toHaveBeenCalledWith('task1');
      expect(ganttMock.showTask).toHaveBeenCalledWith('task1');
    });
  });

  describe('selectPreviousTask', () => {
    it('should select last task when no task is selected', () => {
      const tasks = [
        { id: 'task1', text: 'Task 1' },
        { id: 'task2', text: 'Task 2' },
        { id: 'task3', text: 'Task 3' }
      ];

      ganttMock.getTaskByTime.mockReturnValue(tasks);
      ganttMock.getSelectedId.mockReturnValue(null);

      selectPreviousTask();

      expect(ganttMock.selectTask).toHaveBeenCalledWith('task3');
      expect(ganttMock.showTask).toHaveBeenCalledWith('task3');
    });

    it('should select previous task when a task is already selected', () => {
      const tasks = [
        { id: 'task1', text: 'Task 1' },
        { id: 'task2', text: 'Task 2' },
        { id: 'task3', text: 'Task 3' }
      ];

      ganttMock.getTaskByTime.mockReturnValue(tasks);
      ganttMock.getSelectedId.mockReturnValue('task2');

      selectPreviousTask();

      expect(ganttMock.selectTask).toHaveBeenCalledWith('task1');
      expect(ganttMock.showTask).toHaveBeenCalledWith('task1');
    });

    it('should not navigate before first task', () => {
      const tasks = [
        { id: 'task1', text: 'Task 1' },
        { id: 'task2', text: 'Task 2' }
      ];

      ganttMock.getTaskByTime.mockReturnValue(tasks);
      ganttMock.getSelectedId.mockReturnValue('task1'); // first task

      selectPreviousTask();

      // Should not call selectTask because already at beginning
      expect(ganttMock.selectTask).not.toHaveBeenCalled();
      expect(ganttMock.showTask).not.toHaveBeenCalled();
    });

    it('should handle empty task list', () => {
      ganttMock.getTaskByTime.mockReturnValue([]);

      selectPreviousTask();

      expect(ganttMock.selectTask).not.toHaveBeenCalled();
      expect(ganttMock.showTask).not.toHaveBeenCalled();
    });

    it('should select last task if current selection not in list', () => {
      const tasks = [
        { id: 'task1', text: 'Task 1' },
        { id: 'task2', text: 'Task 2' }
      ];

      ganttMock.getTaskByTime.mockReturnValue(tasks);
      ganttMock.getSelectedId.mockReturnValue('non-existent-task');

      selectPreviousTask();

      expect(ganttMock.selectTask).toHaveBeenCalledWith('task2');
      expect(ganttMock.showTask).toHaveBeenCalledWith('task2');
    });
  });

  describe('navigateToNextMilestone', () => {
    it('should navigate to first milestone when no task is selected', () => {
      const tasks = [
        { id: 'task1', text: 'Task 1', type: 'task', start_date: new Date('2025-01-01') },
        { id: 'milestone1', text: 'Milestone 1', type: 'milestone', start_date: new Date('2025-01-15') },
        { id: 'task2', text: 'Task 2', type: 'task', start_date: new Date('2025-01-20') },
        { id: 'milestone2', text: 'Milestone 2', type: 'milestone', start_date: new Date('2025-02-01') }
      ];

      ganttMock.getTaskByTime.mockReturnValue(tasks);
      ganttMock.getSelectedId.mockReturnValue(null);

      navigateToNextMilestone();

      expect(ganttMock.selectTask).toHaveBeenCalledWith('milestone1');
      expect(ganttMock.showTask).toHaveBeenCalledWith('milestone1');
      expect(updateStatusSpy).toHaveBeenCalledWith('Jumped to milestone: Milestone 1');
    });

    it('should navigate to next milestone after current selection', () => {
      const tasks = [
        { id: 'task1', text: 'Task 1', type: 'task', start_date: new Date('2025-01-01') },
        { id: 'milestone1', text: 'Milestone 1', type: 'milestone', start_date: new Date('2025-01-15') },
        { id: 'task2', text: 'Task 2', type: 'task', start_date: new Date('2025-01-20') },
        { id: 'milestone2', text: 'Milestone 2', type: 'milestone', start_date: new Date('2025-02-01') }
      ];

      ganttMock.getTaskByTime.mockReturnValue(tasks);
      ganttMock.getSelectedId.mockReturnValue('task1');
      ganttMock.getTask.mockReturnValue({ id: 'task1', start_date: new Date('2025-01-01') });

      navigateToNextMilestone();

      expect(ganttMock.selectTask).toHaveBeenCalledWith('milestone1');
      expect(ganttMock.showTask).toHaveBeenCalledWith('milestone1');
    });

    it('should wrap around to first milestone when at end', () => {
      const tasks = [
        { id: 'milestone1', text: 'Milestone 1', type: 'milestone', start_date: new Date('2025-01-15') },
        { id: 'task1', text: 'Task 1', type: 'task', start_date: new Date('2025-03-01') },
        { id: 'milestone2', text: 'Milestone 2', type: 'milestone', start_date: new Date('2025-02-15') }
      ];

      ganttMock.getTaskByTime.mockReturnValue(tasks);
      ganttMock.getSelectedId.mockReturnValue('task1');
      ganttMock.getTask.mockReturnValue({ id: 'task1', start_date: new Date('2025-03-01') });

      navigateToNextMilestone();

      // Should wrap around to first milestone (task1 is after all milestones)
      expect(ganttMock.selectTask).toHaveBeenCalledWith('milestone1');
      expect(ganttMock.showTask).toHaveBeenCalledWith('milestone1');
    });

    it('should show message when no milestones exist', () => {
      const tasks = [
        { id: 'task1', text: 'Task 1', type: 'task', start_date: new Date('2025-01-01') },
        { id: 'task2', text: 'Task 2', type: 'task', start_date: new Date('2025-01-20') }
      ];

      ganttMock.getTaskByTime.mockReturnValue(tasks);

      navigateToNextMilestone();

      expect(updateStatusSpy).toHaveBeenCalledWith('No milestones found in project');
      expect(ganttMock.selectTask).not.toHaveBeenCalled();
    });

    it('should handle empty task list', () => {
      ganttMock.getTaskByTime.mockReturnValue([]);

      navigateToNextMilestone();

      expect(updateStatusSpy).toHaveBeenCalledWith('No milestones found in project');
      expect(ganttMock.selectTask).not.toHaveBeenCalled();
    });
  });

  describe('navigateToPreviousMilestone', () => {
    it('should navigate to last milestone when no task is selected', () => {
      const tasks = [
        { id: 'milestone1', text: 'Milestone 1', type: 'milestone', start_date: new Date('2025-01-15') },
        { id: 'task1', text: 'Task 1', type: 'task', start_date: new Date('2025-01-20') },
        { id: 'milestone2', text: 'Milestone 2', type: 'milestone', start_date: new Date('2025-02-01') }
      ];

      ganttMock.getTaskByTime.mockReturnValue(tasks);
      ganttMock.getSelectedId.mockReturnValue(null);

      navigateToPreviousMilestone();

      expect(ganttMock.selectTask).toHaveBeenCalledWith('milestone2');
      expect(ganttMock.showTask).toHaveBeenCalledWith('milestone2');
      expect(updateStatusSpy).toHaveBeenCalledWith('Jumped to milestone: Milestone 2');
    });

    it('should navigate to previous milestone before current selection', () => {
      const tasks = [
        { id: 'milestone1', text: 'Milestone 1', type: 'milestone', start_date: new Date('2025-01-15') },
        { id: 'task1', text: 'Task 1', type: 'task', start_date: new Date('2025-01-20') },
        { id: 'milestone2', text: 'Milestone 2', type: 'milestone', start_date: new Date('2025-02-01') }
      ];

      ganttMock.getTaskByTime.mockReturnValue(tasks);
      ganttMock.getSelectedId.mockReturnValue('task1');
      ganttMock.getTask.mockReturnValue({ id: 'task1', start_date: new Date('2025-01-20') });

      navigateToPreviousMilestone();

      expect(ganttMock.selectTask).toHaveBeenCalledWith('milestone1');
      expect(ganttMock.showTask).toHaveBeenCalledWith('milestone1');
    });

    it('should wrap around to last milestone when at beginning', () => {
      const tasks = [
        { id: 'milestone1', text: 'Milestone 1', type: 'milestone', start_date: new Date('2025-01-15') },
        { id: 'task1', text: 'Task 1', type: 'task', start_date: new Date('2025-01-05') },
        { id: 'milestone2', text: 'Milestone 2', type: 'milestone', start_date: new Date('2025-02-01') }
      ];

      ganttMock.getTaskByTime.mockReturnValue(tasks);
      ganttMock.getSelectedId.mockReturnValue('task1');
      ganttMock.getTask.mockReturnValue({ id: 'task1', start_date: new Date('2025-01-05') });

      navigateToPreviousMilestone();

      // Should wrap around to last milestone
      expect(ganttMock.selectTask).toHaveBeenCalledWith('milestone2');
      expect(ganttMock.showTask).toHaveBeenCalledWith('milestone2');
    });

    it('should show message when no milestones exist', () => {
      const tasks = [
        { id: 'task1', text: 'Task 1', type: 'task', start_date: new Date('2025-01-01') },
        { id: 'task2', text: 'Task 2', type: 'task', start_date: new Date('2025-01-20') }
      ];

      ganttMock.getTaskByTime.mockReturnValue(tasks);

      navigateToPreviousMilestone();

      expect(updateStatusSpy).toHaveBeenCalledWith('No milestones found in project');
      expect(ganttMock.selectTask).not.toHaveBeenCalled();
    });

    it('should handle empty task list', () => {
      ganttMock.getTaskByTime.mockReturnValue([]);

      navigateToPreviousMilestone();

      expect(updateStatusSpy).toHaveBeenCalledWith('No milestones found in project');
      expect(ganttMock.selectTask).not.toHaveBeenCalled();
    });
  });

  describe('Edge Cases', () => {
    it('should handle single task list for selectNextTask', () => {
      const tasks = [{ id: 'task1', text: 'Task 1' }];

      ganttMock.getTaskByTime.mockReturnValue(tasks);
      ganttMock.getSelectedId.mockReturnValue('task1');

      selectNextTask();

      // Already at end, should not navigate
      expect(ganttMock.selectTask).not.toHaveBeenCalled();
    });

    it('should handle single task list for selectPreviousTask', () => {
      const tasks = [{ id: 'task1', text: 'Task 1' }];

      ganttMock.getTaskByTime.mockReturnValue(tasks);
      ganttMock.getSelectedId.mockReturnValue('task1');

      selectPreviousTask();

      // Already at beginning, should not navigate
      expect(ganttMock.selectTask).not.toHaveBeenCalled();
    });

    it('should handle single milestone for navigateToNextMilestone', () => {
      const tasks = [
        { id: 'task1', text: 'Task 1', type: 'task', start_date: new Date('2025-01-01') },
        { id: 'milestone1', text: 'Milestone 1', type: 'milestone', start_date: new Date('2025-01-15') }
      ];

      ganttMock.getTaskByTime.mockReturnValue(tasks);
      ganttMock.getSelectedId.mockReturnValue('task1');
      ganttMock.getTask.mockReturnValue({ id: 'task1', start_date: new Date('2025-01-01') });

      navigateToNextMilestone();

      expect(ganttMock.selectTask).toHaveBeenCalledWith('milestone1');
      expect(ganttMock.showTask).toHaveBeenCalledWith('milestone1');
    });

    it('should call console.log for selectNextTask debugging', () => {
      const tasks = [
        { id: 'task1', text: 'Task 1' },
        { id: 'task2', text: 'Task 2' }
      ];

      ganttMock.getTaskByTime.mockReturnValue(tasks);
      ganttMock.getSelectedId.mockReturnValue('task1');

      selectNextTask();

      expect(consoleLogSpy).toHaveBeenCalledWith(
        '[selectNextTask] Called with currentId:',
        'task1',
        'tasks:',
        2
      );
    });
  });
});
