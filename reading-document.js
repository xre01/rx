(function(root){'use strict';
const nodes=new Set('doc paragraph text heading bulletList orderedList listItem blockquote codeBlock hardBreak horizontalRule table tableRow tableCell tableHeader taskList taskItem details detailsSummary detailsContent'.split(' '));
const marks=new Set('bold italic underline strike code link textStyle highlight'.split(' '));
const color=v=>typeof v==='string'&&(/^(#[\da-f]{3,8}|rgba?\([\d.,%\s]+\)|[a-z]{1,20})$/i.test(v))&&!/^(inherit|initial|unset)$/i.test(v);
function validate(input){if(input?.version!==1||input.doc?.type!=='doc')throw Error('Unsupported editor document. Original retained.');let count=0,chars=0;
 function walk(n,depth=0,mark=false){if(!n||depth>16||++count>10000||!(mark?marks:nodes).has(n.type))throw Error('Unsupported or oversized editor content. Original retained.');const out={type:n.type};if(n.text!==undefined){if(n.type!=='text'||typeof n.text!=='string')throw Error('Invalid text');chars+=n.text.length;out.text=n.text;}
 if(n.attrs){const attrs={};for(const [k,v]of Object.entries(n.attrs)){if(v===null)continue;
 if(['color','backgroundColor'].includes(k)){if(!color(v))throw Error('Invalid color');attrs[k]=v;}
 else if(k==='href'){if(typeof v!=='string'||!/^https?:\/\//i.test(v)||/[\u0000-\u0020]/.test(v))throw Error('Unsafe link');attrs[k]=v;}
 else if(['target','rel','class'].includes(k)){if(k==='target')attrs.target='_blank';if(k==='rel')attrs.rel='noopener noreferrer';}
 else if(['level','colspan','rowspan','start'].includes(k)){if(!Number.isInteger(v)||v<1||v>(k==='level'?3:1000))throw Error('Invalid structure');attrs[k]=v;}
 else if(k==='colwidth'){if(!Array.isArray(v)||v.length>100||v.some(x=>!Number.isInteger(x)||x<1||x>10000))throw Error('Invalid width');attrs[k]=v;}
 else if(['checked','open'].includes(k)){if(typeof v!=='boolean')throw Error('Invalid state');attrs[k]=v;}
 else if(k==='language'){if(typeof v!=='string'||v.length>100)throw Error('Invalid language');attrs[k]=v;}
 else throw Error('Unsupported editor attribute: '+k);
 }if(Object.keys(attrs).length)out.attrs=attrs;}
 if(n.content){if(!Array.isArray(n.content))throw Error('Invalid document');out.content=n.content.map(c=>walk(c,depth+1));}if(n.marks){if(!Array.isArray(n.marks)||n.marks.length>10)throw Error('Invalid formatting');out.marks=n.marks.map(m=>walk(m,depth+1,true));}return out;}
 const doc=walk(input.doc);if(chars>50000)throw Error('Note text is too long');return {version:1,doc};}
root.RexReadingDocument={validate};if(typeof module!=='undefined')module.exports=root.RexReadingDocument;
})(globalThis);
