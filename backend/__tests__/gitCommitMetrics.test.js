const fs = require('fs');
const os = require('os');
const path = require('path');
const { execFileSync } = require('child_process');
const { listChangedFiles, computeCommitMetrics } = require('../services/gitCommitMetrics');

function git(repoPath, args) {
  return execFileSync('git', args, { cwd: repoPath, encoding: 'utf8' });
}

function initRepo() {
  const repoPath = fs.mkdtempSync(path.join(os.tmpdir(), 'gitcommitmetrics-'));
  git(repoPath, ['init', '-q']);
  git(repoPath, ['config', 'user.email', 'author@example.com']);
  git(repoPath, ['config', 'user.name', 'Author']);
  return repoPath;
}

describe('listChangedFiles', () => {
  it('assigns per-file additions/deletions correctly when a commit touches 2+ files', () => {
    const repoPath = initRepo();

    fs.writeFileSync(path.join(repoPath, 'a.txt'), 'a1\na2\na3\n');
    fs.writeFileSync(path.join(repoPath, 'b.txt'), 'b1\n');
    git(repoPath, ['add', '.']);
    git(repoPath, ['commit', '-q', '-m', 'initial']);
    const parentSha = git(repoPath, ['rev-parse', 'HEAD']).trim();

    // a.txt: +1/-1 line, b.txt: +3/-0 lines — distinct add/delete counts per file
    // so a misaligned parse would swap or corrupt these.
    fs.writeFileSync(path.join(repoPath, 'a.txt'), 'a1\na2-changed\na3\n');
    fs.writeFileSync(path.join(repoPath, 'b.txt'), 'b1\nb2\nb3\nb4\n');
    git(repoPath, ['add', '.']);
    git(repoPath, ['commit', '-q', '-m', 'second']);
    const commitSha = git(repoPath, ['rev-parse', 'HEAD']).trim();

    const entries = listChangedFiles(repoPath, parentSha, commitSha);
    const byPath = Object.fromEntries(entries.map((e) => [e.newPath, e]));

    expect(byPath['a.txt']).toMatchObject({ additions: 1, deletions: 1 });
    expect(byPath['b.txt']).toMatchObject({ additions: 3, deletions: 0 });

    fs.rmSync(repoPath, { recursive: true, force: true });
  });
});

describe('computeCommitMetrics', () => {
  it('sums linesAdded/linesRemoved across files touched in the same commit', async () => {
    const repoPath = initRepo();

    fs.writeFileSync(path.join(repoPath, 'a.txt'), 'a1\na2\na3\n');
    fs.writeFileSync(path.join(repoPath, 'b.txt'), 'b1\n');
    git(repoPath, ['add', '.']);
    git(repoPath, ['commit', '-q', '-m', 'initial']);

    fs.writeFileSync(path.join(repoPath, 'a.txt'), 'a1\na2-changed\na3\n');
    fs.writeFileSync(path.join(repoPath, 'b.txt'), 'b1\nb2\nb3\nb4\n');
    git(repoPath, ['add', '.']);
    git(repoPath, ['commit', '-q', '-m', 'second']);
    const commitSha = git(repoPath, ['rev-parse', 'HEAD']).trim();

    const metrics = await computeCommitMetrics(repoPath, commitSha);

    expect(metrics.linesAdded).toBe(4);
    expect(metrics.linesRemoved).toBe(1);

    fs.rmSync(repoPath, { recursive: true, force: true });
  });

  it('does not count a pure line shift as rework/assistance/newwork', async () => {
    const repoPath = initRepo();

    fs.writeFileSync(
      path.join(repoPath, 'f.txt'),
      'function one() { return 1; }\nfunction two() { return 2; }\nfunction three() { return 3; }\n'
    );
    git(repoPath, ['add', '.']);
    git(repoPath, ['commit', '-q', '-m', 'alice adds three functions']);

    // Reorder function three ahead of function two — nothing about either function's
    // content changed, so this should register as zero on every metric.
    fs.writeFileSync(
      path.join(repoPath, 'f.txt'),
      'function one() { return 1; }\nfunction three() { return 3; }\nfunction two() { return 2; }\n'
    );
    git(repoPath, ['add', '.']);
    git(repoPath, ['commit', '-q', '-m', 'shift function three up']);
    const commitSha = git(repoPath, ['rev-parse', 'HEAD']).trim();

    const metrics = await computeCommitMetrics(repoPath, commitSha);

    expect(metrics.newwork).toBe(0);
    expect(metrics.rework).toBe(0);
    expect(metrics.assistance).toBe(0);
    expect(metrics.maintenance).toBe(0);

    fs.rmSync(repoPath, { recursive: true, force: true });
  });
});
