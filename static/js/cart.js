// Carrito de compras - Vida Sana
let cart = JSON.parse(localStorage.getItem('cart')) || [];

document.addEventListener('DOMContentLoaded', () => {
    updateCartUI();
    initEventListeners();
});

// Inicializar event listeners
function initEventListeners() {
    // Escuchar clicks en botones de "Agregar al carrito" en todo el documento
    document.addEventListener('click', (e) => {
        if (e.target.classList.contains('btn-agregar-carrito') || e.target.classList.contains('btn-agregar-single')) {
            e.preventDefault();
            const btn = e.target;
            const product = {
                id: btn.getAttribute('data-id'),
                title: btn.getAttribute('data-title'),
                price: parseInt(btn.getAttribute('data-price'), 10),
                image: btn.getAttribute('data-image') || '/images/default.jpg',
                quantity: 1
            };
            addToCart(product);
        }
    });
}

// Guardar carrito en localStorage
function saveCart() {
    localStorage.setItem('cart', JSON.stringify(cart));
    updateCartUI();
}

// Abrir/Cerrar Carrito
function toggleCart() {
    const drawer = document.getElementById('cart-drawer');
    const overlay = document.getElementById('cart-overlay');
    if (drawer && overlay) {
        drawer.classList.toggle('active');
        overlay.classList.toggle('active');
    }
}

// Agregar producto al carrito
function addToCart(product) {
    const existingIndex = cart.findIndex(item => item.id === product.id);

    if (existingIndex > -1) {
        cart[existingIndex].quantity += 1;
    } else {
        cart.push(product);
    }

    saveCart();

    // Abrir automáticamente el carrito para dar feedback visual de que se agregó
    const drawer = document.getElementById('cart-drawer');
    if (drawer && !drawer.classList.contains('active')) {
        toggleCart();
    }
}

// Cambiar cantidad de un producto
function changeQty(id, delta) {
    const index = cart.findIndex(item => item.id === id);
    if (index > -1) {
        cart[index].quantity += delta;
        if (cart[index].quantity <= 0) {
            cart.splice(index, 1);
        }
        saveCart();
    }
}

// Eliminar producto del carrito
function removeFromCart(id) {
    cart = cart.filter(item => item.id !== id);
    saveCart();
}

// Formatear precio a moneda COP
function formatPrice(value) {
    return '$ ' + value.toLocaleString('es-CO') + ' COP';
}

// Actualizar la interfaz del carrito
function updateCartUI() {
    const cartCount = document.getElementById('cart-count');
    const cartItemsContainer = document.getElementById('cart-items');
    const cartTotalAmount = document.getElementById('cart-total-amount');

    // Calcular cantidad total de productos
    const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
    if (cartCount) {
        cartCount.textContent = totalItems;
    }

    // Limpiar contenedor de items
    if (!cartItemsContainer) return;
    cartItemsContainer.innerHTML = '';

    if (cart.length === 0) {
        cartItemsContainer.innerHTML = '<div class="empty-cart-msg">Tu carrito está vacío.</div>';
        if (cartTotalAmount) {
            cartTotalAmount.textContent = formatPrice(0);
        }
        return;
    }

    let total = 0;

    cart.forEach(item => {
        const itemSubtotal = item.price * item.quantity;
        total += itemSubtotal;

        const itemElement = document.createElement('div');
        itemElement.className = 'cart-item';
        itemElement.innerHTML = `
            <img src="${item.image}" alt="${item.title}">
            <div class="cart-item-info">
                <div class="cart-item-title">${item.title}</div>
                <div class="cart-item-price">${formatPrice(item.price)}</div>
                <div class="cart-item-qty-container">
                    <button class="cart-qty-btn" onclick="changeQty('${item.id}', -1)">-</button>
                    <span class="cart-qty-val">${item.quantity}</span>
                    <button class="cart-qty-btn" onclick="changeQty('${item.id}', 1)">+</button>
                </div>
            </div>
            <button class="cart-item-remove" onclick="removeFromCart('${item.id}')" title="Eliminar del carrito">✕</button>
        `;
        cartItemsContainer.appendChild(itemElement);
    });

    if (cartTotalAmount) {
        cartTotalAmount.textContent = formatPrice(total);
    }
}

// Finalizar compra y enviar a WhatsApp
function checkoutCart() {
    if (cart.length === 0) {
        alert('Tu carrito está vacío. Agrega productos antes de realizar el pedido.');
        return;
    }

    let total = 0;
    let message = '🌿 *Vida Sana - Nuevo Pedido* 🌿\n\n';
    message += 'Hola, me gustaría comprar los siguientes productos:\n\n';

    cart.forEach(item => {
        const subtotal = item.price * item.quantity;
        total += subtotal;
        message += `• *${item.quantity}x* ${item.title} (${formatPrice(item.price)} c/u) \n  _Subtotal: ${formatPrice(subtotal)}_\n\n`;
    });

    message += `💰 *Total a pagar:* ${formatPrice(total)}\n\n`;
    message += '¡Muchas gracias! Quedo atento a la confirmación.';

    const whatsappUrl = `https://wa.me/573245208396?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
}
