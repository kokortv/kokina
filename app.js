const STORAGE_KEY = "price-nearby-state-v1";
const CONFIG_KEY = "price-nearby-config-v1";
const HEADERS = [
  "Штрихкод",
  "Название товара",
  "Дата внесения в базу",
  "Цена",
  "Количество",
  "Валюта",
  "Координаты магазина",
  "Название магазина",
  "Адрес/локация",
  "Страна",
  "Категория",
  "Единица",
  "Заметка",
  "ID записи",
  "Дата синхронизации"
];

const SHEET_TITLE_LIMIT = 90;
const DEFAULT_SHEET_NAME = "Без координат";
const STORES_SHEET_NAME = "Магазины";
const STORE_HEADERS = ["Название", "Адрес/локация", "Широта", "Долгота", "Координаты", "Страна", "Ключ магазина", "Лист"];
const GOOGLE_CLIENT_ID = "3205621524-fvs740mecsoe79pksh733e577od5n07b.apps.googleusercontent.com";
const GOOGLE_AUTH_TTL_MS = 7 * 24 * 60 * 60 * 1000;

const currencyRegions = [
  { country: "Грузия", currency: "GEL", minLat: 41.0, maxLat: 43.8, minLon: 39.8, maxLon: 46.8 },
  { country: "Армения", currency: "AMD", minLat: 38.7, maxLat: 41.4, minLon: 43.4, maxLon: 46.7 },
  { country: "Турция", currency: "TRY", minLat: 35.7, maxLat: 42.2, minLon: 25.6, maxLon: 45.1 },
  { country: "Россия", currency: "RUB", minLat: 41.0, maxLat: 82.0, minLon: 19.0, maxLon: 180.0 },
  { country: "США", currency: "USD", minLat: 24.4, maxLat: 49.4, minLon: -124.8, maxLon: -66.9 },
  { country: "Германия", currency: "EUR", minLat: 47.2, maxLat: 55.1, minLon: 5.8, maxLon: 15.1 },
  { country: "Франция", currency: "EUR", minLat: 41.3, maxLat: 51.2, minLon: -5.2, maxLon: 9.7 },
  { country: "Испания", currency: "EUR", minLat: 36.0, maxLat: 43.9, minLon: -9.5, maxLon: 3.4 },
  { country: "Италия", currency: "EUR", minLat: 36.6, maxLat: 47.1, minLon: 6.6, maxLon: 18.6 }
];

const categoryRules = [
  ["Молочные и яйца", ["молоко", "кефир", "йогурт", "сыр", "творог", "масло", "сметана", "яйц", "cream", "milk", "cheese", "egg"]],
  ["Хлеб и выпечка", ["хлеб", "лаваш", "булка", "батон", "круассан", "bread"]],
  ["Овощи", ["помидор", "томат", "огур", "карто", "лук", "морковь", "капуста", "перец", "зелень"]],
  ["Фрукты", ["яблок", "банан", "груш", "апельсин", "лимон", "виноград", "ягод"]],
  ["Мясо и птица", ["кур", "говя", "свини", "фарш", "колбас", "ветчина", "meat", "chicken"]],
  ["Рыба", ["рыба", "лосось", "тунец", "форель", "скумбр", "fish"]],
  ["Бакалея", ["рис", "греч", "макарон", "паста", "мука", "сахар", "соль", "масло раст", "круп"]],
  ["Напитки", ["вода", "сок", "чай", "кофе", "лимонад", "cola", "water"]],
  ["Сладкое", ["шоколад", "печенье", "конфет", "морож", "вафл", "торт"]],
  ["Бытовое", ["порошок", "бумага", "салфет", "мыло", "шампун", "паста зуб"]]
];

const categories = [...categoryRules.map(([name]) => name), "Другое"];

const state = loadState();
const config = loadConfig();
let accessToken = "";
let tokenClient = null;
let currentPosition = null;
let currentStep = 0;
let currentVisit = null;
let editingVisitItemId = "";
let scannerStream = null;
let scannerActive = false;
let syncInProgress = false;
let autoSyncTimer = null;
let authRestoreInProgress = false;

const wizardCopy = [
  ["Где вы сейчас?", "Выберите или введите магазин. Приложение запомнит его для следующих покупок."],
  ["Уточним место", "После этого начнется визит: магазин останется выбранным, пока вы не выйдете."],
  ["Что на ценнике?", "Сначала попробуйте фото или штрихкод. Ручной ввод остается рядом, если ценник сложный."],
  ["Сколько стоит?", "Проверьте товар и внесите цену. Количество и единица остаются под рукой."],
  ["Проверка товара", "Оставьте категорию как есть или поправьте. Штрихкод и заметка спрятаны ниже."]
];

const els = {};

document.addEventListener("DOMContentLoaded", () => {
  bindElements();
  initDefaults();
  bindEvents();
  registerServiceWorker();
  startAutoSync();
  render();
  tryRestoreGoogleSession();
});

function bindElements() {
  [
    "syncStatus",
    "mainLayout",
    "workspacePanel",
    "openDataButton",
    "openSettingsButton",
    "priceForm",
    "stepLabel",
    "progressFill",
    "stepHint",
    "wizardSummary",
    "visitBasket",
    "backStepButton",
    "nextStepButton",
    "saveButton",
    "finishVisitButton",
    "storeInput",
    "locationInput",
    "productInput",
    "productsList",
    "productChips",
    "priceContext",
    "priceInput",
    "quantityInput",
    "currencyInput",
    "unitInput",
    "barcodeInput",
    "categoryInput",
    "noteInput",
    "pricePhotoInput",
    "scanBarcodeButton",
    "photoPreview",
    "ocrBox",
    "storesList",
    "storeChips",
    "categoriesList",
    "locateButton",
    "compareSearch",
    "bestPrices",
    "historyProduct",
    "historyChart",
    "historyRows",
    "entriesTable",
    "exportButton",
    "storePointForm",
    "storePointNameInput",
    "storePointLocationInput",
    "storePointLatInput",
    "storePointLonInput",
    "storeMap",
    "storePointsList",
    "barcodeScanner",
    "scannerVideo",
    "scannerStatus",
    "closeScannerButton",
    "entryEditor",
    "entryEditorForm",
    "closeEntryEditorButton",
    "deleteEntryButton",
    "editEntryIdInput",
    "editBarcodeInput",
    "editProductInput",
    "editPriceInput",
    "editQuantityInput",
    "editCurrencyInput",
    "editUnitInput",
    "editCategoryInput",
    "editStoreInput",
    "editLocationInput",
    "editLatitudeInput",
    "editLongitudeInput",
    "editNoteInput",
    "clientIdField",
    "clientIdInput",
    "sheetIdInput",
    "connectButton",
    "createSheetButton",
    "syncButton",
    "sheetLink",
    "toast"
  ].forEach((id) => {
    els[id] = document.getElementById(id);
  });
}

function initDefaults() {
  els.clientIdInput.value = getGoogleClientId() || "";
  if (GOOGLE_CLIENT_ID && els.clientIdField) {
    els.clientIdField.classList.add("hidden");
  }
  els.sheetIdInput.value = config.spreadsheetId || "";
  categories.forEach((category) => {
    const option = document.createElement("option");
    option.value = category;
    els.categoriesList.appendChild(option);
  });
}

function bindEvents() {
  els.priceForm.addEventListener("submit", handleAddPrice);
  els.openDataButton.addEventListener("click", () => showWorkspace("compare"));
  els.openSettingsButton.addEventListener("click", () => showWorkspace("settings"));
  els.backStepButton.addEventListener("click", previousStep);
  els.nextStepButton.addEventListener("click", nextStep);
  els.finishVisitButton.addEventListener("click", finishVisit);
  els.visitBasket.addEventListener("click", handleBasketAction);
  els.locateButton.addEventListener("click", locateUser);
  els.pricePhotoInput.addEventListener("change", handlePricePhoto);
  els.scanBarcodeButton.addEventListener("click", startBarcodeScanner);
  els.closeScannerButton.addEventListener("click", stopBarcodeScanner);
  els.storePointForm.addEventListener("submit", handleAddStorePoint);
  els.entriesTable.addEventListener("click", handleEntryTableAction);
  els.entryEditorForm.addEventListener("submit", handleSaveEntryEdit);
  els.closeEntryEditorButton.addEventListener("click", closeEntryEditor);
  els.deleteEntryButton.addEventListener("click", handleDeleteSavedEntry);
  els.editBarcodeInput.addEventListener("input", () => applyProductHistoryByBarcode(els.editBarcodeInput.value, "editor"));
  els.barcodeInput.addEventListener("input", () => applyProductHistoryByBarcode(els.barcodeInput.value, "wizard"));
  els.productInput.addEventListener("input", () => {
    if (!els.categoryInput.value.trim()) {
      els.categoryInput.value = categorize(els.productInput.value);
    }
  });
  els.productChips.addEventListener("click", (event) => {
    const button = event.target.closest("[data-product]");
    if (!button) return;
    els.productInput.value = button.dataset.product;
    els.categoryInput.value = categorize(button.dataset.product);
    updateWizardSummary();
    nextStep();
  });
  els.compareSearch.addEventListener("input", renderBestPrices);
  els.historyProduct.addEventListener("change", renderHistory);
  els.exportButton.addEventListener("click", exportCsv);
  els.connectButton.addEventListener("click", connectGoogle);
  els.createSheetButton.addEventListener("click", createSpreadsheet);
  els.syncButton.addEventListener("click", syncWithSheets);
  els.clientIdInput.addEventListener("change", saveConfigFromInputs);
  els.sheetIdInput.addEventListener("change", saveConfigFromInputs);
  window.addEventListener("online", () => {
    renderSheetStatus();
    runAutoSync();
  });
  window.addEventListener("offline", renderSheetStatus);
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible") runAutoSync();
  });

  document.querySelectorAll("[data-product]").forEach((button) => {
    button.addEventListener("click", () => {
      els.productInput.value = button.dataset.product;
      els.categoryInput.value = categorize(button.dataset.product);
      updateWizardSummary();
      nextStep();
    });
  });

  document.querySelectorAll(".tab-button").forEach((button) => {
    button.addEventListener("click", () => switchView(button.dataset.view));
  });

  [els.storeInput, els.locationInput, els.productInput, els.priceInput, els.quantityInput, els.currencyInput, els.unitInput, els.barcodeInput, els.categoryInput, els.noteInput]
    .forEach((input) => input.addEventListener("input", updateWizardSummary));
}

function handleAddPrice(event) {
  event.preventDefault();
  const form = new FormData(els.priceForm);
  const product = cleanText(form.get("product"));
  const store = currentVisit?.store || cleanText(form.get("store"));
  const price = Number(form.get("price"));
  const quantity = Number(form.get("quantity") || 1);

  if (!product || !store || !Number.isFinite(price) || !Number.isFinite(quantity) || quantity <= 0) {
    showToast("Проверьте товар, цену и количество.");
    return;
  }

  const item = {
    id: editingVisitItemId || crypto.randomUUID(),
    createdAt: new Date().toISOString(),
    barcode: cleanText(form.get("barcode")),
    store,
    location: currentVisit?.location || cleanText(form.get("location")),
    latitude: currentVisit?.latitude || currentPosition?.latitude || "",
    longitude: currentVisit?.longitude || currentPosition?.longitude || "",
    coordinates: currentVisit?.coordinates || coordinatesString(currentVisit || currentPosition),
    country: currentVisit?.country || countryFromCoordinates(currentVisit || currentPosition),
    storeKey: currentVisit?.storeKey || storeKeyFor({
      store,
      latitude: currentVisit?.latitude || currentPosition?.latitude || "",
      longitude: currentVisit?.longitude || currentPosition?.longitude || "",
      location: currentVisit?.location || cleanText(form.get("location"))
    }),
    sheetName: currentVisit?.sheetName || sheetNameFor({
      store,
      latitude: currentVisit?.latitude || currentPosition?.latitude || "",
      longitude: currentVisit?.longitude || currentPosition?.longitude || "",
      location: currentVisit?.location || cleanText(form.get("location"))
    }),
    product,
    normalizedProduct: normalizeProduct(product),
    category: cleanText(form.get("category")) || categorize(product),
    price,
    quantity,
    currency: form.get("currency") || "GEL",
    unit: form.get("unit") || "шт",
    note: cleanText(form.get("note")),
    syncedAt: ""
  };

  ensureVisit();
  const wasEditing = Boolean(editingVisitItemId);
  if (editingVisitItemId) {
    const index = currentVisit.items.findIndex((visitItem) => visitItem.id === editingVisitItemId);
    if (index >= 0) {
      item.createdAt = currentVisit.items[index].createdAt || item.createdAt;
      currentVisit.items[index] = item;
    } else {
      currentVisit.items.push(item);
    }
  } else {
    currentVisit.items.push(item);
  }
  editingVisitItemId = "";
  rememberStore(item);
  resetItemFields();
  currentStep = 2;
  render();
  updateWizard();
  showToast(wasEditing ? "Товар обновлен." : "Товар добавлен в визит.");
}

function locateUser() {
  if (!navigator.geolocation) {
    showToast("Геолокация недоступна в этом браузере.");
    return;
  }
  navigator.geolocation.getCurrentPosition(
    (position) => {
      currentPosition = {
        latitude: Number(position.coords.latitude.toFixed(6)),
        longitude: Number(position.coords.longitude.toFixed(6))
      };
      if (!els.locationInput.value.trim()) {
        els.locationInput.value = `${currentPosition.latitude}, ${currentPosition.longitude}`;
      }
      const region = regionFromCoordinates(currentPosition);
      if (region?.currency) {
        els.currencyInput.value = region.currency;
        showToast(`Локация добавлена. Валюта: ${region.currency}.`);
      } else {
        showToast("Локация добавлена.");
      }
    },
    () => showToast("Не получилось получить локацию."),
    { enableHighAccuracy: true, timeout: 10000, maximumAge: 300000 }
  );
}

function switchView(view) {
  els.workspacePanel.classList.remove("hidden");
  els.mainLayout.classList.remove("single-mode");
  document.querySelectorAll(".tab-button").forEach((button) => {
    button.classList.toggle("active", button.dataset.view === view);
  });
  document.querySelectorAll(".view").forEach((section) => {
    section.classList.toggle("active", section.id === `${view}View`);
  });
  if (view === "history") {
    renderHistory();
  }
}

function showWorkspace(view) {
  switchView(view);
  els.workspacePanel.scrollIntoView({ behavior: "smooth", block: "start" });
}

function render() {
  renderStoreOptions();
  renderProductOptions();
  renderProductChips();
  renderStoreChips();
  renderBestPrices();
  renderHistorySelect();
  renderHistory();
  renderEntriesTable();
  renderSheetStatus();
  renderVisitBasket();
  renderStorePoints();
  updateWizard();
}

function renderStoreOptions() {
  els.storesList.innerHTML = "";
  state.stores
    .slice()
    .sort((a, b) => a.name.localeCompare(b.name, "ru"))
    .forEach((store) => {
      const option = document.createElement("option");
      option.value = store.name;
      option.label = store.location || store.name;
      els.storesList.appendChild(option);
    });
}

function renderProductOptions() {
  els.productsList.innerHTML = "";
  const products = unique([
    ...(currentVisit?.items || []).map((entry) => entry.product),
    ...state.entries.map((entry) => entry.product)
  ]).sort((a, b) => a.localeCompare(b, "ru"));

  products.forEach((product) => {
    const option = document.createElement("option");
    option.value = product;
    const latest = state.entries.find((entry) => entry.product === product);
    option.label = latest ? `${latest.category || ""} ${latest.barcode || ""}`.trim() : product;
    els.productsList.appendChild(option);
  });
}

function renderProductChips() {
  const fallback = ["Молоко 2.5%", "Хлеб", "Яйца 10 шт"];
  const recent = unique(state.entries.map((entry) => entry.product)).slice(0, 6);
  const products = recent.length ? recent : fallback;
  els.productChips.innerHTML = products.map((product) => (
    `<button type="button" class="chip" data-product="${escapeHtml(product)}">${escapeHtml(shortProductName(product))}</button>`
  )).join("");
}

function renderStoreChips() {
  els.storeChips.innerHTML = "";
  state.stores.slice(0, 4).forEach((store) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "chip";
    button.textContent = store.name;
    button.addEventListener("click", () => {
      els.storeInput.value = store.name;
      els.locationInput.value = store.location || els.locationInput.value;
      currentPosition = store.latitude && store.longitude
        ? { latitude: Number(store.latitude), longitude: Number(store.longitude) }
        : currentPosition;
      updateWizardSummary();
      nextStep();
    });
    els.storeChips.appendChild(button);
  });
}

function nextStep() {
  if (!validateStep(currentStep)) return;
  if (currentStep === 1) {
    ensureVisit();
    renderVisitBasket();
  }
  currentStep = Math.min(currentStep + 1, wizardCopy.length - 1);
  if (currentStep === 4 && !els.categoryInput.value.trim()) {
    els.categoryInput.value = categorize(els.productInput.value);
  }
  updateWizard();
}

function previousStep() {
  currentStep = Math.max(currentStep - 1, 0);
  updateWizard();
}

function validateStep(step) {
  const checks = [
    [els.storeInput, "Введите магазин."],
    [null, ""],
    [els.productInput, "Введите товар."],
    [els.priceInput, "Введите цену."],
    [null, ""]
  ];
  const [input, message] = checks[step];
  if (!input) return true;
  const value = cleanText(input.value);
  const isValidPrice = input === els.priceInput ? Number(input.value) > 0 : true;
  const isValidQuantity = step === 3 ? Number(els.quantityInput.value) > 0 : true;
  if (!value || !isValidPrice || !isValidQuantity) {
    input.focus();
    showToast(isValidQuantity ? message : "Введите количество.");
    return false;
  }
  return true;
}

function updateWizard() {
  document.querySelectorAll(".wizard-step").forEach((step) => {
    step.classList.toggle("active", Number(step.dataset.step) === currentStep);
  });
  const [title, hint] = wizardCopy[currentStep];
  document.getElementById("add-title").textContent = title;
  els.stepHint.textContent = hint;
  els.stepLabel.textContent = currentVisit
    ? `${currentVisit.store} · товар ${currentVisit.items.length + 1}`
    : `Шаг ${currentStep + 1} из ${wizardCopy.length}`;
  els.progressFill.style.width = `${((currentStep + 1) / wizardCopy.length) * 100}%`;
  els.backStepButton.disabled = currentStep === 0 || (currentVisit && currentStep === 2);
  els.nextStepButton.classList.toggle("hidden", currentStep === wizardCopy.length - 1);
  els.saveButton.classList.toggle("hidden", currentStep !== wizardCopy.length - 1);
  els.saveButton.textContent = editingVisitItemId ? "Сохранить правку" : "Добавить в визит";
  els.finishVisitButton.classList.add("hidden");
  renderVisitBasket();
  updateWizardSummary();

  const activeInput = document.querySelector(".wizard-step.active input, .wizard-step.active textarea, .wizard-step.active select");
  if (activeInput) {
    window.setTimeout(() => activeInput.focus({ preventScroll: true }), 80);
  }
}

function updateWizardSummary() {
  const bits = [
    currentVisit?.store || cleanText(els.storeInput.value),
    cleanText(els.productInput.value),
    cleanText(els.priceInput.value) ? `${els.priceInput.value} ${els.currencyInput.value} × ${els.quantityInput.value || 1}` : "",
    cleanText(els.categoryInput.value)
  ].filter(Boolean);
  els.wizardSummary.textContent = bits.length ? bits.join(" · ") : "Выберите магазин, чтобы начать визит.";
  if (els.priceContext) {
    const product = cleanText(els.productInput.value);
    const category = cleanText(els.categoryInput.value) || (product ? categorize(product) : "");
    els.priceContext.innerHTML = product
      ? `<span>Товар</span><strong>${escapeHtml(product)}</strong><small>${escapeHtml(category || "Категория определится автоматически")}</small>`
      : "<span>Товар</span><strong>Выберите товар на предыдущем шаге</strong>";
  }
}

function ensureVisit() {
  if (currentVisit) return;
  const typedLocation = cleanText(els.locationInput.value);
  const typedCoordinates = parseCoordinates(typedLocation);
  currentVisit = {
    id: crypto.randomUUID(),
    startedAt: new Date().toISOString(),
    store: cleanText(els.storeInput.value),
    location: typedLocation,
    latitude: currentPosition?.latitude || typedCoordinates?.latitude || "",
    longitude: currentPosition?.longitude || typedCoordinates?.longitude || "",
    items: []
  };
  currentVisit.coordinates = coordinatesString(currentVisit);
  currentVisit.country = countryFromCoordinates(currentVisit);
  currentVisit.storeKey = storeKeyFor(currentVisit);
  currentVisit.sheetName = sheetNameFor(currentVisit);
  const region = regionFromCoordinates(currentVisit);
  if (region?.currency) {
    els.currencyInput.value = region.currency;
  }
}

function resetItemFields() {
  els.productInput.value = "";
  els.priceInput.value = "";
  els.quantityInput.value = "1";
  els.barcodeInput.value = "";
  els.categoryInput.value = "";
  els.noteInput.value = "";
  els.pricePhotoInput.value = "";
  els.photoPreview.innerHTML = "";
  els.photoPreview.classList.add("hidden");
  els.ocrBox.textContent = "";
  els.ocrBox.classList.add("hidden");
}

function finishVisit() {
  if (!currentVisit) return;
  if (!currentVisit.items.length) {
    currentVisit = null;
    currentStep = 0;
    render();
    showToast("Вышли из магазина без новых товаров.");
    return;
  }

  state.entries.unshift(...currentVisit.items);
  currentVisit.items.forEach(rememberStore);
  saveState();
  const savedCount = currentVisit.items.length;
  currentVisit = null;
  editingVisitItemId = "";
  currentStep = 0;
  els.priceForm.reset();
  els.currencyInput.value = "GEL";
  els.unitInput.value = "шт";
  resetItemFields();
  render();
  showToast(`Сохранено товаров: ${savedCount}.`);

  if (accessToken && config.spreadsheetId) {
    syncWithSheets();
  }
}

function renderVisitBasket() {
  if (!currentVisit) {
    els.visitBasket.classList.add("hidden");
    els.visitBasket.innerHTML = "";
    return;
  }

  els.visitBasket.classList.remove("hidden");
  const items = currentVisit.items;
  const total = items.reduce((sum, item) => sum + (Number(item.price) * Number(item.quantity || 1)), 0);
  const currency = items[0]?.currency || els.currencyInput.value;
  els.visitBasket.innerHTML = `
    <div class="basket-mini">
      <div>
        <span class="basket-kicker">Сейчас в магазине</span>
        <strong>${escapeHtml(currentVisit.store)}</strong>
      </div>
      <div class="basket-total">
        <strong>${items.length ? formatMoney(total, currency) : "0"}</strong>
        <span>${items.length} ${plural(items.length, "товар", "товара", "товаров")}</span>
      </div>
      <button class="basket-finish" type="button" data-finish-visit>${items.length ? "Сохранить и выйти" : "Выйти"}</button>
    </div>
    <details class="basket-details">
      <summary>${items.length ? "Посмотреть и исправить товары" : "Товары появятся здесь после добавления"}</summary>
      <div class="basket-list">
        ${items.length ? items.map((item) => `
          <div class="basket-item">
            <span>${escapeHtml(item.product)} · ${formatQuantity(item.quantity)} ${escapeHtml(item.unit || "шт")}</span>
            <strong>${formatMoney(Number(item.price) * Number(item.quantity || 1), item.currency)}</strong>
            <div class="basket-actions">
              <button type="button" data-edit-item="${escapeHtml(item.id)}">Изменить</button>
              <button type="button" data-delete-item="${escapeHtml(item.id)}">Удалить</button>
            </div>
          </div>
        `).join("") : "<span>Добавленные товары появятся здесь.</span>"}
      </div>
    </details>
  `;
}

function handleBasketAction(event) {
  if (event.target.closest("[data-finish-visit]")) {
    finishVisit();
    return;
  }
  const editId = event.target.closest("[data-edit-item]")?.dataset.editItem;
  const deleteId = event.target.closest("[data-delete-item]")?.dataset.deleteItem;
  if (editId) {
    editVisitItem(editId);
  }
  if (deleteId) {
    deleteVisitItem(deleteId);
  }
}

function editVisitItem(itemId) {
  if (!currentVisit) return;
  const item = currentVisit.items.find((visitItem) => visitItem.id === itemId);
  if (!item) return;
  editingVisitItemId = item.id;
  els.productInput.value = item.product || "";
  els.priceInput.value = item.price ?? "";
  els.quantityInput.value = item.quantity || 1;
  els.currencyInput.value = item.currency || "GEL";
  els.unitInput.value = item.unit || "шт";
  els.barcodeInput.value = item.barcode || "";
  els.categoryInput.value = item.category || categorize(item.product);
  els.noteInput.value = item.note || "";
  currentStep = 2;
  updateWizard();
  showToast("Товар открыт для редактирования.");
}

function deleteVisitItem(itemId) {
  if (!currentVisit) return;
  currentVisit.items = currentVisit.items.filter((item) => item.id !== itemId);
  if (editingVisitItemId === itemId) {
    editingVisitItemId = "";
    resetItemFields();
    currentStep = 2;
  }
  renderVisitBasket();
  updateWizard();
  showToast("Товар удален из визита.");
}

async function handlePricePhoto(event) {
  const file = event.target.files?.[0];
  if (!file) return;

  els.photoPreview.innerHTML = `<img alt="Фото ценника" src="${URL.createObjectURL(file)}">`;
  els.photoPreview.classList.remove("hidden");
  els.ocrBox.classList.remove("hidden");
  els.ocrBox.textContent = "Пытаюсь прочитать ценник...";

  if (!("TextDetector" in window)) {
    els.ocrBox.textContent = "В этом браузере нет локального OCR. Фото прикреплено, поля можно заполнить вручную.";
    return;
  }

  try {
    const bitmap = await createImageBitmap(file);
    const detector = new TextDetector();
    const detections = await detector.detect(bitmap);
    const text = detections.map((item) => item.rawValue).join("\n");
    const parsed = parsePriceTagText(text);
    if (parsed.product && !els.productInput.value.trim()) {
      els.productInput.value = parsed.product;
      els.categoryInput.value = categorize(parsed.product);
    }
    if (parsed.price && !els.priceInput.value.trim()) {
      els.priceInput.value = parsed.price;
    }
    if (parsed.barcode && !els.barcodeInput.value.trim()) {
      els.barcodeInput.value = parsed.barcode;
      applyProductHistoryByBarcode(parsed.barcode, "wizard");
    }
    els.ocrBox.textContent = text ? `Найдено: ${text}` : "Текст на фото не распознан. Заполните вручную.";
    updateWizardSummary();
  } catch {
    els.ocrBox.textContent = "Не получилось разобрать фото. Заполните поля вручную.";
  }
}

function parsePriceTagText(text) {
  const lines = text
    .split(/\n+/)
    .map(cleanText)
    .filter(Boolean);
  const priceMatches = text.match(/\b\d{1,4}[,.]\d{1,2}\b/g) || [];
  const price = priceMatches.length
    ? priceMatches[priceMatches.length - 1].replace(",", ".")
    : "";
  const product = lines
    .filter((line) => !/\d{1,4}[,.]\d{1,2}/.test(line))
    .sort((a, b) => b.length - a.length)[0] || "";
  const barcode = (text.match(/\b\d{8,14}\b/) || [])[0] || "";
  return { product, price, barcode };
}

async function startBarcodeScanner() {
  if (!("BarcodeDetector" in window)) {
    showToast("В этом браузере нет встроенного сканера штрихкодов.");
    return;
  }
  try {
    const detector = new BarcodeDetector({ formats: ["ean_13", "ean_8", "upc_a", "upc_e", "code_128"] });
    scannerStream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: "environment" },
      audio: false
    });
    els.scannerVideo.srcObject = scannerStream;
    els.barcodeScanner.classList.remove("hidden");
    els.scannerStatus.textContent = "Наведите камеру на штрихкод.";
    await els.scannerVideo.play();
    scannerActive = true;
    scanBarcodeLoop(detector);
  } catch {
    showToast("Не получилось открыть камеру для сканера.");
    stopBarcodeScanner();
  }
}

async function scanBarcodeLoop(detector) {
  if (!scannerActive) return;
  try {
    const codes = await detector.detect(els.scannerVideo);
    if (codes.length) {
      const barcode = codes[0].rawValue;
      els.barcodeInput.value = barcode;
      applyProductHistoryByBarcode(barcode, "wizard");
      stopBarcodeScanner();
      showToast(`Штрихкод найден: ${barcode}`);
      return;
    }
  } catch {
    // Keep scanning; camera frames can fail briefly while autofocus settles.
  }
  window.setTimeout(() => scanBarcodeLoop(detector), 220);
}

function stopBarcodeScanner() {
  scannerActive = false;
  if (scannerStream) {
    scannerStream.getTracks().forEach((track) => track.stop());
    scannerStream = null;
  }
  els.scannerVideo.srcObject = null;
  els.barcodeScanner.classList.add("hidden");
}

function applyProductHistoryByBarcode(barcode, target) {
  const cleanBarcode = cleanText(barcode);
  if (!cleanBarcode) return false;
  const candidates = [
    ...(currentVisit?.items || []),
    ...state.entries
  ].filter((entry) => cleanText(entry.barcode) === cleanBarcode);
  const latest = candidates.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))[0];
  if (!latest) return false;

  if (target === "editor") {
    if (!els.editProductInput.value.trim()) els.editProductInput.value = latest.product || "";
    if (!els.editCategoryInput.value.trim()) els.editCategoryInput.value = latest.category || "";
    if (!els.editUnitInput.value.trim()) els.editUnitInput.value = latest.unit || "шт";
    if (!els.editCurrencyInput.value.trim()) els.editCurrencyInput.value = latest.currency || "GEL";
  } else {
    if (!els.productInput.value.trim()) els.productInput.value = latest.product || "";
    if (!els.categoryInput.value.trim()) els.categoryInput.value = latest.category || categorize(latest.product);
    els.unitInput.value = latest.unit || els.unitInput.value;
    els.currencyInput.value = latest.currency || els.currencyInput.value;
    updateWizardSummary();
  }

  showToast("Товар подставлен из истории.");
  return true;
}

function renderBestPrices() {
  const query = normalizeProduct(els.compareSearch.value || "");
  const latestByProductStore = new Map();

  state.entries.forEach((entry) => {
    if (query && !entry.normalizedProduct.includes(query)) return;
    const key = `${entry.normalizedProduct}|${entry.storeKey || storeKeyFor(entry)}|${entry.unit}|${entry.currency}`;
    const previous = latestByProductStore.get(key);
    if (!previous || previous.createdAt < entry.createdAt) {
      latestByProductStore.set(key, entry);
    }
  });

  const grouped = new Map();
  latestByProductStore.forEach((entry) => {
    const key = `${entry.normalizedProduct}|${entry.unit}|${entry.currency}`;
    if (!grouped.has(key)) grouped.set(key, []);
    grouped.get(key).push(entry);
  });

  const cards = [...grouped.values()]
    .map((items) => items.sort((a, b) => a.price - b.price)[0])
    .sort((a, b) => a.product.localeCompare(b.product, "ru"));

  els.bestPrices.innerHTML = "";
  if (!cards.length) {
    els.bestPrices.appendChild(emptyState());
    return;
  }

  cards.forEach((entry) => {
    const alternatives = grouped.get(`${entry.normalizedProduct}|${entry.unit}|${entry.currency}`).length;
    const card = document.createElement("article");
    card.className = "price-card";
    card.innerHTML = `
      <div>
        <strong>${escapeHtml(entry.product)}</strong>
        <div class="meta">${escapeHtml(entry.store)} · ${escapeHtml(entry.location || entry.coordinates || "без локации")}</div>
        <span class="badge">${escapeHtml(entry.category || "Другое")}</span>
      </div>
      <div class="price">${formatMoney(entry.price, entry.currency)} / ${escapeHtml(entry.unit)}</div>
      <div class="meta">${alternatives} ${plural(alternatives, "магазин", "магазина", "магазинов")} в сравнении</div>
    `;
    els.bestPrices.appendChild(card);
  });
}

function renderHistorySelect() {
  const current = els.historyProduct.value;
  const products = unique(state.entries.map((entry) => entry.product)).sort((a, b) => a.localeCompare(b, "ru"));
  els.historyProduct.innerHTML = "";
  products.forEach((product) => {
    const option = document.createElement("option");
    option.value = product;
    option.textContent = product;
    els.historyProduct.appendChild(option);
  });
  if (products.includes(current)) {
    els.historyProduct.value = current;
  }
}

function renderHistory() {
  const product = els.historyProduct.value;
  const rows = state.entries
    .filter((entry) => entry.product === product)
    .slice()
    .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));

  drawChart(rows);
  els.historyRows.innerHTML = "";

  if (!rows.length) {
    els.historyRows.appendChild(emptyState());
    return;
  }

  rows.slice().reverse().forEach((entry) => {
    const item = document.createElement("div");
    item.className = "timeline-item";
    item.innerHTML = `
      <div>
        <strong>${formatDate(entry.createdAt)}</strong>
        <div class="meta">${escapeHtml(entry.store)} · ${escapeHtml(entry.location || entry.coordinates || "без локации")}</div>
      </div>
      <div class="price">${formatMoney(entry.price, entry.currency)}</div>
    `;
    els.historyRows.appendChild(item);
  });
}

function drawChart(rows) {
  const canvas = els.historyChart;
  const ctx = canvas.getContext("2d");
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = "#fbfdfc";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  if (rows.length < 2) {
    ctx.fillStyle = "#60716d";
    ctx.font = "18px system-ui";
    ctx.fillText("Нужно минимум две записи для графика", 28, 136);
    return;
  }

  const prices = rows.map((row) => row.price);
  const min = Math.min(...prices);
  const max = Math.max(...prices);
  const pad = 34;
  const spread = max - min || 1;

  ctx.strokeStyle = "#d7e1de";
  ctx.lineWidth = 1;
  for (let i = 0; i < 4; i += 1) {
    const y = pad + ((canvas.height - pad * 2) / 3) * i;
    ctx.beginPath();
    ctx.moveTo(pad, y);
    ctx.lineTo(canvas.width - pad, y);
    ctx.stroke();
  }

  ctx.strokeStyle = "#145c52";
  ctx.lineWidth = 3;
  ctx.beginPath();
  rows.forEach((row, index) => {
    const x = pad + ((canvas.width - pad * 2) / (rows.length - 1)) * index;
    const y = canvas.height - pad - ((row.price - min) / spread) * (canvas.height - pad * 2);
    if (index === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  });
  ctx.stroke();

  rows.forEach((row, index) => {
    const x = pad + ((canvas.width - pad * 2) / (rows.length - 1)) * index;
    const y = canvas.height - pad - ((row.price - min) / spread) * (canvas.height - pad * 2);
    ctx.fillStyle = "#d64f2f";
    ctx.beginPath();
    ctx.arc(x, y, 5, 0, Math.PI * 2);
    ctx.fill();
  });
}

function renderEntriesTable() {
  els.entriesTable.innerHTML = "";
  if (!state.entries.length) {
    const row = document.createElement("tr");
    row.innerHTML = `<td colspan="6"><div class="empty-state">Пока нет записей.</div></td>`;
    els.entriesTable.appendChild(row);
    return;
  }

  state.entries.slice(0, 80).forEach((entry) => {
    const row = document.createElement("tr");
    row.innerHTML = `
      <td data-label="Дата">${formatDate(entry.createdAt)}</td>
      <td data-label="Товар">${escapeHtml(entry.product)}</td>
      <td data-label="Цена">${formatMoney(entry.price, entry.currency)} / ${escapeHtml(entry.unit)}<br><span class="meta">× ${formatQuantity(entry.quantity || 1)} = ${formatMoney(Number(entry.price) * Number(entry.quantity || 1), entry.currency)}</span></td>
      <td data-label="Магазин">${escapeHtml(entry.store)}<br><span class="meta">${escapeHtml(entry.coordinates || coordinatesString(entry) || entry.location || "")}</span></td>
      <td data-label="Категория">${escapeHtml(entry.category)}</td>
      <td data-label="Действия">
        <div class="table-actions">
          <button class="table-action" type="button" data-edit-entry="${escapeHtml(entry.id)}">Изменить</button>
          <button class="table-action danger" type="button" data-delete-entry="${escapeHtml(entry.id)}">Удалить</button>
        </div>
      </td>
    `;
    els.entriesTable.appendChild(row);
  });
}

function renderSheetStatus() {
  const unsynced = state.entries.filter((entry) => !entry.syncedAt).length;
  const hasSheet = Boolean(config.spreadsheetId);
  const isOnline = navigator.onLine;
  els.syncStatus.textContent = isOnline
    ? (accessToken && hasSheet ? `Онлайн · Google · ${unsynced} в очереди` : `Онлайн · локально · ${unsynced} в очереди`)
    : `Офлайн · ${state.entries.length} локально`;
  els.syncStatus.classList.toggle("ready", isOnline && accessToken && hasSheet);
  els.syncStatus.classList.toggle("offline", !isOnline);
  els.sheetIdInput.value = config.spreadsheetId || els.sheetIdInput.value;
  els.connectButton.textContent = accessToken ? "Google подключен" : "Войти через Google";
  els.connectButton.disabled = Boolean(accessToken);
  els.createSheetButton.classList.toggle("hidden", Boolean(config.spreadsheetId));

  if (config.spreadsheetId) {
    els.sheetLink.href = `https://docs.google.com/spreadsheets/d/${config.spreadsheetId}/edit`;
    els.sheetLink.classList.remove("hidden");
  } else {
    els.sheetLink.classList.add("hidden");
  }
}

async function handleEntryTableAction(event) {
  const entryId = event.target.closest("[data-edit-entry]")?.dataset.editEntry;
  if (entryId) {
    openEntryEditor(entryId);
    return;
  }
  const deleteId = event.target.closest("[data-delete-entry]")?.dataset.deleteEntry;
  if (deleteId) {
    await deleteSavedEntry(deleteId);
  }
}

function openEntryEditor(entryId) {
  const entry = state.entries.find((item) => item.id === entryId);
  if (!entry) return;
  els.editEntryIdInput.value = entry.id;
  els.editBarcodeInput.value = entry.barcode || "";
  els.editProductInput.value = entry.product || "";
  els.editPriceInput.value = entry.price ?? "";
  els.editQuantityInput.value = entry.quantity || 1;
  els.editCurrencyInput.value = entry.currency || "GEL";
  els.editUnitInput.value = entry.unit || "шт";
  els.editCategoryInput.value = entry.category || "";
  els.editStoreInput.value = entry.store || "";
  els.editLocationInput.value = entry.location || "";
  els.editLatitudeInput.value = entry.latitude || "";
  els.editLongitudeInput.value = entry.longitude || "";
  els.editNoteInput.value = entry.note || "";
  els.entryEditor.classList.remove("hidden");
}

function closeEntryEditor() {
  els.entryEditor.classList.add("hidden");
  els.entryEditorForm.reset();
}

function handleSaveEntryEdit(event) {
  event.preventDefault();
  const entry = state.entries.find((item) => item.id === els.editEntryIdInput.value);
  if (!entry) return;

  const updated = {
    ...entry,
    barcode: cleanText(els.editBarcodeInput.value),
    product: cleanText(els.editProductInput.value),
    normalizedProduct: normalizeProduct(els.editProductInput.value),
    price: Number(els.editPriceInput.value),
    quantity: Number(els.editQuantityInput.value || 1),
    currency: cleanText(els.editCurrencyInput.value) || "GEL",
    unit: cleanText(els.editUnitInput.value) || "шт",
    category: cleanText(els.editCategoryInput.value) || categorize(els.editProductInput.value),
    store: cleanText(els.editStoreInput.value),
    location: cleanText(els.editLocationInput.value),
    latitude: cleanText(els.editLatitudeInput.value),
    longitude: cleanText(els.editLongitudeInput.value),
    note: cleanText(els.editNoteInput.value),
    syncedAt: ""
  };
  updated.coordinates = coordinatesString(updated);
  updated.country = countryFromCoordinates(updated);
  updated.storeKey = storeKeyFor(updated);
  updated.sheetName = sheetNameFor(updated);

  if (!updated.product || !updated.store || !Number.isFinite(updated.price) || !Number.isFinite(updated.quantity) || updated.quantity <= 0) {
    showToast("Проверьте товар, магазин, цену и количество.");
    return;
  }

  Object.assign(entry, updated);
  rememberStore(entry);
  saveState();
  closeEntryEditor();
  render();
  showToast("Запись обновлена и снова попадет в очередь Sheets.");
}

async function handleDeleteSavedEntry() {
  await deleteSavedEntry(els.editEntryIdInput.value);
  closeEntryEditor();
}

async function deleteSavedEntry(entryId) {
  if (!entryId) return;
  const entry = state.entries.find((item) => item.id === entryId);
  state.entries = state.entries.filter((entry) => entry.id !== entryId);
  saveState();
  render();

  if (entry && accessToken && config.spreadsheetId) {
    try {
      await deleteEntryFromSheets(entry);
      showToast("Запись удалена из приложения и Sheets.");
      return;
    } catch (error) {
      showToast(`Локально удалено. Sheets: ${error.message}`);
      return;
    }
  }

  showToast("Запись удалена локально.");
}

function handleAddStorePoint(event) {
  event.preventDefault();
  const store = {
    store: cleanText(els.storePointNameInput.value),
    name: cleanText(els.storePointNameInput.value),
    location: cleanText(els.storePointLocationInput.value),
    latitude: cleanText(els.storePointLatInput.value),
    longitude: cleanText(els.storePointLonInput.value)
  };
  if (!store.name) {
    showToast("Введите название магазина.");
    return;
  }
  store.coordinates = coordinatesString(store);
  store.country = countryFromCoordinates(store);
  store.storeKey = storeKeyFor(store);
  store.sheetName = sheetNameFor(store);
  const existingIndex = state.stores.findIndex((item) => (item.storeKey || storeKeyFor(item)) === store.storeKey);
  if (existingIndex >= 0) {
    state.stores[existingIndex] = { ...state.stores[existingIndex], ...store };
  } else {
    state.stores.push(store);
  }
  saveState();
  els.storePointForm.reset();
  render();
  showToast("Точка магазина сохранена.");
}

function renderStorePoints() {
  els.storePointsList.innerHTML = "";
  renderStoreMap();
  if (!state.stores.length) {
    els.storePointsList.innerHTML = `<div class="empty-state">Пока нет сохраненных точек.</div>`;
    return;
  }
  state.stores
    .slice()
    .sort((a, b) => (a.name || "").localeCompare(b.name || "", "ru"))
    .forEach((store) => {
      const item = document.createElement("div");
      item.className = "store-point";
      item.innerHTML = `
        <div>
          <strong>${escapeHtml(store.name || store.store || "Магазин")}</strong>
          <div class="meta">${escapeHtml(store.location || store.coordinates || "без локации")}</div>
          <div class="meta">${escapeHtml(store.country || "")}</div>
        </div>
        <button type="button" data-use-store="${escapeHtml(store.storeKey || storeKeyFor(store))}">Выбрать</button>
      `;
      item.querySelector("[data-use-store]").addEventListener("click", () => selectStorePoint(store));
      els.storePointsList.appendChild(item);
    });
}

function renderStoreMap() {
  const storesWithCoordinates = state.stores.filter((store) => hasCoordinate(store.latitude) && hasCoordinate(store.longitude));
  if (!storesWithCoordinates.length) {
    els.storeMap.innerHTML = `<div class="map-empty">Добавьте координаты, и точки появятся на схеме.</div>`;
    return;
  }

  const latitudes = storesWithCoordinates.map((store) => Number(store.latitude));
  const longitudes = storesWithCoordinates.map((store) => Number(store.longitude));
  const minLat = Math.min(...latitudes);
  const maxLat = Math.max(...latitudes);
  const minLon = Math.min(...longitudes);
  const maxLon = Math.max(...longitudes);
  const latRange = maxLat - minLat || 0.01;
  const lonRange = maxLon - minLon || 0.01;

  els.storeMap.innerHTML = storesWithCoordinates.map((store) => {
    const x = ((Number(store.longitude) - minLon) / lonRange) * 82 + 9;
    const y = 91 - ((Number(store.latitude) - minLat) / latRange) * 82;
    return `
      <button
        class="map-point"
        type="button"
        style="left:${x}%;top:${y}%"
        data-map-store="${escapeHtml(store.storeKey || storeKeyFor(store))}"
        title="${escapeHtml(store.name || store.store || "Магазин")}"
      ></button>
    `;
  }).join("");

  els.storeMap.querySelectorAll("[data-map-store]").forEach((button) => {
    button.addEventListener("click", () => {
      const store = state.stores.find((item) => (item.storeKey || storeKeyFor(item)) === button.dataset.mapStore);
      if (store) selectStorePoint(store);
    });
  });
}

function selectStorePoint(store) {
  els.storeInput.value = store.name || store.store || "";
  els.locationInput.value = store.location || store.coordinates || "";
  currentPosition = hasCoordinate(store.latitude) && hasCoordinate(store.longitude)
    ? { latitude: Number(store.latitude), longitude: Number(store.longitude) }
    : null;
  switchView("compare");
  currentStep = 1;
  updateWizard();
  showToast("Точка выбрана для нового визита.");
}

function startAutoSync() {
  clearInterval(autoSyncTimer);
  autoSyncTimer = setInterval(runAutoSync, 60000);
  window.setTimeout(runAutoSync, 1200);
}

function runAutoSync() {
  if (!navigator.onLine || syncInProgress) return;
  if (!accessToken) {
    tryRestoreGoogleSession();
    return;
  }
  if (!config.spreadsheetId) {
    connectKokinaSpreadsheet({ silent: true });
    return;
  }
  syncWithSheets({ silent: true });
}

async function tryRestoreGoogleSession() {
  if (authRestoreInProgress || accessToken || !navigator.onLine || !hasRecentGoogleAuth()) return;
  authRestoreInProgress = true;
  try {
    await waitForGoogleIdentity();
    connectGoogle({ silent: true });
  } catch {
    authRestoreInProgress = false;
  }
}

function hasRecentGoogleAuth() {
  return Date.now() - Number(config.googleAuthorizedAt || 0) < GOOGLE_AUTH_TTL_MS;
}

function waitForGoogleIdentity(timeout = 6000) {
  const startedAt = Date.now();
  return new Promise((resolve, reject) => {
    const tick = () => {
      if (window.google?.accounts?.oauth2) {
        resolve();
        return;
      }
      if (Date.now() - startedAt > timeout) {
        reject(new Error("Google Identity Services не загрузился."));
        return;
      }
      window.setTimeout(tick, 180);
    };
    tick();
  });
}

function connectGoogle(options = {}) {
  const silent = Boolean(options.silent);
  saveConfigFromInputs();
  const clientId = getGoogleClientId();
  if (!clientId) {
    if (!silent) showToast("Нужно один раз встроить Google OAuth Client ID в приложение.");
    authRestoreInProgress = false;
    return;
  }
  if (!window.google?.accounts?.oauth2) {
    if (!silent) showToast("Google Identity Services еще не загрузился.");
    authRestoreInProgress = false;
    return;
  }

  tokenClient = google.accounts.oauth2.initTokenClient({
    client_id: clientId,
    scope: "https://www.googleapis.com/auth/spreadsheets https://www.googleapis.com/auth/drive.metadata.readonly",
    callback: async (response) => {
      authRestoreInProgress = false;
      if (response.error) {
        if (!silent) showToast(`Google OAuth: ${response.error}`);
        return;
      }
      accessToken = response.access_token;
      config.googleAuthorizedAt = Date.now();
      saveConfig();
      renderSheetStatus();
      if (!silent) showToast("Вход через Google выполнен.");
      await connectKokinaSpreadsheet({ silent });
    }
  });
  tokenClient.requestAccessToken({ prompt: silent || accessToken ? "" : "consent" });
}

async function connectKokinaSpreadsheet(options = {}) {
  const silent = Boolean(options.silent);
  if (config.spreadsheetId) {
    await syncWithSheets({ silent });
    return;
  }

  try {
    const sheet = await findKokinaSpreadsheet();
    if (!sheet) {
      if (!silent) showToast("Таблица Kokina не найдена. Создайте новую один раз.");
      return;
    }
    config.spreadsheetId = sheet.id;
    saveConfig();
    renderSheetStatus();
    if (!silent) showToast(`Найдена таблица: ${sheet.name}.`);
    await syncWithSheets({ silent });
  } catch (error) {
    if (!silent) showToast(error.message);
  }
}

async function findKokinaSpreadsheet() {
  const query = "mimeType='application/vnd.google-apps.spreadsheet' and trashed=false and name contains 'Kokina'";
  const params = new URLSearchParams({
    q: query,
    fields: "files(id,name,modifiedTime,webViewLink)",
    orderBy: "modifiedTime desc",
    pageSize: "10"
  });
  const data = await googleFetch(`https://www.googleapis.com/drive/v3/files?${params.toString()}`);
  return (data.files || [])[0] || null;
}

async function createSpreadsheet() {
  if (!accessToken) {
    connectGoogle();
    showToast("После входа нажмите создание таблицы еще раз.");
    return;
  }

  try {
    const title = `Kokina Prices - ${new Date().toLocaleDateString("ru-RU")}`;
    const response = await googleFetch("https://sheets.googleapis.com/v4/spreadsheets", {
      method: "POST",
      body: JSON.stringify({
        properties: { title },
        sheets: [{ properties: { title: STORES_SHEET_NAME } }]
      })
    });
    config.spreadsheetId = response.spreadsheetId;
    saveConfig();
    await syncWithSheets();
    showToast("Google таблица создана.");
  } catch (error) {
    showToast(error.message);
  } finally {
    renderSheetStatus();
  }
}

async function writeHeaders(sheetName) {
  await googleFetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${config.spreadsheetId}/values/${encodeURIComponent(sheetRange(sheetName, "A1:O1"))}?valueInputOption=RAW`,
    {
      method: "PUT",
      body: JSON.stringify({ values: [HEADERS] })
    }
  );
}

async function syncWithSheets(options = {}) {
  const silent = Boolean(options.silent);
  if (syncInProgress) return;
  saveConfigFromInputs();
  if (!accessToken) {
    if (!silent) showToast("Сначала войдите через Google.");
    return;
  }
  if (!config.spreadsheetId) {
    if (!silent) showToast("Создайте таблицу или вставьте Spreadsheet ID.");
    return;
  }

  syncInProgress = true;
  try {
    const existingSheets = await getSheetTitles();
    if (!existingSheets.has(STORES_SHEET_NAME)) {
      await createStoreSheet(STORES_SHEET_NAME);
      existingSheets.add(STORES_SHEET_NAME);
    }
    if (existingSheets.has("README")) {
      await deleteSheetByTitle("README");
      existingSheets.delete("README");
    }
    const remoteStores = await readStoresFromSheets(existingSheets);
    const importedStoresCount = mergeRemoteStores(remoteStores);
    const remoteEntries = await readEntriesFromSheets(existingSheets);
    const { importedCount, removedCount } = mergeRemoteEntries(remoteEntries);
    const pending = state.entries.filter((entry) => !entry.syncedAt);
    await writeStoreIndex();

    if (!pending.length) {
      saveState();
      render();
      if (!silent) {
        showToast(importedCount || importedStoresCount || removedCount
          ? `Из Sheets: ${importedCount} цен, ${importedStoresCount} магазинов, удалено ${removedCount}.`
          : "Sheets и приложение уже совпадают.");
      }
      return;
    }

    const syncedAt = new Date().toISOString();
    const grouped = groupBy(pending, (entry) => sheetNameFor(entry));

    for (const [sheetName, entries] of grouped.entries()) {
      if (!existingSheets.has(sheetName)) {
        await createStoreSheet(sheetName);
        existingSheets.add(sheetName);
      }
      await writeHeaders(sheetName);

      const values = entries.map((entry) => entryToRow({ ...entry, syncedAt }));
      await googleFetch(
        `https://sheets.googleapis.com/v4/spreadsheets/${config.spreadsheetId}/values/${encodeURIComponent(sheetRange(sheetName, "A:O"))}:append?valueInputOption=USER_ENTERED&insertDataOption=INSERT_ROWS`,
        {
          method: "POST",
          body: JSON.stringify({ values })
        }
      );
    }

    pending.forEach((entry) => {
      entry.syncedAt = syncedAt;
    });
    saveState();
    render();
    if (!silent) showToast(`Из Sheets: ${importedCount} цен, ${importedStoresCount} магазинов, удалено ${removedCount}. Отправлено: ${pending.length}.`);
  } catch (error) {
    if (!silent) showToast(error.message);
  } finally {
    syncInProgress = false;
    renderSheetStatus();
  }
}

async function readEntriesFromSheets(existingSheets) {
  const entries = [];
  for (const sheetName of existingSheets) {
    if (sheetName === "README" || sheetName === STORES_SHEET_NAME) continue;
    const data = await googleFetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${config.spreadsheetId}/values/${encodeURIComponent(sheetRange(sheetName, "A2:O"))}`
    );
    (data.values || []).forEach((row) => {
      const entry = rowToEntry(row, sheetName);
      if (entry) entries.push(entry);
    });
  }
  return entries;
}

async function readStoresFromSheets(existingSheets) {
  if (!existingSheets.has(STORES_SHEET_NAME)) return [];
  const data = await googleFetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${config.spreadsheetId}/values/${encodeURIComponent(sheetRange(STORES_SHEET_NAME, "A2:H"))}`
  );
  return (data.values || []).map(rowToStore).filter(Boolean);
}

function mergeRemoteStores(remoteStores) {
  let importedCount = 0;
  const localByKey = new Map(state.stores.map((store) => [store.storeKey || storeKeyFor(store), store]));
  remoteStores.forEach((remoteStore) => {
    const key = remoteStore.storeKey || storeKeyFor(remoteStore);
    const localStore = localByKey.get(key);
    if (localStore) {
      Object.assign(localStore, { ...remoteStore, storeKey: key });
      return;
    }
    state.stores.push({ ...remoteStore, storeKey: key });
    localByKey.set(key, remoteStore);
    importedCount += 1;
  });
  return importedCount;
}

async function writeStoreIndex() {
  await writeStoreHeaders();
  const stores = [...new Map(state.stores.map((store) => [store.storeKey || storeKeyFor(store), store])).values()]
    .sort((a, b) => (a.name || a.store || "").localeCompare(b.name || b.store || "", "ru"));
  state.stores = stores;
  await googleFetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${config.spreadsheetId}/values/${encodeURIComponent(sheetRange(STORES_SHEET_NAME, "A2:H"))}:clear`,
    {
      method: "POST",
      body: JSON.stringify({})
    }
  );
  await googleFetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${config.spreadsheetId}/values/${encodeURIComponent(sheetRange(STORES_SHEET_NAME, "A1:H"))}?valueInputOption=RAW`,
    {
      method: "PUT",
      body: JSON.stringify({ values: [STORE_HEADERS, ...stores.map(storeToRow)] })
    }
  );
}

async function writeStoreHeaders() {
  await googleFetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${config.spreadsheetId}/values/${encodeURIComponent(sheetRange(STORES_SHEET_NAME, "A1:H1"))}?valueInputOption=RAW`,
    {
      method: "PUT",
      body: JSON.stringify({ values: [STORE_HEADERS] })
    }
  );
}

function mergeRemoteEntries(remoteEntries) {
  let importedCount = 0;
  let removedCount = 0;
  const localById = new Map(state.entries.map((entry) => [entry.id, entry]));
  const remoteIds = new Set(remoteEntries.map((entry) => entry.id));

  remoteEntries.forEach((remoteEntry) => {
    const localEntry = localById.get(remoteEntry.id);
    if (!localEntry) {
      state.entries.push(remoteEntry);
      localById.set(remoteEntry.id, remoteEntry);
      importedCount += 1;
      return;
    }

    if (localEntry.syncedAt) {
      Object.assign(localEntry, remoteEntry);
    }
  });

  state.entries = [...new Map(state.entries.map((entry) => [entry.id, entry])).values()]
    .filter((entry) => {
      const keep = !entry.syncedAt || remoteIds.has(entry.id);
      if (!keep) removedCount += 1;
      return keep;
    })
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  state.entries.forEach(rememberStore);
  return { importedCount, removedCount };
}

async function getSheetTitles() {
  const data = await googleFetch(`https://sheets.googleapis.com/v4/spreadsheets/${config.spreadsheetId}?fields=sheets.properties.title`);
  return new Set((data.sheets || []).map((sheet) => sheet.properties.title));
}

async function getSheetPropertiesByTitle() {
  const data = await googleFetch(`https://sheets.googleapis.com/v4/spreadsheets/${config.spreadsheetId}?fields=sheets.properties(title,sheetId)`);
  return new Map((data.sheets || []).map((sheet) => [sheet.properties.title, sheet.properties]));
}

async function deleteSheetByTitle(sheetName) {
  const properties = (await getSheetPropertiesByTitle()).get(sheetName);
  if (!properties) return;
  await googleFetch(`https://sheets.googleapis.com/v4/spreadsheets/${config.spreadsheetId}:batchUpdate`, {
    method: "POST",
    body: JSON.stringify({
      requests: [
        {
          deleteSheet: {
            sheetId: properties.sheetId
          }
        }
      ]
    })
  });
}

async function deleteEntryFromSheets(entry) {
  const sheetName = entry.sheetName || sheetNameFor(entry);
  const data = await googleFetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${config.spreadsheetId}/values/${encodeURIComponent(sheetRange(sheetName, "A2:O"))}`
  );
  const rowIndex = (data.values || []).findIndex((row) => cleanText(row[13]) === entry.id);
  if (rowIndex < 0) return;

  const properties = (await getSheetPropertiesByTitle()).get(sheetName);
  if (!properties) throw new Error("лист не найден");

  await googleFetch(`https://sheets.googleapis.com/v4/spreadsheets/${config.spreadsheetId}:batchUpdate`, {
    method: "POST",
    body: JSON.stringify({
      requests: [
        {
          deleteDimension: {
            range: {
              sheetId: properties.sheetId,
              dimension: "ROWS",
              startIndex: rowIndex + 1,
              endIndex: rowIndex + 2
            }
          }
        }
      ]
    })
  });
}

async function createStoreSheet(sheetName) {
  await googleFetch(`https://sheets.googleapis.com/v4/spreadsheets/${config.spreadsheetId}:batchUpdate`, {
    method: "POST",
    body: JSON.stringify({
      requests: [
        {
          addSheet: {
            properties: {
              title: sheetName,
              gridProperties: {
                frozenRowCount: 1
              }
            }
          }
        }
      ]
    })
  });
}

async function googleFetch(url, options = {}) {
  const response = await fetch(url, {
    ...options,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
      ...(options.headers || {})
    }
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    if (response.status === 401) {
      accessToken = "";
      renderSheetStatus();
      tryRestoreGoogleSession();
    }
    const message = data.error?.message || `Google API error ${response.status}`;
    throw new Error(message);
  }
  return data;
}

function entryToRow(entry) {
  return [
    entry.barcode || "",
    entry.product || "",
    entry.createdAt || "",
    entry.price ?? "",
    entry.quantity || 1,
    entry.currency || "",
    entry.coordinates || coordinatesString(entry),
    entry.store || "",
    entry.location || "",
    entry.country || countryFromCoordinates(entry),
    entry.category || "",
    entry.unit || "",
    entry.note || "",
    entry.id || "",
    entry.syncedAt || ""
  ];
}

function rowToEntry(row, sheetName) {
  const product = cleanText(row[1]);
  const store = cleanText(row[7]);
  const id = cleanText(row[13]);
  if (!product || !store || !id) return null;

  const coordinates = cleanText(row[6]);
  const parsedCoordinates = parseCoordinates(coordinates);
  const entry = {
    barcode: cleanText(row[0]),
    product,
    createdAt: cleanText(row[2]) || new Date().toISOString(),
    price: parseSheetNumber(row[3]),
    quantity: parseSheetNumber(row[4]) || 1,
    currency: cleanText(row[5]) || "GEL",
    coordinates,
    store,
    location: cleanText(row[8]),
    country: cleanText(row[9]),
    category: cleanText(row[10]) || categorize(product),
    unit: cleanText(row[11]) || "шт",
    note: cleanText(row[12]),
    id,
    syncedAt: cleanText(row[14]) || new Date().toISOString(),
    sheetName
  };
  entry.latitude = parsedCoordinates?.latitude || "";
  entry.longitude = parsedCoordinates?.longitude || "";
  entry.normalizedProduct = normalizeProduct(entry.product);
  entry.storeKey = storeKeyFor(entry);
  return entry;
}

function storeToRow(store) {
  const normalizedStore = {
    ...store,
    coordinates: store.coordinates || coordinatesString(store),
    country: store.country || countryFromCoordinates(store),
    storeKey: store.storeKey || storeKeyFor(store),
    sheetName: store.sheetName || sheetNameFor(store)
  };
  return [
    normalizedStore.name || normalizedStore.store || "",
    normalizedStore.location || "",
    normalizedStore.latitude || "",
    normalizedStore.longitude || "",
    normalizedStore.coordinates || "",
    normalizedStore.country || "",
    normalizedStore.storeKey || "",
    normalizedStore.sheetName || ""
  ];
}

function rowToStore(row) {
  const name = cleanText(row[0]);
  if (!name) return null;
  const coordinates = cleanText(row[4]);
  const parsedCoordinates = parseCoordinates(coordinates);
  const store = {
    name,
    store: name,
    location: cleanText(row[1]),
    latitude: cleanText(row[2]) || parsedCoordinates?.latitude || "",
    longitude: cleanText(row[3]) || parsedCoordinates?.longitude || "",
    coordinates,
    country: cleanText(row[5]),
    storeKey: cleanText(row[6]),
    sheetName: cleanText(row[7])
  };
  store.coordinates = store.coordinates || coordinatesString(store);
  store.country = store.country || countryFromCoordinates(store);
  store.storeKey = store.storeKey || storeKeyFor(store);
  store.sheetName = store.sheetName || sheetNameFor(store);
  return store;
}

function exportCsv() {
  if (!state.entries.length) {
    showToast("Нет данных для CSV.");
    return;
  }
  const lines = [HEADERS.join(",")].concat(
    state.entries.map((entry) => entryToRow(entry).map(csvCell).join(","))
  );
  const blob = new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `prices-${new Date().toISOString().slice(0, 10)}.csv`;
  link.click();
  URL.revokeObjectURL(url);
}

function saveConfigFromInputs() {
  config.clientId = GOOGLE_CLIENT_ID ? "" : els.clientIdInput.value.trim();
  config.spreadsheetId = els.sheetIdInput.value.trim();
  saveConfig();
  renderSheetStatus();
}

function getGoogleClientId() {
  return GOOGLE_CLIENT_ID || config.clientId || "";
}

function rememberStore(entry) {
  const storeKey = entry.storeKey || storeKeyFor(entry);
  const existing = state.stores.find((store) => (store.storeKey || storeKeyFor(store)) === storeKey);
  if (existing) {
    existing.storeKey = storeKey;
    existing.sheetName = entry.sheetName || sheetNameFor(entry);
    existing.location = entry.location || existing.location;
    existing.latitude = entry.latitude || existing.latitude;
    existing.longitude = entry.longitude || existing.longitude;
    existing.coordinates = entry.coordinates || existing.coordinates || coordinatesString(entry);
    existing.country = entry.country || existing.country || countryFromCoordinates(entry);
  } else {
    state.stores.push({
      name: entry.store,
      storeKey,
      sheetName: entry.sheetName || sheetNameFor(entry),
      location: entry.location,
      latitude: entry.latitude,
      longitude: entry.longitude,
      coordinates: entry.coordinates || coordinatesString(entry),
      country: entry.country || countryFromCoordinates(entry)
    });
  }
}

function groupBy(items, getKey) {
  const grouped = new Map();
  items.forEach((item) => {
    const key = getKey(item);
    if (!grouped.has(key)) grouped.set(key, []);
    grouped.get(key).push(item);
  });
  return grouped;
}

function regionFromCoordinates(source) {
  if (!hasCoordinate(source?.latitude) || !hasCoordinate(source?.longitude)) return null;
  const latitude = Number(source.latitude);
  const longitude = Number(source.longitude);
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return null;
  return currencyRegions.find((region) => (
    latitude >= region.minLat &&
    latitude <= region.maxLat &&
    longitude >= region.minLon &&
    longitude <= region.maxLon
  )) || null;
}

function countryFromCoordinates(source) {
  return regionFromCoordinates(source)?.country || "";
}

function coordinatesString(source) {
  if (!hasCoordinate(source?.latitude) || !hasCoordinate(source?.longitude)) return "";
  const latitude = Number(source.latitude);
  const longitude = Number(source.longitude);
  return `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`;
}

function hasCoordinate(value) {
  return value !== "" && value !== null && value !== undefined && Number.isFinite(Number(value));
}

function parseCoordinates(value) {
  const match = cleanText(value).match(/(-?\d{1,2}(?:[.,]\d+)?)\s*[,;\s]\s*(-?\d{1,3}(?:[.,]\d+)?)/);
  if (!match) return null;
  const latitude = Number(match[1].replace(",", "."));
  const longitude = Number(match[2].replace(",", "."));
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return null;
  if (Math.abs(latitude) > 90 || Math.abs(longitude) > 180) return null;
  return { latitude, longitude };
}

function storeKeyFor(source) {
  const name = cleanText(source?.store || source?.name || "Магазин");
  const coordinates = coordinatesString(source);
  const fallback = cleanText(source?.location || DEFAULT_SHEET_NAME).toLowerCase();
  return normalizeProduct(`${name}|${coordinates || fallback}`);
}

function sheetNameFor(source) {
  const name = cleanText(source?.store || source?.name || "Магазин");
  const coordinates = coordinatesString(source);
  const location = cleanText(source?.location);
  const suffix = coordinates ? coordinates.replace(/\s/g, "") : (location || DEFAULT_SHEET_NAME);
  return sanitizeSheetName(`${name} ${suffix}`) || DEFAULT_SHEET_NAME;
}

function sanitizeSheetName(value) {
  return cleanText(value)
    .replace(/[\[\]\*\?\/\\:]/g, " ")
    .replace(/\s+/g, " ")
    .slice(0, SHEET_TITLE_LIMIT)
    .trim();
}

function sheetRange(sheetName, range) {
  return `'${String(sheetName).replaceAll("'", "''")}'!${range}`;
}

function categorize(product) {
  const normalized = normalizeProduct(product);
  const match = categoryRules.find(([, needles]) => needles.some((needle) => normalized.includes(needle)));
  return match ? match[0] : "Другое";
}

function normalizeProduct(value) {
  return cleanText(value).toLowerCase().replace(/[.,;:()]/g, "").replace(/\s+/g, " ");
}

function shortProductName(value) {
  const text = cleanText(value);
  return text.length > 18 ? `${text.slice(0, 17)}...` : text;
}

function cleanText(value) {
  return String(value || "").trim();
}

function unique(values) {
  return [...new Set(values.filter(Boolean))];
}

function formatMoney(value, currency) {
  return new Intl.NumberFormat("ru-RU", {
    style: "currency",
    currency: currency || "GEL",
    maximumFractionDigits: 2
  }).format(value);
}

function formatQuantity(value) {
  return new Intl.NumberFormat("ru-RU", {
    maximumFractionDigits: 3
  }).format(Number(value || 1));
}

function formatDate(value) {
  return new Intl.DateTimeFormat("ru-RU", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit"
  }).format(new Date(value));
}

function parseSheetNumber(value) {
  const number = Number(String(value || "").replace(",", "."));
  return Number.isFinite(number) ? number : 0;
}

function plural(count, one, few, many) {
  const mod10 = count % 10;
  const mod100 = count % 100;
  if (mod10 === 1 && mod100 !== 11) return one;
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return few;
  return many;
}

function escapeHtml(value) {
  return String(value || "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function csvCell(value) {
  return `"${String(value).replaceAll('"', '""')}"`;
}

function emptyState() {
  return document.getElementById("emptyStateTemplate").content.firstElementChild.cloneNode(true);
}

function showToast(message) {
  els.toast.textContent = message;
  els.toast.classList.add("show");
  clearTimeout(showToast.timer);
  showToast.timer = setTimeout(() => els.toast.classList.remove("show"), 2800);
}

function loadState() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) || { entries: [], stores: [] };
  } catch {
    return { entries: [], stores: [] };
  }
}

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function loadConfig() {
  try {
    return JSON.parse(localStorage.getItem(CONFIG_KEY)) || {};
  } catch {
    return {};
  }
}

function saveConfig() {
  localStorage.setItem(CONFIG_KEY, JSON.stringify(config));
}

function registerServiceWorker() {
  if ("serviceWorker" in navigator) {
    navigator.serviceWorker.register("./sw.js").catch(() => {});
  }
}
