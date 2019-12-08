const expect = require("chai").expect;
const jsonwebtoken = require("jsonwebtoken");
const sinon = require("sinon");

const authMiddleware = require("../middleware/auth");

describe("auth middleware", () => {
  it("isAuth is false if no auth header", () => {
    const request = {
      get: function(headerName) {
        return null;
      }
    };

    authMiddleware(request, {}, () => {});

    expect(request.isAuth).is.eq(false);
  });

  it("isAuth is false if token cannot be verified", () => {
    const request = {
      get: function(headerName) {
        return "Bearer xyz";
      }
    };

    authMiddleware(request, {}, () => {});

    expect(request.isAuth).is.eq(false);
  });

  it("should yield a userId after decoding the token", () => {
    const request = {
      get: function(headerName) {
        return "Bearer xyz";
      }
    };

    sinon.stub(jsonwebtoken, "verify");
    jsonwebtoken.verify.returns({ userId: "abc" });

    authMiddleware(request, {}, () => {});
    expect(request).to.have.property("userId");
    expect(request).to.have.property("userId", "abc");
    expect(jsonwebtoken.verify.called).to.be.true;
    jsonwebtoken.verify.restore();
  });
});
