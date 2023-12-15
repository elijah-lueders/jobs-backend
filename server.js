const express = require('express');
const cors = require('cors');
const fs = require('fs');
const axios = require('axios');
const cheerio = require('cheerio');
const { log } = require('console');

const app = express();

// needed to run locally
app.use(cors());

function extractDescription(html) {
    const $ = cheerio.load(html);
    const scriptContent = $('script[type="application/ld+json"]').html();
    const jobData = JSON.parse(scriptContent);
    const description = jobData.description;
    return description;
}

async function fetchFullDescription(jobId) {
    const url = `https://www.adzuna.com/details/${jobId}`;
    const response = await axios.get(url);
    const fullDescription = extractDescription(response.data);
    return fullDescription;
}
function daysSince(date) {
    const currentDate = new Date();
    const createdDate = new Date(date);
    return Math.floor((currentDate - createdDate) / (1000 * 60 * 60 * 24));
}

async function fetchJobListings(what, where, what_exclude, results_per_page) {
    const result = await axios.get('https://api.adzuna.com/v1/api/jobs/us/search/1', {
        params: {
            app_id: 'dba38e95',
            app_key: 'ec37d1551a0543f500962f4deeeb9880',
            results_per_page: results_per_page || '10',
            what: what || 'software engineer',
            where: where || 'des moines ia',
            what_exclude: what_exclude || 'lead pricipal intern sr senior iii ii fbi',
            salary_include_unknown: '1',

        }
    });
    return result.data.results;
}

function writeJobListings(jobListings) {
    fs.writeFileSync('jobListings.json', JSON.stringify(jobListings));
}

//  compare the job listings from adzuna with the existing job listings 
function compareJobListings(newJobs) {
    let jobListings = [];
    if (fs.existsSync('jobListings.json')) {
        const data = fs.readFileSync('jobListings.json');
        jobListings = JSON.parse(data);
    }
    const jobIds = jobListings.map(job => job.id);
    const uniqueJobs = newJobs.filter(job => !jobIds.includes(job.id));
    return { jobListings, uniqueJobs };
}

// route for getting jobs
app.get('/api/refreshJobs', async (req, res) => {
    try {
        // Read the query parameters from the request URL
        const { what, where, what_exclude, results_per_page } = req.query;

        // Fetch job listings from the Adzuna API
        const newJobs = await fetchJobListings(what, where, what_exclude, results_per_page);

        // Compare the job listings from the API with the existing job listings in the JSON file
        const { jobListings, uniqueJobs } = compareJobListings(newJobs);

        // Add the number of days since each job was posted and a status property to each job
        const updatedJobs = await Promise.all(uniqueJobs.map(async job => {
            const daysSincePosted = daysSince(job.created);
            const status = jobListings.find(listing => listing.id === job.id)?.status || 'none';
            const fullDescription = await fetchFullDescription(job.id) || 'error getting description';
            return { ...job, daysSincePosted, status, fullDescription };
        }));

        // Add the new jobs to the existing job listings
        const allJobs = [...jobListings, ...updatedJobs];

        // Write the updated job listings to the JSON file
        writeJobListings(allJobs);

        // Send the job listings as a JSON response
        res.json(allJobs);
    } catch (error) {
        // If there's an error, send a 500 Internal Server Error response
        res.sendStatus(500);
    }
});

// Endpoint to load existing jobs from the local file
app.get('/api/jobs', (req, res) => {
    try {
        if (fs.existsSync('jobListings.json')) {
            const data = fs.readFileSync('jobListings.json');
            const jobListings = JSON.parse(data);
            res.json(jobListings);
        } else {
            res.json([]);
        }
    } catch (error) {
        res.sendStatus(500);
    }
});


// Start the server and listen for incoming requests
app.listen(process.env.PORT || 5001);
// log a message when the server starts
console.log(`Server listening at http://localhost:${process.env.PORT || 5001}`);