const $ = (s, d=document)=>d.querySelector(s);
const $$ = (s, d=document)=>Array.from(d.querySelectorAll(s));

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

function render(){

  sortItems();  // 👈 ordenamos antes de pintar


  const grid = $("#grid");
  grid.innerHTML = "";
  const tpl = $("#card-tpl");

  $("#empty").hidden = state.items.length > 0;

  state.items.forEach(item=>{
    const url = item.url || item.relpath || item.path || "";
    const displayName = item.name || url.split("/").pop();

    const node = tpl.content.cloneNode(true);
    const card = node.querySelector(".card");
    const img = node.querySelector("img");
    const link = node.querySelector(".imglink");
    const name = node.querySelector(".name");
    const chk = node.querySelector(".chk");
    const copy = node.querySelector(".copy");
    const dl = node.querySelector(".dl");

    const spinner = document.createElement("div")
    spinner.className = "spinner"
    link.prepend(spinner)

    img.classList.add("loading")
    img.src = url;
    img.alt = displayName;
    link.href = url;
    name.textContent = `${item.relpath || displayName} ${item.size?`• ${fmtBytes(item.size)}`:""} ${item.mtime?`• ${fmtDate(item.mtime)}`:""}`;
    dl.href = url;
    dl.download = displayName;

    img.addEventListener("load", ()=>{
      img.classList.remove("loading")
      spinner.style.display = "none"
    })

    link.addEventListener("click", (ev)=>{
      ev.preventDefault();
      openLightbox(url, displayName);
    });


    // Estado inicial
    const isSelected = state.selected.has(url);
    chk.checked = isSelected;
    if (isSelected) card.classList.add("selected");

    // Toggle por checkbox
    chk.addEventListener("change", ()=>{
      if (chk.checked) {
        state.selected.add(url);
        card.classList.add("selected");   // fallback si no hay :has()
      } else {
        state.selected.delete(url);
        card.classList.remove("selected");// fallback
      }
      updateCount();
    });

    // Toggle clicando la imagen/tarjeta (pero no si hacen clic en los botones o links)
    card.addEventListener("click", (ev)=>{
      const t = ev.target;
      if (t.closest(".copy") || t.closest(".dl") || t.closest(".tick") || t.closest("a.imglink")) return;
      chk.checked = !chk.checked;
      chk.dispatchEvent(new Event("change"));
    });

    // “Abrir en pestaña nueva” solo si se hace clic explícito en el link
    // (sin cambios aquí)

    // Copiar enlace
    copy.addEventListener("click", async (ev)=>{
      ev.stopPropagation();
      const absolute = new URL(url, location.href).toString();
      await navigator.clipboard.writeText(absolute);
    });

    grid.appendChild(node);
  });

  updateCount();
}


function updateCount(){
  $("#count").textContent = `${state.selected.size} seleccionadas`;
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

function bindUI(){

  $("#sort").addEventListener("change", ()=>{
    render();
  });
  
  $("#search").addEventListener("input", (e)=>{
    state.q = e.target.value;
    loadManifest(state.q);
  });
  // Seleccionar todo
  $("#selectAll").addEventListener("click", ()=>{
    state.items.forEach(it=>{
      const url = it.url || it.relpath || it.path;
      if (url) state.selected.add(url);
    });
    $$("input.chk").forEach(chk=>{
      if (!chk.checked) {
        chk.checked = true;
        chk.dispatchEvent(new Event("change")); // <-- actualiza borde/clase
      }
    });
    updateCount();
  });

  // Limpiar selección
  $("#clearSel").addEventListener("click", ()=>{
    state.selected.clear();
    $$("input.chk").forEach(chk=>{
      if (chk.checked) {
        chk.checked = false;
        chk.dispatchEvent(new Event("change")); // <-- actualiza borde/clase
      }
    });
    updateCount();
  });

  $("#downloadSel").addEventListener("click", downloadSelected);
}


function openLightbox(url, caption){
  const lb = $("#lightbox");
  const img = $("#lightbox-img");
  const cap = $("#lightbox-caption");
  const lbChk = $("#lb-chk");
  const frame = $(".lb-frame");

  currentIndex = state.items.findIndex(it =>
    (it.url || it.relpath || it.path) === url
  );

  img.src = url;
  cap.textContent = caption || "";

  // estado seleccionado inicial
  const isSel = state.selected.has(url);
  lbChk.checked = isSel;

  // fallback sin :has (añade/quita clase a mano)
  frame.classList.toggle("selected", isSel);

  lb.classList.add("open");
}


function closeLightbox(){
  const lb = $("#lightbox");
  lb.classList.remove("open");
  $("#lightbox-img").src = "";
}

function showImageAt(index){
  if (index < 0) index = state.items.length - 1;
  if (index >= state.items.length) index = 0;
  currentIndex = index;

  const item = state.items[currentIndex];
  const url = item.url || item.relpath || item.path;
  const caption = item.name || url.split("/").pop();

  $("#lightbox-img").src = url;
  $("#lightbox-caption").textContent = caption;

  // sync checkbox del modal
  const lbChk = $("#lb-chk");
  const frame = $(".lb-frame");
  const isSel = state.selected.has(url);
  lbChk.checked = isSel;
  frame.classList.toggle("selected", isSel);
}


function nextImage(){ showImageAt(currentIndex + 1); }
function prevImage(){ showImageAt(currentIndex - 1); }


// Bind cierre
$("#lightbox .close").addEventListener("click", closeLightbox);
$("#lightbox").addEventListener("click", (ev)=>{
  if(ev.target.id === "lightbox") closeLightbox();
});

// Tecla ESC para cerrar
document.addEventListener("keydown", (ev)=>{
  if(ev.key === "Escape") closeLightbox();
});


$("#lightbox .nav.next").addEventListener("click", (e)=>{
  e.stopPropagation();
  nextImage();
});
$("#lightbox .nav.prev").addEventListener("click", (e)=>{
  e.stopPropagation();
  prevImage();
});

// También con flechas del teclado
document.addEventListener("keydown", (ev)=>{
  if(!$("#lightbox").classList.contains("open")) return;
  if(ev.key === "ArrowRight") nextImage();
  if(ev.key === "ArrowLeft") prevImage();
});

document.addEventListener("DOMContentLoaded", ()=>{
  const lbChk = $("#lb-chk");
  const frame = $(".lb-frame");

  if (lbChk) {
    lbChk.addEventListener("change", ()=>{
      const item = state.items[currentIndex];
      if (!item) return;
      const url = item.url || item.relpath || item.path;

      // actualiza estado global
      if (lbChk.checked) state.selected.add(url);
      else state.selected.delete(url);

      // fallback visual
      frame.classList.toggle("selected", lbChk.checked);

      // ✅ sincroniza la tarjeta de la cuadrícula
      // encuentra el checkbox correspondiente y refléjalo
      const cards = $$("#grid .card");
      for (const card of cards) {
        const link = card.querySelector("a.imglink");
        const chk = card.querySelector("input.chk");
        if (!link || !chk) continue;
        const cardUrl = link.getAttribute("href");
        // comparamos resuelto al origen para evitar líos de rutas relativas
        if (new URL(cardUrl, location.href).toString() === new URL(url, location.href).toString()) {
          chk.checked = lbChk.checked;
          // dispara change para actualizar borde/clase y contador
          chk.dispatchEvent(new Event("change"));
          break;
        }
      }
    });
  }
});



function sortItems(){
  const sortVal = $("#sort").value;
  state.items.sort((a,b)=>{
    const nameA = (a.name || a.relpath || "").toLowerCase();
    const nameB = (b.name || b.relpath || "").toLowerCase();
    const dateA = a.mtime || 0;
    const dateB = b.mtime || 0;

    switch(sortVal){
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
