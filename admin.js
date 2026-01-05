import { initializeApp } from "https://www.gstatic.com/firebasejs/10.0.0/firebase-app.js";
import { 
    getFirestore, collection, addDoc, onSnapshot, 
    deleteDoc, doc, query, orderBy, updateDoc 
} from "https://www.gstatic.com/firebasejs/10.0.0/firebase-firestore.js";




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

// --- REFERÊNCIAS GLOBAIS ---
const statusDocRef = doc(db, "configuracoes", "status_loja");

// Referências da Logo
const inputProfileImage = document.getElementById("input-profile-image");
const saveProfileBtn = document.getElementById("save-profile-btn");
const profilePreview = document.getElementById("profile-img-preview");

// Referências do Banner/Fundo
const inputBgImage = document.getElementById("input-bg-image");
const saveBgBtn = document.getElementById("save-bg-btn");
const bgPreview = document.getElementById("bg-img-preview");
const bgPlaceholder = document.getElementById("bg-placeholder");

// Referências de Status
const btnToggleLoja = document.getElementById("btn-toggle-loja");
const statusTexto = document.getElementById("loja-status-texto");

// --- SEÇÃO A: MONITORAMENTO EM TEMPO REAL (STATUS, LOGO E FUNDO) ---
if (statusDocRef) {
    onSnapshot(statusDocRef, (docSnap) => {
        if (docSnap.exists()) {
            const data = docSnap.data();
            
            // 1. Atualiza Status Aberto/Fechado
            const estaAberto = data.aberto;
            if (statusTexto && btnToggleLoja) {
                statusTexto.innerText = estaAberto ? "LOJA ABERTA" : "LOJA FECHADA";
                statusTexto.style.color = estaAberto ? "#16a34a" : "#ef4444";
                btnToggleLoja.innerText = estaAberto ? "FECHAR LOJA MANUALMENTE" : "ABRIR LOJA MANUALMENTE";
                btnToggleLoja.style.backgroundColor = estaAberto ? "#ef4444" : "#16a34a";

                btnToggleLoja.onclick = async () => {
                    await updateDoc(statusDocRef, { aberto: !estaAberto });
                };
            }

            // 2. Mantém a Logo visível
            if (data.logoUrl && profilePreview) {
                profilePreview.src = data.logoUrl;
            }

            // 3. Mantém o Fundo (Banner) visível
            if (data.bgUrl && bgPreview) {
                bgPreview.src = data.bgUrl;
                bgPreview.classList.remove("hidden");
                if(bgPlaceholder) bgPlaceholder.classList.add("hidden");
            }
        }
    });
}

// --- SEÇÃO B: FUNÇÃO DE COMPRESSÃO DE IMAGEM ---
const toBase64 = file => new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
        const img = new Image();
        img.src = event.target.result;
        img.onload = () => {
            const canvas = document.createElement('canvas');
            const MAX_WIDTH = 800; // Banner precisa de um pouco mais de largura que o produto
            const scaleSize = MAX_WIDTH / img.width;
            canvas.width = MAX_WIDTH;
            canvas.height = img.height * scaleSize;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
            resolve(canvas.toDataURL('image/jpeg', 0.7));
        };
    };
    reader.onerror = error => reject(error);
});

// --- SEÇÃO C: CADASTRO DE PRODUTOS ---
const btnCadastrar = document.getElementById("btn-cadastrar-produto");
if (btnCadastrar) {
    btnCadastrar.addEventListener("click", async (e) => {
        e.preventDefault();
        const nameInput = document.getElementById("product-name");
        const priceInput = document.getElementById("product-price");
        const descInput = document.getElementById("product-desc");
        const categoryInput = document.getElementById("product-category");
        const imageInput = document.getElementById("image-input");

        if (!nameInput.value || !priceInput.value || !imageInput.files[0]) {
            alert("⚠️ Preencha Nome, Preço e selecione uma Foto!");
            return;
        }

        try {
            btnCadastrar.innerText = "CADASTRANDO...";
            btnCadastrar.disabled = true;
            const imageBase64 = await toBase64(imageInput.files[0]);
            await addDoc(collection(db, "produtos"), {
                name: nameInput.value,
                price: parseFloat(priceInput.value),
                description: descInput.value,
                category: categoryInput.value,
                image: imageBase64,
                createdAt: new Date()
            });
            alert("✅ Produto cadastrado!");
            nameInput.value = ""; priceInput.value = ""; descInput.value = ""; imageInput.value = "";
        } catch (error) {
            console.error(error);
            alert("❌ Erro ao cadastrar.");
        } finally {
            btnCadastrar.innerText = "CADASTRAR PRODUTO";
            btnCadastrar.disabled = false;
        }
    });
}

// --- SEÇÃO D: LISTAGEM E EXCLUSÃO DE PRODUTOS ---
const adminList = document.getElementById("admin-products-list");
if (adminList) {
    const q = query(collection(db, "produtos"), orderBy("createdAt", "desc"));
    onSnapshot(q, (snapshot) => {
        adminList.innerHTML = ""; 
        snapshot.forEach((productDoc) => {
            const product = productDoc.data();
            const id = productDoc.id;
            const productElement = document.createElement("div");
            productElement.className = "flex items-center justify-between bg-white p-3 rounded-lg shadow-sm border mb-2";
            productElement.innerHTML = `
                <div class="flex items-center gap-3">
                    <img src="${product.image}" class="w-12 h-12 rounded-md object-cover">
                    <div>
                        <p class="font-bold text-gray-800">${product.name}</p>
                        <p class="text-green-600 text-sm font-medium">R$ ${product.price.toFixed(2)}</p>
                    </div>
                </div>
                <button class="btn-delete p-2 hover:bg-red-50 rounded-full" data-id="${id}">
                    <i class="fa fa-trash text-red-500"></i>
                </button>
            `;
            adminList.appendChild(productElement);
        });
        document.querySelectorAll(".btn-delete").forEach(btn => {
            btn.onclick = async () => {
                if (confirm("Deseja realmente excluir este produto?")) {
                    await deleteDoc(doc(db, "produtos", btn.getAttribute("data-id")));
                }
            };
        });
    });
}

// --- SEÇÃO E: LÓGICA DA LOGO ---
if (inputProfileImage) {
    inputProfileImage.addEventListener("change", (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (event) => {
                if (profilePreview) profilePreview.src = event.target.result;
                if (saveProfileBtn) saveProfileBtn.classList.remove("hidden");
            };
            reader.readAsDataURL(file);
        }
    });
}

if (saveProfileBtn) {
    saveProfileBtn.addEventListener("click", async () => {
        try {
            saveProfileBtn.innerText = "SALVANDO...";
            saveProfileBtn.disabled = true;
            const imageBase64 = await toBase64(inputProfileImage.files[0]);
            await updateDoc(statusDocRef, { logoUrl: imageBase64 });
            alert("✅ Logo atualizada!");
            saveProfileBtn.classList.add("hidden");
        } catch (error) {
            alert("❌ Erro ao salvar logo.");
        } finally {
            saveProfileBtn.innerText = "SALVAR NOVA LOGO";
            saveProfileBtn.disabled = false;
        }
    });
}

// --- SEÇÃO F: LÓGICA DO FUNDO (BANNER) ---
if (inputBgImage) {
    inputBgImage.addEventListener("change", (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (event) => {
                bgPreview.src = event.target.result;
                bgPreview.classList.remove("hidden");
                if(bgPlaceholder) bgPlaceholder.classList.add("hidden");
                saveBgBtn.classList.remove("hidden");
            };
            reader.readAsDataURL(file);
        }
    });
}

// No seu admin.js, procure a parte de salvar o fundo e atualize:

const bgInput = document.getElementById("bg-input") || document.getElementById("input-bg-image");

if (saveBgBtn) {
    saveBgBtn.addEventListener("click", async () => {
        try {
            saveBgBtn.innerText = "SALVANDO...";
            saveBgBtn.disabled = true;
            const imageBase64 = await toBase64(inputBgImage.files[0]);
            await updateDoc(statusDocRef, { bgUrl: imageBase64 });
            alert("✅ Fundo atualizado!");
            saveBgBtn.classList.add("hidden");
        } catch (error) {
            alert("❌ Erro ao salvar fundo.");
        } finally {
            saveBgBtn.innerText = "SALVAR NOVO FUNDO";
            saveBgBtn.disabled = false;
        }
    });
}

import { getAuth, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.0.0/firebase-auth.js";

const auth = getAuth();

// Monitora se o usuário está logado
onAuthStateChanged(auth, (user) => {
    if (!user) {
        // Se não estiver logado, expulsa para a página de login
        window.location.href = "login.html";
    }
});

// Função para o botão Sair
const logoutBtn = document.getElementById("logout-btn");
if(logoutBtn) {
    logoutBtn.addEventListener("click", () => {
        signOut(auth).then(() => {
            window.location.href = "login.html";
        });
    });
}