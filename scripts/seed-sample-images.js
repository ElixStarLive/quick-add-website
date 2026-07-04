const fs = require('fs');
const path = require('path');
const https = require('https');

const dir = path.join(__dirname, '..', 'uploads', 'samples');
fs.mkdirSync(dir, { recursive: true });

const items = [
  ['car-battery.jpg', 101],
  ['sofa.jpg', 102],
  ['tv.jpg', 103],
  ['iphone.jpg', 104],
  ['washing-machine.jpg', 105],
  ['drill.jpg', 106],
  ['lawn-mower.jpg', 107],
  ['bike.jpg', 108]
];

function download(name, seed) {
  return new Promise((resolve, reject) => {
    const file = path.join(dir, name);
    if (fs.existsSync(file)) {
      resolve(name + ' (exists)');
      return;
    }
    const url = 'https://picsum.photos/seed/quickpost' + seed + '/400/300.jpg';
    const fetch = (targetUrl) => {
      https.get(targetUrl, { headers: { 'User-Agent': 'node' } }, (res) => {
        if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
          fetch(res.headers.location);
          return;
        }
        const writer = fs.createWriteStream(file);
        res.pipe(writer);
        writer.on('finish', () => resolve(name));
        writer.on('error', reject);
      }).on('error', reject);
    };
    fetch(url);
  });
}

Promise.all(items.map(([name, seed]) => download(name, seed)))
  .then((results) => {
    console.log('Sample images ready:', results.join(', '));
  })
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
