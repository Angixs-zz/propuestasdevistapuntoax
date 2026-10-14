// Construye archivos autónomos a partir de las pantallas de PuntOax_Figma.html.
// Ejecutar desde cualquier directorio: node figma/generar.mjs
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const source = readFileSync(join(here, '..', 'PuntOax_Figma.html'), 'utf8');
const css = source.match(/<style>([\s\S]*?)<\/style>/)?.[1];
const views = [...source.matchAll(/<div id="([^"]+)" class="label"><span>(\d+)<\/span>([^<]+)<\/div>\s*(<section class="artboard">[\s\S]*?<\/section>)/g)]
  .map(([, id, number, title, content]) => ({ id, number, title, content }));
if (!css || views.length !== 28 || new Set(views.map(view => view.id)).size !== 28) {
  throw new Error('Se esperaban exactamente 28 pantallas con identificadores únicos y estilos integrados.');
}

const output = join(here, 'pantallas');
mkdirSync(output, { recursive: true });
const ids = new Set(views.map(view => view.id));
const pathTo = id => {
  if (!ids.has(id)) throw new Error(`Pantalla de destino inexistente: ${id}`);
  return `${id}.html`;
};
const escapeHTML = value => value.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;');
const normalize = label => label.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-zA-Z0-9 ]/g, '').trim().toLowerCase().replace(/\s+/g, ' ');
const clinic = id => ['clinica','registro-clinica','acceso-clinica','alta-clinica','revision-clinica','editar-clinica','solicitudes-clinica','editar-cuenta-clinica'].includes(id);
const admin = id => id === 'admin' || id.startsWith('admin-') || id === 'acceso-admin' || id === 'editar-cuenta-admin';
const pageForMenu = (id, text) => {
  const label = normalize(text);
  const basic = { inicio:'inicio', conocenos:'conocenos', orientacion:'orientacion', 'explorar mapa':'mapa', 'mis citas':'citas', 'panel de clinica':'clinica', 'mi centro':id==='alta-clinica'?'alta-clinica':id==='revision-clinica'?'revision-clinica':'editar-clinica', solicitudes:admin(id)?'admin-revision':'solicitudes-clinica', 'citas y horarios':'solicitudes-clinica', 'resumen':admin(id)?'admin':'clinica', 'agregar clinica':'admin-alta', 'centros publicados':'admin-editar', 'solicitudes de alta':'admin-revision', directorio:'admin-editar', administracion:'admin', configuracion:admin(id)?'editar-cuenta-admin':'editar-cuenta-clinica', 'mi cuenta':admin(id)?'editar-cuenta-admin':clinic(id)?'editar-cuenta-clinica':'perfil' };
  return basic[label] || null;
};
const action = (id, text) => {
  const label = normalize(text);
  const simple = {
    'iniciar sesion':id==='acceso-clinica'?'clinica':id==='acceso-admin'?'admin':id==='acceso'?'mapa':clinic(id)?'acceso-clinica':admin(id)?'acceso-admin':'acceso',
    'crear cuenta':id==='registro-clinica'?'alta-clinica':id==='registro'?'mapa':clinic(id)?'registro-clinica':'registro',
    'soy usuario':id.includes('registro')?'registro':'acceso',
    'soy clinica':id.includes('registro')?'registro-clinica':'acceso-clinica',
    'conoce el proyecto':'conocenos', 'explorar centros':id==='inicio'?'registro':'mapa',
    'volver al mapa':'mapa', 'volver a la ficha':'ficha', 'volver a mis datos':'datos',
    'ver mis citas':'citas', 'ver detalles':'confirmacion',
    'elegir fecha y hora':'calendario', 'confirmar cita':'confirmacion',
    'ficha completa':id==='mapa'?'ficha':'mapa-publicado',
    'agendar cita':'datos', 'crear cuenta clinica':'alta-clinica',
    'entrar al panel':admin(id)?'admin':'clinica', 'enviar para revision':'revision-clinica',
    'ver datos enviados':'alta-clinica', 'ir al panel':'revision-clinica',
    'ver citas':'solicitudes-clinica', 'ver solicitud':'solicitudes-clinica',
    'editar informacion':'editar-clinica', 'enviar cambios':'editar-clinica',
    'agregar clinica':'admin-alta', 'revisar':'admin-revision',
    'ver todas las solicitudes':'admin-revision', 'administrar directorio':'admin-editar',
    'aprobar y publicar':'mapa-publicado', 'guardar y publicar':'admin-editar',
    'editar perfil':'editar-perfil',
    'cerrar sesion':'inicio', 'salir':'inicio',
    'cancelar':id==='editar-perfil'?'perfil':admin(id)?'admin':'clinica',
    'registrate':'registro', 'crea una cuenta':'registro'
  };
  if (simple[label]) return simple[label];
  if (label === 'inicia sesion') return id === 'registro-clinica'?'acceso-clinica':'acceso';
  if (label === 'entrar al panel de administracion') return 'admin';
  if (label === 'guardar cambios') return admin(id)?'admin':clinic(id)?'clinica':'perfil';
  if (label === 'ver en mapa' || label === 'limpiar') return id === 'mapa-publicado'?'mapa-publicado':'mapa';
  if (label === 'ver ficha') return 'ficha';
  if (label === 'editar clinica') return 'admin-editar';
  if (label === 'ver datos del centro') return 'alta-clinica';
  return null;
};
const link = (tag, attrs, text, to) => to ? `<a href="${pathTo(to)}"${attrs}>${text}</a>` : `<${tag}${attrs}>${text}</${tag}>`;

function navigate(view) {
  let html = view.content;
  // El perfil base también conduce a su pantalla de edición.
  if (view.id === 'perfil') html = html.replace('<span class="btn alt">Cerrar sesión</span>', '<span class="btn">Editar perfil</span> &nbsp; <span class="btn alt">Cerrar sesión</span>');
  html = html.replace('<div class="brand">', '<a class="brand" href="../index.html">').replace('</b></div><nav class="nav">', '</b></a><nav class="nav">');
  html = html.replace(/<nav class="nav">([\s\S]*?)<\/nav>/, (_, content) => `<nav class="nav">${content.replace(/<b( class="[^"]*")?>([^<]+)<\/b>/g, (item, cls='', text) => link('b',cls,text,pageForMenu(view.id,text)))}</nav>`);
  html = html.replace(/<div class="nav-buttons">([\s\S]*?)<\/div>/, (_, content) => `<div class="nav-buttons">${content.replace(/<span( class="btn[^"]*")>([^<]+)<\/span>/g, (item,cls,text) => link('span',cls,text, normalize(text)==='crear cuenta'?clinic(view.id)?'registro-clinica':'registro':normalize(text)==='iniciar sesion'?clinic(view.id)?'acceso-clinica':'acceso':action(view.id,text)))}</div>`);
  html = html.replace(/<aside class="aside-nav">([\s\S]*?)<\/aside>/g, (_, content) => `<aside class="aside-nav">${content.replace(/<p( class="[^"]*")?>([^<]+)<\/p>/g, (item,cls='',text) => link('p',cls,text,pageForMenu(view.id,text)))}</aside>`);
  html = html.replace(/<div class="side-menu">([^<]+)<\/div>/g, (item,text) => link('div',' class="side-menu"',text,pageForMenu(view.id,text)));
  html = html.replace(/<div class="seg">([\s\S]*?)<\/div>/g, (_, content) => `<div class="seg">${content.replace(/<span( class="[^"]*")?>([^<]+)<\/span>/g, (item,cls='',text) => link('span',cls,text,action(view.id,text)))}</div>`);
  html = html.replace(/<span( class="btn[^"]*"(?: style="[^"]*")?)>([^<]+)<\/span>/g, (item,cls,text) => link('span',cls,text, action(view.id,text) || pageForMenu(view.id,text)));
  return html;
}

const extraCSS = `\n/* Cada archivo contiene una sola pantalla lista para importarse en Figma. */
body{background:var(--bg)}.artboard{box-shadow:none;border:0;min-height:100vh;width:1200px;max-width:100%;margin:0 auto}
a.btn{cursor:pointer;text-decoration:none}a.brand{color:var(--ink)}.nav a{color:inherit}.nav a.on{color:var(--green)}.nav a:hover,.aside-nav a:hover{text-decoration:underline}.aside-nav a{display:block;color:#d3e4dc;padding:10px 12px;border-radius:9px;font-size:13px}.aside-nav a.active{background:#ffffff2b;color:#fff;font-weight:800}.side-menu{display:block;color:#d3e4dc}.seg a{flex:1;text-align:center;padding:10px;font-weight:700;font-size:12px}.seg a.selected{background:#fff;color:var(--green);border-radius:8px;box-shadow:0 2px 9px #143c3919}\n`;

for (const view of views) {
  const page = `<!doctype html>\n<html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${escapeHTML(view.title)} · PuntOax</title><style>${css}${extraCSS}</style></head><body>${navigate(view)}</body></html>\n`;
  writeFileSync(join(output, pathTo(view.id)), page);
}

const groups = [
  { title:'Personas', ids:['inicio','conocenos','orientacion','registro','acceso','mapa','ficha','datos','calendario','confirmacion','citas','perfil','editar-perfil'] },
  { title:'Clínicas', ids:['registro-clinica','acceso-clinica','alta-clinica','revision-clinica','clinica','editar-clinica','solicitudes-clinica','editar-cuenta-clinica','mapa-publicado'] },
  { title:'Administración', ids:['acceso-admin','admin','admin-revision','admin-alta','admin-editar','editar-cuenta-admin'] }
];
const byId = Object.fromEntries(views.map(view => [view.id, view]));
const cards = groups.map(group => `<section><h2>${group.title}</h2><div class="cards">${group.ids.map(id => { const view = byId[id]; return `<a class="card" href="pantallas/${pathTo(id)}"><span class="num">${view.number}</span><strong>${escapeHTML(view.title)}</strong><span class="arrow">Ver pantalla ↗</span></a>`; }).join('')}</div></section>`).join('');
writeFileSync(join(here, 'index.html'), `<!doctype html><html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>PuntOax · Interfaces</title><style>${css}\nbody{background:#f3f8f4}.site{max-width:1160px;margin:auto;padding:55px 25px 100px}h1{font-size:44px}.intro{max-width:710px;color:var(--muted);margin:14px 0 36px}h2{margin:35px 0 14px}.cards{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:14px}.card{background:white;border:1px solid var(--line);border-radius:16px;min-height:118px;padding:18px;display:flex;flex-direction:column;gap:8px;color:var(--ink);text-decoration:none}.card:hover{border-color:var(--green);box-shadow:0 12px 25px #153f3217}.num{font-size:12px;color:var(--green);font-weight:800}.arrow{margin-top:auto;font-size:12px;color:var(--muted)}.flow{padding:18px;border-radius:14px;background:var(--mint);color:var(--ink);line-height:1.8}@media(max-width:950px){.cards{grid-template-columns:repeat(2,minmax(0,1fr))}}@media(max-width:520px){.cards{grid-template-columns:1fr}.site{padding:28px 16px}h1{font-size:31px}}</style></head><body><main class="site"><span class="kicker">PuntOax · Interfaces</span><h1>Recorre la experiencia</h1><p class="intro">Explora las pantallas de personas, clínicas y administración. Cada vista tiene su propio archivo HTML para trabajarla en Figma.</p><p class="flow"><b>Clínica:</b> registro → ficha del centro → revisión administrativa → publicación en el mapa.<br><b>Administración:</b> revisar alta y aprobar, o agregar una clínica directamente.</p>${cards}</main></body></html>\n`);
console.log(`Generadas ${views.length} pantallas autónomas y figma/index.html`);
