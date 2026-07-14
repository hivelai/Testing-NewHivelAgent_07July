const { computeTaskStats } = require('../utils/taskStats');

describe('computeTaskStats', () => {
  it('returns zeroed stats for an empty task list', () => {
    expect(computeTaskStats([])).toEqual({
      total: 0,
      completed: 0,
      pending: 0,
      completionRate: 0,
      byPriority: { low: 0, medium: 0, high: 0 },
    });
  });

  it('counts completed and pending tasks', () => {
    const tasks = [
      { completed: true, priority: 'low' },
      { completed: false, priority: 'medium' },
      { completed: true, priority: 'high' },
    ];

    const stats = computeTaskStats(tasks);

    expect(stats.total).toBe(3);
    expect(stats.completed).toBe(2);
    expect(stats.pending).toBe(1);
  });

  it('breaks down tasks by priority', () => {
    const tasks = [
      { completed: false, priority: 'low' },
      { completed: false, priority: 'low' },
      { completed: false, priority: 'medium' },
      { completed: false, priority: 'high' },
    ];

    const stats = computeTaskStats(tasks);

    expect(stats.byPriority).toEqual({ low: 2, medium: 1, high: 1 });
  });

  it('rounds the completion rate to the nearest percent', () => {
    const tasks = [
      { completed: true, priority: 'medium' },
      { completed: false, priority: 'medium' },
      { completed: false, priority: 'medium' },
    ];

    expect(computeTaskStats(tasks).completionRate).toBe(33);
  });

  it('treats a full task list as 100% complete', () => {
    const tasks = [
      { completed: true, priority: 'low' },
      { completed: true, priority: 'high' },
    ];

    expect(computeTaskStats(tasks).completionRate).toBe(100);
  });
});
