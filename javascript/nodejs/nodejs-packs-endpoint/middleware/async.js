// async funtion does not need a name as the calling 
module.exports = function (handler) {
    // return here to get access to req, res & next objects
    return async (req, res, next) => {
    try {
        await handler(req, res);
    }
    catch(ex) {
        next(ex);
    }
  };
};