/**
 * Miss Roses Exquisite — Automated Database Backup Utility
 * Exports timestamped database backups to the dedicated /backups folder.
 */

const fs = require('fs');
const path = require('path');

const BACKUPS_DIR = path.resolve(__dirname, '../backups');
const DB_FILE = path.resolve(__dirname, '../database/miss_roses_exquisite.json');

function createBackup() {
  if (!fs.existsSync(BACKUPS_DIR)) {
    fs.mkdirSync(BACKUPS_DIR, { recursive: true });
  }

  if (!fs.existsSync(DB_FILE)) {
    console.error('❌ Database file not found to backup:', DB_FILE);
    return null;
  }

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupFileName = `backup_miss_roses_${timestamp}.json`;
  const destination = path.join(BACKUPS_DIR, backupFileName);

  fs.copyFileSync(DB_FILE, destination);
  console.log(`✅ Verified database backup created at: ${destination}`);
  return destination;
}

if (require.main === module) {
  createBackup();
}

module.exports = { createBackup };
