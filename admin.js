const ordersContainer = document.getElementById("orders-container");

async function fetchOrders() {
    try {
        const response = await fetch("http://localhost:3000/pedidos");
        const orders = await response.json();

        if (orders.length === 0) return;

        ordersContainer.innerHTML = "";
        orders.reverse().forEach(order => {
            const div = document.createElement("div");
            div.className = "bg-white p-4 rounded-lg shadow-md border-l-4 border-red-500";
            
            const itensHtml = order.itens.map(i => `<li>${i.quantity}x ${i.title}</li>`).join("");

            div.innerHTML = `
                <p class="font-bold text-lg">Pedido #${order.id}</p>
                <p class="text-sm text-gray-500 mb-2">${order.data}</p>
                <ul class="mb-3">${itensHtml}</ul>
                <span class="bg-yellow-100 text-yellow-800 px-2 py-1 rounded text-xs font-bold uppercase">
                    ${order.status}
                </span>
            `;
            ordersContainer.appendChild(div);
        });
    } catch (err) {
        console.error("Erro ao carregar pedidos");
    }
}

// Atualiza a cada 5 segundos
setInterval(fetchOrders, 5000);
fetchOrders();