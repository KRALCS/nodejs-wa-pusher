const {Client} = require("whatsapp-web.js")
const qrcode = require("qrcode")
const express = require('express')
const app = express()
const router = express.Router()
const qr = require('qr-image');
const path = require('path');
const http = require('http');
const server = http.createServer(app);
const { Server } = require("socket.io");
const io = new Server(server);

const client = new Client()

app.set('views', path.join(__dirname, 'views'));
app.set("view engine", "ejs")
app.use(router)
app.use(express.json())

router.get("/", async (req, res) => {
    try {
        res.render('index');
    } catch (error) {
        res.status(500).json({"message": "Sayfa başlatılamadı!"})
    }
})

router.post("/send", async (req, res) => {
    try {
        const {phone, text} = req.body
        sendMessage(phone, text)
        res.status(201).json({"message": "İşlem başarılı"})
    } catch (error) {
        res.status(500).json({"message": "İşlem yapılamadı"})
    }
    try {
        res.render('index');
    } catch (error) {
        res.status(500).json({"message": "Sayfa başlatılamadı!"})
    }
})

server.listen(3000, async () => {
    console.log("Server started on port 3000")
    await connectToDb()
});

const connectToDb = async () => {
    try {

        await client.initialize()

        client.on("qr", async (qr) => {
            console.log('QR alındı, istemcilere gönderiliyor...');
            // qrcode kütüphanesi ile QR kodunu bir resim (data URL) formatına dönüştür
            const qrImage = await qrcode.toDataURL(qr);
            // Bağlı olan tüm istemcilere 'qrCodeUpdate' olayı ile yeni QR kodunu gönder
            io.emit('qrCodeUpdate', qrImage);
        })

        client.on("ready", async (eventName, listener) => {
            console.log('WhatsApp İstemcisi hazır!');
            // QR kodu artık gerekmediği için temizlenebilir
            io.emit('qrCodeUpdate', 'ready');
            client.off("qr", listener)
        })

        client.on("message", (message) => {
            console.log(message)
        })
    } catch (e) {
        console.log("DB'ye bağlantı kurulamadı" + e)
    }
}

function sendMessage(phone, text) {
    client.isRegisteredUser(phone + "@c.us").then(function(isRegistered) {
        if(isRegistered) {
            client.sendMessage(phone + "@c.us", text).then((result) => {
                console.log(result)
            }).catch((err) => {
                console.log(err)
            });
        } else {
            console.log("WA Kullanıcısı değil!!!")
        }
    })
}