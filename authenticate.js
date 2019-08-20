var passport = require('passport');
var LocalStrategy = require('passport-local').Strategy;
var JwtStrategy = require('passport-jwt').Strategy;
var ExtractJwt = require('passport-jwt').ExtractJwt;
var jwt = require('jsonwebtoken'); // used to create, sign, and verify tokens

var Company = require('./models/company');
var User = require('./models/user');

var config = require('./config.js');

exports.local = passport.use(new LocalStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

// JWT is valid for 72 hours
exports.getToken = function (user) {
    return jwt.sign(user, config.secretKey,
        { expiresIn: 259200 });
};

var opts = {};
opts.jwtFromRequest = ExtractJwt.fromAuthHeaderAsBearerToken();
opts.secretOrKey = config.secretKey;

exports.jwtPassport = passport.use(new JwtStrategy(opts,
    (jwt_payload, done) => {
        User.findOne({ _id: jwt_payload._id }, (err, user) => {
            if (err) {
                return done(err, false);
            }
            else if (user) {
                return done(null, user);
            }
            else {
                return done(null, false);
            }
        });
    }));

exports.user = passport.authenticate('jwt', { session: false });

exports.company = (req, res, next) => {
    Company.findOne({ companyId: req.user.companyId })
        .then((company) => {
            if (company) {
                if (company.active) {
                    res.company = company;
                    next();
                } else {
                    res.statusCode = 403;
                    res.setHeader('Content-Type', 'application/json');
                    res.json({message: 'This company is currently inactive on this server'});
                    return;
                }
            } else {
                res.statusCode = 403;
                res.setHeader('Content-Type', 'application/json');
                res.json({message: 'This company does not exist on this server'});
                return;
            }
        })
}

exports.admin = (req, res, next) => {
    if (req.user.admin) {
        next();
    } else {
        res.statusCode = 401;
        res.setHeader('Content-Type', 'application/json');
        res.json({message: 'Only admin users can perform this action'});
        return;
    }
};