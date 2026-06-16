document.addEventListener('DOMContentLoaded', () => {
    const menuItemsContainer = document.querySelector('.menu-items');
    const cartItemsContainer = document.querySelector('.cart-items');
    const cartSubtotalSpan = document.getElementById('cart-subtotal');
    const cartSGSTspan = document.getElementById('cart-SGST');
    const cartCGSTspan = document.getElementById('cart-CGST');
    const cartTotalSpan = document.getElementById('cart-total');
    const checkoutBtn = document.getElementById('checkout-btn');
    const customerNameInput = document.getElementById('customer-name');
    const tableNumInput = document.getElementById('tnum'); // ✅ FIX 1: properly reference tnum input

    let cart = [];

    const menu = [
        { id: 1, name: 'Margherita Pizza',  description: 'Classic pizza with tomato, mozzarella, and basil.',                    price: 130, image: 'https://tse2.mm.bing.net/th/id/OIP.OJwx7HyBOxMTQuOOpMkltAHaJQ?rs=1&pid=ImgDetMain&o=7&rm=3' },
        { id: 2, name: 'Burger & Fries',    description: 'Juicy beef patty with lettuce, tomato, cheese, and a side of fries.',  price: 105, image: 'https://wallpaperaccess.com/full/2567163.jpg' },
        { id: 3, name: 'Caesar Salad',      description: 'Fresh romaine lettuce, croutons, parmesan, and Caesar dressing.',      price: 90,  image: 'https://th.bing.com/th/id/OSK.HERObmQdIvafDSRT4xa-gSzpZi-HRjU6d3oOmtluHhZ4MWU?w=312&h=200&c=7&rs=1&o=6&dpr=1.3&pid=SANGAM' },
        { id: 4, name: 'Chicken Biryani',   description: 'Boiled chicken and rice with several masalas.',                        price: 120, image: 'https://www.cubesnjuliennes.com/wp-content/uploads/2020/07/Chicken-Biryani-Recipe.jpg' },
        { id: 5, name: 'Chicken 65',        description: 'Fried chicken with chicken 65 masalas.',                               price: 60,  image: 'https://th.bing.com/th/id/OIP.QNgShbQeTKAOAfmo615uggHaFM?w=242&h=180&c=7&r=0&o=7&dpr=1.3&pid=1.7&rm=3' },
        { id: 6, name: 'Mutton Biryani',    description: 'Boiled Mutton and rice with several masalas.',                         price: 180, image: 'https://www.cubesnjuliennes.com/wp-content/uploads/2021/03/Best-Mutton-Biryani-Recipe.jpg' },
        { id: 7, name: 'Porata',            description: 'Cook the chicken over an open flame or hot coals for direct heat.',    price: 80,  image: 'https://res.cloudinary.com/rainforest-cruises/images/c_fill,g_auto/f_auto,q_auto/w_1120,h_732,c_fill,g_auto/v1661347392/india-food-paratha/india-food-paratha-1120x732.jpg' },
        { id: 8, name: 'Shawarma',          description: 'A Middle Eastern dish where marinated meat.',                          price: 100, image: 'https://www.licious.in/blog/wp-content/uploads/2020/12/Chicken-Shawarma.jpg' },
    ];

    // ─────────────────────────────────────
    //  Display all menu items as cards
    // ─────────────────────────────────────
    function displayMenuItems() {
        menuItemsContainer.innerHTML = '';
        menu.forEach(item => {
            const menuItemDiv = document.createElement('div');
            menuItemDiv.classList.add('menu-item');
            menuItemDiv.innerHTML = `
                <img src="${item.image}" alt="${item.name}">
                <div class="menu-item-details">
                    <h3>${item.name}</h3>
                    <p>${item.description}</p>
                    <span class="price">₹ ${item.price.toFixed(2)}</span>
                    <button class="add-to-cart-btn" data-id="${item.id}">Add to Cart</button>
                </div>
            `;
            menuItemsContainer.appendChild(menuItemDiv);
        });
    }

    // ─────────────────────────────────────
    //  Re-render the cart section
    // ─────────────────────────────────────
    function updateCartDisplay() {
        cartItemsContainer.innerHTML = '';
        if (cart.length === 0) {
            cartItemsContainer.innerHTML = '<p>Your cart is empty.</p>';
        } else {
            cart.forEach(item => {
                const cartItemDiv = document.createElement('div');
                cartItemDiv.classList.add('cart-item');
                cartItemDiv.innerHTML = `
                    <div class="cart-item-details">
                        <span>${item.name} x ${item.quantity}</span>
                        ₹${(item.price * item.quantity).toFixed(2)}
                    </div>
                    <button class="remove-from-cart-btn" data-id="${item.id}">Remove</button>
                `;
                cartItemsContainer.appendChild(cartItemDiv);
            });
        }
        updateCartTotals();
    }

    // ─────────────────────────────────────
    //  Calculate subtotal, SGST, CGST, total
    // ─────────────────────────────────────
    function updateCartTotals() {
        const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        const sgst = subtotal * 0.05; // 5%
        const cgst = subtotal * 0.06; // 6%
        const total = subtotal + sgst + cgst;

        cartSubtotalSpan.textContent = subtotal.toFixed(2);
        cartSGSTspan.textContent     = sgst.toFixed(2);
        cartCGSTspan.textContent     = cgst.toFixed(2);
        cartTotalSpan.textContent    = total.toFixed(2);
    }

    // ─────────────────────────────────────
    //  Add item to cart
    // ─────────────────────────────────────
    menuItemsContainer.addEventListener('click', (event) => {
        if (event.target.classList.contains('add-to-cart-btn')) {
            const itemId = parseInt(event.target.dataset.id);
            const selectedItem = menu.find(item => item.id === itemId);

            if (selectedItem) {
                const existingCartItem = cart.find(item => item.id === itemId);
                if (existingCartItem) {
                    existingCartItem.quantity++;
                } else {
                    cart.push({ ...selectedItem, quantity: 1 });
                }
                updateCartDisplay();
            }
        }
    });

    // ─────────────────────────────────────
    //  Remove item from cart
    // ─────────────────────────────────────
    cartItemsContainer.addEventListener('click', (event) => {
        if (event.target.classList.contains('remove-from-cart-btn')) {
            const itemId = parseInt(event.target.dataset.id);
            const itemIndex = cart.findIndex(item => item.id === itemId);

            if (itemIndex > -1) {
                if (cart[itemIndex].quantity > 1) {
                    cart[itemIndex].quantity--;
                } else {
                    cart.splice(itemIndex, 1);
                }
                updateCartDisplay();
            }
        }
    });

    // ─────────────────────────────────────
    //  Checkout — sends order to Flask API
    // ─────────────────────────────────────
    checkoutBtn.addEventListener('click', async (event) => {
        event.preventDefault();

        // Validate: cart must not be empty
        if (cart.length === 0) {
            alert('Your cart is empty. Please add items before placing an order.');
            return;
        }

        // Validate: name must be filled
        const customerName = customerNameInput.value.trim();
        if (!customerName) {
            alert('Please enter your name to place the order.');
            return;
        }

        // ✅ FIX 2: get table number value properly
        const tableNumber = tableNumInput.value.trim();
        if (!tableNumber) {
            alert('Please enter your table number.');
            return;
        }

        // Calculate totals
        const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        const sgst     = subtotal * 0.05;
        const cgst     = subtotal * 0.06;
        const total    = subtotal + sgst + cgst;

        // Disable button to prevent double submission
        checkoutBtn.disabled = true;
        checkoutBtn.textContent = 'Placing Order...';

        try {
            // ✅ Send order to Flask backend API
            const response = await fetch('/api/order', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    customer_name: customerName,
                    table_number:  tableNumber,
                    items: cart.map(item => ({
                        name:  item.name,
                        qty:   item.quantity,
                        price: item.price
                    })),
                    subtotal: parseFloat(subtotal.toFixed(2)),
                    sgst:     parseFloat(sgst.toFixed(2)),
                    cgst:     parseFloat(cgst.toFixed(2)),
                    total:    parseFloat(total.toFixed(2))
                })
            });

            const result = await response.json();

            if (result.success) {
                // ✅ FIX 3: clear cart BEFORE redirect
                cart = [];
                updateCartDisplay();
                customerNameInput.value = '';
                tableNumInput.value     = '';

                // Save summary to localStorage for order.html to display
                let orderSummaryHTML = `
                    <h3>✅ Order Placed Successfully!</h3>
                    <h4>Customer Name: ${customerName}</h4>
                    <h4>Table Number: ${tableNumber}</h4>
                    <h4>Order Details:</h4>
                    <ul>
                `;
                result.items.forEach(item => {
                    orderSummaryHTML += `<li>${item.name} x ${item.qty} — ₹${(item.price * item.qty).toFixed(2)}</li>`;
                });
                orderSummaryHTML += `
                    </ul>
                    <h4>Summary:</h4>
                    <p><strong>Subtotal:</strong> ₹${subtotal.toFixed(2)}</p>
                    <p><strong>SGST (5%):</strong> ₹${sgst.toFixed(2)}</p>
                    <p><strong>CGST (6%):</strong> ₹${cgst.toFixed(2)}</p>
                    <p><strong>Total:</strong> ₹${total.toFixed(2)}</p>
                    <p>Order ID: #${result.order_id}</p>
                `;
                localStorage.setItem('orderDetails', orderSummaryHTML);

                // Redirect to confirmation page
                window.location.href = '/order';

            } else {
                alert('Failed to place order. Please try again.');
                checkoutBtn.disabled     = false;
                checkoutBtn.textContent  = 'Order Food';
            }

        } catch (error) {
            // If Flask is not running, fallback to localStorage method
            console.warn('Flask API not available, using localStorage fallback:', error);

            let orderSummaryHTML = `
                <h3>Customer Name: ${customerName}</h3>
                <h3>Table Number: ${tableNumber}</h3>
                <h4>Order Details:</h4>
                <ul>
            `;
            cart.forEach(item => {
                orderSummaryHTML += `<li>${item.name} x ${item.quantity} — ₹${(item.price * item.quantity).toFixed(2)}</li>`;
            });
            orderSummaryHTML += `
                </ul>
                <h4>Summary:</h4>
                <p><strong>Subtotal:</strong> ₹${subtotal.toFixed(2)}</p>
                <p><strong>SGST (5%):</strong> ₹${sgst.toFixed(2)}</p>
                <p><strong>CGST (6%):</strong> ₹${cgst.toFixed(2)}</p>
                <p><strong>Total:</strong> ₹${total.toFixed(2)}</p>
            `;
            localStorage.setItem('orderDetails', orderSummaryHTML);

            // ✅ FIX 3: clear cart BEFORE redirect
            cart = [];
            updateCartDisplay();
            customerNameInput.value = '';
            tableNumInput.value     = '';

            window.location.href = 'order.html';
        }
    });

    // Init
    displayMenuItems();
    updateCartDisplay();
});