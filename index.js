import express from "express";
import bodyParser from "body-parser";
import dotenv from "dotenv";
import twilio from "twilio";
import { GoogleGenerativeAI } from "@google/generative-ai";

dotenv.config();

const app = express();
app.use(bodyParser.urlencoded({ extended: false }));

// Twilio TwiML helper
const MessagingResponse = twilio.twiml.MessagingResponse;

// Cliente Gemini
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Modelo (mejor crearlo 1 vez, no en cada request)
const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash-lite" });

app.get("/", (req, res) => {
  res.send("Servidor activo con Gemini");
});

app.post("/whatsapp", async (req, res) => {
  const twiml = new MessagingResponse();

  try {
    const incomingText = req.body.Body || "";
    console.log("Mensaje recibido:", incomingText);

    const result = await model.generateContent(incomingText);
    let reply = result.response.text();

    console.log("Respuesta Gemini:", reply);

    // Limitar para evitar el error 21617 (1600 caracteres)
    const MAX = 1500;
    if (reply.length > MAX) {
      reply = reply.slice(0, MAX) + "\n\n(Respuesta recortada por límite de WhatsApp)";
    }

    // IMPORTANTE:
    // Usando twiml.message(reply) Twilio se encarga del XML bien formado
    twiml.message(reply);

    res.type("text/xml");
    res.send(twiml.toString());
  } catch (error) {
    console.error("Error:", error);

    twiml.message("Ocurrió un error  Revisa los logs en Railway.");

    res.type("text/xml");
    res.send(twiml.toString());
  }
});

const PORT = process.env.PORT || 8080;

app.listen(PORT, () => {
  console.log(`Servidor listo en puerto ${PORT}`);
});
