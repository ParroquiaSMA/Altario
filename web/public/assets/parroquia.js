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

        document.querySelectorAll(".hero, .portada, .seccion--oscura, .pie").forEach(function (el) {
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
          var nombreParroquia = cfg.parroquia.nombre || "la Parroquia";

          if (logoUrl) {
            marcaAnchor.innerHTML = '<img src="' + logoUrl + '" alt="' + nombreParroquia + '" class="marca__logo" loading="eager" />';
          } else {
            marcaAnchor.innerHTML = '<svg width="44" height="44" viewBox="0 0 44 44" role="img" aria-label="Escudo de ' + nombreParroquia + '"><circle cx="22" cy="22" r="20.5" fill="none" stroke="' + oroCol + '"></circle><circle cx="22" cy="22" r="17" fill="' + lapisCol + '"></circle><text x="22" y="28.5" text-anchor="middle" fill="' + oroCol + '" font-family="Marcellus, Georgia, serif" font-size="16">' + logoInit + '</text></svg><span class="marca__texto"><strong class="marca__nombre">' + nombreParroquia + '</strong><span class="marca__bajada">Parroquia</span></span>';
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
    } catch (e) {}
  }

  // Carga y sincronización dinámica desde Supabase en el cliente
  var SUPABASE_REST_URL = "https://eucgxnnnmheqhptcxldp.supabase.co/rest/v1";
  var SUPABASE_ANON = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV1Y2d4bm5ubWhlcWhwdGN4bGRwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODc2Mjc1MjAsImV4cCI6MjEwMzIwMzUyMH0.Mf-7XI5ZMlnPYj3LGE2_HqiNcKFGHSunPnCDgnWTFqw";

  function fetchLiveSupabaseData() {
    var headers = {
      "apikey": SUPABASE_ANON,
      "Authorization": "Bearer " + SUPABASE_ANON
    };

    // 1. Horarios en vivo
    fetch(SUPABASE_REST_URL + "/horarios?activo=eq.true&order=orden.asc", { headers: headers })
      .then(function(res) { return res.ok ? res.json() : null; })
      .then(function(horarios) {
        if (!Array.isArray(horarios) || horarios.length === 0) return;

        var misas = horarios.filter(function(h) {
          return h.categoria === "misa" || h.categoria === "adoracion" || !h.categoria;
        });

        // Actualizar datos para el cálculo de Próxima Misa
        var misasData = [];
        misas.forEach(function(m) {
          var hora = (m.hora_inicio || "").slice(0, 5);
          var nota = m.titulo || m.descripcion || "Misa";
          var dias = Array.isArray(m.dias_semana) && m.dias_semana.length > 0 ? m.dias_semana : [m.dia_semana];
          dias.forEach(function(d) {
            misasData.push({ dia: Number(d), hora: hora, nota: nota });
          });
        });
        if (misasData.length > 0) {
          MISAS = misasData;
          actualizarProximaMisa();
        }

        // Actualizar lista visual de Misas en la página de inicio
        var misasContenedor = document.querySelector(".misas-lista");
        if (misasContenedor && misas.length > 0) {
          var DIAS_SEMANA = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
          var DIAS_CORTOS = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

          var html = misas.map(function(h) {
            var hora = (h.hora_inicio || "").slice(0, 5) + (h.hora_fin ? " a " + h.hora_fin.slice(0, 5) + " hs" : " hs");
            var dias = Array.isArray(h.dias_semana) && h.dias_semana.length > 0 ? h.dias_semana : [h.dia_semana];
            var dia = DIAS_SEMANA[dias[0]] || 'Día a coordinar';
            if (dias.length === 7) dia = 'Todos los días';
            else if (dias.length === 5 && [1, 2, 3, 4, 5].every(function(d) { return dias.indexOf(d) !== -1; })) dia = 'Lunes a Viernes';
            else if (dias.length === 2 && dias.indexOf(0) !== -1 && dias.indexOf(6) !== -1) dia = 'Sábado y Domingo';
            else if (dias.length > 1) dia = dias.slice().sort().map(function(d) { return DIAS_CORTOS[d]; }).join(', ');

            var subtitulo = h.titulo ? h.titulo.replace(/^Misa(\s+(de\s+|y\s+|dominical\s+))?/i, '').trim() : '';
            subtitulo = subtitulo.replace(/^\((.+)\)$/, '$1');
            var subHtml = (subtitulo && subtitulo.toLowerCase() !== dia.toLowerCase())
              ? '<span class="misa-item__subtitulo">(' + subtitulo + ')</span>'
              : '';
            var descHtml = h.descripcion ? '<p class="misa-item__nota">' + h.descripcion + '</p>' : '';

            return '<div class="misa-item">' +
              '<div class="misa-item__cabecera">' +
                '<strong class="misa-item__dia">' + dia + ' ' + subHtml + '</strong>' +
                '<span class="misa-item__hora">' + hora + '</span>' +
              '</div>' +
              descHtml +
            '</div>';
          }).join("");

          misasContenedor.innerHTML = html;
        }

        // Actualizar horarios de atención / secretaría
        var atencion = horarios.filter(function(h) {
          return h.categoria === "secretaria" || h.categoria === "confesion";
        });
        var atencionDl = document.querySelector(".horarios .ficha:nth-child(2) dl");
        if (atencionDl && atencion.length > 0) {
          var DIAS_SEMANA = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
          var DIAS_CORTOS = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
          var dlHtml = atencion.map(function(a) {
            var diaTexto = DIAS_CORTOS[a.dia_semana] || DIAS_SEMANA[a.dia_semana];
            var horaTexto = (a.hora_inicio || "").slice(0, 5) + (a.hora_fin ? " – " + a.hora_fin.slice(0, 5) : "");
            return '<dt>' + diaTexto + '</dt><dd>' + horaTexto + '</dd>';
          }).join("");
          atencionDl.innerHTML = dlHtml;
        }
      })
      .catch(function(e) {});

    // 2. Configuración general en vivo (nombre, lema, colores, datos de contacto)
    fetch(SUPABASE_REST_URL + "/configuracion?select=clave,valor", { headers: headers })
      .then(function(res) { return res.ok ? res.json() : null; })
      .then(function(data) {
        if (!Array.isArray(data) || data.length === 0) return;
        var cfg = {};
        data.forEach(function(row) { cfg[row.clave] = row.valor; });
        applyLiveConfig(cfg);
      })
      .catch(function(e) {});
  }

  // Ejecutar carga dinámica al iniciar
  if (typeof window !== "undefined") {
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", fetchLiveSupabaseData);
    } else {
      fetchLiveSupabaseData();
    }
  }

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
  var cabecera = document.querySelector(".cabecera");

  if (btn && nav && !btn.dataset.menuReady) {
    btn.dataset.menuReady = "true";

    var toggleMenu = function (forzarEstado) {
      var abierto = nav.getAttribute("data-abierto") === "true";
      var nuevoEstado = typeof forzarEstado === "boolean" ? forzarEstado : !abierto;
      nav.setAttribute("data-abierto", String(nuevoEstado));
      btn.setAttribute("aria-expanded", String(nuevoEstado));
      if (cabecera) {
        cabecera.classList.toggle("cabecera--abierta", nuevoEstado);
      }
    };

    btn.addEventListener("click", function (e) {
      e.preventDefault();
      e.stopPropagation();
      toggleMenu();
    });

    nav.addEventListener("click", function (e) {
      if (e.target.closest("a") && window.innerWidth <= 1000) {
        toggleMenu(false);
      }
    });

    document.addEventListener("click", function (e) {
      if (!nav.contains(e.target) && !btn.contains(e.target)) {
        toggleMenu(false);
      }
    });

    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && nav.getAttribute("data-abierto") === "true") {
        toggleMenu(false);
        btn.focus();
      }
    });
  }

  /* ==========================================================
     2. PRÓXIMA MISA
     dia: 0 = domingo … 6 = sábado.
     ========================================================== */
  var MISAS = (window.__HORARIOS_MISA__ && window.__HORARIOS_MISA__.length > 0)
    ? window.__HORARIOS_MISA__
    : [
        { dia: 6, hora: "17:00", nota: "Misa de vísperas y confesiones" },
        { dia: 0, hora: "10:00", nota: "Misa dominical comunitaria" },
        { dia: 0, hora: "17:00", nota: "Misa vespertina de la tarde" }
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
          otro.setAttribute("aria-pressed", "false");
        });
        b.classList.add("activo");
        b.setAttribute("aria-pressed", "true");

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

    form.addEventListener("submit", async function (e) {
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
        var submitBtn = form.querySelector('button[type="submit"]');
        var originalBtnText = submitBtn ? submitBtn.textContent : "Enviar mensaje";
        if (submitBtn) {
          submitBtn.disabled = true;
          submitBtn.textContent = "Enviando...";
        }

        var nombreInput = document.getElementById("nombre");
        var correoInput = document.getElementById("correo");
        var telefonoInput = document.getElementById("telefono");
        var motivoInput = document.getElementById("motivo");
        var mensajeInput = document.getElementById("mensaje");
        var canalRadio = form.querySelector('input[name="respuesta"]:checked');

        var payload = {
          nombre: nombreInput ? nombreInput.value.trim() : "",
          correo: correoInput ? correoInput.value.trim() : "",
          telefono: telefonoInput && telefonoInput.value.trim() ? telefonoInput.value.trim() : null,
          motivo: motivoInput ? motivoInput.value : "Consulta general",
          mensaje: mensajeInput ? mensajeInput.value.trim() : "",
          canal_preferido: canalRadio ? canalRadio.value : "correo",
          leido: false,
          respondido: false
        };

        var supabaseUrl = "https://eucgxnnnmheqhptcxldp.supabase.co/rest/v1/mensajes_contacto";
        var supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV1Y2d4bm5ubWhlcWhwdGN4bGRwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODc2Mjc1MjAsImV4cCI6MjEwMzIwMzUyMH0.Mf-7XI5ZMlnPYj3LGE2_HqiNcKFGHSunPnCDgnWTFqw";

        try {
          await fetch(supabaseUrl, {
            method: "POST",
            headers: {
              "apikey": supabaseAnonKey,
              "Authorization": "Bearer " + supabaseAnonKey,
              "Content-Type": "application/json",
              "Prefer": "return=minimal"
            },
            body: JSON.stringify(payload)
          });
        } catch (err) {
          console.warn("[Contacto] Fallback offline:", err);
        }



        var ok = document.getElementById("form-ok");
        if (ok) {
          ok.hidden = false;
          ok.setAttribute("tabindex", "-1");
          ok.focus();
        }
        form.reset();
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.textContent = originalBtnText;
        }
      }
    });
  }
})();
