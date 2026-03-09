import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

import { userService } from "../user/user.service.js";
import { logger } from "../../services/logger.service.js";

export const authService = {
  signup,
  login,
  getLoginToken,
  validateToken,
};

async function login(agentCode, password) {
  console.log(
    "~ file: auth.service.js ~ line 19 ~ login ~ agentCode, password",
    agentCode,
    password,
  );
  logger.debug(`auth.service - login with agentCode: ${agentCode}`);

  const user = await userService.getByUsername(agentCode);
  if (!user) return Promise.reject("user not found");

  const match = await bcrypt.compare(password, user.password);
  if (!match) return Promise.reject("Invalid agent code or password");

  delete user.password;
  user._id = user._id.toString();
  return user;
}

async function signup({ agentCode, password, fullname, role }) {
  const saltRounds = 10;

  logger.debug(
    `auth.service - signup with agentCode: ${agentCode}, fullname: ${fullname}`,
  );
  if (!agentCode || !password || !fullname || !role)
    return Promise.reject("Missing required signup information");

  const userExist = await userService.getByUsername(agentCode);
  if (userExist) return Promise.reject("Agent code already taken");

  const hash = await bcrypt.hash(password, saltRounds);
  return userService.add({ agentCode, password: hash, fullname, role });
}

function getLoginToken(user) {
  const userInfo = {
    _id: user._id,
    fullname: user.fullname,
    role: user.role,
  };
  console.log(userInfo);
  return jwt.sign(userInfo, process.env.JWT_SECRET || "Secret-Puk-1234", {
    expiresIn: "1d",
  });
}

function validateToken(loginToken) {
  try {
    const loggedinUser = jwt.verify(
      loginToken,
      process.env.JWT_SECRET || "Secret-Puk-1234",
    );
    return loggedinUser;
  } catch (err) {
    console.log("Invalid login token");
  }
  return null;
}
