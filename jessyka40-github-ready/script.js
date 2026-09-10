// ========= CONFIGURATION SUPABASE =========
// Collez ici l'URL et la clé ANON de votre projet Supabase.
// Laissez vide pour utiliser le livre d'or et la playlist en mode local.
const SUPABASE_URL = "";
const SUPABASE_ANON_KEY = "";

const target = new Date("2026-09-12T19:15:00+02:00");
function tick(){
  const diff = target - new Date();
  const vals = diff > 0 ? [
    Math.floor(diff/86400000),
    Math.floor(diff/3600000)%24,
    Math.floor(diff/60000)%60,
    Math.floor(diff/1000)%60
  ] : [0,0,0,0];
  ["days","hours","minutes","seconds"].forEach((id,i)=>document.getElementById(id).textContent=String(vals[i]).padStart(2,"0"));
}
tick(); setInterval(tick,1000);

// ========= QUIZ =========
const questions = [
  {q:"Quel est le super-pouvoir de Jessyka ?", a:["Transformer n'importe quelle sortie en souvenir","Ne jamais sourire sur les photos","Arriver toujours 2 heures en avance"], c:0},
  {q:"Quel objet improbable peut-on retrouver dans les souvenirs de Jessyka ?", a:["Une tondeuse","Un piano à queue","Une combinaison de plongée"], c:0},
  {q:"Quelle ambiance colle particulièrement à cette soirée ?", a:["Bohème et sable","Disco futuriste","Noël polaire"], c:0},
  {q:"Que faut-il absolument apporter le 12 septembre ?", a:["Sa bonne humeur","Un manteau de ski","Une tente de camping"], c:0},
  {q:"Combien fête-t-on aujourd'hui ?", a:["30 ans","40 ans","50 ans"], c:1}
];
let qi=0, points=0, answered=false;
const qEl=document.getElementById("question"), aEl=document.getElementById("answers"), next=document.getElementById("next");
function renderQ(){
  answered=false; next.hidden=true;
  document.getElementById("quiz-progress").textContent=`Question ${qi+1} / ${questions.length}`;
  document.getElementById("score").textContent=`${points} point${points>1?"s":""}`;
  qEl.textContent=questions[qi].q; aEl.innerHTML="";
  questions[qi].a.forEach((txt,i)=>{
    const b=document.createElement("button"); b.className="answer"; b.textContent=txt;
    b.onclick=()=>choose(i,b); aEl.appendChild(b);
  });
}
function choose(i,btn){
  if(answered)return; answered=true;
  const q=questions[qi]; [...aEl.children].forEach((b,j)=>{if(j===q.c)b.classList.add("correct");});
  if(i===q.c) points++; else btn.classList.add("wrong");
  document.getElementById("score").textContent=`${points} point${points>1?"s":""}`;
  next.hidden=false;
}
next.onclick=()=>{qi++; if(qi<questions.length)renderQ(); else {qEl.textContent="Bravo !";aEl.innerHTML="";next.hidden=true;document.getElementById("quiz-result").hidden=false;document.getElementById("quiz-result").innerHTML=`<p style="font-family:Cormorant Garamond;font-size:30px">Score final : <b>${points}/${questions.length}</b> ✦</p><p>Merci d'avoir joué !</p>`;}};
renderQ();

// ========= LIVRE D'OR + PLAYLIST =========
const key="jessyka40-local";
function loadLocal(){try{return JSON.parse(localStorage.getItem(key)||'{"messages":[],"music":[]}')}catch{return {messages:[],music:[]}}}
function saveLocal(d){localStorage.setItem(key,JSON.stringify(d))}
function renderLocal(){
  const d=loadLocal();
  const box=document.getElementById("messages");
  d.messages.slice().reverse().forEach(m=>{
    const el=document.createElement("article");el.className="message";
    el.innerHTML=`<b>${escapeHtml(m.name)}</b><span>${m.date}</span><p>${escapeHtml(m.message)}</p>`;box.prepend(el);
  });
  const ml=document.getElementById("music-list");
  d.music.slice().reverse().forEach(m=>{
    const el=document.createElement("div");el.className="music-list-item";el.innerHTML=`🎵 <b>${escapeHtml(m.title)}</b> — ${escapeHtml(m.name)}`;ml.appendChild(el);
  });
}
function escapeHtml(s){return s.replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[c]))}

document.getElementById("guestbook-form").addEventListener("submit",async e=>{
  e.preventDefault();
  const name=document.getElementById("guest-name").value.trim(), message=document.getElementById("guest-message").value.trim();
  if(!name||!message)return;
  const status=document.getElementById("form-status");
  if(window.supabaseClient){
    const {error}=await window.supabaseClient.from("guestbook").insert({name,message});
    status.textContent=error?"Erreur, réessayez.":"Merci ! Votre message est en ligne ✦";
    if(!error)e.target.reset();
  }else{
    const d=loadLocal();d.messages.push({name,message,date:new Date().toLocaleDateString("fr-FR")});saveLocal(d);status.textContent="Message enregistré sur cet appareil ✦";e.target.reset();renderLocal();
  }
});
document.getElementById("music-form").addEventListener("submit",async e=>{
  e.preventDefault();
  const name=document.getElementById("music-name").value.trim(), title=document.getElementById("music-title").value.trim();
  if(!name||!title)return;
  if(window.supabaseClient){
    await window.supabaseClient.from("music_requests").insert({name,title});
  }else{
    const d=loadLocal();d.music.push({name,title});saveLocal(d);renderLocal();
  }
  e.target.reset();
});
renderLocal();

// Supabase is loaded only when configuration is present.
if(SUPABASE_URL && SUPABASE_ANON_KEY){
  const s=document.createElement("script");
  s.src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2";
  s.onload=()=>{
    window.supabaseClient=window.supabase.createClient(SUPABASE_URL,SUPABASE_ANON_KEY);
    loadSupabase();
  };
  document.head.appendChild(s);
}
async function loadSupabase(){
  const box=document.getElementById("messages"); box.innerHTML="";
  const {data}=await window.supabaseClient.from("guestbook").select("*").order("created_at",{ascending:false}).limit(50);
  (data||[]).forEach(m=>{
    const el=document.createElement("article");el.className="message";
    el.innerHTML=`<b>${escapeHtml(m.name)}</b><span>${new Date(m.created_at).toLocaleDateString("fr-FR")}</span><p>${escapeHtml(m.message)}</p>`;box.appendChild(el);
  });
  const ml=document.getElementById("music-list"); ml.innerHTML="";
  const r=await window.supabaseClient.from("music_requests").select("*").order("created_at",{ascending:false}).limit(50);
  (r.data||[]).forEach(m=>{const el=document.createElement("div");el.className="music-list-item";el.innerHTML=`🎵 <b>${escapeHtml(m.title)}</b> — ${escapeHtml(m.name)}`;ml.appendChild(el);});
}
