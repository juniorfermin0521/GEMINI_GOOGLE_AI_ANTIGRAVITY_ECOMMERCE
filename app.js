let catalog = { vehiculos: [], motos: [] };
let cart = [];
let currentTab = 'vehiculos';
let currentSearch = '';
let currentRentItem = null;

// 1. INICIALIZACIÓN
document.addEventListener('DOMContentLoaded', () => {
    fetchData();
    
    // Listeners Pestañas Navbar
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
            e.currentTarget.classList.add('active');
            currentTab = e.currentTarget.getAttribute('data-tab');
            renderCatalog();
        });
    });

    // Buscador en tiempo real
    document.getElementById('searchInput').addEventListener('input', (e) => {
        currentSearch = e.target.value;
        renderCatalog();
    });

    // Listeners Modal Alquiler
    document.getElementById('rentType').addEventListener('change', updateRentSubtotal);
    document.getElementById('rentQty').addEventListener('input', updateRentSubtotal);
});

// 2. PETICIÓN FETCH
async function fetchData() {
    try {
        const response = await fetch('vehiculo.json');
        if (!response.ok) throw new Error("JSON no encontrado");
        catalog = await response.json();
        renderCatalog();
    } catch (error) {
        console.error(error);
        Swal.fire({
            icon: 'error',
            title: 'Error Crítico',
            text: 'No se pudo cargar vehiculo.json. Ejecuta la aplicación usando un servidor local (Live Server).'
        });
    }
}

// 3. RENDERIZADO DEL CATÁLOGO
function renderCatalog() {
    const container = document.getElementById('catalog-container');
    container.innerHTML = '';
    
    let items = catalog[currentTab] || [];
    
    // Filtrado por buscador
    if (currentSearch) {
        const query = currentSearch.toLowerCase();
        items = items.filter(item => 
            item.marca.toLowerCase().includes(query) || 
            item.modelo.toLowerCase().includes(query) ||
            item.tipo.toLowerCase().includes(query)
        );
    }

    if(items.length === 0) {
        container.innerHTML = `<div class="col-12 text-center text-muted my-5 py-5"><i class="fas fa-search-minus fa-4x mb-3 text-secondary"></i><h4>No hay existencias para tu búsqueda.</h4></div>`;
        return;
    }
    
    items.forEach(item => {
        const offerBadge = item.oferta_alquiler ? `<div class="offer-badge"><i class="fas fa-bolt"></i> ${item.oferta_alquiler}</div>` : '';
        
        const cardHtml = `
            <div class="col-md-6 col-lg-4 mb-4">
                <div class="card vehicle-card h-100">
                    ${offerBadge}
                    <div class="img-wrapper">
                        <img src="${item.imagen}" class="car-img" alt="${item.modelo}" onerror="this.src='https://via.placeholder.com/400x250?text=Premium+Img'">
                    </div>
                    <div class="card-body d-flex flex-column p-4">
                        <div class="d-flex justify-content-between align-items-center mb-3">
                            <img src="${item.logo}" alt="${item.marca}" class="brand-logo" onerror="this.style.display='none'">
                            <span class="badge bg-dark rounded-pill px-3 shadow-sm">CÓD: ${item.codigo}</span>
                        </div>
                        <h5 class="card-title fw-bolder text-dark fs-4">${item.marca} ${item.modelo}</h5>
                        <p class="card-text text-muted small mb-4"><i class="fas fa-gem text-info me-1"></i> ${item.tipo} | ${item.caracteristicas}</p>
                        
                        <ul class="list-group list-group-flush mb-4 flex-grow-1 border-top-0">
                            <li class="list-group-item d-flex justify-content-between align-items-center px-0 border-light">
                                <span class="fw-bold"><i class="fas fa-tag text-success me-2"></i> Compra Directa</span>
                                <strong class="fs-5 text-dark">$${item.precio_venta.toLocaleString()}</strong>
                            </li>
                            <li class="list-group-item d-flex justify-content-between align-items-center px-0 border-light">
                                <span class="fw-bold"><i class="fas fa-calendar-alt text-primary me-2"></i> Alquiler Día</span>
                                <strong class="text-secondary">$${item.precio_alquiler_dia.toLocaleString()}</strong>
                            </li>
                            <li class="list-group-item d-flex justify-content-between align-items-center px-0 border-light">
                                <span class="fw-bold"><i class="fas fa-clock text-warning me-2"></i> Alquiler Hora</span>
                                <strong class="text-secondary">$${item.precio_alquiler_hora.toLocaleString()}</strong>
                            </li>
                        </ul>
                        
                        <div class="row g-2 mt-auto">
                            <div class="col-6">
                                <button class="btn btn-outline-dark w-100 fw-bold rounded-pill p-2" onclick="openRentModal(${item.codigo})">
                                    <i class="fas fa-key me-1"></i> Alquilar
                                </button>
                            </div>
                            <div class="col-6">
                                <button class="btn btn-dark w-100 fw-bold rounded-pill p-2" onclick="buyItem(${item.codigo})">
                                    <i class="fas fa-shopping-cart me-1"></i> Comprar
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
        container.innerHTML += cardHtml;
    });
}

// Búsqueda en los arreglos JSON
function getItem(codigo) {
    let found = catalog.vehiculos.find(v => v.codigo === codigo);
    if(!found) found = catalog.motos.find(m => m.codigo === codigo);
    return found;
}

// 4. FLUJO DE MODALES
function openRentModal(codigo) {
    currentRentItem = getItem(codigo);
    if(!currentRentItem) return;
    
    document.getElementById('rentItemName').innerText = `${currentRentItem.marca} ${currentRentItem.modelo}`;
    document.getElementById('rentType').value = 'dia';
    document.getElementById('rentQty').value = 1;
    updateRentSubtotal();
    
    new bootstrap.Modal(document.getElementById('rentModal')).show();
}

function updateRentSubtotal() {
    if(!currentRentItem) return;
    const type = document.getElementById('rentType').value;
    const qty = parseInt(document.getElementById('rentQty').value) || 0;
    const price = type === 'dia' ? currentRentItem.precio_alquiler_dia : currentRentItem.precio_alquiler_hora;
    document.getElementById('rentSubtotal').innerText = `$${(price * qty).toLocaleString()}`;
}

function confirmRent() {
    const type = document.getElementById('rentType').value;
    const qty = parseInt(document.getElementById('rentQty').value) || 0;
    
    if(qty <= 0) {
        Swal.fire('Error', 'Ingresa una cantidad válida.', 'warning');
        return;
    }
    
    const price = type === 'dia' ? currentRentItem.precio_alquiler_dia : currentRentItem.precio_alquiler_hora;
    
    cart.push({
        id: Date.now() + Math.random(),
        item: currentRentItem,
        mode: 'alquiler',
        type: type,
        qty: qty,
        subtotal: price * qty
    });
    
    updateCartUI();
    bootstrap.Modal.getInstance(document.getElementById('rentModal')).hide();
    triggerToast('Alquiler configurado correctamente', 'success');
}

function buyItem(codigo) {
    const item = getItem(codigo);
    if(!item) return;
    
    cart.push({
        id: Date.now() + Math.random(),
        item: item,
        mode: 'venta',
        qty: 1,
        subtotal: item.precio_venta
    });
    
    updateCartUI();
    triggerToast('Vehículo añadido para compra', 'success');
}

// Interfaz Dinámica del Carrito
function updateCartUI() {
    document.getElementById('cartBadge').innerText = cart.length;
    const cartBody = document.getElementById('cartBody');
    
    if(cart.length === 0) {
        cartBody.innerHTML = `
            <div class="text-center text-muted my-5">
                <i class="fas fa-shopping-basket fa-4x mb-3 text-secondary"></i>
                <p class="fs-5">No has seleccionado ningún vehículo aún.</p>
            </div>`;
        document.getElementById('cartTotal').innerText = '$0';
        document.getElementById('btnGeneratePDF').disabled = true;
        return;
    }
    
    document.getElementById('btnGeneratePDF').disabled = false;
    let html = '<ul class="list-group mb-0">';
    let total = 0;
    
    cart.forEach(c => {
        total += c.subtotal;
        let badge = c.mode === 'venta' 
            ? '<span class="badge bg-success rounded-pill px-3">Compra</span>' 
            : `<span class="badge bg-primary rounded-pill px-3">Alquiler (${c.qty} ${c.type === 'dia' ? 'Días' : 'Horas'})</span>`;
            
        html += `
            <li class="list-group-item d-flex justify-content-between align-items-center bg-white border-0 mb-3 rounded-4 shadow-sm p-3">
                <div class="d-flex align-items-center">
                    <img src="${c.item.imagen}" style="width: 70px; height: 70px; object-fit: cover; border-radius: 12px; margin-right: 15px;" onerror="this.src='https://via.placeholder.com/70'">
                    <div>
                        <h6 class="my-0 fw-bold fs-5">${c.item.marca} ${c.item.modelo}</h6>
                        <small class="d-block mt-2">${badge}</small>
                    </div>
                </div>
                <div class="d-flex align-items-center">
                    <strong class="me-4 text-dark fs-5">$${c.subtotal.toLocaleString()}</strong>
                    <button class="btn btn-outline-danger btn-sm rounded-circle shadow-sm" onclick="removeFromCart(${c.id})" style="width: 35px; height: 35px;">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
            </li>
        `;
    });
    
    cartBody.innerHTML = html + '</ul>';
    document.getElementById('cartTotal').innerText = `$${total.toLocaleString()}`;
}

function removeFromCart(id) {
    cart = cart.filter(c => c.id !== id);
    updateCartUI();
}

function openCartModal() {
    new bootstrap.Modal(document.getElementById('cartModal')).show();
}

function triggerToast(title, icon) {
    Swal.fire({ toast: true, position: 'bottom-end', icon: icon, title: title, showConfirmButton: false, timer: 2000, timerProgressBar: true });
}

// -------------------------------------------------------------------------
// 5. EL TRUCO MAESTRO: STRING LITERAL ALGORÍTMICO PARA HTML2PDF
// -------------------------------------------------------------------------
function processPDF() {
    // A) Destruir modales del DOM de forma segura (Evita que la pantalla se congele)
    const cartModalEl = document.getElementById('cartModal');
    const modalInstance = bootstrap.Modal.getInstance(cartModalEl);
    if (modalInstance) modalInstance.hide();
    
    document.querySelectorAll('.modal-backdrop').forEach(el => el.remove());
    document.body.classList.remove('modal-open');
    document.body.style = '';

    // B) Lógica de Negocio y Títulos Dinámicos
    const hasVenta = cart.some(c => c.mode === 'venta');
    const hasAlquiler = cart.some(c => c.mode === 'alquiler');
    
    let title = "";
    let includeClause = false;
    
    if (hasVenta && !hasAlquiler) {
        title = "FACTURA DE VENTA";
    } else if (!hasVenta && hasAlquiler) {
        title = "CONTRATO DE ALQUILER Y ACUERDO DE RESPONSABILIDAD";
        includeClause = true;
    } else {
        title = "FACTURA DE VENTA Y CONTRATO DE ALQUILER";
        includeClause = true;
    }

    // C) Construcción Pura de Filas 
    let rowsHTML = '';
    let total = 0;
    
    cart.forEach(c => {
        let textDesc = c.mode === 'venta' 
            ? `<b>Traspaso/Venta:</b> ${c.item.marca} ${c.item.modelo}` 
            : `<b>Alquiler (${c.qty} ${c.type === 'dia' ? 'Días' : 'Horas'}):</b> ${c.item.marca} ${c.item.modelo}`;
            
        rowsHTML += `
            <tr style="border-bottom: 1px solid #ddd; background: #fff;">
                <td style="padding: 15px; text-align:center; vertical-align: middle;">
                    <img src="${c.item.imagen}" style="width: 90px; height: 60px; border-radius:6px; object-fit:cover;" onerror="this.style.display='none'">
                </td>
                <td style="padding: 15px; vertical-align: middle; color:#555;">${c.item.codigo}</td>
                <td style="padding: 15px; vertical-align: middle; font-size: 14px;">${textDesc}</td>
                <td style="padding: 15px; vertical-align: middle; font-weight:bold; font-size: 15px;">$${c.subtotal.toLocaleString()}</td>
            </tr>
        `;
        total += c.subtotal;
    });

    // D) String Literal Inject (ESTO ES INFALIBLE - No usa Display:none)
    // Nota Técnica: Se utilizan Tablas nativas en las firmas porque html2canvas a veces falla renderizando Flexbox.
    const htmlString = `
        <div style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; padding: 50px 40px; color: #111; background: #fff;">
            
            <div style="text-align: center; margin-bottom: 40px;">
                <img src="assets/logo_pagina.png" style="max-width: 200px; margin-bottom: 15px;" onerror="this.style.display='none'">
                <h2 style="margin: 0; color: #000; font-weight: 800; font-size: 24px; text-transform: uppercase; letter-spacing: 1px;">${title}</h2>
                <p style="margin: 8px 0 0 0; color: #666; font-size: 15px; font-weight: bold;">Luxury Motors Elite Corp.</p>
                <p style="margin: 4px 0 0 0; color: #888; font-size: 12px;">Fecha de Transacción: ${new Date().toLocaleDateString()} a las ${new Date().toLocaleTimeString()}</p>
            </div>
            
            <table style="width: 100%; border-collapse: collapse; margin-bottom: 40px; font-size: 14px;">
                <thead>
                    <tr style="background-color: #111; color: #fff;">
                        <th style="padding: 14px; text-align:center; width: 22%;">FOTO</th>
                        <th style="padding: 14px; text-align:left; width: 15%;">CÓDIGO</th>
                        <th style="padding: 14px; text-align:left; width: 45%;">DETALLES</th>
                        <th style="padding: 14px; text-align:left; width: 18%;">SUBTOTAL</th>
                    </tr>
                </thead>
                <tbody>
                    ${rowsHTML}
                </tbody>
                <tfoot>
                    <tr style="background-color: #f4f6f9;">
                        <td colspan="3" style="padding: 18px 15px; text-align: right; font-weight: 900; font-size: 18px;">TOTAL A PAGAR:</td>
                        <td style="padding: 18px 15px; font-weight: 900; font-size: 20px; color: #d90000;">$${total.toLocaleString()}</td>
                    </tr>
                </tfoot>
            </table>
            
            ${includeClause ? `
            <div style="margin-top: 35px; color: #333; background: #fafafa; padding: 20px 25px; border-left: 5px solid #111;">
                <h4 style="margin-top:0; font-size: 14px; color: #000; text-transform: uppercase; font-weight: 900;">Cláusula Especial de Responsabilidad</h4>
                <p style="margin-bottom: 0; line-height: 1.6; font-size: 11px; text-align: justify;">El cliente asume la absoluta responsabilidad civil, penal y administrativa por cualquier daño material, alteración, multa o percance ocasionado durante la custodia temporal estipulada en este contrato. El vehículo será devuelto en el plazo fijado y exactamente en las mismas condiciones físicas y mecánicas. Luxury Motors Elite Corp. ejecutará cobros adicionales inmediatos en caso de incumplimiento de estos términos.</p>
            </div>
            
            <!-- FIRMAS ESTRUCTURADAS EN TABLA -->
            <table style="width: 100%; margin-top: 90px; text-align: center; font-size: 14px; page-break-inside: avoid;">
                <tr>
                    <td style="width: 40%; border-top: 1px solid #111; padding-top: 12px;">
                        <strong style="color: #000;">Firma del Cliente</strong><br>
                        <span style="color: #666; font-size: 12px;">Aceptación de Términos</span>
                    </td>
                    <td style="width: 20%;"></td>
                    <td style="width: 40%; border-top: 1px solid #111; padding-top: 12px;">
                        <strong style="color: #000;">Luxury Motors Elite Corp.</strong><br>
                        <span style="color: #666; font-size: 12px;">Representante Autorizado</span>
                    </td>
                </tr>
            </table>
            ` : ''}
            
            <div style="text-align: center; margin-top: 60px; font-size: 10px; color: #aaa;">
                <p>Documento emitido electrónicamente por el Sistema E-Commerce Premium. Documento Válido.</p>
            </div>
        </div>
    `;

    // E) Opciones para html2pdf garantizando que quepa en formato Letter americano
    const opt = {
        margin:       0.3,
        filename:     'Factura_Luxury_Motors.pdf',
        image:        { type: 'jpeg', quality: 1 },
        html2canvas:  { scale: 2, useCORS: true, logging: false },
        jsPDF:        { unit: 'in', format: 'letter', orientation: 'portrait' }
    };

    // Modal de Espera
    Swal.fire({
        title: 'Generando Documento...',
        html: '<b style="color:#00bfff;">Renderizando factura de alta definición.</b>',
        allowOutsideClick: false,
        didOpen: () => Swal.showLoading()
    });

    // F) Ejecutar Libería y Limpiar Datos
    html2pdf().set(opt).from(htmlString).save().then(() => {
        cart = [];
        updateCartUI();
        Swal.fire('¡Contrato Listo!', 'El documento legal y la facturación han sido generados sin errores y descargados a tu equipo.', 'success');
    }).catch(err => {
        console.error(err);
        Swal.fire('Error Interno', 'Contacte al Ingeniero. Detalles técnicos en la consola.', 'error');
    });
}