/**
 * Simulador de Inspección Comercial · San Isidro
 * Recibe los resultados del simulador (con la dirección del local, sin su nombre)
 * y los guarda en esta planilla.
 *
 * Instalación (detalle en el README):
 *   1. En la planilla: Extensiones > Apps Script, pegar este código y guardar.
 *   2. Ejecutar una vez la función "configurar" y aceptar los permisos.
 *   3. Implementar > Nueva implementación > Aplicación web
 *      - Ejecutar como: Yo
 *      - Quién tiene acceso: Cualquier usuario
 *   4. Copiar la URL que termina en /exec y pegarla en config.js.
 */

const HOJA_REGISTROS = 'Registros';
const HOJA_RESUMEN = 'Resumen';

const ENCABEZADOS = [
  'ID', 'Fecha', 'Dirección', 'Rubro', 'Categoría', 'Trámite', 'Trámite según Anexo II', 'Cambio de trámite',
  'Superficie', 'Empleados', 'Depósito inflamables', 'Incluye rotisería',
  'Resultado', 'Cumple', 'No cumple', 'No aplica',
  'Incumplimientos críticos', 'Observaciones', 'Respuestas (JSON)'
];

const RESULTADOS = { apto: 'Apto', obs: 'Apto con observaciones', noapto: 'No apto' };
const TRAMITES = { expres: 'Exprés', licencia: 'Con Licencia', localizacion: 'Localización' };

function doPost(e) {
  const lock = LockService.getScriptLock();
  lock.waitLock(15000);
  try {
    const d = JSON.parse(e.postData.contents);

    // Validación básica: solo se aceptan registros con la forma del simulador.
    if (!d || typeof d !== 'object') throw new Error('Formato inválido');
    if (!RESULTADOS[d.resultado]) throw new Error('Resultado inválido');
    if (!TRAMITES[d.tipo] || !TRAMITES[d.tipoAnexo]) throw new Error('Trámite inválido');
    const id = texto(d.id, 64);
    if (!id) throw new Error('Falta el id');

    const hoja = hojaRegistros_();

    // Descarta duplicados (reintentos de la misma inspección).
    const ultima = hoja.getLastRow();
    if (ultima > 1) {
      const desde = Math.max(2, ultima - 499);
      const ids = hoja.getRange(desde, 1, ultima - desde + 1, 1).getValues().flat();
      if (ids.indexOf(id) !== -1) return json_({ ok: true, duplicado: true });
    }

    const valores = {
      'ID': id,
      'Fecha': new Date(),
      'Dirección': texto(d.direccion, 200),
      'Rubro': texto(d.rubro, 200),
      'Categoría': texto(d.categoria, 120),
      'Trámite': TRAMITES[d.tipo],
      'Trámite según Anexo II': TRAMITES[d.tipoAnexo],
      'Cambio de trámite': texto(d.cambioTipo, 200),
      'Superficie': texto(d.superficie, 40),
      'Empleados': texto(d.empleados, 40),
      'Depósito inflamables': d.inflamables ? 'Sí' : 'No',
      'Incluye rotisería': d.rotiseria ? 'Sí' : 'No',
      'Resultado': RESULTADOS[d.resultado],
      'Cumple': numero(d.cumple),
      'No cumple': numero(d.noCumple),
      'No aplica': numero(d.noAplica),
      'Incumplimientos críticos': lista(d.criticos),
      'Observaciones': lista(d.observaciones),
      'Respuestas (JSON)': texto(JSON.stringify(d.respuestas || {}), 5000)
    };
    // Se escribe según el encabezado real de la hoja, así sirve aunque las columnas estén en otro orden.
    const enc = encabezado_(hoja);
    hoja.appendRow(enc.map(h => (h in valores) ? valores[h] : ''));
    return json_({ ok: true });
  } catch (err) {
    return json_({ ok: false, error: String(err && err.message || err) });
  } finally {
    lock.releaseLock();
  }
}

/** Permite comprobar desde el navegador que la aplicación web responde. */
function doGet() {
  return json_({ ok: true, servicio: 'Simulador de Inspección Comercial' });
}

/** Ejecutar una vez: crea las hojas Registros y Resumen. */
function configurar() {
  const hr = hojaRegistros_();
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const r = ss.getSheetByName(HOJA_RESUMEN) || ss.insertSheet(HOJA_RESUMEN);
  r.clear();
  const R = HOJA_REGISTROS;
  const cRes = letra_(hr, 'Resultado'), cTra = letra_(hr, 'Trámite'), cRub = letra_(hr, 'Rubro');
  const filas = [
    ['Resumen de inspecciones simuladas', ''],
    ['', ''],
    ['Total de registros', `=COUNTA('${R}'!A2:A)`],
    ['Apto', `=COUNTIF('${R}'!${cRes}2:${cRes},"Apto")`],
    ['Apto con observaciones', `=COUNTIF('${R}'!${cRes}2:${cRes},"Apto con observaciones")`],
    ['No apto', `=COUNTIF('${R}'!${cRes}2:${cRes},"No apto")`],
    ['', ''],
    ['Por trámite', ''],
    ['Exprés', `=COUNTIF('${R}'!${cTra}2:${cTra},"Exprés")`],
    ['Con Licencia', `=COUNTIF('${R}'!${cTra}2:${cTra},"Con Licencia")`],
    ['Localización', `=COUNTIF('${R}'!${cTra}2:${cTra},"Localización")`],
  ];
  r.getRange(1, 1, filas.length, 2).setValues(filas);
  r.getRange('A1').setFontWeight('bold').setFontSize(14);
  r.getRange('A8').setFontWeight('bold');
  r.getRange('D1').setValue('Resultados por rubro').setFontWeight('bold');
  r.getRange('D2').setFormula(
    `=IFERROR(QUERY({'${R}'!${cRub}2:${cRub},'${R}'!${cRes}2:${cRes}},"select Col1, count(Col1) where Col1 is not null group by Col1 pivot Col2 label Col1 'Rubro'",0),"Sin registros todavía")`
  );
  r.setColumnWidth(1, 220);
  r.setColumnWidth(4, 360);
}

function hojaRegistros_() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const hoja = ss.getSheetByName(HOJA_REGISTROS) || ss.insertSheet(HOJA_REGISTROS);
  if (hoja.getLastRow() === 0) {
    hoja.appendRow(ENCABEZADOS);
    hoja.setFrozenRows(1);
    hoja.getRange(1, 1, 1, ENCABEZADOS.length).setFontWeight('bold');
    hoja.getRange('B:B').setNumberFormat('dd/mm/yyyy hh:mm');
    return hoja;
  }
  // Planilla creada con una versión anterior: agrega las columnas que falten (por ejemplo, Dirección).
  const enc = encabezado_(hoja);
  ENCABEZADOS.forEach(function (h, i) {
    if (enc.indexOf(h) !== -1) return;
    const despues = i > 0 ? enc.indexOf(ENCABEZADOS[i - 1]) : -1;
    if (despues !== -1) {
      hoja.insertColumnAfter(despues + 1);
      hoja.getRange(1, despues + 2).setValue(h).setFontWeight('bold');
      enc.splice(despues + 1, 0, h);
    } else {
      hoja.getRange(1, enc.length + 1).setValue(h).setFontWeight('bold');
      enc.push(h);
    }
  });
  return hoja;
}

function encabezado_(hoja) {
  const n = Math.max(1, hoja.getLastColumn());
  return hoja.getRange(1, 1, 1, n).getValues()[0].map(String);
}

function letra_(hoja, nombre) {
  const i = encabezado_(hoja).indexOf(nombre);
  let n = i + 1, s = '';
  while (n > 0) { const m = (n - 1) % 26; s = String.fromCharCode(65 + m) + s; n = Math.floor((n - 1) / 26); }
  return s;
}

function texto(v, max) {
  // Antepone un apóstrofo a lo que parezca fórmula, para que la planilla no lo ejecute.
  let s = String(v == null ? '' : v).slice(0, max);
  if (/^[=+\-@]/.test(s)) s = "'" + s;
  return s;
}
function numero(v) { const n = Number(v); return isFinite(n) ? Math.max(0, Math.min(1000, Math.round(n))) : 0; }
function lista(v) { return Array.isArray(v) ? texto(v.slice(0, 60).map(x => String(x).slice(0, 200)).join(' | '), 5000) : ''; }
function json_(o) { return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON); }
