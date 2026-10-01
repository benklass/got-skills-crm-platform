// POST /api/returns {customerId, movieId}

// Return 401 if client is not logged in 
// Return 400 if customerId is not provided
// Return 400 if movieId is not provided
// Return 404 if not rental found for customer/movie
// Return 400 if rental already processed
// Set the return date
// Calculate the rental fee (numberOfDays * movie.dailyRentalRate)
// Increase the stock
// Return the rental in the body
