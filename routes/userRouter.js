var express = require('express');
const bodyParser = require('body-parser');
var passport = require('passport');
var auth = require('../authenticate');
var utils = require('../utils');
const cors = require('./cors');

var User = require('../models/user');
var Company = require('../models/company');

var router = express.Router({ mergeParams: true });
router.use(bodyParser.json());

/**
 * @swagger
 * /companies/{defaultCompanyId}/users/whoisi:
 *   get:
 *     tags:
 *       - Companies / Users
 *     name: Get username and companyId of the authenticated user
 *     summary: Get username and companyId of the authenticated user
 *     description: Protected endpoint. When you try out this API Swagger will automatically attach the Authentication header using the Bearer token you provided in the Authorize dialog.
 *     security:
 *       - bearerAuth: []
 *     consumes:
 *       - application/json
 *     produces:
 *       - application/json
*     parameters:
 *       - in: path
 *         name: defaultCompanyId
 *         description: Defaults to 'whoisi'
 *         type: string
 *         default: 'whoisi'
 *     responses:
 *       '200':
 *         description: Username and companyId of the logged in user 
 *       '401':
 *         description: Not authenticated
 *       '500':
 *         description: Internal Server Error
 */
router.options('*', cors.cors, (req, res) => { res.sendStatus(200); })
router.get('/whoisi', auth.user, cors.cors, function (req, res) {
  res.statusCode = 200;
  res.setHeader('Content-Type', 'application/json');
  res.json({ username: req.user.username, companyId: req.user.companyId });
});

/**
 * @swagger
 * /companies/{companyId}/users:
 *   get:
 *     tags:
 *       - Companies / Users
 *     name: Get users
 *     summary: Return all registered users for a given company
 *     description: Return all registered users for a given company. Only admin logged in users can perform this request. Protected endpoint. When you try out this API Swagger will automatically attach the Authentication header using the Bearer token you provided in the Authorize dialog.
 *     security:
 *       - bearerAuth: []
 *     consumes:
 *       - application/json
 *     produces:
 *       - application/json
*     parameters:
 *       - in: path
 *         name: companyId
 *         description: Company Id of which the user takes part of
 *         type: string
 *         required: true
 *     responses:
 *       '200':
 *         description: Users of the given companyId
 *       '401':
 *         description: Not authenticated
 *       '500':
 *         description: Internal Server Error
 */
router.options('*', cors.cors, (req, res) => { res.sendStatus(200); })
router.get('/', cors.cors, auth.user, auth.admin, auth.company, function (req, res, next) {
  User.find({})
    .then((users) => {
      res.statusCode = 200;
      res.setHeader('Content-Type', 'application/json');
      res.json(users);
    }, (err) => next(err))
    .catch((err) => next(err));
});

/**
 * @swagger
 * /companies/{companyId}/users:
 *   post:
 *     tags:
 *       - Companies / Users
 *     name: Register
 *     summary: Creates a new user
 *     consumes:
 *       - application/json
 *     produces:
 *       - application/json
 *     parameters:
 *       - in: path
 *         name: companyId
 *         description: Company Id of which the user takes part of
 *         type: string
 *         required: true
 *       - name: body
 *         in: body
 *         schema:
 *           type: object
 *           properties:
 *             username:
 *               type: string
 *             password:
 *               type: string
 *               format: password
 *             firstName:
 *               type: string
 *             lastName:
 *               type: string
 *             email:
 *               type: string
 *             admin:
 *               type: boolean
 *               default: false
 *             companyPin:
 *               type: string
 *         required:
 *           - username
 *           - password
 *           - firstName
 *           - lastName
 *           - email
 *           - companyPin
 *     responses:
 *       '201':
 *         description: Registration succesful
 *       '403':
 *         description: Wrong PIN code. You can't register for this company
 *       '500':
 *         description: Internal Server Error
 */
router.post('/', cors.cors, (req, res, next) => {
  //check if this user has a company PIN and if so that it is valid for this company
  Company.findOne({ companyId: req.params.companyId })
    .then((company) => {
      if (company.companyPin === req.body.companyPin) {
        // PIN ok. Now register user
        User.register(new User({ username: req.body.username }),
          req.body.password, (err, user) => {
            if (err) {
              utils.createError(res, 500, err);
            }
            else {
              if (req.body.firstName)
                user.firstName = req.body.firstName;
              if (req.body.lastName)
                user.lastName = req.body.lastName;
              if (req.body.email)
                user.email = req.body.email;
              if (req.params.companyId)
                user.companyId = req.params.companyId;
              user.save((err, user) => {
                if (err) {
                  utils.createError(res, 500, err);
                  return;
                }
                passport.authenticate('local')(req, res, () => {
                  res.statusCode = 201;
                  res.setHeader('Content-Type', 'application/json');
                  res.json({ message: 'Registration Successful!' });
                });
              });
            }
          }
        );
      } else { 
        // PIN not ok
        utils.createError(res, 403, 'PIN code wrong. You cannot register for this company');
      }
    }, (err) => next(err))
    .catch((err) => next(err));
});

/**
 * @swagger
 * /companies/{companyId}/users/login:
 *   post:
 *     tags:
 *       - Companies / Users
 *     name: Login
 *     summary: Login a user
 *     description: When login a user, the server send back a JWT token which is valid for 72 hours.
 *     consumes:
 *       - application/json
 *     produces:
 *       - application/json
 *     parameters:
 *       - in: path
 *         name: companyId
 *         type: string
 *         required: true
 *       - name: body
 *         in: body
 *         schema:
 *           type: object
 *           properties:
 *             username:
 *               type: string
 *             password:
 *               type: string
 *               format: password
 *         required:
 *           - username
 *           - password
 *     responses:
 *       '200':
 *         description: Login succesful
 *       '401':
 *         description: Login Unsuccessful
 *       '500':
 *         description: Internal Server Error
 */
router.post('/login', cors.cors, (req, res, next) => {
  passport.authenticate('local', (err, user) => {
    if (err)
      return next(err);

    if (!user) {
      utils.createError(res, 401, 'Login Unsuccessful!');
    }
    req.logIn(user, (err) => {
      if (err) {
        utils.createError(res, 401, 'Login Unsuccessful!');
      }

      var token = auth.getToken({ _id: req.user._id });
      res.statusCode = 200;
      res.setHeader('Content-Type', 'application/json');
      res.json({ token: token });
    });
  })(req, res, next);
});

module.exports = router;