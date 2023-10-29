const axios = require('axios');

//  fetch job listings from the Adzuna API
async function fetchJobListings(what, where, what_exclude, results_per_page) {
    const result = await axios.get('https://api.adzuna.com/v1/api/jobs/us/search/1', {
        params: {
            app_id: 'dba38e95',
            app_key: 'ec37d1551a0543f500962f4deeeb9880',
            results_per_page: results_per_page || '50',
            what: what || 'software engineer',
            where: where || 'des moines ia',
            what_exclude: what_exclude || 'intern senior iii ii',
        }
    });
    return result.data.results;
}

module.exports = { fetchJobListings };