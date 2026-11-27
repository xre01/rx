'use strict';
const fs = require('node:fs');
const css = require('css-tree');

// Serialize the parsed stylesheet without reordering rules, declarations or layers.
// In particular, keep every !important and all custom-property token values.
const source = ['styles/app.css', 'styles/my-day.css'].map(file => fs.readFileSync(file, 'utf8')).join('\n');
const errors = [];
const ast = css.parse(source, { onParseError: error => errors.push(error.message) });
if (errors.length) throw Error(errors.join('\n'));
fs.writeFileSync('app-fix-20261112.css', css.generate(ast) + '\n');
