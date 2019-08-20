const express = require('express');
const bodyParser = require('body-parser');
var auth = require('../authenticate');
var config = require('../config');
var utils = require('../utils');
var uuid = require('uuid');
const cors = require('./cors');

var request = require('request');

var loRouter = express.Router({ mergeParams: true });
loRouter.use(bodyParser.json());

const Lo = require('../models/lo');
const Company = require('../models/company');

/**
 * @swagger
 * /companies/{companyId}/los:
 *   post:
 *     tags:
 *       - Companies / Logistics objects
 *     name: Create logistics objects 
 *     summary: Create logistics objects
 *     description: Create logistics objects. When a LO is created, the companies which are subscribed to that type of LO will receive a notification with the new LO.
 *                  Protected endpoint. When trying out this API Swagger will automatically attach the Authentication header using the Bearer token was provided in the Authorize dialog.
 *     consumes:
 *       - application/json
 *     produces:
 *       - application/json
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: companyId
 *         type: string
 *         required:
 *           - true
 *       - in: query
 *         name: alertSubscribers
 *         description: If the query parameter is set to true, possible subscribers will be asked if they want to subscribe to this logistics object. 
 *         default: 'false'
 *         type: boolean
 *         required: true
 *       - name: logisticsObject
 *         in: body
 *         description: Content of a logistics object (needs to be one of following types - Airwaybill, Housemanifest, Housewaybill, Booking).
 *         schema:
 *           type: object
 *         required:
 *           - true
 *     responses:
 *       '201':
 *         description: Logistics object created successfully
 *       '400':
 *         description: Incorrect request body
 *       '401':
 *         description: Not authenticated
 *       '403':
 *         description: This companyId in the request is not the same as the company under which the logged in user is subscribed.
 *       '404':
 *         description: Company not found
 */
loRouter.route('/')
  .options(cors.cors, (res) => { res.sendStatus(200); })
  .post(cors.cors, auth.user, (req, res, next) => {
    Company.findOne({ companyId: req.params.companyId })
      .then((company) => {
        if (company.companyId === req.user.companyId) {
          const randomId = uuid.v4();
          const typeOfLo = req.body['@type'];
          const url = req.body['@id'] ? req.body['@id'] : config.url + '/companies/' + req.params.companyId + '/los/' + randomId;
          const id = req.body['@id'] ? getIdFromUrl(req.body['@id']) : randomId;

          var logisticsObjectContent = req.body;

          if (!typeOfLo) {
            utils.createError(res, 400, 'Logistics object should contain @type field: Airwaybill, Housemanifest, Housewaybill or Booking');
            return;
          };

          logisticsObjectContent['@id'] = url;
          var logisticsObject = new Lo({
            logisticsObject: logisticsObjectContent,
            companyId: req.params.companyId,
            url: url,
            type: typeOfLo,
            loId: id,
          });

          if (req.query.alertSubscribers === 'true') {
            // Notify subscribers which subscribed to this type of LO
            // Iterate through the companies, find companies interested in the topic, 
            //  and POST to serverInformationEndpoint in order to see if any company wants to subscribe to this LO
            Company.find({ topics: typeOfLo })
            .then((companies) => {
              if (companies.length === 0) {
                console.log("No companies found interested in topic " + typeOfLo);
              } else {
                for (i = 0; i < companies.length; i++) {
                  if (companies[i].serverInformationEndpoint && companies[i].keyForServerInformationEndpoint) {
                    getSubscriberInformation(companies[i], typeOfLo, function(data) {
                      postContentToSubscriber(req.body, data, typeOfLo);
                    });
                  }
                }
              }
            });
          }

          logisticsObject.save(function (err, logisticsObject) {
            if (err) {
              utils.createError(res, 500, err);
              return;
            }
            res.statusCode = 201;
            res.setHeader('Content-Type', 'application/json');
            res.json(logisticsObject);
          });
        } else {
          utils.createError(res, 403, 'Cannot add: this company is not the one under which the logged in user is registered.');
        }
      }, (err) => next(err))
      .catch((err) => {
        utils.createError(res, 404, 'CompanyId not found.');
        return;
      });
  })

  /**
   * @swagger
   * /companies/{companyId}/los:
   *   get:
   *     tags:
   *       - Companies / Logistics objects
   *     name: Return logistics objects
   *     summary: Return logistics objects
   *     description: Return all logistics objects for a given companyId. Protected endpoint. When you try out this API Swagger will automatically attach the Authentication header using the Bearer token you provided in the Authorize dialog.
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
   *         description: Logistics objects returned
   *       '401':
   *         description: Not authenticated
   *       '403':
   *         description: This logistics object is not belonging to the company under which the logged in user is subscribed.
   *       '404':
   *         description: Company not found
   */
  .get(cors.cors, auth.user, auth.company, (req, res, next) => {
    Company.findOne({ companyId: req.params.companyId })
      .then((company) => {
        if (company.companyId === req.user.companyId) {
          Lo.find({ companyId: req.params.companyId })
            .then((los) => {
              res.statusCode = 200;
              res.setHeader('Content-Type', 'application/json');
              var i = los.length;
              var out = [];
              while (i--) {
                out[i] = {
                  "loId": los[i].loId,
                  "logisticsObject": los[i].logisticsObject,
                  "type": los[i].type,
                  "url": los[i].url
                }
              }
              res.json(out);

            }, (err) => next(err))
            .catch((err) => next(err));
        } else {
          utils.createError(res, 403, 'Cannot retrieve logistics object: this company is not the one under which the logged in user is registered.');
        }
      }, (err) => next(err))
      .catch((err) => {
        utils.createError(res, 404, 'CompanyId not found.');
        return;
      });
  })

  .delete(cors.cors, auth.user, (res) => {
    utils.createError(res, 405, 'DELETE operation not supported for this endpoint.');
    res.end('DELETE operation not supported for this endpoint');
  });

loRouter.route('/:loId')
  .options(cors.cors, (req, res) => { res.sendStatus(200); })
  .put(cors.cors, auth.user, (res) => {
    utils.createError(res, 405, 'PUT operation not supported for this endpoint.');
    res.end('PUT operation not supported for this endpoint');
  })

  /**
  * @swagger
  * /companies/{companyId}/los/{loId}:
  *   get:
  *     tags:
  *       - Companies / Logistics objects
  *     name: Retrieve a logistics object
  *     summary: Retrieve a logistics object
  *     description: Retrieve a logistics object by loId. Protected endpoint. When trying out this API Swagger will automatically attach the Authentication header using the Bearer token was provided in the Authorize dialog.
  *     consumes:
  *       - application/json
  *     produces:
  *       - application/json
  *     security:
  *       - bearerAuth: []
  *     parameters:
  *       - in: path
  *         name: companyId
  *         description: Id of the company
  *         type: string
  *         required: true
  *       - in: path
  *         name: loId
  *         description: Id of logistics object
  *         type: string
  *         required: true
  *     responses:
  *       '200':
  *         description: Logistics object
  *       '401':
  *         description: Not authenticated
  *       '404':
  *         description: CompanyId / LoId not found
  */
  .get(cors.cors, auth.user, auth.company, (req, res, next) => {
    Company.findOne({ companyId: req.params.companyId })
      .then((company) => {
        Lo.findOne({ companyId: req.params.companyId, loId: req.params.loId })
          .then((lo) => {
            if (lo) {
              res.statusCode = 200;
              res.setHeader('Content-Type', 'application/json');
              res.json(lo);
            } else {
              utils.createError(res, 404, 'LoId not found.');
            }
          }, (err) => next(err))
          .catch((err) => next(err));
      }, (err) => next(err))
      .catch((err) => {
        utils.createError(res, 404, 'CompanyId not found.');
        return;
      });
  })

/**
 * @swagger
 * /companies/{companyId}/los/{loId}:
 *   patch:
 *     tags:
 *       - Companies / Logistics objects
 *     name: Update a logistics object
 *     summary: Update a logistics object
 *     description: Update a logistics object. Protected endpoint. When trying out this API Swagger will automatically attach the Authentication header using the Bearer token was provided in the Authorize dialog.
 *     consumes:
 *       - application/json
 *     produces:
 *       - application/json
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: companyId
 *         description: Id of the company
 *         type: string
 *         required: true
 *       - in: path
 *         name: loId
 *         description: Id of logistics object
 *         type: string
 *         required: true
 *       - name: logisticsObject
 *         in: body
 *         description: Content of a logistics object to update (only fields to update)
 *         required: true
 *         type: object
 *     responses:
 *       '200':
 *         description: Logistics object updated successfully
 *       '401':
 *         description: Not authenticated
 *       '403':
 *         description: This logistics object is not belonging to the company under which the logged in user is subscribed
 *       '404':
 *         description: Company not found
 */
  .patch(cors.cors, auth.user, (req, res, next) => {
    Company.findOne({ companyId: req.params.companyId })
      .then((company) => {
        if (company.companyId === req.user.companyId) {
          Lo.findOne({ companyId: req.params.companyId, loId: req.params.loId })
            .then((lo) => {
              if (req.body['@id']) {
                delete req.body['@id'];
              }

              for (let b in req.body) {
                if (isArray(req.body[b])) {
                  if (lo.logisticsObject[b]) {
                    for (let c in req.body[b]) {
                    lo.logisticsObject[b].push(req.body[b][c]);
                    lo.markModified("logisticsObject." + b);
                    }
                  } else {
                    lo.logisticsObject[b] = req.body[b];
                    lo.markModified("logisticsObject." + b);
                  }
                } else {
                  lo.logisticsObject[b] = req.body[b];
                  lo.markModified("logisticsObject." + b);
                }
              }

              lo.save();

              res.statusCode = 200;
              res.setHeader('Content-Type', 'application/json');
              res.json(lo);
            }, (err) => next(err))
            .catch((err) => next(err));
        } else {
          utils.createError(res, 403, 'Cannot retrieve logistics object: this company is not the one under which the logged in user is registered.');
        }
      }, (err) => next(err))
      .catch((err) => {
        utils.createError(res, 404, 'CompanyId not found.');
        return;
      });
  })

  /**
 * @swagger
 * /companies/{companyId}/los/{loId}:
 *   delete:
 *     tags:
 *       - Companies / Logistics objects
 *     name: Delete a logistics object
 *     summary: Delete a logistics object
 *     description: Delete a logistics object. Protected endpoint. When trying out this API Swagger will automatically attach the Authentication header using the Bearer token was provided in the Authorize dialog.
 *     consumes:
 *       - application/json
 *     produces:
 *       - application/json
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: companyId
 *         description: Id of the company
 *         type: string
 *         required: true
 *       - in: path
 *         name: loId
 *         description: Id of logistics object
 *         type: string
 *         required: true
 *     responses:
 *       '200':
 *         description: Logistics object deleted successfully
 *       '401':
 *         description: Not authenticated
 *       '403':
 *         description: This logistics object is not belonging to the company under which the logged in user is subscribed
 *       '404':
 *         description: CompanyId or LoId not found
 */
  .delete(cors.cors, auth.user, auth.company, (req, res, next) => {
    Company.findOne({ companyId: req.params.companyId })
      .then((company) => {
        if (company.companyId === req.user.companyId) {
          Lo.findOne({ loId: req.params.loId }, function (err, loToDelete) {
            if (err) {
              utils.createError(res, 404, 'Cannot find any logistics object to be deleted with the given loId');
            } else {
              Lo.deleteOne(loToDelete)
                .then((resp) => {
                  res.statusCode = 200;
                  res.setHeader('Content-Type', 'application/json');
                  res.json({ "message": "Logistics object successfully deleted" });
                }, (err) => next(err))
                .catch((err) => next(err));
            }
          });
        } else {
          utils.createError(res, 403, 'Cannot delete: This logistics object is not belonging to the company under which the logged in user is registered.');
        }
      }, (err) => next(err))
      .catch((err) => {
        utils.createError(res, 404, 'CompanyId not found.');
        return;
      });
  });

function getSubscriberInformation(subscriber, typeOfLo, callback) {
  request.get({
    url: subscriber.serverInformationEndpoint + "?topic=" + typeOfLo,
    headers: {
      'x-api-key': subscriber.keyForServerInformationEndpoint
    },
  }, (error, response, body) => {
    if (!error && response.statusCode == 200) {
      callback(JSON.parse(body));
    } else {
      console.log("Unable to retrieve subscriber information " + error);
    }
  }
  );
}

function postContentToSubscriber(bodyToPost, responseFromSubscriber, typeOfLo) {
  request.post({
    url: responseFromSubscriber.callbackUrl + "?topic=" + typeOfLo,
    headers: {
      'x-api-key': responseFromSubscriber.secret,
      'Content-Type': responseFromSubscriber.contentType[0],
      'Resource-Type': typeOfLo,
      'Orig-Request-Method': 'POST'
    },
    body: JSON.stringify(bodyToPost),
  },
    function (error, response) {
      if (!error && response.statusCode == 200) {
        console.log("Logistics object successfully sent to subscriber " + responseFromSubscriber.callbackUrl);
      } else {
        console.log("Unable to send logistics object to subscriber " + responseFromSubscriber.callbackUrl + " errorCode: " + response.statusCode + " error:" + error);
      }
    }
  );
}

function getIdFromUrl(url) {
  var pieces = url.split("/");
  return pieces[pieces.length-1];
}

function isArray(what) {
  return Object.prototype.toString.call(what) === '[object Array]';
}

module.exports = loRouter;