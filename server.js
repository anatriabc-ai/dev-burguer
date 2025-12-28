const express = require("express");
const cors = require("cors");
const { MercadoPagoConfig, Preference } = require("mercadopago");

const app = express();
app.use(cors());
app.use(express.json());

// 1. Verifique se este Token começa com APP_USR-
// No server.js, use o Token LONGO (o segundo da sua imagem de credenciais)
// server.js
const client = new MercadoPagoConfig({
    // USE O TOKEN LONGO DA SUA IMAGEM (Access Token)
    accessToken: "APP_USR-2964354954010890-122722-ff68078144112ba0798860d0666921d1-1584154036" 
});

app.post("/create_preference", async (req, res) => {
    try {
        console.log("📦 Criando preferência para os itens:", JSON.stringify(req.body.items));
        
        const preference = new Preference(client);
        
        const result = await preference.create({
            body: {
                items: req.body.items,
                back_urls: {
                    success: "http://127.0.0.1:5500",
                    failure: "http://127.0.0.1:5500",
                    pending: "http://127.0.0.1:5500"
                },
                auto_return: "approved",
                // Isso ajuda a evitar erros de política em algumas contas
                payment_methods: {
                    installments: 12,
                    excluded_payment_types: [],
                    excluded_payment_methods: []
                }
            }
        });

        console.log("✅ Sucesso! ID gerado:", result.id);
        res.json({ id: result.id });

    } catch (error) {
        // Log detalhado para sabermos exatamente o que o Mercado Pago respondeu
        console.error("❌ ERRO NO MERCADO PAGO:", error.message);
        if (error.cause) console.error("Causa do erro:", JSON.stringify(error.cause));
        
        res.status(500).json({ error: "Erro ao criar pagamento", detail: error.message });
    }
});

app.listen(3000, () => {
    console.log("🚀 Servidor rodando em http://localhost:3000");
});