(function () {
var C = CONFIG, q = function (s) { return document.querySelector(s); };
var lien = C.discordGuildId ? "https://discord.com/channels/" + C.discordGuildId : (C.discordCode ? "https://discord.gg/" + C.discordCode : "");
document.querySelectorAll(".logo").forEach(function (l) { l.textContent = C.nom; var i = document.createElement("i"); i.textContent = "."; l.appendChild(i); });
document.querySelectorAll(".dlink").forEach(function (a) { if (lien) { a.href = lien; a.target = "_blank"; a.rel = "noopener"; } else { a.hidden = true; } });
if (q("#an")) q("#an").textContent = new Date().getFullYear();

/* Vignette : vidéo puis fondu vers la photo, dans la même case */
function autoPlay(s, v) {
  new IntersectionObserver(function (en) { en.forEach(function (x) { if (x.isIntersecting) { v.play().catch(function () {}); } else { v.pause(); } }); }, { threshold: .4 }).observe(s);
  return s;
}
function creerStage(m, toggle) {
  var s = document.createElement("div"), v = null, p = null, t = null; s.className = "stage";
  if (m.video) { v = document.createElement("video"); v.src = m.video; v.muted = true; v.playsInline = true; s.appendChild(v); }
  if (m.photo) { p = document.createElement("img"); p.className = "ph"; p.src = m.photo; p.alt = m.titre; s.appendChild(p); }
  if (!v) { if (p) s.classList.add("photo"); return s; }
  if (!p) { v.loop = true; return autoPlay(s, v); }
  function montrerPhoto() { s.classList.add("photo"); clearTimeout(t); t = setTimeout(retour, C.pausePhoto); }
  function retour() { clearTimeout(t); s.classList.remove("photo"); v.currentTime = 0; v.play().catch(function () {}); }
  v.addEventListener("ended", montrerPhoto);
  if (toggle) s.addEventListener("click", function () { if (s.classList.contains("photo")) retour(); else { v.pause(); montrerPhoto(); } });
  return autoPlay(s, v);
}

/* Fenêtre d’aperçu */
var dlg = document.createElement("dialog"); document.body.appendChild(dlg);
dlg.addEventListener("click", function (e) { if (e.target === dlg) dlg.close(); });
dlg.addEventListener("close", function () { dlg.innerHTML = ""; });
function ouvrir(m) {
  var box = document.createElement("div"); box.className = "dlg";
  var x = document.createElement("button"); x.className = "x"; x.textContent = "✕"; x.setAttribute("aria-label", "Fermer"); x.onclick = function () { dlg.close(); };
  var t = document.createElement("h3"); t.textContent = m.titre;
  var p = document.createElement("p"); p.textContent = m.desc || "";
  box.appendChild(x); box.appendChild(creerStage(m, true)); box.appendChild(t); box.appendChild(p);
  dlg.appendChild(box); dlg.showModal();
}

/* Grilles */
var trie = MODELES.slice().sort(function (a, b) { return b.date.localeCompare(a.date); });
function carte(m) {
  var d = document.createElement("div"), c = document.createElement("div"), b = document.createElement("b"), s = document.createElement("span");
  d.className = "item rv"; c.className = "cap";
  b.textContent = m.titre; s.textContent = (m.categorie ? m.categorie + " · " : "") + m.date.slice(0, 4);
  c.appendChild(b); c.appendChild(s); d.appendChild(creerStage(m, false)); d.appendChild(c);
  d.addEventListener("click", function () { ouvrir(m); });
  return d;
}
var g1 = q("#recents");
if (g1) trie.slice(0, 4).forEach(function (m) { g1.appendChild(carte(m)); });
var g2 = q("#tous"), f = q("#filtres");
if (g2 && f) {
  var afficher = function (cat) {
    g2.innerHTML = "";
    trie.filter(function (m) { return !cat || m.categorie === cat; }).forEach(function (m) { g2.appendChild(carte(m)); });
    f.querySelectorAll("button").forEach(function (b) { b.classList.toggle("on", b.dataset.c === cat); });
  };
  var cats = [""]; trie.forEach(function (m) { if (m.categorie && cats.indexOf(m.categorie) < 0) cats.push(m.categorie); });
  cats.forEach(function (c) { var b = document.createElement("button"); b.textContent = c || "Tous"; b.dataset.c = c; b.onclick = function () { afficher(c); observerRv(); }; f.appendChild(b); });
  afficher("");
}

/* Dynamisme : mot qui change, apparition au scroll, bouton contact, accès direct à la connexion Discord */
var reduce = window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;
var mot = q("#mot"), mots = ["stylisés", "réalistes", "sur mesure", "pour ton jeu"], im = 0;
if (mot && !reduce) setInterval(function () {
  mot.style.opacity = 0; mot.style.transform = "translateY(40%)";
  setTimeout(function () {
    im = (im + 1) % mots.length; mot.textContent = mots[im];
    mot.style.transition = "none"; mot.style.transform = "translateY(-40%)"; mot.offsetWidth;
    mot.style.transition = ""; mot.style.opacity = 1; mot.style.transform = "none";
  }, 300);
}, 2400);
var surIndex = !!q("#f"), connecte = false;
try { connecte = !!sessionStorage.getItem("tk"); } catch (e) {}
document.querySelectorAll(".cta-login").forEach(function (a) {
  a.href = !surIndex ? "index.html#contact" : (!connecte && C.botUrl ? C.botUrl + "/auth/login" : "#contact");
});
var fab = q(".fab"), vis = {};
function majFab() { if (fab) fab.classList.toggle("off", !!(vis.a || vis.b)); }
[[".cta", "a"], ["#contact", "b"]].forEach(function (p) {
  var el = q(p[0]);
  if (el) new IntersectionObserver(function (en) { vis[p[1]] = en[0].isIntersecting; majFab(); }, { threshold: .3 }).observe(el);
});
var rvObs = new IntersectionObserver(function (en) { en.forEach(function (x) { if (x.isIntersecting) { x.target.classList.add("in"); rvObs.unobserve(x.target); } }); }, { threshold: .1 });
function observerRv() { document.querySelectorAll(".rv:not(.in)").forEach(function (el) { rvObs.observe(el); }); }

/* Contact : connexion Discord + envoi de la demande */
observerRv();
var form = q("#f");
if (!form) return;
var TK = "tk", msg = q("#msg"), bl = q("#bl");
var retourLogin = location.hash.indexOf("#token=") === 0;
if (retourLogin) {
  try { sessionStorage.setItem(TK, location.hash.slice(7)); } catch (e) {}
  history.replaceState(null, "", location.pathname + "#contact");
  setTimeout(function () { q("#contact").scrollIntoView(); }, 60);
}
var tok = null; try { tok = sessionStorage.getItem(TK); } catch (e) {}
function nom(t) { try { var b = t.split(".")[0].replace(/-/g, "+").replace(/_/g, "/"); var o = JSON.parse(decodeURIComponent(escape(atob(b)))); return o.exp > Date.now() ? o.name : null; } catch (e) { return null; } }
var pseudo = tok ? nom(tok) : null;
if (pseudo) { q("#login").hidden = true; form.hidden = false; q("#who").textContent = "Connecté en tant que " + pseudo; }
else if (C.botUrl) { bl.href = C.botUrl + "/auth/login"; }
else { bl.addEventListener("click", function (e) { e.preventDefault(); msg.textContent = "Aperçu : la connexion Discord sera active une fois botUrl renseigné dans config.js."; }); }
form.addEventListener("submit", function (e) {
  e.preventDefault();
  var btn = form.querySelector("button"); btn.disabled = true; msg.textContent = "Envoi…";
  fetch(C.botUrl + "/api/demande", { method: "POST", headers: { "Content-Type": "application/json", "Authorization": "Bearer " + tok }, body: JSON.stringify({ service: form.service.value, date: form.date.value, projet: form.projet.value }) })
    .then(function (r) { return r.json().then(function (j) { return { ok: r.ok, s: r.status, j: j }; }); })
    .then(function (x) {
      btn.disabled = false;
      if (x.ok) { msg.textContent = ""; form.reset(); form.hidden = true; q("#ok").hidden = false; }
      else if (x.s === 401) { try { sessionStorage.removeItem(TK); } catch (e) {} form.hidden = true; q("#login").hidden = false; bl.href = C.botUrl + "/auth/login"; msg.textContent = "Session expirée, reconnecte-toi."; }
      else { msg.textContent = x.j.error || "Erreur d’envoi."; }
    })
    .catch(function () { btn.disabled = false; msg.textContent = "Erreur d’envoi, réessaie dans un instant."; });
});
})();
