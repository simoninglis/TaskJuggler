const { test, expect } = require('@playwright/test');

test.describe('Milestone Features', () => {
  test.beforeEach(async ({ page }) => {
    // Start the web server and navigate to the app
    await page.goto('http://localhost:8080');
    
    // Wait for the Gantt chart to load
    await page.waitForSelector('#gantt_here', { state: 'visible' });
    await page.waitForTimeout(1000); // Give time for data to load
  });

  test('milestones should be visible in the Gantt chart', async ({ page }) => {
    // Check if milestone tasks exist in the DOM
    const milestoneElements = await page.locator('.gantt_task_line.gantt_milestone').count();
    console.log(`Found ${milestoneElements} milestone elements`);
    
    // We should have 3 milestones
    expect(milestoneElements).toBe(3);
    
    // Check if milestone labels are visible
    const milestoneLabels = await page.locator('.gantt_task_content').allTextContents();
    console.log('Task labels found:', milestoneLabels);
    
    // Check for our specific milestone names
    const labelText = milestoneLabels.join(' ');
    expect(labelText).toContain('Design Phase Complete');
    expect(labelText).toContain('Beta Release');
    expect(labelText).toContain('Go-Live');
  });

  test('milestone navigation with ]m and [m', async ({ page }) => {
    // Focus on the Gantt chart
    await page.click('#gantt_here');
    
    // Get initial status
    const initialStatus = await page.locator('#status').textContent();
    console.log('Initial status:', initialStatus);
    
    // Press ]m to go to next milestone
    await page.keyboard.press(']');
    await page.keyboard.press('m');
    await page.waitForTimeout(500);
    
    // Check if status updated
    const statusAfterNext = await page.locator('#status').textContent();
    console.log('Status after ]m:', statusAfterNext);
    expect(statusAfterNext).toContain('milestone');
    
    // Press [m to go to previous milestone
    await page.keyboard.press('[');
    await page.keyboard.press('m');
    await page.waitForTimeout(500);
    
    // Check if status updated again
    const statusAfterPrev = await page.locator('#status').textContent();
    console.log('Status after [m:', statusAfterPrev);
    expect(statusAfterPrev).toContain('milestone');
  });

  test('milestone data is properly loaded', async ({ page }) => {
    // Check the console for any errors
    const consoleLogs = [];
    page.on('console', msg => {
      consoleLogs.push({ type: msg.type(), text: msg.text() });
    });
    
    // Reload to capture all console messages
    await page.reload();
    await page.waitForTimeout(2000);
    
    // Look for data loading messages
    const dataLogs = consoleLogs.filter(log => 
      log.text.includes('data') || 
      log.text.includes('milestone') ||
      log.text.includes('task')
    );
    
    console.log('Data-related console logs:', dataLogs);
    
    // Check if gantt object has milestone tasks
    const milestoneCount = await page.evaluate(() => {
      if (typeof gantt === 'undefined') return -1;
      
      const tasks = gantt.getTaskByTime();
      const milestones = tasks.filter(task => task.type === gantt.config.types.milestone);
      
      console.log('All tasks:', tasks.length);
      console.log('Milestone tasks:', milestones);
      
      return milestones.length;
    });
    
    console.log('Milestone count from gantt object:', milestoneCount);
    expect(milestoneCount).toBe(3);
  });

  test('milestone type configuration', async ({ page }) => {
    // Check if milestone type is properly configured
    const typeConfig = await page.evaluate(() => {
      if (typeof gantt === 'undefined') return null;
      
      return {
        types: gantt.config.types,
        hasMilestoneType: gantt.config.types.hasOwnProperty('milestone'),
        milestoneValue: gantt.config.types.milestone
      };
    });
    
    console.log('Type configuration:', typeConfig);
    expect(typeConfig).not.toBeNull();
    expect(typeConfig.hasMilestoneType).toBe(true);
  });

  test('debug task data structure', async ({ page }) => {
    // Get detailed information about tasks
    const taskInfo = await page.evaluate(() => {
      if (typeof gantt === 'undefined') return null;
      
      const tasks = gantt.getTaskByTime();
      return tasks.map(task => ({
        id: task.id,
        text: task.text,
        type: task.type,
        start_date: task.start_date,
        duration: task.duration
      }));
    });
    
    console.log('All tasks in gantt:');
    taskInfo?.forEach(task => {
      console.log(`- ${task.id}: ${task.text} (type: ${task.type}, duration: ${task.duration})`);
    });
  });
});