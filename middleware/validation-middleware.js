const validator = require('../helpers/validate');

const signup = (req, res, next) => {
    const validationRule = {
        "name": "required|string",
        "surname": "required|string",
        "email": "required|email"
        
    }
    validator(req.body, validationRule, {}, (err, status) => {
        if (!status) {
            res.status(412)
                .send({
                    success: false,
                    message: 'Validation failed',
                    data: err
                });
        } else {
            next();
        }
    });
}

module.exports = { 
  signup
}