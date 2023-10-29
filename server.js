const express = require('express');
const axios = require('axios');
const cors = require('cors');
const fs = require('fs');

// Create an instance of the express application
const app = express();

// Enable Cross-Origin Resource Sharing (CORS)
app.use(cors());

// Define a route for getting job listings
app.get('/api/jobs', async (req, res) => {
    try {
        // Read the query parameters from the request URL
        const { what, where, what_exclude, results_per_page } = req.query;

        // Make a GET request to the Adzuna API to get job listings
        const result = await axios.get('https://api.adzuna.com/v1/api/jobs/us/search/1', {
            params: {
                app_id: 'dba38e95',
                app_key: 'ec37d1551a0543f500962f4deeeb9880',
                results_per_page: results_per_page || '20',
                what: what || 'software engineer',
                where: where || 'des moines ia',
                what_exclude: what_exclude || 'intern senior iii ii',
            }
        });

        // Read the existing job listings from the JSON file, if it exists
        let jobListings = [];
        if (fs.existsSync('jobListings.json')) {
            const data = fs.readFileSync('jobListings.json');
            jobListings = JSON.parse(data);
        }
        // compare the jobs in the JSON file with the jobs from the API
        // and remove any duplicates
        const jobIds = jobListings.map(job => job.id);
        const newJobs = result.data.results.filter(job => !jobIds.includes(job.id));

        // Calculate the number of days since each job was posted
        const currentDate = new Date();
        const updatedJobs = newJobs.map(job => {
            const createdDate = new Date(job.created);
            const daysSincePosted = Math.floor((currentDate - createdDate) / (1000 * 60 * 60 * 24));
            return { ...job, daysSincePosted };
        });

        //  add a status property to each job
        const jobsWithStatus = updatedJobs.map(job => {
            const status = jobListings.find(listing => listing.id === job.id)?.status || 'none';
            return { ...job, status };
        });


        // Add the new jobs to the existing job listings
        jobListings = [...jobListings, ...updatedJobs];

        // Write the updated job listings to the JSON file
        fs.writeFileSync('jobListings.json', JSON.stringify(jobListings));

        // Send the job listings as a JSON response
        res.json(jobListings);
    } catch (error) {
        // If there's an error, send a 500 Internal Server Error response
        res.sendStatus(500);
    }
});

// Start the server and listen for incoming requests
app.listen(process.env.PORT || 5001);