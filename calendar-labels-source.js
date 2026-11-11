/* Calendar annotations only; no tasks or countdown records are created. */
const { Solar } = require('lunar-javascript');
const cache=new Map();
function easter(year){const a=year%19,b=Math.floor(year/100),c=year%100,d=Math.floor(b/4),e=b%4,f=Math.floor((b+8)/25),g=Math.floor((b-f+1)/3),h=(19*a+b-d-g+15)%30,i=Math.floor(c/4),k=c%4,l=(32+2*e+2*i-h-k)%7,m=Math.floor((a+11*h+22*l)/451),n=h+l-7*m+114;return new Date(Date.UTC(year,Math.floor(n/31)-1,n%31+1)).toISOString().slice(0,10)}
function get(date){if(cache.has(date))return cache.get(date);const empty={lunar:'',primary:'',holidays:[],term:'',details:''};if(!/^\d{4}-\d{2}-\d{2}$/.test(date))return empty;const [year,month,day]=date.split('-').map(Number);if(year<1900||year>2100||isNaN(Date.parse(date+'T12:00:00Z'))||new Date(date+'T12:00:00Z').toISOString().slice(0,10)!==date)return empty;
 const solar=Solar.fromYmd(year,month,day),l=solar.getLunar(),term=l.getJieQi(),lunar=l.getDay()===1?l.getMonthInChinese()+'月':l.getDayInChinese(),holidays=[];
 const fixed={'01-01':'元旦','01-26':'澳洲国庆','05-01':'劳动节','10-01':'国庆节','12-25':'圣诞节','12-26':'节礼日'};if(fixed[date.slice(5)])holidays.push(fixed[date.slice(5)]);
 const traditional={'1-1':'春节','1-15':'元宵节','5-5':'端午节','7-7':'七夕','8-15':'中秋节','9-9':'重阳节','12-8':'腊八节'};if(l.getMonth()>0&&traditional[l.getMonth()+'-'+l.getDay()])holidays.push(traditional[l.getMonth()+'-'+l.getDay()]);const next=solar.next(1).getLunar();if(next.getMonth()===1&&next.getDay()===1)holidays.push('除夕');if(term==='清明')holidays.push('清明节');
 const sunday=easter(year),shift=n=>new Date(Date.parse(sunday+'T12:00:00Z')+n*86400000).toISOString().slice(0,10);if(date===sunday)holidays.push('复活节');if(date===shift(-2))holidays.push('受难日');if(date===shift(1))holidays.push('复活周一');
 const fullLunar=l.getMonthInChinese()+'月'+l.getDayInChinese(),result={lunar,primary:holidays[0]||term||lunar,holidays,term,details:[fullLunar,...holidays,...(term&&!holidays.includes(term)&&term!=='清明'?[term]:[])].join(' · ')};if(cache.size>800)cache.clear();cache.set(date,result);return result;
}
window.RexCalendarLabels={get};
