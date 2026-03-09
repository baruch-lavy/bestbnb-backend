import { authService } from "./auth.service.js";
import { logger } from "../../services/logger.service.js";

export async function login(req, res) {
  const { agentCode, password } = req.body;
  console.log(
    "~ file: auth.controller.js ~ line 10 ~ login ~ agentCode, password",
    agentCode,
    password,
  );
  try {
    const user = await authService.login(agentCode, password);
    const loginToken = authService.getLoginToken(user);

    logger.info("User login: ", user);

    res.cookie("loginToken", loginToken, { sameSite: "None", secure: true });
    res.json(user);
  } catch (err) {
    logger.error("Failed to Login " + err);
    res.status(401).send({ err: "Failed to Login" });
  }
}

export async function me(req, res) {
  const loggedinUserToken = req.cookies["loginToken"];
  if (!loggedinUserToken)
    return res.status(401).send({ err: "Not Authenticated" });
  const loggedinUser = authService.validateToken(loggedinUserToken);
  if (!loggedinUser) return res.status(401).send({ err: "Not Authenticated" });
  res.json(loggedinUser);
}

export async function signup(req, res) {
  try {
    const { agentCode, fullname, password, role } = req.body;

    const account = await authService.signup({
      agentCode,
      password,
      fullname,
      role,
    });
    logger.debug(
      `auth.route - new account created: ` + JSON.stringify(account),
    );

    const user = await authService.login(agentCode, password);
    logger.info("User signup:", user);

    const loginToken = authService.getLoginToken(user);
    res.cookie("loginToken", loginToken, { sameSite: "None", secure: true });
    res.json(user);
  } catch (err) {
    logger.error("Failed to signup " + err);
    res.status(400).send({ err: "Failed to signup" });
  }
}

export async function logout(req, res) {
  try {
    res.clearCookie("loginToken");
    res.send({ msg: "Logged out successfully" });
  } catch (err) {
    res.status(400).send({ err: "Failed to logout" });
  }
}
