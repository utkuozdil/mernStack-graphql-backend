const jsonwebtoken = require("jsonwebtoken");

module.exports = (request, response, next) => {
  const authorizationHeader = request.get("Authorization");
  if (!authorizationHeader) {
    request.isAuth = false;
    return next();
  }

  const token = authorizationHeader.split(" ")[1];
  let decodedToken;
  try {
    decodedToken = jsonwebtoken.verify(token, "topsecret");
  } catch (error) {
    request.isAuth = false;
    return next();
  }
  if (!decodedToken) {
    request.isAuth = false;
    return next();
  }

  request.userId = decodedToken.userId;
  request.isAuth = true;
  next();
};
