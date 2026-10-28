# Database Backups & Recovery Guide

## Local Backup Policy
To protect your business records against accidental data loss, local backups are scheduled and kept in this directory:
`c:\Users\Nii Bortey\Desktop\Miss Roses Exquisite\backups\`

## Creating a Backup
1. **SQLite Database Backup:**
   Copy `database/miss_roses_exquisite.sqlite` into this folder with a timestamp:
   ```powershell
   Copy-Item "..\database\miss_roses_exquisite.sqlite" -Destination ".\backup_$(Get-Date -Format 'yyyyMMdd_HHmmss').sqlite"
   ```

2. **Automated Export:**
   The admin portal includes an "Export Database Backup" button that generates a verified `.sqlite` or `.sql` dump into this directory.

## Restoring from a Backup
1. Stop the local website server.
2. Rename or archive the current database file in `database/`.
3. Copy the desired backup file back to `database/miss_roses_exquisite.sqlite`.
4. Restart the website.
