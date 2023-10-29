// Define a function for calculating the number of days since a date
function daysSince(date) {
    const currentDate = new Date();
    const createdDate = new Date(date);
    return Math.floor((currentDate - createdDate) / (1000 * 60 * 60 * 24));
}

module.exports = { daysSince };