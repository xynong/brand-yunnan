import React,{useEffect,useState} from 'react';
import {createRoot} from 'react-dom/client';
import './style.css';
const API=import.meta.env.VITE_API_BASE_URL||'https://apixyong.ccwu.cc';
function App(){
 const[token,setToken]=useState(localStorage.getItem('xyong_ops_token')||''); const[d,setD]=useState<any>(null); const[g,setG]=useState<any>(null); const[error,setError]=useState('');
 const headers=()=>({Authorization:`Bearer ${token}`,'Content-Type':'application/json'});
 const load=async()=>{try{const [a,b]=await Promise.all([fetch(`${API}/api/ops/dashboard`,{headers:headers()}),fetch(`${API}/api/ops/growth/overview`,{headers:headers()})]); const x=await a.json(),y=await b.json(); if(!a.ok||!b.ok)throw new Error(x.error||y.error||'加载失败');setD(x);setG(y);setError('')}catch(e:any){setError(e.message||'网络请求失败')}};
 useEffect(()=>{if(token)load()},[token]);
 const runAgent=async()=>{await fetch(`${API}/api/ops/agent/run`,{method:'POST',headers:headers()});await load()};
 const updateTask=async(id:string,status:string)=>{await fetch(`${API}/api/ops/agent/tasks/${id}`,{method:'PUT',headers:headers(),body:JSON.stringify({status})});await load()};
 if(!token||error==='Unauthorized')return <main className="login"><div className="box"><div className="eyebrow">XYONG BRAND</div><h1>云南精品园</h1><p>生产环境请同时在 Cloudflare Access 中启用身份验证。</p><input type="password" placeholder="ADMIN_TOKEN" id="token"/><button onClick={()=>{const v=(document.getElementById('token') as HTMLInputElement).value;localStorage.setItem('xyong_ops_token',v);setToken(v)}}>进入</button>{error==='Unauthorized'&&<p>Token 无效，请重新输入。</p>}</div></main>;
 return <main><header><div><b>XYONG BRAND</b><span> · 云南精品园</span></div><div><button onClick={load}>刷新</button><button onClick={()=>{localStorage.removeItem('xyong_ops_token');setToken('')}}>退出</button></div></header>
 <section className="hero"><div><div className="eyebrow">ONE PERSON COMPANY</div><h1>Brand Operations Center</h1><p>你负责判断与批准；系统负责沉淀数据、发现异常、生成增长建议。所有高风险动作都需要人工确认。</p></div></section>
 <section className="cards"><div><span>Active products</span><strong>{d?.products?.count??'—'}</strong></div><div><span>Inventory units</span><strong>{d?.inventory?.units??'—'}</strong></div><div><span>Leads</span><strong>{d?.leads?.total??'—'}</strong></div><div><span>Open Agent Tasks</span><strong>{d?.tasks?.open_count??'—'}</strong></div></section>
 <section className="panel"><div className="panel-head"><h2>Growth Center / 获客中心</h2><button onClick={runAgent}>运行 AI Agent</button></div><div className="grid2"><div><h3>获客来源</h3>{(g?.channels||[]).map((x:any,i:number)=><p key={i}>{x.source||'direct'} / {x.medium||'—'} / {x.event_type}: {x.count}</p>)}</div><div><h3>Campaigns</h3>{(g?.campaigns||[]).map((x:any)=><p key={x.id}>{x.name} · {x.status} · {x.utm_campaign}</p>)}</div></div></section>
 <section className="panel"><div className="panel-head"><h2>AI Agent 工作区</h2><span className="muted">AI 只建议；资金、退款、支付确认和发布需要你批准。</span></div><div className="tasks">{(g?.tasks||[]).map((x:any)=><article key={x.id}><div><b>{x.title}</b><p>{x.recommendation}</p><small>{x.agent_name} · {x.priority}</small></div><div><button onClick={()=>updateTask(x.id,'approved')}>批准</button><button onClick={()=>updateTask(x.id,'rejected')}>拒绝</button></div></article>)}</div></section>
 <section className="panel"><h2>运营闭环</h2><div className="road"><span>Social / Community / Search</span><b>→</b><span>Lead</span><b>→</b><span>Campaign</span><b>→</b><span>Store</span><b>→</b><span>Order</span></div></section>
 </main>}
createRoot(document.getElementById('root')!).render(<App/>);
