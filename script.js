import { initializeApp } from "https://www.gstatic.com/firebasejs/10.0.0/firebase-app.js";
import { 
    getFirestore, collection, onSnapshot, query, addDoc, doc, getDoc 
} from "https://www.gstatic.com/firebasejs/10.0.0/firebase-firestore.js";

// CONFIGURAÇÃO FIREBASE
const firebaseConfig = {
    apiKey: "AIzaSyCXkmrC3qxbLUdBdZYeko-088BdrzXn9MQ",
    authDomain: "devburguer-58615.firebaseapp.com",
    projectId: "devburguer-58615",
    storageBucket: "devburguer-58615.firebasestorage.app",
    messagingSenderId: "235441722898",
    appId: "1:235441722898:web:de9abf01add7e68a59eacb"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// SELEÇÃO DE ELEMENTOS
const cartBtn = document.getElementById("cart-btn");
const cartModal = document.getElementById("cart-modal");
const cartItemsContainer = document.getElementById("cart-items");
const cartTotal = document.getElementById("cart-total");
const cartSubtotal = document.getElementById("cart-subtotal");
const checkoutBtn = document.getElementById("checkout-btn");
const closeModalBtn = document.getElementById("close-modal-btn");
const cartCount = document.getElementById("cart-count");
const addressInput = document.getElementById("address");
const cartAudio = document.getElementById("cart-sound");
const deliveryTaxAmountDisplay = document.getElementById("delivery-tax-amount");
const btnDelivery = document.getElementById("btn-delivery");
const btnPickup = document.getElementById("btn-pickup");
const addressContainer = document.getElementById("address-container");
const pickupOptionsContainer = document.getElementById("pickup-options-container");
const btnPickupSelf = document.getElementById("btn-pickup-self");
const btnPickupApp = document.getElementById("btn-pickup-app");
const searchInput = document.querySelector('input[type="text"]'); 
const calcShippingBtn = document.getElementById("calc-shipping-btn");
const shippingValueDisplay = document.getElementById("shipping-value-display");
const addressWarn = document.getElementById("address-warn");

let cart = [];
let isPickup = false;
let deliveryFee = 0; 
let allProducts = []; 
let pickupMethod = "";

// 1. CARREGAR PRODUTOS DO FIREBASE
function loadProducts() {
    const q = query(collection(db, "produtos"));
    onSnapshot(q, (snapshot) => {
        allProducts = snapshot.docs.map(doc => doc.data()); 
        renderProducts(allProducts); 
    });
}

function renderProducts(productsToRender) {
    const savoryContainer = document.getElementById("savory-section");
    const drinkContainer = document.getElementById("drinks-section");
    const candyContainer = document.getElementById("candy-section"); 
    const combinationContainer = document.getElementById("combination-section");

    // Limpa os containers
    if(savoryContainer) savoryContainer.innerHTML = "";
    if(drinkContainer) drinkContainer.innerHTML = "";
    if(candyContainer) candyContainer.innerHTML = "";
    if(combinationContainer) combinationContainer.innerHTML = "";

    productsToRender.forEach(product => {
        const productHTML = `
            <div class="flex gap-4 p-3 bg-white rounded-2xl shadow-sm hover:shadow-md transition-all border border-gray-100 group">
                <div class="relative overflow-hidden rounded-xl h-28 w-28 shrink-0 bg-gray-100">
                    <img src="${product.image}" alt="${product.name}" class="w-full h-full object-cover group-hover:scale-110 duration-500" onerror="this.src='assets/hamb-1.png'"/>
                </div>
                <div class="flex-1 flex flex-col justify-between">
                    <div>
                        <p class="font-bold text-gray-800 text-lg">${product.name}</p>
                        <p class="text-sm text-gray-500 line-clamp-2">${product.description || ''}</p>
                    </div>
                    <div class="flex items-center justify-between mt-2">
                        <p class="font-extrabold text-xl text-green-600">R$ ${Number(product.price).toFixed(2)}</p>
                        <div class="flex items-center bg-gray-100 rounded-full p-1 gap-3 border border-gray-200">
                            <button class="bg-white text-red-500 w-8 h-8 rounded-full flex items-center justify-center shadow-sm active:scale-90 transition-all remove-from-menu-btn" data-name="${product.name}">
                                <i class="fa fa-minus text-xs"></i>
                            </button>
                            <span class="font-bold text-base min-w-[20px] text-center item-quantity text-gray-800" data-name="${product.name}">0</span>
                            <button class="bg-zinc-900 text-white w-8 h-8 rounded-full flex items-center justify-center shadow-md active:scale-90 transition-all add-to-cart-btn" data-name="${product.name}" data-price="${product.price}">
                                <i class="fa fa-plus text-xs"></i>
                            </button>
                        </div>
                    </div>
                </div>
            </div>`;

                // Pega o valor exato que vem do seu <select> (savory, candy, combination, drinks)
        const cat = (product.category || "").toLowerCase().trim();

        if (cat === "candy") {
            if(candyContainer) candyContainer.innerHTML += productHTML;
        } 
        else if (cat === "drinks") {
            if(drinkContainer) drinkContainer.innerHTML += productHTML;
        } 
        else if (cat === "combination") {
            if(combinationContainer) combinationContainer.innerHTML += productHTML;
        } 
        else {
            // Se for "savory" ou qualquer outra coisa, cai em Salgados
            if(savoryContainer) savoryContainer.innerHTML += productHTML;
        }
            });

            updateCartQuantities();
        }


// 2. BUSCA DE PRODUTOS
if(searchInput) {
    searchInput.addEventListener("input", (e) => {
        const term = e.target.value.toLowerCase();
        const filtered = allProducts.filter(p => 
            p.name.toLowerCase().includes(term) || 
            (p.description && p.description.toLowerCase().includes(term))
        );
        renderProducts(filtered);
    });
}

// 3. MONITORAR STATUS, LOGO E BANNER
function monitorarStatusLoja() {
    const spanItem = document.getElementById("date-span");
    const spanText = document.getElementById("span-text");
    const logoHeader = document.getElementById("header-logo"); 
    const headerBg = document.getElementById("header-bg");
    const videoElement = document.getElementById("bg-video");
    const videoSource = document.getElementById("video-source");
    onSnapshot(doc(db, "configuracoes", "status_loja"), (snapshot) => {
        if (snapshot.exists()) {
            const data = snapshot.data();
            
            if(data.logoUrl && logoHeader) {
                logoHeader.src = data.logoUrl;
            }

            if(data.bgUrl) {
                const url = data.bgUrl.toString();
                const isVideo = url.includes("video/mp4") || url.startsWith("data:video") || url.toLowerCase().endsWith(".mp4");

                if (isVideo && videoElement && videoSource) {
                    headerBg.style.backgroundImage = "none";
                    videoElement.classList.remove("hidden");
                    videoElement.style.display = "block";
                    
                    if (videoSource.src !== url) {
                        videoSource.src = url;
                        videoElement.load();
                        videoElement.play().catch(() => console.log("Autoplay aguardando interação."));
                    }
                } else {
                    if(videoElement) {
                        videoElement.style.display = "none";
                        videoElement.classList.add("hidden");
                    }
                    headerBg.style.backgroundImage = `url('${url}')`;
                    headerBg.style.backgroundSize = "cover";
                    headerBg.style.backgroundPosition = "center";
                }
            }
            
            if (data.aberto === true || data.aberto === "true") { 
                spanItem?.classList.remove("bg-red-500");
                spanItem?.classList.add("bg-green-600");
                if(spanText) spanText.innerText = "ABERTO: Seg á Dom - 18:00 as 22:00";
            } else {
                spanItem?.classList.remove("bg-green-600");
                spanItem?.classList.add("bg-red-500");
                if(spanText) spanText.innerText = "FECHADO NO MOMENTO";
            }
        }
    });
}

// 4. LÓGICA DO CARRINHO (ADICIONAR/REMOVER)
document.addEventListener("click", (event) => {
    let addBtn = event.target.closest(".add-to-cart-btn");
    if (addBtn) {
        const name = addBtn.getAttribute("data-name");
        const price = parseFloat(addBtn.getAttribute("data-price"));
        if(cartAudio) { cartAudio.currentTime = 0; cartAudio.play(); }
        addToCart(name, price);
    }

    let removeBtn = event.target.closest(".remove-from-menu-btn");
    if (removeBtn) {
        const name = removeBtn.getAttribute("data-name");
        removeItemCart(name);
    }
});

function addToCart(name, price) {
    const existingItem = cart.find(item => item.name === name);
    if (existingItem) { existingItem.quantity += 1; } 
    else { cart.push({ name, price, quantity: 1 }); }
    updateCartModal();
}

function removeItemCart(name) {
    const index = cart.findIndex(item => item.name === name);
    if (index !== -1) {
        if (cart[index].quantity > 1) { cart[index].quantity -= 1; } 
        else { cart.splice(index, 1); }
        updateCartModal();
    }
}

function updateCartModal() {
    cartItemsContainer.innerHTML = "";
    let subtotalValue = 0;

    cart.forEach(item => {
        subtotalValue += item.price * item.quantity;
        const div = document.createElement("div");
        div.className = "flex justify-between mb-4 flex-col border-b pb-2";
        div.innerHTML = `
            <div class="flex items-center justify-between">
                <div>
                    <p class="font-bold">${item.name}</p>
                    <p>${item.quantity}x - R$ ${item.price.toFixed(2)}</p>
                </div>
                <button class="text-red-500 font-medium remove-from-cart-btn" data-name="${item.name}">Remover</button>
            </div>`;
        cartItemsContainer.appendChild(div);
    });

    const currentFee = isPickup ? 0 : (cart.length > 0 ? deliveryFee : 0);
    const totalFinal = subtotalValue + currentFee;

    if(cartSubtotal) cartSubtotal.textContent = subtotalValue.toLocaleString("pt-BR", {style: "currency", currency: "BRL"});
    if(deliveryTaxAmountDisplay) deliveryTaxAmountDisplay.textContent = currentFee.toLocaleString("pt-BR", {style: "currency", currency: "BRL"});
    if(cartTotal) cartTotal.textContent = totalFinal.toLocaleString("pt-BR", {style: "currency", currency: "BRL"});
    if(cartCount) cartCount.textContent = cart.reduce((acc, item) => acc + item.quantity, 0);
    
    updateCartQuantities();
}

cartItemsContainer.addEventListener("click", (event) => {
    if(event.target.classList.contains("remove-from-cart-btn")){
        const name = event.target.getAttribute("data-name");
        removeItemCart(name);
    }
})

function updateCartQuantities() {
    document.querySelectorAll(".item-quantity").forEach(span => {
        const name = span.getAttribute("data-name");
        const item = cart.find(i => i.name === name);
        if (item) {
            span.textContent = item.quantity;
            span.classList.add("text-green-600");
        } else {
            span.textContent = "0";
            span.classList.remove("text-green-600");
        }
    });
}

// 5. LÓGICA DE ENTREGA / RETIRADA
if(btnPickup){
    btnPickup.addEventListener("click", () => {
        isPickup = true;
        btnPickup.classList.add("bg-green-500", "text-white");
        btnDelivery.classList.remove("bg-green-500", "text-white");
        addressContainer.classList.add("hidden");
        pickupOptionsContainer.classList.remove("hidden");
        updateCartModal();
    });
}

// Exemplo de como ajustar no script.js para o iPhone reconhecer a troca de cor
if(btnDelivery){
    btnDelivery.addEventListener("click", () => {
        isPickup = false;
        // Adicionando bordas explícitas para o iOS destacar o botão selecionado
        btnDelivery.classList.add("bg-green-500", "text-white", "border-green-600");
        btnPickup.classList.remove("bg-green-500", "text-white", "border-green-600");
        btnPickup.classList.add("bg-white", "text-gray-800", "border-gray-300");
        
        addressContainer.classList.remove("hidden");
        pickupOptionsContainer.classList.add("hidden");
        updateCartModal();
    });
}

if(btnPickupSelf) btnPickupSelf.addEventListener("click", () => { pickupMethod = "O próprio cliente"; btnPickupSelf.classList.add("bg-green-500", "text-white"); btnPickupApp.classList.remove("bg-green-500", "text-white"); });
if(btnPickupApp) btnPickupApp.addEventListener("click", () => { pickupMethod = "Motorista de App (Uber/99)"; btnPickupApp.classList.add("bg-green-500", "text-white"); btnPickupSelf.classList.remove("bg-green-500", "text-white"); });

if (calcShippingBtn) {
    calcShippingBtn.addEventListener("click", async (event) => {
        // Previne qualquer comportamento padrão do botão no mobile
        event.preventDefault(); 

        if (addressInput.value === "") { 
            addressWarn.classList.remove("hidden"); 
            return; 
        }

        const enderecoCliente = addressInput.value;
        const minhaLat = -23.647524;
        const minhaLon = -46.570151;

        try {
            calcShippingBtn.disabled = true;
            calcShippingBtn.innerText = "Calculando...";
            
            // Alterado para garantir HTTPS e adicionado cabeçalho de User-Agent (exigido por algumas redes móveis)
            const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(enderecoCliente)}`, {
                method: 'GET',
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) throw new Error("Erro na rede");

            const data = await response.json();

            if (data && data.length > 0) {
                const distancia = calcularDistanciaKM(minhaLat, minhaLon, parseFloat(data[0].lat), parseFloat(data[0].lon));
                
                // Lógica de preço
                const hora = new Date().getHours();
                let precoPorKm = (hora >= 15) ? 6.80 : 4.45;

                deliveryFee = Math.max(8.00, distancia * precoPorKm);
                
                // Atualiza a interface
                updateCartModal();
                shippingValueDisplay.classList.remove("hidden");
                shippingValueDisplay.innerText = `Distância: ${distancia.toFixed(2)}km | Frete: R$ ${deliveryFee.toFixed(2)}`;
                addressWarn.classList.add("hidden");
                
                // No celular, dar um pequeno scroll para o usuário ver o valor
                shippingValueDisplay.scrollIntoView({ behavior: 'smooth', block: 'center' });

            } else { 
                alert("Endereço não encontrado. Tente incluir a cidade (SCS ou São Caetano)."); 
            }
        } catch (e) { 
            console.error("Erro no cálculo:", e);
            alert("Erro ao conectar com o serviço de mapas. Verifique sua internet."); 
        } finally { 
            calcShippingBtn.disabled = false;
            calcShippingBtn.innerText = "Calcular"; 
        }
    });
}
// 6. MODAL CONTROLES
cartBtn.addEventListener("click", () => { updateCartModal(); cartModal.classList.remove("hidden"); cartModal.classList.add("flex"); });
cartModal.addEventListener("click", (e) => { if(e.target === cartModal || e.target === closeModalBtn) { cartModal.classList.add("hidden"); cartModal.classList.remove("flex"); } });

// 7. FINALIZAR PEDIDO
function renderProducts(productsToRender) {
    const savoryContainer = document.getElementById("savory-section");
    const drinkContainer = document.getElementById("drinks-section");
    const candyContainer = document.getElementById("candy-section"); 
    const combinationContainer = document.getElementById("combination-section");

    // Limpa os containers antes de preencher
    if(savoryContainer) savoryContainer.innerHTML = "";
    if(drinkContainer) drinkContainer.innerHTML = "";
    if(candyContainer) candyContainer.innerHTML = "";
    if(combinationContainer) combinationContainer.innerHTML = "";

    productsToRender.forEach(product => {
        // Criamos o HTML do card uma única vez
        const productHTML = `
            <div class="flex gap-4 p-3 bg-white rounded-2xl shadow-sm hover:shadow-md transition-all border border-gray-100 group">
                <div class="relative overflow-hidden rounded-xl h-28 w-28 shrink-0 bg-gray-100">
                    <img src="${product.image}" alt="${product.name}" class="w-full h-full object-cover group-hover:scale-110 duration-500" onerror="this.src='assets/hamb-1.png'"/>
                </div>
                <div class="flex-1 flex flex-col justify-between">
                    <div>
                        <p class="font-bold text-gray-800 text-lg">${product.name}</p>
                        <p class="text-sm text-gray-500 line-clamp-2">${product.description || ''}</p>
                    </div>
                    <div class="flex items-center justify-between mt-2">
                        <p class="font-extrabold text-xl text-green-600">R$ ${Number(product.price).toFixed(2)}</p>
                        <div class="flex items-center bg-gray-100 rounded-full p-1 gap-3 border border-gray-200">
                            <button class="bg-white text-red-500 w-8 h-8 rounded-full flex items-center justify-center shadow-sm active:scale-90 transition-all remove-from-menu-btn" data-name="${product.name}">
                                <i class="fa fa-minus text-xs"></i>
                            </button>
                            <span class="font-bold text-base min-w-[20px] text-center item-quantity text-gray-800" data-name="${product.name}">0</span>
                            <button class="bg-zinc-900 text-white w-8 h-8 rounded-full flex items-center justify-center shadow-md active:scale-90 transition-all add-to-cart-btn" data-name="${product.name}" data-price="${product.price}">
                                <i class="fa fa-plus text-xs"></i>
                            </button>
                        </div>
                    </div>
                </div>
            </div>`;

        // Normaliza a categoria para evitar erros (tira espaços e deixa minúsculo)
        const cat = (product.category || "").toLowerCase().trim();

        // Distribui para o container correto baseado na palavra-chave
        if (cat === "candy" || cat === "doce" || cat === "doces") {
            if(candyContainer) candyContainer.insertAdjacentHTML('beforeend', productHTML);
        } 
        else if (cat === "drinks" || cat === "bebida" || cat === "bebidas") {
            if(drinkContainer) drinkContainer.insertAdjacentHTML('beforeend', productHTML);
        } 
        else if (cat === "combination" || cat === "combo" || cat === "combos") {
            if(combinationContainer) combinationContainer.insertAdjacentHTML('beforeend', productHTML);
        } 
        else {
            // Tudo que não for doce, bebida ou combo, cai em Salgados (Savory)
            if(savoryContainer) savoryContainer.insertAdjacentHTML('beforeend', productHTML);
        }
    });

    updateCartQuantities();
}

// --- FUNÇÕES AUXILIARES ---

// Scroll Suave para as Categorias
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const targetId = this.getAttribute('href').substring(1);
        const targetElement = document.getElementById(targetId);
        if (targetElement) {
            window.scrollTo({
                top: targetElement.offsetTop - 100, // Ajuste para o cabeçalho não cobrir o título
                behavior: 'smooth'
            });
        }
    });
});

function calcularDistanciaKM(lat1, lon1, lat2, lon2) {
    const R = 6371; 
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat/2)**2 + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon/2)**2;
    return R * (2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)));
}

loadProducts();
monitorarStatusLoja();