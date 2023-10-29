const express = require('express');
const cors = require('cors');
const { fetchJobListings } = require('./adzuna');
const { compareJobListings } = require('./jobComparer');
const { writeJobListings } = require('./jobWriter');
const { daysSince } = require('./dateUtils');

const app = express();

// needed to run locally
app.use(cors());

// route for getting jobs
app.get('/api/jobs', async (req, res) => {
    try {
        // Read the query parameters from the request URL
        const { what, where, what_exclude, results_per_page } = req.query;

        // Fetch job listings from the Adzuna API
        const newJobs = await fetchJobListings(what, where, what_exclude, results_per_page);

        // Compare the job listings from the API with the existing job listings in the JSON file
        const { jobListings, uniqueJobs } = compareJobListings(newJobs);

        // Add the number of days since each job was posted and a status property to each job
        const updatedJobs = uniqueJobs.map(job => {
            const daysSincePosted = daysSince(job.created);
            const status = jobListings.find(listing => listing.id === job.id)?.status || 'none';
            return { ...job, daysSincePosted, status };
        });

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

// Start the server and listen for incoming requests
app.listen(process.env.PORT || 5001);