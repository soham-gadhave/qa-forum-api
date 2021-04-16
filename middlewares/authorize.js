const Answer                    = require('../models/Answer'),
      Question                  = require('../models/Question'),
      generateErrorInformation  = require('../utils');

const authorize = async (request, response, next) => {
    
    const id = request.params.id;
    const answerid = request.params.answerid;
    const userid = response.locals.userid;

    console.log(id, answerid, userid)

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

    else
        return next();
}

module.exports = authorize;