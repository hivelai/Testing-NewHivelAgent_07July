import { useEffect, useState } from 'react';
import { getCommitMetrics, getCommitMetricsSummary } from './api';
import './Metrics.css';

function Metrics() {
  const [summary, setSummary] = useState([]);
  const [commits, setCommits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadMetrics = async () => {
    try {
      setLoading(true);
      const [summaryRes, commitsRes] = await Promise.all([getCommitMetricsSummary(), getCommitMetrics()]);
      setSummary(summaryRes.data);
      setCommits(commitsRes.data);
      setError('');
    } catch (err) {
      setError('Could not load commit metrics. Is the backend running?');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMetrics();
  }, []);

  return (
    <div className="metrics">
      <h2>Code Metrics</h2>

      {error && <p className="error">{error}</p>}
      {loading ? (
        <p>Loading metrics...</p>
      ) : (
        <>
          <div className="metrics-section">
            <h3>By developer</h3>
            {summary.length === 0 ? (
              <p>No commit metrics recorded yet.</p>
            ) : (
              <table className="metrics-table">
                <thead>
                  <tr>
                    <th>Developer</th>
                    <th>Commits</th>
                    <th>New Work</th>
                    <th>Rework</th>
                    <th>Assistance</th>
                    <th>Maintenance</th>
                  </tr>
                </thead>
                <tbody>
                  {summary.map((row) => (
                    <tr key={row.authorEmail}>
                      <td>{row.authorEmail}</td>
                      <td>{row.commits}</td>
                      <td>{row.newwork}</td>
                      <td>{row.rework}</td>
                      <td>{row.assistance}</td>
                      <td>{row.maintenance}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          <div className="metrics-section">
            <h3>By commit</h3>
            {commits.length === 0 ? (
              <p>No commits analyzed yet.</p>
            ) : (
              <table className="metrics-table">
                <thead>
                  <tr>
                    <th>Commit</th>
                    <th>Author</th>
                    <th>New Work</th>
                    <th>Rework</th>
                    <th>Assistance</th>
                    <th>Maintenance</th>
                  </tr>
                </thead>
                <tbody>
                  {commits.map((commit) => (
                    <tr key={commit._id}>
                      <td>{commit.commitSha.slice(0, 7)}</td>
                      <td>{commit.authorEmail}</td>
                      <td>{commit.newwork}</td>
                      <td>{commit.rework}</td>
                      <td>{commit.assistance}</td>
                      <td>{commit.maintenance}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </>
      )}
    </div>
  );
}

export default Metrics;
