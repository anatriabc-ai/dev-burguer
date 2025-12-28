const menu = document.getElementById("menu");
const cartBtn = document.getElementById("cart-btn");
const cartModal = document.getElementById("cart-modal");
const cartItemsContainer = document.getElementById("cart-items");
const cartSubtotal = document.getElementById("cart-subtotal");
const cartTotal = document.getElementById("cart-total");
const checkoutBtn = document.getElementById("checkout-btn");
const closeModalBtn = document.getElementById("close-modal-btn");
const cartCount = document.getElementById("cart-count");
const addressInput = document.getElementById("address");
const addressWarn = document.getElementById("address-warn");
const btnDelivery = document.getElementById("btn-delivery");
const btnPickup = document.getElementById("btn-pickup");
const addressContainer = document.getElementById("address-container");
const deliveryTaxRow = document.getElementById("delivery-tax-row");
const deliveryTaxAmountDisplay = document.getElementById("delivery-tax-amount");
const btnCalcShipping = document.getElementById("calc-shipping");
const shippingInfo = document.getElementById("shipping-info");
const cartSound = document.getElementById("cart-sound");

let cart = [];
let isPickup = false;
let deliveryFee = 0;

const LOJA_COORDS = { lat: -20.4697, lon: -54.6201 }; 
const PRECO_POR_KM = 3.00;

/// script.js
// USE A CHAVE QUE ESTÁ NO TOPO DA SUA IMAGEM (Public Key)
const mp = new MercadoPago('APP_USR-78d44c59-0f51-4248-910b-c67c7ede7e61');

function calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371; 
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
}

btnCalcShipping.addEventListener("click", async () => {
    const address = addressInput.value;
    if (address.length < 5) {
        addressWarn.classList.remove("hidden");
        return;
    }
    addressWarn.classList.add("hidden");
    shippingInfo.textContent = "Calculando...";

    try {
        const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}`);
        const data = await response.json();

        if (data.length > 0) {
            const cLat = parseFloat(data[0].lat);
            const cLon = parseFloat(data[0].lon);
            const dist = calculateDistance(LOJA_COORDS.lat, LOJA_COORDS.lon, cLat, cLon) * 1.15; 
            deliveryFee = dist * PRECO_POR_KM;
            shippingInfo.textContent = `Distância: ${dist.toFixed(1)}km | Frete: R$ ${deliveryFee.toFixed(2)}`;
            updateCartModal();
        } else {
            shippingInfo.textContent = "Endereço não encontrado!";
        }
    } catch (err) {
        shippingInfo.textContent = "Erro ao conectar com o mapa.";
    }
});

btnDelivery.addEventListener("click", () => {
    isPickup = false;
    addressContainer.classList.remove("hidden");
    deliveryTaxRow.classList.remove("hidden");
    btnDelivery.classList.add("bg-green-500", "text-white");
    btnPickup.classList.remove("bg-green-500", "text-white");
    updateCartModal();
});

btnPickup.addEventListener("click", () => {
    isPickup = true;
    deliveryFee = 0;
    addressContainer.classList.add("hidden");
    deliveryTaxRow.classList.add("hidden");
    btnPickup.classList.add("bg-green-500", "text-white");
    btnDelivery.classList.remove("bg-green-500", "text-white");
    updateCartModal();
});

cartBtn.addEventListener("click", () => { updateCartModal(); cartModal.style.display = "flex"; });
closeModalBtn.addEventListener("click", () => { cartModal.style.display = "none"; });
cartModal.addEventListener("click", (e) => { if (e.target === cartModal) cartModal.style.display = "none"; });

menu.addEventListener("click", (event) => {
    let parentButton = event.target.closest(".add-to-cart-btn");
    if (parentButton) {
        const name = parentButton.getAttribute("data-name");
        const price = parseFloat(parentButton.getAttribute("data-price"));
        addToCart(name, price);
    }
});

function addToCart(name, price) {
    if (cartSound) { cartSound.currentTime = 0; cartSound.play(); }
    const existingItem = cart.find(item => item.name === name);
    if (existingItem) { existingItem.quantity += 1; }
    else { cart.push({ name, price, quantity: 1 }); }
    updateCartModal();
}

function updateMenuQuantities() {
    document.querySelectorAll(".item-quantity").forEach(span => {
        const name = span.getAttribute("data-name");
        const item = cart.find(i => i.name === name);
        span.textContent = item ? item.quantity : "0";
    });
}

function updateCartModal() {
    cartItemsContainer.innerHTML = "";
    let subtotal = 0;

    cart.forEach(item => {
        subtotal += item.price * item.quantity;
        const div = document.createElement("div");
        div.className = "flex justify-between mb-4 flex-col border-b pb-2";
        div.innerHTML = `
            <div class="flex items-center justify-between">
                <div>
                    <p class="font-bold">${item.name}</p>
                    <p>Qtd: ${item.quantity} x R$ ${item.price.toFixed(2)}</p>
                </div>
                <button class="remove-from-cart-btn text-red-500" data-name="${item.name}">Remover</button>
            </div>`;
        cartItemsContainer.appendChild(div);
    });

    const totalFinal = isPickup ? subtotal : (subtotal > 0 ? subtotal + deliveryFee : 0);

    cartSubtotal.textContent = subtotal.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
    deliveryTaxAmountDisplay.textContent = deliveryFee.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
    cartTotal.textContent = totalFinal.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
    cartCount.textContent = cart.reduce((acc, item) => acc + item.quantity, 0);

    updateMenuQuantities();
}

async function startPaymentProcess() {
    const itemsMP = cart.map(item => ({
        title: item.name,
        unit_price: Number(item.price),
        quantity: Number(item.quantity),
        currency_id: 'BRL'
    }));

    if (!isPickup && deliveryFee > 0) {
        itemsMP.push({
            title: "Taxa de Entrega",
            unit_price: Number(deliveryFee.toFixed(2)),
            quantity: 1,
            currency_id: 'BRL'
        });
    }

    try {
        const response = await fetch("http://localhost:3000/create_preference", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ items: itemsMP })
        });

        if (!response.ok) throw new Error("Erro no servidor de pagamentos");

        const data = await response.json();

        // Abre a janela do Mercado Pago usando o ID gerado pelo servidor
        window.location.href = `https://www.mercadopago.com.br/checkout/v1/redirect?pref_id=${data.id}`;

        return { status: 'check_whatsapp' };

    } catch (error) {
        console.error("Erro no processo:", error);
        return { status: 'error' };
    }
}

checkoutBtn.addEventListener("click", async () => {
    if (cart.length === 0) return;
    if (!isPickup && (addressInput.value === "" || deliveryFee === 0)) {
        alert("Preencha o endereço e calcule o frete!");
        return;
    }

    checkoutBtn.disabled = true;
    checkoutBtn.innerText = "Processando Pagamento...";

    const result = await startPaymentProcess();

    if (result.status === 'check_whatsapp') {
        const itemsMsg = cart.map(i => `*${i.name}* (${i.quantity}x)`).join("\n");
        const msg = encodeURIComponent(
            `🍔 *PEDIDO COM PAGAMENTO ONLINE* 🍔\n\n` +
            `${itemsMsg}\n\n` +
            `*Total:* ${cartTotal.textContent}\n` +
            `*Entrega:* ${isPickup ? "Retirada" : addressInput.value}`
        );
        
        // Pequeno atraso para dar tempo do usuário ver a tela do MP abrir antes do WhatsApp
        setTimeout(() => {
            window.open(`https://wa.me/5511912837867?text=${msg}`, "_blank");
            cart = [];
            updateCartModal();
            cartModal.style.display = "none";
        }, 3000);
        
    } else {
        alert("Erro ao conectar com o servidor de pagamentos.");
    }

    checkoutBtn.disabled = false;
    checkoutBtn.innerText = "Finalizar pedido";
});