const esbuild=require('esbuild');esbuild.buildSync({entryPoints:['calendar-labels-source.js'],bundle:true,minify:true,format:'iife',target:'es2018',outfile:'calendar-labels.js',legalComments:'eof'});
