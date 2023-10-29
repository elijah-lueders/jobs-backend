const fs = require('fs');

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

module.exports = { compareJobListings };