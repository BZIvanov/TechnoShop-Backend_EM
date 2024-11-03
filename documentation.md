# Documentation

# User

## User roles

There are 3 user role types: `admin`, `seller` and `buyer`. Users cannot register as admins, admin role is set on a database level.

## Register methods

The user's field `registerMethod` is always set to email. It exists in case additional register methods are implemented such as register/login with google, etc...

# CORS

Currently `origin` for CORS is a string allowing only one origin to access our app. If we need to change it to array with multiple allowed domains, we will need to provide function to the origin key to check against the allowed origins list.

There is also unit test checking for the header `access-control-allow-origin`, if we change the `origin` from string to function checking for multiple allowed origins, the test will fail, because we will not have the header.
