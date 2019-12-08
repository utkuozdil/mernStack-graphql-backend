const { validationResult } = require("express-validator");
const bcryptjs = require("bcryptjs");
const jsonwebtoken = require("jsonwebtoken");

const {
  validationError,
  errorWithStatusCodeAndMessage
} = require("../util/error");
const User = require("../models/user");

exports.signup = async (request, response, next) => {
  const errors = validationResult(request);
  validationError(errors);

  const body = request.body;
  try {
    const hashedPassword = await bcryptjs.hash(body.password, 12);

    const user = new User({
      email: body.email,
      password: hashedPassword,
      name: body.name
    });
    const result = await user.save();

    response.status(200).json({ message: "user created", userId: result._id });
  } catch (error) {
    if (!error.statusCode) error.statusCode = 500;
    next(error);
  }
};

exports.login = async (request, response, next) => {
  const errors = validationResult(request);
  validationError(errors);

  const body = request.body;
  let loadedUser;
  try {
    const user = await User.findOne({ email: body.email });
    if (!user)
      errorWithStatusCodeAndMessage(401, "user with this mail not found");

    loadedUser = user;
    const isEqual = await bcryptjs.compare(body.password, user.password);

    if (!isEqual) errorWithStatusCodeAndMessage(401, "wrong password");

    const userId = loadedUser._id.toString();
    const token = jsonwebtoken.sign(
      {
        email: loadedUser.email,
        userId
      },
      "topsecret",
      { expiresIn: "1h" }
    );
    response.status(200).json({ token, userId });
    return;
  } catch (error) {
    if (!error.statusCode) error.statusCode = 500;
    next(error);
    return error;
  }
};

exports.getUserStatus = async (request, response, next) => {
  try {
    const user = await User.findById(request.userId);
    if (!user) errorWithStatusCodeAndMessage(404, "user not found");

    response.status(200).json({ status: user.status });
  } catch (error) {
    if (!error.statusCode) error.statusCode = 500;
    next(error);
  }
};

exports.updateUserStatus = async (request, response, next) => {
  const newStatus = request.body.status;
  try {
    const user = await User.findById(request.userId);
    if (!user) errorWithStatusCodeAndMessage(404, "user not found");

    user.status = newStatus;
    await user.save();
    response.status(200).json({ message: "User updated." });
  } catch (error) {
    if (!error.statusCode) error.statusCode = 500;
    next(error);
  }
};
