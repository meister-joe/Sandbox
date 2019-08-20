var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var company = new Schema({
  contactName: {
    type: String,
    required: true
  },
  contactEmail: {
    type: String,
    required: true
  },
  companyType: {
    type: String,
    required: true
  },
  companyName: {
    type: String,
    required: true
  },
  companyId: {
    type: String,
    required: true
  },
  serverInformationEndpoint: {
    type: String,
    required: false
  },
  keyForServerInformationEndpoint: {
    type: String,
    required: false
  },
  topics: {
    type: Array,
    required: false
  },
  companyImage: {
    type: String,
    required: false
  },
  companyDescription: {
    type: String,
    required: false
  },
  companyPin: {
    type: String,
    required: false,
    default: "1234"
  },
  active: {
    type: Boolean,
    required: true,
    default: true
  }
}, {
  timestamps: true
});

var Company = mongoose.model('Company', company);

module.exports = Company;