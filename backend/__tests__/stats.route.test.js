const express = require('express');
const request = require('supertest');

jest.mock('../models/Task');
const Task = require('../models/Task');
const statsRoutes = require('../routes/stats');

function buildApp() {
  const app = express();
  app.use(express.json());
  app.use('/api/stats', statsRoutes);
  return app;
}

describe('GET /api/stats', () => {
  afterEach(() => {
    jest.resetAllMocks();
  });

  it('returns computed stats for the tasks in the database', async () => {
    Task.find.mockResolvedValue([
      { completed: true, priority: 'high' },
      { completed: false, priority: 'low' },
    ]);

    const res = await request(buildApp()).get('/api/stats');

    expect(res.status).toBe(200);
    expect(res.body).toEqual({
      total: 2,
      completed: 1,
      pending: 1,
      completionRate: 50,
      byPriority: { low: 1, medium: 0, high: 1 },
    });
  });

  it('returns zeroed stats when there are no tasks', async () => {
    Task.find.mockResolvedValue([]);

    const res = await request(buildApp()).get('/api/stats');

    expect(res.status).toBe(200);
    expect(res.body.total).toBe(0);
    expect(res.body.completionRate).toBe(0);
  });
});
