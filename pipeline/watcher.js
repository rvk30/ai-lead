const chokidar = require('chokidar');
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const INCOMING = '/home/ubuntu/incoming';
const PROCESSED = '/home/ubuntu/processed';
const FAILED = '/home/ubuntu/failed';

console.log(`Watching folder: ${INCOMING}`);
console.log('Waiting for new files...\n');

const watcher = chokidar.watch(INCOMING, {
    ignored: /(^|[\/\\])\../,
    persistent: true,
    awaitWriteFinish: {
        stabilityThreshold: 2000,
        pollInterval: 100
    }
});

watcher.on('add', async (filePath) => {
    const ext = path.extname(filePath).toLowerCase();
    const fileName = path.basename(filePath);

    if (!['.csv', '.xlsx', '.xls'].includes(ext)) return;

    console.log(`New file detected: ${fileName}`);

    try {
        // ingest.js chalaao
        execSync(`node /home/ubuntu/pipeline/ingest.js "${filePath}"`, {
            stdio: 'inherit'
        });

        // Success — processed folder mein move karo
        const dest = path.join(PROCESSED, fileName);
        fs.renameSync(filePath, dest);
        console.log(`Moved to processed: ${fileName}\n`);

    } catch (err) {
        // Fail — failed folder mein move karo
        const dest = path.join(FAILED, fileName);
        fs.renameSync(filePath, dest);
        console.log(`Failed! Moved to failed: ${fileName}\n`);
    }
});

watcher.on('error', (err) => {
    console.error('Watcher error:', err);
});
