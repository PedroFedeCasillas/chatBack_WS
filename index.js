import mongoose from "mongoose";
import { server } from "./src/app.js";
import { DB_HOST, DB_PASSWORD, DB_USER, IP_SERVER, PORT } from "./constants.js";
import { io } from "./src/utils/index.js";

// URL de conexión a MongoDB
const mongoDBUrl = `mongodb+srv://${DB_USER}:${DB_PASSWORD}@${DB_HOST}/`;

// Función para conectar a MongoDB
const connectDB = async () => {
  try {
    await mongoose.connect(mongoDBUrl);
    console.log("Conexión exitosa a MongoDB");

    // Inicia el servidor después de conectar a MongoDB
    server.listen(PORT, () => {
      console.log("#####################");
      console.log("###### API REST #####");
      console.log("#####################");
      console.log(`http://${IP_SERVER}:${PORT}/api`);
    });

    // Configuración de Socket.IO
    io.on("connection", (socket) => {
      console.log("Nuevo usuario conectado");

      socket.on("disconnect", () => {
        console.log("Usuario desconectado");
      });

      socket.on("subscribe", (room) => {
        socket.join(room);
        console.log(`Usuario se unió a la sala: ${room}`);
      });

      socket.on("unsubscribe", (room) => {
        socket.leave(room);
        console.log(`Usuario salió de la sala: ${room}`);
      });
    });
  } catch (error) {
    console.error("Error al conectar a MongoDB:", error.message);
    process.exit(1); // Detiene la aplicación si hay un error
  }
};

// Llama a la función para conectar a la base de datos
connectDB();
