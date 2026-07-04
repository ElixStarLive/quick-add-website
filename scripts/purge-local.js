/** Wipe all listings from local quickpost.db */
const path = require('path');
const fs = require('fs');
const sqlite3 = require('sqlite3').verbose();

const dbPath = path.join(__dirname, '..', 'quickpost.db');
const uploadsDir = path.join(__dirname, '..', 'uploads');
const db = new sqlite3.Database(dbPath);

db.serialize(() => {
  db.run('DELETE FROM payments');
  db.run('DELETE FROM jobs');
  db.run('DELETE FROM ads');
  db.run('DELETE FROM contact_messages');
  db.run("DELETE FROM users WHERE email LIKE '%@example.com' OR email = 'test@test.com'", () => {
    try {
      for (const name of fs.readdirSync(uploadsDir)) {
        if (name === '.gitkeep') continue;
        fs.rmSync(path.join(uploadsDir, name), { recursive: true, force: true });
      }
    } catch (e) {}
    console.log('Local database and uploads cleaned.');
    db.close();
  });
});
