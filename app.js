import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';
const $=id=>document.getElementById(id);
const config=window.DIGI_CONFIG||{};
const configured=Boolean(config.supabaseUrl&&config.supabaseKey);
const sb=configured?createClient(config.supabaseUrl,config.supabaseKey):null;
const seed=[
['深水埗黃金大廈','九龍','深水埗','九龍深水埗福華街146-152號黃金大廈地下47A舖'],
['旺角海富商場','九龍','旺角','九龍旺角海庭道2號海富商場地下12B及13號舖'],
['旺角銀都商業大廈','九龍','旺角','九龍旺角彌敦道719號銀都商業大廈地下C舖'],
['慈雲山中心','九龍','慈雲山','九龍慈雲山毓華街23號慈雲山中心商場3樓324-325號舖'],
['九龍灣企業廣場5期','九龍','九龍灣','九龍九龍灣宏照道38號企業廣場5期地下13及14號舖'],
['石塘咀德輔道西','香港島','石塘咀','香港石塘咀德輔道西442號美新樓B座地下5號舖'],
['香港仔大道','香港島','香港仔','香港香港仔大道178號地下'],
['銅鑼灣道','香港島','銅鑼灣','香港銅鑼灣道19-23號建康大廈地下3號舖'],
['北角五洲大廈','香港島','北角','香港北角英皇道298-300號五洲大廈地下部份A及部份C2舖'],
['數碼港','香港島','薄扶林','香港數碼港道100號零售服務中心地下5-8號舖'],
['大埔舊墟直街','新界','大埔','新界大埔舊墟直街9號銳發大廈地下2號舖'],
['沙田京瑞廣場','新界','沙田','新界沙田安群街3號京瑞廣場一期地下G03號舖'],
['馬鞍山欣安邨','新界','馬鞍山','新界馬鞍山欣安邨欣安商場地下2號舖'],
['西貢親民街','新界','西貢','新界西貢親民街18-32號錦華樓B舖地下及閣樓'],
['將軍澳尚德商場','新界','將軍澳','新界將軍澳唐明街2號尚德商場2樓228號舖']
].map(([name,region,district,address],i)=>({id:`demo-${i}`,name,region,district,address}));
let stores=[],reports=[];
function esc(s){return String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
function recent(storeId){return reports.find(r=>r.store_id===storeId&&Date.now()-new Date(r.created_at).getTime()<24*3600*1000);}
function time(s){return new Intl.DateTimeFormat('zh-HK',{timeZone:'Asia/Hong_Kong',month:'numeric',day:'numeric',hour:'2-digit',minute:'2-digit',hour12:false}).format(new Date(s));}
function render(){const q=$('search').value.trim().toLocaleLowerCase(),region=$('region').value,status=$('status').value;const filtered=stores.filter(s=>(!region||s.region===region)&&(!q||[s.name,s.region,s.district,s.address].join(' ').toLocaleLowerCase().includes(q))&&(!status||(status==='unknown'?!recent(s.id):recent(s.id)?.status===status)));
$('storeCount').textContent=stores.length;$('reportCount').textContent=reports.length;$('inStockCount').textContent=stores.filter(s=>recent(s.id)?.status==='in').length;
$('empty').hidden=filtered.length!==0;$('storeList').innerHTML=filtered.map(s=>{const r=recent(s.id),st=r?.status||'unknown',label=st==='in'?'有貨':st==='out'?'無貨':'未有最新情報';return `<article class="store"><div class="store-top"><div><div class="district">${esc(s.region)} / ${esc(s.district)}</div><h3>${esc(s.name)}</h3></div><span class="pill ${st}">${label}</span></div><div class="address">${esc(s.address)}</div><div class="meta">${r?`最後回報：${esc(time(r.created_at))}（香港時間）`:'24 小時內未有玩家回報'}</div>${r?.note?`<div class="note">「${esc(r.note)}」</div>`:''}<div class="store-actions"><button class="report-btn" data-id="${esc(s.id)}">＋ 回報存貨</button><a class="map-link" target="_blank" rel="noopener" href="https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(s.address)}">地圖 ↗</a></div></article>`;}).join('');}
async function ensureAuth(){const {data:{session}}=await sb.auth.getSession();if(!session){const {error}=await sb.auth.signInAnonymously();if(error)throw error;}}
async function load(){if(!configured){stores=seed;reports=[];$('connectionMessage').hidden=false;$('connectionMessage').textContent='示範模式：顯示 15 間真實分店作介面預覽；尚未連接資料庫，不能送出回報。請按 README 完成 Supabase 設定。';render();return;}
try{const [a,b]=await Promise.all([sb.from('stores').select('id,name,region,district,address').order('name').limit(3000),sb.from('stock_reports').select('store_id,status,note,created_at').order('created_at',{ascending:false}).limit(10000)]);if(a.error)throw a.error;if(b.error)throw b.error;stores=a.data;reports=b.data;$('connectionMessage').hidden=true;}catch(e){stores=[];reports=[];$('connectionMessage').hidden=false;$('connectionMessage').textContent=`連線失敗：${e.message}。請檢查設定及資料庫權限。`;}render();}
function closeDialogs(){document.querySelectorAll('dialog[open]').forEach(d=>d.close());}
$('storeList').addEventListener('click',e=>{const b=e.target.closest('[data-id]');if(!b)return;const s=stores.find(x=>String(x.id)===b.dataset.id);if(!s)return;$('reportForm').reset();$('reportError').textContent='';$('reportStoreId').value=s.id;$('selectedStore').textContent=`${s.name} · ${s.address}`;$('reportDialog').showModal();});
$('addStoreBtn').onclick=()=>{$('storeForm').reset();$('storeError').textContent='';$('storeDialog').showModal();};
document.querySelectorAll('[data-close]').forEach(b=>b.onclick=closeDialogs);
for(const id of ['search','region','status'])$(id).addEventListener(id==='search'?'input':'change',render);
$('refreshBtn').onclick=load;
$('reportForm').addEventListener('submit',async e=>{e.preventDefault();if(!configured){$('reportError').textContent='示範模式未能提交，請先設定資料庫。';return;}const btn=$('submitReport');btn.disabled=true;try{await ensureAuth();const {error}=await sb.from('reports').insert({store_id:$('reportStoreId').value,status:new FormData(e.target).get('stock'),note:$('note').value.trim()||null});if(error)throw error;closeDialogs();await load();}catch(err){$('reportError').textContent='提交失敗：'+err.message;}finally{btn.disabled=false;}});
$('storeForm').addEventListener('submit',async e=>{e.preventDefault();if(!configured){$('storeError').textContent='示範模式未能新增，請先設定資料庫。';return;}const btn=$('submitStore');btn.disabled=true;try{await ensureAuth();const {error}=await sb.from('stores').insert({name:$('newName').value.trim(),region:$('newRegion').value,district:$('newDistrict').value.trim(),address:$('newAddress').value.trim()});if(error)throw error;closeDialogs();await load();}catch(err){$('storeError').textContent='新增失敗：'+err.message;}finally{btn.disabled=false;}});
load();
