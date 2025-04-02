import { jwt } from "../utils/index.js";

function asureAuth(req, res, next) {
  if (!req.headers.authorization) {
    return res
      .status(403)
      .send({ msg: "La petición no tiene la cabecera de autenticación" });
  }

  const token = req.headers.authorization.replace("Bearer ", "");

  try {
    const payload = jwt.decoded(token);
    if (payload.exp <= Date.now() / 1000) {
      return res.status(401).send({ msg: "El token ha expirado" });
    }

    req.user = payload;
    // console.log("Usuario autenticado:", req.user);
    next();
  } catch (error) {
    return res.status(401).send({ msg: "Token inválido", error });
  }
}

export const mdAuth = {
  asureAuth,
};
