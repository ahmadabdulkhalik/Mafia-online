const socket = io();
const $ = id => document.getElementById(id);
let roomCode = "", myRole = null, myAlive = true, state = null, privateData = null;
const roleInfo = {
  mafia: ["😈 إنت من المافيا", "بالليل اختاروا هدف سوا. حاولوا ما تنكشفوا."],
  detective: ["🕵️ إنت المحقق", "كل ليلة فيك تفتّش على لاعب وتعرف إذا من المافيا."],
  doctor: ["🩺 إنت الدكتور", "كل ليلة اختار لاعب تحميه من القتل."],
  citizen: ["🧑 إنت مواطن", "ما عندك حركة بالليل. ركّز بالنقاش وصوّت بذكاء."]
};
function entryMessage(s){ $("entryMsg").textContent=s||""; }
function requestError(res){ if(!res?.ok) alert(res?.error || "صار خطأ، جرّب مرة تانية."); }
$("create").onclick = () => {
  socket.emit("createRoom",{name:$("name").value},res=>{
    if(!res?.ok){entryMessage(res?.error);return;}
    roomCode=res.code; showGame();
  });
};
$("join").onclick = () => {
  socket.emit("joinRoom",{name:$("name").value,code:$("roomCode").value},res=>{
    if(!res?.ok){entryMessage(res?.error);return;}
    roomCode=res.code; showGame();
  });
};
function showGame(){ $("entry").classList.add("hidden"); $("game").classList.remove("hidden"); $("codeText").textContent=roomCode; }
$("copy").onclick=async()=>{
  try{await navigator.clipboard.writeText(roomCode);$("copy").textContent="اننسخ!";}
  catch{prompt("انسخ كود الغرفة:",roomCode);}
};
$("start").onclick=()=>socket.emit("startGame",requestError);
socket.on("state",s=>{state=s;renderState();});
socket.on("private",p=>{privateData=p;myRole=p.role;myAlive=p.alive;renderPrivate();});
function renderState(){
  if(!state)return;
  $("codeText").textContent=state.code;
  $("phaseText").textContent=({lobby:"بانتظار اللاعبين",night:"ليل 🌙",day:"نهار ☀️",ended:"خلصت اللعبة"})[state.phase]||state.phase;
  $("count").textContent=`${state.players.length}/${state.maxPlayers}`;
  $("message").textContent=state.message||"";
  $("players").innerHTML="";
  state.players.forEach(p=>{
    const el=document.createElement("div");el.className="player";
    const avatar=document.createElement("span");avatar.className="avatar";avatar.textContent=p.alive?"👤":"💀";
    const name=document.createElement("span");name.className="pname"+(!p.alive?" dead":"");name.textContent=p.name;
    el.append(avatar,name);
    if(p.isHost){const h=document.createElement("span");h.className="host";h.textContent="HOST";el.append(h);}
    $("players").append(el);
  });
  $("start").classList.toggle("hidden",!(state.phase==="lobby"&&state.hostId===socket.id));
  $("start").disabled=state.players.length<5;
  if(state.phase==="ended"){
    $("rolePanel").classList.remove("hidden");
    $("roleCard").textContent=state.message;
    $("actionArea").innerHTML="";
  }
}
function renderPrivate(){
  if(!privateData||!state||!state.started||state.phase==="ended")return;
  $("rolePanel").classList.remove("hidden");
  const info=roleInfo[myRole]||["دورك",""];
  $("roleCard").innerHTML="";
  const title=document.createElement("div");title.textContent=info[0];
  const desc=document.createElement("small");desc.textContent=info[1];
  $("roleCard").append(title,desc);
  $("privateMsg").textContent=(privateData.notes||[]).join(" ");
  const area=$("actionArea");area.innerHTML="";
  if(!myAlive){area.textContent="إنت طلعت من اللعبة. فيك تتابع، بس ما بقى فيك تصوّت أو تعمل حركة.";return;}
  let allowed=[];
  if(state.phase==="night"&&["mafia","doctor","detective"].includes(myRole)) allowed=privateData.targets||[];
  if(state.phase==="day") allowed=(state.players||[]).filter(p=>p.alive&&p.id!==socket.id).map(p=>({id:p.id,name:p.name}));
  if(!allowed.length){
    area.textContent=state.phase==="night"?"ناطرين الأدوار السرّية تكمّل…":"ما في أهداف متاحة.";
    return;
  }
  const row=document.createElement("div");row.className="actionrow";
  const select=document.createElement("select");
  const placeholder=document.createElement("option");placeholder.value="";placeholder.textContent=state.phase==="day"?"صوّت لمين؟":"اختار لاعب";select.append(placeholder);
  allowed.forEach(t=>{const o=document.createElement("option");o.value=t.id;o.textContent=t.name;select.append(o);});
  const button=document.createElement("button");
  button.textContent=state.phase==="day"?"صوّت":"تأكيد";
  button.onclick=()=>{
    if(!select.value){alert("اختار لاعب بالأول.");return;}
    socket.emit("action",{targetId:select.value},res=>{
      if(!res?.ok){alert(res?.error||"ما زبطت الحركة.");return;}
      if(res.privateMessage)$("privateMsg").textContent=res.privateMessage;
      else button.textContent="تمّ الاختيار ✓";
    });
  };
  row.append(select,button);area.append(row);
}
socket.on("connect",()=>{});
socket.on("disconnect",()=>{ if(roomCode) $("message").textContent="انقطع الاتصال. عم نحاول نرجع نتصل…"; });
