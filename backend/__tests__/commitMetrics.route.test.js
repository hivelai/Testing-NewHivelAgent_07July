const express = require('express');
const request = require('supertest');

jest.mock('../models/CommitMetric');
const CommitMetric = require('../models/CommitMetric');
const commitMetricsRoutes = require('../routes/commitMetrics');

function buildApp() {
  const app = express();
  app.use(express.json());
  app.use('/api/commit-metrics', commitMetricsRoutes);
  return app;
}

afterEach(() => {
  jest.resetAllMocks();
});

describe('GET /api/commit-metrics', () => {
  it('lists all stored commit metrics sorted by commit date', async () => {
    const sortMock = jest.fn().mockResolvedValue([{ commitSha: 'abc123', newwork: 3 }]);
    CommitMetric.find.mockReturnValue({ sort: sortMock });

    const res = await request(buildApp()).get('/api/commit-metrics');

    expect(res.status).toBe(200);
    expect(CommitMetric.find).toHaveBeenCalledWith({});
    expect(sortMock).toHaveBeenCalledWith({ commitDate: 1 });
    expect(res.body).toEqual([{ commitSha: 'abc123', newwork: 3 }]);
  });

  it('filters by repo when provided', async () => {
    const sortMock = jest.fn().mockResolvedValue([]);
    CommitMetric.find.mockReturnValue({ sort: sortMock });

    await request(buildApp()).get('/api/commit-metrics').query({ repo: 'my-repo' });

    expect(CommitMetric.find).toHaveBeenCalledWith({ repo: 'my-repo' });
  });
});

describe('GET /api/commit-metrics/summary/by-author', () => {
  it('returns per-author totals for New Work / Rework / Assistance / Maintenance', async () => {
    const summaryRows = [
      { authorEmail: 'a@example.com', commits: 2, newwork: 10, rework: 3, assistance: 1, maintenance: 0, linesAdded: 12, linesRemoved: 4 },
    ];
    CommitMetric.aggregate.mockResolvedValue(summaryRows);

    const res = await request(buildApp()).get('/api/commit-metrics/summary/by-author');

    expect(res.status).toBe(200);
    expect(res.body).toEqual(summaryRows);
    expect(CommitMetric.aggregate).toHaveBeenCalled();
  });

  it('routes to the by-author summary instead of the :commitSha handler', async () => {
    CommitMetric.aggregate.mockResolvedValue([]);

    await request(buildApp()).get('/api/commit-metrics/summary/by-author');

    expect(CommitMetric.aggregate).toHaveBeenCalled();
    expect(CommitMetric.findOne).not.toHaveBeenCalled();
  });
});

describe('GET /api/commit-metrics/:commitSha', () => {
  it('returns a single stored metric', async () => {
    CommitMetric.findOne.mockResolvedValue({ commitSha: 'abc123', newwork: 3 });

    const res = await request(buildApp()).get('/api/commit-metrics/abc123');

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ commitSha: 'abc123', newwork: 3 });
  });

  it('returns 404 when the metric is not found', async () => {
    CommitMetric.findOne.mockResolvedValue(null);

    const res = await request(buildApp()).get('/api/commit-metrics/missing-sha');

    expect(res.status).toBe(404);
  });
});
