import { Group, GroupMessage, User } from "../models/index.js";
import { getFilePath } from "../utils/index.js";

// function create(req, res) {
//   const group = new Group(req.body);
//   group.creator = req.user.user_id;
//   group.participants = JSON.parse(req.body.participants);

//   if (req.files.image) {
//     const imagePath = getFilePath(req.files.image);
//     group.image = imagePath;
//   }

//   group.save((error, groupStorage) => {
//     if (error) {
//       res.status(500).send({ msg: "Error del servidor" });
//     } else {
//       if (!groupStorage) {
//         res.status(400).send({ msg: "Error al crear el grupo" });
//       } else {
//         res.status(201).send(groupStorage);
//       }
//     }
//   });
// }

async function create(req, res) {
  const { user_id } = req.user;

  try {
    const group = new Group(req.body);
    group.creator = user_id;

    // Verificar si 'participants' está definido y es válido
    let participants = [];
    if (req.body.participants) {
      try {
        participants = JSON.parse(req.body.participants);
      } catch (error) {
        return res
          .status(400)
          .send({ msg: "Formato de participantes inválido" });
      }
    }

    // Asegurar que el creador del grupo también sea un participante
    if (!participants.includes(user_id)) {
      participants.push(user_id);
    }

    group.participants = participants;

    // Manejo seguro de la imagen
    if (req.files?.image) {
      const imagePath = getFilePath(req.files.image);
      group.image = imagePath;
    }

    // Guardar en la base de datos usando `await` en lugar de callback
    const groupStorage = await group.save();
    res.status(201).send(groupStorage);
  } catch (error) {
    console.error("Error inesperado:", error);
    res.status(500).send({ msg: "Error del servidor", error: error.message });
  }
}

async function getAll(req, res) {
  const { user_id } = req.user;

  try {
    // Obtener los grupos donde el usuario es participante
    const groups = await Group.find({ participants: user_id })
      .populate("creator")
      .populate("participants")
      .exec();

    // Mapear grupos y obtener el último mensaje
    const arrayGroups = await Promise.all(
      groups.map(async (group) => {
        const lastMessage = await GroupMessage.findOne({ group: group._id })
          .sort({ createdAt: -1 })
          .exec();

        return {
          ...group.toObject(),
          last_message_date: lastMessage?.createdAt || null,
        };
      })
    );

    res.status(200).send(arrayGroups);
  } catch (error) {
    console.error("Error al obtener grupos:", error);
    res.status(500).send({ msg: "Error al obtener grupos" });
  }
}

// function getGroup(req, res) {
//   const group_id = req.params.id;

//   Group.findById(group_id, (error, groupStorage) => {
//     if (error) {
//       res.status(500).send({ msg: "Error del servidor" });
//     } else {
//       if (!groupStorage) {
//         res.status(400).send({ msg: "No se ha encontrado el grupo" });
//       } else {
//         res.status(201).send(groupStorage);
//       }
//     }
//   }).populate("participants");
// }

async function getGroup(req, res) {
  const { id: group_id } = req.params;

  try {
    const groupStorage = await Group.findById(group_id).populate(
      "participants"
    );

    if (!groupStorage) {
      return res.status(404).send({ msg: "No se ha encontrado el grupo" });
    }

    res.status(200).send(groupStorage);
  } catch (error) {
    console.error("Error al obtener el grupo:", error);
    res.status(500).send({ msg: "Error del servidor", error: error.message });
  }
}

async function updateGroup(req, res) {
  const { id } = req.params;
  const { name } = req.body;

  try {
    // Buscar el grupo
    const group = await Group.findById(id);
    if (!group) {
      return res.status(404).send({ msg: "Grupo no encontrado" });
    }

    // Actualizar nombre si se proporciona
    if (name) {
      group.name = name;
    }

    // Actualizar imagen si se proporciona
    if (req.files?.image) {
      const imagePath = getFilePath(req.files.image);
      group.image = imagePath;
    }

    // Guardar los cambios
    const updatedGroup = await group.save();

    res.status(200).send({
      msg: "Grupo actualizado con éxito",
      name: updatedGroup.name,
      image: updatedGroup.image,
    });
  } catch (error) {
    console.error("Error al actualizar el grupo:", error);
    res.status(500).send({ msg: "Error del servidor", error: error.message });
  }
}

async function exitGroup(req, res) {
  const { id } = req.params;
  const { user_id } = req.user;

  try {
    // Buscar el grupo
    const group = await Group.findById(id);
    if (!group) {
      return res.status(404).send({ msg: "Grupo no encontrado" });
    }

    // Verificar si el usuario está en el grupo
    if (!group.participants.includes(user_id)) {
      return res.status(400).send({ msg: "No eres miembro de este grupo" });
    }

    // Filtrar participantes para eliminar al usuario
    group.participants = group.participants.filter(
      (participant) => participant.toString() !== user_id
    );

    // Guardar cambios
    await group.save();

    res.status(200).send({ msg: "Salida exitosa" });
  } catch (error) {
    console.error("Error al salir del grupo:", error);
    res.status(500).send({ msg: "Error del servidor", error: error.message });
  }
}

async function addParticipants(req, res) {
  const { id } = req.params;
  const { users_id } = req.body; // `users_id` debe ser un array

  try {
    // Buscar el grupo
    const group = await Group.findById(id);
    if (!group) {
      return res.status(404).send({ msg: "Grupo no encontrado" });
    }

    // Verificar si `users_id` es un array y no está vacío
    if (!Array.isArray(users_id) || users_id.length === 0) {
      return res.status(400).send({ msg: "Lista de usuarios inválida" });
    }

    // Buscar usuarios en la base de datos
    const users = await User.find({ _id: { $in: users_id } });

    // Verificar si se encontraron todos los usuarios
    if (users.length !== users_id.length) {
      return res.status(400).send({ msg: "Uno o más usuarios no existen" });
    }

    // Agregar nuevos participantes evitando duplicados
    const updatedParticipants = [
      ...new Set([
        ...group.participants.map((id) => id.toString()),
        ...users.map((user) => user._id.toString()),
      ]),
    ];

    // Actualizar el grupo
    const updatedGroup = await Group.findByIdAndUpdate(
      id,
      { participants: updatedParticipants },
      { new: true }
    );

    res.status(200).send({
      msg: "Participantes añadidos correctamente",
      group: updatedGroup,
    });
  } catch (error) {
    console.error("Error al agregar participantes:", error);
    res.status(500).send({ msg: "Error del servidor", error: error.message });
  }
}

async function banParticipant(req, res) {
  const { group_id, user_id } = req.body;

  try {
    // Buscar el grupo
    const group = await Group.findById(group_id);
    if (!group) {
      return res.status(404).send({ msg: "Grupo no encontrado" });
    }

    // Verificar si el usuario es parte del grupo
    if (!group.participants.includes(user_id)) {
      return res.status(400).send({ msg: "El usuario no está en el grupo" });
    }

    // Filtrar al usuario baneado
    const updatedParticipants = group.participants.filter(
      (participant) => participant.toString() !== user_id
    );

    // Actualizar el grupo en la base de datos
    const updatedGroup = await Group.findByIdAndUpdate(
      group_id,
      { participants: updatedParticipants },
      { new: true }
    );

    res
      .status(200)
      .send({ msg: "Usuario baneado con éxito", group: updatedGroup });
  } catch (error) {
    console.error("Error al banear usuario:", error);
    res.status(500).send({ msg: "Error del servidor", error: error.message });
  }
}

// async function banParticipant(req, res) {
//   const { group_id, user_id } = req.body;

//   const group = await Group.findById(group_id);

//   const newParticipants = group.participants.filter(
//     (participant) => participant.toString() !== user_id
//   );

//   const newData = {
//     ...Group._doc,
//     participants: newParticipants,
//   };

//   await Group.findByIdAndupdate(group_id, newData);

//   res.status(200).send({ msg: "Banea con  exito" });
// }

// function create(req, res) {
//   res.status(200).send("ok");
// }  ["67bce010e53b4dbd6a9bed8c", "67bce01de53b4dbd6a9bed8e", "67bce028e53b4dbd6a9bed90"]

export const GroupController = {
  create,
  getAll,
  getGroup,
  updateGroup,
  exitGroup,
  addParticipants,
  banParticipant,
};
