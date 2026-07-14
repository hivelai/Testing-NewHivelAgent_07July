const PRIORITIES = ['low', 'medium', 'high'];

function computeTaskStats(tasks) {
  const total = tasks.length;
  const completed = tasks.filter((task) => task.completed).length;
  const pending = total - completed;

  const byPriority = PRIORITIES.reduce((acc, priority) => {
    acc[priority] = tasks.filter((task) => task.priority === priority).length;
    return acc;
  }, {});

  const completionRate = total === 0 ? 0 : Math.round((completed / total) * 100);

  return { total, completed, pending, completionRate, byPriority };
}

module.exports = { computeTaskStats, PRIORITIES };
