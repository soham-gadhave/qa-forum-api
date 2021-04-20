const mongoose = require('mongoose');

const schema = new mongoose.Schema({
    email: { 
        type: String, 
        unique: true
    },
    hash: String,
    mobile: {
        type: String,
        unique: true
    },
    firstname: String,
    lastname: String,
    plan: {
        name: {
            type: String, 
            default: "basic"
        },
        duration: {
            type: String, 
            default: "lifetime"
        },
        currency: {
            type: String, 
            default: "INR"
        }  
    }
},
{
    timestamps: true
});

module.exports = mongoose.model("User", schema);