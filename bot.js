const { Telegraf } = require("telegraf");
const axios = require("axios");
const fs = require("fs");
const PDFDocument = require("pdfkit");
const puppeteer = require("puppeteer");

const BOT_TOKEN = "YOUR_BOT_TOKEN"; // توکن ربات تلگرام
const bot = new Telegraf(BOT_TOKEN);

bot.start((ctx) => {
    ctx.reply("سلام! لینک گفتگوی ChatGPT را بفرستید تا آن را به PDF تبدیل کنم.");
});

bot.on("message", async (ctx) => {
    const text = ctx.message.text;
    if (!text.startsWith("https://chat.openai.com/")) {
        return ctx.reply("لطفاً یک لینک معتبر از گفتگوی ChatGPT ارسال کنید.");
    }

    ctx.reply("در حال پردازش لینک... لطفاً کمی صبر کنید ⏳");

    try {
        const browser = await puppeteer.launch({ headless: "new" });
        const page = await browser.newPage();
        
        await page.goto(text, { waitUntil: "networkidle2" });

        const content = await page.evaluate(() => document.body.innerText);
        await browser.close();

        const pdfPath = chat_export_${Date.now()}.pdf;
        const doc = new PDFDocument();
        doc.pipe(fs.createWriteStream(pdfPath));
        doc.fontSize(14).text(content, { align: "right" });
        doc.end();

        ctx.replyWithDocument({ source: pdfPath });

        // حذف فایل بعد از ارسال
        setTimeout(() => fs.unlinkSync(pdfPath), 5000);
    } catch (error) {
        console.error("Error generating PDF:", error);
        ctx.reply("متأسفم! مشکلی در پردازش لینک به وجود آمد.");
    }
});

bot.launch();
console.log("ربات فعال شد! ✅");