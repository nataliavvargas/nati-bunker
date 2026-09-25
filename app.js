
App · JS
// ================================
// NATI BUNKER — LA MATRIZ
// app.js — estado real + localStorage
// ================================
 
const STORAGE_KEY = "natiBunkerState";
 
const STOCK_CATEGORIAS = [
  { nombre: "Aseo / Botiquín", icono: "🧴" },
  { nombre: "Limpieza", icono: "🧹" },
  { nombre: "Abarrotes", icono: "🍔" },
  { nombre: "Condimentos", icono: "🧂" },
  { nombre: "Pastas", icono: "🍝" },
  { nombre: "Lácteos", icono: "🥛" },
  { nombre: "Carne", icono: "🥩" },
  { nombre: "Bebidas", icono: "🥤" },
  { nombre: "Verduras", icono: "🥦" }
];
 
const GASTO_CATEGORIAS = [
  "Gustitos",
  "Transporte al trabajo",
  "Taxi",
  "Pasajes",
  "Comida fuera de casa",
  "Galletita",
  "Supermercado",
  "Compras para casa",
  "Otro"
];
 
let state = null;
let currentCategoryOpen = null;
 
 
// ---------- ESTADO / PERSISTENCIA ----------
 
function defaultState() {
  return {
    saldoInicial: 1600000,
    movimientos: [],
    productos: [],
    cuentas: [],
    separados: []
  };
}
 
function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultState();
    const parsed = JSON.parse(raw);
    return Object.assign(defaultState(), parsed);
  } catch (e) {
    console.error("No se pudo leer el estado guardado", e);
    return defaultState();
  }
}
 
function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}
 
function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}
 
function todayISO() {
  return new Date().toISOString().slice(0, 10);
}
 
 
// ---------- HELPERS DE FORMATO ----------
 
function formatMoney(amount) {
  const rounded = Math.round(amount || 0);
  const sign = rounded < 0 ? "-" : "";
  const abs = Math.abs(rounded).toString();
  const withDots = abs.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  return sign + "$ " + withDots;
}
 
function formatDate(iso) {
  if (!iso) return "";
  const [y, m, d] = iso.split("-");
  return d + "/" + m + "/" + y;
}
 
function isSameMonth(iso, ref) {
  return iso && iso.slice(0, 7) === ref.slice(0, 7);
}
 
 
// ---------- BALANCE ----------
 
function calcBalance() {
  let total = state.saldoInicial;
  state.movimientos.forEach(function (m) {
    if (m.tipo === "ingreso") total += m.monto;
    else total -= m.monto;
  });
  return total;
}
 
function renderBalance() {
  document.getElementById("balanceAmount").textContent = formatMoney(calcBalance());
 
  const separadoTotal = state.separados
    .filter(function (s) { return s.estado === "activo"; })
    .reduce(function (sum, s) { return sum + s.monto; }, 0);
 
  const sub = document.getElementById("separadoResumen");
  sub.textContent = separadoTotal > 0
    ? "🔒 " + formatMoney(separadoTotal) + " separados"
    : "";
}
 
 
// ---------- MOVIMIENTOS (helper genérico) ----------
 
function addMovimiento(tipo, monto, categoria, concepto, nota) {
  state.movimientos.push({
    id: uid(),
    fecha: todayISO(),
    tipo: tipo,
    monto: monto,
    categoria: categoria || "",
    concepto: concepto || "",
    nota: nota || ""
  });
}
 
function movimientosOrdenados(filtroTipo) {
  return state.movimientos
    .filter(function (m) { return !filtroTipo || m.tipo === filtroTipo; })
    .sort(function (a, b) {
      if (a.fecha === b.fecha) return b.id.localeCompare(a.id);
      return b.fecha.localeCompare(a.fecha);
    });
}
 
 
// ---------- NAVEGACIÓN ----------
 
function openMenu() {
  document.getElementById("sideMenu").classList.add("open");
}
 
function closeMenu() {
  document.getElementById("sideMenu").classList.remove("open");
}
 
function hideAllScreens() {
  document.getElementById("homeScreen").style.display = "none";
  document.querySelectorAll(".app-screen").forEach(function (el) {
    el.style.display = "none";
  });
}
 
function goHome() {
  hideAllScreens();
  document.getElementById("homeScreen").style.display = "block";
  closeMenu();
  renderAll();
}
 
function openScreen(id) {
  hideAllScreens();
  document.getElementById(id).style.display = "block";
  closeMenu();
  renderAll();
}
 
function openStock() {
  currentCategoryOpen = null;
  openScreen("stockScreen");
}
 
function openShoppingList() {
  openScreen("shoppingScreen");
}
 
function openCategory(nombre) {
  currentCategoryOpen = nombre;
  hideAllScreens();
  document.getElementById("categoryScreen").style.display = "block";
  closeMenu();
  document.getElementById("categorySearch").value = "";
  document.getElementById("categoryAddProduct").onclick = function () {
    openProductModal(null, nombre);
  };
  renderCategoryScreen();
}
 
 
// ---------- RENDER: HOME / TODO ----------
 
function renderTodo() {
  const box = document.getElementById("todoList");
  box.innerHTML = "";
 
  const paraComprar = state.productos.filter(function (p) {
    return p.cantidad <= p.stockMinimo;
  }).length;
 
  const cuentasPendientes = state.cuentas.filter(function (c) {
    return c.estado === "pendiente";
  }).length;
 
  if (paraComprar === 0 && cuentasPendientes === 0) {
    box.innerHTML = '<div class="empty-state">Todo al día 🎉</div>';
    return;
  }
 
  if (paraComprar > 0) {
    const item = document.createElement("button");
    item.className = "todo-item";
    item.onclick = openShoppingList;
    item.innerHTML =
      '<div class="todo-left"><span class="todo-icon">🛒</span>' +
      '<span class="todo-text">' + paraComprar + (paraComprar === 1 ? " producto para comprar" : " productos para comprar") + '</span></div>' +
      '<span class="arrow">›</span>';
    box.appendChild(item);
  }
 
  if (cuentasPendientes > 0) {
    const item = document.createElement("button");
    item.className = "todo-item";
    item.onclick = function () { openScreen("cuentasScreen"); };
    item.innerHTML =
      '<div class="todo-left"><span class="todo-icon">🧾</span>' +
      '<span class="todo-text">' + cuentasPendientes + (cuentasPendientes === 1 ? " cuenta pendiente" : " cuentas pendientes") + '</span></div>' +
      '<span class="arrow">›</span>';
    box.appendChild(item);
  }
}
 
 
// ---------- RENDER: STOCK ----------
 
function renderStockCategories() {
  const box = document.getElementById("stockCategories");
  box.innerHTML = "";
 
  STOCK_CATEGORIAS.forEach(function (cat) {
    const productos = state.productos.filter(function (p) { return p.categoria === cat.nombre; });
    const bajos = productos.filter(function (p) { return p.cantidad <= p.stockMinimo; }).length;
 
    const btn = document.createElement("button");
    btn.className = "stock-category";
    btn.onclick = function () { openCategory(cat.nombre); };
    btn.innerHTML =
      '<span>' + cat.icono + ' ' + cat.nombre + '</span>' +
      '<span class="stock-category-right">' +
        (bajos > 0 ? '<span class="stock-category-alert">' + bajos + '</span>' : '') +
        '<span class="stock-category-count">' + productos.length + '</span>' +
        '<span>›</span>' +
      '</span>';
    box.appendChild(btn);
  });
}
 
function productoItemHTML(p) {
  const bajo = p.cantidad <= p.stockMinimo;
  return (
    '<div class="product-item ' + (bajo ? "low-stock" : "") + '">' +
      '<div class="product-info">' +
        '<div class="product-name"><strong>' + p.nombre + '</strong>' +
        (p.nota ? '<button class="note-button" data-note="' + p.nota.replace(/"/g, "&quot;") + '" onclick="showNote(event, \'' + p.nota.replace(/'/g, "\\'") + '\')">💬</button>' : '') +
        '</div>' +
        '<span>' + p.cantidad + ' ' + p.unidad + '</span>' +
      '</div>' +
      '<div class="product-controls">' +
        '<button class="qty-btn" onclick="cambiarCantidad(\'' + p.id + '\', -1)">−</button>' +
        '<span class="qty-value">mín. ' + p.stockMinimo + '</span>' +
        '<button class="qty-btn" onclick="cambiarCantidad(\'' + p.id + '\', 1)">＋</button>' +
        '<span class="spacer"></span>' +
        '<button class="icon-btn" onclick="openProductModal(\'' + p.id + '\')">✎</button>' +
      '</div>' +
    '</div>'
  );
}
 
function renderCategoryScreen() {
  if (!currentCategoryOpen) return;
  const cat = STOCK_CATEGORIAS.find(function (c) { return c.nombre === currentCategoryOpen; });
  document.getElementById("categoryTitle").textContent = (cat ? cat.icono + " " : "") + currentCategoryOpen;
  document.getElementById("categorySubtitle").textContent = "Productos";
 
  const search = (document.getElementById("categorySearch").value || "").toLowerCase();
  const productos = state.productos.filter(function (p) {
    return p.categoria === currentCategoryOpen && p.nombre.toLowerCase().includes(search);
  });
 
  const box = document.getElementById("categoryProductList");
  if (productos.length === 0) {
    box.innerHTML = '<div class="empty-state">Todavía no cargaste productos acá.</div>';
    return;
  }
  box.innerHTML = productos.map(productoItemHTML).join("");
}
 
function renderStockSearch() {
  const search = (document.getElementById("stockSearch").value || "").trim().toLowerCase();
  const categoriesBox = document.getElementById("stockCategories");
  const resultsBox = document.getElementById("stockSearchResults");
 
  if (!search) {
    categoriesBox.style.display = "flex";
    resultsBox.style.display = "none";
    return;
  }
 
  categoriesBox.style.display = "none";
  resultsBox.style.display = "flex";
 
  const productos = state.productos.filter(function (p) {
    return p.nombre.toLowerCase().includes(search);
  });
 
  resultsBox.innerHTML = productos.length
    ? productos.map(productoItemHTML).join("")
    : '<div class="empty-state">No encontramos productos con ese nombre.</div>';
}
 
function cambiarCantidad(id, delta) {
  const p = state.productos.find(function (x) { return x.id === id; });
  if (!p) return;
  p.cantidad = Math.max(0, p.cantidad + delta);
  saveState();
  renderAll();
}
 
 
// ---------- RENDER: LISTA DE COMPRAS ----------
 
function renderShoppingList() {
  const box = document.getElementById("shoppingList");
  const pendientes = state.productos.filter(function (p) { return p.cantidad <= p.stockMinimo; });
 
  if (pendientes.length === 0) {
    box.innerHTML = '<div class="empty-state">No te falta nada por ahora 🎉</div>';
    return;
  }
 
  box.innerHTML = pendientes.map(function (p) {
    const faltan = Math.max(1, p.stockMinimo - p.cantidad);
    return (
      '<div class="shopping-item">' +
        '<div class="shopping-left">' +
          '<span class="shopping-check">○</span>' +
          '<div><strong>' + p.nombre + '</strong><span>Faltan ' + faltan + ' ' + p.unidad + '</span></div>' +
        '</div>' +
        '<button class="buy-btn" onclick="openComprarModal(\'' + p.id + '\')">Comprar</button>' +
      '</div>'
    );
  }).join("");
}
 
 
// ---------- RENDER: GASTOS ----------
 
function renderGastos() {
  const gastos = movimientosOrdenados("gasto");
  const mes = todayISO().slice(0, 7);
  const delMes = gastos.filter(function (g) { return isSameMonth(g.fecha, mes); });
  const totalMes = delMes.reduce(function (s, g) { return s + g.monto; }, 0);
 
  document.getElementById("gastosResumenMes").innerHTML =
    '<div class="summary-label">GASTADO ESTE MES</div>' +
    '<div class="summary-total">' + formatMoney(totalMes) + '</div>';
 
  const porCategoria = {};
  GASTO_CATEGORIAS.forEach(function (c) { porCategoria[c] = 0; });
  delMes.forEach(function (g) { porCategoria[g.categoria] = (porCategoria[g.categoria] || 0) + g.monto; });
 
  const max = Math.max.apply(null, Object.values(porCategoria).concat([1]));
  const catBox = document.getElementById("gastosPorCategoria");
  const filas = GASTO_CATEGORIAS
    .filter(function (c) { return porCategoria[c] > 0; })
    .sort(function (a, b) { return porCategoria[b] - porCategoria[a]; })
    .map(function (c) {
      const pct = Math.round((porCategoria[c] / max) * 100);
      const highlight = c === "Transporte al trabajo";
      return (
        '<div class="cat-row ' + (highlight ? "highlight" : "") + '">' +
          '<div class="cat-row-top"><span>' + c + '</span><strong>' + formatMoney(porCategoria[c]) + '</strong></div>' +
          '<div class="cat-bar-bg"><div class="cat-bar-fill" style="width:' + pct + '%;"></div></div>' +
        '</div>'
      );
    }).join("");
 
  catBox.innerHTML = filas || '<div class="empty-state">Todavía no hay gastos este mes.</div>';
 
  const list = document.getElementById("gastosList");
  list.innerHTML = gastos.length
    ? gastos.map(function (g) {
        return (
          '<div class="movement-item">' +
            '<div class="movement-info"><strong>' + g.categoria + '</strong>' +
            '<span>' + formatDate(g.fecha) + (g.nota ? " · " + g.nota : "") + '</span></div>' +
            '<div class="movement-amount negative">-' + formatMoney(g.monto) + '</div>' +
          '</div>'
        );
      }).join("")
    : '<div class="empty-state">Todavía no cargaste gastos.</div>';
}
 
 
// ---------- RENDER: CUENTAS ----------
 
function renderCuentas() {
  const list = document.getElementById("cuentasList");
  const cuentas = state.cuentas.slice().sort(function (a, b) {
    if (a.estado !== b.estado) return a.estado === "pendiente" ? -1 : 1;
    return (a.fechaVencimiento || "").localeCompare(b.fechaVencimiento || "");
  });
 
  list.innerHTML = cuentas.length ? cuentas.map(function (c) {
    return (
      '<div class="movement-item" style="flex-direction:column;align-items:stretch;">' +
        '<div style="display:flex;justify-content:space-between;">' +
          '<div class="movement-info"><strong>' + c.nombre + '</strong>' +
          '<span>' + (c.fechaVencimiento ? "Vence " + formatDate(c.fechaVencimiento) : "Sin vencimiento") + '</span>' +
          '<span class="state-tag ' + c.estado + '">' + (c.estado === "pendiente" ? "Pendiente" : "Pagada " + formatDate(c.fechaPago)) + '</span></div>' +
          '<div class="movement-amount negative">' + formatMoney(c.monto) + '</div>' +
        '</div>' +
        (c.estado === "pendiente"
          ? '<div class="movement-actions"><button class="pay-btn" onclick="pagarCuenta(\'' + c.id + '\')">Pagar</button></div>'
          : '') +
      '</div>'
    );
  }).join("") : '<div class="empty-state">No tenés cuentas cargadas.</div>';
}
 
function pagarCuenta(id) {
  const c = state.cuentas.find(function (x) { return x.id === id; });
  if (!c) return;
  c.estado = "pagada";
  c.fechaPago = todayISO();
  addMovimiento("pago_cuenta", c.monto, "Cuentas", c.nombre, "");
  saveState();
  renderAll();
}
 
 
// ---------- RENDER: INGRESOS ----------
 
function renderIngresos() {
  const ingresos = movimientosOrdenados("ingreso");
  const list = document.getElementById("ingresosList");
  list.innerHTML = ingresos.length ? ingresos.map(function (i) {
    return (
      '<div class="movement-item">' +
        '<div class="movement-info"><strong>' + (i.concepto || "Ingreso") + '</strong>' +
        '<span>' + formatDate(i.fecha) + (i.nota ? " · " + i.nota : "") + '</span></div>' +
        '<div class="movement-amount positive">+' + formatMoney(i.monto) + '</div>' +
      '</div>'
    );
  }).join("") : '<div class="empty-state">Todavía no cargaste ingresos.</div>';
 
  const sepBox = document.getElementById("separadosList");
  const activos = state.separados.filter(function (s) { return s.estado === "activo"; });
  sepBox.innerHTML = activos.length ? activos.map(function (s) {
    return (
      '<div class="movement-item">' +
        '<div class="movement-info"><strong>' + s.concepto + '</strong>' +
        '<span>' + formatDate(s.fecha) + '</span></div>' +
        '<div class="movement-amount negative">' + formatMoney(s.monto) + '</div>' +
      '</div>'
    );
  }).join("") : '<div class="empty-state">No tenés plata separada.</div>';
}
 
 
// ---------- RENDER: HISTORIAL ----------
 
function iconoMovimiento(tipo) {
  return { gasto: "💸", ingreso: "💵", pago_cuenta: "🧾", separado: "🔒" }[tipo] || "•";
}
 
function renderHistorial() {
  const list = document.getElementById("historialList");
  const movimientos = movimientosOrdenados();
 
  list.innerHTML = movimientos.length ? movimientos.map(function (m) {
    const positivo = m.tipo === "ingreso";
    return (
      '<div class="movement-item">' +
        '<div class="movement-info"><strong>' + iconoMovimiento(m.tipo) + ' ' + (m.concepto || m.categoria || m.tipo) + '</strong>' +
        '<span>' + formatDate(m.fecha) + (m.categoria ? " · " + m.categoria : "") + (m.nota ? " · " + m.nota : "") + '</span></div>' +
        '<div class="movement-amount ' + (positivo ? "positive" : "negative") + '">' + (positivo ? "+" : "-") + formatMoney(m.monto) + '</div>' +
      '</div>'
    );
  }).join("") : '<div class="empty-state">Todavía no hay movimientos.</div>';
}
 
 
// ---------- RENDER GLOBAL ----------
 
function renderAll() {
  renderBalance();
  renderTodo();
  renderStockCategories();
  renderStockSearch();
  if (currentCategoryOpen) renderCategoryScreen();
  renderShoppingList();
  renderGastos();
  renderCuentas();
  renderIngresos();
  renderHistorial();
}
 
 
// ---------- MODAL GENÉRICO ----------
 
function openModal(title, fieldsHTML, onSubmit, deleteFn) {
  document.getElementById("modalTitle").textContent = title;
  const form = document.getElementById("modalForm");
  form.innerHTML = fieldsHTML +
    '<button type="submit" class="modal-submit">Guardar</button>' +
    (deleteFn ? '<button type="button" class="modal-delete" id="modalDeleteBtn">Eliminar</button>' : "");
 
  form.onsubmit = function (e) {
    e.preventDefault();
    onSubmit(new FormData(form));
    closeModal();
    saveState();
    renderAll();
  };
 
  if (deleteFn) {
    document.getElementById("modalDeleteBtn").onclick = function () {
      deleteFn();
      closeModal();
      saveState();
      renderAll();
    };
  }
 
  document.getElementById("modalRoot").style.display = "flex";
}
 
function closeModal() {
  document.getElementById("modalRoot").style.display = "none";
}
 
 
// ---------- MODAL: GASTO ----------
 
function openGastoModal() {
  const opciones = GASTO_CATEGORIAS.map(function (c) { return '<option value="' + c + '">' + c + '</option>'; }).join("");
  openModal("Gasto rápido",
    '<div class="field"><label>Monto</label><input type="number" name="monto" min="1" step="1" required autofocus></div>' +
    '<div class="field"><label>Categoría</label><select name="categoria">' + opciones + '</select></div>' +
    '<div class="field"><label>Nota (opcional)</label><input type="text" name="nota"></div>',
    function (data) {
      const monto = parseFloat(data.get("monto"));
      if (!monto || monto <= 0) return;
      addMovimiento("gasto", monto, data.get("categoria"), data.get("categoria"), data.get("nota"));
    }
  );
}
 
 
// ---------- MODAL: SUPERMERCADO ----------
 
function openSupermercadoModal() {
  const opciones = STOCK_CATEGORIAS.map(function (c) { return '<option value="' + c.nombre + '">' + c.icono + ' ' + c.nombre + '</option>'; }).join("");
  openModal("Supermercado",
    '<div class="field"><label>Producto</label><input type="text" name="nombre" required autofocus></div>' +
    '<div class="field"><label>Categoría de stock</label><select name="categoria">' + opciones + '</select></div>' +
    '<div class="field"><label>Cantidad comprada</label><input type="number" name="cantidad" min="1" step="1" value="1" required></div>' +
    '<div class="field"><label>Unidad</label><input type="text" name="unidad" value="unidades" required></div>' +
    '<div class="field"><label>Monto gastado (opcional)</label><input type="number" name="monto" min="0" step="1"></div>',
    function (data) {
      const nombre = data.get("nombre").trim();
      if (!nombre) return;
      const categoria = data.get("categoria");
      const cantidad = parseFloat(data.get("cantidad")) || 0;
      const unidad = data.get("unidad") || "unidades";
      const monto = parseFloat(data.get("monto")) || 0;
 
      let p = state.productos.find(function (x) {
        return x.nombre.toLowerCase() === nombre.toLowerCase() && x.categoria === categoria;
      });
 
      if (p) {
        p.cantidad += cantidad;
      } else {
        state.productos.push({
          id: uid(), nombre: nombre, categoria: categoria, subcategoria: "",
          cantidad: cantidad, unidad: unidad, stockMinimo: 1, nota: ""
        });
      }
 
      if (monto > 0) addMovimiento("gasto", monto, "Supermercado", nombre, "");
    }
  );
}
 
 
// ---------- MODAL: COMPRAR (desde Lista) ----------
 
function openComprarModal(productoId) {
  const p = state.productos.find(function (x) { return x.id === productoId; });
  if (!p) return;
  const sugerido = Math.max(1, p.stockMinimo - p.cantidad);
 
  openModal("Comprar " + p.nombre,
    '<div class="field"><label>Cantidad comprada (' + p.unidad + ')</label><input type="number" name="cantidad" min="1" step="1" value="' + sugerido + '" required autofocus></div>' +
    '<div class="field"><label>Monto gastado (opcional)</label><input type="number" name="monto" min="0" step="1"></div>',
    function (data) {
      const cantidad = parseFloat(data.get("cantidad")) || 0;
      const monto = parseFloat(data.get("monto")) || 0;
      p.cantidad += cantidad;
      if (monto > 0) addMovimiento("gasto", monto, "Supermercado", p.nombre, "");
    }
  );
}
 
 
// ---------- MODAL: PRODUCTO (crear/editar) ----------
 
function openProductModal(productoId, categoriaPreset) {
  const p = productoId ? state.productos.find(function (x) { return x.id === productoId; }) : null;
  const opciones = STOCK_CATEGORIAS.map(function (c) {
    const sel = (p ? p.categoria : categoriaPreset) === c.nombre ? "selected" : "";
    return '<option value="' + c.nombre + '" ' + sel + '>' + c.icono + ' ' + c.nombre + '</option>';
  }).join("");
 
  openModal(p ? "Editar producto" : "Nuevo producto",
    '<div class="field"><label>Nombre</label><input type="text" name="nombre" required value="' + (p ? p.nombre : "") + '" autofocus></div>' +
    '<div class="field"><label>Categoría</label><select name="categoria">' + opciones + '</select></div>' +
    '<div class="field"><label>Cantidad</label><input type="number" name="cantidad" min="0" step="1" value="' + (p ? p.cantidad : 0) + '" required></div>' +
    '<div class="field"><label>Unidad</label><input type="text" name="unidad" value="' + (p ? p.unidad : "unidades") + '" required></div>' +
    '<div class="field"><label>Stock mínimo</label><input type="number" name="stockMinimo" min="0" step="1" value="' + (p ? p.stockMinimo : 1) + '" required></div>' +
    '<div class="field"><label>Nota (opcional)</label><input type="text" name="nota" value="' + (p ? p.nota : "") + '"></div>',
    function (data) {
      const payload = {
        nombre: data.get("nombre").trim(),
        categoria: data.get("categoria"),
        cantidad: parseFloat(data.get("cantidad")) || 0,
        unidad: data.get("unidad") || "unidades",
        stockMinimo: parseFloat(data.get("stockMinimo")) || 0,
        nota: data.get("nota") || ""
      };
      if (p) {
        Object.assign(p, payload);
      } else {
        payload.id = uid();
        payload.subcategoria = "";
        state.productos.push(payload);
      }
    },
    p ? function () {
      state.productos = state.productos.filter(function (x) { return x.id !== p.id; });
    } : null
  );
}
 
 
// ---------- MODAL: CUENTA ----------
 
function openCuentaModal() {
  openModal("Nueva cuenta",
    '<div class="field"><label>Nombre</label><input type="text" name="nombre" required autofocus></div>' +
    '<div class="field"><label>Monto</label><input type="number" name="monto" min="1" step="1" required></div>' +
    '<div class="field"><label>Fecha de vencimiento</label><input type="date" name="fechaVencimiento"></div>' +
    '<div class="field"><label>Nota (opcional)</label><input type="text" name="nota"></div>',
    function (data) {
      const monto = parseFloat(data.get("monto"));
      if (!monto || monto <= 0) return;
      state.cuentas.push({
        id: uid(), nombre: data.get("nombre").trim(), monto: monto,
        fechaVencimiento: data.get("fechaVencimiento") || "", estado: "pendiente",
        fechaPago: "", nota: data.get("nota") || ""
      });
    }
  );
}
 
function openPagarCuentaModal() {
  const pendientes = state.cuentas.filter(function (c) { return c.estado === "pendiente"; });
  if (pendientes.length === 0) {
    openModal("Pagar cuenta", '<div class="empty-state">No tenés cuentas pendientes 🎉</div>', function () {});
    return;
  }
  const opciones = pendientes.map(function (c) {
    return '<option value="' + c.id + '">' + c.nombre + " — " + formatMoney(c.monto) + '</option>';
  }).join("");
 
  openModal("Pagar cuenta",
    '<div class="field"><label>Cuenta</label><select name="cuentaId">' + opciones + '</select></div>',
    function (data) {
      pagarCuentaSilencioso(data.get("cuentaId"));
    }
  );
}
 
function pagarCuentaSilencioso(id) {
  const c = state.cuentas.find(function (x) { return x.id === id; });
  if (!c) return;
  c.estado = "pagada";
  c.fechaPago = todayISO();
  addMovimiento("pago_cuenta", c.monto, "Cuentas", c.nombre, "");
}
 
 
// ---------- MODAL: INGRESO ----------
 
function openIngresoModal() {
  openModal("Nuevo ingreso",
    '<div class="field"><label>Monto</label><input type="number" name="monto" min="1" step="1" required autofocus></div>' +
    '<div class="field"><label>Concepto / origen</label><input type="text" name="concepto" required placeholder="Sueldo, freelance..."></div>' +
    '<div class="field"><label>Nota (opcional)</label><input type="text" name="nota"></div>',
    function (data) {
      const monto = parseFloat(data.get("monto"));
      if (!monto || monto <= 0) return;
      addMovimiento("ingreso", monto, "", data.get("concepto"), data.get("nota"));
    }
  );
}
 
 
// ---------- MODAL: SEPARAR PLATA ----------
 
function openSepararModal() {
  openModal("Separar plata",
    '<div class="field"><label>Monto</label><input type="number" name="monto" min="1" step="1" required autofocus></div>' +
    '<div class="field"><label>Concepto</label><input type="text" name="concepto" required placeholder="Emergencias, alquiler..."></div>',
    function (data) {
      const monto = parseFloat(data.get("monto"));
      if (!monto || monto <= 0) return;
      state.separados.push({ id: uid(), fecha: todayISO(), monto: monto, concepto: data.get("concepto"), estado: "activo" });
      addMovimiento("separado", monto, "Separado", data.get("concepto"), "");
    }
  );
}
 
 
// ---------- NOTAS (popup en mobile) ----------
 
function showNote(event, note) {
  event.stopPropagation();
 
  if (window.matchMedia("(hover: hover) and (pointer: fine)").matches) return;
 
  const oldPopup = document.querySelector(".note-popup");
  if (oldPopup) oldPopup.remove();
 
  const popup = document.createElement("div");
  popup.className = "note-popup";
  popup.textContent = note;
  document.body.appendChild(popup);
 
  const button = event.currentTarget;
  const rect = button.getBoundingClientRect();
 
  let left = rect.left + (rect.width / 2) - (popup.offsetWidth / 2);
  let top = rect.top - popup.offsetHeight - 10;
 
  left = Math.max(8, Math.min(left, window.innerWidth - popup.offsetWidth - 8));
  if (top < 8) top = rect.bottom + 10;
 
  popup.style.left = left + "px";
  popup.style.top = top + "px";
 
  setTimeout(function () { if (popup) popup.remove(); }, 3000);
}
 
 
// ---------- INIT ----------
 
document.addEventListener("DOMContentLoaded", function () {
  state = loadState();
  saveState();
 
  document.getElementById("stockSearch").addEventListener("input", renderStockSearch);
  document.getElementById("categorySearch").addEventListener("input", renderCategoryScreen);
 
  document.getElementById("modalRoot").addEventListener("click", function (e) {
    if (e.target.id === "modalRoot") closeModal();
  });
 
  goHome();
});
 
