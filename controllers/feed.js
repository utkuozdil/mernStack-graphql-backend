const { validationResult } = require("express-validator");
const fs = require("fs");
const path = require("path");

const {
  validationError,
  errorWithStatusCodeAndMessage
} = require("../util/error");
const Post = require("../models/post");
const User = require("../models/user");

exports.getPosts = async (request, response, next) => {
  const page = request.query.page || 1;
  const perPage = 2;
  try {
    const totalItems = await Post.find().countDocuments();
    const posts = await Post.find()
      .populate("creator")
      .sort({ createdAt: -1 })
      .skip((page - 1) * perPage)
      .limit(perPage);
    response.status(200).json({ message: "posts fetched", posts, totalItems });
  } catch (error) {
    if (!error.statusCode) error.statusCode = 500;
    next(error);
  }
};

exports.addPost = async (request, response, next) => {
  const errors = validationResult(request);
  validationError(errors);

  if (!request.file) errorWithStatusCodeAndMessage(422, "no image");

  const body = request.body;
  const userId = request.userId;
  const post = new Post({
    title: body.title,
    content: body.content,
    imageUrl: request.file.path.replace("\\", "/"),
    creator: userId
  });
  try {
    await post.save();
    const user = await User.findById(userId);
    user.posts.push(post);
    await user.save();
    response.status(201).json({
      message: "success",
      post: post,
      creator: { _id: user._id, name: user.name }
    });
  } catch (error) {
    if (!error.statusCode) error.statusCode = 500;
    next(error);
  }
};

exports.getPost = async (request, response, next) => {
  const id = request.params.id;
  const post = await Post.findById(id).populate("creator");
  try {
    if (!post) errorWithStatusCodeAndMessage(404, "couldn't find post");

    response.status(200).json({ message: "post fetched", post });
  } catch (error) {
    if (!error.statusCode) error.statusCode = 500;
    next(error);
  }
};

exports.updatePost = async (request, response, next) => {
  const errors = validationResult(request);
  validationError(errors);

  const body = request.body;
  const file = request.file;

  let imageUrl = file ? file.path.replace("\\", "/") : body.image;
  if (!imageUrl) errorWithStatusCodeAndMessage(422, "no image");

  const id = request.params.id;
  try {
    const post = await Post.findById(id).populate("creator");

    if (!post) errorWithStatusCodeAndMessage(404, "couldn't find post");

    if (post.creator._id.toString() !== request.userId)
      errorWithStatusCodeAndMessage(403, "not authorized");

    if (imageUrl !== post.imageUrl) clearImage(post.imageUrl);

    post.title = body.title;
    post.imageUrl = imageUrl;
    post.content = body.content;

    const result = await post.save();

    response.status(200).json({ message: "post updated", post: result });
  } catch (error) {
    if (!error.statusCode) error.statusCode = 500;
    next(error);
  }
};

const clearImage = filePath => {
  filePath = path.join(__dirname, "..", filePath);
  fs.unlink(filePath, error => console.log(error));
};

exports.deletePost = async (request, response, next) => {
  const id = request.params.id;
  try {
    const post = await Post.findById(id);
    if (!post) errorWithStatusCodeAndMessage(404, "couldn't find post");

    if (post.creator.toString() !== request.userId)
      errorWithStatusCodeAndMessage(403, "not authorized");

    clearImage(post.imageUrl);
    await Post.findByIdAndRemove(id);

    const user = await User.findById(request.userId);

    user.posts.pull(id);
    await user.save();

    response.status(200).json({ message: "post deleted" });
  } catch (error) {
    if (!error.statusCode) error.statusCode = 500;
    next(error);
  }
};
