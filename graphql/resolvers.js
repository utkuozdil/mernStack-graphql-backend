const bcryptjs = require("bcryptjs");
const validator = require("validator");
const jsonwebtoken = require("jsonwebtoken");

const {
  invalidInputError,
  errorWithStatusCodeAndMessage
} = require("../util/error");
const { clearImage } = require("../util/file");
const User = require("../models/user");
const Post = require("../models/post");

module.exports = {
  createUser: async function({ userInput }, request) {
    const errors = [];
    const email = userInput.email;
    const password = userInput.password;

    if (!validator.isEmail(email)) errors.push({ message: "invalid email" });
    if (
      validator.isEmpty(password) ||
      !validator.isLength(password, { min: 5 })
    )
      errors.push({ message: "short password" });

    invalidInputError(errors);

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      const error = new Error("user exists already");
      throw error;
    }
    const hashedPassword = await bcryptjs.hash(password, 12);
    const user = new User({
      email,
      name: userInput.name,
      password: hashedPassword
    });
    const createdUser = await user.save();
    return { ...createdUser._doc, _id: createdUser._id.toString() };
  },

  login: async function({ email, password }) {
    const user = await User.findOne({ email });
    if (!user) errorWithStatusCodeAndMessage(401, "user not found");

    const isEqual = await bcryptjs.compare(password, user.password);
    if (!isEqual) errorWithStatusCodeAndMessage(401, "incorrect password");

    const userId = user._id.toString();
    const token = jsonwebtoken.sign(
      {
        userId: userId,
        email: user.email
      },
      "topsecret",
      { expiresIn: "1h" }
    );

    return { token, userId };
  },

  createPost: async function({ postInput }, request) {
    if (!request.isAuth)
      errorWithStatusCodeAndMessage(401, "not authenticated");

    const title = postInput.title;
    const content = postInput.content;
    const errors = [];

    if (validator.isEmpty(title) || !validator.isLength(title, { min: 5 }))
      errors.push({ message: "invalid title" });

    if (validator.isEmpty(content) || !validator.isLength(content, { min: 5 }))
      errors.push({ message: "invalid content" });

    invalidInputError(errors);

    const user = await User.findById(request.userId);
    if (!user) errorWithStatusCodeAndMessage(401, "invalid user");

    const post = new Post({
      title,
      content,
      imageUrl: postInput.imageUrl,
      creator: user
    });

    const createdPost = await post.save();
    user.posts.push(createdPost);
    await user.save();

    return {
      ...createdPost._doc,
      _id: createdPost._id.toString(),
      createdAt: createdPost.createdAt.toISOString(),
      updatedAt: createdPost.updatedAt.toISOString()
    };
  },

  posts: async function({ page }, request) {
    if (!request.isAuth)
      errorWithStatusCodeAndMessage(401, "not authenticated");

    if (!page) page = 1;
    const perPage = 2;

    const totalPosts = await Post.find().countDocuments();
    const posts = await Post.find()
      .sort({ createdAt: -1 })
      .skip((page - 1) * perPage)
      .limit(perPage)
      .populate("creator", "name");
    return {
      posts: posts.map(item => {
        return {
          ...item._doc,
          _id: item._id.toString(),
          createdAt: item.createdAt.toISOString(),
          updatedAt: item.updatedAt.toISOString()
        };
      }),
      totalPosts
    };
  },

  post: async function({ id }, request) {
    if (!request.isAuth)
      errorWithStatusCodeAndMessage(401, "not authenticated");

    const post = await Post.findById(id).populate("creator", "name");
    if (!post) errorWithStatusCodeAndMessage(404, "no post found");

    return {
      ...post._doc,
      _id: post._id.toString(),
      createdAt: post.createdAt.toISOString(),
      updatedAt: post.updatedAt.toISOString()
    };
  },

  updatePost: async ({ id, postInput }, request) => {
    if (!request.isAuth)
      errorWithStatusCodeAndMessage(401, "not authenticated");

    const post = await Post.findById(id).populate("creator", "name");
    if (!post) errorWithStatusCodeAndMessage(404, "no post found");

    if (post.creator._id.toString() !== request.userId.toString())
      errorWithStatusCodeAndMessage(403, "not authorized");

    const title = postInput.title;
    const content = postInput.content;
    const errors = [];

    if (validator.isEmpty(title) || !validator.isLength(title, { min: 5 }))
      errors.push({ message: "invalid title" });

    if (validator.isEmpty(content) || !validator.isLength(content, { min: 5 }))
      errors.push({ message: "invalid content" });

    invalidInputError(errors);

    post.title = title;
    post.content = content;
    if (postInput.imageUrl !== "undefined") post.imageUrl = postInput.imageUrl;

    const updatedPost = await post.save();
    return {
      ...updatedPost._doc,
      _id: updatedPost._id.toString(),
      createdAt: updatedPost.createdAt.toISOString(),
      updatedAt: updatedPost.updatedAt.toISOString()
    };
  },

  deletePost: async ({ id }, request) => {
    if (!request.isAuth)
      errorWithStatusCodeAndMessage(401, "not authenticated");

    const post = await Post.findById(id);
    if (!post) errorWithStatusCodeAndMessage(404, "no post found");

    if (post.creator.toString() !== request.userId.toString())
      errorWithStatusCodeAndMessage(403, "not authorized");

    clearImage(post.imageUrl);

    await Post.findByIdAndRemove(id);

    const user = await User.findById(request.userId);
    user.posts.pull(id);
    await user.save();

    return true;
  },

  user: async (args, request) => {
    if (!request.isAuth)
      errorWithStatusCodeAndMessage(401, "not authenticated");

    const user = await User.findById(request.userId);
    if (!user) errorWithStatusCodeAndMessage(401, "no user found");

    return { ...user._doc, _id: user._id.toString() };
  },

  updateStatus: async ({ status }, request) => {
    if (!request.isAuth)
      errorWithStatusCodeAndMessage(401, "not authenticated");

    const user = await User.findById(request.userId);
    if (!user) errorWithStatusCodeAndMessage(401, "no user found");

    user.status = status;
    await user.save();
    return { ...user._doc, _id: user._id.toString() };
  }
};
