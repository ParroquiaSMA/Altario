/* ============================================================
   PARROQUIA SANTA MARÍA DE LA AYUDA
   Un solo archivo para todo el sitio. Cada bloque se activa
   únicamente si la página lo necesita, así que se puede cargar
   en todas sin problema.
   ============================================================ */
(function () {
  "use strict";

  /* ==========================================================
     0. LIVE CONFIG SYNC (BROADCAST CHANNEL & LOCALSTORAGE)
     ========================================================== */
  function applyLiveConfig(cfg) {
    if (!cfg) return;
    try {
      var root = document.documentElement;

      // 1. Apariencia & Colores
      if (cfg.apariencia) {
        var lapis = cfg.apariencia.color_fondo_hero || "#16244A";
        var lapisClaro = cfg.apariencia.color_primario || "#22366B";
        var oro = cfg.apariencia.color_acento || "#C9A96A";

        root.style.setProperty("--lapis", lapis);
        root.style.setProperty("--lapis-claro", lapisClaro);
        root.style.setProperty("--oro", oro);
        root.style.setProperty("--oro-texto", oro);

        document.querySelectorAll(".cabecera, .hero, .portada, .seccion--oscura, .pie").forEach(function (el) {
          el.style.backgroundColor = lapis;
        });

        document.querySelectorAll(".hero__fondo g, .portada__fondo g").forEach(function (el) {
          el.style.stroke = oro;
        });

        document.querySelectorAll(".boton--oro, .pildora--oro").forEach(function (el) {
          el.style.backgroundColor = oro;
          el.style.color = lapis;
          el.style.borderColor = oro;
        });

        document.querySelectorAll(".boton--linea").forEach(function (el) {
          el.style.borderColor = oro;
          el.style.color = "#FFFFFF";
        });
      }

      // 2. Parroquia Info & Logo
      if (cfg.parroquia?.nombre) {
        document.querySelectorAll(".marca__nombre").forEach(function (el) {
          el.textContent = cfg.parroquia.nombre;
        });
        var heroTitle = document.querySelector(".hero h1");
        if (heroTitle) heroTitle.textContent = cfg.parroquia.nombre;
        var footerTitle = document.querySelector(".pie h2");
        if (footerTitle) footerTitle.textContent = cfg.parroquia.nombre;
      }
      if (cfg.parroquia?.lema) {
        var heroLema = document.querySelector(".hero__lema");
        if (heroLema) heroLema.textContent = cfg.parroquia.lema;
      }

      // Live Logo (Image vs SVG Monogram)
      if (cfg.parroquia) {
        var marcaAnchor = document.querySelector(".marca");
        if (marcaAnchor) {
          var currentImg = marcaAnchor.querySelector("img");
          var currentSvg = marcaAnchor.querySelector("svg");
          var oroCol = (cfg.apariencia && cfg.apariencia.color_acento) || "#C9A96A";
          var lapisCol = (cfg.apariencia && cfg.apariencia.color_primario) || "#22366B";
          function getAutoInitials(name) {
            if (!name) return "AM";
            var clean = name.replace(/^parroquia\s+(de\s+(la\s+)?)?/i, "").trim();
            var words = clean.split(/\s+/).filter(Boolean);
            if (words.length >= 2) {
              return (words[0][0] + words[1][0]).toUpperCase();
            }
            return clean.slice(0, 2).toUpperCase() || "AM";
          }
          var logoInit = cfg.parroquia.logo_iniciales || getAutoInitials(cfg.parroquia.nombre);
          var logoUrl = cfg.parroquia.logo_url;

          if (logoUrl) {
            if (currentImg) {
              currentImg.src = logoUrl;
              currentImg.alt = "Escudo de " + (cfg.parroquia.nombre || "la Parroquia");
            } else if (currentSvg) {
              var newImg = document.createElement("img");
              newImg.src = logoUrl;
              newImg.alt = "Escudo de " + (cfg.parroquia.nombre || "la Parroquia");
              newImg.className = "size-11 object-contain rounded-full border border-[#C9A96A]/40 bg-white/10";
              newImg.width = 44;
              newImg.height = 44;
              marcaAnchor.replaceChild(newImg, currentSvg);
            }
          } else {
            if (currentImg) {
              var svgWrapper = document.createElement("div");
              svgWrapper.innerHTML = '<svg width="44" height="44" viewBox="0 0 44 44" role="img" aria-label="Escudo de ' + (cfg.parroquia.nombre || "la Parroquia") + '"><circle cx="22" cy="22" r="20.5" fill="none" stroke="' + oroCol + '"></circle><circle cx="22" cy="22" r="17" fill="' + lapisCol + '"></circle><text x="22" y="28.5" text-anchor="middle" fill="' + oroCol + '" font-family="Marcellus, Georgia, serif" font-size="16">' + logoInit + '</text></svg>';
              if (svgWrapper.firstElementChild) {
                marcaAnchor.replaceChild(svgWrapper.firstElementChild, currentImg);
              }
            } else if (currentSvg) {
              var textEl = currentSvg.querySelector("text");
              if (textEl) textEl.textContent = logoInit;
            }
          }
        }
      }

      // 3. Contacto
      if (cfg.contacto?.direccion) {
        var dirEl = document.querySelector(".contacto .datos li:nth-child(1) span");
        if (dirEl) dirEl.textContent = cfg.contacto.direccion;
        var footerDir = document.querySelector(".pie .pie__grilla > div:first-child > p:first-of-type");
        if (footerDir) footerDir.textContent = cfg.contacto.direccion;
      }
      if (cfg.contacto?.telefono) {
        document.querySelectorAll('a[href^="tel:"]').forEach(function (el) {
          el.textContent = cfg.contacto.telefono;
          el.setAttribute("href", "tel:" + cfg.contacto.telefono.replace(/[^0-9+]/g, ""));
        });
      }
      if (cfg.contacto?.email) {
        document.querySelectorAll('a[href^="mailto:"]').forEach(function (el) {
          el.textContent = cfg.contacto.email;
          el.setAttribute("href", "mailto:" + cfg.contacto.email);
        });
      }
      if (cfg.parroco?.nombre) {
        var parrocoEl = document.querySelector(".contacto .datos li:nth-child(5) span");
        if (parrocoEl) parrocoEl.textContent = cfg.parroco.nombre;
      }
      if (cfg.contacto?.horario_secretaria) {
        var secEl = document.querySelector(".contacto .datos li:nth-child(6) span");
        if (secEl) secEl.textContent = cfg.contacto.horario_secretaria;
        var indexSec = document.querySelector(".horarios dl dd");
        if (indexSec) indexSec.textContent = cfg.contacto.horario_secretaria;
      }

      // Save locally to this origin too
      try {
        localStorage.setItem("altario:site_config_live", JSON.stringify(cfg));
      } catch (e) {}
    } catch (err) {
      console.warn("Live config sync error:", err);
    }
  }

  // Check saved live config on mount
  try {
    var savedLive = localStorage.getItem("altario:site_config_live");
    if (savedLive) {
      applyLiveConfig(JSON.parse(savedLive));
    }
  } catch (e) {}

  // Listen to BroadcastChannel for real-time live sync across tabs
  if (typeof BroadcastChannel !== "undefined") {
    try {
      var bc = new BroadcastChannel("altario:site_config_sync");
      bc.onmessage = function (event) {
        if (event.data && event.data.type === "CONFIG_UPDATED" && event.data.config) {
          applyLiveConfig(event.data.config);
        }
      };
    } catch (e) {}
  }

  /* ==========================================================
     1. MENÚ EN PANTALLAS CHICAS
     ========================================================== */
  var btn = document.querySelector(".menu-btn");
  var nav = document.getElementById("nav-principal");

  if (btn && nav) {
    btn.addEventListener("click", function () {
      var abierto = nav.getAttribute("data-abierto") === "true";
      nav.setAttribute("data-abierto", String(!abierto));
      btn.setAttribute("aria-expanded", String(!abierto));
    });

    nav.addEventListener("click", function (e) {
      if (e.target.tagName === "A" && window.innerWidth <= 1000) {
        nav.setAttribute("data-abierto", "false");
        btn.setAttribute("aria-expanded", "false");
      }
    });

    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && nav.getAttribute("data-abierto") === "true") {
        nav.setAttribute("data-abierto", "false");
        btn.setAttribute("aria-expanded", "false");
        btn.focus();
      }
    });
  }

  /* ==========================================================
     2. PRÓXIMA MISA
     dia: 0 = domingo … 6 = sábado.
     ========================================================== */
  var MISAS = [
    { dia: 1, hora: "08:00" }, { dia: 1, hora: "19:00" },
    { dia: 2, hora: "08:00" }, { dia: 2, hora: "19:00" },
    { dia: 3, hora: "08:00" }, { dia: 3, hora: "19:00" },
    { dia: 4, hora: "08:00" }, { dia: 4, hora: "19:00" },
    { dia: 5, hora: "08:00" }, { dia: 5, hora: "19:00" },
    { dia: 6, hora: "19:00", nota: "Misa de vigilia del domingo" },
    { dia: 0, hora: "09:00" },
    { dia: 0, hora: "11:00", nota: "Misa con las familias y el coro" },
    { dia: 0, hora: "19:30" }
  ];

  var DIAS = ["domingo", "lunes", "martes", "miércoles", "jueves", "viernes", "sábado"];

  function buscarProxima(ahora) {
    for (var salto = 0; salto < 8; salto++) {
      var fecha = new Date(ahora.getTime());
      fecha.setDate(fecha.getDate() + salto);
      var diaSemana = fecha.getDay();

      var año = fecha.getFullYear();
      var mes = String(fecha.getMonth() + 1).padStart(2, "0");
      var dia = String(fecha.getDate()).padStart(2, "0");
      var prefijo = año + "-" + mes + "-" + dia + "T";

      for (var i = 0; i < MISAS.length; i++) {
        var m = MISAS[i];
        if (m.dia !== diaSemana) continue;

        var fechaMisa = new Date(prefijo + m.hora + ":00");
        if (fechaMisa.getTime() > ahora.getTime()) {
          return { fecha: fechaMisa, salto: salto, diaSemana: diaSemana, hora: m.hora, nota: m.nota };
        }
      }
    }
    return null;
  }

  function actualizarProximaMisa() {
    var nodoCuando = document.getElementById("proxima-cuando");
    var nodoDia = document.getElementById("proxima-dia");
    var nodoHora = document.getElementById("proxima-hora");
    var nodoDetalle = document.getElementById("proxima-detalle");

    if (!nodoCuando || !nodoDia || !nodoHora) return;

    var prox = buscarProxima(new Date());
    if (!prox) {
      nodoDia.textContent = "Consultá los horarios";
      nodoHora.textContent = "—";
      return;
    }

    var textoDia;
    if (prox.salto === 0) textoDia = "Hoy";
    else if (prox.salto === 1) textoDia = "Mañana";
    else textoDia = DIAS[prox.diaSemana].charAt(0).toUpperCase() + DIAS[prox.diaSemana].slice(1);

    nodoDia.textContent = textoDia;
    nodoHora.textContent = prox.hora;
    nodoCuando.setAttribute("datetime", prox.fecha.toISOString());

    if (nodoDetalle) {
      nodoDetalle.textContent = prox.nota ? "Iglesia principal · " + prox.nota : "Iglesia principal";
    }
  }

  actualizarProximaMisa();
  setInterval(actualizarProximaMisa, 60000);

  /* ==========================================================
     3. FILTROS DE LA GALERÍA
     ========================================================== */
  var filtros = document.querySelectorAll(".filtros [data-filtro]");
  var fotos = document.querySelectorAll(".galeria [data-categoria]");

  if (filtros.length && fotos.length) {
    filtros.forEach(function (b) {
      b.addEventListener("click", function () {
        filtros.forEach(function (otro) {
          otro.classList.remove("activo");
          otro.removeAttribute("aria-current");
        });
        b.classList.add("activo");
        b.setAttribute("aria-current", "true");

        var f = b.getAttribute("data-filtro");
        fotos.forEach(function (fig) {
          var coincide = f === "todas" || fig.getAttribute("data-categoria") === f;
          fig.hidden = !coincide;
        });
      });
    });
  }

  /* ==========================================================
     4. VALIDACIÓN DEL FORMULARIO DE CONTACTO
     ========================================================== */
  var form = document.getElementById("form-contacto");

  if (form) {
    var MENSAJES = {
      valueMissing: "Por favor, completá este campo.",
      typeMismatch: "Escribí un correo electrónico válido (ejemplo: nombre@dominio.com).",
      tooShort: "El mensaje es un poco corto. Contanos algún detalle más para poder ayudarte."
    };

    function textoError(campo) {
      var v = campo.validity;
      if (v.valueMissing) return MENSAJES.valueMissing;
      if (v.typeMismatch) return MENSAJES.typeMismatch;
      if (v.tooShort) return MENSAJES.tooShort;
      return campo.validationMessage;
    }

    function revisar(campo) {
      var caja = document.getElementById("error-" + campo.id);
      if (!caja) return campo.checkValidity();

      if (campo.checkValidity()) {
        caja.textContent = "";
        campo.removeAttribute("aria-invalid");
        return true;
      }
      caja.textContent = textoError(campo);
      campo.setAttribute("aria-invalid", "true");
      return false;
    }

    var campos = Array.prototype.slice.call(form.querySelectorAll("input, select, textarea"));
    campos.forEach(function (c) {
      c.addEventListener("blur", function () { revisar(c); });
      c.addEventListener("input", function () {
        if (c.getAttribute("aria-invalid") === "true") revisar(c);
      });
    });

    form.addEventListener("submit", function (e) {
      var primerError = null;
      campos.forEach(function (c) {
        if (!revisar(c) && !primerError) primerError = c;
      });

      if (primerError) {
        e.preventDefault();
        primerError.focus();
        return;
      }

      if (!form.getAttribute("action")) {
        e.preventDefault();
        var ok = document.getElementById("form-ok");
        if (ok) {
          ok.hidden = false;
          ok.setAttribute("tabindex", "-1");
          ok.focus();
        }
        form.reset();
      }
    });
  }
})();
