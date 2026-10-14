import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join, resolve } from 'node:path';
import assert from 'node:assert/strict';

const here = dirname(fileURLToPath(import.meta.url));
const pagesDir = join(here, 'pantallas');
const files = readdirSync(pagesDir).filter(name => name.endsWith('.html'));
assert.equal(files.length, 28, 'Deben existir las 28 pantallas.');

const read = name => readFileSync(join(pagesDir, `${name}.html`), 'utf8');
for (const file of files) {
  const content = readFileSync(join(pagesDir, file), 'utf8');
  assert.equal((content.match(/class="artboard"/g) || []).length, 1, `${file}: una sola vista`);
  assert.match(content, /<style>[\s\S]+<\/style>/, `${file}: estilos incluidos`);
  assert.doesNotMatch(content, /<script\b|<iframe\b/i, `${file}: no debe depender de JS o iframes`);
  for (const [, target] of content.matchAll(/href="([^"]+)"/g)) {
    if (/^(https?:|mailto:|tel:|#)/.test(target)) continue;
    assert.ok(existsSync(resolve(pagesDir, target)), `${file}: enlace roto ${target}`);
  }
}

const index = readFileSync(join(here, 'index.html'), 'utf8');
for (const file of files) assert.ok(index.includes(`pantallas/${file}`), `Falta ${file} en el índice`);
for (const [from, to] of [
  ['inicio','registro'], ['registro-clinica','alta-clinica'],
  ['alta-clinica','revision-clinica'], ['admin','admin-revision'],
  ['admin-revision','mapa-publicado'], ['admin-alta','admin-editar'],
  ['acceso-admin','admin'], ['perfil','editar-perfil']
]) assert.ok(read(from).includes(`href="${to}.html"`), `Falta enlace ${from} → ${to}`);

assert.ok(existsSync(join(here, '..', 'index.html')), 'Falta entrada de GitHub Pages');
console.log('Correcto: 28 archivos autónomos, índice, enlaces relativos y recorridos principales.');
