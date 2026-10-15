(()=>{
'use strict';
const input=document.getElementById('arcanePassword'),gateway=document.getElementById('gateway');if(!input||!gateway)return;
const key='arcane-remembered-password-v1',preference='arcane-remember-password-enabled';
const label=document.createElement('label');label.className='archive-remember';const checkbox=document.createElement('input');checkbox.type='checkbox';checkbox.id='rememberArcanePassword';label.append(checkbox,document.createTextNode('Remember access key (this device only)'));input.after(label);
function origin(){try{const url=new URL(gateway.value.trim());return url.protocol==='https:'&&!url.username&&!url.password?url.origin:null}catch{return null}}
function stored(){try{return JSON.parse(localStorage.getItem(key)||'null')}catch{return null}}
try{checkbox.checked=localStorage.getItem(preference)!=='false';const saved=stored();if(checkbox.checked&&saved?.origin===origin()&&typeof saved.value==='string'){input.value=saved.value;sessionStorage.setItem('arcane-session-password',saved.value)}}catch{}
function save(){try{localStorage.setItem(preference,String(checkbox.checked));if(!checkbox.checked){localStorage.removeItem(key);return}const address=origin();if(address&&input.value)localStorage.setItem(key,JSON.stringify({origin:address,value:input.value}));else localStorage.removeItem(key)}catch{document.getElementById('archiveMessage').textContent='This browser cannot remember the key. It remains available for this session.'}}
input.addEventListener('change',save);checkbox.addEventListener('change',save);document.getElementById('loadArchive').addEventListener('click',save);
gateway.addEventListener('change',()=>{const saved=stored();if(saved&&saved.origin!==origin()){input.value='';sessionStorage.removeItem('arcane-session-password')}if(saved?.origin===origin()&&checkbox.checked)input.value=saved.value});
document.getElementById('clearArchive').addEventListener('click',()=>{localStorage.removeItem(key);sessionStorage.removeItem('arcane-session-password')});
})();




