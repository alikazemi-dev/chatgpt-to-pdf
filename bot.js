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

    let browser;
    try {
        browser = await puppeteer.launch({ headless: "new" });
        const page = await browser.newPage();

        await page.goto(text, { waitUntil: "networkidle2", timeout: 60000 });

        // استخراج دقیق‌تر محتوای گفتگو
        const content = await page.evaluate(() => {
            const messages = document.querySelectorAll(".text-base");
            return Array.from(messages).map(msg => msg.innerText).join("\n\n");
        });

        await browser.close(); // بستن مرورگر پس از دریافت اطلاعات

        if (!content.trim()) {
            return ctx.reply("متأسفم! نتوانستم محتوای گفتگو را دریافت کنم. لطفاً اطمینان حاصل کنید که لینک صحیح است.");
        }

        const pdfPath = chat_export_${Date.now()}.pdf;
        const doc = new PDFDocument({ margin: 30 });
        const stream = fs.createWriteStream(pdfPath);
        doc.pipe(stream);

        doc.font("Helvetica").fontSize(14).text(content, { align: "right" });
        doc.end();

        stream.on("finish", async () => {
            await ctx.replyWithDocument({ source: pdfPath });
            fs.unlinkSync(pdfPath); // حذف فایل بعد از ارسال
        });

    } catch (error) {
        console.error("Error generating PDF:", error);
        ctx.reply("متأسفم! مشکلی در پردازش لینک به وجود آمد.");
        if (browser) await browser.close();
    }
});

bot.launch();
console.log("ربات فعال شد! ✅");