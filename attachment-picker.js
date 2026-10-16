(()=>{
 'use strict';
 // Keep the native FileList authoritative for validation and the upload body.
 window.RexAttachmentPicker=function(input){
  const list=document.createElement('div');
  list.className='attachment-selection';
  list.setAttribute('aria-label','Selected attachments');
  input.after(list);
  function render(){
   list.replaceChildren();
   const files=Array.from(input.files||[]);
   if(!files.length)return;
   const count=document.createElement('p');
   count.className='attachment-count';
   count.textContent=files.length+' file'+(files.length===1?'':'s')+' selected';
   list.append(count);
   files.forEach((file,index)=>{
    const row=document.createElement('div');row.className='attachment-row';
    const name=document.createElement('span');
    name.textContent=file.name;name.title=file.name;
    const remove=document.createElement('button');
    remove.type='button';remove.className='attachment-remove';
    remove.textContent='Remove';
    remove.setAttribute('aria-label','Remove '+file.name);
    remove.addEventListener('click',event=>{
     event.preventDefault();event.stopPropagation();
     if(input.disabled)return;
     const remaining=Array.from(input.files||[]).filter((_,i)=>i!==index);
     const transfer=new DataTransfer();
     remaining.forEach(item=>transfer.items.add(item));
     input.files=transfer.files;
     input.dispatchEvent(new Event('change',{bubbles:true}));
     const next=list.querySelectorAll('.attachment-remove');
     if(next.length)next[Math.min(index,next.length-1)].focus();else input.focus();
    });
    row.append(name,remove);list.append(row);
   });
  }
  input.addEventListener('change',render);
  render();
 };
})();
