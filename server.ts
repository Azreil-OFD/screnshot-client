import express from "express";
import https from "https";
import fs from "fs";
import path from "path";
import screenshot from "screenshot-desktop";
import { createClient } from "@supabase/supabase-js";
import { decode } from 'base64-arraybuffer';
import TelegramBot from 'node-telegram-bot-api'
const { fileURLToPath, pathToFileURL } = require('url');

const TG_TOKEN = '7474196060:AAFb0ZoTId8eU6lNCiQH9jTFDlc1cuyVPxU'
var api = new TelegramBot(
  TG_TOKEN
);

const supabaseUrl = "https://looxbxluwifqwhambjit.supabase.co";
const supabaseKey =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imxvb3hieGx1d2lmcXdoYW1iaml0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MjE3NzkzNzIsImV4cCI6MjAzNzM1NTM3Mn0.XK1BppceMHXZcbGfUyn2pPsYHpKBbqWO3VkVaD_Mw4o";
const supabase = createClient(supabaseUrl, supabaseKey);

function getFilesystemUrl(filePath: string) {
  const absolutePath = path.resolve(filePath);
  return pathToFileURL(absolutePath).href;
}


supabase
  .channel("custom-insert-channel")
  .on(
    "postgres_changes",
    { event: "INSERT", schema: "public", table: "screenshot" },
    async (payload) => {
      console.log("Change received!", payload);
      try {
        // Создание скриншота
        const imageBuffer = await screenshot();

        // Создание имени файла с таймстампом
        const timestamp = Date.now();
        const filename = `screenshot-${timestamp}.png`;
        const filepath = path.join(__dirname, filename);

        // Сохранение скриншота на диск временно
        fs.writeFileSync(filepath, imageBuffer);
        const resultBuffer = fs.readFileSync(filepath);
        const imageBlob = new Blob([imageBuffer], { type: 'image/png' });

        // Загрузка файла в Supabase Storage
        const { data, error } = await supabase.storage
          .from("screenshot")
          .upload(filename, imageBlob, {
            cacheControl: "3600",
            upsert: false,
          });
        if (error) {
          throw error;
        } else {
          const imgresult = supabase.storage.from('screenshot').getPublicUrl(filename)

          await supabase
            .from('screenshot')
            .update({ url: imgresult.data.publicUrl })
            .eq('id', payload.new.id)
          if (error) {
            throw error;
          }

        }

        console.log("Файл успешно загружен:", data);

        // Удаление временного файла
        fs.unlinkSync(filepath);
      } catch (err: any) {
        console.error("Ошибка:", err.message);
      }
    }
  )
  .subscribe();



supabase.channel('custom-update-channel')
  .on(
    'postgres_changes',
    { event: 'UPDATE', schema: 'public', table: 'screenshot' },
    (payload) => {
      var d = new Date(Date.now());

      api.sendPhoto(
        -1002153663658,
        payload.new.url,
        {
          caption: d.toString()
        }
    )
    }
  )
  .subscribe()
export const app = express();
app.get("/", (req, res) => res.send("Hello World!!"));

const port = 3000;
app.listen(port, () => {
  console.log(`Server is live on http://localhost${port}`);
});
