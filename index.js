/*gpt
import express from "express";
import bodyParser from "body-parser";
import dotenv from "dotenv";
import OpenAI from "openai";

dotenv.config();

const app = express();

// Twilio manda datos como x-www-form-urlencoded
app.use(bodyParser.urlencoded({ extended: false }));

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Ruta para verificar que el server está vivo
app.get("/", (req, res) => {
  res.send("Servidor activo ");
});

// ESTA RUTA es la que Twilio va a llamar (webhook)
app.post("/whatsapp", async (req, res) => {
  try {
    // Texto que mandaste desde WhatsApp
    const incomingText = req.body.Body || "";

    console.log("Mensaje recibido:", incomingText);

    // Llamada a OpenAI
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: "Eres un asistente útil y claro." },
        { role: "user", content: incomingText },
      ],
    });

    const reply = completion.choices[0].message.content;

    console.log("Respuesta GPT:", reply);

    // Twilio necesita respuesta en XML (TwiML)
    res.set("Content-Type", "text/xml");
    res.send(`
      <Response>
        <Message>${reply}</Message>
      </Response>
    `);
  } catch (error) {
    console.error("Error:", error);

    res.set("Content-Type", "text/xml");
    res.send(`
      <Response>
        <Message>Ocurrió un error  revisa tu API Key o consola.</Message>
      </Response>
    `);
  }
});

// Iniciar servidor
app.listen(3000, () => {
  console.log("Servidor listo en http://localhost:3000");
});
*/

import express from "express";  
import bodyParser from "body-parser";  
import dotenv from "dotenv";  
import { GoogleGenerativeAI } from "@google/generative-ai";  
  
dotenv.config();  
  
const app = express();  
app.use(bodyParser.urlencoded({ extended: false }));  
  
// Cliente Gemini  
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);  
  
app.get("/", (req, res) => {  
  res.send("Servidor activo con Gemini ");  
});  
  
app.post("/whatsapp", async (req, res) => {  
  try {  
    const incomingText = req.body.Body || "";  
  
    console.log("Mensaje recibido:", incomingText);  
  
      
    //const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });  
    // Cambia a Flash-Lite para tener 1,000 mensajes al día  
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash-lite" });  
  
    const result = await model.generateContent(incomingText);  
      
  
    const reply = result.response.text();  
  
    console.log("Respuesta Gemini:", reply);  
  
    res.set("Content-Type", "text/xml");  
    res.send(`  
      <Response>  
        <Message>${reply}</Message>  
      </Response>  
    `);  
  } catch (error) {  
    console.error("Error:", error);  
  
    res.set("Content-Type", "text/xml");  
    res.send(`  
      <Response>  
        <Message>Ocurrió un error  revisa la consola.</Message>  
      </Response>  
    `);  
  }  
});  
  
const PORT = process.env.PORT || 8080;  
  
app.listen(PORT, () => {  
  console.log(`Servidor listo en puerto ${PORT}`);  
    
});  

//local
/*app.listen(3000, () => {
  console.log("Servidor listo en http://localhost:3000");
});*/
