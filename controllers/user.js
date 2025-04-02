import { Group, User } from "../models/index.js";
import { getFilePath } from "../utils/index.js";

async function getMe(req, res) {
  const { user_id } = req.user; // Se asume que el `user_id` viene del token decodificado

  try {
    const user = await User.findById(user_id).select("-password"); // Excluye el password

    if (!user) {
      return res.status(404).json({ msg: "Usuario no encontrado" });
    }

    res.status(200).json(user);
  } catch (error) {
    res.status(500).json({ msg: "Error al obtener el usuario", error });
  }
}

async function getAllUsers(req, res) {
  const { user_id } = req.user;
  try {
    const users = await User.find({ _id: { $ne: user_id } }).select(
      "-password"
    ); // Obtiene todos los usuarios
    res.status(200).json(users); // Responde con la lista de usuarios
  } catch (error) {
    res.status(500).json({ msg: "Error al obtener los usuarios", error });
  }
}

async function getUserById(req, res) {
  const { id } = req.params; // Obtiene el ID de los parámetros de la URL

  try {
    const user = await User.findById(id).select("-password"); // Busca al usuario por su ID

    if (!user) {
      return res.status(404).json({ msg: "Usuario no encontrado" }); // Si no se encuentra el usuario
    }

    res.status(200).json(user); // Responde con los datos del usuario encontrado
  } catch (error) {
    res.status(500).json({ msg: "Error al obtener el usuario", error });
  }
}

async function updateUser(req, res) {
  try {
    const { user_id } = req.user;
    let userData = { ...req.body };

    if (userData.password) {
      return res
        .status(400)
        .json({ msg: "No puedes actualizar la contraseña desde esta ruta" });
    }

    // Manejar la carga de imagen de avatar
    if (req.files?.avatar) {
      const imagePath = getFilePath(req.files.avatar);
      userData.avatar = imagePath;
    }

    // Actualizar el usuario y devolver el nuevo estado excluyendo la contraseña
    const updatedUser = await User.findByIdAndUpdate(user_id, userData, {
      new: true,
      runValidators: true,
    }).select("-password");

    if (!updatedUser) {
      return res.status(404).json({ msg: "Usuario no encontrado" });
    }

    res.status(200).json({ msg: "Usuario actualizado", user: updatedUser });
  } catch (error) {
    res.status(500).json({ msg: "Error al actualizar el usuario", error });
  }
}

async function getUsersExceptParticipantsGroup(req, res) {
  const { group_id } = req.params;

  try {
    // Buscar el grupo
    const group = await Group.findById(group_id);
    if (!group) {
      return res.status(404).send({ msg: "Grupo no encontrado" });
    }

    // Obtener participantes del grupo
    const participants = group.participants.map((participant) =>
      participant.toString()
    );

    // Buscar usuarios que no sean participantes
    const users = await User.find({ _id: { $nin: participants } }).select(
      "-password"
    );

    if (users.length === 0) {
      return res.status(404).send({ msg: "No hay usuarios disponibles" });
    }

    res.status(200).send(users);
  } catch (error) {
    console.error("Error al obtener usuarios:", error);
    res.status(500).send({ msg: "Error del servidor", error: error.message });
  }
}

export const UserController = {
  getMe,
  getAllUsers,
  getUserById,
  updateUser,
  getUsersExceptParticipantsGroup,
};
