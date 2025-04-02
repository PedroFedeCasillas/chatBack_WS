import { Chat, ChatMessage } from "../models/index.js";

async function create(req, res) {
  try {
    const { participant_id_one, participant_id_two } = req.body;

    // Validar que los IDs sean diferentes
    if (participant_id_one === participant_id_two) {
      return res
        .status(400)
        .json({ msg: "No puedes crear un chat contigo mismo" });
    }

    // Verificar si ya existe un chat entre estos dos participantes
    const existingChat = await Chat.findOne({
      $or: [
        {
          participant_one: participant_id_one,
          participant_two: participant_id_two,
        },
        {
          participant_one: participant_id_two,
          participant_two: participant_id_one,
        },
      ],
    });

    if (existingChat) {
      return res.status(200).json({
        msg: "Ya tienes un chat con este usuario",
        chat: existingChat,
      });
    }

    // Crear nuevo chat
    const chat = new Chat({
      participant_one: participant_id_one,
      participant_two: participant_id_two,
    });

    const chatStorage = await chat.save();

    res.status(201).json({ msg: "Chat creado con éxito", chat: chatStorage });
  } catch (error) {
    res.status(500).json({ msg: "Error al crear el chat", error });
  }
}

async function getAll(req, res) {
  const { user_id } = req.user;

  try {
    // Buscar chats del usuario
    const chats = await Chat.find({
      $or: [{ participant_one: user_id }, { participant_two: user_id }],
    })
      .populate("participant_one")
      .populate("participant_two");

    const arrayChats = [];

    for await (const chat of chats) {
      const response = await ChatMessage.findOne({ chat: chat._id }).sort({
        createdAt: -1,
      });

      arrayChats.push({
        ...chat._doc,
        last_message_date: response?.createdAt || null,
      });
    }

    res.status(200).send(arrayChats);
  } catch (error) {
    console.error("Error al obtener los chats:", error);
    res.status(500).send({ msg: "Error del servidor" });
  }
}

async function deleteChat(req, res) {
  try {
    const { id } = req.params;

    const deletedChat = await Chat.findByIdAndDelete(id);

    if (!deletedChat) {
      return res.status(404).json({ message: "Chat no encontrado" });
    }

    res
      .status(200)
      .json({ message: "Chat eliminado correctamente", deletedChat });
  } catch (error) {
    console.error("Error al eliminar el chat:", error.message);
    res.status(500).json({ message: "Error interno del servidor" });
  }
}

async function getChat(req, res) {
  try {
    const { id: chat_id } = req.params;

    // Busca el chat en la base de datos
    const chat = await Chat.findById(chat_id)
      .populate("participant_one")
      .populate("participant_two");

    if (!chat) {
      return res.status(404).json({ msg: "Chat no encontrado" });
    }

    res.status(200).json(chat);
  } catch (error) {
    res.status(500).json({ msg: "Error al obtener el chat", error });
  }
}

export const ChatController = {
  create,
  getAll,
  deleteChat,
  getChat,
};
