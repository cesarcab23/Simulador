# Simulador de Inspección Comercial · San Isidro

Página web para simular una inspección de seguridad e higiene de un comercio de San Isidro. Quien la usa:

1. carga los datos del local;
2. elige el tipo de habilitación (Exprés, Con Licencia o Localización) y el rubro;
3. responde el checklist;
4. obtiene el dictamen: **Apto**, **Apto con observaciones** o **No apto**, con la lista de lo que falta corregir y la norma que lo exige;
5. toca **Descargar informe**, que se habilita cuando están respondidas todas las preguntas.

El acceso está protegido con contraseña: el simulador se publica cifrado, así que sin la contraseña no se puede ver ni leyendo el código del repositorio.

Al tocar **Descargar informe** pasan dos cosas a la vez:

- se descarga un **informe en PDF** con los datos del local, el dictamen, los incumplimientos con su norma y el detalle de todas las respuestas;
- el resultado se registra en una Planilla de Google: **dirección del local**, rubro, trámite, superficie y empleados por rango, resultado y respuestas. El nombre del local solo figura en el PDF; en la planilla no se guarda, como tampoco quién completó el formulario.

Si se descarga dos veces el informe de la misma inspección, la planilla la registra una sola vez. El caso de ejemplo se puede descargar pero no se registra.

## Normativa

- Ordenanza N° 9377 de San Isidro y su Anexo II «Cuadro de Usos / Tipos de Trámite» (IF-2025-00060665-SI-ACSI), con sus referencias 1 a 5.
- Decreto-Ley 7315/67 y Decreto 1123/73 (habilitación sanitaria de comercios, Provincia de Buenos Aires).
- Ley 19.587 y Decreto 351/79 (Higiene y Seguridad en el Trabajo), Ley 24.557 (Riesgos del Trabajo).
- Código Alimentario Argentino, reglamentación AEA 90364 y normas específicas por rubro.

Es una herramienta orientativa: no reemplaza la inspección municipal ni el dictamen de un profesional en Higiene y Seguridad.

## Contenido del repositorio

| Archivo | Para qué sirve |
| --- | --- |
| `index.html` | El simulador **cifrado con contraseña**. Lo generás vos con la herramienta `cifrar.html` (ver Paso 0). |
| `config.js` | La dirección de la planilla donde se guardan los resultados. Es lo único que hay que editar. |
| `assets/escudo.png` | Escudo que se muestra en el encabezado. |
| `apps-script/Codigo.gs` | Código que se pega en la Planilla de Google para recibir los resultados. |

---

## Puesta en marcha

Son cuatro pasos. Se hacen una sola vez y llevan unos 20 minutos.

### Paso 0. Generar el simulador con contraseña

El paquete que descargaste tiene dos carpetas:

- **SUBIR-A-GITHUB**: lo que va al repositorio.
- **NO-SUBIR**: el simulador sin cifrar (`simulador.html`) y la herramienta para cifrarlo (`cifrar.html`). **Nunca subas esta carpeta**: si `simulador.html` llega al repositorio, cualquiera puede verlo sin contraseña.

1. Abrí `NO-SUBIR/cifrar.html` con doble clic (se abre en el navegador).
2. En **Archivo del simulador**, elegí `NO-SUBIR/simulador.html`.
3. Escribí la contraseña dos veces (mínimo 8 caracteres; mejor una frase larga) y tocá **Generar**.
4. Tocá **Descargar index.html** y guardá ese archivo dentro de la carpeta **SUBIR-A-GITHUB**.

La contraseña no se guarda en ningún lado: si la olvidás, generá un `index.html` nuevo con otra.

### Paso 1. Subir el sitio a GitHub Pages

1. Entrá a [github.com](https://github.com) con tu cuenta y creá un repositorio nuevo, por ejemplo `simulador-inspeccion`. Dejalo **Public**: GitHub Pages es gratis solo en repositorios públicos.
2. En el repositorio vacío, elegí **uploading an existing file** y arrastrá todo el contenido de la carpeta **SUBIR-A-GITHUB** (`index.html` cifrado, `config.js`, `README.md` y las carpetas `assets` y `apps-script`). Confirmá con **Commit changes**.
3. Andá a **Settings → Pages**. En **Build and deployment**, elegí **Deploy from a branch**, rama **main** y carpeta **/ (root)**. Guardá.
4. Esperá uno o dos minutos. La página queda publicada en:
   `https://TU-USUARIO.github.io/simulador-inspeccion/`

Al entrar, la página pide la contraseña. En este punto el simulador ya funciona. Lo que falta es conectar el guardado de resultados.

### Paso 2. Crear la planilla que recibe los resultados

1. En Google Drive, creá una **Planilla de Google** nueva, por ejemplo «Registros simulador de inspección».
2. En la planilla, abrí **Extensiones → Apps Script**.
3. Borrá el contenido que aparece, pegá todo el archivo `apps-script/Codigo.gs` y guardá (ícono de disquete).
4. Arriba, en el selector de funciones, elegí **configurar** y tocá **Ejecutar**. Google va a pedir permisos: elegí tu cuenta y aceptá. Si aparece «Google no verificó esta app», tocá **Configuración avanzada → Ir a … (no seguro)**: es tu propio script. Al terminar, la planilla tiene dos hojas nuevas, **Registros** y **Resumen**.
5. Tocá **Implementar → Nueva implementación**. En el engranaje elegí **Aplicación web** y completá:
   - **Ejecutar como:** Yo
   - **Quién tiene acceso:** Cualquier usuario
6. Tocá **Implementar** y copiá la **URL de la aplicación web**. Termina en `/exec`.
7. Para comprobar que funciona, abrí esa URL en el navegador: tiene que mostrar `{"ok":true,"servicio":"Simulador de Inspección Comercial"}`.

«Cualquier usuario» significa que el simulador puede enviar resultados sin pedir login. La planilla en sí sigue siendo privada: solo la ven las personas con las que la compartas desde Drive.

### Paso 3. Conectar el simulador con la planilla

1. En GitHub, abrí `config.js` y tocá el lápiz para editarlo.
2. Pegá la URL entre las comillas:
   ```js
   window.SIMULADOR_CONFIG = {
     urlRegistros: "https://script.google.com/macros/s/XXXXXXXX/exec"
   };
   ```
3. Tocá **Commit changes**. En uno o dos minutos la página se actualiza.
4. Entrá al simulador, tocá **Nueva inspección**, completá un caso de prueba y tocá **Descargar informe**. Se tiene que descargar el PDF y aparecer una fila nueva en la hoja **Registros**. Después podés borrar esa fila de prueba.

---

### Si ya tenías la planilla armada con una versión anterior

Esta versión agrega la columna **Dirección**. Para actualizar sin perder los registros:

1. En la planilla, abrí **Extensiones → Apps Script**, reemplazá todo el código por el nuevo `apps-script/Codigo.gs` y guardá.
2. Elegí la función **configurar** y tocá **Ejecutar**. Agrega la columna Dirección (las filas anteriores quedan con esa celda vacía) y actualiza la hoja Resumen.
3. Tocá **Implementar → Gestionar implementaciones**, el lápiz de la implementación activa, en **Versión** elegí **Nueva versión** y tocá **Implementar**. Así la URL de `config.js` no cambia.
4. Generá el `index.html` nuevo con `cifrar.html` y subilo a GitHub.

---

## Uso diario

- **Compartir el simulador:** pasá el link de GitHub Pages junto con la contraseña. Quien marque «Recordar en este dispositivo» no la vuelve a escribir en esa computadora o celular.
- **Cambiar la contraseña:** generá un `index.html` nuevo con `cifrar.html` y subilo reemplazando el anterior (en GitHub: **Add file → Upload files**). Los dispositivos que la tenían recordada la vuelven a pedir.
- **Ver los resultados:** abrí la planilla. La hoja **Registros** tiene una fila por inspección y la hoja **Resumen** los totales por resultado, por trámite y por rubro.
- **Dar acceso a los resultados:** compartí la planilla desde Drive (botón **Compartir**) con las personas del equipo. Con **Lector** pueden ver los datos; con **Editor** también pueden modificarlos.
- **Pasar los registros a Excel:** desde la planilla, **Archivo → Descargar → Microsoft Excel (.xlsx)**. La planilla de Google es la base que recibe los datos; el Excel es una copia en el momento en que lo descargás.
- **El PDF necesita internet:** el informe se arma con una librería que se carga de cdnjs.cloudflare.com la primera vez que se toca el botón. Si la red la bloquea, el informe se descarga igual, en formato texto (.txt), y el registro en la planilla se hace normalmente.

## Mantenimiento

- **Cambiar preguntas o rubros:** se editan en `NO-SUBIR/simulador.html` (nunca en el `index.html` cifrado). Los rubros del Anexo II están en la lista `ANEXO` y las preguntas en `SECCIONES`; cada pregunta indica si es crítica (`crit:1`) y la norma que la respalda. Después de editar, volvé a generar el `index.html` con `cifrar.html` y subilo.
- **Si modificás `Codigo.gs`:** volvé a implementar con **Implementar → Gestionar implementaciones → Editar → Nueva versión**, así la URL no cambia.
- **Qué protege la contraseña:** el contenido del simulador. El escudo y `config.js` (con la dirección de la planilla) quedan públicos en el repositorio. La planilla en sí sigue siendo privada.
- **Cuidado con los datos:** la URL de la planilla queda visible en el código de la página, como en cualquier formulario web. El script solo acepta registros con la forma del simulador, descarta duplicados y no ejecuta fórmulas, pero alguien con conocimientos técnicos podría enviar registros falsos. Si notás registros raros, podés borrarlos de la planilla o generar una implementación nueva y actualizar `config.js`.
