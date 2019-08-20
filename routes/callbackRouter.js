const express = require('express');
const bodyParser = require('body-parser');
const cors = require('./cors');
var config = require('../config');
var utils = require('../utils');

var callbackRouter = express.Router();
callbackRouter.use(bodyParser.json());

const LoFromSubscriptions = require('../models/loFromSubscription');

/**
 * @swagger
 * /callbackUrl:
 *   post:
 *     tags:
 *       - Logistics Objects from Publishers
 *     name: Receive logistics objects 
 *     summary: Receive logistics objects from publishers
 *     description: Receive logistics objects from publishers to which the server subscribed to. The endpoint does not require any authentication.
 *     consumes:
 *       - application/json
 *     produces:
 *       - application/json
 *     parameters:
 *       - name: body
 *         in: body
 *         required: true
 *         description: Content of a logistics object to which the server is subscribed to.
 *         type: object
 *       - in: query
 *         name: topic
 *         description: Type of the logistics object sent
 *         type: string
 *         required: false
 *         enum:
 *           - Airwaybill
 *           - Housemanifest
 *           - Housewaybill
 *           - Booking
 *       - in: header
 *         name: x-api-key
 *         description: API key is provided in the subscription
 *         type: string
 *         required: true
 *       - in: header
 *         name: Resource-Type
 *         type: string
 *         required: true
 *         description: Class of the logistics object sent (e.g. Airwaybill, Booking)
 *         enum: 
 *           - Airwaybill
 *           - Housemanifest
 *           - Housewaybill
 *           - Booking
 *       - in: header
 *         name: Orig-Request-Method
 *         value: POST
 *     responses:
 *       '200':
 *         description: Logistics object notification successful
 *       '401':
 *         description: Not authenticated
 *       '500':
 *         description: Internal Server Error
 */
callbackRouter.route('/')
    .options(cors.cors, (req, res) => { res.sendStatus(200); })
    .post(cors.cors, (req, res, next) => {
        if (req.headers['x-api-key'] === config.subscriptionSecret) {
            var loFromSubscriptions = new LoFromSubscriptions({ lo: req.body, topic: req.headers['resource-type'] });
            LoFromSubscriptions.create(loFromSubscriptions)
                .then((logobj) => {
                    res.statusCode = 200;
                    res.setHeader('Content-Type', 'application/json');
                    res.json({ message: 'Logistics object notification successful!' });
                }, (err) => next(err))
                .catch((err) => next(err));
        } else {
            utils.createError(res, 401, 'Unauthorized to send logistics objetcts to this server');
        }
    });

module.exports = callbackRouter;