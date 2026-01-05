import { initializeApp } from "https://www.gstatic.com/firebasejs/10.0.0/firebase-app.js";
import { getFirestore, collection, addDoc, onSnapshot, doc, deleteDoc } from "https://www.gstatic.com/firebasejs/10.0.0/firebase-firestore.js";

// 1. CONFIGURAÇÃO (Já conferida e funcionando!)
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

// ==========================================
// GESTÃO DE PRODUTOS (FIREBASE)
// ==========================================

const productForm = document.getElementById("product-form");
const listContainer = document.getElementById("admin-products-list");

// CADASTRAR PRODUTO
productForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const newProduct = {
        name: document.getElementById("prod-name").value,
        description: document.getElementById("prod-desc").value,
        price: parseFloat(document.getElementById("prod-price").value),
        category: document.getElementById("prod-category").value,
        image: document.getElementById("prod-img").value
    };

    try {
        await addDoc(collection(db, "produtos"), newProduct);
        alert("Produto cadastrado com sucesso!");
        productForm.reset();
    } catch (error) {
        console.error("Erro ao salvar no Firebase:", error);
    }
});

// LISTAR PRODUTOS EM TEMPO REAL (Para aparecer embaixo do formulário)
if (listContainer) {
    onSnapshot(collection(db, "produtos"), (snapshot) => {
        listContainer.innerHTML = "<h3 class='font-bold mb-4 mt-6 border-t pt-4 text-gray-700'>Produtos no Cardápio</h3>";
        
        snapshot.docs.forEach(item => {
            const p = item.data();
            const div = document.createElement("div");
            div.className = "flex justify-between items-center bg-white p-3 mb-2 rounded shadow-sm border border-gray-100";
            div.innerHTML = `
                <div class="flex items-center gap-3">
                    <img src="${p.image}" class="w-12 h-12 rounded object-cover shadow-sm" onerror="this.src='https://via.placeholder.com/50'">
                    <div>
                        <p class="font-bold text-sm text-gray-800">${p.name}</p>
                        <p class="text-xs text-green-600 font-bold">R$ ${Number(p.price).toFixed(2)}</p>
                    </div>
                </div>
                <button class="text-red-500 hover:bg-red-50 p-2 rounded-lg btn-delete-firebase" data-id="${item.id}">
                    <i class="fa fa-trash"></i>
                </button>
            `;
            listContainer.appendChild(div);
        });
    });
}

// LÓGICA PARA DELETAR
document.addEventListener("click", async (e) => {
    const btn = e.target.closest(".btn-delete-firebase");
    if (btn) {
        const id = btn.getAttribute("data-id");
        if (confirm("Deseja realmente excluir este item?")) {
            await deleteDoc(doc(db, "produtos", id));
        }
    }
});

// ==========================================
// GESTÃO DE PEDIDOS (COMENTADA PARA NÃO DAR ERRO)
// ==========================================
/*
async function fetchOrders() {
    try {
        const response = await fetch("http://localhost:3000/pedidos");
        // ... restante do código de pedidos
    } catch (err) {
        console.log("Servidor local de pedidos desligado.");
    }
}
fetchOrders();
*/