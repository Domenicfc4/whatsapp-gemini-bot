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

// 🔥 NUEVO: Cliente Twilio (para enviar mensajes extra)
const twilioClient = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

// Cliente Gemini
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Modelo (mejor crearlo 1 vez, no en cada request)
const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash-lite" });

app.get("/", (req, res) => {
  res.send("Servidor activo con Gemini");
});

// 🔥 NUEVO: función para dividir texto en partes de máximo 1500
function splitMessage(text, maxLen = 1500) {
  const chunks = [];
  let current = "";

  const lines = text.split("\n");

  for (const line of lines) {
    // Si una sola línea es demasiado larga, la partimos en pedazos
    if (line.length > maxLen) {
      if (current.trim()) {
        chunks.push(current.trim());
        current = "";
      }

      for (let i = 0; i < line.length; i += maxLen) {
        chunks.push(line.slice(i, i + maxLen));
      }
      continue;
    }

    // Si agregar esta línea se pasa del límite
    const candidate = current ? current + "\n" + line : line;

    if (candidate.length > maxLen) {
      chunks.push(current.trim());
      current = line;
    } else {
      current = candidate;
    }
  }

  if (current.trim()) chunks.push(current.trim());

  return chunks;
}

app.post("/whatsapp", async (req, res) => {
  const twiml = new MessagingResponse();

  try {
    const incomingText = req.body.Body || "";
    const from = req.body.From; // whatsapp:+51999999999
    const to = req.body.To;     // whatsapp:+14155238886 (Twilio sandbox)

    console.log("Mensaje recibido:", incomingText);

    const result = await model.generateContent(incomingText);
    const reply = result.response.text();

    console.log("Respuesta Gemini:", reply);

    // NUEVO: dividir en chunks en vez de recortar
    const chunks = splitMessage(reply, 1500);

    // 1) Primer mensaje se devuelve en TwiML (inmediato)
    twiml.message(chunks[0] || "…");

    res.type("text/xml");
    res.send(twiml.toString());

    // 2) Los demás se envían por la API de Twilio
    for (let i = 1; i < chunks.length; i++) {
      await twilioClient.messages.create({
        from: to,
        to: from,
        body: chunks[i],
      });
    }
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

if (error?.status === 429) {
  twiml.message("Estoy sin cuota en Gemini 😢 Intenta en 1 minuto o más tarde.");
  res.type("text/xml");
  return res.send(twiml.toString());
}
