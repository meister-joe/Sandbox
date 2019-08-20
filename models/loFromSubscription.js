const mongoose = require('mongoose');
const Schema = mongoose.Schema;

var jsonld = new Schema({
    lo: {
        type: Object,
        required: true
    },
    topic: {
        type: String,
        required: true
    }
}, {
        timestamps: true
    });

var LoFromSubscriptions = mongoose.model('LoFromSubscription', jsonld);

module.exports = LoFromSubscriptions;