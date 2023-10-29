const fs = require('fs');

// saves new job listings to the JSON file
function writeJobListings(jobListings) {
    fs.writeFileSync('jobListings.json', JSON.stringify(jobListings));
}

module.exports = { writeJobListings };