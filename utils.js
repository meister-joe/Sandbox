exports.createError = function(res, errorCode, message) {
    res.statusCode = errorCode;
    res.setHeader('Content-Type', 'application/ld+json');
    res.json({
        '@context': {
            '@vocab': "https://tcfplayground.org"
        },
        '@type': "Error",
        title: message,
        details: [{
            code: errorCode,
            message: message
        }]
    });
    return res;
};