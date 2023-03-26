const passport = require("passport");
const JwtStrategy = require("passport-jwt").Strategy;
const ExtractJwt = require("passport-jwt").ExtractJwt;

const opts = {};
opts.jwtFromRequest = ExtractJwt.fromAuthHeaderAsBearerToken();
opts.secretOrKey = process.env.JWT_KEY;
// opts.issuer = 'accounts.examplesoft.com';
// opts.audience = 'yoursite.net';

passport.use(
  new JwtStrategy(opts, async function (jwt_payload, done) {
    try {
      const user = { user_id: jwt_payload.user_id };
      if (user) {
        return done(null, user); // {user_id: 2} ส่งข้อมูล user ไปกับ req
      }
    } catch (error) {
      done(error);
    }
  })
);

// check authen
module.exports.checkAuth = passport.authenticate("jwt", { session: false });
