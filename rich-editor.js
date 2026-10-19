(()=>{'use strict';
const allowed=new Set('P DIV BR STRONG B EM I U S STRIKE SPAN FONT UL OL LI BLOCKQUOTE H1 H2 H3 DETAILS SUMMARY PRE CODE HR TABLE TBODY TR TD TH INPUT A'.split(' '));
function clean(html){const doc=new DOMParser().parseFromString(html,'text/html');function visit(parent){for(const n of [...parent.children]){if(!allowed.has(n.tagName)){n.replaceWith(doc.createTextNode(n.textContent));continue;}for(const a of [...n.attributes]){if(a.name==='style'){const color=n.style.color,bg=n.style.backgroundColor;n.removeAttribute('style');if(color)n.style.color=color;if(bg)n.style.backgroundColor=bg;}else if(a.name==='href'&&n.tagName==='A'){if(!/^https?:\/\//i.test(a.value))n.removeAttribute(a.name);}else if(!['color','face','open','type','checked'].includes(a.name))n.removeAttribute(a.name);}if(n.tagName==='INPUT'){n.type='checkbox';}visit(n);}}visit(doc.body);return doc.body.innerHTML;}
function attach(textarea,html){textarea.required=false;textarea.hidden=true;const wrap=document.createElement('div');wrap.className='rich-editor-wrap';const tools=document.createElement('div');tools.className='rich-editor-tools';tools.setAttribute('role','toolbar');tools.setAttribute('aria-label','Note formatting');const editor=document.createElement('div');editor.className='rich-note-editor';editor.contentEditable='true';editor.setAttribute('role','textbox');editor.setAttribute('aria-label','Rich note');editor.setAttribute('aria-multiline','true');if(html)editor.innerHTML=Array.isArray(html)?RexRichCodec.render(html):clean(html);else editor.textContent=textarea.value;let selection,toolScroll;
function scrollPositions(){const positions=[];for(let n=editor;n;n=n.parentElement)positions.push([n,n.scrollTop,n.scrollLeft]);const root=document.scrollingElement;if(root&&!positions.some(x=>x[0]===root))positions.push([root,root.scrollTop,root.scrollLeft]);return positions;}
function keepScroll(positions){for(const [node,top,left]of positions){node.scrollTop=top;node.scrollLeft=left;}}
tools.addEventListener('pointerdown',()=>{remember();toolScroll=scrollPositions();});
let quoteButton,status;
function currentBlock(){const s=getSelection();let n=s.anchorNode;if(n&&n.nodeType===3)n=n.parentElement;return n&&editor.contains(n)?n.closest('blockquote'):null;}
function updateState(){if(!quoteButton)return;const active=!!currentBlock();quoteButton.setAttribute('aria-pressed',String(active));quoteButton.title=active?'Exit quote · click to return to text':'Quote · click to enter';if(status)status.textContent=active?'Quote mode · click Quote again to return to text':'';}
function remember(){toolScroll=null;const s=getSelection();if(s.rangeCount&&editor.contains(s.anchorNode))selection=s.getRangeAt(0).cloneRange();updateState();}

function restore(){editor.focus({preventScroll:true});if(selection&&editor.contains(selection.commonAncestorContainer)){const s=getSelection();s.removeAllRanges();s.addRange(selection);}}
function sync(){editor.querySelectorAll('input[type=checkbox]').forEach(x=>x.checked?x.setAttribute('checked',''):x.removeAttribute('checked'));textarea.value=editor.innerText;}
function command(cmd,value){const positions=toolScroll||scrollPositions();restore();document.execCommand(cmd,false,value);changed();remember();keepScroll(positions);requestAnimationFrame(()=>keepScroll(positions));toolScroll=null;}
function button(label,title,action){const b=document.createElement('button');b.type='button';b.textContent=label;b.title=title;b.setAttribute('aria-label',title);b.addEventListener('mousedown',e=>e.preventDefault());b.addEventListener('click',action);tools.append(b);return b;}
button('B','Bold',()=>command('bold'));button('I','Italic',()=>command('italic'));button('U','Underline',()=>command('underline'));button('S̶','Strikethrough',()=>command('strikeThrough'));
function choose(label,values,action){const s=document.createElement('select');s.setAttribute('aria-label',label);for(const [v,t]of values){const o=document.createElement('option');o.value=v;o.textContent=t;s.append(o);}s.addEventListener('change',()=>{action(s.value);s.selectedIndex=0});tools.append(s);}
choose('Text color',[['','Text color'],['#243b32','Default'],['#a43e48','Red'],['#39775c','Green'],['#346aa0','Blue'],['#8459a3','Purple'],['#ab7722','Gold']],v=>{if(v){command('hiliteColor','transparent');command('foreColor',v);}});
choose('Highlight',[['','Highlight'],['#fff0a6','Yellow'],['#cfeedd','Mint'],['#d8e9ff','Blue'],['#f9dce8','Pink'],['transparent','None']],v=>{if(v){if(v!=='transparent')command('foreColor','#243b32');command('hiliteColor',v);}});
choose('Paragraph style',[['','Paragraph'],['p','Text'],['h1','Heading 1'],['h2','Heading 2'],['h3','Heading 3'],['blockquote','Quote'],['pre','Code block']],v=>v&&command('formatBlock',v));
button('• List','Bullet list',()=>command('insertUnorderedList'));button('1. List','Numbered list',()=>command('insertOrderedList'));
button('☑','To-do',()=>command('insertHTML','<div><input type="checkbox"> To-do item</div><p><br></p>'));
quoteButton=button('❯ Quote','Quote',()=>{restore();command('formatBlock',currentBlock()?'p':'blockquote');updateState();});quoteButton.setAttribute('aria-pressed','false');
 status=document.createElement('div');status.className='rich-format-status';status.setAttribute('role','status');

button('▸','Toggle',()=>command('insertHTML','<details open><summary>Toggle title</summary><p>Write details here…</p></details><p><br></p>'));
button('◇','Callout',()=>command('insertHTML','<blockquote style="background-color:#e5efe7">💡 Write a key idea…</blockquote><p><br></p>'));
button('—','Divider',()=>command('insertHTML','<hr><p><br></p>'));
button('▦','Table',()=>command('insertHTML','<table><tbody><tr><th>Topic</th><th>Notes</th></tr><tr><td>…</td><td>…</td></tr></tbody></table><p><br></p>'));
button('‹/›','Inline code',()=>{restore();const s=getSelection(),text=s.toString()||'code';const code=document.createElement('code');code.textContent=text;command('insertHTML',code.outerHTML)});
button('↶','Undo',()=>command('undo'));button('↷','Redo',()=>command('redo'));button('Tx','Clear formatting',()=>command('removeFormat'));
editor.addEventListener('keyup',remember);editor.addEventListener('click',remember);editor.addEventListener('mouseup',remember);function changed(){sync();textarea.dispatchEvent(new Event('input',{bubbles:true}));}editor.addEventListener('input',changed);editor.addEventListener('change',changed);editor.addEventListener('paste',e=>{e.preventDefault();const text=e.clipboardData.getData('text/plain');document.execCommand('insertText',false,text);changed();});textarea.after(wrap);wrap.append(tools,status,editor);
 const source=textarea.closest('form')?.querySelector('.reading-source-area');
 if(source){
  const sourceButtons=source.querySelector('.reading-source-buttons');
  if(sourceButtons){sourceButtons.classList.add('rich-source-tools');tools.prepend(sourceButtons);}
  source.querySelector('legend')?.remove();source.classList.add('rich-editor-sources');
  source.querySelectorAll('.reading-source-help').forEach(n=>n.remove());
  const hint=source.querySelector('p.sub');if(hint){hint.classList.add('rich-source-instructions');hint.hidden=true;new MutationObserver(()=>{hint.hidden=/Up to 10 attachments/.test(hint.textContent);hint.classList.toggle('rich-source-instructions',hint.hidden)}).observe(hint,{childList:true,subtree:true,characterData:true});}
  wrap.insertBefore(source,editor);
 }
 sync();const api={html:()=>{sync();return RexRichCodec.parse(clean(editor.innerHTML));},set:(text,doc)=>{editor.innerHTML=doc?RexRichCodec.render(doc):'';if(!doc)editor.textContent=text||'';sync();},editor};Object.defineProperty(textarea,'rexRichDocument',{get:()=>api.html(),configurable:true});function locked(){const disabled=textarea.disabled||textarea.readOnly;editor.contentEditable=String(!disabled);tools.querySelectorAll('button,select').forEach(b=>b.disabled=disabled);}new MutationObserver(locked).observe(textarea,{attributes:true,attributeFilter:['disabled','readonly']});locked();textarea.closest('form')?.addEventListener('submit',event=>{try{api.html();if(textarea.maxLength>0&&textarea.value.length>textarea.maxLength)throw Error('Keep this note within '+textarea.maxLength+' characters.');if(textarea.required&&!textarea.value.trim())throw Error('Add note content first.');}catch(error){event.preventDefault();event.stopImmediatePropagation();status.textContent=error.message;editor.focus();}},true);return api;}
function content(text,html){const node=document.createElement('div');node.className='rich-note-content';if(html)node.innerHTML=Array.isArray(html)?RexRichCodec.render(html):clean(html);else node.textContent=text||'';node.querySelectorAll('input').forEach(x=>x.disabled=true);return node;}
window.RexRichEditor={attach,content,clean};})();

