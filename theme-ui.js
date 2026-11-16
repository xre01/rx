/* Device-local appearance; does not alter or sync study records. */
(()=>{'use strict';const key='rex-ui-theme-v1',names={"default":"Sage Green","newyear":"Lunar New Year","halloween":"Halloween","christmas":"Christmas","winter":"Winter","pokemon":"Pokémon"},colors={"default":"#E8F0E8","newyear":"#fff1df","halloween":"#f1eaf5","christmas":"#e6eee9","winter":"#e9f2fa","pokemon":"#fff5cf"},root=document.documentElement;
function apply(value){const theme=Object.prototype.hasOwnProperty.call(names,value)?value:'default';if(theme==='default')root.removeAttribute('data-ui-theme');else root.dataset.uiTheme=theme;root.style.colorScheme='light';document.querySelector('meta[name="theme-color"]')?.setAttribute('content',colors[theme]);renderChoice(theme);return theme}
let renderChoice=()=>{};
try{const stored=localStorage.getItem(key);if(stored!==null&&!Object.prototype.hasOwnProperty.call(names,stored))localStorage.removeItem(key);apply(stored)}catch{apply('default')}
function init(){
  const current=apply(root.dataset.uiTheme);
  const host=document.querySelector('#profilePopover .profile-settings');
  if(!host||host.querySelector('.theme-settings'))return;
  const section=document.createElement('div');
  section.className='theme-settings';
  const label=document.createElement('span');
  label.id='profileThemeLabel';
  label.textContent='Theme';
  const trigger=document.createElement('button');
  trigger.type='button';
  trigger.id='profileTheme';
  trigger.setAttribute('aria-labelledby','profileThemeLabel profileThemeName');
  trigger.setAttribute('aria-controls','profileThemeList');
  trigger.setAttribute('aria-expanded','false');
  const sample=document.createElement('i');
  sample.setAttribute('aria-hidden','true');
  const name=document.createElement('span');
  name.id='profileThemeName';
  trigger.append(sample,name);
  const list=document.createElement('div');
  list.id='profileThemeList';
  list.hidden=true;
  list.setAttribute('role','group');
  list.setAttribute('aria-labelledby',label.id);
  const status=document.createElement('p');
  status.setAttribute('role','status');
  function closeList(){
    list.hidden=true;
    trigger.setAttribute('aria-expanded','false');
  }
  trigger.addEventListener('click',()=>{
    if(!list.hidden){closeList();return}
    list.hidden=false;
    trigger.setAttribute('aria-expanded','true');
    list.querySelector('[aria-pressed="true"]').focus();
  });
  for(const [id,text] of Object.entries(names)){
    const option=document.createElement('button');
    option.type='button';
    option.dataset.themeChoice=id;
    const dot=document.createElement('i');
    dot.className='theme-dot theme-swatch-'+id;
    dot.setAttribute('aria-hidden','true');
    option.append(dot,text);
    option.addEventListener('click',()=>{
      try{
        localStorage.setItem(key,id);
        apply(id);
        status.textContent='';
        closeList();
        trigger.focus();
      }catch{status.textContent='Could not save theme. Please retry.'}
    });
    list.append(option);
  }
  section.addEventListener('keydown',event=>{
    if(list.hidden)return;
    if(event.key==='Escape'){
      event.preventDefault();event.stopPropagation();closeList();trigger.focus();return;
    }
    const buttons=Array.from(list.children);
    const index=buttons.indexOf(event.target);
    if(index<0)return;
    const targets={ArrowDown:(index+1)%buttons.length,ArrowUp:(index+buttons.length-1)%buttons.length,Home:0,End:buttons.length-1};
    if(Object.hasOwn(targets,event.key)){event.preventDefault();buttons[targets[event.key]].focus()}
  });
  const panel=host.closest('#profilePopover');
  new MutationObserver(()=>{if(panel.hidden)closeList()}).observe(panel,{attributes:true,attributeFilter:['hidden']});
  document.addEventListener('click',event=>{if(!section.contains(event.target))closeList()});
  renderChoice=id=>{
    sample.className='theme-dot theme-swatch-'+id;
    name.textContent=names[id];
    for(const button of list.children)button.setAttribute('aria-pressed',String(button.dataset.themeChoice===id));
  };
  renderChoice(current);
  section.append(label,trigger,list,status);
  host.append(section);
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();addEventListener('storage',event=>{if(event.key===null){apply('default');return}if(event.key!==key)return;if(event.newValue!==null&&!Object.prototype.hasOwnProperty.call(names,event.newValue)){try{localStorage.removeItem(key)}catch{}apply('default')}else apply(event.newValue)});
})();
