const Answer                    = require('../models/Answer'),
      Question                  = require('../models/Question'),
      Order                     = require('../models/Order'),                   
      generateErrorInformation  = require('../utils');

const authorize = async (request, response, next) => {
    
    const id = request.params.id;
    const orderid = request.params.orderid;
    const answerid = request.params.answerid;
    const userid = response.locals.userid;

    //Is the user authorized to edit or delete the answer
    if(answerid) {
        Answer.findById(answerid)
        .then(answer => {
            if(answer) {
                console.log(answer)
                if(answer.author.id.toString() === userid.toString())
                    return next();
                else
                    return response.status(403).send(generateErrorInformation("You are not authorize to do that"))
            }
            else
                return response.status(404).send(generateErrorInformation("No such Answer exists"))
        })
        .catch(error => response.status(500).send(generateErrorInformation("There was some problem with the server, please try again", error)))
    }

    //Is the user authorized to edit or delete the question    
    else if(id) {
        Question.findById(id)
        .then(question => {
            if(question) {
                if(question.author.id.toString() === userid.toString())
                    return next();
                else
                    return response.status(403).send(generateErrorInformation("You are not authorize to do that"))
            }
            else
                return response.status(404).send(generateErrorInformation("No such Question exists"))
        })
        .catch(error => response.status(500).send(generateErrorInformation("There was some problem with the server, please try again", error)))
    }

    //Is the user authorized to pay for the order
    else
        try {
            const order = await Order.findById(orderid)
            if(order) {
                if(order.payer.id.toString() === userid.toString())
                    return next();
                else
                    return response.status(403).send(generateErrorInformation("You are not authorize to do that"))
            }
            else
                return response.status(404).send(generateErrorInformation("No such Order exists"))
        }
        catch(error) {
            return response.status(500).send(generateErrorInformation("There was some problem with the server, please try again", error))
        }
}

module.exports = authorize;