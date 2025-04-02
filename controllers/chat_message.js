import { ChatMessage } from "../models/chat_message.js";
import { io, getFilePath } from "../utils/index.js";

async function sendText(req, res) {
  try {
    const { chat_id, message } = req.body;
    const { user_id } = req.user;

    const chat_message = new ChatMessage({
      chat: chat_id,
      user: user_id,
      message,
      type: "TEXT",
    });

    // Guardar en la base de datos
    await chat_message.save();

    // Poblar el usuario para enviar datos completos en la respuesta
    const populatedMessage = await chat_message.populate("user");

    // Emitir eventos a los sockets correspondientes
    io.to(chat_id).emit("message", populatedMessage);
    io.to(`${chat_id}_notify`).emit("message_notify", populatedMessage);

    res.status(201).send({ msg: "Mensaje enviado", populatedMessage });
  } catch (error) {
    console.error("Error al enviar mensaje:", error);
    res
      .status(400)
      .send({ msg: "Error al enviar el mensaje", error: error.message });
  }
}

// function sendText(req, res) {
//   const { chat_id, message } = req.body;
//   const { user_id } = req.user;

//   const chat_message = new ChatMessage({
//     chat: chat_id,
//     user: user_id,
//     message,
//     type: "TEXT",
//   });

//   chat_message.save(async (error) => {
//     if (error) {
//       res.status(400).send({ msg: "Error al enviar el mensaje" });
//     } else {
//       const data = await chat_message.populate("user");
//       io.socket.in(chat_id).emit("message", data);
//       io.socket.in(`${chat_id}_notify`).emit("message_notify", data);
//       res.status(201).send({});
//     }
//   });
// }

async function sendImage(req, res) {
  try {
    const { chat_id } = req.body;
    const { user_id } = req.user;

    // Validar que se haya enviado una imagen
    if (!req.files || !req.files.image) {
      return res.status(400).send({ msg: "No se ha enviado ninguna imagen" });
    }

    const imagePath = getFilePath(req.files.image);

    const chat_message = new ChatMessage({
      chat: chat_id,
      user: user_id,
      message: imagePath,
      type: "IMAGE",
    });

    await chat_message.save();
    await chat_message.populate("user");

    // Emitir eventos de socket
    io.to(chat_id).emit("message", chat_message);
    io.to(`${chat_id}_notify`).emit("message_notify", chat_message);

    res.status(201).send({ msg: "Imagen enviada" });
  } catch (error) {
    console.error("Error al enviar imagen:", error);
    res.status(400).send({ msg: "Error al enviar la imagen", error });
  }
}

// function sendImage(req, res) {
//   const { chat_id, message } = req.body;
//   const { user_id } = req.user;

//   const chat_message = new ChatMessage({
//     chat: chat_id,
//     user: user_id,
//     message: getFilePath(req.files.image),
//     type: "IMAGE",
//   });

//   chat_message.save(async (error) => {
//     if (error) {
//       res.status(400).send({ msg: "Error al enviar el mensaje" });
//     } else {
//       const data = await chat_message.populate("user");
//       io.socket.in(chat_id).emit("message", data);
//       io.socket.in(`${chat_id}_notify`).emit("message_notify", data);
//       res.status(201).send({});
//     }
//   });
// }

async function getAll(req, res) {
  const { chat_id } = req.params;

  try {
    const messages = await ChatMessage.find({ chat: chat_id })
      .sort({ createdAt: 1 })
      .populate("user");

    const total = await ChatMessage.countDocuments({ chat: chat_id });

    res.status(200).send({ messages, total });
  } catch (error) {
    console.error("Error al obtener mensajes", error);
    res.status(500).send({ msg: "Error del servidor" });
  }
}

async function getTotalMessages(req, res) {
  const { chat_id } = req.params;

  try {
    // const response = await ChatMessage.find({ chat: chat_id });
    const total = await ChatMessage.countDocuments({ chat: chat_id });

    res.status(200).send(JSON.stringify(total));
  } catch (error) {
    res.status(500).send({ msg: "Error del servidor" });
  }
}

async function getLatMessage(req, res) {
  const { chat_id } = req.params;

  try {
    const response = await ChatMessage.findOne({ chat: chat_id }).sort({
      createdAt: 1,
    });

    res.status(200).send(response || {});
  } catch (error) {
    res.status(500).send({ msg: "Error del servidor" });
  }
}

// async function getTotalMessages(req, res) {
//   res.status(200).send("ok");
// }

export const ChatMessageController = {
  sendText,
  sendImage,
  getAll,
  getTotalMessages,
  getLatMessage,
};
