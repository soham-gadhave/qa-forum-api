const mongoose = require('mongoose');

const schema = new mongoose.Schema({
    _id: String,
    payer: {
        name: String,
        id: mongoose.Schema.Types.ObjectId
    },
    amount: String,
    currency: {
        type: String,
        default: "INR"
    },
    receipt: String,
    payment_id: String
},
{
    _id: false,
    timestamps: true
});

module.exports = mongoose.model("Order", schema);