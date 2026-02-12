import dotenv from "dotenv";
import { GoogleGenerativeAI } from "@google/generative-ai";

dotenv.config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

async function main() {
  try {
    const models = await genAI.listModels();
    console.log("MODELOS DISPONIBLES:");
    console.log(models);
  } catch (error) {
    console.error("Error listando modelos:", error);
  }
}

main();
