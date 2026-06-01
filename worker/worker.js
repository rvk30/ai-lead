const { Worker } = require('bullmq');

const connection = {
    host: 'localhost',
    port: 6379
};

const worker = new Worker('lead-jobs', async (job) => {
    
    console.log(`Job mili: ${job.name} - ID: ${job.id}`);

    if (job.name === 'csv-import') {
        console.log('CSV import job process ho rahi hai...');
    }

    if (job.name === 'indiamart-fetch') {
        console.log('IndiaMART fetch job process ho rahi hai...');
    }

    if (job.name === 'google-places-fetch') {
        console.log('Google Places fetch job process ho rahi hai...');
    }

    console.log(`Job complete: ${job.name}`);

}, { connection });

worker.on('completed', (job) => {
    console.log(`✅ Job ${job.id} complete!`);
});

worker.on('failed', (job, err) => {
    console.log(`❌ Job ${job.id} fail hui: ${err.message}`);
});

console.log('Worker chal raha hai — jobs ka wait kar raha hai...');
