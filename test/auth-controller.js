const expect = require("chai").expect;
const sinon = require("sinon");

const User = require("../models/user");
const AuthController = require("../controllers/auth");

describe("Auth Controller", () => {
  it("throws an error if accesing the db fails", done => {
    sinon.stub(User, "findOne");
    User.findOne.throws();

    const request = {
      body: { email: "test@test.com", password: "password" }
    };

    AuthController.login(request, {}, () => {}).then(result => {
      expect(result).to.be.an("error");
      expect(result).to.have.property("statusCode", 500);
      done();
    });

    User.findOne.restore();
  });
});
