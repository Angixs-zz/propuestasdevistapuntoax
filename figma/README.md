# PuntOax para Figma y GitHub Pages

## Importar en Figma con html.to.design

1. Ejecuta `node figma/generar.mjs` después de modificar `PuntOax_Figma.html`.
2. Abre Figma → Plugins → **html.to.design** → **File**.
3. Entra en `figma/pantallas/` y selecciona el HTML de la pantalla que quieras importar, por ejemplo `inicio.html`, `registro-clinica.html` o `admin-revision.html`.
4. Repite el proceso para cada pantalla que necesites en el archivo de Figma. Cada HTML contiene **una sola vista** y sus estilos CSS incorporados; el mapa está dibujado en SVG dentro de la página.

`PuntOax_Figma.html` es la lámina completa; importarla directamente suele producir una página larga con todas las vistas seguidas. `PuntOax_UI_v3.html` es el prototipo interactivo anterior, no el conjunto de pantallas individuales.

## Vista navegable en GitHub Pages

El `index.html` de la raíz abre `figma/index.html`, que enlaza las 28 pantallas. Dentro de cada pantalla, los enlaces principales permiten recorrer los caminos de usuario, clínica y administración.

Para verlo antes de subirlo: desde la raíz del proyecto ejecuta `python3 -m http.server 8000` y abre `http://localhost:8000/`. Puedes cerrar el servidor con `Ctrl+C`.

Para publicar **este repositorio** en GitHub Pages: sube `index.html`, `figma/index.html` y los 28 archivos de `figma/pantallas/` a la rama que uses para Pages. En GitHub → **Settings → Pages**, selecciona **Deploy from a branch**, esa rama y la carpeta **/(root)**. Para este repositorio, la dirección esperada será `https://angixs-zz.github.io/propuestasdevistapuntoax/` una vez publicado.

Si prefieres alojarlo dentro de otro sitio ya publicado, copia **toda la carpeta `figma/`** a una carpeta pública del sitio; abre `.../figma/index.html`. Los enlaces usan rutas relativas y funcionan también bajo un subdirectorio.

Esta publicación es una navegación de interfaces HTML; las acciones de alta, aprobación y citas son recorridos visuales y no guardan información en un servidor.

Después de regenerar los archivos, ejecuta `node figma/verificar.mjs` para comprobar las pantallas y sus enlaces.
