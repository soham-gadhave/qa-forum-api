const jwt                       = require('jsonwebtoken'),  
      User                      = require('./models/User'),
      bcrypt                    = require('bcrypt'),
      settings                  = require('./settings'),
      generateErrorInformation  = require('./utils');

const signup = async (request, response) => {
    //Extract user auth data from request's body

    try {
        const { email, password, mobile, firstname, lastname } = request.body;
    
        //if any of them is empty return 400 repsonse
        if(!email || !email.trim() || !password || !password.trim())
            return response.status(422).send(generateErrorInformation("Password or Email or both are empty. Please enter valid information", null))
    
        //Check If User already exists 
        user = await User.findOne({ email: email })
    
        if(user)
            return response.status(409).send(generateErrorInformation("User already registered"))
    
        //Create hash
        bcrypt.hash(password, settings.SALT_ROUNDS)
        .then(hash => {
            User.create({
                email: email,
                hash: hash,
                mobile: mobile,
                firstname: firstname,
                lastname: lastname
            })
            .then(user => {
        
                const now = Math.floor(Date.now() / 1000)
                const expTime = 7*24*60*60
                const exp = now + expTime
        
                const payload = {
                    "iss": "qaforum-api.herokuappp.com",
                    "aud": user._id.toString(),
                    "iat": now,
                    "exp": exp
                }
        
                jwt.sign(payload, settings.JWT_SECRET, (error, token) => {
                    if(error)
                        return response.status(500).send(generateErrorInformation("Sorry, encountered jwt some error, please try again", error))
                    return response.json({user: user, jwt: token})  
                })
            })
            .catch(error => {console.log(error); return response.status(500).send(generateErrorInformation("Sorry, unable to register, please try again", error))})
        })
        .catch(error => {return response.status(500).send(generateErrorInformation("Sorry, encountered some error, please try again", error))})
    }
    catch(error) {
        return response.status(501).send(genrateErrorInformation("Sorry something went wrong, please try again", error))
    }
}

const signin = async (request, response) => {

    try {
        //Extract user auth data from request's body
        const { email, password } = request.body;
    
        //if any of them is empty return 400 repsonse
        if(!email || !email.trim() || !password || !password.trim())
            return response.status(422).send(generateErrorInformation("Password or Email or both are empty. Please enter valid information", null))
        
        //Check if user exists
        user = await User.findOne({ email: email })
        if(user){
    
            bcrypt.compare(password, user.hash)
            .then(matched => {
                if(matched) {
                    const now = Math.floor(Date.now() / 1000)
                    const expTime = 7*24*60*60
                    const exp = now + expTime
    
                    const payload = {
                        "iss": "qaforum-api.herokuappp.com",
                        "aud": user._id.toString(),
                        "iat": now,
                        "exp": exp
                    }
    
                    jwt.sign(payload, settings.JWT_SECRET, (error, token) => {
                        if(error)
                            return response.status(500).send(generateErrorInformation("Sorry, encountered jwt some error, please try again", error))
                        return response.json({user: user, jwt: token})  
                    })
                }
                else
                    return response.status(401).send(generateErrorInformation("Credentials did not match"))
            })
        }
        else
            return response.status(404).send(generateErrorInformation("User does not exist"))
    }
    catch(error) {
        return response.status(501).send(generateErrorInformation("Sorry something went wrong, please try again", error))
    }
}
const logout = () => console.log("logout")

const auth = {
    signup: signup,
    signin: signin,
    logout: logout
}

module.exports = auth