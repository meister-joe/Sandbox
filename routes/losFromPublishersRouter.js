const express = require('express');
const bodyParser = require('body-parser');
const cors = require('./cors');
var config = require('../config');
var utils = require('../utils');

var losFromPublishersRouter = express.Router();
losFromPublishersRouter.use(bodyParser.json());

const LoFromSubscriptions = require('../models/loFromSubscription');

/**
 * @swagger
 * /losFromPublishers:
 *   get:
 *     tags:
 *       - Logistics Objects from Publishers 
 *     name: Get saved logistics objects from my subscriptions
 *     summary:  Get saved logistics objects from my subscriptions
 *     description:  Get saved logistics objects from my subscriptions to publishers. The endpoint does not require as header the server specific secret defined the server's configurtion file.
 *     consumes:
 *       - application/json
 *     produces:
 *       - application/json
 *     parameters:
 *       - in: query
 *         name: topic
 *         description: Type of the logistics objects to retrieve
 *         type: string
 *         required: false
 *         enum:
 *           - Airwaybill
 *           - Housemanifest
 *           - Housewaybill
 *           - Booking
 *       - in: header
 *         name: serverSecret
 *         description: Server specific key from the server's configuration file.
 *         type: string
 *         required: true
 *     responses:
 *       '200':
 *         description: List of logistics objects received from publishers
 *       '403':
 *         description: Forbidden to access this resource
 *       '500':
 *         description: Internal Server Error
 */
losFromPublishersRouter.route('/')
    .options(cors.cors, (req, res) => { res.sendStatus(200); })
    .get(cors.cors, (req, res, next) => {
        if (req.headers.serversecret === config.serverOwnSecret) {
            if (req.query.topic) {
                LoFromSubscriptions.find({ topic: req.query.topic })
                    .then((subscriptions) => {
                        res.statusCode = 200;
                        res.setHeader('Content-Type', 'application/json');
                        var i = subscriptions.length;
                        var out = [];
                        while (i--) {
                            out[i] = {
                                "lo": subscriptions[i].lo,
                                "topic": subscriptions[i].topic
                            }
                        }
                        res.json(out);
                    }, (err) => next(err))
                    .catch((err) => next(err));
            } else {
                LoFromSubscriptions.find({})
                    .then((subscriptions) => {
                        res.statusCode = 200;
                        res.setHeader('Content-Type', 'application/json');
                        var i = subscriptions.length;
                        var out = [];
                        while (i--) {
                            out[i] = {
                                "lo": subscriptions[i].lo
                            }
                        }
                        res.json(out);
                    }, (err) => next(err))
                    .catch((err) => next(err));
            }
        } else {
            utils.createError(res, 403, 'Forbidden to get logistics objects from this server');
        }
    });

module.exports = losFromPublishersRouter;