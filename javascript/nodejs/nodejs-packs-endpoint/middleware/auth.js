const jwt = require('jsonwebtoken');
const config = require('config');

// Auth model recieves request, response and next function
module.exports = function (req, res, next) {
    
    const token = req.header('x-auth-token');
    if (!token) return res.status(401).send('mw-auth:Access denied. No token provided.'); // user return to exit from the function

    try {
        const decoded = jwt.verify(token, config.get('jwtPrivateKey'));
        req.user = decoded;
        next(); // Pass control to the next middelware function
     }
    catch (ex) {
        res.status(400).send('mw-auth:Invalid token provided.');
    }
}

