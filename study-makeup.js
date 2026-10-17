(()=>{
'use strict';
const key='rex-study-makeup-v1';
const today=()=>new Intl.DateTimeFormat('en-CA',{timeZone:'Australia/Sydney',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());
function read(){const data=JSON.parse(localStorage.getItem(key)||'[]');if(!Array.isArray(data))throw Error('Could not read backfill records. Please back up your local data first.');return data;}
function save({date,module,type,count}){
 const valid=typeof date==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(date)&&!isNaN(Date.parse(date+'T12:00:00Z'))&&new Date(date+'T12:00:00Z').toISOString().slice(0,10)===date;
 if(!valid||date>=today())throw Error('Choose a valid date before today.');
 if(!['speaking','writing','reading','listening'].includes(module))throw Error('Choose a practice category.');
 type=typeof type==='string'?type.trim().toUpperCase():'';
 if(!type||type.length>40)throw Error('Enter an activity name of up to 40 characters.');
 if(!Number.isSafeInteger(count)||count<1||count>9999)throw Error('Count must be a whole number from 1 to 9999.');
 const rows=read(),id=JSON.stringify([date,module,type]),record={id,date,module,type,count};
 const index=rows.findIndex(r=>r.id===id);if(index<0)rows.push(record);else rows[index]=record;
 localStorage.setItem(key,JSON.stringify(rows));dispatchEvent(new Event('rex-local-changed'));dispatchEvent(new CustomEvent('rex-backfill-saved',{detail:{date}}));return record;
}
window.RexStudyMakeup={save,read,today};
})();
