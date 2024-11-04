# Documentation

# User

## User roles

There are 3 user role types: `admin`, `seller` and `buyer`. Users cannot register as admins, admin role is set on a database level.

## Register methods

The user's field `registerMethod` is always set to email. It exists in case additional register methods are implemented such as register/login with google, etc...

# CORS

Currently `origin` for CORS is a string allowing only one origin to access our app. If we need to change it to array with multiple allowed domains, we will need to provide function to the origin key to check against the allowed origins list.

There is also unit test checking for the header `access-control-allow-origin`, if we change the `origin` from string to function checking for multiple allowed origins, the test will fail, because we will not have the header.

## Data validations

Joi npm packages is used for request validations with middleware `validate-request-body`. If the middleware is used in conjunction with `multer` middleware, validate request body middleware should be used after the multer middleware. This is because multer will override express.json() and also req.file will be provided by the multer middleware.

For requests with files, the file field key should be also provided to the validate request body middleware to match the req.file with the key which is used for FormData().
