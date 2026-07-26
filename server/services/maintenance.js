const fs = require('fs');
const path = require('path');

const db = require('../db/database');

function resolveDbPath() {
  return process.env.DB_PATH || path.join(__dirname, '..', 'db', 'swoop.db');
}

function ensureBackupDir(dbPath) {
  const dir = path.join(path.dirname(dbPath), 'backups');
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  return dir;
}

function timestampLabel(now = new Date()) {
  const p = (n) => String(n).padStart(2, '0');
  return `${now.getUTCFullYear()}${p(now.getUTCMonth() + 1)}${p(now.getUTCDate())}-${p(now.getUTCHours())}${p(now.getUTCMinutes())}${p(now.getUTCSeconds())}`;
}

function backupDatabase(reason = 'manual') {
  try {
    const dbPath = resolveDbPath();
    if (!fs.existsSync(dbPath)) {
      console.warn(`Backup skipped (${reason}): DB file not found at ${dbPath}`);
      return { ok: false, skipped: true, reason: 'db-not-found' };
    }

    const backupDir = ensureBackupDir(dbPath);
    const fileName = `swoop-${timestampLabel()}-${reason}.db`;
    const backupPath = path.join(backupDir, fileName);

    fs.copyFileSync(dbPath, backupPath);
    rotateBackups(backupDir, 21);

    console.log(`Backup created (${reason}): ${backupPath}`);
    return { ok: true, path: backupPath };
  } catch (err) {
    console.error(`Backup failed (${reason}): ${err.message}`);
    return { ok: false, error: err.message };
  }
}

function rotateBackups(backupDir, keepCount = 21) {
  const files = fs.readdirSync(backupDir)
    .filter((name) => name.startsWith('swoop-') && name.endsWith('.db'))
    .map((name) => ({ name, fullPath: path.join(backupDir, name), mtime: fs.statSync(path.join(backupDir, name)).mtimeMs }))
    .sort((a, b) => b.mtime - a.mtime);

  for (const stale of files.slice(keepCount)) {
    fs.unlinkSync(stale.fullPath);
  }
}

function cleanOrphanedRows() {
  const deletedFollowUps = db.prepare('DELETE FROM follow_ups WHERE lead_id NOT IN (SELECT id FROM leads)').run().changes;
  const deletedMessages = db.prepare('DELETE FROM messages WHERE lead_id NOT IN (SELECT id FROM leads)').run().changes;

  if (deletedFollowUps || deletedMessages) {
    console.log(`Maintenance cleanup: removed ${deletedFollowUps} orphan follow-up(s), ${deletedMessages} orphan message row(s).`);
  }

  return { deletedFollowUps, deletedMessages };
}

module.exports = {
  backupDatabase,
  cleanOrphanedRows,
};