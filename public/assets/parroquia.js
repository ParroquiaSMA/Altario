/* ============================================================
   PARROQUIA SANTA MARÍA DE LA AYUDA
   Un solo archivo para todo el sitio. Cada bloque se activa
   únicamente si la página lo necesita, así que se puede cargar
   en todas sin problema.
   ============================================================ */
(function () {
  "use strict";

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

      var delDia = MISAS
        .filter(function (m) { return m.dia === fecha.getDay(); })
        .sort(function (a, b) { return a.hora.localeCompare(b.hora); });

      for (var i = 0; i < delDia.length; i++) {
        var p = delDia[i].hora.split(":");
        var cuando = new Date(fecha.getTime());
        cuando.setHours(+p[0], +p[1], 0, 0);
        if (cuando > ahora) return { misa: delDia[i], cuando: cuando, salto: salto };
      }
    }
    return null;
  }

  var elDia = document.getElementById("proxima-dia");
  if (elDia) {
    var res = buscarProxima(new Date());
    if (res) {
      var etiqueta = res.salto === 0 ? "Hoy" : res.salto === 1 ? "Mañana" : "El " + DIAS[res.cuando.getDay()];
      var hora = String(res.cuando.getHours()).padStart(2, "0") + ":" +
                 String(res.cuando.getMinutes()).padStart(2, "0");

      elDia.textContent = etiqueta + " a las";
      document.getElementById("proxima-hora").textContent = hora;
      document.getElementById("proxima-detalle").textContent = res.misa.nota || "Iglesia principal";
      document.getElementById("proxima-cuando").setAttribute(
        "aria-label", "Próxima misa: " + etiqueta.toLowerCase() + " a las " + hora + " horas."
      );
    }
  }

  /* ==========================================================
     3. GALERÍA: filtros y visor
     ========================================================== */
  var galeria = document.getElementById("galeria");

  if (galeria) {
    var items = Array.prototype.slice.call(galeria.querySelectorAll("li"));
    var conteo = document.getElementById("galeria-conteo");

    /* --- Filtros por categoría --- */
    var filtros = Array.prototype.slice.call(document.querySelectorAll(".filtro"));

    filtros.forEach(function (f) {
      f.addEventListener("click", function () {
        var cat = f.dataset.filtro;
        filtros.forEach(function (o) { o.setAttribute("aria-pressed", String(o === f)); });

        var visibles = 0;
        items.forEach(function (li) {
          var mostrar = cat === "todas" || li.dataset.categoria === cat;
          li.hidden = !mostrar;
          if (mostrar) visibles++;
        });

        if (conteo) {
          conteo.textContent = visibles === 1 ? "1 foto" : visibles + " fotos";
        }
      });
    });

    /* --- Visor a pantalla completa --- */
    var visor = document.getElementById("visor");

    if (visor && typeof visor.showModal === "function") {
      var vImg = document.getElementById("visor-img");
      var vTexto = document.getElementById("visor-texto");
      var vPos = document.getElementById("visor-posicion");
      var indice = 0;

      function visibles() {
        return items.filter(function (li) { return !li.hidden; });
      }

      function mostrar(i) {
        var lista = visibles();
        if (!lista.length) return;
        indice = (i + lista.length) % lista.length;

        var img = lista[indice].querySelector("img");
        var pie = lista[indice].querySelector("figcaption");

        vImg.src = img.dataset.grande || img.src;
        vImg.alt = img.alt;
        vTexto.textContent = pie ? pie.textContent : "";
        vPos.textContent = "Foto " + (indice + 1) + " de " + lista.length;
      }

      galeria.addEventListener("click", function (e) {
        var boton = e.target.closest(".foto");
        if (!boton) return;
        mostrar(visibles().indexOf(boton.closest("li")));
        visor.showModal();
      });

      var btnAnt = document.getElementById("visor-anterior");
      var btnSig = document.getElementById("visor-siguiente");
      var btnCerrar = document.getElementById("visor-cerrar");

      if (btnAnt) btnAnt.addEventListener("click", function () { mostrar(indice - 1); });
      if (btnSig) btnSig.addEventListener("click", function () { mostrar(indice + 1); });
      if (btnCerrar) btnCerrar.addEventListener("click", function () { visor.close(); });

      visor.addEventListener("keydown", function (e) {
        if (e.key === "ArrowLeft") { e.preventDefault(); mostrar(indice - 1); }
        if (e.key === "ArrowRight") { e.preventDefault(); mostrar(indice + 1); }
      });

      /* Clic sobre el fondo oscuro cierra el visor */
      visor.addEventListener("click", function (e) {
        if (e.target === visor) visor.close();
      });
    }
  }

  /* ==========================================================
     4. FORMULARIO DE CONTACTO
     Valida en el navegador y muestra los errores en español.
     ========================================================== */
  var form = document.getElementById("form-contacto");

  if (form) {
    var MENSAJES = {
      valueMissing: "Completá este dato para poder responderte.",
      typeMismatch: "Revisá el formato. Un correo se escribe así: nombre@ejemplo.com",
      tooShort: "Escribinos un poco más para entender de qué se trata."
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
