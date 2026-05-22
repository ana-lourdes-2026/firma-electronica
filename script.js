let hashActual = "";
let archivoActual = "";
let rutaActual = "";

async function generarHash() {
  const fileInput = document.getElementById("archivo");
  const firmante = document.getElementById("firmante").value.trim();
  const resultado = document.getElementById("resultado");

  if (firmante === "") {
    alert("Ingrese el nombre del firmante");
    return;
  }

  if (fileInput.files.length === 0) {
    alert("Seleccione un archivo");
    return;
  }

  const file = fileInput.files[0];
  archivoActual = file.name;

  const arrayBuffer = await file.arrayBuffer();
  const hashBuffer = await crypto.subtle.digest("SHA-256", arrayBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  hashActual = hashArray.map(b => b.toString(16).padStart(2, "0")).join("");

  resultado.innerHTML = `
    <strong>Hash generado:</strong><br>
    ${hashActual}
  `;
}

async function firmarDocumento() {
  const fileInput = document.getElementById("archivo");
  const firmante = document.getElementById("firmante").value.trim();

  if (firmante === "") {
    alert("Ingrese el nombre del firmante");
    return;
  }

  if (fileInput.files.length === 0) {
    alert("Seleccione un archivo");
    return;
  }

  if (hashActual === "") {
    alert("Primero genere el hash");
    return;
  }

  const datos = new FormData();
  datos.append("archivo", fileInput.files[0]);

  const respuesta = await fetch("/subir", {
    method: "POST",
    body: datos
  });

  const data = await respuesta.json();

  const firma = {
    firmaDibujada: canvas.toDataURL(),
    firmante: firmante,
    archivo: data.archivo,
    ruta: data.ruta,
    fecha: new Date().toLocaleString(),
    hash: hashActual
  };

  let firmas = JSON.parse(localStorage.getItem("firmas")) || [];
  firmas.push(firma);
  localStorage.setItem("firmas", JSON.stringify(firmas));

  mostrarFirmas();

  document.getElementById("resultado").innerHTML += `
    <br><br>
    <strong>Documento guardado:</strong> ${data.archivo}<br>
    <a href="http://localhost:3000${data.ruta}" target="_blank">Descargar documento firmado</a>
  `;

  alert("Documento firmado y guardado correctamente ✅");
}

function mostrarFirmas() {
  const tabla = document.getElementById("tablaFirmas");
  tabla.innerHTML = "";

  let firmas = JSON.parse(localStorage.getItem("firmas")) || [];

  firmas.forEach(firma => {
    const fila = `
      <tr>
        <td>${firma.firmante}</td>
        <td>${firma.archivo}</td>
        <td>${firma.fecha}</td>
        <td>${firma.hash}</td>
        <td><a href="http://localhost:3000/uploads/${firma.archivo}" target="_blank">Descargar</a></td>
      </tr>
    `;

    tabla.innerHTML += fila;
  });
}
const canvas = document.getElementById("firmaCanvas");
const ctx = canvas.getContext("2d");

let dibujando = false;

canvas.addEventListener("mousedown", iniciarFirma);
canvas.addEventListener("mouseup", terminarFirma);
canvas.addEventListener("mousemove", dibujarFirma);

function iniciarFirma(e) {
  dibujando = true;
  ctx.beginPath();
  ctx.moveTo(e.offsetX, e.offsetY);
}

function terminarFirma() {
  dibujando = false;
}

function dibujarFirma(e) {
  if (!dibujando) return;

  ctx.lineWidth = 2;
  ctx.lineCap = "round";
  ctx.strokeStyle = "black";

  ctx.lineTo(e.offsetX, e.offsetY);
  ctx.stroke();
}

function limpiarFirma() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
}
function verificarFirma() {
  let firmas = JSON.parse(localStorage.getItem("firmas")) || [];

  if (firmas.length === 0) {
    alert("No hay documentos firmados");
    return;
  }

  if (hashActual === "") {
    alert("Primero genere el hash del documento actual");
    return;
  }

  const ultimaFirma = firmas[firmas.length - 1];

  if (ultimaFirma.hash === hashActual) {
    alert("Documento válido ✅ No ha sido modificado");
  } else {
    alert("Documento alterado ❌");
  }
}

function limpiarFormulario() {
  document.getElementById("firmante").value = "";
  document.getElementById("archivo").value = "";
  document.getElementById("resultado").innerHTML = "";
  hashActual = "";
  archivoActual = "";
  rutaActual = "";
}

window.onload = mostrarFirmas;
function eliminarFirmas() {
  localStorage.removeItem("firmas");
  document.getElementById("tablaFirmas").innerHTML = "";
  document.getElementById("resultado").innerHTML = "";
  alert("Registros eliminados correctamente ✅");
}function descargarComprobante() {
  let firmas = JSON.parse(localStorage.getItem("firmas")) || [];

  if (firmas.length === 0) {
    alert("No hay documentos firmados");
    return;
  }

  const ultimaFirma = firmas[firmas.length - 1];

  const ventana = window.open("", "_blank");

  ventana.document.write(`
    <html>
    <head>
      <title>Comprobante de Firma</title>
      <style>
        body {
          font-family: Arial;
          padding: 40px;
        }
        h1 {
          text-align: center;
        }
        .firma {
          margin-top: 30px;
          border: 1px solid #000;
          width: 400px;
          height: 150px;
        }
        .hash {
          word-wrap: break-word;
        }
      </style>
    </head>
    <body>
      <h1>Comprobante de Firma Electrónica</h1>

      <p><strong>Firmante:</strong> ${ultimaFirma.firmante}</p>
      <p><strong>Archivo:</strong> ${ultimaFirma.archivo}</p>
      <p><strong>Fecha:</strong> ${ultimaFirma.fecha}</p>
      <p class="hash"><strong>Hash SHA-256:</strong> ${ultimaFirma.hash}</p>

      <h3>Firma dibujada:</h3>
      <img class="firma" src="${ultimaFirma.firmaDibujada}">

      <br><br>
      <button onclick="window.print()">Guardar como PDF</button>
    </body>
    </html>
  `);

  ventana.document.close();
}