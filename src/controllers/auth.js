import bcrypt from "bcrypt";
import { User } from "../models/index.js";
import { jwt } from "../utils/index.js";

async function register(req, res) {
  try {
    const { email, password } = req.body;

    const user = new User({
      email: email.toLowerCase(),
      password,
    });

    const salt = bcrypt.genSaltSync(10);
    const hashPassword = bcrypt.hashSync(password, salt);
    user.password = hashPassword;

    const savedUser = await user.save();
    res.status(201).send(savedUser);
  } catch (error) {
    res.status(400).send({ msg: "Error al registrar el usuario", error });
  }
}

async function login(req, res) {
  try {
    const { email, password } = req.body;

    const emailLowerCase = email.toLowerCase();
    const user = await User.findOne({ email: emailLowerCase });

    if (!user) {
      return res.status(404).send({ msg: "Usuario no encontrado" });
    }

    const isPasswordCorrect = await bcrypt.compare(password, user.password);

    if (!isPasswordCorrect) {
      return res.status(400).send({ msg: "Contraseña incorrecta" });
    }

    res.status(200).send({
      access: jwt.createAccessToken(user),
      refresh: jwt.createRefreshToken(user),
    });
  } catch (error) {
    res.status(500).send({ msg: "Error en el servidor", error });
  }
}

async function refreshAccessToken(req, res) {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(400).send({ msg: "Token requerido" });
    }

    const hasExpired = jwt.hasExpiredToken(refreshToken);
    if (hasExpired) {
      return res.status(400).send({ msg: "Token expirado" });
    }

    const decodedToken = jwt.decoded(refreshToken);
    if (!decodedToken || !decodedToken.user_id) {
      return res.status(400).send({ msg: "Token inválido" });
    }

    const user = await User.findById(decodedToken.user_id);

    if (!user) {
      return res.status(404).send({ msg: "Usuario no encontrado" });
    }

    const newAccessToken = jwt.createAccessToken(user);

    res.status(200).send({ accessToken: newAccessToken });
  } catch (error) {
    res.status(500).send({ msg: "Error del servidor", error });
  }
}

export const AuthController = {
  register,
  login,
  refreshAccessToken,
};
