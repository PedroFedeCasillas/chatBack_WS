import { GroupMessage } from "../models/index.js";
import { io, getFilePath } from "../utils/index.js";
import mongoose from "mongoose";

async function sendText(req, res) {
  try {
    const { group_id, message } = req.body;
    const { user_id } = req.user;

    // Crear el mensaje
    const group_message = new GroupMessage({
      group: group_id,
      user: user_id,
      message,
      type: "TEXT",
    });

    // Guardar en la base de datos
    await group_message.save();

    // Poblar el usuario para enviar datos completos en la respuesta
    const populatedMessage = await group_message.populate("user");

    // Emitir el mensaje a los sockets del grupo
    io.to(group_id).emit("message", populatedMessage);
    io.to(`${group_id}_notify`).emit("message_notify", populatedMessage);

    res.status(200).send({ msg: "Mensaje enviado correctamente" });
  } catch (error) {
    console.error("Error al enviar mensaje:", error);
    res.status(500).send({ msg: "Error del servidor", error: error.message });
  }
}

async function sendImage(req, res) {
  try {
    const { group_id } = req.body;
    const { user_id } = req.user;

    // Validar que se haya enviado una imagen
    if (!req.files || !req.files.image) {
      return res.status(400).send({ msg: "No se ha enviado ninguna imagen" });
    }

    const imagePath = getFilePath(req.files.image);

    // Crear el mensaje en la base de datos
    const group_message = new GroupMessage({
      group: group_id,
      user: user_id,
      message: imagePath,
      type: "IMAGE",
    });

    await group_message.save();

    // Poblar el usuario para enviar datos completos
    const populatedMessage = await group_message.populate("user");

    // Emitir eventos de socket
    io.to(group_id).emit("message", populatedMessage);
    io.to(`${group_id}_notify`).emit("message_notify", populatedMessage);

    // io.socket.in(group_id).emit("message", populatedMessage);
    // io.socket.in(`${group_id}_notify`).emit("message_notify", populatedMessage);

    res.status(201).send({ msg: "Imagen enviada", message: populatedMessage });
  } catch (error) {
    console.error("Error al enviar imagen:", error);
    res.status(500).send({ msg: "Error del servidor", error: error.message });
  }
}

async function getAll(req, res) {
  const { group_id } = req.params;

  try {
    const messages = await GroupMessage.find({ group: group_id })
      .sort({ createdAt: 1 })
      .populate("user");

    const total = await GroupMessage.countDocuments({ group: group_id });

    res.status(200).send({ messages, total });
  } catch (error) {
    console.error("Error al obtener mensajes", error);
    res.status(500).send({ msg: "Error del servidor" });
  }
}

async function getTotalMessages(req, res) {
  const { group_id } = req.params;

  try {
    const total = await GroupMessage.countDocuments({ group: group_id });

    res.status(200).send(JSON.stringify(total));
  } catch (error) {
    res.status(500).send({ msg: "Error del servidor" });
  }
}

async function getLatMessage(req, res) {
  const { group_id } = req.params;

  // Validar si el group_id es un ObjectId válido
  if (!mongoose.Types.ObjectId.isValid(group_id)) {
    return res.status(400).send({ msg: "ID de grupo inválido" });
  }

  try {
    const response = await GroupMessage.findOne({ group: group_id })
      .sort({ createdAt: -1 })
      .populate("user");

    res.status(200).send(response || {});
  } catch (error) {
    console.error("Error al obtener mensajes", error);
    res.status(500).send({ msg: "Error del servidor" });
  }
}

export const GroupMessageController = {
  sendText,
  sendImage,
  getAll,
  getTotalMessages,
  getLatMessage,
};
