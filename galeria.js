// Visor de fotografías de la galería (sustituye a Highslide).
// Cada foto de .galeria-fotos es un <figure> con un enlace a la imagen grande, la miniatura y un
// <figcaption> con la leyenda. Al pulsar una miniatura se abre la foto grande en un <dialog> con la
// leyenda y los controles: anterior, pase automático, siguiente y cerrar.
// Teclado: flechas para cambiar de foto, espacio para el pase, Esc para cerrar.
// En el móvil se puede deslizar el dedo para cambiar de foto.
// Sin JavaScript, los enlaces abren la imagen grande directamente.
(function () {
	"use strict";

	var INTERVALO_PASE = 5000; // milisegundos entre fotos en el pase automático

	var fotos = [];
	var actual = 0;
	var temporizador = null;
	var visor, imagen, leyenda, contador, botonPase;

	function crearVisor() {
		visor = document.createElement("dialog");
		visor.className = "visor";
		visor.tabIndex = -1;
		visor.setAttribute("aria-label", "Fotografía ampliada");
		visor.innerHTML =
			'<figure class="visor-foto">' +
				'<img alt="">' +
				'<figcaption></figcaption>' +
			'</figure>' +
			'<div class="visor-controles">' +
				'<button type="button" class="visor-anterior" title="Anterior (flecha izquierda)" aria-label="Anterior">&#8249;</button>' +
				'<button type="button" class="visor-pase" title="Pase automático (espacio)" aria-label="Iniciar pase automático">&#9654;</button>' +
				'<button type="button" class="visor-siguiente" title="Siguiente (flecha derecha)" aria-label="Siguiente">&#8250;</button>' +
				'<span class="visor-contador"></span>' +
				'<button type="button" class="visor-cerrar" title="Cerrar (Esc)" aria-label="Cerrar">&#10005;</button>' +
			'</div>';
		document.body.appendChild(visor);

		imagen = visor.querySelector(".visor-foto img");
		leyenda = visor.querySelector(".visor-foto figcaption");
		contador = visor.querySelector(".visor-contador");
		botonPase = visor.querySelector(".visor-pase");

		visor.querySelector(".visor-anterior").addEventListener("click", function () { pararPase(); mostrar(actual - 1); });
		visor.querySelector(".visor-siguiente").addEventListener("click", function () { pararPase(); mostrar(actual + 1); });
		visor.querySelector(".visor-cerrar").addEventListener("click", cerrar);
		botonPase.addEventListener("click", alternarPase);

		// Pulsar fuera de la foto (en el fondo oscuro) cierra el visor
		visor.addEventListener("click", function (e) {
			if (e.target === visor) cerrar();
		});
		// Esc cierra el <dialog> por sí solo; hay que parar el pase
		visor.addEventListener("close", pararPase);

		visor.addEventListener("keydown", function (e) {
			if (e.key === "ArrowLeft") { pararPase(); mostrar(actual - 1); e.preventDefault(); }
			else if (e.key === "ArrowRight") { pararPase(); mostrar(actual + 1); e.preventDefault(); }
			else if (e.key === " " && e.target.tagName !== "BUTTON") { alternarPase(); e.preventDefault(); }
		});

		// Deslizar el dedo a izquierda o derecha
		var inicioX = null;
		visor.addEventListener("touchstart", function (e) { inicioX = e.changedTouches[0].clientX; }, { passive: true });
		visor.addEventListener("touchend", function (e) {
			if (inicioX === null) return;
			var dx = e.changedTouches[0].clientX - inicioX;
			inicioX = null;
			if (Math.abs(dx) > 50) { pararPase(); mostrar(dx < 0 ? actual + 1 : actual - 1); }
		});

		// Fundido al cargar cada foto
		imagen.addEventListener("load", function () { imagen.classList.add("cargada"); });
	}

	function mostrar(n) {
		actual = (n + fotos.length) % fotos.length;
		var foto = fotos[actual];
		imagen.classList.remove("cargada");
		imagen.src = foto.grande;
		imagen.alt = foto.alt;
		leyenda.innerHTML = foto.leyenda; // HTML propio de la página: puede llevar el enlace "Más información"
		contador.textContent = (actual + 1) + " / " + fotos.length;
		// Precargar la siguiente
		new Image().src = fotos[(actual + 1) % fotos.length].grande;
	}

	function abrir(n) {
		if (!visor) crearVisor();
		mostrar(n);
		visor.showModal();
		visor.focus(); // sin recuadro de foco en el primer botón; las teclas siguen funcionando
	}

	function cerrar() {
		pararPase();
		visor.close();
	}

	function alternarPase() {
		if (temporizador) { pararPase(); return; }
		botonPase.innerHTML = "&#10074;&#10074;";
		botonPase.setAttribute("aria-label", "Detener pase automático");
		temporizador = setInterval(function () {
			// Como en Highslide, el pase se detiene al llegar a la última foto
			if (actual === fotos.length - 1) { pararPase(); return; }
			mostrar(actual + 1);
		}, INTERVALO_PASE);
	}

	function pararPase() {
		if (!temporizador) return;
		clearInterval(temporizador);
		temporizador = null;
		botonPase.innerHTML = "&#9654;";
		botonPase.setAttribute("aria-label", "Iniciar pase automático");
	}

	document.addEventListener("DOMContentLoaded", function () {
		if (typeof HTMLDialogElement !== "function") return; // navegador muy antiguo: los enlaces abren la imagen
		var enlaces = document.querySelectorAll(".galeria-fotos figure > a");
		Array.prototype.forEach.call(enlaces, function (enlace, i) {
			var miniatura = enlace.querySelector("img");
			var pie = enlace.parentNode.querySelector("figcaption");
			fotos.push({
				grande: enlace.getAttribute("href"),
				alt: miniatura ? miniatura.alt : "",
				leyenda: pie ? pie.innerHTML.trim() : ""
			});
			enlace.addEventListener("click", function (e) {
				e.preventDefault();
				abrir(i);
			});
		});
	});
})();
