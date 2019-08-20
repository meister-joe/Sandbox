const express = require('express');
const bodyParser = require('body-parser');
var auth = require('../authenticate');
var config = require('../config');
var utils = require('../utils');
const cors = require('./cors');

const companyRouter = express.Router();
var userRouter = require('./userRouter');
var loRouter = require('./loRouter');

companyRouter.use(bodyParser.json());
companyRouter.use('/:companyId/users', userRouter);
companyRouter.use('/:companyId/los', loRouter);

const Company = require('../models/company');

/**
 * @swagger
 * /companies:
 *   get:
 *     tags:
 *       - Companies
 *     name: Find companies
 *     summary: Return all registered companies
 *     description: Return all registered companies. Protected endpoint. When you try out this API Swagger will automatically attach the Authentication header using the Bearer token you provided in the Authorize dialog.
 *     consumes:
 *       - application/json
 *     produces:
 *       - application/json
*     parameters:
 *       - in: header
 *         name: serverSecret
 *         description: Server specific key from the server's configuration file.
 *         type: string
 *         required: true
 *     responses:
 *       '200':
 *         description: List of registered companies (companyName, companyId, endpoint)
 *       '403':
 *         description: Forbidden to access this resource
 *       '500':
 *         description: Internal Server Error
 */
companyRouter.route('/')
  .options(cors.cors, (req, res) => { res.sendStatus(200); })
  .get(cors.cors, (req, res, next) => {
    if (req.headers.serversecret === config.serverOwnSecret) {
      Company.find({})
        .then((companies) => {
          res.statusCode = 200;
          res.setHeader('Content-Type', 'application/json');
          var i = companies.length;
          var out = [];
          while (i--) {
            out[i] = {
              "companyName": companies[i].companyName,
              "companyId": companies[i].companyId,
              "endpoint": companies[i].serverInformationEndpoint
            }
          }
          res.json(out);
        }, (err) => next(err))
        .catch((err) => next(err));

    } else {
      utils.createError(res, 403, 'Forbidden to retrieve registered companies on this server');
    }
  });

/**
 * @swagger
 * /companies/{companyId}:
 *   get:
 *     tags:
 *       - Companies
 *     name: Find company
 *     summary: Find a company
 *     description: Find a company by companyId. Protected endpoint. When you try out this API Swagger will automatically attach the Authentication header using the Bearer token you provided in the Authorize dialog.
 *     security:
 *       - bearerAuth: [] 
 *     consumes:
 *       - application/json
 *     produces:
 *       - application/json
 *     parameters:
 *       - in: path
 *         name: companyId
 *         description: Id of the company
 *         type: string
 *         required: true
 *     responses:
 *       '200':
 *         description: A single company object
 *       '401':
 *         description: Access denied
 *       '403':
 *         description: This company is not the one under which the logged in user is subscribed
 *       '400':
 *         description: Bad request
 *       '500':
 *         description: Internal Server Error
 */
companyRouter.route('/:company')
  .options(cors.cors, auth.user, auth.company, (req, res) => { res.sendStatus(200); })
  .get(cors.cors, auth.user, (req, res, next) => {
    Company.findOne({ companyId: req.params.company })
      .then((company) => {
        if (company.companyId === req.user.companyId) {
          res.statusCode = 200;
          res.setHeader('Content-Type', 'application/json');
          res.json({
            companyName: company.companyName,
            contactName: company.contactName,
            contactEmail: company.contactEmail,
            companyType: company.companyType,
            serverInformationEndpoint: company.serverInformationEndpoint,
            keyForServerInformationEndpoint: company.keyForServerInformationEndpoint,
            topics: company.topics,
            companyImage: company.companyImage,
            companyDescription: company.companyDescription
          });
        } else {
          utils.createError(res, 403, 'Cannot retrieve logistics object: this company is not the one under which the logged in user is registered.');
        }
      }, (err) => next(err))
      .catch((err) => {
        utils.createError(res, 400, 'Bad Request.');
        return;
      });
  });

/**
 * @swagger
 * /companies:
 *   post:
 *     tags:
 *       - Companies
 *     name: Register
 *     summary: Register a new company
 *     description: Register a new company. The companyId is a unique string that identifies your company in the sandbox. Please use lowercase, no spaces and only alphanumeric charactes
 *                  The company type should be one of the following - shipper, forwarder, airline, handler, customs, trucking, warehouse, salesagent. The image url and company description are optional fields.
 *                  Please create a secret PIN number to restrict access to your company. Only users that know the PIN number can create an account under your company's registration.
 *     consumes:
 *       - application/json
 *     produces:
 *       - application/json
 *     parameters:
 *       - name: body
 *         in: body
 *         schema:
 *           type: object
 *           properties:
 *             companyName:
 *               required: true
 *               type: string
 *             companyId:
 *               required: true
 *               type: string
 *               description: The company ID is a unique string that identifies your company in the sandbox. Please use lowercase, no spaces and only alphanumeric charactes
 *             companyType:
 *               type: string
 *               required: true
 *               description: One of the following types - shipper, forwarder, airline, handler, customs, trucking, warehouse, salesagent.
 *               enum: [shipper, forwarder, airline, handler, customs, trucking, warehouse, salesagent]
 *             contactName:
 *               required: true
 *               type: string
 *             contactEmail:
 *               required: true
 *               type: string
 *             companyImage:
 *               type: string
 *             companyDescription:
 *               type: string
 *             serverInformationEndpoint:
 *               required: false
 *               description: Endpoint of the company in the Internet of Logistics of format https://mycompanyonerecordserver.org/serverInformation
 *               type: string
 *             keyForServerInformationEndpoint:
 *               required: false
 *               description: Key for accessing the serverInformationEndpoint
 *               type: string
 *             topics:
 *               required: false
 *               description: Topics that the company would be interested in.
 *               type: array
 *               items:
 *                 type: string
 *                 enum: [Airwaybill, Housemanifest, Housewaybill, Booking]
 *             companyPin:
 *               required: true
 *               type: string
 *     responses:
 *       '201':
 *         description: Company created
 *       '400':
 *         description: CompanyId already exists
 *       '500':
 *         description: Internal Server Error
 */
companyRouter.route('/')
  .options(cors.cors, (req, res) => { res.sendStatus(200); })
  .post(cors.cors, (req, res, next) => {
    Company.findOne({ companyId: req.body.companyId })
      .then((company) => {
        if (!company) {
          Company.create(req.body)
            .then((company) => {
              res.statusCode = 201;
              res.setHeader('Content-Type', 'application/json');
              res.json({ status: 'Company registration successful!' });
            }, (err) => next(err))
            .catch((err) => next(err));
        } else {
          utils.createError(res, 400, 'CompanyId already exists!');
        }
      }, (err) => next(err))
      .catch((err) => next(err));
  })

/**
* @swagger
* /companies/{companyId}:
*   patch:
*     tags:
*       - Companies
*     name: Update company
*     summary: Update a company
*     description: Update a company by companyId. Protected endpoint. When you try out this API Swagger will automatically attach the Authentication header using the Bearer token you provided in the Authorize dialog.
*     security:
*       - bearerAuth: [] 
*     consumes:
*       - application/json
*     produces:
*       - application/json
*     parameters:
*       - in: path
*         name: companyId
*         description: Id of the company
*         type: string
*         required: true
*       - name: body
*         in: body
*         description: Send only the fields to modify
*         required: true
*         schema:
*           type: object
*           properties:
*             companyName:
*               type: string
*             companyType:
*               type: string
*             contactName:
*               type: string
*             contactEmail:
*               type: string
*             companyImage:
*               type: string
*             companyDescription:
*               type: string
*             serverInformationEndpoint:
*               type: string
*             keyForServerInformationEndpoint:
*               type: string
*             topics:
*               type: array
*               items:
*                 type: string
*                 enum: [Airwaybill, Housemanifest, Housewaybill, Booking]
*             companyPin:
*               type: string
*     responses:
*       '200':
*         description: Successfully updated the logistics object
*       '401':
*         description: No auth token / no user found with that name
*       '403':
*         description: This company is not the one under which the logged in user is subscribed
*       '500':
*         description: Internal Server Error
*/
companyRouter.route('/:companyId')
  .options(cors.cors, (req, res) => { res.sendStatus(200); })
  .patch(cors.cors, auth.user, auth.company, (req, res, next) => {
    if (req.params.companyId === req.user.companyId) {
      Company.update({ companyId: req.params.companyId }, req.body, function (err, sub) {
        res.statusCode = 200;
        res.setHeader('Content-Type', 'application/json');
        res.json({ message: 'Update successful.' });
      }, (err) => next(err))
        .catch((err) => next(err));
    } else {
      utils.createError(res, 403, 'Cannot update: this company is not the one under which the logged in user is subscribed.');
    }
  });

/**
 * @swagger
 * /companies/{companyId}:
 *   delete:
 *     tags:
 *       - Companies
 *     name: Delete company
 *     summary: Delete a company
 *     description: Delete a company by companyId. Protected endpoint. When you try out this API Swagger will automatically attach the Authentication header using the Bearer token you provided in the Authorize dialog.
 *     security:
 *       - bearerAuth: [] 
 *     consumes:
 *       - application/json
 *     produces:
 *       - application/json
 *     parameters:
 *       - in: path
 *         name: companyId
 *         description: Id of the company
 *         type: string
 *         required: true
 *     responses:
 *       '200':
 *         description: Delete successful
 *       '401':
 *         description: No auth token / no user found in db with that name
 *       '403':
 *         description: This company is not the one under which the logged in user is subscribed.
 *       '404' :
 *         description: Company not found
 *       '500':
 *         description: Internal Server Error
 */
companyRouter.route('/:company')
  .options(cors.cors, (req, res) => { res.sendStatus(200); })
  .delete(cors.cors, auth.user, auth.company, (req, res, next) => {
    Company.findOne({ companyId: req.params.company })
      .then((company) => {
        if (company.companyId === req.user.companyId) {
          Company.deleteOne({ companyId: company.companyId })
            .then((resp) => {
              res.statusCode = 200;
              res.setHeader('Content-Type', 'application/json');
              res.json({ message: "Company successfully deleted" });
            }, (err) => next(err))
            .catch((err) => next(err));
        } else {
          utils.createError(res, 403, 'Cannot delete: this company is not the one under which the logged in user is subscribed.');
        }
      }, (err) => next(err))
      .catch((err) => {
        utils.createError(res, 404, 'CompanyId not found.');
        return;
      });
  });

module.exports = companyRouter;