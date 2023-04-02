const express = require("express");
const router = express.Router();
const argon2 = require("argon2");
const jwt = require("jsonwebtoken");

const connectRabbitMQ = require("../config/rabbitmq");

const passportJWT = require("../middlewares/passport-jwt");

const User = require("../models/user");

// localhost:4000/api/v1/users/profile
router.get(
  "/profile",
  [passportJWT.checkAuth],
  async function (req, res, next) {
    const user = await User.findByPk(req.user.user_id);

    return res.status(200).json({
      user: {
        id: user.id,
        fullname: user.fullname,
        email: user.email,
        role: user.role,
      },
    });
  }
);

// localhost:4000/api/v1/users/
router.get("/", function (req, res, next) {
  return res.status(200).json({
    message: "Hello Users",
  });
});

// localhost:4000/api/v1/users/register
router.post("/register", async function (req, res, next) {
  const { fullname, email, password } = req.body;

  //check email ซ้ำ
  const user = await User.findOne({ where: { email: email } });
  if (user !== null) {
    return res.status(400).json({ message: "มีผู้ใช้งานอีเมล์นี้แล้ว" });
  }

  //เข้ารหัส password
  const passwordHash = await argon2.hash(password);

  //สร้าง user ใหม่
  const newUser = await User.create({
    fullname: fullname,
    email: email,
    password: passwordHash,
  });

  //ติดต่อไปที่ rabbitmq server และสร้าง channel
  const channel = await connectRabbitMQ();
  await channel.assertExchange("ex.sittichok.fanout", "fanout", {
    durable: true, // ถ้าล่มจะกลับมาทำงานอันที่ค้าง auto
  });

  // ส่งข้อมูล User ไปให้ product-service
  await channel.assertQueue("q.sittichok.product.service", {
    durable: true, // ถ้าล่มจะกลับมาทำงานอันที่ค้าง auto
  });
  await channel.bindQueue(
    "q.sittichok.product.service",
    "ex.sittichok.fanout",
    ""
  ); //ค่าที่ 3 คือ route (fanout ไม่ต้องใส่ค่า)

  channel.publish(
    "ex.sittichok.fanout",
    "",
    Buffer.from(JSON.stringify(newUser)),
    {
      contentType: "application/json",
      contentEncoding: "utf-8",
      type: "UserCreated",
      persistent: true, // เก็บข้อมูลลง harddisk
    }
  );

  return res.status(201).json({
    message: "ลงทะเบียนสำเร็จ",
    user: {
      id: newUser.id,
      fullname: newUser.fullname,
    },
  });
});

// localhost:4000/api/v1/users/login
router.post("/login", async function (req, res, next) {
  const { email, password } = req.body;

  //1.นำ email ไปตรวจสอบในระบบว่ามีหรือไม่
  const user = await User.findOne({ where: { email: email } });
  if (user === null) {
    return res.status(404).json({ message: "ไม่พบผู้ใช้งานนี้ในระบบ" });
  }

  //2.ถ้ามีให้เอารหัสผ่านไปเปรียบเทียบกับรหัสผ่านจากตาราง ข้อ 1
  const isValid = await argon2.verify(user.password, password);
  if (isValid === false) {
    return res.status(401).json({ message: "รหัสผ่านไม่ถูกต้อง" });
  }

  //3.สร้าง token
  const token = jwt.sign(
    { user_id: user.id, role: user.role },
    process.env.JWT_KEY,
    { expiresIn: "7d" }
  );

  return res.status(200).json({
    message: "เข้าระบบสำเร็จ",
    access_token: token,
  });
});

module.exports = router;
