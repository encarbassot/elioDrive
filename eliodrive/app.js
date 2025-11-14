import { elio } from "./lib/elioDom.js";

const IMAGE_EXTS = new Set([
  "jpg", "jpeg", "png", "gif", "webp", "avif", "bmp", "svg"
]);

const VIDEO_EXTS = new Set([
  "mp4", "webm", "mov", "m4v", "ogg", "ogv", "avi", "mkv", "3gp"
]);

const DEFAULT_FILE_ICON = "eliodrive/icons/file.svg"; // change if your pack uses another name


function getFileExtension(path = "") {
  const clean = path.split(/[?#]/)[0];         // strip ?query and #hash
  const base = clean.split("/").pop() || "";   // last segment
  const idx = base.lastIndexOf(".");
  if (idx === -1) return "";
  return base.slice(idx + 1).toLowerCase();
}

function isImageExt(ext) {
  return IMAGE_EXTS.has(ext);
}

function isVideoExt(ext) {
  return VIDEO_EXTS.has(ext);
}

function isMediaExt(ext) {
  return isImageExt(ext) || isVideoExt(ext);
}

function getIconSrcForExt(ext) {
  if (!ext) return DEFAULT_FILE_ICON;
  // assuming icons are named like "pdf.svg", "zip.svg", etc.
  return `eliodrive/icons/${ext}.svg`;
}

// Mapa centralizado de elementos clave
const DOM = elio.makeDOM({
  grid: "#grid",
  cardTpl: "#card-tpl",
  empty: "#empty",
  count: "#count",
  sort: "#sort",
  search: "#search",
  selectAll: "#selectAll",
  clearSel: "#clearSel",
  downloadSel: "#downloadSel",
  lightbox: "#lightbox",
  lightboxImg: "#lightbox-img",
  lightboxPre: "#lightbox-pre",
  lightboxVideo: "#lightbox-video",
  lightboxCaption: "#lightbox-caption",
  lbChk: "#lb-chk",
  frame: ".lb-frame",
  lightboxClose: "#lightbox .close",
  lightboxNav: {
    next: "#lightbox .nav.next",
    prev: "#lightbox .nav.prev",
  },
});

const state = { items: [], selected: new Set(), q: "" };
let currentIndex = -1; // índice de la imagen actual en state.items

function fmtBytes(n){
  if(n < 1024) return `${n} B`;
  const u = ["KB","MB","GB","TB"];
  let i = -1;
  do { n = n/1024; i++; } while (n>=1024 && i<u.length-1);
  return `${n.toFixed(1)} ${u[i]}`;
}
function fmtDate(ts){
  const d = new Date(ts*1000);
  return isNaN(d) ? "" : d.toLocaleString();
}

async function loadManifest(q=""){
  const res = await fetch("eliodrive/manifest.json", { cache: "no-store" });
  const data = await res.json();
  let items = data.items || data; // admite ambos formatos
  if(q) {
    const qq = q.trim().toLowerCase();
    items = items.filter(f => (f.name||"").toLowerCase().includes(qq) || (f.relpath||"").toLowerCase().includes(qq));
  }
  state.items = items;
  render();
}



function createCard(item){

  /*
  <div class="card">
    <label class="tick">
    <input type="checkbox" class="chk">
    <span></span>
    </label>
    <a href="test.webp" class="imglink" target="_blank" rel="noopener">
      <div class="spinner" style="display: none;"></div>
      <img loading="lazy" class="" src="test.webp" alt="test.webp">
    </a>
    <div class="meta">
      <div class="name">test.webp • 5.7 MB • 10/11/2025, 18:33:04</div>
      <div class="meta-row">
        <button class="copy">Copiar enlace</button>
        <a class="dl" href="test.webp" download="test.webp">Descargar</a>
      </div>
    </div>
  </div>
  */
  const url = item.url || item.relpath || item.path || "";
  const displayName = item.name || url.split("/").pop();
  const ext = getFileExtension(url);
  const isImage = isImageExt(ext);
  const isVideo = isVideoExt(ext);

  const spinner = elio.create("div", {
    attributes: { class: "spinner" },
  });

  let thumb; // img / video / icon

  if (isImage) {
    // real image thumbnail
    thumb = elio.create("img", {
      attributes: {
        loading: "lazy",
        class: "loading",
        src: url,
        alt: displayName,
      },
    });

    thumb.onLoad(() => {
      thumb.removeClass("loading");
      spinner.hide();
    });

  } else if (isVideo) {
    // video thumbnail (first frame)
    thumb = elio.create("video", {
      attributes: {
        class: "loading file-video",
        src: url,
        muted: true,
        preload: "metadata",
      },
    });

    // videos don't fire "load" like images, we use loadeddata
    thumb.on("loadeddata", () => {
      thumb.removeClass("loading");
      spinner.hide();
    });

  } else {
    // generic file icon
    const iconSrc = getIconSrcForExt(ext);
    thumb = elio.create("img", {
      attributes: {
        class: "file-icon",
        src: iconSrc,
        alt: ext ? `${ext} file` : "file",
      },
    });

    // for icons we can hide spinner right away
    spinner.hide();
  }



  const link = elio.create("a", {
    attributes: {
      href: url,
      class: "imglink",
      target: "_blank",
      rel: "noopener",
    },
    content: [spinner, thumb],
  });

  const name = elio.create("div", {
    attributes: { class: "name" },
    content: `${item.relpath || displayName} ${
      item.size ? `• ${fmtBytes(item.size)}` : ""
    } ${item.mtime ? `• ${fmtDate(item.mtime)}` : ""}`,
  });

  const copyBtn = elio.create("button", {
    attributes: { class: "copy" },
    content: "Copiar enlace",
  });

  const dl = elio.create("a", {
    attributes: {
      class: "dl",
      href: url,
      download: displayName,
    },
    content: "Descargar",
  });

  const metaRow = elio.create("div", {
    attributes: { class: "meta-row" },
    content: [copyBtn, dl],
  });

  const meta = elio.create("div", {
    attributes: { class: "meta" },
    content: [name, metaRow],
  });

  const chk = elio.create("input", {
    attributes: { type: "checkbox", class: "chk" },
  });

  const tick = elio.create("label", {
    attributes: { class: "tick" },
    content: [
      chk,
      elio.create("span"),
    ],
  });

  const card = elio.create("div", {
    attributes: { class: "card" },
    content: [tick, link, meta],
  });

  // --- EVENTS + STATE SYNC ------------------------------------


  link.onClick((ev) => {
    ev.preventDefault();
    ev.stopPropagation();
    openLightbox(url, displayName);
  });

  const isSelected = state.selected.has(url);
  chk.get().checked = isSelected;
  if (isSelected) card.addClass("selected");

  chk.get().addEventListener("change", () => {
    if (chk.get().checked) {
      state.selected.add(url);
      card.addClass("selected");
    } else {
      state.selected.delete(url);
      card.removeClass("selected");
    }
    updateCount();
  });

  card.onClick((ev) => {
    const t = ev.target;
    if (
      t.closest(".copy") ||
      t.closest(".dl") ||
      t.closest(".tick") ||
      t.closest("a.imglink")
    )
      return;
    chk.get().checked = !chk.get().checked;
    chk.get().dispatchEvent(new Event("change"));
  });

  copyBtn.onClick(async (ev) => {
    ev.stopPropagation();
    const absolute = new URL(url, location.href).toString();
    await navigator.clipboard.writeText(absolute);
  });

  return card.get(); // devolvemos el HTMLElement listo


}

function render(){

  sortItems();

  const grid = DOM.grid;
  grid.clear();

  state.items.forEach(item=>{
    const node = createCard(item);
    grid.append(node);
  });

  updateCount();
}


function updateCount(){
  DOM.count.text(`${state.selected.size} seleccionadas`);
}

async function downloadSelected(){
  if(state.selected.size === 0) return;
  const zip = new JSZip();
  const files = Array.from(state.selected);

  // Guardamos en subcarpetas del zip respetando la ruta relativa si existe
  const fetches = files.map(async (u)=>{
    const url = new URL(u, location.href).toString();
    const resp = await fetch(url, { mode: "cors" });
    if(!resp.ok) throw new Error(`Error descargando ${u}`);
    const blob = await resp.blob();
    // nombre dentro del zip
    let name = u.split("?")[0].split("#")[0];
    try { name = decodeURIComponent(name); } catch {}
    const base = name.replace(/^https?:\/\/[^/]+\//, "");
    zip.file(base, blob);
  });

  try{
    await Promise.all(fetches);
    const content = await zip.generateAsync({type:"blob"});
    const ts = new Date().toISOString().replace(/[:.]/g,"-");
    saveAs(content, `fotos_${ts}.zip`);
  }catch(e){
    alert("No se pudo crear el ZIP (¿CORS o archivos inaccesibles?).");
    console.error(e);
  }
}
function bindUI() {

  DOM.sort.onChange(() => render);
  
  DOM.search.onInput((e) => {
    state.q = e.target.value;
    loadManifest(state.q);
  });

  // select all
  DOM.selectAll.onClick(() => {
    state.items.forEach((it) => {
      const url = it.url || it.relpath || it.path;
      if (url) state.selected.add(url);
    });

    const checkboxes = elio("input.chk").elements;
    checkboxes.forEach((chk) => {
      if (!chk.checked) {
        chk.checked = true;
        chk.dispatchEvent(new Event("change"));
      }
    });

    updateCount();
  });

  // clear selection
  DOM.clearSel.onClick(() => {
    state.selected.clear();

    const checkboxes = elio("input.chk").elements;
    checkboxes.forEach((chk) => {
      if (chk.checked) {
        chk.checked = false;
        chk.dispatchEvent(new Event("change"));
      }
    });

    updateCount();
  });

  DOM.downloadSel.onClick(downloadSelected);
}


async function openLightbox(url, caption) {
  const lb = DOM.lightbox;              // wrapper
  const img = DOM.lightboxImg.get();
  const pre = DOM.lightboxPre.get();
  const video = DOM.lightboxVideo.get();
  const cap = DOM.lightboxCaption.get();
  const lbChk = DOM.lbChk.get();
  const frame = DOM.frame.get();

  currentIndex = state.items.findIndex(
    (it) => (it.url || it.relpath || it.path) === url
  );

  const ext = getFileExtension(url);          // from earlier helper
  const isImage = isImageExt(ext);
  const isVideo = isVideoExt(ext);

  img.src = "";
  video.src = "";
  pre.textContent = "";
  img.style.display = "none";
  pre.style.display = "none";
  video.style.display = "none";

  if (isImage) {
    img.src = url;
    img.style.display = "";
  } else if (isVideo) {
    video.src = url;
    video.style.display = "";
  }else {
    try {
      const resp = await fetch(url);
      const text = await resp.text();
      pre.textContent = text;
      pre.style.display = "";
    } catch (err) {
      console.error(err);
      pre.textContent = "Unable to load file preview.";
    }
  }

  cap.textContent = caption || ""; 

  const isSel = state.selected.has(url);
  lbChk.checked = isSel;
  frame.classList.toggle("selected", isSel);

  lb.addClass("open");
}


function closeLightbox() {
  DOM.lightbox.removeClass("open");
  const img = DOM.lightboxImg.get();
  const pre = DOM.lightboxPre.get();
  const video = DOM.lightboxVideo.get();
  if(video) video.src = "";
  if (img) img.src = "";
  if (pre) pre.textContent = "";
}

async function showImageAt(index) {
  if (index < 0) index = state.items.length - 1;
  if (index >= state.items.length) index = 0;
  currentIndex = index;

  const item = state.items[currentIndex];
  const url = item.url || item.relpath || item.path;
  const caption = item.name || url.split("/").pop();

  const img = DOM.lightboxImg.get();
  const pre = DOM.lightboxPre.get();
  const video = DOM.lightboxVideo.get();
  const cap = DOM.lightboxCaption.get();
  const lbChk = DOM.lbChk.get();
  const frame = DOM.frame.get();

  const ext = getFileExtension(url);
  const isImage = isImageExt(ext);
  const isVideo = isVideoExt(ext);

  cap.textContent = caption || "";

  video.src = "";
  img.src = "";
  pre.textContent = "";
  video.style.display = "none";
  img.style.display = "none";
  pre.style.display = "none";

  if (isImage) {
    img.src = url;
    img.style.display = "";
  } else if( isVideo) {
    video.src = url;
    video.style.display = "";
  }else {
    pre.style.display = "";
    pre.textContent = "Loading file…";
    try {
      const resp = await fetch(url);
      const text = await resp.text();
      pre.textContent = text;
    } catch (err) {
      console.error(err);
      pre.textContent = "Unable to load file preview.";
    }
  }

  const isSel = state.selected.has(url);
  lbChk.checked = isSel;
  frame.classList.toggle("selected", isSel);
}

function nextImage() {
  showImageAt(currentIndex + 1);
}
function prevImage() {
  showImageAt(currentIndex - 1);
}


// Bind cierre
DOM.lightboxClose.onClick(closeLightbox);

DOM.lightbox.onClick((ev) => {
  if (ev.target.id === "lightbox") closeLightbox();
});

// Tecla ESC para cerrar
document.addEventListener("keydown", (ev) => {
  if (ev.key === "Escape") closeLightbox();
});

DOM.lightboxNav.next.onClick((e) => {
  e.stopPropagation();
  nextImage();
});
DOM.lightboxNav.prev.onClick((e) => {
  e.stopPropagation();
  prevImage();
});


// También con flechas del teclado
document.addEventListener("keydown", (ev) => {
  const lbEl = DOM.lightbox.get();
  if (!lbEl || !lbEl.classList.contains("open")) return;
  if (ev.key === "ArrowRight") nextImage();
  if (ev.key === "ArrowLeft") prevImage();
});

document.addEventListener("DOMContentLoaded", () => {
  const lbChk = DOM.lbChk.get();
  const frame = DOM.frame.get();

  if (lbChk) {
    lbChk.addEventListener("change", () => {
      const item = state.items[currentIndex];
      if (!item) return;
      const url = item.url || item.relpath || item.path;

      if (lbChk.checked) state.selected.add(url);
      else state.selected.delete(url);

      frame.classList.toggle("selected", lbChk.checked);

      const cards = elio("#grid .card").get()
      for (const card of cards) {
        const link = card.querySelector("a.imglink");
        const chk = card.querySelector("input.chk");
        if (!link || !chk) continue;
        const cardUrl = link.getAttribute("href");
        if (
          new URL(cardUrl, location.href).toString() ===
          new URL(url, location.href).toString()
        ) {
          chk.checked = lbChk.checked;
          chk.dispatchEvent(new Event("change"));
          break;
        }
      }
    });
  }
});




function sortItems() {
  const sortVal = DOM.sort.get().value; // antes: $("#sort").value
  state.items.sort((a, b) => {
    const nameA = (a.name || a.relpath || "").toLowerCase();
    const nameB = (b.name || b.relpath || "").toLowerCase();
    const dateA = a.mtime || 0;
    const dateB = b.mtime || 0;

    switch (sortVal) {
      case "name-asc":
        return nameA.localeCompare(nameB);
      case "name-desc":
        return nameB.localeCompare(nameA);
      case "date-asc":
        return dateA - dateB;
      case "date-desc":
        return dateB - dateA;
      default:
        return 0;
    }
  });
}

bindUI();
loadManifest();
