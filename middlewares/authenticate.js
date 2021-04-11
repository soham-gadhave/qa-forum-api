const jwt                       = require('jsonwebtoken'),  
      User                      = require('../models/User'),
      bcrypt                    = require('bcrypt'),
      settings                  = require('../settings'),
      generateErrorInformation  = require('../utils');

const authenticate = async (request, response, next) => {
    
    //Check if user is authenticated or not
    const Authorization_Header = request.headers.authorization;
    console.log(Authorization_Header);
    try {
        if(Authorization_Header) {
            const JWT = Authorization_Header.split(' ')[1];
                if(JWT) {
                    try {
                        const decodedJWT = jwt.verify(JWT, settings.JWT_SECRET)
                        User.countDocuments({ _id: decodedJWT.aud })
                        .then(count => {
                            if(count === 1)
                                return next()
                            else
                                return response.status(401).send(generateErrorInformation("Invalid token or User does not exists"))
                        })
                        .catch(error => { 
                            return response.status(401).send(generateErrorInformation("Invalid token or User does not exists", error))
                        })
                    }
                    catch(error) {
                        return response.status(401).send(generateErrorInformation("Invalid token or token is expired", error))
                    }
                }
        }
        else 
            return response.status(401).send(generateErrorInformation("Authorization Header is not present"))
    }
    catch(error) {
        response.status(500).send(generateErrorInformation("There was some problem with the server, please try again", error));
    }
}

module.exports = authenticate;