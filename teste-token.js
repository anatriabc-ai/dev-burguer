const { MercadoPagoConfig, Preference } = require("mercadopago");

// 1. COLE SEU TOKEN ABAIXO (Verifique se não há espaços extras)
const client = new MercadoPagoConfig({
    accessToken: "APP_USR-3623918123628013-122722-fd2f7d19cc7c28e08c2c27ae04328597-3013647524" 
});

const preference = new Preference(client);

console.log("⏳ Iniciando teste de conexão com Mercado Pago...");

preference.create({
    body: {
        items: [{
            title: "Item de Teste",
            unit_price: 1.0,
            quantity: 1,
            currency_id: "BRL"
        }],
        back_urls: {
            success: "http://localhost:5500"
        }
    }
})
.then(response => {
    console.log("-----------------------------------------");
    console.log("✅ SUCESSO TOTAL!");
    console.log("O seu Token está funcionando perfeitamente.");
    console.log("ID da Preferência gerada:", response.id);
    console.log("-----------------------------------------");
})
.catch(error => {
    console.log("-----------------------------------------");
    console.log("❌ O TESTE FALHOU!");
    // Aqui ele vai nos dar a resposta real do Mercado Pago
    if (error.message) {
        console.log("MOTIVO DO ERRO:", error.message);
    } else {
        console.log("ERRO DETALHADO:", error);
    }
    console.log("-----------------------------------------");
});