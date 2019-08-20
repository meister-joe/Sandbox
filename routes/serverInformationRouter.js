const express = require('express');
const bodyParser = require('body-parser');
var config = require('../config');
var utils = require('../utils');
const cors = require('./cors');

var serverInformationRouter = express.Router();
serverInformationRouter.use(bodyParser.json());

/**
 * @swagger
 * /serverInformation:
 *   get:
 *     tags:
 *       - Server Information / Subscription details
 *     name: Get server information / subscription details
 *     summary: Get server information / subscription details
 *     description: Get server information applicable in the internet of logistics. When a topic is sent in the query parameter, the subscription details are returned if the server subscibes to that topic. When you try out this API Swagger will automatically attach the Authentication header using the Bearer token you provided in the Authorize dialog.
 *     produces:
 *       - application/ld+json
 *     parameters:
 *       - in: header
 *         name: x-api-key
 *         description: Key to access the server information
 *         type: string
 *         required: true
 *       - in: query
 *         name: topic
 *         description: Topic for which subscription details need to be retrieved
 *         type: string
 *         required: false
 *         enum:
 *           - Airwaybill
 *           - Housemanifest
 *           - Housewaybill
 *           - Booking
 *     responses:
 *       '200':
 *         description: Server information or Subscription details
 *       '401':
 *         description: Not authenticated
 *       '500':
 *         description: Internal Server Error
 */
serverInformationRouter.route('/')
    .options(cors.cors, (req, res) => { res.sendStatus(200); })
    .get(cors.cors, (req, res, next) => {
        // If a topic is present as query parameter, return subscription details
        if (req.headers['x-api-key'] && req.headers['x-api-key'] === config.keyForServerInformation) {
            if (req.query.topic) {
                res.statusCode = 200;
                res.setHeader('Content-Type', 'application/ld+json');
                res.json({
                    '@context': {
                        '@vocab': "https://tcfplayground.org"
                    },
                    '@id': config.url + "/serverInformation?topic=" + req.query.topic,
                    '@type': "Subscription",
                    subscribedTo: "TODO",
                    callbackUrl: config.url + "/callbackUrl",
                    contentType: ["application/json", "application/ld+json"],
                    secret: config.subscriptionSecret,
                    subscribeToStatusUpdates: true,
                    cacheFor: config.cacheFor
                });
            } else {
                // Otherwise, return basic server information in the internet of logistics
                res.statusCode = 200;
                res.setHeader('Content-Type', 'application/ld+json');
                res.json({
                    '@context': {
                        '@vocab': "https://tcfplayground.org"
                    },
                    '@id': config.url + "/serverInformation",
                    '@type': "ServerInformation",
                    company: {
                        '@type': "Company",
                        name: config.companyName,
                        IATACargoAgentCode: config.IATACargoAgentCode
                    },
                    serverEndpoint: config.url,
                    supportedLogisticsObjects: [
                        "https://tcfplayground.org/HouseManifest",
                        "https://tcfplayground.org/AirWaybill",
                        "https://tcfplayground.org/Booking",
                        "https://tcfplayground.org/Housewaybill"],
                    contentTypes: ["application/json", "application/ld+json"]
                });
            }
        } else {
            utils.createError(res, 401, 'Unauthorized to retrieve server information');
        }
    });

module.exports = serverInformationRouter;