(function(){
"use strict";
var errBox=document.getElementById('errBox');
window.onerror=function(m,s,l){ errBox.style.display='block'; errBox.textContent='Error: '+m+' ('+l+')';};
window.addEventListener('unhandledrejection',function(e){ errBox.style.display='block'; errBox.textContent='Error: '+(e.reason&&e.reason.message||e.reason);});

/* ================= helpers ================= */
function clamp(v,a,b){return v<a?a:(v>b?b:v);}
function lerp(a,b,t){return a+(b-a)*t;}
function rand(a,b){return a+Math.random()*(b-a);}
function fmt(n){return Math.floor(n).toLocaleString('ja-JP');}
function fmtYen(v){
if(v>=1e8) return '¥'+(v/1e8).toFixed(2)+'億';
if(v>=1e4) return '¥'+Math.round(v/1e4).toLocaleString('ja-JP')+'万';
return '¥'+fmt(v);
}
function fmtYenFull(v){return '¥'+fmt(v);}

/* ================= audio ================= */
var AC=null;
function audio(){ if(!AC){ try{ AC=new (window.AudioContext||window.webkitAudioContext)();}catch(e){}} if(AC&&AC.state==='suspended')AC.resume(); return AC;}
function noiseBuf(ac){ var b=ac.createBuffer(1,ac.sampleRate*0.7,ac.sampleRate); var d=b.getChannelData(0); for(var i=0;i<d.length;i++)d[i]=Math.random()*2-1; return b;}
var sharedNoise=null;
function sExplosionOld(big){
var ac=audio(); if(!ac)return; if(!sharedNoise)sharedNoise=noiseBuf(ac);
var t=ac.currentTime;
// sharp crack transient — the violent first instant
var cs=ac.createBufferSource(); cs.buffer=sharedNoise;
var cf=ac.createBiquadFilter(); cf.type='bandpass'; cf.frequency.value=2400; cf.Q.value=0.7;
var cg=ac.createGain(); cg.gain.setValueAtTime(big?0.65:0.4,t); cg.gain.exponentialRampToValueAtTime(0.001,t+0.09);
cs.connect(cf); cf.connect(cg); cg.connect(AUDOUT(ac)); cs.start(t); cs.stop(t+0.1);
var src=ac.createBufferSource(); src.buffer=sharedNoise;
var f=ac.createBiquadFilter(); f.type='lowpass'; f.frequency.setValueAtTime(big?900:1400,t); f.frequency.exponentialRampToValueAtTime(60,t+(big?0.65:0.4));
var g=ac.createGain(); g.gain.setValueAtTime(big?0.85:0.55,t); g.gain.exponentialRampToValueAtTime(0.001,t+(big?0.7:0.45));
src.connect(f); f.connect(g); g.connect(AUDOUT(ac)); src.start(t); src.stop(t+0.75);
var o=ac.createOscillator(); o.type='sine'; o.frequency.setValueAtTime(big?90:120,t); o.frequency.exponentialRampToValueAtTime(30,t+0.4);
var og=ac.createGain(); og.gain.setValueAtTime(big?0.7:0.4,t); og.gain.exponentialRampToValueAtTime(0.001,t+0.45);
o.connect(og); og.connect(AUDOUT(ac)); o.start(t); o.stop(t+0.5);
// deep sub thump rolling under big blasts
if(big){
var o2=ac.createOscillator(); o2.type='sine'; o2.frequency.setValueAtTime(58,t); o2.frequency.exponentialRampToValueAtTime(22,t+0.85);
var og2=ac.createGain(); og2.gain.setValueAtTime(0.85,t); og2.gain.exponentialRampToValueAtTime(0.001,t+0.9);
o2.connect(og2); og2.connect(AUDOUT(ac)); o2.start(t); o2.stop(t+0.95);
}
}
function sLaunchOld(){
var ac=audio(); if(!ac)return; var t=ac.currentTime;
var o=ac.createOscillator(); o.type='sawtooth'; o.frequency.setValueAtTime(300,t); o.frequency.exponentialRampToValueAtTime(1400,t+0.22);
var g=ac.createGain(); g.gain.setValueAtTime(0.12,t); g.gain.exponentialRampToValueAtTime(0.001,t+0.25);
o.connect(g); g.connect(AUDOUT(ac)); o.start(t); o.stop(t+0.26);
}
function sThunkOld(){
var ac=audio(); if(!ac)return; var t=ac.currentTime;
var o=ac.createOscillator(); o.type='square'; o.frequency.setValueAtTime(140,t); o.frequency.exponentialRampToValueAtTime(50,t+0.12);
var g=ac.createGain(); g.gain.setValueAtTime(0.25,t); g.gain.exponentialRampToValueAtTime(0.001,t+0.14);
o.connect(g); g.connect(AUDOUT(ac)); o.start(t); o.stop(t+0.15);
}
function sWarn(high){
var ac=audio(); if(!ac)return; var t=ac.currentTime;
for(var i=0;i<2;i++){
var o=ac.createOscillator(); o.type='square'; o.frequency.setValueAtTime(high?1040:780,t+i*0.17);
var g=ac.createGain(); g.gain.setValueAtTime(0.0001,t+i*0.17); g.gain.exponentialRampToValueAtTime(0.09,t+i*0.17+0.02); g.gain.exponentialRampToValueAtTime(0.001,t+i*0.17+0.13);
o.connect(g); g.connect(AUDOUT(ac)); o.start(t+i*0.17); o.stop(t+i*0.17+0.14);
}
}
function sRefuel(){
var ac=audio(); if(!ac)return; var t=ac.currentTime;
[660,880].forEach(function(fr,i){
var o=ac.createOscillator(); o.type='sine'; o.frequency.setValueAtTime(fr,t+i*0.13);
var g=ac.createGain(); g.gain.setValueAtTime(0.0001,t+i*0.13); g.gain.exponentialRampToValueAtTime(0.12,t+i*0.13+0.02); g.gain.exponentialRampToValueAtTime(0.001,t+i*0.13+0.12);
o.connect(g); g.connect(AUDOUT(ac)); o.start(t+i*0.13); o.stop(t+i*0.13+0.13);
});
}
function sRepair(){
var ac=audio(); if(!ac)return; var t=ac.currentTime;
[740,988,1318].forEach(function(fr,i){
var o=ac.createOscillator(); o.type='sine'; o.frequency.setValueAtTime(fr,t+i*0.11);
var g=ac.createGain(); g.gain.setValueAtTime(0.0001,t+i*0.11); g.gain.exponentialRampToValueAtTime(0.11,t+i*0.11+0.02); g.gain.exponentialRampToValueAtTime(0.001,t+i*0.11+0.11);
o.connect(g); g.connect(AUDOUT(ac)); o.start(t+i*0.11); o.stop(t+i*0.11+0.12);
});
}
function sSirenOld(){
var ac=audio(); if(!ac)return; var t=ac.currentTime;
for(var i=0;i<3;i++){
var o=ac.createOscillator(); o.type='square';
o.frequency.setValueAtTime(620,t+i*0.42); o.frequency.linearRampToValueAtTime(980,t+i*0.42+0.2); o.frequency.linearRampToValueAtTime(620,t+i*0.42+0.4);
var g=ac.createGain(); g.gain.setValueAtTime(0.0001,t+i*0.42); g.gain.exponentialRampToValueAtTime(0.07,t+i*0.42+0.03); g.gain.exponentialRampToValueAtTime(0.001,t+i*0.42+0.4);
o.connect(g); g.connect(AUDOUT(ac)); o.start(t+i*0.42); o.stop(t+i*0.42+0.42);
}
}
function sGunOld(){
var ac=audio(); if(!ac)return; var t=ac.currentTime;
if(!sharedNoise)sharedNoise=noiseBuf(ac);
var src=ac.createBufferSource(); src.buffer=sharedNoise;
var f=ac.createBiquadFilter(); f.type='bandpass'; f.frequency.value=1800;
var g=ac.createGain(); g.gain.setValueAtTime(0.16,t); g.gain.exponentialRampToValueAtTime(0.001,t+0.07);
src.connect(f); f.connect(g); g.connect(AUDOUT(ac)); src.start(t); src.stop(t+0.08);
}
function sHit(){
var ac=audio(); if(!ac)return; var t=ac.currentTime;
var o=ac.createOscillator(); o.type='square'; o.frequency.setValueAtTime(220,t); o.frequency.exponentialRampToValueAtTime(60,t+0.15);
var g=ac.createGain(); g.gain.setValueAtTime(0.3,t); g.gain.exponentialRampToValueAtTime(0.001,t+0.16);
o.connect(g); g.connect(AUDOUT(ac)); o.start(t); o.stop(t+0.17);
sThunk();
}
function sJetRoarOld(){
var ac=audio(); if(!ac)return; var t=ac.currentTime;
if(!sharedNoise)sharedNoise=noiseBuf(ac);
var src=ac.createBufferSource(); src.buffer=sharedNoise; src.loop=true;
var f=ac.createBiquadFilter(); f.type='lowpass'; f.frequency.setValueAtTime(300,t); f.frequency.exponentialRampToValueAtTime(2600,t+2.2); f.frequency.exponentialRampToValueAtTime(500,t+3.4);
var g=ac.createGain(); g.gain.setValueAtTime(0.001,t); g.gain.exponentialRampToValueAtTime(0.22,t+1.4); g.gain.exponentialRampToValueAtTime(0.001,t+3.5);
src.connect(f); f.connect(g); g.connect(AUDOUT(ac)); src.start(t); src.stop(t+3.6);
}
function sEngineFail(){
var ac=audio(); if(!ac)return; var t=ac.currentTime;
var o=ac.createOscillator(); o.type='sawtooth'; o.frequency.setValueAtTime(320,t); o.frequency.exponentialRampToValueAtTime(38,t+1.1);
var g=ac.createGain(); g.gain.setValueAtTime(0.16,t); g.gain.exponentialRampToValueAtTime(0.001,t+1.15);
o.connect(g); g.connect(AUDOUT(ac)); o.start(t); o.stop(t+1.2);
}
// continuous rotor chop + turbine whine (WebAudio synth only, very quiet under SFX)
var rotorNodes=null;
function startRotorSoundOld(){
var ac=audio(); if(!ac||rotorNodes)return;
if(!sharedNoise)sharedNoise=noiseBuf(ac);
var src=ac.createBufferSource(); src.buffer=sharedNoise; src.loop=true;
var f=ac.createBiquadFilter(); f.type='lowpass'; f.frequency.value=420;
var g=ac.createGain(); g.gain.value=0.0; g.gain.linearRampToValueAtTime(0.055,ac.currentTime+0.8);
var lfo=ac.createOscillator(); lfo.type='sine'; lfo.frequency.value=12.5;
var lfoG=ac.createGain(); lfoG.gain.value=0.038; lfo.connect(lfoG); lfoG.connect(g.gain);
var whine=ac.createOscillator(); whine.type='triangle'; whine.frequency.value=620;
var wg=ac.createGain(); wg.gain.value=0.012;
src.connect(f); f.connect(g); g.connect(AUDOUT(ac)); whine.connect(wg); wg.connect(AUDOUT(ac));
// wind rush that swells with airspeed (band-passed noise, driven by setRotorLoad)
var wsrc=ac.createBufferSource(); wsrc.buffer=sharedNoise; wsrc.loop=true; wsrc.playbackRate.value=0.7;
var wf=ac.createBiquadFilter(); wf.type='bandpass'; wf.frequency.value=480; wf.Q.value=0.55;
var wgn=ac.createGain(); wgn.gain.value=0.0;
wsrc.connect(wf); wf.connect(wgn); wgn.connect(AUDOUT(ac));
src.start(); lfo.start(); whine.start(); wsrc.start();
rotorNodes={src:src,lfo:lfo,whine:whine,g:g,wg:wg,wind:wsrc,windGain:wgn,windF:wf};
}
function stopRotorSoundOld(fail){
if(!rotorNodes)return; var rn=rotorNodes; rotorNodes=null;
try{
var ac=AC; var t=ac?ac.currentTime:0;
rn.g.gain.cancelScheduledValues(t); rn.g.gain.setValueAtTime(rn.g.gain.value,t); rn.g.gain.linearRampToValueAtTime(0.0001,t+(fail?0.9:0.35));
if(fail&&rn.whine)rn.whine.frequency.exponentialRampToValueAtTime(90,t+0.9);
setTimeout(function(){ try{rn.src.stop(); rn.lfo.stop(); rn.whine.stop(); if(rn.wind)rn.wind.stop();}catch(e){} },1100);
}catch(e){}
}
function setRotorLoadOld(load){ if(rotorNodes&&AC){ rotorNodes.whine.frequency.setTargetAtTime(560+load*260,AC.currentTime,0.15); if(rotorNodes.windGain){ rotorNodes.windGain.gain.setTargetAtTime(load*load*0.08,AC.currentTime,0.25); rotorNodes.windF.frequency.setTargetAtTime(420+load*780,AC.currentTime,0.25); } } }

/* ---- procedural battle music: drone + bass + drums, intensity follows combo / enemies. M = mute ---- */
var MUS={on:false,muted:false,master:null,drone:[],timer:null,step:0,next:0,inten:0,bassF:null};
function musicStart(){
var ac=audio(); if(!ac||MUS.on)return; MUS.on=true;
var m=ac.createGain(); m.gain.value=0; m.connect(AUDM(ac)); MUS.master=m;
m.gain.setTargetAtTime(MUS.muted?0:0.55,ac.currentTime,0.8);
MUS.drone=[];
[[55,'sawtooth',0.05],[82.4,'sawtooth',0.035],[110.4,'triangle',0.04]].forEach(function(d,i){
var o=ac.createOscillator(); o.type=d[1]; o.frequency.value=d[0]; o.detune.value=(i-1)*7;
var f=ac.createBiquadFilter(); f.type='lowpass'; f.frequency.value=420; f.Q.value=0.6;
var g=ac.createGain(); g.gain.value=d[2]; o.connect(f); f.connect(g); g.connect(m); o.start(); MUS.drone.push({o:o,f:f});
});
MUS.step=0; MUS.next=ac.currentTime+0.15;
var bf=ac.createBiquadFilter(); bf.type='lowpass'; bf.frequency.value=380; bf.Q.value=4; bf.connect(m); MUS.bassF=bf;
MUS.timer=setInterval(musicTick,25);
}
function musicStop(){
if(!MUS.on)return; MUS.on=false; if(MUS.timer){ clearInterval(MUS.timer); MUS.timer=null; }
var ac=AC; if(!ac||!MUS.master)return; var m=MUS.master, dr=MUS.drone; MUS.master=null; MUS.drone=[];
m.gain.setTargetAtTime(0,ac.currentTime,0.25);
setTimeout(function(){ dr.forEach(function(d){ try{ d.o.stop(); }catch(e){} }); try{ m.disconnect(); }catch(e){} },1400);
}
function musicToggle(){ MUS.muted=!MUS.muted; if(MUS.master&&AC)MUS.master.gain.setTargetAtTime(MUS.muted?0:0.55,AC.currentTime,0.15); try{ showCenter(MUS.muted?'BGM OFF (M)':'BGM ON (M)'); }catch(e){} }
var MUS_BASS=[55,55,0,55,0,55,65.4,0,49,49,0,49,0,49,58.3,0];
function musicHit(t,type,vol){
var ac=AC; if(!ac)return;
if(type==='kick'){ var o=ac.createOscillator(); o.type='sine'; o.frequency.setValueAtTime(130,t); o.frequency.exponentialRampToValueAtTime(42,t+0.13); var g=ac.createGain(); g.gain.setValueAtTime(vol,t); g.gain.exponentialRampToValueAtTime(0.001,t+0.2); o.connect(g); g.connect(MUS.master); o.start(t); o.stop(t+0.22); }
else if(type==='hat'){ if(!sharedNoise)sharedNoise=noiseBuf(ac); var s=ac.createBufferSource(); s.buffer=sharedNoise; var f=ac.createBiquadFilter(); f.type='highpass'; f.frequency.value=7200; var g2=ac.createGain(); g2.gain.setValueAtTime(vol,t); g2.gain.exponentialRampToValueAtTime(0.001,t+0.045); s.connect(f); f.connect(g2); g2.connect(MUS.master); s.start(t); s.stop(t+0.06); }
else if(type==='bass'){ var o2=ac.createOscillator(); o2.type='sawtooth'; o2.frequency.value=vol.f; var g3=ac.createGain(); g3.gain.setValueAtTime(0.0001,t); g3.gain.linearRampToValueAtTime(vol.v,t+0.01); g3.gain.exponentialRampToValueAtTime(0.001,t+0.2); o2.connect(g3); g3.connect(MUS.bassF); o2.start(t); o2.stop(t+0.22); }
}
function musicTick(){
var ac=AC; if(!ac||!MUS.on||!MUS.master)return;
var target=clamp(G.combo/12+(G.ehPhase==='done'?0.22:0)+(G.scramblePhase==='done'?0.3:0)+(G.time<20?0.2:0),0,1);
MUS.inten+=(target-MUS.inten)*0.03;
var sp=60/(108+MUS.inten*22)/4;
while(MUS.next<ac.currentTime+0.12){
var st=MUS.step%16, t=MUS.next, I=MUS.inten;
if(st===0||st===8||(I>0.35&&(st===6||st===14))||(I>0.7&&(st===4||st===12)))musicHit(t,'kick',0.5);
if(st%4===2||(I>0.5&&st%2===1))musicHit(t,'hat',0.05+I*0.04);
var bn=MUS_BASS[st]; if(bn)musicHit(t,'bass',{f:bn*(MUS.step%64>=32?1.122:1),v:0.12+I*0.06});
MUS.bassF.frequency.setTargetAtTime(300+I*1100+(st%8===0?300:0),t,0.03);
MUS.next+=sp; MUS.step++;
}
for(var i=0;i<MUS.drone.length;i++)MUS.drone[i].f.frequency.setTargetAtTime(380+MUS.inten*700,ac.currentTime,0.4);
}

/* ================= AUDIO v2: sample-based sound engine (user-supplied recordings) with spatial mixing ================= */
var THR=0.6; // engine throttle 0..1 (also drives rotor pitch)
var AUD={ac:null,master:null,sfx:null,amb:null,music:null,rev:null,revIn:null,buf:{},loading:false,ready:false,failed:false,wantRotor:false,rotor:null,eh:null,jetL:null,guns:{},flys:[],siren:null,mwT:-9,pullT:0,flyCd:0,loadN:0};
var SFX_FILES={heli:'sfx/heli_loop.mp3',smg:'sfx/smg_loop.mp3',missile:'sfx/missile.mp3',expl1:'sfx/expl1.mp3',expl2:'sfx/expl2.mp3',jetL:'sfx/jet_loop.mp3',jetF:'sfx/jet_flyby.mp3',siren:'sfx/siren_loop.mp3'};
function AUDOUT(ac){ return AUD.sfx||ac.destination; }
function AUDM(ac){ return AUD.music||ac.destination; }
function audioBoot(){
var ac=audio(); if(!ac||AUD.ac)return; AUD.ac=ac;
AUD.master=ac.createGain(); var cp=ac.createDynamicsCompressor(); cp.threshold.value=-16; cp.knee.value=18; cp.ratio.value=3.2; cp.attack.value=0.004; cp.release.value=0.22;
AUD.master.connect(cp); cp.connect(ac.destination);
AUD.sfx=ac.createGain(); AUD.amb=ac.createGain(); AUD.music=ac.createGain(); AUD.sfx.connect(AUD.master); AUD.amb.connect(AUD.master); AUD.music.connect(AUD.master);
// city reverb: generated impulse response (dense early reflections + 2.4s tail)
var len=Math.floor(ac.sampleRate*2.4),ir=ac.createBuffer(2,len,ac.sampleRate);
for(var c=0;c<2;c++){ var d=ir.getChannelData(c); for(var i=0;i<len;i++){ var t=i/len; d[i]=(Math.random()*2-1)*Math.pow(1-t,2.6)*(i<ac.sampleRate*0.06?1.2:0.8); } }
AUD.rev=ac.createConvolver(); AUD.rev.buffer=ir; var rg=ac.createGain(); rg.gain.value=0.7; AUD.rev.connect(rg); rg.connect(AUD.master); AUD.revIn=ac.createGain(); AUD.revIn.connect(AUD.rev);
audioApplyVol();
if(AUD.loading)return; AUD.loading=true;
var names=Object.keys(SFX_FILES); AUD.loadN=names.length;
names.forEach(function(k){
fetch(SFX_FILES[k]).then(function(r){ if(!r.ok)throw new Error('http '+r.status); return r.arrayBuffer(); })
.then(function(ab){ return new Promise(function(res,rej){ ac.decodeAudioData(ab,res,rej); }); })
.then(function(b){ AUD.buf[k]=b; if(--AUD.loadN===0)AUD.ready=true; })
.catch(function(e){ AUD.failed=true; console.warn('sfx',k,e); });
});
}
function audioApplyVol(){
var V=SETTINGS.vol; if(!AUD.ac)return; var t=AUD.ac.currentTime;
AUD.master.gain.setTargetAtTime(V.master,t,0.05); AUD.sfx.gain.setTargetAtTime(V.sfx,t,0.05); AUD.amb.gain.setTargetAtTime(V.amb,t,0.05); AUD.music.gain.setTargetAtTime(V.music,t,0.05);
}
var _aR=new THREE.Vector3(),_aD=new THREE.Vector3(),_aU=new THREE.Vector3(0,1,0);
function aSpat(pos,ref){
if(!pos)return {g:1,pan:0,lp:20000,delay:0,d:0};
var d=camera.position.distanceTo(pos); camera.getWorldDirection(_aD); _aR.crossVectors(_aD,_aU).normalize();
var rel=_aV3.copy(pos).sub(camera.position); var dl=rel.length()||1; rel.multiplyScalar(1/dl);
var pan=clamp(rel.dot(_aR),-1,1)*0.85; var g=1/(1+Math.pow(d/ref,1.45));
return {g:g,pan:pan,lp:clamp(20000*Math.exp(-d/(ref*5.5)),700,20000),delay:Math.min(1.5,d/340*0.4),d:d};
}
var _aV3=new THREE.Vector3();
function aPlay(name,o){
var ac=AUD.ac,b=AUD.buf[name]; if(!ac||!b)return null; o=o||{};
var sp=aSpat(o.pos,o.ref||140);
var src=ac.createBufferSource(); src.buffer=b; src.playbackRate.value=o.rate||1; if(o.loop){ src.loop=true; }
var lp=ac.createBiquadFilter(); lp.type='lowpass'; lp.frequency.value=o.lp?Math.min(o.lp,sp.lp):sp.lp; lp.Q.value=0.5;
var g=ac.createGain(); g.gain.value=(o.vol===undefined?1:o.vol)*sp.g;
var pan=ac.createStereoPanner?ac.createStereoPanner():null; if(pan)pan.pan.value=sp.pan;
src.connect(lp); lp.connect(g); var out=pan?(g.connect(pan),pan):g; out.connect(o.bus||AUD.sfx);
if(o.reverb&&AUD.revIn){ var rs=ac.createGain(); rs.gain.value=o.reverb*Math.min(1,sp.g*2.2+0.15); g.connect(rs); rs.connect(AUD.revIn); }
var t0=ac.currentTime+(o.delay===undefined?sp.delay:o.delay);
src.start(t0,o.offset||0); if(o.dur)src.stop(t0+o.dur);
return {src:src,g:g,pan:pan,lp:lp,pos:o.pos,ref:o.ref||140,vol:(o.vol===undefined?1:o.vol),t0:t0};
}
function aTrack(h){ // keep a positional sound in sync with its source
if(!h||!h.pos)return; var sp=aSpat(h.pos,h.ref),t=AUD.ac.currentTime;
h.g.gain.setTargetAtTime(h.vol*sp.g,t,0.05); if(h.pan)h.pan.pan.setTargetAtTime(sp.pan,t,0.05); h.lp.frequency.setTargetAtTime(sp.lp,t,0.05); return sp;
}
/* ---- public hooks (replace the old synth versions when samples are ready) ---- */
function sExplosion(big,pos){
if(!AUD.ready){ return sExplosionOld(big); }
var p=pos||heliState.pos;
aPlay(big?'expl1':'expl2',{vol:big?1.0:0.85,rate:big?rand(0.88,1.0):rand(0.95,1.18),pos:p,ref:big?260:140,reverb:big?0.5:0.25});
if(big)aPlay('expl2',{vol:0.55,rate:0.55,lp:700,pos:p,ref:360,delay:0.07+aSpat(p,260).delay,reverb:0.4});
}
function sCollapse(pos,h){ if(!AUD.ready)return; aPlay('expl1',{vol:0.8,rate:rand(0.5,0.62),lp:900,pos:pos,ref:320,reverb:0.55}); aPlay('expl2',{vol:0.6,rate:0.45,lp:500,pos:pos,ref:300,delay:aSpat(pos,300).delay+0.25}); }
function sThunk(pos){ if(!AUD.ready){ return sThunkOld(); } aPlay('expl2',{vol:0.5,rate:rand(0.46,0.56),lp:420,pos:pos||heliState.pos,ref:150,reverb:0.2}); }
function sLaunch(pos){ if(!AUD.ready){ return sLaunchOld(); } aPlay('missile',{vol:pos?0.9:0.8,rate:rand(0.97,1.06),pos:pos,ref:150,reverb:0.15}); }
function sGun(pos){
if(!AUD.ready){ return sGunOld(); }
var key=!pos?'p':(pos===eheli.position?'e':'j'),sl=AUD.guns[key],ac=AUD.ac,now=ac.currentTime;
if(sl){ sl.last=now; return; }
var h=aPlay('smg',{vol:key==='p'?0.62:0.55,rate:key==='p'?1:rand(0.94,1.06),loop:true,pos:pos,ref:130,delay:0,reverb:0.1});
if(!h)return; h.src.loop=true; h.last=now; h.key=key; AUD.guns[key]=h;
}
function sJetRoar(){ if(!AUD.ready){ return sJetRoarOld(); } aPlay('jetF',{vol:0.9,rate:1,reverb:0.2,delay:0,lp:15000}); }
function sSiren(){ if(!AUD.ready){ return sSirenOld(); } var h=aPlay('siren',{vol:0.5,loop:true,delay:0,bus:AUD.sfx,lp:9000}); if(h){ h.g.gain.setTargetAtTime(0,AUD.ac.currentTime+5.0,0.5); try{ h.src.stop(AUD.ac.currentTime+7); }catch(e){} } }
function sMslWarn(dt){ AUD.mwT=AUD.ac?AUD.ac.currentTime:-9; }
function sPullUp(dt){ if(!AUD.ac)return; AUD.pullT-=dt; if(AUD.pullT>0)return; AUD.pullT=0.5; var ac=AUD.ac,o=ac.createOscillator(),g=ac.createGain(); o.type='square'; o.frequency.value=1250; var t=ac.currentTime; g.gain.setValueAtTime(0,t); g.gain.linearRampToValueAtTime(0.1,t+0.01); g.gain.setValueAtTime(0.1,t+0.1); g.gain.linearRampToValueAtTime(0,t+0.13); o.connect(g); g.connect(AUD.sfx); o.start(t); o.stop(t+0.15); }
function sFlare(){ if(!AUD.ac)return; var ac=AUD.ac; if(!sharedNoise)sharedNoise=noiseBuf(ac); var s=ac.createBufferSource(); s.buffer=sharedNoise; var f=ac.createBiquadFilter(); f.type='bandpass'; f.frequency.value=3200; f.Q.value=0.8; var g=ac.createGain(),t=ac.currentTime; g.gain.setValueAtTime(0.0,t); g.gain.linearRampToValueAtTime(0.35,t+0.03); g.gain.exponentialRampToValueAtTime(0.001,t+0.9); s.connect(f); f.connect(g); g.connect(AUD.sfx); s.start(t); s.stop(t+1); }
/* ---- rotor loop (player) ---- */
function startRotorSound(){
if(AUD.failed||!AUD.ac){ AUD.wantRotor=false; return startRotorSoundOld(); }
AUD.wantRotor=true; if(!AUD.ready)return; audioMakeRotor();
}
function audioMakeRotor(){
if(AUD.rotor)return; var ac=AUD.ac;
var src=ac.createBufferSource(); src.buffer=AUD.buf.heli; src.loop=true; var lp=ac.createBiquadFilter(); lp.type='lowpass'; lp.frequency.value=16000; var g=ac.createGain(); g.gain.value=0;
src.connect(lp); lp.connect(g); g.connect(AUD.amb); src.start(ac.currentTime,Math.random()*4);
AUD.rotor={src:src,g:g,lp:lp,load:0,fail:false,rate:0.9};
}
function setRotorLoad(l){ if(AUD.rotor)AUD.rotor.load=l; else if(!AUD.wantRotor&&typeof setRotorLoadOld==='function')setRotorLoadOld(l); }
function stopRotorSound(fail){
AUD.wantRotor=false; var r=AUD.rotor; if(!r){ if(typeof stopRotorSoundOld==='function')stopRotorSoundOld(fail); return; }
var ac=AUD.ac,t=ac.currentTime; if(fail){ r.fail=true; r.g.gain.setTargetAtTime(0,t+1.6,0.6); r.src.playbackRate.setTargetAtTime(0.35,t,0.9); } else { r.g.gain.setTargetAtTime(0,t,0.25); }
var old=r; AUD.rotor=null; setTimeout(function(){ try{ old.src.stop(); }catch(e){} },fail?4500:1500);
if(fail&&typeof stopRotorSoundOld==='function')stopRotorSoundOld(true);
}
function audioLoopStart(name,vol,rate,pos,ref){ var h=aPlay(name,{vol:vol,rate:rate||1,loop:true,pos:pos,ref:ref||160,delay:0,bus:AUD.amb,reverb:0.12}); if(h){ h.src.loop=true; h.base=rate||1; } return h; }
function audioStop(h,t){ if(!h)return; var ac=AUD.ac; h.g.gain.setTargetAtTime(0,ac.currentTime,t||0.2); setTimeout(function(){ try{ h.src.stop(); }catch(e){} },900); }
function audioUpdate(dt){
var ac=AUD.ac; if(!ac||G.paused)return;
if(!AUD.ready){ return; }
var now=ac.currentTime;
if(AUD.wantRotor&&!AUD.rotor)audioMakeRotor();
var r=AUD.rotor;
if(r&&!r.fail){ var tgtRate=0.84+0.3*r.load+0.12*THR,tgtG=0.42+0.4*r.load+0.12*THR; if(G.mode!=='play'){ tgtG=0; }
r.rate+=(tgtRate-r.rate)*Math.min(1,dt*3); r.src.playbackRate.value=r.rate; r.g.gain.setTargetAtTime(tgtG,now,0.1); r.lp.frequency.setTargetAtTime(VIEWMODE===1?2400:16000,now,0.15); }
// player + enemy gun slots
for(var k in AUD.guns){ var sl=AUD.guns[k]; if(now-sl.last>0.16){ sl.g.gain.setTargetAtTime(0,now,0.04); (function(s){ setTimeout(function(){ try{ s.src.stop(); }catch(e){} },300); })(sl); delete AUD.guns[k]; } else aTrack(sl); }
// enemy helicopter engine, positional
if(ehState.active&&!ehState.down&&G.mode==='play'){
if(!AUD.eh)AUD.eh=audioLoopStart('heli',0.8,1.06,eheli.position,150);
else { var sp=aTrack(AUD.eh); if(sp){ var rv=_aV3.copy(ehState.vel).sub(heliState.vel); var toL=_aD.copy(camera.position).sub(eheli.position).normalize(); var vr=-rv.dot(toL); AUD.eh.src.playbackRate.setTargetAtTime(clamp(1.06/(1+vr/160),0.9,1.18),now,0.1); } }
} else if(AUD.eh){ audioStop(AUD.eh,0.3); AUD.eh=null; }
// enemy jet: engine loop with doppler + occasional flyby samples
if(jetState.active&&!jetState.down&&G.mode==='play'){
if(!AUD.jetL)AUD.jetL=audioLoopStart('jetL',0.9,1,jet.position,260);
else { var sp2=aTrack(AUD.jetL); if(sp2){ var jf=_aD.set(1,0,0).applyQuaternion(jet.quaternion); var rel=_aR.copy(camera.position).sub(jet.position).normalize(); var vrj=-(jf.dot(rel))*jetState.speed+0; AUD.jetL.src.playbackRate.setTargetAtTime(clamp(1/(1+(-vrj)/150),0.86,1.16),now,0.08); }
AUD.flyCd-=dt; var dj=camera.position.distanceTo(jet.position); if(AUD.flyCd<=0&&dj<650&&dj>240){ var jfw=_aD.set(1,0,0).applyQuaternion(jet.quaternion); var rl=_aR.copy(camera.position).sub(jet.position).normalize(); if(jfw.dot(rl)>0.5){ var h=aPlay('jetF',{vol:0.85,rate:1,pos:jet.position,ref:300,delay:0,offset:1.5,reverb:0.2}); if(h){ AUD.flys.push(h); AUD.flyCd=18; } } } }
} else if(AUD.jetL){ audioStop(AUD.jetL,0.4); AUD.jetL=null; }
for(var i=AUD.flys.length-1;i>=0;i--){ var f=AUD.flys[i]; aTrack(f); if(now>f.t0+13)AUD.flys.splice(i,1); }
// missile-warning siren (loops while any enemy missile is near)
var warn=(now-AUD.mwT)<0.3;
if(warn&&!AUD.siren){ AUD.siren=aPlay('siren',{vol:0.0,loop:true,delay:0,lp:7000}); if(AUD.siren)AUD.siren.src.loop=true; }
if(AUD.siren){ AUD.siren.g.gain.setTargetAtTime(warn?0.32:0,now,0.08); if(!warn&&!AUD.siren.stopping){ AUD.siren.stopping=true; var sr=AUD.siren; setTimeout(function(){ try{ sr.src.stop(); }catch(e){} },700); AUD.siren=null; } }
}

/* ================= three setup ================= */
var app=document.getElementById('app');
var renderer=new THREE.WebGLRenderer({antialias:true,powerPreference:'high-performance'});
renderer.setPixelRatio(Math.min(window.devicePixelRatio||1,1.35));
renderer.setSize(window.innerWidth,window.innerHeight);
renderer.shadowMap.enabled=true;
renderer.shadowMap.type=THREE.PCFShadowMap;
renderer.toneMapping=THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure=1.18;
app.insertBefore(renderer.domElement,app.firstChild);
var MAX_ANISO=Math.min(8,renderer.capabilities.getMaxAnisotropy()||4);

var scene=new THREE.Scene();
scene.background=new THREE.Color(0x9ec2e6);
scene.fog=new THREE.Fog(0xd9c9a8,190,520);

var camera=new THREE.PerspectiveCamera(60,window.innerWidth/window.innerHeight,0.1,1100);
camera.position.set(0,40,90);

// gradient sky dome — late afternoon, warm horizon haze
(function(){
var c=document.createElement('canvas'); c.width=4; c.height=256; var g=c.getContext('2d');
var gr=g.createLinearGradient(0,0,0,256);
gr.addColorStop(0,'#2f6bb3'); gr.addColorStop(0.38,'#7fb0dd'); gr.addColorStop(0.68,'#cfe3ee'); gr.addColorStop(0.86,'#f2d9a7'); gr.addColorStop(1,'#e8c99a');
g.fillStyle=gr; g.fillRect(0,0,4,256);
var tex=new THREE.CanvasTexture(c); tex.colorSpace=THREE.SRGBColorSpace;
var sky=new THREE.Mesh(new THREE.SphereGeometry(820,20,14),new THREE.MeshBasicMaterial({map:tex,side:THREE.BackSide,fog:false,depthWrite:false}));
sky.renderOrder=-10;
// low sun glow sprite near sun direction
var sc=document.createElement('canvas'); sc.width=sc.height=128; var sg=sc.getContext('2d');
var rg=sg.createRadialGradient(64,64,2,64,64,62); rg.addColorStop(0,'rgba(255,244,200,1)'); rg.addColorStop(0.25,'rgba(255,214,140,0.55)'); rg.addColorStop(1,'rgba(255,190,90,0)');
sg.fillStyle=rg; sg.fillRect(0,0,128,128);
var glow=new THREE.Sprite(new THREE.SpriteMaterial({map:new THREE.CanvasTexture(sc),transparent:true,depthWrite:false,fog:false,blending:THREE.AdditiveBlending}));

})();

/* image-based light: PMREM baked once from a tiny painted sky — gives glass
   towers, car paint and airframes real sky reflections for almost no cost.
   Deferred until after the title screen is up so first load stays fast;
   materials register via regEnv() and get the map applied when it lands. */
var envMapTex=null;
var envMats=[];
function regEnv(mat,intensity){
mat.userData.envI=intensity; envMats.push(mat);
if(envMapTex){ mat.envMap=envMapTex; mat.envMapIntensity=intensity; mat.needsUpdate=true; }
}
function initEnv(){
if(envMapTex)return;
try{
var ec=document.createElement('canvas'); ec.width=1024; ec.height=512; var eg=ec.getContext('2d');
var egr=eg.createLinearGradient(0,0,0,512);
egr.addColorStop(0,'#274b78'); egr.addColorStop(0.42,'#6d97c4'); egr.addColorStop(0.52,'#c8d9e2'); egr.addColorStop(0.56,'#e6c491'); egr.addColorStop(0.6,'#8a7a5c'); egr.addColorStop(1,'#3f3a30');
eg.fillStyle=egr; eg.fillRect(0,0,1024,512);
var esg=eg.createRadialGradient(700,268,4,700,268,120); esg.addColorStop(0,'rgba(255,246,214,1)'); esg.addColorStop(0.2,'rgba(255,216,150,0.75)'); esg.addColorStop(1,'rgba(255,200,120,0)');
eg.fillStyle=esg; eg.fillRect(0,0,1024,512);
eg.fillStyle='rgba(70,74,70,0.55)';
for(var ebi=0;ebi<26;ebi++){ var ebw=20+Math.random()*46; eg.fillRect(Math.random()*1024,286+Math.random()*8,ebw,26+Math.random()*46); }
var etx=new THREE.CanvasTexture(ec); etx.mapping=THREE.EquirectangularReflectionMapping; if(THREE.SRGBColorSpace)etx.colorSpace=THREE.SRGBColorSpace;
var pmrem=new THREE.PMREMGenerator(renderer); pmrem.compileEquirectangularShader();
envMapTex=pmrem.fromEquirectangular(etx).texture;
pmrem.dispose();
for(var i=0;i<envMats.length;i++){ var m=envMats[i]; m.envMap=envMapTex; m.envMapIntensity=m.userData.envI||0.4; m.needsUpdate=true; }
}catch(e){ envMapTex=null; }
}

var LG=parseFloat((location.search.match(/[?&]lg=([\d.]+)/)||[])[1])||2.1;
var hemi=new THREE.HemisphereLight(0xbfd9f2,0x6b5f45,0.62*LG); scene.add(hemi);
var amb=new THREE.AmbientLight(0xffe8c0,0.14*LG); scene.add(amb);
var sun=new THREE.DirectionalLight(0xffdfae,1.65*LG);
sun.position.set(150,118,88); sun.castShadow=true;
sun.shadow.mapSize.set(window.innerWidth<700?1024:2048,window.innerWidth<700?1024:2048);
sun.shadow.camera.left=-140; sun.shadow.camera.right=140; sun.shadow.camera.top=140; sun.shadow.camera.bottom=-140;
sun.shadow.camera.near=20; sun.shadow.camera.far=520; sun.shadow.bias=-0.00045; sun.shadow.normalBias=0.6;
scene.add(sun); scene.add(sun.target);
// warm bounce fill from opposite side (no shadow, cheap)
var fill=new THREE.DirectionalLight(0x9db8d6,0.28*LG); fill.position.set(-90,60,-70); scene.add(fill);
/* dusk progression: over a sortie the sun sinks and warms, the haze turns
   amber and the town's lights (lamps, car headlights, lit windows) take
   over — one lerped factor drives lights/fog/exposure, no extra passes */
var DUSK={sunset:0,night:0,cur:0,sunColA:new THREE.Color(0xffdfae),sunColB:new THREE.Color(0xff9440),fogColA:new THREE.Color(0xd9c9a8),fogColB:new THREE.Color(0xcf9a72)};
var _lampGlowMat=null,_lampPoolMat=null,_carGlowMat=null,_carTailMat=null,_carPoolMat=null;
/* no PMREM environment: keep first load light on phones and software GL */

/* ================= textures ================= */
function buildingTexture(base,win,litRatio,style){
var c=document.createElement('canvas'); c.width=512; c.height=512; var g=c.getContext('2d');
g.fillStyle=base; g.fillRect(0,0,512,512);
// fine concrete grain + large soft tonal patches (real facades are blotchy, never flat)
for(var n=0;n<4200;n++){ g.fillStyle='rgba('+(Math.random()<0.5?'0,0,0':'255,255,255')+','+(Math.random()*0.055).toFixed(3)+')'; g.fillRect(Math.random()*512,Math.random()*512,3.5,3.5);}
for(var bp=0;bp<10;bp++){ g.fillStyle='rgba('+(Math.random()<0.5?'30,28,24':'235,232,220')+','+(0.03+Math.random()*0.045).toFixed(3)+')'; g.beginPath(); g.ellipse(Math.random()*512,Math.random()*512,40+Math.random()*110,26+Math.random()*70,Math.random()*3,0,Math.PI*2); g.fill();}
if(style==='brick'){ g.strokeStyle='rgba(60,30,20,0.22)'; g.lineWidth=1.4; for(var by=0;by<512;by+=20){ g.beginPath(); g.moveTo(0,by); g.lineTo(512,by); g.stroke();} for(var bx2=0;bx2<512;bx2+=52){ g.beginPath(); g.moveTo(bx2,0); g.lineTo(bx2,512); g.stroke();}}
if(style==='panel'){ g.strokeStyle='rgba(0,0,0,0.15)'; g.lineWidth=2; for(var px=0;px<=512;px+=128){ g.beginPath(); g.moveTo(px,0); g.lineTo(px,512); g.stroke();} for(var py=0;py<=512;py+=84){ g.beginPath(); g.moveTo(0,py); g.lineTo(512,py); g.stroke();} g.strokeStyle='rgba(255,255,255,0.07)'; for(var px2=2;px2<=512;px2+=128){ g.beginPath(); g.moveTo(px2,0); g.lineTo(px2,512); g.stroke();}}
var cols=6,rows=8,cw=512/cols,ch=512/rows;
for(var x=0;x<cols;x++)for(var y=0;y<rows;y++){
var lit=Math.random()<litRatio;
var warm=Math.random()<0.72;
var wx=x*cw+11, wy=y*ch+11, ww=cw-22, wh=ch-21;
// recessed frame + sill shadow gives each window real depth (also feeds the bump map)
g.fillStyle='rgba(0,0,0,0.42)'; g.fillRect(wx-4,wy-4,ww+8,wh+8);
g.fillStyle='rgba(255,255,255,0.13)'; g.fillRect(wx-4,wy+wh+3,ww+8,2);
if(style==='glass'){
var grd=g.createLinearGradient(wx,wy,wx+ww,wy+wh); grd.addColorStop(0,lit?(warm?'#ffedb5':'#dceef8'):'#cfe6f4'); grd.addColorStop(0.5,lit?(warm?'#f7d98a':'#a8c8de'):'#5f8fb4'); grd.addColorStop(1,lit?(warm?'#e0aa58':'#7d99ae'):'#2a485e');
g.fillStyle=grd; g.fillRect(wx,wy,ww,wh);
g.fillStyle='rgba(255,255,255,0.38)'; g.beginPath(); g.moveTo(wx,wy+wh); g.lineTo(wx+ww*0.55,wy); g.lineTo(wx+ww*0.82,wy); g.lineTo(wx+ww*0.22,wy+wh); g.fill();
g.fillStyle='rgba(255,255,255,0.14)'; g.beginPath(); g.moveTo(wx+ww*0.3,wy+wh); g.lineTo(wx+ww*0.85,wy); g.lineTo(wx+ww,wy); g.lineTo(wx+ww*0.55,wy+wh); g.fill();
if(Math.random()<0.12){ g.fillStyle='rgba(16,26,36,0.30)'; g.fillRect(wx+ww*0.62,wy+wh*0.1,ww*0.3,wh*0.32); } // darker tinted vent pane
} else if(style==='office'){
// exterior curtain wall (plain windows, no interior): reflective glass
// panes — some lit warm for the evening, most mirroring the sky — with a
// darker spandrel band at the sill and a fine aluminium mullion grid
var og2=g.createLinearGradient(wx,wy,wx+ww*0.4,wy+wh);
if(lit){ og2.addColorStop(0,warm?'#ffe9ad':'#e8f3fa'); og2.addColorStop(0.55,warm?'#f3cd78':'#bcd6e6'); og2.addColorStop(1,warm?'#d99f4e':'#8fb0c6'); }
else { var tone2=Math.random(); og2.addColorStop(0,tone2<0.5?'#7d99ae':'#68879e'); og2.addColorStop(0.5,'#476a84'); og2.addColorStop(1,'#24394c'); }
g.fillStyle=og2; g.fillRect(wx,wy,ww,wh);
// diagonal sky reflection bands, like real tower glass catching the sky
g.fillStyle='rgba(255,255,255,0.30)'; g.beginPath(); g.moveTo(wx,wy+wh); g.lineTo(wx+ww*0.5,wy); g.lineTo(wx+ww*0.78,wy); g.lineTo(wx+ww*0.24,wy+wh); g.fill();
g.fillStyle='rgba(255,255,255,0.12)'; g.beginPath(); g.moveTo(wx+ww*0.34,wy+wh); g.lineTo(wx+ww*0.86,wy); g.lineTo(wx+ww,wy); g.lineTo(wx+ww*0.6,wy+wh); g.fill();
// occasional darker tinted vent pane (exterior detail only)
if(Math.random()<0.14){ g.fillStyle='rgba(18,28,38,0.35)'; g.fillRect(wx+ww*0.06,wy+wh*0.12,ww*0.3,wh*0.3); }
// spandrel shadow along the bottom edge of the pane
g.fillStyle='rgba(10,16,22,0.28)'; g.fillRect(wx,wy+wh-4,ww,4);
} else {
var gg2=g.createLinearGradient(wx,wy,wx,wy+wh);
if(lit){ gg2.addColorStop(0,warm?'#ffedb0':'#e6f2fa'); gg2.addColorStop(1,warm?'#eebd6d':'#b9d2e2'); }
else { gg2.addColorStop(0,'#4d6070'); gg2.addColorStop(0.45,win); gg2.addColorStop(1,'#1c2833'); }
g.fillStyle=gg2; g.fillRect(wx,wy,ww,wh);
g.fillStyle='rgba(255,255,255,0.22)'; g.fillRect(wx,wy,ww,6);
g.fillStyle='rgba(0,0,0,0.28)'; g.fillRect(wx+ww/2-1.5,wy,3,wh);
if(Math.random()<0.3){ g.fillStyle='rgba(215,224,230,0.55)'; var bh=wh*(0.3+Math.random()*0.35); g.fillRect(wx,wy+wh-bh,ww,bh); g.fillStyle='rgba(0,0,0,0.2)'; for(var bl2=0;bl2<4;bl2++)g.fillRect(wx,wy+wh-bh+bl2*bh/4,ww,1.5);} // blinds at random heights
if(Math.random()<0.16){ g.fillStyle='rgba(246,242,230,0.5)'; g.fillRect(wx,wy+3,ww*0.42,wh-6);} // curtain half-drawn
if(lit&&Math.random()<0.35){ g.fillStyle='rgba(60,45,25,0.35)'; g.fillRect(wx+ww*0.55,wy+wh*0.3,ww*0.3,wh*0.55);} // occupant silhouette hint
}
// mullions
g.fillStyle='rgba(20,24,28,0.55)'; g.fillRect(wx,wy+wh/2-1.5,ww,3); g.fillRect(wx+ww/3-1,wy,2,wh); g.fillRect(wx+2*ww/3-1,wy,2,wh);
// outdoor AC unit under some windows: box + fan grille + drip stain
if(style!=='glass'&&Math.random()<0.22){ g.fillStyle='#c4c8c4'; g.fillRect(wx+ww*0.18,wy+wh+5,ww*0.34,10); g.fillStyle='rgba(0,0,0,0.3)'; g.fillRect(wx+ww*0.18,wy+wh+15,ww*0.34,2); g.strokeStyle='rgba(40,44,46,0.5)'; g.lineWidth=1; g.beginPath(); g.arc(wx+ww*0.35,wy+wh+10,3.6,0,Math.PI*2); g.stroke(); }
}
// floor slab shadow lines
g.fillStyle='rgba(0,0,0,0.16)'; for(var fy=0;fy<=rows;fy++)g.fillRect(0,fy*ch-1.5,512,3);
// rain streaks running down from window sills + patchy weathering
for(var st2=0;st2<44;st2++){ var sx=Math.random()*500+6, sl=30+Math.random()*130, swd=2.5+Math.random()*6; var sg2=g.createLinearGradient(0,0,0,sl); sg2.addColorStop(0,'rgba(38,36,32,0.20)'); sg2.addColorStop(1,'rgba(38,36,32,0)'); g.save(); g.translate(sx,Math.random()*330); g.fillStyle=sg2; g.fillRect(-swd/2,0,swd,sl); g.restore(); }
for(var wp=0;wp<9;wp++){ g.fillStyle='rgba(52,48,40,'+(0.04+Math.random()*0.06).toFixed(3)+')'; g.beginPath(); g.ellipse(Math.random()*512,Math.random()*512,30+Math.random()*80,18+Math.random()*55,Math.random()*3,0,Math.PI*2); g.fill(); }
g.fillStyle='rgba(255,255,255,0.09)'; for(var hl2=0;hl2<cols;hl2++){ g.fillRect(hl2*cw+3,6,3,500);} // faint sun-bleach edge per bay
// ground-floor dirt gradient
var dg=g.createLinearGradient(0,432,0,512); dg.addColorStop(0,'rgba(40,32,22,0)'); dg.addColorStop(1,'rgba(40,32,22,0.36)'); g.fillStyle=dg; g.fillRect(0,432,512,80);
var t=new THREE.CanvasTexture(c); t.colorSpace=THREE.SRGBColorSpace; t.wrapS=t.wrapT=THREE.RepeatWrapping; t.anisotropy=MAX_ANISO; return t;
}
var texA=buildingTexture('#8a929c','#2f3f50',0.26,'panel');
var texB=buildingTexture('#9a7d63','#36414e',0.18,'brick');
var texC=buildingTexture('#6d8698','#223140',0.34,'panel');
var texGlass=buildingTexture('#4d718f','#bfe2f2',0.48,'glass');
var texOffice=buildingTexture('#46545f','#bfe2f2',0.62,'office');
var texWhite=buildingTexture('#c9c2b2','#33424f',0.22,'panel');
function roadTexture(){
var c=document.createElement('canvas'); c.width=256; c.height=256; var g=c.getContext('2d');
g.fillStyle='#333336'; g.fillRect(0,0,256,256);
for(var n=0;n<2800;n++){ var v=Math.random(); g.fillStyle=v<0.5?'rgba(0,0,0,0.13)':'rgba(255,255,255,0.06)'; g.fillRect(Math.random()*256,Math.random()*256,2.6,2.6);}
// large tonal variation + oil staining along the wheel tracks
for(var tp=0;tp<7;tp++){ g.fillStyle='rgba(16,16,18,'+(0.05+Math.random()*0.08).toFixed(2)+')'; g.beginPath(); g.ellipse(Math.random()*256,Math.random()*256,26+Math.random()*60,14+Math.random()*36,Math.random()*3,0,Math.PI*2); g.fill();}
g.fillStyle='rgba(0,0,0,0.16)'; g.fillRect(0,0,256,12); g.fillRect(0,244,256,12); // worn edges
g.fillStyle='rgba(20,20,22,0.13)'; g.fillRect(0,84,256,15); g.fillRect(0,157,256,15); // polished dark wheel tracks
// dashed centre line (two solid dashes per tile, matching the repeat)
g.fillStyle='#f5efcf'; g.fillRect(122,10,11,88); g.fillRect(122,158,11,88);
g.fillStyle='rgba(51,51,54,0.55)'; for(var wn=0;wn<26;wn++){ g.fillRect(122+Math.random()*11,Math.random()*256,3,3);} // paint chips
g.fillStyle='rgba(255,255,255,0.7)'; g.fillRect(7,0,5,256); g.fillRect(244,0,5,256); // edge lines
g.fillStyle='rgba(51,51,54,0.5)'; for(var wn2=0;wn2<20;wn2++){ g.fillRect(7+Math.random()*5,Math.random()*256,3,4); g.fillRect(244+Math.random()*5,Math.random()*256,3,4);}
// patched repairs, tar cracks and manholes — worn real asphalt
for(var rp=0;rp<4;rp++){ g.fillStyle='rgba(12,12,14,'+(0.13+Math.random()*0.12).toFixed(2)+')'; g.fillRect(Math.random()*190,Math.random()*190,40+Math.random()*48,30+Math.random()*40); g.strokeStyle='rgba(0,0,0,0.35)'; g.lineWidth=2; g.strokeRect(Math.random()*190,Math.random()*190,40,30);}
g.strokeStyle='rgba(10,10,12,0.5)'; g.lineWidth=2.2;
for(var ck=0;ck<6;ck++){ g.beginPath(); var cx0=Math.random()*256, cy0=Math.random()*256; g.moveTo(cx0,cy0); for(var cs=0;cs<4;cs++){ cx0+=rand(-30,30); cy0+=rand(10,38); g.lineTo(cx0,cy0);} g.stroke(); }
[[192,68],[52,196]].forEach(function(mh){ g.fillStyle='rgba(74,76,80,0.95)'; g.beginPath(); g.arc(mh[0],mh[1],13,0,Math.PI*2); g.fill(); g.strokeStyle='rgba(28,28,32,0.85)'; g.lineWidth=3; g.beginPath(); g.arc(mh[0],mh[1],13,0,Math.PI*2); g.stroke(); g.beginPath(); g.arc(mh[0],mh[1],8,0,Math.PI*2); g.stroke(); });
g.fillStyle='rgba(230,225,200,0.13)'; g.fillRect(0,116,256,5); // tyre-polish sheen band
var t=new THREE.CanvasTexture(c); t.wrapS=t.wrapT=THREE.RepeatWrapping; t.colorSpace=THREE.SRGBColorSpace; t.anisotropy=MAX_ANISO; return t;
}
var texRoad=roadTexture();
function groundTexture(){
var c=document.createElement('canvas'); c.width=c.height=256; var g=c.getContext('2d');
g.fillStyle='#7c8468'; g.fillRect(0,0,256,256);
for(var n=0;n<2400;n++){ g.fillStyle='rgba('+(Math.random()<0.5?'38,52,28':'168,172,130')+','+(0.05+Math.random()*0.09).toFixed(2)+')'; g.fillRect(Math.random()*256,Math.random()*256,5,4);}
for(var dp=0;dp<9;dp++){ g.fillStyle='rgba('+(Math.random()<0.5?'96,88,58':'52,66,38')+','+(0.08+Math.random()*0.08).toFixed(2)+')'; g.beginPath(); g.ellipse(Math.random()*256,Math.random()*256,22+Math.random()*48,14+Math.random()*32,Math.random()*3,0,Math.PI*2); g.fill();} // dry / muddy patches
for(var bl=0;bl<520;bl++){ g.strokeStyle='rgba(44,60,32,'+(0.15+Math.random()*0.2).toFixed(2)+')'; g.lineWidth=1.4; var bx3=Math.random()*256, by3=Math.random()*256; g.beginPath(); g.moveTo(bx3,by3); g.lineTo(bx3+rand(-2.5,2.5),by3-4-Math.random()*5); g.stroke();} // grass blades
for(var st3=0;st3<130;st3++){ g.fillStyle='rgba(150,146,132,'+(0.2+Math.random()*0.3).toFixed(2)+')'; g.fillRect(Math.random()*256,Math.random()*256,2.5,2);} // tiny stones / grit
var t=new THREE.CanvasTexture(c); t.wrapS=t.wrapT=THREE.RepeatWrapping; t.repeat.set(40,40); t.colorSpace=THREE.SRGBColorSpace; t.anisotropy=MAX_ANISO; return t;
}
function concreteTexture(){
var c=document.createElement('canvas'); c.width=c.height=256; var g=c.getContext('2d');
g.fillStyle='#cfccc2'; g.fillRect(0,0,256,256);
for(var n=0;n<3200;n++){ var v=Math.random(); g.fillStyle=v<0.5?'rgba(60,58,50,0.07)':'rgba(255,255,250,0.06)'; g.fillRect(Math.random()*256,Math.random()*256,2.4,2.4);}
for(var p=0;p<6;p++){ g.fillStyle='rgba(70,66,56,'+(0.05+Math.random()*0.06).toFixed(2)+')'; g.beginPath(); g.ellipse(Math.random()*256,Math.random()*256,24+Math.random()*52,16+Math.random()*36,Math.random()*3,0,Math.PI*2); g.fill();}
// expansion joints: one cross per tile -> reads as big pavement slabs from the air
g.fillStyle='rgba(52,50,44,0.5)'; g.fillRect(0,0,256,2.4); g.fillRect(0,0,2.4,256);
g.fillStyle='rgba(255,255,250,0.10)'; g.fillRect(0,2.4,256,1.4); g.fillRect(2.4,0,1.4,256);
g.strokeStyle='rgba(50,48,42,0.4)'; g.lineWidth=1.6;
for(var ck=0;ck<4;ck++){ g.beginPath(); var cx0=Math.random()*256, cy0=Math.random()*256; g.moveTo(cx0,cy0); for(var cs=0;cs<3;cs++){ cx0+=rand(-34,34); cy0+=rand(-30,30); g.lineTo(cx0,cy0);} g.stroke(); }
var t=new THREE.CanvasTexture(c); t.wrapS=t.wrapT=THREE.RepeatWrapping; t.repeat.set(26,26); t.colorSpace=THREE.SRGBColorSpace; t.anisotropy=MAX_ANISO; return t;
}
function smokeSprite(){
var c=document.createElement('canvas'); c.width=64; c.height=64; var g=c.getContext('2d');
var gr=g.createRadialGradient(32,32,2,32,32,30);
gr.addColorStop(0,'rgba(255,255,255,1)'); gr.addColorStop(0.55,'rgba(255,255,255,.55)'); gr.addColorStop(1,'rgba(255,255,255,0)');
g.fillStyle=gr; g.fillRect(0,0,64,64);
var t=new THREE.CanvasTexture(c); return t;
}
var texPuff=smokeSprite();
function glowTexture(){
var c=document.createElement('canvas'); c.width=c.height=128; var g=c.getContext('2d');
var gr=g.createRadialGradient(64,64,2,64,64,62);
gr.addColorStop(0,'rgba(255,255,255,1)'); gr.addColorStop(0.35,'rgba(255,255,255,0.42)'); gr.addColorStop(1,'rgba(255,255,255,0)');
g.fillStyle=gr; g.fillRect(0,0,128,128);
return new THREE.CanvasTexture(c);
}
var texGlow=glowTexture();

/* ================= world ================= */
var WORLD=150; // half-extent of city
var PAD={x:22,z:-22,r:8.5}; // heliport = departure point (open plaza block)
/* ================= WORLD v2 core: noise, terrain function, biome, sky, water ================= */
var W2={CS:256,WL:-0.5,chunks:{},queue:[],far:null,farKey:'',R:3,ready:false,lastCx:1e9,lastCz:1e9,seedX:137.31,seedZ:71.77,
dist:2,sky:null,water:null,lite:null,enabled:true,metro:false};
function w2h(ix,iz){ var h=(ix*374761393+iz*668265263)|0; h=Math.imul(h^(h>>>13),1274126177); h^=h>>>16; return (h>>>0)/4294967296; }
function w2vn(x,z){ var ix=Math.floor(x),iz=Math.floor(z),fx=x-ix,fz=z-iz; var u=fx*fx*(3-2*fx),v=fz*fz*(3-2*fz); var a=w2h(ix,iz),b=w2h(ix+1,iz),c=w2h(ix,iz+1),d=w2h(ix+1,iz+1); return a+(b-a)*u+(c-a)*v+(a-b-c+d)*u*v; }
function w2fbm(x,z,o){ var s=0,a=0.5,f=1,n=0; for(var i=0;i<o;i++){ s+=w2vn(x*f+i*17.3,z*f+i*9.1)*a; n+=a; a*=0.5; f*=2.03; } return s/n; }
function sst(a,b,x){ var t=Math.min(1,Math.max(0,(x-a)/(b-a))); return t*t*(3-2*t); }
function w2townD(x,z){
var cc=w2fbm(x*0.00042+W2.seedX*0.1+11.3,z*0.00042+4.7,4);
var t=w2fbm(x*0.0010+200+W2.seedX,z*0.0010+300+W2.seedZ,3);
var d=sst(0.55,0.66,t),dd=Math.max(Math.abs(x),Math.abs(z));
if(W2.metro)d=Math.max(d,0.93*(1-sst(1800,4300,dd)));
return d*(W2.metro?1:(1-sst(0.56,0.68,cc)))*sst(300,520,dd);
}
function w2forestD(x,z){ return w2fbm(x*0.0034+90+W2.seedX,z*0.0034+33,3); }
function terrainH(x,z){
var c=w2fbm(x*0.00042+W2.seedX*0.1+11.3,z*0.00042+4.7,4);
var d=Math.max(Math.abs(x),Math.abs(z));
var cc=c+(1-sst(0,2400,d))*0.2;
var m=w2fbm(x*0.0012+3.1,z*0.0012+91.7,5);
var rg=1-Math.abs(w2fbm(x*0.0006+40,z*0.0006+17,4)*2-1); rg=rg*rg;
var mountain=sst(0.55,0.80,cc)*(rg*860+m*170);
var plain=(cc-0.40)*170;
var hills=sst(0.38,0.6,cc)*(m*80+w2fbm(x*0.006,z*0.006,3)*16);
var h=plain+hills+mountain;
var td=w2townD(x,z),tf=sst(0.25,0.75,td); if(tf>0.001)h=lerp(h,Math.max(Math.min(h,40),1.5)*0.12+1.2,tf);
var k=sst(330,780,d);
return lerp(-0.22,h,k);
}
function groundY(x,z){ var h=terrainH(x,z); return h>0?h:0; }
function palette(hex){ var c=new THREE.Color(hex); return [c.r,c.g,c.b]; }
var PAL={g1:palette(0x58853a),g2:palette(0x7b9b48),dry:palette(0xa3a05a),forest:palette(0x2b5428),rock:palette(0x7d776c),snow:palette(0xeef2f6),sand:palette(0xcdbd8c),town:palette(0x7f817c),mud:palette(0x6b5a40),tundra:palette(0x8c8f76)};
function mix3(o,p,k){ o[0]+=(p[0]-o[0])*k; o[1]+=(p[1]-o[1])*k; o[2]+=(p[2]-o[2])*k; }
function biome(h,sl,x,z,o,td,fd){
var n1=w2fbm(x*0.011,z*0.011,2);
o[0]=PAL.g1[0]+(PAL.g2[0]-PAL.g1[0])*n1; o[1]=PAL.g1[1]+(PAL.g2[1]-PAL.g1[1])*n1; o[2]=PAL.g1[2]+(PAL.g2[2]-PAL.g1[2])*n1;
var dry=sst(0.52,0.66,w2fbm(x*0.0026+50,z*0.0026+8,2)); mix3(o,PAL.dry,dry*0.75);
var hiAlt=sst(260,520,h); mix3(o,PAL.tundra,hiAlt*0.7);
if(fd!==undefined)mix3(o,PAL.forest,sst(0.5,0.62,fd)*(1-hiAlt)*0.9);
mix3(o,PAL.rock,Math.min(1,sst(0.38,0.75,sl)+sst(420,820,h+n1*60)*0.65));
var sn=sst(620,820,h+n1*90); mix3(o,PAL.snow,sn*(1-sst(0.7,1.1,sl)*0.55));
mix3(o,PAL.sand,sst(2.6,0.0,h)*0.9*sst(330,800,Math.max(Math.abs(x),Math.abs(z))));
if(td)mix3(o,PAL.town,td*0.85);
}
/* ---- sky: gradient + sun disc/halo, follows the camera ---- */
function buildSky(){
var mat=new THREE.ShaderMaterial({
uniforms:{uSunDir:{value:new THREE.Vector3(0.8,0.5,0.4)},uSunCol:{value:new THREE.Color(1,0.9,0.7)},uFog:{value:new THREE.Color(0xd9c9a8)},uDusk:{value:0},uAlt:{value:0},uNight:{value:0},uMoonDir:{value:new THREE.Vector3(-0.8,0.5,-0.4)}},
vertexShader:'varying vec3 vDir; void main(){ vDir=position; vec4 p=modelViewMatrix*vec4(position,1.0); gl_Position=projectionMatrix*p; gl_Position.z=gl_Position.w*0.99999; }',
fragmentShader:[
'uniform vec3 uSunDir,uSunCol,uFog,uMoonDir; uniform float uDusk,uAlt,uNight; varying vec3 vDir;',
'void main(){',
' vec3 d=normalize(vDir); float h=d.y;',
' float alt=clamp(uAlt/6000.0,0.0,1.0);',
' vec3 zen=mix(vec3(0.045,0.19,0.50),vec3(0.015,0.07,0.28),alt); zen=mix(zen,vec3(0.05,0.07,0.22),uDusk*0.7);',
' vec3 mid=mix(vec3(0.20,0.45,0.78),vec3(0.10,0.28,0.62),alt); mid=mix(mid,vec3(0.45,0.38,0.50),uDusk*0.6);',
' zen=mix(zen,vec3(0.004,0.010,0.034),uNight); mid=mix(mid,vec3(0.012,0.026,0.075),uNight);',
' vec3 hor=uFog*vec3(1.08,1.06,1.05);',
' float t=clamp(h,0.0,1.0);',
' vec3 col=mix(hor,mid,smoothstep(0.0,0.22,t)); col=mix(col,zen,smoothstep(0.18,0.85,t));',
' float below=smoothstep(0.0,-0.25,h); col=mix(col,uFog,below);',
' float s=max(dot(d,normalize(uSunDir)),0.0);',
' vec3 sc=uSunCol;',
' float dayV=1.0-uNight; col+=sc*(pow(s,6.0)*0.10+pow(s,40.0)*0.28+pow(s,400.0)*0.9)*(1.0-below)*dayV;',
' float disc=smoothstep(0.99992,0.99997,s); col+=sc*disc*24.0*(1.0-below)*dayV;',
' vec3 sdd=floor(d*190.0); float hsh=fract(sin(dot(sdd,vec3(12.9898,78.233,37.719)))*43758.5453); float star=smoothstep(0.9962,1.0,hsh)*smoothstep(0.02,0.3,t)*uNight; col+=vec3(1.0,0.95,0.9)*star*(0.5+1.4*fract(hsh*57.0));',
' float ms=max(dot(d,normalize(uMoonDir)),0.0); col+=vec3(0.78,0.85,1.0)*(smoothstep(0.99955,0.99975,ms)*7.0+pow(ms,70.0)*0.28)*uNight*(1.0-below);',
' gl_FragColor=vec4(col,1.0);',
' #include <tonemapping_fragment>',
' #include <colorspace_fragment>',
'}'].join('\n'),side:THREE.BackSide,depthWrite:false,fog:false});
var m=new THREE.Mesh(new THREE.SphereGeometry(1,32,18),mat); m.renderOrder=-20; m.frustumCulled=false; scene.add(m); W2.sky=m;
}
function nrmTex(){
var S=256,c=document.createElement('canvas'); c.width=c.height=S; var g=c.getContext('2d'); var id=g.createImageData(S,S);
var H=new Float32Array(S*S);
for(var y=0;y<S;y++)for(var x=0;x<S;x++){ var v=0,a=0.5,f=4; for(var o=0;o<4;o++){ var fx=x/S*f,fy=y/S*f,ix=Math.floor(fx),iy=Math.floor(fy),tx=fx-ix,ty=fy-iy; tx=tx*tx*(3-2*tx); ty=ty*ty*(3-2*ty); var s=f|0; var a1=w2h((ix%s)+o*50,(iy%s)),b1=w2h(((ix+1)%s)+o*50,(iy%s)),c1=w2h((ix%s)+o*50,((iy+1)%s)),d1=w2h(((ix+1)%s)+o*50,((iy+1)%s)); v+=((a1+(b1-a1)*tx)*(1-ty)+(c1+(d1-c1)*tx)*ty)*a; a*=0.5; f*=2; } H[y*S+x]=v; }
for(var y2=0;y2<S;y2++)for(var x2=0;x2<S;x2++){ var l=H[y2*S+(x2+S-1)%S],r=H[y2*S+(x2+1)%S],u=H[((y2+S-1)%S)*S+x2],d=H[((y2+1)%S)*S+x2]; var nx=(l-r)*6,ny=(u-d)*6,nz=1; var il=1/Math.sqrt(nx*nx+ny*ny+nz*nz); var p=(y2*S+x2)*4; id.data[p]=(nx*il*0.5+0.5)*255; id.data[p+1]=(ny*il*0.5+0.5)*255; id.data[p+2]=(nz*il*0.5+0.5)*255; id.data[p+3]=255; }
g.putImageData(id,0,0);
var t=new THREE.CanvasTexture(c); t.wrapS=t.wrapT=THREE.RepeatWrapping; t.repeat.set(1,1); t.anisotropy=MAX_ANISO; return t;
}
function buildWater(){
var nt=nrmTex(); nt.repeat.set(220,220);
var mat=new THREE.MeshStandardMaterial({color:0x1f5f7c,roughness:0.07,metalness:0.0,transparent:true,opacity:0.9,normalMap:nt,normalScale:new THREE.Vector2(0.55,0.55)});
regEnv(mat,1.4);
var g=new THREE.PlaneGeometry(24000,24000); g.rotateX(-Math.PI/2);
var m=new THREE.Mesh(g,mat); m.position.y=W2.WL; m.renderOrder=2; m.receiveShadow=false; scene.add(m); W2.water=m;
}
function w2Fog(dk){
var alt=Math.max(0,heliState.pos.y);
var base=[1500,2700,4800,7600][(W2.dist||2)-1];
var far=base*(1+Math.min(alt,1600)/800);
scene.fog.far=far; scene.fog.near=Math.max(140,far*0.16);
camera.far=Math.max(3000,far*1.9); camera.near=alt>120?1.0:0.35; camera.updateProjectionMatrix();
}
function w2Update(dt){
if(!W2.ready)return;
var cp=camera.position;
W2.sky.position.copy(cp); W2.sky.scale.setScalar(camera.far*0.9);
var su=W2.sky.material.uniforms;
su.uSunDir.value.copy(TOD.sunDir); su.uMoonDir.value.copy(TOD.moonDir); su.uSunCol.value.copy(sun.color); su.uFog.value.copy(scene.fog.color); su.uDusk.value=DUSK.sunset; su.uNight.value=DUSK.night; su.uAlt.value=cp.y;
W2.water.position.x=Math.round(cp.x/50)*50; W2.water.position.z=Math.round(cp.z/50)*50;
W2.water.material.normalMap.offset.x=(performance.now()*0.00002)%1; W2.water.material.normalMap.offset.y=(performance.now()*0.000012)%1;
W2.water.material.color.setRGB(0.12*(1-DUSK.night*0.8),0.37*(1-DUSK.night*0.8),0.49*(1-DUSK.night*0.75));
// shadow camera follows the player (snapped to the shadow texel grid)
var tx=Math.round(heliState.pos.x/6)*6, tz=Math.round(heliState.pos.z/6)*6, ty=Math.round(Math.max(0,groundY(heliState.pos.x,heliState.pos.z))/6)*6;
sun.target.position.set(tx,ty,tz); var ld=TOD.lightDir,ly=Math.max(ld.y,0.2),ll=Math.sqrt(ld.x*ld.x+ly*ly+ld.z*ld.z); sun.position.set(tx+ld.x/ll*190,ty+ly/ll*190,tz+ld.z/ll*190); sun.target.updateMatrixWorld();
}

/* ================= WORLD v2 chunks: terrain LOD, far horizon mesh, towns, forests ================= */
var W2A={};
function w2NByRing(r){ return r<=1?64:(r===2?48:(r<=4?32:20)); }
function mergeGeo(list){
var pos=[],nor=[],col=[],idx=[],off=0;
list.forEach(function(it){ var g=it.g; var p=g.attributes.position,n=g.attributes.normal,c=new THREE.Color(it.color);
for(var i=0;i<p.count;i++){ pos.push(p.getX(i),p.getY(i),p.getZ(i)); nor.push(n.getX(i),n.getY(i),n.getZ(i)); col.push(c.r*(it.shade||1),c.g*(it.shade||1),c.b*(it.shade||1)); }
if(g.index){ for(var k=0;k<g.index.count;k++)idx.push(g.index.getX(k)+off); } else { for(var q=0;q<p.count;q++)idx.push(q+off); }
off+=p.count; });
var G=new THREE.BufferGeometry(); G.setAttribute('position',new THREE.Float32BufferAttribute(pos,3)); G.setAttribute('normal',new THREE.Float32BufferAttribute(nor,3)); G.setAttribute('color',new THREE.Float32BufferAttribute(col,3)); G.setIndex(idx); return G;
}
function w2Shared(){
// facade atlas: 4 bays x 4 floors, some lit windows (glow at dusk)
var c=document.createElement('canvas'); c.width=c.height=256; var g=c.getContext('2d');
g.fillStyle='#b9b8b1'; g.fillRect(0,0,256,256);
for(var fy=0;fy<4;fy++)for(var bx=0;bx<4;bx++){
var x=bx*64,y=fy*64; g.fillStyle='rgba(60,58,52,0.10)'; g.fillRect(x,y+60,64,4); g.fillStyle='rgba(255,255,255,0.12)'; g.fillRect(x,y,64,2);
var lit=Math.random()<0.26; g.fillStyle=lit?(Math.random()<0.5?'#ffd791':'#ffe9b8'):(Math.random()<0.5?'#31465c':'#3b5068');
g.fillRect(x+9,y+12,46,34);
g.fillStyle='rgba(255,255,255,'+(lit?0.18:0.22)+')'; g.fillRect(x+9,y+12,46,9);
g.fillStyle='rgba(20,22,24,0.55)'; g.fillRect(x+31,y+12,2,34); g.fillRect(x+9,y+29,46,2);
g.fillStyle='rgba(40,38,34,0.35)'; g.fillRect(x+7,y+46,50,3);
}
for(var n=0;n<2500;n++){ g.fillStyle='rgba(0,0,0,'+(Math.random()*0.05).toFixed(3)+')'; g.fillRect(Math.random()*256,Math.random()*256,2,2); }
var ft=new THREE.CanvasTexture(c); ft.wrapS=ft.wrapT=THREE.RepeatWrapping; ft.colorSpace=THREE.SRGBColorSpace; ft.anisotropy=MAX_ANISO; W2A.fac=ft;
W2A.uDusk={value:0};
var bm=new THREE.MeshStandardMaterial({map:ft,roughness:0.72,metalness:0.08}); regEnv(bm,0.85);
bm.onBeforeCompile=function(sh){
sh.uniforms.uDusk=W2A.uDusk;
sh.vertexShader='attribute vec4 aDim; attribute vec3 aTint; varying vec2 vWUv; varying vec3 vTint; varying float vTop;\n'+sh.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\n float hz=abs(normal.x)>0.5?aDim.z:aDim.x; vWUv=vec2(uv.x*hz/40.0+aDim.w,uv.y*aDim.y/13.6); vTint=aTint; vTop=step(0.5,normal.y);');
sh.fragmentShader='uniform float uDusk; varying vec2 vWUv; varying vec3 vTint; varying float vTop; float wGl2=0.0;\n'+sh.fragmentShader.replace('#include <map_fragment>','vec4 wt=texture2D(map,vWUv); vec3 wall=mix(wt.rgb*vTint,vTint*0.42,vTop); diffuseColor.rgb*=wall*1.5; wGl2=(1.0-smoothstep(0.26,0.55,dot(wt.rgb,vec3(0.3333))))*(1.0-vTop);').replace('#include <roughnessmap_fragment>','float roughnessFactor=roughness*mix(1.0,0.14,wGl2);').replace('#include <metalnessmap_fragment>','float metalnessFactor=clamp(metalness+wGl2*0.42,0.0,1.0);').replace('#include <emissivemap_fragment>','#include <emissivemap_fragment>\n float litw=step(0.78,wt.r)*step(wt.b,0.62)*(1.0-vTop); totalEmissiveRadiance+=vec3(1.0,0.72,0.34)*litw*(0.12+uDusk*1.6);');
};
bm.customProgramCacheKey=function(){ return 'w2bld'; };
W2A.bmat=bm;
var rm=new THREE.MeshStandardMaterial({color:0xffffff,roughness:0.85}); W2A.rmat=rm;
var cone=new THREE.ConeGeometry(2.6,7.5,7); cone.translate(0,6.4,0);
var cone2=new THREE.ConeGeometry(1.9,5.2,7); cone2.translate(0,9.3,0);
var trunk=new THREE.CylinderGeometry(0.35,0.5,3,5); trunk.translate(0,1.5,0);
W2A.treeGeo=mergeGeo([{g:trunk,color:0x4a3a2a},{g:cone,color:0x3f7a3a,shade:0.92},{g:cone2,color:0x4c8a42,shade:1.05}]);
W2A.treeMat=new THREE.MeshStandardMaterial({vertexColors:true,roughness:0.9,flatShading:true});
var rg=new THREE.BufferGeometry(); // gable roof prism, unit footprint, unit height
var rp=[-0.5,0,-0.5, 0.5,0,-0.5, 0,1,-0.5,  -0.5,0,0.5, 0,1,0.5, 0.5,0,0.5,  -0.5,0,-0.5, 0,1,-0.5, 0,1,0.5, -0.5,0,-0.5, 0,1,0.5, -0.5,0,0.5,  0.5,0,-0.5, 0.5,0,0.5, 0,1,0.5, 0.5,0,-0.5, 0,1,0.5, 0,1,-0.5];
rg.setAttribute('position',new THREE.Float32BufferAttribute(rp,3)); rg.computeVertexNormals(); W2A.roofGeo=rg;
W2A.terrMat=new THREE.MeshStandardMaterial({vertexColors:true,roughness:1,metalness:0}); W2A.dnorm=nrmTex(); W2A.dnorm.repeat.set(26,26);
W2A.dummy=new THREE.Object3D();
}
function w2BuildChunk(cx,cz,ring,old){
var CS=W2.CS,N=w2NByRing(ring),x0=cx*CS,z0=cz*CS,cell=CS/N,M=N+3;
var Hg=new Float32Array(M*M);
for(var j=-1;j<=N+1;j++)for(var i=-1;i<=N+1;i++)Hg[(j+1)*M+(i+1)]=terrainH(x0+i*cell,z0+j*cell);
var NV=(N+1)*(N+1),SK=4*(N+1),TV=NV+SK;
var pos=new Float32Array(TV*3),nor=new Float32Array(TV*3),col=new Float32Array(TV*3),uv=new Float32Array(TV*2),tdG=new Float32Array(NV);
var o=[0,0,0],hasMap=ring<=2;
for(var j2=0;j2<=N;j2++)for(var i2=0;i2<=N;i2++){
var k=j2*(N+1)+i2,h=Hg[(j2+1)*M+(i2+1)],wx=x0+i2*cell,wz=z0+j2*cell;
var dx=(Hg[(j2+1)*M+(i2+2)]-Hg[(j2+1)*M+i2])/(2*cell),dz=(Hg[(j2+2)*M+(i2+1)]-Hg[j2*M+(i2+1)])/(2*cell);
var il=1/Math.sqrt(dx*dx+1+dz*dz); pos[k*3]=wx; pos[k*3+1]=h; pos[k*3+2]=wz; nor[k*3]=-dx*il; nor[k*3+1]=il; nor[k*3+2]=-dz*il;
var td=w2townD(wx,wz),fd=w2forestD(wx,wz); tdG[k]=td;
biome(h,Math.sqrt(dx*dx+dz*dz),wx,wz,o,td,fd); col[k*3]=o[0]; col[k*3+1]=o[1]; col[k*3+2]=o[2];
uv[k*2]=i2/N; uv[k*2+1]=1-j2/N;
}
var sk=NV;
function skirt(ei){ var s=sk++; pos[s*3]=pos[ei*3]; pos[s*3+1]=pos[ei*3+1]-45; pos[s*3+2]=pos[ei*3+2]; nor[s*3]=nor[ei*3]; nor[s*3+1]=nor[ei*3+1]; nor[s*3+2]=nor[ei*3+2]; col[s*3]=col[ei*3]; col[s*3+1]=col[ei*3+1]; col[s*3+2]=col[ei*3+2]; uv[s*2]=uv[ei*2]; uv[s*2+1]=uv[ei*2+1]; return s; }
var edges=[[],[],[],[]];
for(var q=0;q<=N;q++){ edges[0].push([q,skirt(q)]); edges[1].push([N*(N+1)+q,skirt(N*(N+1)+q)]); edges[2].push([q*(N+1),skirt(q*(N+1))]); edges[3].push([q*(N+1)+N,skirt(q*(N+1)+N)]); }
var idx=[];
for(var j3=0;j3<N;j3++)for(var i3=0;i3<N;i3++){ var a=j3*(N+1)+i3,b=(j3+1)*(N+1)+i3,c2=a+1,d2=b+1; idx.push(a,b,c2,c2,b,d2); }
edges.forEach(function(E){ for(var e=0;e<N;e++){ var A=E[e][0],B=E[e+1][0],As=E[e][1],Bs=E[e+1][1]; idx.push(A,B,As,B,Bs,As, A,As,B,B,As,Bs); } });
var geo=new THREE.BufferGeometry(); geo.setAttribute('position',new THREE.BufferAttribute(pos,3)); geo.setAttribute('normal',new THREE.BufferAttribute(nor,3)); geo.setAttribute('color',new THREE.BufferAttribute(col,3)); geo.setAttribute('uv',new THREE.BufferAttribute(uv,2)); geo.setIndex(new THREE.BufferAttribute(TV>65000?new Uint32Array(idx):new Uint16Array(idx),1));
geo.computeBoundingSphere();
var chunk=old||{cx:cx,cz:cz,group:new THREE.Group()};
if(old){ w2DisposeParts(chunk); }
chunk.N=N; chunk.ring=ring; chunk.hasMap=hasMap;
var mat=W2A.terrMat,tex=null;
if(hasMap){
var S=256,cv=document.createElement('canvas'); cv.width=cv.height=S; var cg=cv.getContext('2d'); var id=cg.createImageData(S,S),d=id.data;
for(var py=0;py<S;py++){ var vv=py/S*N,j4=Math.min(N-1,Math.floor(vv)),fy=vv-j4;
for(var px=0;px<S;px++){
var uu=px/S*N,i4=Math.min(N-1,Math.floor(uu)),fx=uu-i4;
var k00=j4*(N+1)+i4,k10=k00+1,k01=k00+N+1,k11=k01+1;
var w00=(1-fx)*(1-fy),w10=fx*(1-fy),w01=(1-fx)*fy,w11=fx*fy;
var r=col[k00*3]*w00+col[k10*3]*w10+col[k01*3]*w01+col[k11*3]*w11,g2=col[k00*3+1]*w00+col[k10*3+1]*w10+col[k01*3+1]*w01+col[k11*3+1]*w11,b=col[k00*3+2]*w00+col[k10*3+2]*w10+col[k01*3+2]*w01+col[k11*3+2]*w11;
var td2=tdG[k00]*w00+tdG[k10]*w10+tdG[k01]*w01+tdG[k11]*w11;
var wx2=x0+(px+0.5)/S*CS,wz2=z0+(py+0.5)/S*CS;
var gr=0.86+0.28*w2vn(wx2*0.42,wz2*0.42)*0.6+0.14*w2vn(wx2*1.7,wz2*1.7);
if(td2>0.28){
var mx=((wx2%60)+60)%60,mz=((wz2%60)+60)%60; var dxr=Math.min(mx,60-mx),dzr=Math.min(mz,60-mz),rd=Math.min(dxr,dzr);
if(rd<5.2){ var dash=(dxr<dzr?Math.floor(wz2/6):Math.floor(wx2/6))%2===0; if(rd<0.28&&dash){ r=0.55;g2=0.46;b=0.12; } else { var a2=0.12+0.03*w2vn(wx2*0.8,wz2*0.8); r=a2;g2=a2;b=a2*1.04; } }
else if(rd<7){ r=0.36;g2=0.36;b=0.35; }
else { r=r*0.7+0.1;g2=g2*0.7+0.1;b=b*0.7+0.1; }
} else if(td2<0.05&&col[k00*3+1]>col[k00*3]&&w2forestD(wx2*0.5,wz2*0.5)<0.5){
var pi=Math.floor(wx2/90),pj=Math.floor(wz2/70),hh=w2h(pi+100,pj+200);
if(hh<0.55){ var stripe=(Math.floor((hh<0.3?wx2:wz2)/3.2)%2===0)?1:0.88; var pr=hh<0.18?[0.62,0.55,0.22]:(hh<0.36?[0.30,0.50,0.20]:(hh<0.46?[0.46,0.38,0.24]:[0.42,0.56,0.24])); r=(r*0.35+pr[0]*0.65)*stripe;g2=(g2*0.35+pr[1]*0.65)*stripe;b=(b*0.35+pr[2]*0.65)*stripe; }
}
var p=(py*S+px)*4; d[p]=Math.min(255,Math.pow(r*gr,1/2.2)*255); d[p+1]=Math.min(255,Math.pow(g2*gr,1/2.2)*255); d[p+2]=Math.min(255,Math.pow(b*gr,1/2.2)*255); d[p+3]=255;
}}
cg.putImageData(id,0,0);
tex=new THREE.CanvasTexture(cv); tex.colorSpace=THREE.SRGBColorSpace; tex.anisotropy=MAX_ANISO; tex.wrapS=tex.wrapT=THREE.ClampToEdgeWrapping;
mat=new THREE.MeshStandardMaterial({map:tex,roughness:0.95,metalness:0,normalMap:W2A.dnorm,normalScale:new THREE.Vector2(0.55,0.55)}); chunk.tex=tex; chunk.mat=mat;
}
var mesh=new THREE.Mesh(geo,mat); mesh.receiveShadow=ring<=1; mesh.frustumCulled=true; chunk.mesh=mesh; chunk.geo=geo; chunk.group.add(mesh);
chunk.Hg=Hg; chunk.hasDecor=false;
if(ring<=Math.min(W2.R,4)){ w2BuildDecor(chunk,ring); }
if(!old)scene.add(chunk.group);
return chunk;
}
function w2DisposeParts(ch){
if(ch.geo)ch.geo.dispose(); if(ch.tex){ ch.tex.dispose(); } if(ch.mat)ch.mat.dispose();
for(var i=ch.group.children.length-1;i>=0;i--){ var c=ch.group.children[i]; ch.group.remove(c); if(c.isInstancedMesh){ c.geometry.dispose(); c.dispose&&c.dispose(); } }
ch.geo=ch.tex=ch.mat=null;
}
function w2BuildDecor(ch,ring){
var CS=W2.CS,x0=ch.cx*CS,z0=ch.cz*CS,A=W2A;
var specs=[],roofs=[],ruins=[];
function addSpec(sp){ if(W2.destroyed[w2SpecKey(sp)]){ ruins.push(sp); return false; } sp.bi=specs.length; specs.push(sp); return true; }
var bx0=Math.floor(x0/60),bx1=Math.floor((x0+CS)/60),bz0=Math.floor(z0/60),bz1=Math.floor((z0+CS)/60);
for(var bx=bx0;bx<=bx1;bx++)for(var bz=bz0;bz<=bz1;bz++){
var cxb=bx*60+30,czb=bz*60+30; if(cxb<x0||cxb>=x0+CS||czb<z0||czb>=z0+CS)continue;
var td=w2townD(cxb,czb); if(td<0.32)continue;
var by=terrainH(cxb,czb); if(by<1)continue;
var r1=w2h(bx*7+3,bz*11+5),r2=w2h(bx*13+9,bz*5+1),r3=w2h(bx*3+31,bz*17+2);
if(td>0.78&&r1<0.5){ var w=rand2(r2,22,34),d=rand2(r3,22,34),h=46+Math.pow(r1*2,0.8)*(td-0.6)*330+r2*30;
addSpec({x:cxb,z:czb,y:by,w:w,d:d,h:h,t:[0.62,0.74,0.9],tw:true});
if(r3<0.4)addSpec({x:cxb+(r2<0.5?-20:20),z:czb+(r3<0.2?-20:20),y:by,w:12,d:12,h:h*0.38,t:[0.82,0.84,0.88]});
} else if(td>0.5){
for(var k=0;k<4;k++){ var rr=w2h(bx*31+k,bz*37+k*5); if(rr<0.18)continue; var ox=(k%2?-1:1)*rand2(rr,12,16),oz=(k<2?-1:1)*rand2(w2h(k+bx,bz*3),12,16);
var hh=14+rr*(td-0.3)*95; addSpec({x:cxb+ox*0.9,z:czb+oz*0.9,y:by,w:rand2(rr*3%1,15,22),d:rand2(rr*7%1,15,22),h:hh,t:[0.88-rr*0.18,0.87-rr*0.12,0.82+rr*0.05],setback:rr>0.55}); }
} else {
for(var hx=0;hx<3;hx++)for(var hz=0;hz<2;hz++){ var rr2=w2h(bx*53+hx*7,bz*59+hz*3); if(rr2<0.12)continue; var w2_=rand2(rr2,8,11),d2_=rand2(rr2*3%1,8,11);
var hy=terrainH(cxb+(hx-1)*17,czb+(hz-0.5)*26); var sp={x:cxb+(hx-1)*17+rand2(rr2*5%1,-2,2),z:czb+(hz-0.5)*26+rand2(rr2*9%1,-2,2),y:hy,w:w2_,d:d2_,h:5+rr2*2.4,t:[0.9,0.86-rr2*0.1,0.78+rr2*0.1],house:true};
if(addSpec(sp)){ sp.ri=roofs.length; roofs.push({x:sp.x,y:hy+sp.h,z:sp.z,w:w2_*1.12,d:d2_*1.12,h:3+rr2*1.6,c:[0x8c4a34,0x6a4a3c,0x555d66,0x7a5a3a][Math.floor(rr2*4)%4]}); } }
}
}
ch.specs=specs; ch.im=ch.cim=ch.rim=null;
if(ruins.length){ var rg2=new THREE.BoxGeometry(1,1,1); rg2.translate(0,0.5,0); var rmm=new THREE.InstancedMesh(rg2,new THREE.MeshStandardMaterial({color:0x4a4640,roughness:1}),ruins.length); ruins.forEach(function(r,i){ A.dummy.position.set(r.x,r.y-0.5,r.z); A.dummy.rotation.set(0,0,0); A.dummy.scale.set(r.w*0.92,2.4+(r.h>30?2.5:0),r.d*0.92); A.dummy.updateMatrix(); rmm.setMatrixAt(i,A.dummy.matrix); }); rmm.frustumCulled=false; ch.group.add(rmm); }
if(specs.length){
var n=specs.length,bg=new THREE.BoxGeometry(1,1,1); bg.translate(0,0.5,0);
var dim=new Float32Array(n*4),tint=new Float32Array(n*3);
var im=new THREE.InstancedMesh(bg,A.bmat,n),D=A.dummy;
for(var i=0;i<n;i++){ var s=specs[i]; D.position.set(s.x,s.y-6,s.z); D.rotation.set(0,0,0); D.scale.set(s.w,s.h+6,s.d); D.updateMatrix(); im.setMatrixAt(i,D.matrix);
dim[i*4]=s.w; dim[i*4+1]=s.h+6; dim[i*4+2]=s.d; dim[i*4+3]=w2h(Math.floor(s.x),Math.floor(s.z)); tint[i*3]=s.t[0]; tint[i*3+1]=s.t[1]; tint[i*3+2]=s.t[2]; }
bg.setAttribute('aDim',new THREE.InstancedBufferAttribute(dim,4)); bg.setAttribute('aTint',new THREE.InstancedBufferAttribute(tint,3));
im.castShadow=ring<=1; im.receiveShadow=ring<=1; im.frustumCulled=false; ch.group.add(im); ch.im=im;
// rooftop crown for towers: stepped crown + mast so skylines are not flat-topped
var crowns=specs.filter(function(s){ return s.tw; });
if(crowns.length){ var cg=new THREE.BoxGeometry(1,1,1); cg.translate(0,0.5,0); var cim=new THREE.InstancedMesh(cg,new THREE.MeshStandardMaterial({color:0x8d9399,roughness:0.5,metalness:0.4}),crowns.length*2);
var ci=0; crowns.forEach(function(s){ s.ci=ci; D.position.set(s.x,s.y+s.h,s.z); D.scale.set(s.w*0.62,s.h*0.05+2,s.d*0.62); D.updateMatrix(); cim.setMatrixAt(ci++,D.matrix); D.position.set(s.x,s.y+s.h+s.h*0.05+2,s.z); D.scale.set(0.9,s.h*0.16+6,0.9); D.updateMatrix(); cim.setMatrixAt(ci++,D.matrix); });
cim.frustumCulled=false; cim.castShadow=ring<=1; ch.group.add(cim); ch.cim=cim; }
}
if(roofs.length){ var rim=new THREE.InstancedMesh(A.roofGeo.clone(),A.rmat,roofs.length),cc=new THREE.Color(); roofs.forEach(function(r,i){ D2(A.dummy,r.x,r.y,r.z,r.w,r.h,r.d); rim.setMatrixAt(i,A.dummy.matrix); cc.setHex(r.c); rim.setColorAt(i,cc); }); rim.frustumCulled=false; rim.castShadow=ring<=1; ch.group.add(rim); ch.rim=rim; }
// forests
if(ring<=3){
var trees=[],sp2=11;
for(var gx=0;gx<CS/sp2;gx++)for(var gz=0;gz<CS/sp2;gz++){
var hx2=x0+gx*sp2,hz2=z0+gz*sp2,rx=w2h(Math.floor(hx2),Math.floor(hz2)),rz=w2h(Math.floor(hz2)+7,Math.floor(hx2)+3);
var tx=hx2+rx*sp2,tz=hz2+rz*sp2,fd=w2forestD(tx,tz); if(fd<0.5+rx*0.12)continue; if(w2townD(tx,tz)>0.1)continue;
var ty=terrainH(tx,tz); if(ty<2.5||ty>470)continue; if(Math.abs(terrainH(tx+4,tz)-ty)>2.6)continue; if(Math.max(Math.abs(tx),Math.abs(tz))<340)continue;
trees.push([tx,ty,tz,0.8+rz*1.1]); if(trees.length>380)break; }
if(trees.length){ var tm=new THREE.InstancedMesh(A.treeGeo,A.treeMat,trees.length),tc=new THREE.Color(); trees.forEach(function(t,i){ A.dummy.position.set(t[0],t[1]-0.4,t[2]); A.dummy.rotation.set(0,t[3]*7,0); A.dummy.scale.setScalar(t[3]); A.dummy.updateMatrix(); tm.setMatrixAt(i,A.dummy.matrix); tc.setRGB(0.85+rx2(i)*0.3,0.9+rx2(i+9)*0.2,0.85+rx2(i+4)*0.2); tm.setColorAt(i,tc); }); tm.frustumCulled=false; tm.castShadow=ring<=1; ch.group.add(tm); }
}
ch.hasDecor=true;
w2LiteRebind(ch);
}
function rand2(r,a,b){ return a+(b-a)*r; }
function rx2(i){ return w2h(i*13+1,i*7+5); }
function D2(o,x,y,z,w,h,d){ o.position.set(x,y,z); o.rotation.set(0,0,0); o.scale.set(w,h,d); o.updateMatrix(); }
/* ---- far horizon mesh (aligned to the chunk lattice, hole under the near chunks) ---- */
function w2BuildFar(ccx,ccz){
var cfg=[[64,64],[64,96],[128,96],[128,128]][(W2.dist||2)-1],F=cfg[0],FG=cfg[1],CS=W2.CS,R=W2.R;
var V=FG+1,pos=new Float32Array(V*V*3),col=new Float32Array(V*V*3),nor=new Float32Array(V*V*3),H=new Float32Array((V+2)*(V+2));
var ox=ccx*CS-FG/2*F,oz=ccz*CS-FG/2*F;
for(var j=-1;j<=V;j++)for(var i=-1;i<=V;i++)H[(j+1)*(V+2)+(i+1)]=terrainH(ox+i*F,oz+j*F);
var o=[0,0,0];
for(var j2=0;j2<V;j2++)for(var i2=0;i2<V;i2++){
var k=j2*V+i2,h=H[(j2+1)*(V+2)+(i2+1)],wx=ox+i2*F,wz=oz+j2*F;
var dx=(H[(j2+1)*(V+2)+(i2+2)]-H[(j2+1)*(V+2)+i2])/(2*F),dz=(H[(j2+2)*(V+2)+(i2+1)]-H[j2*(V+2)+(i2+1)])/(2*F);
var il=1/Math.sqrt(dx*dx+1+dz*dz); pos[k*3]=wx;pos[k*3+1]=h-0.3;pos[k*3+2]=wz; nor[k*3]=-dx*il;nor[k*3+1]=il;nor[k*3+2]=-dz*il;
var td=w2townD(wx,wz); biome(h,Math.sqrt(dx*dx+dz*dz),wx,wz,o,td,w2forestD(wx,wz)); col[k*3]=o[0];col[k*3+1]=o[1];col[k*3+2]=o[2];
}
var hx0=(ccx-R)*CS,hx1=(ccx+R+1)*CS,hz0=(ccz-R)*CS,hz1=(ccz+R+1)*CS,idx=[];
for(var j3=0;j3<FG;j3++)for(var i3=0;i3<FG;i3++){
var qx=ox+(i3+0.5)*F,qz=oz+(j3+0.5)*F; if(qx>hx0&&qx<hx1&&qz>hz0&&qz<hz1)continue;
var a=j3*V+i3,b=(j3+1)*V+i3; idx.push(a,b,a+1,a+1,b,b+1); }
var g=new THREE.BufferGeometry(); g.setAttribute('position',new THREE.BufferAttribute(pos,3)); g.setAttribute('normal',new THREE.BufferAttribute(nor,3)); g.setAttribute('color',new THREE.BufferAttribute(col,3)); g.setIndex(new THREE.BufferAttribute(new Uint32Array(idx),1)); g.computeBoundingSphere();
if(W2.far){ scene.remove(W2.far); W2.far.geometry.dispose(); }
var m=new THREE.Mesh(g,W2A.terrMat); m.frustumCulled=false; scene.add(m); W2.far=m; W2.farKey=ccx+','+ccz+','+R+','+F;
}
function worldApplyDist(){
var d=SETTINGS.dist||2; W2.dist=d; W2.R=[2,3,4,5][d-1]; W2.farKey='';
}
function w2Init(){
if(W2.ready)return;
worldApplyDist(); W2.dist=SETTINGS.dist||2; w2Shared(); buildSky(); buildWater(); W2.ready=true;
w2Stream(true);
}
function w2Stream(prime){
var CS=W2.CS,pcx=Math.floor(heliState.pos.x/CS),pcz=Math.floor(heliState.pos.z/CS),R=W2.R,B=R+1;
if(prime||pcx!==W2.lastCx||pcz!==W2.lastCz||W2.queue.dirty){ W2.lastCx=pcx; W2.lastCz=pcz; W2.queue.dirty=false;
var need=[];
for(var dz=-B;dz<=B;dz++)for(var dx=-B;dx<=B;dx++){ var cx=pcx+dx,cz=pcz+dz,ring=Math.max(Math.abs(dx),Math.abs(dz)),key=cx+','+cz,ch=W2.chunks[key];
if(!ch)need.push({cx:cx,cz:cz,ring:ring,d:dx*dx+dz*dz,key:key,fresh:true});
else if(ch.N!==w2NByRing(ring)||(ring<=2&&!ch.hasMap)||(ring>2&&ch.hasMap)||(ring<=Math.min(R,4)&&!ch.hasDecor)||(ring>Math.min(R,4)&&ch.hasDecor))need.push({cx:cx,cz:cz,ring:ring,d:dx*dx+dz*dz,key:key,fresh:false}); }
need.sort(function(a,b){ return a.d-b.d; }); W2.queue=need; W2.queue.dirty=false;
for(var k in W2.chunks){ var c=W2.chunks[k]; if(Math.max(Math.abs(c.cx-pcx),Math.abs(c.cz-pcz))>B+1){ w2DisposeParts(c); scene.remove(c.group); delete W2.chunks[k]; } }
var fk=pcx+','+pcz+','+R+','+([64,64,128,128][(W2.dist||2)-1]); if(fk!==W2.farKey)w2BuildFar(pcx,pcz);
}
var t0=performance.now(),budget=prime?1e9:5;
while(W2.queue.length&&performance.now()-t0<budget){
var it=W2.queue.shift(); var ch=W2.chunks[it.key];
try{ if(ch)w2BuildChunk(it.cx,it.cz,it.ring,ch); else W2.chunks[it.key]=w2BuildChunk(it.cx,it.cz,it.ring,null); }catch(e){ console.warn('chunk',e); }
}
}

/* ================= volumetric-look clouds: toroidal field of noise-eroded billboards around the camera ================= */
var CL={mesh:null,n:0,bx:null,by:null,bz:null,sz:null,sh:null,sd:null,al:null,aPos:null,aA:null,attrs:[],SP:16000,t:0};
function cloudsInit(){
var SP=CL.SP,clusters=90,per=9,N=clusters*per+16; CL.n=N;
CL.bx=new Float32Array(N);CL.by=new Float32Array(N);CL.bz=new Float32Array(N);CL.sz=new Float32Array(N);CL.sh=new Float32Array(N);CL.sd=new Float32Array(N);CL.al=new Float32Array(N);
var i=0,r=function(a,b){ return a+Math.random()*(b-a); };
for(var c=0;c<clusters;c++){
var cx=r(-SP/2,SP/2),cz=r(-SP/2,SP/2),cy=r(900,1700),rad=r(260,720),big=r(0.7,1.5);
for(var k=0;k<per;k++){ var a=r(0,Math.PI*2),d=Math.sqrt(Math.random())*rad;
CL.bx[i]=cx+Math.cos(a)*d; CL.bz[i]=cz+Math.sin(a)*d*0.8; var hh=r(0,1); CL.by[i]=cy+hh*rad*0.35-rad*0.1; CL.sz[i]=r(240,520)*big*(1-hh*0.25); CL.sh[i]=0.25+hh*0.75; CL.sd[i]=Math.random(); CL.al[i]=r(0.72,0.95); i++; } }
for(;i<N;i++){ CL.bx[i]=r(-SP/2,SP/2); CL.bz[i]=r(-SP/2,SP/2); CL.by[i]=r(3300,4300); CL.sz[i]=r(2600,4200); CL.sh[i]=0.9; CL.sd[i]=Math.random(); CL.al[i]=r(0.16,0.28); }
var geo=new THREE.InstancedBufferGeometry(),base=new THREE.PlaneGeometry(1,1); geo.index=base.index; geo.setAttribute('position',base.attributes.position); geo.setAttribute('uv',base.attributes.uv);
CL.aPos=new Float32Array(N*4); CL.aA=new Float32Array(N*4);
var a1=new THREE.InstancedBufferAttribute(CL.aPos,4),a2=new THREE.InstancedBufferAttribute(CL.aA,4); a1.setUsage(THREE.DynamicDrawUsage); a2.setUsage(THREE.DynamicDrawUsage);
geo.setAttribute('iPS',a1); geo.setAttribute('iA',a2); geo.instanceCount=N; CL.attrs=[a1,a2];
var vs='attribute vec4 iPS; attribute vec4 iA; varying vec2 vUv; varying vec4 vA; varying float vD;\nvoid main(){ vec4 vp=viewMatrix*vec4(iPS.xyz,1.0); vD=length(vp.xyz); vec2 off=position.xy*iPS.w; vp.xy+=off; gl_Position=projectionMatrix*vp; vUv=uv; vA=iA; }';
var fs=['precision highp float; uniform sampler2D tNoise; uniform vec3 uSun,uFog,uSunCol; uniform float uFar,uDusk,uNight; varying vec2 vUv; varying vec4 vA; varying float vD;',
'void main(){ vec2 c=vUv-0.5; float r=length(c)*2.0; float seed=vA.z; vec2 uv=vUv*0.8+vec2(seed*5.3,seed*2.9);',
' float n1=texture2D(tNoise,uv).r,n2=texture2D(tNoise,uv*2.9+0.31).r; float n=n1*0.65+n2*0.35;',
' float edge=smoothstep(1.0,0.2,r-(n-0.5)*0.9); float dens=edge*smoothstep(0.05,0.55,n+0.5-r*0.6); float a=clamp(dens,0.0,1.0)*vA.y;',
' float nearF=smoothstep(40.0,260.0,vD); float farF=1.0-smoothstep(uFar*0.78,uFar*1.05,vD); a*=nearF*farF; if(a<0.004)discard;',
' float sh=vA.x; vec3 lit=mix(vec3(0.58,0.64,0.76),vec3(1.0,0.99,0.96),smoothstep(0.1,0.95,sh*0.7+n*0.55));',
' lit*=mix(vec3(1.0),uSunCol*1.05,0.55); lit=mix(lit,lit*vec3(1.0,0.72,0.58)+vec3(0.15,0.05,0.0),uDusk*0.65);',
' lit*=mix(1.0,0.07,uNight); lit=mix(lit,uFog,smoothstep(0.3,1.0,vD/uFar)*0.6);',
' gl_FragColor=vec4(lit*a,a);',
' #include <tonemapping_fragment>\n #include <colorspace_fragment>\n}'].join('\n');
var mat=new THREE.ShaderMaterial({uniforms:{tNoise:{value:PS.tex},uSun:{value:new THREE.Vector3()},uFog:{value:new THREE.Color()},uSunCol:{value:new THREE.Color()},uFar:{value:4000},uDusk:{value:0},uNight:{value:0}},vertexShader:vs,fragmentShader:fs,transparent:true,depthWrite:false,blending:THREE.CustomBlending,blendEquation:THREE.AddEquation,blendSrc:THREE.OneFactor,blendDst:THREE.OneMinusSrcAlphaFactor,blendSrcAlpha:THREE.OneFactor,blendDstAlpha:THREE.OneMinusSrcAlphaFactor});
CL.mesh=new THREE.Mesh(geo,mat); CL.mesh.frustumCulled=false; CL.mesh.renderOrder=1; scene.add(CL.mesh);
}
function cloudsUpdate(dt){
if(!CL.mesh)return; CL.t+=dt; var SP=CL.SP,cp=camera.position,wx=CL.t*9,wz=CL.t*3;
for(var i=0;i<CL.n;i++){
var dx=((CL.bx[i]-cp.x+wx)%SP+SP*1.5)%SP-SP/2,dz=((CL.bz[i]-cp.z+wz)%SP+SP*1.5)%SP-SP/2;
var p=i*4; CL.aPos[p]=cp.x+dx; CL.aPos[p+1]=CL.by[i]; CL.aPos[p+2]=cp.z+dz; CL.aPos[p+3]=CL.sz[i];
CL.aA[p]=CL.sh[i]; CL.aA[p+1]=CL.al[i]; CL.aA[p+2]=CL.sd[i]; CL.aA[p+3]=0; }
CL.attrs[0].needsUpdate=true; CL.attrs[1].needsUpdate=true;
var u=CL.mesh.material.uniforms; u.uFog.value.copy(scene.fog.color); u.uSunCol.value.copy(sun.color); u.uFar.value=Math.max(5000,scene.fog.far*1.6); u.uDusk.value=DUSK.sunset; u.uNight.value=DUSK.night;
}

/* ================= open-world destructibles: nearby decor buildings become real, destructible objects ================= */
var FREE=false;
W2.destroyed={}; W2.liteByKey={}; W2.liteT=0;
function w2SpecKey(s){ return Math.round(s.x)+','+Math.round(s.z); }
function w2HideSpec(ch,s){
if(!ch||!ch.im)return; var D=W2A.dummy; D.position.set(0,-2000,0); D.scale.set(0,0,0); D.rotation.set(0,0,0); D.updateMatrix();
ch.im.setMatrixAt(s.bi,D.matrix); ch.im.instanceMatrix.needsUpdate=true;
if(s.ci!==undefined&&ch.cim){ ch.cim.setMatrixAt(s.ci,D.matrix); ch.cim.setMatrixAt(s.ci+1,D.matrix); ch.cim.instanceMatrix.needsUpdate=true; }
if(s.ri!==undefined&&ch.rim){ ch.rim.setMatrixAt(s.ri,D.matrix); ch.rim.instanceMatrix.needsUpdate=true; }
}
function w2ShowSpec(ch,s){
if(!ch||!ch.im)return; var D=W2A.dummy; D.position.set(s.x,s.y-6,s.z); D.rotation.set(0,0,0); D.scale.set(s.w,s.h+6,s.d); D.updateMatrix(); ch.im.setMatrixAt(s.bi,D.matrix); ch.im.instanceMatrix.needsUpdate=true;
if(s.ci!==undefined&&ch.cim){ D.position.set(s.x,s.y+s.h,s.z); D.scale.set(s.w*0.62,s.h*0.05+2,s.d*0.62); D.updateMatrix(); ch.cim.setMatrixAt(s.ci,D.matrix); D.position.set(s.x,s.y+s.h+s.h*0.05+2,s.z); D.scale.set(0.9,s.h*0.16+6,0.9); D.updateMatrix(); ch.cim.setMatrixAt(s.ci+1,D.matrix); ch.cim.instanceMatrix.needsUpdate=true; }
}
function w2LiteRebind(ch){
if(!ch.specs)return;
for(var i=0;i<ch.specs.length;i++){ var s=ch.specs[i],lo=W2.liteByKey[w2SpecKey(s)]; if(lo){ lo.lite.spec=s; lo.lite.ch=ch; w2HideSpec(ch,s); } }
}
function w2LiteMake(ch,s,key){
var w=s.w,d=s.d,h=s.h,by=s.y;
var grp=new THREE.Group(); grp.position.set(s.x,0,s.z);
var bg=new THREE.BoxGeometry(w,h+6,d); bg.translate(0,(h+6)/2,0);
var nv=bg.attributes.position.count,dim=new Float32Array(nv*4),tint=new Float32Array(nv*3),sd=w2h(Math.floor(s.x),Math.floor(s.z));
for(var i=0;i<nv;i++){ dim[i*4]=w; dim[i*4+1]=h+6; dim[i*4+2]=d; dim[i*4+3]=sd; tint[i*3]=s.t[0]; tint[i*3+1]=s.t[1]; tint[i*3+2]=s.t[2]; }
bg.setAttribute('aDim',new THREE.BufferAttribute(dim,4)); bg.setAttribute('aTint',new THREE.BufferAttribute(tint,3));
var mat=W2A.bmat.clone(); mat.onBeforeCompile=W2A.bmat.onBeforeCompile; mat.customProgramCacheKey=W2A.bmat.customProgramCacheKey; mat.map=W2A.fac; mat.color=new THREE.Color(1,1,1);
var mesh=new THREE.Mesh(bg,mat); mesh.position.y=by-6; mesh.castShadow=true; mesh.receiveShadow=true; grp.add(mesh);
var roof=new THREE.Mesh(new THREE.BoxGeometry(w+0.7,0.7,d+0.7),new THREE.MeshStandardMaterial({color:0x43484e,roughness:0.9})); roof.position.y=by+h+0.3; roof.castShadow=true; grp.add(roof);
var type=s.tw?'tower':(s.house?'house':'office');
var det=null; try{ det=buildingDetail(grp,w,h,d,type,0xcfd2d0); det.position.y=by; }catch(e){}
var rub=new THREE.Group(); rub.position.y=by; try{ buildRubble(rub,w,d,h); }catch(e){} rub.visible=false; grp.add(rub);
try{ dmgSetup(grp,mat,rub,h+by,by,false); }catch(eD){ console.warn(eD); }
stageGroup.add(grp);
var o=registerDestructible({group:grp,main:mesh,roof:roof,rubble:rub,type:type,hp:0,maxHp:0,value:Math.round(w*d*h*900),scorePts:Math.round(60+h*7+(s.tw?300:0)),w:w,d:d,height:h+by,explosive:null,destroyed:false,collapsing:0,stage:0,mat:mat,baseTint:mat.color.getHex(),yenGiven:0,scoreGiven:0});
setHp(o,Math.round(30+h*3.2)); o.baseY=by; o.lite={ch:ch,spec:s,key:key};
W2.liteByKey[key]=o; w2HideSpec(ch,s); return o;
}
function w2LiteRemove(o){
var i=destructibles.indexOf(o); if(i>=0){ destructibles.splice(i,1); totalCount--; }
if(o.group){ stageGroup.remove(o.group); o.group.traverse(function(c){ if(c.geometry)c.geometry.dispose(); if(c.material&&c.material!==W2A.bmat&&c.material!==BLD_MAT)c.material.dispose&&c.material.dispose(); }); }
delete W2.liteByKey[o.lite.key];
}
function w2LiteDestroyed(o){ W2.destroyed[o.lite.key]=true; }
function w2LiteUpdate(dt){
if(!FREE)return; W2.liteT-=dt; if(W2.liteT>0)return; W2.liteT=0.45;
var hp=heliState.pos,made=0,changed=false;
for(var k in W2.chunks){ var ch=W2.chunks[k]; if(!ch.specs||ch.ring>1)continue;
for(var i=0;i<ch.specs.length&&made<5;i++){ var s=ch.specs[i],key=w2SpecKey(s); if(W2.liteByKey[key]||W2.destroyed[key])continue;
var dx=s.x-hp.x,dz=s.z-hp.z; if(dx*dx+dz*dz>420*420)continue; w2LiteMake(ch,s,key); made++; changed=true; } }
for(var key2 in W2.liteByKey){ var lo=W2.liteByKey[key2]; if(lo.destroyed||lo.collapsing)continue; var ddx=lo.group.position.x-hp.x,ddz=lo.group.position.z-hp.z;
if(ddx*ddx+ddz*ddz>650*650){ var s2=lo.lite.spec,ch2=lo.lite.ch; w2LiteRemove(lo); if(ch2&&ch2.im&&ch2.specs&&ch2.specs.indexOf(s2)>=0)w2ShowSpec(ch2,s2); changed=true; } }
if(changed){ var tn=document.getElementById('totalNum'); if(tn)tn.textContent=totalCount; }
}
function w2ResetWorld(){
var had=Object.keys(W2.destroyed).length>0||Object.keys(W2.liteByKey).length>0;
for(var i=destructibles.length-1;i>=0;i--){ var o=destructibles[i]; if(o.lite){ stageGroup&&stageGroup.remove(o.group); destructibles.splice(i,1); totalCount--; } }
W2.liteByKey={}; W2.destroyed={};
if(had){ for(var k in W2.chunks){ w2DisposeParts(W2.chunks[k]); scene.remove(W2.chunks[k].group); delete W2.chunks[k]; }
W2.queue=[]; W2.queue.dirty=true; W2.lastCx=1e9; W2.farKey=''; if(W2.ready)w2Stream(true); }
}

function w2SetMetro(v){ if(W2.metro===v)return; W2.metro=v; for(var k in W2.chunks){ w2DisposeParts(W2.chunks[k]); scene.remove(W2.chunks[k].group); delete W2.chunks[k]; } W2.queue=[]; W2.queue.dirty=true; W2.lastCx=1e9; W2.farKey=''; }

var STAGE_DEFS={
city:{name:'都市',pad:{x:22,z:-22},ehPad:{x:-110,z:-110},fuel:{x:-110,z:110},repair:{x:110,z:-110},base:0xa3a6a0},
school:{name:'学校',pad:{x:105,z:105},ehPad:{x:-110,z:105},fuel:{x:128,z:40},repair:{x:-110,z:-110},base:0x9aa87e},
military:{name:'軍事施設',pad:{x:-110,z:-110},ehPad:{x:105,z:-105},fuel:{x:112,z:-24},repair:{x:-100,z:100},base:0x8f8d7c},
highway:{name:'高速道路',pad:{x:-120,z:72},ehPad:{x:120,z:72},fuel:{x:56,z:-70},repair:{x:-56,z:-66},base:0xa3a6a0},
world:{name:'大空・自由飛行',pad:{x:-122,z:-104},ehPad:{x:124,z:-108},fuel:{x:24,z:-96},repair:{x:-118,z:28},base:0x9fa3a0},
airport:{name:'空港',pad:{x:-122,z:-104},ehPad:{x:124,z:-108},fuel:{x:24,z:-96},repair:{x:-118,z:28},base:0x9fa3a0},
office:{name:'オフィス街',pad:{x:-110,z:110},ehPad:{x:110,z:-110},fuel:{x:110,z:110},repair:{x:-110,z:-110},base:0x9aa0a6},
radio:{name:'電波塔',pad:{x:-110,z:110},ehPad:{x:110,z:-110},fuel:{x:110,z:110},repair:{x:-110,z:-110},base:0x8f968a}
};
var currentStage='city';
var stageGroup=null, roadsGroup=null, treesGroup=null, heliportGroup=null, enemyPadGroup=null;
var trafficSignals=[];
var bestByStage={};
var ground=new THREE.Mesh(new THREE.PlaneGeometry(1500,1500),new THREE.MeshStandardMaterial({map:groundTexture(),color:0xa8ad98,roughness:1}));
ground.rotation.x=-Math.PI/2; ground.position.y=-0.08; ground.receiveShadow=true; scene.add(ground); ground.visible=false;
var cityBase=new THREE.Mesh(new THREE.PlaneGeometry(WORLD*2+30,WORLD*2+30),new THREE.MeshStandardMaterial({map:concreteTexture(),color:0xa3a6a0,roughness:0.97}));
cityBase.rotation.x=-Math.PI/2; cityBase.position.y=0; cityBase.receiveShadow=true; scene.add(cityBase);
stageGroup=new THREE.Group(); scene.add(stageGroup);

roadsGroup=new THREE.Group(); scene.add(roadsGroup);
// roads: grid every 44 units — asphalt + concrete sidewalks + curbs
(function(){
var spacing=44;
var walkMat=new THREE.MeshStandardMaterial({color:0xbdbcb4,roughness:0.95});
for(var i=-3;i<=3;i++){
var p=i*spacing;
// sidewalk slabs flanking each road
[[p-6.1,0],[p+6.1,0]].forEach(function(s){
var wh=new THREE.Mesh(new THREE.BoxGeometry(WORLD*2+30,0.18,3.2),walkMat); wh.position.set(0,0.09,s[0]); wh.receiveShadow=true; roadsGroup.add(wh);
var wv=new THREE.Mesh(new THREE.BoxGeometry(3.2,0.18,WORLD*2+30),walkMat); wv.position.set(s[0],0.09,0); wv.receiveShadow=true; roadsGroup.add(wv);
});
var rh=new THREE.Mesh(new THREE.PlaneGeometry(WORLD*2+30,9.4),new THREE.MeshStandardMaterial({map:texRoad.clone(),roughness:0.92}));
rh.material.map.repeat.set(36,1); rh.material.map.needsUpdate=true;
rh.rotation.x=-Math.PI/2; rh.rotation.z=Math.PI/2; rh.position.set(0,0.06,p); rh.receiveShadow=true; roadsGroup.add(rh);
var rv=new THREE.Mesh(new THREE.PlaneGeometry(9.4,WORLD*2+30),new THREE.MeshStandardMaterial({map:texRoad.clone(),roughness:0.92}));
rv.material.map.repeat.set(1,36); rv.material.map.needsUpdate=true;
rv.rotation.x=-Math.PI/2; rv.position.set(p,0.06,0); rv.receiveShadow=true; roadsGroup.add(rv);
}
// crosswalks at main intersections
var cwMat=new THREE.MeshBasicMaterial({color:0xe9e6d8});
[[-44,-44],[0,0],[44,44],[-44,44],[44,-44],[0,-44]].forEach(function(ix){
for(var s2=-3;s2<=3;s2++){ if(s2===0)continue; var st=new THREE.Mesh(new THREE.PlaneGeometry(0.9,3.6),cwMat); st.rotation.x=-Math.PI/2; st.position.set(ix[0]+s2*1.35,0.09,ix[1]+4.2); roadsGroup.add(st); }
});
// streetlights (warm lamps for dusk) + traffic lights
var poleM=new THREE.MeshStandardMaterial({color:0x3a4046,roughness:0.55,metalness:0.6});
var lampM=new THREE.MeshBasicMaterial({color:0xffd98a});
var lampGlowM=new THREE.MeshStandardMaterial({color:0x554a30,roughness:0.4,emissive:0xffb84d,emissiveIntensity:0.9});
for(var li=-3;li<=3;li++)for(var lj=-2;lj<=2;lj++){
var lx=li*44+ (lj%2===0?7.5:-7.5), lz=lj*44+22;
if(Math.abs(lx)>148||Math.abs(lz)>148)continue;
var pole=new THREE.Group();
var post=new THREE.Mesh(new THREE.CylinderGeometry(0.14,0.2,5.6,7),poleM); post.position.y=2.8; post.castShadow=true; pole.add(post);
var arm=new THREE.Mesh(new THREE.CylinderGeometry(0.09,0.09,2.2,6),poleM); arm.rotation.z=Math.PI/2.25; arm.position.set(0.75,5.55,0); pole.add(arm);
var head=new THREE.Mesh(new THREE.BoxGeometry(1.15,0.22,0.5),lampGlowM); head.position.set(1.55,5.85,0); pole.add(head);
var bulb=new THREE.Mesh(new THREE.SphereGeometry(0.2,8,6),lampM); bulb.position.set(1.55,5.7,0); pole.add(bulb);
var lampGlow=new THREE.Sprite(new THREE.SpriteMaterial({map:texGlow,color:0xffc37a,transparent:true,opacity:0.5,depthWrite:false,blending:THREE.AdditiveBlending}));
lampGlow.scale.set(3.6,3.6,1); lampGlow.position.set(1.55,5.7,0); pole.add(lampGlow);
pole.position.set(lx,0,lz); pole.rotation.y=(lj%2===0?0:Math.PI); roadsGroup.add(pole);
}
trafficSignals.length=0;
[[-44,-44],[0,0],[44,44]].forEach(function(ix,idx){
var tg=new THREE.Group();
var tp=new THREE.Mesh(new THREE.CylinderGeometry(0.13,0.17,3.4,7),poleM); tp.position.y=1.7; tg.add(tp);
var box=new THREE.Mesh(new THREE.BoxGeometry(0.55,1.35,0.55),new THREE.MeshStandardMaterial({color:0x1d2126,roughness:0.5})); box.position.y=3.9; tg.add(box);
var sig={mats:[],base:[],dim:[],st:['','',''],off:idx*2.37};
[0xff3b30,0xffcc02,0x35d05a].forEach(function(cc,ci){ var lamp=new THREE.Mesh(new THREE.SphereGeometry(0.16,8,6),new THREE.MeshBasicMaterial({color:cc})); lamp.position.set(0,4.35-ci*0.42,0.3); tg.add(lamp); sig.mats.push(lamp.material); sig.base.push(cc); sig.dim.push(new THREE.Color(cc).multiplyScalar(0.15).getHex()); });
trafficSignals.push(sig);
tg.position.set(ix[0]+5.6,0,ix[1]+5.6); roadsGroup.add(tg);
});
})();
/* ================= heliport (departure pad) ================= */
var padPillar=null, padMarker=null, padLights=[];
(function buildHeliport(){
var grp=new THREE.Group(); grp.position.set(PAD.x,0,PAD.z); scene.add(grp); heliportGroup=grp;
var base=new THREE.Mesh(new THREE.CylinderGeometry(9.2,9.2,0.22,36),new THREE.MeshStandardMaterial({color:0x33373c,roughness:0.95}));
base.position.y=0.11; base.receiveShadow=true; grp.add(base);
var ring=new THREE.Mesh(new THREE.TorusGeometry(7.7,0.22,8,44),new THREE.MeshStandardMaterial({color:0xffc21f,roughness:0.5,emissive:0x664400}));
ring.rotation.x=Math.PI/2; ring.position.y=0.26; grp.add(ring);
// painted "H"
var hMat=new THREE.MeshStandardMaterial({color:0xffc21f,roughness:0.55});
[-1.7,1.7].forEach(function(hx){ var bar=new THREE.Mesh(new THREE.BoxGeometry(0.95,0.07,5),hMat); bar.position.set(hx,0.26,0); grp.add(bar);});
var cross=new THREE.Mesh(new THREE.BoxGeometry(2.5,0.07,0.95),hMat); cross.position.set(0,0.26,0); grp.add(cross);
// edge lights
var lightMat=new THREE.MeshBasicMaterial({color:0x7dffb0});
for(var i=0;i<10;i++){
var a=i/10*Math.PI*2;
var lm=new THREE.Mesh(new THREE.SphereGeometry(0.32,8,6),lightMat);
lm.position.set(Math.cos(a)*8.6,0.45,Math.sin(a)*8.6); grp.add(lm); padLights.push(lm);
}
// beacon light pillar (visible across the city)
padPillar=new THREE.Mesh(new THREE.CylinderGeometry(2.6,3.4,110,18,1,true),new THREE.MeshBasicMaterial({color:0xffcf4d,transparent:true,opacity:0.16,side:THREE.DoubleSide,depthWrite:false,blending:THREE.AdditiveBlending}));
padPillar.position.set(PAD.x,55,PAD.z); scene.add(padPillar);
// floating marker cone
padMarker=new THREE.Mesh(new THREE.ConeGeometry(1.7,3.6,4),new THREE.MeshBasicMaterial({color:0xffc21f}));
padMarker.rotation.x=Math.PI; padMarker.position.set(PAD.x,19,PAD.z); scene.add(padMarker);
})();
/* ================= refuelling spot (green pad: land + wait 5s = fuel +45s) ================= */
var FUEL={x:-110,z:110,r:8.5};
var fuelGroup=null, fuelPillar=null, fuelMarker=null;
(function buildFuelSpot(){
var grp=new THREE.Group(); grp.position.set(FUEL.x,0,FUEL.z); scene.add(grp); fuelGroup=grp;
var base=new THREE.Mesh(new THREE.CylinderGeometry(9.2,9.2,0.22,36),new THREE.MeshStandardMaterial({color:0x2c3830,roughness:0.95}));
base.position.y=0.11; base.receiveShadow=true; grp.add(base);
var ring=new THREE.Mesh(new THREE.TorusGeometry(7.7,0.22,8,44),new THREE.MeshStandardMaterial({color:0x35d05a,roughness:0.5,emissive:0x0d5c22}));
ring.rotation.x=Math.PI/2; ring.position.y=0.26; grp.add(ring);
// painted "F"
var fMat=new THREE.MeshStandardMaterial({color:0x7dffb0,roughness:0.55});
var fv=new THREE.Mesh(new THREE.BoxGeometry(0.95,0.07,5),fMat); fv.position.set(-1.2,0.26,0); grp.add(fv);
var ft=new THREE.Mesh(new THREE.BoxGeometry(3.4,0.07,0.95),fMat); ft.position.set(0,0.26,-2.05); grp.add(ft);
var fm2=new THREE.Mesh(new THREE.BoxGeometry(2.6,0.07,0.95),fMat); fm2.position.set(-0.4,0.26,-0.1); grp.add(fm2);
// edge lights
var lightMat=new THREE.MeshBasicMaterial({color:0x35ffb0});
for(var i=0;i<10;i++){
var a=i/10*Math.PI*2;
var lm=new THREE.Mesh(new THREE.SphereGeometry(0.32,8,6),lightMat);
lm.position.set(Math.cos(a)*8.6,0.45,Math.sin(a)*8.6); grp.add(lm);
}
// tanker truck parked at the pad edge (visual dressing, outside the landing disc)
var truck=new THREE.Group(); truck.position.set(12.5,0,4); truck.rotation.y=-0.5; grp.add(truck);
var tankM=new THREE.MeshStandardMaterial({color:0xe8e4da,roughness:0.35,metalness:0.5});
var tk=new THREE.Mesh(new THREE.CylinderGeometry(1.5,1.5,5.6,12),tankM); tk.rotation.z=Math.PI/2; tk.position.set(-0.6,1.9,0); tk.castShadow=true; truck.add(tk);
var band=new THREE.Mesh(new THREE.CylinderGeometry(1.56,1.56,1.1,12),new THREE.MeshStandardMaterial({color:0x35a05a,roughness:0.5})); band.rotation.z=Math.PI/2; band.position.set(-0.6,1.9,0); truck.add(band);
var cab=new THREE.Mesh(new THREE.BoxGeometry(1.9,1.7,2.1),new THREE.MeshStandardMaterial({color:0x2e7d4f,roughness:0.4,metalness:0.3})); cab.position.set(3.1,1.25,0); cab.castShadow=true; truck.add(cab);
var chas=new THREE.Mesh(new THREE.BoxGeometry(7.6,0.5,2.1),new THREE.MeshStandardMaterial({color:0x3a3f44,roughness:0.7})); chas.position.set(0,0.75,0); truck.add(chas);
var wM=new THREE.MeshStandardMaterial({color:0x141414,roughness:0.92});
[[-2.6,-1.05],[2.9,-1.05],[-2.6,1.05],[2.9,1.05]].forEach(function(p){ var wh=new THREE.Mesh(new THREE.CylinderGeometry(0.52,0.52,0.3,10),wM); wh.rotation.x=Math.PI/2; wh.position.set(p[0],0.52,p[1]); truck.add(wh);});
// pump cabinet + sign
var pump=new THREE.Mesh(new THREE.BoxGeometry(1.1,1.9,0.8),new THREE.MeshStandardMaterial({color:0xf0f0f0,roughness:0.4}));
pump.position.set(10.6,0.95,-3.4); pump.castShadow=true; grp.add(pump);
var pumpTop=new THREE.Mesh(new THREE.BoxGeometry(1.1,0.5,0.8),new THREE.MeshStandardMaterial({color:0x35d05a,roughness:0.4}));
pumpTop.position.set(10.6,2.15,-3.4); grp.add(pumpTop);
var c=document.createElement('canvas'); c.width=256; c.height=96; var g2=c.getContext('2d');
g2.fillStyle='#14532d'; g2.fillRect(0,0,256,96); g2.strokeStyle='#7dffb0'; g2.lineWidth=5; g2.strokeRect(5,5,246,86);
g2.fillStyle='#eaffea'; g2.font='900 44px "Hiragino Kaku Gothic ProN",sans-serif'; g2.textAlign='center'; g2.textBaseline='middle'; g2.fillText('給油 FUEL',128,50);
var sTex=new THREE.CanvasTexture(c); sTex.colorSpace=THREE.SRGBColorSpace;
var pole=new THREE.Mesh(new THREE.CylinderGeometry(0.09,0.09,3.4,6),new THREE.MeshStandardMaterial({color:0x555a5e,roughness:0.7}));
pole.position.set(10.6,1.7,-4.6); grp.add(pole);
var sign=new THREE.Mesh(new THREE.PlaneGeometry(4.6,1.7),new THREE.MeshBasicMaterial({map:sTex,side:THREE.DoubleSide}));
sign.position.set(10.6,3.6,-4.6); grp.add(sign);
// beacon light pillar + floating marker (green, slimmer than the home pad's)
fuelPillar=new THREE.Mesh(new THREE.CylinderGeometry(2.0,2.7,110,18,1,true),new THREE.MeshBasicMaterial({color:0x4dff88,transparent:true,opacity:0.13,side:THREE.DoubleSide,depthWrite:false,blending:THREE.AdditiveBlending}));
fuelPillar.position.set(FUEL.x,55,FUEL.z); scene.add(fuelPillar);
fuelMarker=new THREE.Mesh(new THREE.ConeGeometry(1.5,3.2,4),new THREE.MeshBasicMaterial({color:0x35d05a}));
fuelMarker.rotation.x=Math.PI; fuelMarker.position.set(FUEL.x,19,FUEL.z); scene.add(fuelMarker);
})();
/* ================= repair depot (blue pad: land + wait 3s = hull fully repaired) ================= */
var REPAIR={x:110,z:-110,r:8.5};
var repairGroup=null, repairPillar=null, repairMarker=null;
(function buildRepairSpot(){
var grp=new THREE.Group(); grp.position.set(REPAIR.x,0,REPAIR.z); scene.add(grp); repairGroup=grp;
var base=new THREE.Mesh(new THREE.CylinderGeometry(9.2,9.2,0.22,36),new THREE.MeshStandardMaterial({color:0x2c3440,roughness:0.95}));
base.position.y=0.11; base.receiveShadow=true; grp.add(base);
var ring=new THREE.Mesh(new THREE.TorusGeometry(7.7,0.22,8,44),new THREE.MeshStandardMaterial({color:0x38bdf8,roughness:0.5,emissive:0x0d4a66}));
ring.rotation.x=Math.PI/2; ring.position.y=0.26; grp.add(ring);
// painted repair cross "+"
var cMat=new THREE.MeshStandardMaterial({color:0x8adcff,roughness:0.55});
var cv=new THREE.Mesh(new THREE.BoxGeometry(1.3,0.07,5.2),cMat); cv.position.set(0,0.26,0); grp.add(cv);
var ch=new THREE.Mesh(new THREE.BoxGeometry(5.2,0.07,1.3),cMat); ch.position.set(0,0.26,0); grp.add(ch);
// edge lights
var lightMat=new THREE.MeshBasicMaterial({color:0x7dd8ff});
for(var i=0;i<10;i++){
var a=i/10*Math.PI*2;
var lm=new THREE.Mesh(new THREE.SphereGeometry(0.32,8,6),lightMat);
lm.position.set(Math.cos(a)*8.6,0.45,Math.sin(a)*8.6); grp.add(lm);
}
// workshop hangar beside the pad (open front, tools and crates inside)
var hangar=new THREE.Group(); hangar.position.set(13.5,0,-3); hangar.rotation.y=0.45; grp.add(hangar);
var wallM=new THREE.MeshStandardMaterial({color:0x5d6a72,roughness:0.8});
var back=new THREE.Mesh(new THREE.BoxGeometry(9,4.2,0.4),wallM); back.position.set(0,2.1,-3.4); back.castShadow=true; hangar.add(back);
[-4.3,4.3].forEach(function(sx){ var side=new THREE.Mesh(new THREE.BoxGeometry(0.4,4.2,7.2),wallM); side.position.set(sx,2.1,0); side.castShadow=true; hangar.add(side);});
var roof=new THREE.Mesh(new THREE.BoxGeometry(10,0.35,8.2),new THREE.MeshStandardMaterial({color:0x48545c,roughness:0.8})); roof.position.set(0,4.4,0); roof.castShadow=true; hangar.add(roof);
var crateM=new THREE.MeshStandardMaterial({color:0x8a6f3c,roughness:0.85});
[[ -2.6,-2.2],[ -1.2,-2.4],[2.8,-2.3]].forEach(function(p){ var cr=new THREE.Mesh(new THREE.BoxGeometry(1.3,1.1,1.1),crateM); cr.position.set(p[0],0.55,p[1]); cr.castShadow=true; hangar.add(cr);});
var drumM=new THREE.MeshStandardMaterial({color:0x2e6da8,roughness:0.5,metalness:0.4});
[[-3.6,1.8],[3.7,1.6]].forEach(function(p){ var dr=new THREE.Mesh(new THREE.CylinderGeometry(0.55,0.55,1.4,10),drumM); dr.position.set(p[0],0.7,p[1]); dr.castShadow=true; hangar.add(dr);});
var blade=new THREE.Mesh(new THREE.BoxGeometry(6.4,0.14,0.55),new THREE.MeshStandardMaterial({color:0x22262a,roughness:0.5,metalness:0.5})); blade.position.set(0.4,0.35,1.9); blade.rotation.y=0.25; hangar.add(blade); // spare rotor blade on trestles
// maintenance truck parked on the other side of the pad
var truck=new THREE.Group(); truck.position.set(-12.5,0,5); truck.rotation.y=0.6; grp.add(truck);
var tBody=new THREE.Mesh(new THREE.BoxGeometry(5.4,1.9,2.2),new THREE.MeshStandardMaterial({color:0xe8e4da,roughness:0.55})); tBody.position.set(-0.7,1.55,0); tBody.castShadow=true; truck.add(tBody);
var tStripe=new THREE.Mesh(new THREE.BoxGeometry(5.45,0.5,2.25),new THREE.MeshStandardMaterial({color:0x38bdf8,roughness:0.5})); tStripe.position.set(-0.7,1.85,0); truck.add(tStripe);
var tCab=new THREE.Mesh(new THREE.BoxGeometry(1.9,1.7,2.1),new THREE.MeshStandardMaterial({color:0x2e6da8,roughness:0.4,metalness:0.3})); tCab.position.set(2.9,1.25,0); tCab.castShadow=true; truck.add(tCab);
var tChas=new THREE.Mesh(new THREE.BoxGeometry(7.4,0.5,2.1),new THREE.MeshStandardMaterial({color:0x3a3f44,roughness:0.7})); tChas.position.set(0,0.75,0); truck.add(tChas);
var wM2=new THREE.MeshStandardMaterial({color:0x141414,roughness:0.92});
[[-2.5,-1.05],[2.7,-1.05],[-2.5,1.05],[2.7,1.05]].forEach(function(p){ var wh=new THREE.Mesh(new THREE.CylinderGeometry(0.52,0.52,0.3,10),wM2); wh.rotation.x=Math.PI/2; wh.position.set(p[0],0.52,p[1]); truck.add(wh);});
// sign: 整備場 REPAIR
var c2=document.createElement('canvas'); c2.width=320; c2.height=96; var g3=c2.getContext('2d');
g3.fillStyle='#0b2a3f'; g3.fillRect(0,0,320,96); g3.strokeStyle='#7dd8ff'; g3.lineWidth=5; g3.strokeRect(5,5,310,86);
g3.fillStyle='#eaf7ff'; g3.font='900 40px "Hiragino Kaku Gothic ProN",sans-serif'; g3.textAlign='center'; g3.textBaseline='middle'; g3.fillText('整備場 REPAIR',160,50);
var sTex2=new THREE.CanvasTexture(c2); sTex2.colorSpace=THREE.SRGBColorSpace;
var pole2=new THREE.Mesh(new THREE.CylinderGeometry(0.09,0.09,3.4,6),new THREE.MeshStandardMaterial({color:0x555a5e,roughness:0.7}));
pole2.position.set(10.6,1.7,-6.2); grp.add(pole2);
var sign2=new THREE.Mesh(new THREE.PlaneGeometry(5.4,1.65),new THREE.MeshBasicMaterial({map:sTex2,side:THREE.DoubleSide}));
sign2.position.set(10.6,3.6,-6.2); grp.add(sign2);
// work-light mast
var mast=new THREE.Mesh(new THREE.CylinderGeometry(0.09,0.13,5.4,6),new THREE.MeshStandardMaterial({color:0x555a5e,roughness:0.7}));
mast.position.set(-10.4,2.7,-4.8); grp.add(mast);
var wlamp=new THREE.Mesh(new THREE.SphereGeometry(0.3,8,6),new THREE.MeshBasicMaterial({color:0xcfeeff}));
wlamp.position.set(-10.4,5.5,-4.8); grp.add(wlamp);
// beacon light pillar + floating marker (blue)
repairPillar=new THREE.Mesh(new THREE.CylinderGeometry(2.0,2.7,110,18,1,true),new THREE.MeshBasicMaterial({color:0x4dc3ff,transparent:true,opacity:0.13,side:THREE.DoubleSide,depthWrite:false,blending:THREE.AdditiveBlending}));
repairPillar.position.set(REPAIR.x,55,REPAIR.z); scene.add(repairPillar);
repairMarker=new THREE.Mesh(new THREE.ConeGeometry(1.5,3.2,4),new THREE.MeshBasicMaterial({color:0x38bdf8}));
repairMarker.rotation.x=Math.PI; repairMarker.position.set(REPAIR.x,19,REPAIR.z); scene.add(repairMarker);
})();
/* ================= airbase + fighter jet ================= */
var BASE={x:0,z:198,runStart:-62,runEnd:56};
/* ================= model toolkit: lofted fuselages, airfoil wings, lathe parts, blades ================= */
function mgT(g,x,y,z,rx,ry,rz,sx,sy,sz){
var m=new THREE.Matrix4(),q=new THREE.Quaternion().setFromEuler(new THREE.Euler(rx||0,ry||0,rz||0,'XYZ'));
m.compose(new THREE.Vector3(x||0,y||0,z||0),q,new THREE.Vector3(sx===undefined?1:sx,sy===undefined?1:sy,sz===undefined?1:sz)); g.applyMatrix4(m); return g;
}
function fixWinding(g){
// make sure triangles face outward (normals pointing away from the geometry centre)
g.computeVertexNormals(); g.computeBoundingBox(); var c=new THREE.Vector3(); g.boundingBox.getCenter(c);
var p=g.attributes.position,n=g.attributes.normal,bad=0,tot=0;
for(var i=0;i<p.count;i+=7){ var dx=p.getX(i)-c.x,dy=p.getY(i)-c.y,dz=p.getZ(i)-c.z; if(dx*n.getX(i)+dy*n.getY(i)+dz*n.getZ(i)<0)bad++; tot++; }
if(bad>tot*0.5){ var ix=g.index.array; for(var k=0;k<ix.length;k+=3){ var t=ix[k+1]; ix[k+1]=ix[k+2]; ix[k+2]=t; } g.index.needsUpdate=true; g.computeVertexNormals(); }
return g;
}
/* loft: cross-sections along +X. sec={x,w,h,y,z,p,bf} (w along Z, h along Y, p=superellipse exponent, bf=bottom flattening 0..1) */
function loft(secs,radial,uvRep){
radial=radial||20; var rows=secs.length,cols=radial+1,pos=[],uv=[],idx=[];
for(var r=0;r<rows;r++){ var s=secs[r],p=s.p||2,bf=s.bf===undefined?1:s.bf;
for(var c=0;c<cols;c++){ var a=c/radial*Math.PI*2,ca=Math.cos(a),sa=Math.sin(a);
var px=Math.sign(ca)*Math.pow(Math.abs(ca),2/p),py=Math.sign(sa)*Math.pow(Math.abs(sa),2/p); if(py<0)py*=bf;
pos.push(s.x,(s.y||0)+py*s.h*0.5,(s.z||0)+px*s.w*0.5); uv.push(c/radial*(uvRep||1),r/(rows-1)); } }
for(var r2=0;r2<rows-1;r2++)for(var c2=0;c2<radial;c2++){ var a0=r2*cols+c2,b0=(r2+1)*cols+c2; idx.push(a0,b0,a0+1,a0+1,b0,b0+1); }
var g=new THREE.BufferGeometry(); g.setAttribute('position',new THREE.Float32BufferAttribute(pos,3)); g.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2)); g.setIndex(idx); return fixWinding(g);
}
/* symmetric airfoil section polygon (unit chord), t = thickness ratio */
var AF_N=[[0,0],[0.012,0.02],[0.05,0.043],[0.15,0.066],[0.3,0.078],[0.5,0.07],[0.7,0.048],[0.9,0.018],[1,0.002]];
/* wingLoft: stations along span; st={s (span coord), xle, chord, y, t, z?} ; axis 'z' (horizontal wing) or 'y' (vertical fin).
   returns smooth airfoil-sectioned wing, thickness tapering with chord */
function wingLoft(stations,axis,side,tcr){
var secs=[],nA=AF_N.length,pos=[],uv=[],idx=[],cols=nA*2-1+1; tcr=tcr||1;
for(var i=0;i<stations.length;i++){ var st=stations[i],ring=[];
for(var k=0;k<nA;k++){ var a=AF_N[k]; ring.push([st.xle-a[0]*st.chord,a[1]*st.chord*(st.t||0.1)/0.078*tcr]); }
for(var k2=nA-2;k2>=0;k2--){ var a2=AF_N[k2]; ring.push([st.xle-a2[0]*st.chord,-a2[1]*st.chord*(st.t||0.1)/0.078*tcr]); }
ring.forEach(function(q,qi){
var x=q[0],th=q[1];
if(axis==='z')pos.push(x,(st.y||0)+th,side*st.s); else pos.push(x,(st.y||0)+st.s,side*(th)+(st.z||0));
uv.push(qi/(ring.length-1),i/(stations.length-1)); }); cols=ring.length; }
for(var r=0;r<stations.length-1;r++)for(var c=0;c<cols-1;c++){ var a0=r*cols+c,b0=(r+1)*cols+c; idx.push(a0,b0,a0+1,a0+1,b0,b0+1); }
var g=new THREE.BufferGeometry(); g.setAttribute('position',new THREE.Float32BufferAttribute(pos,3)); g.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2)); g.setIndex(idx); return fixWinding(g);
}
function latheX(prof,seg){ // profile [[x,r],...] revolved around X axis
var pts=prof.map(function(p){ return new THREE.Vector2(Math.max(0.0001,p[1]),p[0]); });
var g=new THREE.LatheGeometry(pts,seg||14); g.rotateZ(-Math.PI/2); return g; // lathe axis Y -> X
}
function tubeArc(pts,r,seg){ return new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts.map(function(p){ return new THREE.Vector3(p[0],p[1],p[2]); })),seg||14,r,6,false); }
/* rotor/prop blade: tapered, twisted, airfoil section; span along +X from root */
function bladeGeo(len,c0,c1,thick,twistDeg,tipColor){
var st=[],n=9; for(var i=0;i<n;i++){ var u=i/(n-1); st.push({u:u,c:c0+(c1-c0)*u,tw:(twistDeg||0)*(u-0.4)*Math.PI/180}); }
var pos=[],col=[],idx=[],nA=AF_N.length,ringN=nA*2-1;
st.forEach(function(s){ var ring=[];
for(var k=0;k<nA;k++)ring.push([-AF_N[k][0]*s.c+s.c*0.25,AF_N[k][1]*s.c*thick/0.078]);
for(var k2=nA-2;k2>=0;k2--)ring.push([-AF_N[k2][0]*s.c+s.c*0.25,-AF_N[k2][1]*s.c*thick/0.078]);
ring.forEach(function(q){ var cx=Math.cos(s.tw),sx=Math.sin(s.tw); pos.push(s.u*len,q[1]*cx+q[0]*sx*0.0,q[0]*cx-q[1]*sx); var tip=s.u>0.93; var cc=tip&&tipColor?tipColor:[0.07,0.075,0.08]; col.push(cc[0],cc[1],cc[2]); }); });
for(var r=0;r<st.length-1;r++)for(var c=0;c<ringN-1;c++){ var a0=r*ringN+c,b0=(r+1)*ringN+c; idx.push(a0,a0+1,b0,a0+1,b0+1,b0); }
var g=new THREE.BufferGeometry(); g.setAttribute('position',new THREE.Float32BufferAttribute(pos,3)); g.setAttribute('color',new THREE.Float32BufferAttribute(col,3)); g.setIndex(idx); return fixWinding(g);
}
function extrudePlate(pts,depth,bevel){
var sh=new THREE.Shape(); sh.moveTo(pts[0][0],pts[0][1]); for(var i=1;i<pts.length;i++)sh.lineTo(pts[i][0],pts[i][1]); sh.closePath();
var g=new THREE.ExtrudeGeometry(sh,{depth:depth,bevelEnabled:true,bevelThickness:bevel||0.02,bevelSize:bevel||0.02,bevelSegments:2,curveSegments:6}); g.translate(0,0,-depth/2); return g;
}
function addMerged(group,parts,mat){ var g=mergeGeo(parts); var m=new THREE.Mesh(g,mat); m.castShadow=true; group.add(m); return m; }
function mkTire(r,w){ var t=new THREE.TorusGeometry(r*0.78,r*0.34,8,16); t.scale(1,1,w/(r*0.68)); var hub=new THREE.CylinderGeometry(r*0.52,r*0.52,w*0.7,10); hub.rotateX(Math.PI/2); return [t,hub]; }

/* ================= attack helicopter model (lofted fuselage, airfoil blades, detailed stores) ================= */
function buildAttackHeli(grp,P){
var body=P.bodyMat,dark=P.dark,glass=P.glass,R={exh:[]};
var D=[]; // merged small details (vertex colours)
function det(g,c,sh){ D.push({g:g,color:c,shade:sh||1}); }
// ---- fuselage + tail boom (one smooth loft) ----
var fus=loft([
{x:3.55,w:.06,h:.06,y:.10},{x:3.35,w:.42,h:.38,y:.16,p:2.4},{x:3.0,w:.78,h:.62,y:.24,p:2.5},{x:2.5,w:1.05,h:.85,y:.34,p:2.6,bf:.8},
{x:1.9,w:1.2,h:1.0,y:.46,p:2.7,bf:.75},{x:1.2,w:1.05,h:1.25,y:.62,p:2.8,bf:.7},{x:.4,w:1.0,h:1.4,y:.82,p:2.8,bf:.7},{x:-.4,w:1.25,h:1.5,y:.86,p:2.7,bf:.7},
{x:-1.3,w:1.5,h:1.45,y:.9,p:2.6,bf:.72},{x:-2.3,w:1.35,h:1.2,y:.9,p:2.5,bf:.78},{x:-3.2,w:.95,h:.86,y:.88,p:2.3},{x:-4.3,w:.66,h:.66,y:.93,p:2.2},
{x:-5.6,w:.5,h:.5,y:1.02,p:2.1},{x:-6.8,w:.38,h:.42,y:1.16,p:2.1},{x:-7.45,w:.24,h:.3,y:1.24},{x:-7.55,w:.05,h:.06,y:1.26}],28,1);
var fm=new THREE.Mesh(fus,body); fm.castShadow=true; grp.add(fm);
// engine nacelles
[-1,1].forEach(function(s){
var nac=loft([{x:1.0,w:.05,h:.05,y:1.15,z:s*.95},{x:.9,w:.58,h:.66,y:1.2,z:s*.95,p:2.6},{x:.2,w:.78,h:.8,y:1.22,z:s*.95,p:2.7},{x:-.9,w:.86,h:.82,y:1.2,z:s*.95,p:2.7},{x:-2.1,w:.7,h:.7,y:1.18,z:s*.95,p:2.5},{x:-2.9,w:.4,h:.42,y:1.16,z:s*.95},{x:-3.02,w:.36,h:.38,y:1.16,z:s*.95}],18,1);
var nm=new THREE.Mesh(nac,body); nm.castShadow=true; grp.add(nm);
det(mgT(new THREE.TorusGeometry(.3,.055,8,18),.9,1.2,s*.95,0,Math.PI/2,0),0x2a2f33);
det(mgT(new THREE.CircleGeometry(.27,16),.87,1.2,s*.95,0,Math.PI/2,0),0x0e1012);
det(mgT(latheX([[0,.2],[.14,.23],[.42,.19],[.6,.16]],12),-3.0,1.16,s*.95,0,0,0),0x23282c);
det(mgT(latheX([[0,.14],[.3,.12]],10),-3.06,1.16,s*.95,0,0,0),0x050505);
for(var v=0;v<4;v++)det(mgT(new THREE.BoxGeometry(.5,.03,.04),-.6-v*.38,1.22+.1+(v%2)*.04,s*(.95+.28),0,0,0),0x16191b);
// exhaust glow sprite
var gl=new THREE.Sprite(new THREE.SpriteMaterial({map:texGlow,color:0xff9a3c,transparent:true,opacity:0,blending:THREE.AdditiveBlending,depthWrite:false})); gl.scale.set(1.7,1.1,1); gl.position.set(-3.35,1.16,s*.95); grp.add(gl); R.exh.push(gl);
});
// ---- canopies (gunner front, pilot raised rear) with frame arches ----
var cg=[loft([{x:3.0,w:.06,h:.06,y:.62},{x:2.75,w:.62,h:.46,y:.74,p:2.3},{x:2.3,w:.92,h:.74,y:.88,p:2.4},{x:1.8,w:1.02,h:.82,y:.98,p:2.5},{x:1.3,w:.96,h:.7,y:1.0},{x:1.15,w:.1,h:.1,y:.98}],18),
loft([{x:1.05,w:.1,h:.1,y:1.25},{x:.7,w:.82,h:.7,y:1.42,p:2.4},{x:.1,w:.98,h:.95,y:1.5,p:2.5},{x:-.5,w:.92,h:.8,y:1.5,p:2.5},{x:-.85,w:.55,h:.5,y:1.45},{x:-1.0,w:.05,h:.05,y:1.4}],18)];
cg.forEach(function(g){ var m=new THREE.Mesh(g,glass); m.renderOrder=3; grp.add(m); });
[[2.35,.92,.74,.88],[1.85,1.02,.82,.98],[.55,.88,.9,1.46],[-.1,.98,.95,1.5],[-.55,.9,.78,1.5]].forEach(function(a){
var pts=[]; for(var t=0;t<=8;t++){ var ang=Math.PI*(t/8); pts.push([a[0],a[3]+Math.sin(ang)*a[2]*.5*1.01-.04,Math.cos(ang)*a[1]*.5*1.01]); }
det(tubeArc(pts,.022,12),0x1a1d20); });
det(mgT(new THREE.BoxGeometry(2.0,.04,.06),1.4,1.05,0,0,0,0),0x1a1d20); det(mgT(new THREE.BoxGeometry(1.5,.04,.06),-.1,1.98,0,0,0,0),0x1a1d20);
// cockpit interior: seats + HUD glass, visible through the canopy
det(mgT(new THREE.BoxGeometry(.34,.5,.34),.45,1.3,0,0,0,0),0x2d3236); det(mgT(new THREE.BoxGeometry(.3,.44,.3),2.05,.95,0,0,0,0),0x2d3236);
det(mgT(new THREE.BoxGeometry(.26,.3,.3),1.0,1.1,0,0,0,0),0x14171a);
// ---- sensors: TADS turret + PNVS ----
var tg=new THREE.Group(); tg.position.set(3.28,.06,0); grp.add(tg); R.tads=tg;
var tm=new THREE.SphereGeometry(.33,16,12); tm.scale(1.15,1,.95); var tmesh=new THREE.Mesh(tm,new THREE.MeshStandardMaterial({color:0x2b3035,roughness:.35,metalness:.6})); tmesh.castShadow=true; tg.add(tmesh);
var lensM=new THREE.MeshStandardMaterial({color:0x59d6ff,roughness:.05,metalness:.3,emissive:0x0b3a4a}); var l1=new THREE.Mesh(new THREE.CylinderGeometry(.13,.13,.05,14),lensM); l1.rotation.z=Math.PI/2; l1.position.set(.24,.02,.08); tg.add(l1); var l2=new THREE.Mesh(new THREE.CylinderGeometry(.085,.085,.05,12),new THREE.MeshStandardMaterial({color:0xff5030,roughness:.1,emissive:0x401008})); l2.rotation.z=Math.PI/2; l2.position.set(.22,-.18,-.1); tg.add(l2);
det(mgT(new THREE.BoxGeometry(.32,.22,.36),3.08,.62,0),0x2b3035); det(mgT(new THREE.CylinderGeometry(.09,.09,.05,10),3.26,.62,0,0,0,Math.PI/2),0x44ff99);
// pilots: helmet, visor, shoulders, arms (front gunner + rear pilot)
[[2.05,.95,0],[.45,1.3,0]].forEach(function(p){ var hm=new THREE.SphereGeometry(.14,12,10); hm.scale(1.05,1,.95); det(mgT(hm,p[0]+0.02,p[1]+.42,p[2]),0x56604a); var vs=new THREE.SphereGeometry(.125,12,8,0,Math.PI,0,Math.PI*0.6); vs.rotateY(Math.PI/2); det(mgT(vs,p[0]+.08,p[1]+.42,p[2]),0x0a0e12);
det(mgT(new THREE.BoxGeometry(.26,.34,.38),p[0]-.02,p[1]+.12,p[2]),0x6a6f5a); det(mgT(new THREE.CylinderGeometry(.04,.04,.34,6),p[0]+.12,p[1]+.1,p[2]+.16,0,0,1.2),0x6a6f5a); det(mgT(new THREE.CylinderGeometry(.04,.04,.34,6),p[0]+.12,p[1]+.1,p[2]-.16,0,0,1.2),0x6a6f5a); });
// ---- tail fin, tip, stabilator ----
var fin=extrudePlate([[-6.0,1.1],[-7.75,1.15],[-7.98,3.0],[-7.3,3.05]],.16,.035); var fm2=new THREE.Mesh(fin,body); fm2.castShadow=true; grp.add(fm2);
det(mgT(extrudePlate([[-7.3,2.78],[-7.99,2.78],[-7.99,3.06],[-7.3,3.06]],.18,.03),0,0,0),P.accent);
var stab=extrudePlate([[-6.3,-.14],[-6.95,-1.6],[-7.55,-1.6],[-7.35,-.1],[-7.35,.1],[-7.55,1.6],[-6.95,1.6],[-6.3,.14]],.09,.02); stab.rotateX(-Math.PI/2); stab.translate(0,1.14,0);
var sm=new THREE.Mesh(stab,body); sm.castShadow=true; grp.add(sm);
// ---- main rotor ----
var rm=new THREE.Group(); rm.position.set(-.35,1.95,0); R.rotorMain=rm;
var mast=new THREE.CylinderGeometry(.14,.2,.8,12); mast.translate(0,-.36,0);
var hubParts=[{g:mast,color:0x2a2f33},{g:mgT(new THREE.CylinderGeometry(.34,.4,.26,16),0,.02,0),color:0x22272b},{g:mgT(new THREE.TorusGeometry(.3,.05,6,16),0,-.34,0,Math.PI/2,0,0),color:0x3a4045}];
for(var k=0;k<4;k++){ var gg=new THREE.CylinderGeometry(.09,.1,.55,8); gg.rotateZ(Math.PI/2); gg.rotateY(k*Math.PI/2); gg.translate(Math.cos(k*Math.PI/2)*.42,.04,-Math.sin(k*Math.PI/2)*.42); hubParts.push({g:gg,color:0x2a2f33}); }
var hubM=new THREE.Mesh(mergeGeo(hubParts),new THREE.MeshStandardMaterial({vertexColors:true,roughness:.5,metalness:.55})); rm.add(hubM);
var bl=bladeGeo(5.25,.55,.4,.055,9,[0.95,0.78,0.12]); var bm=new THREE.MeshStandardMaterial({vertexColors:true,roughness:.5,metalness:.35,side:THREE.DoubleSide});
for(var b=0;b<4;b++){ var bgrp=new THREE.Group(); bgrp.rotation.y=b*Math.PI/2; var bmesh=new THREE.Mesh(bl,bm); bmesh.position.set(.5,.06,0); bmesh.rotation.z=.04; bmesh.castShadow=true; bgrp.add(bmesh); rm.add(bgrp); }
R.rotorBlur=new THREE.Mesh(new THREE.CircleGeometry(5.65,40),new THREE.MeshBasicMaterial({color:0x222222,transparent:true,opacity:.10,side:THREE.DoubleSide,depthWrite:false}));
R.rotorBlur.rotation.x=-Math.PI/2; R.rotorBlur.position.y=.1; rm.add(R.rotorBlur);
var ring=new THREE.Mesh(new THREE.TorusGeometry(5.6,.045,6,48),new THREE.MeshBasicMaterial({color:0x111111,transparent:true,opacity:.28})); ring.rotation.x=Math.PI/2; ring.position.y=.1; rm.add(ring);
grp.add(rm);
if(P.longbow){ var dp=[[.05,0],[.3,.02],[.46,.12],[.5,.25],[.42,.38],[.2,.46],[.05,.48]].map(function(q){ return new THREE.Vector2(q[0],q[1]); }); var dome=new THREE.LatheGeometry(dp,20); dome.translate(-.35,2.22,0); det(dome,0x3a4045); det(mgT(new THREE.CylinderGeometry(.08,.1,.3,8),-.35,2.12,0),0x23282c); }
// ---- tail rotor ----
var tr=new THREE.Group(); tr.position.set(-7.78,1.8,.2); R.rotorTail=tr;
var tbl=bladeGeo(1.05,.3,.22,.05,6,[0.95,0.78,0.12]); tbl.rotateX(Math.PI/2);
for(var q=0;q<4;q++){ var tm=new THREE.Mesh(tbl,bm); tm.rotation.z=q*Math.PI/2; tm.position.set(0,0,0); tr.add(tm); }
var thub=new THREE.Mesh(new THREE.CylinderGeometry(.12,.12,.16,10),new THREE.MeshStandardMaterial({color:0x2a2f33,metalness:.5,roughness:.5})); thub.rotation.x=Math.PI/2; tr.add(thub);
R.tailBlur=new THREE.Mesh(new THREE.CircleGeometry(1.08,24),new THREE.MeshBasicMaterial({color:0x222222,transparent:true,opacity:.13,side:THREE.DoubleSide,depthWrite:false})); tr.add(R.tailBlur);
grp.add(tr);
// ---- stub wings, pylons, rocket pods, Hellfire rails ----
[-1,1].forEach(function(s){
var wpts=s>0?[[.75,.35],[.55,2.65],[-.35,2.65],[-.5,.35]]:[[.75,-.35],[-.5,-.35],[-.35,-2.65],[.55,-2.65]];
var wg=extrudePlate(wpts,.13,.025); wg.rotateX(-Math.PI/2); wg.translate(0,.32,0); var wmesh=new THREE.Mesh(wg,body); wmesh.castShadow=true; grp.add(wmesh);
det(mgT(new THREE.SphereGeometry(.09,8,6),.15,.34,s*2.66),s<0?0xff2020:0x20ff60,1.6);
[1.35,2.2].forEach(function(zz){ var py=extrudePlate([[.45,.28],[.28,-.1],[-.22,-.1],[-.4,.28]],.12,.02); det(mgT(py,0,0,s*zz),0x3d4349); });
// rocket pod (19 tubes)
det(mgT(latheX([[-.95,.1],[-.9,.3],[.9,.3],[.98,.24],[1.06,.1],[1.08,.02]],16),0,-.28,s*2.2),0x4b5348);
det(mgT(latheX([[-.4,.31],[-.36,.34],[-.28,.34],[-.24,.31]],14),.5,-.28,s*2.2),0x2d332b); det(mgT(latheX([[-.4,.31],[-.36,.34],[-.28,.34],[-.24,.31]],14),-.5,-.28,s*2.2),0x2d332b);
for(var tt=0;tt<7;tt++){ var aa=tt===0?0:(tt-1)/6*Math.PI*2,rr=tt===0?0:.18; det(mgT(new THREE.CircleGeometry(.065,8),.99+(0)*0.0,-.28+Math.sin(aa)*rr,s*2.2+Math.cos(aa)*rr,0,Math.PI/2,0),0x070707); }
// Hellfire missiles on a rail
det(mgT(new THREE.BoxGeometry(1.5,.08,.26),.1,-.2,s*1.35),0x3a4045);
[-.1,.1].forEach(function(dz){ det(mgT(latheX([[-.9,.0],[-.85,.085],[.55,.09],[.82,.06],[.98,.0]],10),.1,-.33,s*1.35+dz*1.3),0xd8dcd8); det(mgT(latheX([[.55,.09],[.7,.095],[.98,.0]],10),.1,-.33,s*1.35+dz*1.3),0x384046);
for(var f=0;f<4;f++){ det(mgT(new THREE.BoxGeometry(.28,.015,.2),-.7,-.33+Math.sin(f*Math.PI/2)*.1,s*1.35+dz*1.3+Math.cos(f*Math.PI/2)*.1,f*Math.PI/2,0,0),0x555b60); } });
});
// ---- landing gear ----
[-1,1].forEach(function(s){
det(mgT(new THREE.CylinderGeometry(.075,.085,.9,8),.15,-.35,s*.95,s*.07,0,0),0x2a2f33); det(mgT(new THREE.CylinderGeometry(.12,.12,.55,8),.15,-.95,s*1.0,s*.07,0,0),0x3a4045);
det(mgT(new THREE.CylinderGeometry(.05,.05,1.1,6),-.35,-.55,s*.98,s*.07,0,.55),0x2a2f33);
det(mgT(new THREE.CylinderGeometry(.04,.04,.5,6),.15,-1.5,s*1.1,Math.PI/2,0,0),0x555b60);
var tp=mkTire(.4,.26); det(mgT(tp[0],.15,-1.55,s*1.15,0,0,0),0x101010); det(mgT(tp[1],.15,-1.55,s*1.15,0,0,0),0x7a8085); });
det(mgT(new THREE.CylinderGeometry(.06,.07,1.0,6),-6.4,.1,0,0,0,.35),0x2a2f33); var tw=mkTire(.28,.18); det(mgT(tw[0],-6.65,-.62,0),0x101010); det(mgT(tw[1],-6.65,-.62,0),0x7a8085);
// ---- antennas, jammer, chaff, wire cutters ----
det(mgT(new THREE.CylinderGeometry(.012,.02,.8,5),-5.0,1.4,0),0x1a1d20); det(mgT(new THREE.CylinderGeometry(.012,.02,.6,5),-3.4,1.65,.2,0,0,-.3),0x1a1d20);
det(mgT(new THREE.BoxGeometry(.38,.14,.3),-2.6,1.64,0),0x23282c); det(mgT(new THREE.BoxGeometry(.5,.18,.12),-4.6,.82,.34),0x2f3438); det(mgT(new THREE.BoxGeometry(.5,.18,.12),-4.6,.82,-.34),0x2f3438);
det(mgT(new THREE.BoxGeometry(.08,.6,.06),1.55,.92,0,0,0,-.5),0x1a1d20);
det(mgT(new THREE.CylinderGeometry(.03,.03,1.1,5),3.0,.52,.46,0,0,Math.PI/2),0x1a1d20);
var dm=new THREE.Mesh(mergeGeo(D),new THREE.MeshStandardMaterial({vertexColors:true,roughness:.5,metalness:.4})); dm.castShadow=true; grp.add(dm);
// ---- chin gun (M230) : yaw/pitch hooks used by the game ----
var gt=new THREE.Group(); gt.position.set(1.3,.02,0); gt.rotation.order='YXZ'; grp.add(gt); R.gunTurret=gt;
var gh=new THREE.SphereGeometry(.34,14,10); gh.scale(1.2,.85,1.05); var ghm=new THREE.Mesh(gh,dark); ghm.position.y=-.12; ghm.castShadow=true; gt.add(ghm);
var gmnt=new THREE.Mesh(new THREE.CylinderGeometry(.2,.26,.2,10),dark); gmnt.position.y=.08; gt.add(gmnt);
var gdrum=new THREE.Mesh(new THREE.CylinderGeometry(.2,.2,.32,10),dark); gdrum.rotation.x=Math.PI/2; gdrum.position.set(-.38,-.24,0); gt.add(gdrum);
var gb=new THREE.Group(); gb.position.y=-.12; gt.add(gb); R.gunBarrel=gb;
var barrel=new THREE.Mesh(latheX([[.3,.06],[1.9,.052]],8),dark); gb.add(barrel);
var shroud=new THREE.Mesh(latheX([[.35,.12],[1.0,.12],[1.05,.09]],10),dark); gb.add(shroud);
var brake=new THREE.Mesh(latheX([[1.85,.09],[2.1,.09],[2.14,.05]],8),dark); gb.add(brake);
var mz=new THREE.Object3D(); mz.position.set(2.2,0,0); gb.add(mz); R.gunMuzzle=mz;
// beacon + strobe
var bc=new THREE.Mesh(new THREE.SphereGeometry(.08,6,5),new THREE.MeshBasicMaterial({color:0xff3333})); bc.position.set(-.35,P.longbow?2.64:2.2,0); grp.add(bc);
R.strobe=new THREE.Mesh(new THREE.SphereGeometry(.12,6,5),new THREE.MeshBasicMaterial({color:0xffffff})); R.strobe.position.set(-8.0,3.12,0); grp.add(R.strobe);
return R;
}
function buildHeliPlayer(){
var sk=heliSkinMaps(); heliBodyMat=new THREE.MeshStandardMaterial({map:sk.map,normalMap:sk.normal,normalScale:new THREE.Vector2(0.9,0.9),roughness:.5,metalness:.36}); regEnv(heliBodyMat,.55);
var dark=new THREE.MeshStandardMaterial({color:0x1e2428,roughness:.45,metalness:.55});
var glass=new THREE.MeshStandardMaterial({color:0x2a4a5c,roughness:.04,metalness:.1,transparent:true,opacity:.5}); regEnv(glass,1.6);
var R=buildAttackHeli(heli,{bodyMat:heliBodyMat,dark:dark,glass:glass,accent:0x8a3320,longbow:true});
tadsGroup=R.tads; rotorMain=R.rotorMain; rotorTail=R.rotorTail; rotorBlur=R.rotorBlur; tailBlur=R.tailBlur; heliStrobe=R.strobe; gunTurret=R.gunTurret; gunBarrel=R.gunBarrel; gunMuzzle=R.gunMuzzle; R.exh.forEach(function(e){ heliExhaust.push(e); });
var light=new THREE.PointLight(0xffdd99,.6,16); light.position.set(2.2,-.4,0); heli.add(light);
}
function buildHeliEnemy(){
var dark=new THREE.MeshStandardMaterial({color:0x1e2428,roughness:.45,metalness:.55});
var glass=new THREE.MeshStandardMaterial({color:0x7a4a1a,roughness:.04,metalness:.1,transparent:true,opacity:.55}); regEnv(glass,1.4);
var sk2=heliSkinMaps(); eHeliMat.map=sk2.map; eHeliMat.normalMap=sk2.normal; eHeliMat.normalScale=new THREE.Vector2(0.9,0.9); eHeliMat.needsUpdate=true; var R=buildAttackHeli(eheli,{bodyMat:eHeliMat,dark:dark,glass:glass,accent:0x111111,longbow:false});
eRotorMain=R.rotorMain; eRotorTail=R.rotorTail;
}

/* ================= fighter jet: blended lofted fuselage, airfoil wings, canted fins, detailed nozzles & stores ================= */
function buildFighterModel(){
var camoTex=jetTex();
jetMat=new THREE.MeshStandardMaterial({map:camoTex,color:0x8d99a4,roughness:.34,metalness:.62}); regEnv(jetMat,.7);
var camoDark=new THREE.MeshStandardMaterial({map:camoTex,color:0x77828c,roughness:.42,metalness:.55,side:THREE.DoubleSide}); regEnv(camoDark,.5);
var glass=new THREE.MeshStandardMaterial({color:0x2e5a70,roughness:.03,metalness:.15,transparent:true,opacity:.5}); regEnv(glass,1.7);
var D=[]; function det(g,c,sh){ D.push({g:g,color:c,shade:sh||1}); }
var fus=loft([
{x:7.75,w:.05,h:.05,y:.05},{x:7.4,w:.38,h:.36,y:.06,p:2.2},{x:6.5,w:.86,h:.78,y:.1,p:2.3},{x:5.4,w:1.22,h:1.0,y:.16,p:2.4},{x:4.2,w:1.55,h:1.18,y:.22,p:2.5,bf:.7},
{x:2.6,w:2.0,h:1.28,y:.2,p:2.8,bf:.62},{x:.8,w:2.5,h:1.2,y:.12,p:3.2,bf:.55},{x:-1.5,w:2.7,h:1.12,y:.1,p:3.4,bf:.55},{x:-3.6,w:2.55,h:1.0,y:.08,p:3.2,bf:.58},
{x:-5.0,w:2.2,h:.95,y:.06,p:2.8},{x:-5.75,w:1.9,h:.9,y:.06,p:2.6},{x:-5.95,w:1.76,h:.84,y:.06,p:2.4}],28,2);
var fm=new THREE.Mesh(fus,jetMat); fm.castShadow=true; jet.add(fm);
var spine=new THREE.Mesh(loft([{x:2.4,w:.05,h:.05,y:.7},{x:1.2,w:.9,h:.36,y:.78,p:2.6},{x:-1.5,w:1.15,h:.32,y:.74,p:2.8},{x:-4.0,w:.7,h:.22,y:.7},{x:-4.6,w:.3,h:.1,y:.66}],14,1),jetMat); spine.castShadow=true; jet.add(spine);
// intakes
[-1,1].forEach(function(s){
var it=new THREE.Mesh(loft([{x:3.95,w:.95,h:1.02,y:-.12,z:s*1.5,p:3.6,bf:.7},{x:3.2,w:1.0,h:1.08,y:-.1,z:s*1.45,p:3.6,bf:.7},{x:1.2,w:.95,h:1.0,y:-.04,z:s*1.35,p:3.4},{x:-.6,w:.7,h:.9,y:0,z:s*1.2,p:3}],18,1),jetMat); it.castShadow=true; jet.add(it);
det(mgT(new THREE.PlaneGeometry(.8,.92),3.96,-.12,s*1.5,0,Math.PI/2,0),0x08090a); det(mgT(new THREE.BoxGeometry(2.2,.04,.5),3.2,.4,s*.78,0,0,0),0x3a424a);
det(mgT(new THREE.TorusGeometry(.5,.035,6,18),3.97,-.12,s*1.5,0,Math.PI/2,0).scale(1,1.0,1),0x2a3036);
});
// canopy + frames + seat
var can=new THREE.Mesh(loft([{x:5.65,w:.05,h:.05,y:.62},{x:5.2,w:.7,h:.46,y:.76,p:2.3},{x:4.3,w:.96,h:.72,y:.9,p:2.4},{x:3.2,w:.92,h:.68,y:.9,p:2.5},{x:2.4,w:.6,h:.45,y:.8},{x:2.0,w:.05,h:.05,y:.7}],18,1),glass); can.renderOrder=3; jet.add(can);
[[4.75,.88,.6,.86],[4.0,.96,.7,.9],[3.2,.92,.66,.9]].forEach(function(a){ var pts=[]; for(var t=0;t<=8;t++){ var ang=Math.PI*(t/8); pts.push([a[0],a[3]+Math.sin(ang)*a[2]*.5*1.01-.12,Math.cos(ang)*a[1]*.5*1.01]); } det(tubeArc(pts,.026,12),0x1b1f23); });
det(mgT(new THREE.BoxGeometry(2.8,.04,.06),4.0,1.28,0),0x1b1f23);
det(mgT(new THREE.BoxGeometry(.5,.5,.5),3.7,.78,0),0x2c3237); det(mgT(new THREE.BoxGeometry(.18,.34,.5),4.9,.9,0,0,0,-.5),0x2c3237,.8);
det(mgT(new THREE.BoxGeometry(.04,.28,.4),5.35,1.0,0,0,0,-.35),0x6aa8c0,1.3);
// radome + pitot
det(mgT(latheX([[7.4,.2],[7.7,.12],[7.95,.03]],12),0,.06,0),0x2b3036); det(mgT(new THREE.CylinderGeometry(.03,.03,1.2,5),8.3,.06,0,0,0,Math.PI/2),0x2b3036);
// wings: airfoil sections, tapered, with flaps/ailerons
[-1,1].forEach(function(s){
var wg=wingLoft([{s:1.0,xle:2.7,chord:6.8,y:-.04,t:.085},{s:3.4,xle:.2,chord:4.1,y:-.02,t:.07},{s:6.3,xle:-2.3,chord:1.7,y:.05,t:.06}],'z',s,1);
var wm=new THREE.Mesh(wg,camoDark); wm.castShadow=true; jet.add(wm);
var st=wingLoft([{s:1.2,xle:-4.0,chord:2.6,y:.0,t:.06},{s:3.3,xle:-5.3,chord:1.2,y:.04,t:.05}],'z',s,1);
var sm=new THREE.Mesh(st,camoDark); sm.castShadow=true; jet.add(sm);
// canted vertical fin
var fin=wingLoft([{s:0,xle:-2.4,chord:3.4,y:.0,t:.07},{s:1.3,xle:-3.5,chord:2.4,y:0,t:.06},{s:2.7,xle:-5.0,chord:1.35,y:0,t:.05}],'y',1,1);
var fmesh=new THREE.Mesh(fin,camoDark); fmesh.castShadow=true; fmesh.position.set(0,.52,s*1.05); fmesh.rotation.x=s*.2; jet.add(fmesh);
det(mgT(new THREE.BoxGeometry(.75,.12,.12),-5.35,.52+2.65*Math.cos(.2),s*(1.05+2.65*Math.sin(.2))),0x1b1f23);
// flaperons & aileron lines
det(mgT(new THREE.BoxGeometry(1.3,.01,.05),-1.5,.0,s*2.2,0,0,0),0x2a2f33); det(mgT(new THREE.BoxGeometry(.05,.01,2.2),-.6,.0,s*3.6,0,0,0),0x2a2f33);
// stores: AIM-9 at tip rail, AIM-120 + tank on pylons
det(mgT(extrudePlate([[1.0,.0],[.6,-.35],[-.8,-.35],[-.9,.0]],.1,.02),0,-.08,s*2.4),0x3a4147);
det(mgT(latheX([[-1.2,.0],[-1.15,.3],[1.2,.3],[1.5,.2],[1.75,.0]],14),0,-.58,s*2.4,0,0,0),0x7e858b);
det(mgT(new THREE.BoxGeometry(.9,.015,.35),-.9,-.58,s*2.4),0x7e858b);
det(mgT(latheX([[-1.35,.0],[-1.3,.075],[1.1,.08],[1.35,.0]],10),-0.4,.0,s*6.3),0xe0e4e0); det(mgT(latheX([[-.1,.08],[.95,.082],[1.25,.0]],10),-.4,.0,s*6.3),0x394148);
for(var f=0;f<4;f++)det(mgT(new THREE.BoxGeometry(.5,.012,.28),-1.55,Math.sin(f*Math.PI/2)*.15,s*6.3+Math.cos(f*Math.PI/2)*.15,f*Math.PI/2,0,0),0x4a5258);
det(mgT(latheX([[-1.0,.0],[-.95,.08],[1.0,.09],[1.3,.0]],10),1.2,-.42,s*1.4),0xd8dcd8);
// nozzles
det(mgT(latheX([[0,.62],[.25,.64],[.7,.58],[1.2,.5]],20),-6.0,.06,s*.62),0x30363b,1);
det(mgT(latheX([[0,.5],[1.1,.44]],18),-5.98,.06,s*.62),0x0c0c0e,1);
for(var pt=0;pt<16;pt++){ var pa=pt/16*Math.PI*2; det(mgT(new THREE.BoxGeometry(.9,.04,.1),-6.55,.06+Math.sin(pa)*.55,s*.62+Math.cos(pa)*.55,pa,0,0),0x464d53); }
});
// belly keel, airbrake, gun port, antennas, formation light strips
det(mgT(new THREE.BoxGeometry(2.4,.1,.1),.5,-.62,0),0x2c3237); det(mgT(new THREE.BoxGeometry(1.4,.03,1.1),-2.6,.9,0),0x20262b);
det(mgT(new THREE.CylinderGeometry(.06,.06,.7,6),3.3,-.15,1.1,0,0,Math.PI/2),0x15181a);
det(mgT(new THREE.CylinderGeometry(.015,.02,.5,5),1.8,.98,.4),0x15181a); det(mgT(new THREE.CylinderGeometry(.015,.02,.5,5),-3.3,.9,-.2),0x15181a);
det(mgT(new THREE.BoxGeometry(1.0,.04,.05),.9,.52,.65),0x58b8ff,2.2); det(mgT(new THREE.BoxGeometry(1.0,.04,.05),.9,.52,-.65),0xff6a58,2.2);
var dm=new THREE.Mesh(mergeGeo(D),new THREE.MeshStandardMaterial({vertexColors:true,roughness:.42,metalness:.5})); dm.castShadow=true; jet.add(dm);
// strobe on the right fin tip
jetStrobe=new THREE.Mesh(new THREE.SphereGeometry(.11,6,5),new THREE.MeshBasicMaterial({color:0xffffff})); jetStrobe.position.set(-5.45,.52+2.7*Math.cos(.2),1.05+2.7*Math.sin(.2)); jet.add(jetStrobe);
// afterburner flames (HDR, feeds the bloom)
jetFlame=new THREE.Group(); jetFlame.visible=false; jet.add(jetFlame);
[-1,1].forEach(function(s){
var burner=new THREE.Group(); burner.position.set(-6.5,.06,s*.62); jetFlame.add(burner); jetBurners.push(burner);
var outer=new THREE.Mesh(latheX([[0,.0],[.1,.4],[.8,.44],[1.9,.28],[3.4,.0]],14),new THREE.MeshBasicMaterial({color:new THREE.Color(3.0,1.35,.4),transparent:true,opacity:.85,blending:THREE.AdditiveBlending,depthWrite:false})); outer.rotation.y=Math.PI; burner.add(outer);
var core=new THREE.Mesh(latheX([[0,.0],[.1,.22],[.7,.24],[1.5,.12],[2.3,.0]],12),new THREE.MeshBasicMaterial({color:new THREE.Color(4.5,3.8,2.6),transparent:true,opacity:.95,blending:THREE.AdditiveBlending,depthWrite:false})); core.rotation.y=Math.PI; burner.add(core);
var gl=new THREE.Sprite(new THREE.SpriteMaterial({map:texGlow,color:new THREE.Color(2.4,1.2,.4),transparent:true,opacity:.9,blending:THREE.AdditiveBlending,depthWrite:false})); gl.scale.set(3.2,3.2,1); gl.position.set(-.3,0,0); burner.add(gl);
});
// landing gear (toggled by the game)
jetGear=new THREE.Group(); jet.add(jetGear);
var gd=[]; function gdet(g,c){ gd.push({g:g,color:c}); }
gdet(mgT(new THREE.CylinderGeometry(.06,.08,.8,8),4.4,-.45,0),0x9aa0a5); gdet(mgT(new THREE.CylinderGeometry(.1,.1,.35,8),4.4,-.9,0),0x6a7075); gdet(mgT(new THREE.BoxGeometry(.5,.04,.34),4.1,-.4,0,0,0,-.5),0x3a4046);
var nt=mkTire(.3,.14); [-.12,.12].forEach(function(dz){ gdet(mgT(nt[0].clone(),4.4,-1.15,dz),0x101010); gdet(mgT(nt[1].clone(),4.4,-1.15,dz),0x7a8085); });
[-1,1].forEach(function(s){
gdet(mgT(new THREE.CylinderGeometry(.08,.1,.9,8),-1.7,-.5,s*1.05,s*.14,0,0),0x9aa0a5); gdet(mgT(new THREE.CylinderGeometry(.12,.12,.4,8),-1.7,-1.0,s*1.1,s*.14,0,0),0x6a7075);
var mt=mkTire(.46,.26); gdet(mgT(mt[0],-1.7,-1.18,s*1.12),0x101010); gdet(mgT(mt[1],-1.7,-1.18,s*1.12),0x7a8085);
gdet(mgT(new THREE.BoxGeometry(1.1,.04,.56),-1.7,-.38,s*.9),0x3a4046);
});
jetGear.add(new THREE.Mesh(mergeGeo(gd),new THREE.MeshStandardMaterial({vertexColors:true,roughness:.5,metalness:.5})));
}

/* ================= airliner: smooth fuselage with painted livery/windows, swept airfoil wings, winglets, turbofans ================= */
var _airTexCache={};
function airlinerTex(liv){
if(_airTexCache[liv])return _airTexCache[liv];
var W=512,H=1536,c=document.createElement('canvas'); c.width=W; c.height=H; var g=c.getContext('2d');
var col='#'+('000000'+liv.toString(16)).slice(-6);
g.fillStyle='#f4f5f2'; g.fillRect(0,0,W,H);
g.fillStyle='#b9bdbd'; g.fillRect(W*0.6,0,W*0.3,H);                 // belly
var grd=g.createLinearGradient(W*0.55,0,W*0.62,0); grd.addColorStop(0,'rgba(185,189,189,0)'); grd.addColorStop(1,'rgba(185,189,189,1)'); g.fillStyle=grd; g.fillRect(W*0.55,0,W*0.07,H);
function Y(v){ return H*(1-v); }
// cheatlines (livery colour) on both flanks, sweeping up at the tail
[[0.972,1],[0.513,-1]].forEach(function(s){
g.fillStyle=col; g.fillRect(s[0]*W-W*0.012,Y(0.93),W*0.026,Y(0.07)-Y(0.93)); g.fillStyle='rgba(255,255,255,0.35)'; g.fillRect(s[0]*W-W*0.003,Y(0.93),W*0.006,Y(0.07)-Y(0.93)); });
// window rows
[[0.021,0],[0.482,0]].forEach(function(s){
for(var i=0;i<62;i++){ var v=0.17+i*(0.58/61); var y=Y(v); var x=s[0]*W;
g.fillStyle='#1d2a38'; g.beginPath(); g.roundRect?g.roundRect(x-6,y-5,12,10,3):g.rect(x-6,y-5,12,10); g.fill(); g.fillStyle='rgba(255,255,255,0.25)'; g.fillRect(x-5,y-4,10,3);} });
// doors + cargo hold outlines
g.strokeStyle='rgba(60,65,70,0.55)'; g.lineWidth=2;
[0.021,0.482].forEach(function(u){ [0.15,0.44,0.77].forEach(function(v){ g.strokeRect(u*W-9,Y(v)-14,18,28); }); g.strokeRect(u*W-12,Y(0.68)-8,24,16); });
// cockpit windows (both sides + windscreen on top front)
g.fillStyle='#10161d';
[[0.024,1],[0.478,1]].forEach(function(s){ for(var k=0;k<3;k++){ g.fillRect(s[0]*W-9+(s[1]>0?0:0),Y(0.068)-k*0+ -k*14,11,9);} });
g.fillRect(W*0.22,Y(0.062),W*0.06,16); g.fillRect(W*0.22,Y(0.062)-20,W*0.06,14); g.fillRect(W*0.72,Y(0.062),W*0.0,0);
// nose cone tint + tail cone livery
g.fillStyle=col; g.fillRect(0,Y(1),W,H*0.1); g.fillStyle='rgba(0,0,0,0.12)'; g.fillRect(0,Y(0.06),W,H*0.012);
// panel seams
g.strokeStyle='rgba(80,85,90,0.2)'; g.lineWidth=1; for(var p=0;p<60;p++){ var yy=H*(0.08+p*0.0155); g.beginPath(); g.moveTo(0,yy); g.lineTo(W,yy); g.stroke(); }
// dirt streaks
for(var d=0;d<260;d++){ g.fillStyle='rgba(40,40,35,'+(Math.random()*0.04).toFixed(3)+')'; g.fillRect(Math.random()*W,Math.random()*H,Math.random()*3,Math.random()*40); }
var t=new THREE.CanvasTexture(c); t.wrapS=THREE.RepeatWrapping; t.colorSpace=THREE.SRGBColorSpace; t.anisotropy=MAX_ANISO; _airTexCache[liv]=t; return t;
}
function makeAirlinerAt(x,z,livery){
var grp=new THREE.Group(); grp.position.set(x,0,z);
var bodyM=new THREE.MeshStandardMaterial({map:airlinerTex(livery),color:0xffffff,roughness:.3,metalness:.22}); regEnv(bodyM,.6);
var livM=new THREE.MeshStandardMaterial({color:livery,roughness:.38,metalness:.3,side:THREE.DoubleSide});
var wingM=new THREE.MeshStandardMaterial({color:0xdadddb,roughness:.42,metalness:.4,side:THREE.DoubleSide}); regEnv(wingM,.4);
var darkM=new THREE.MeshStandardMaterial({color:0x2b3d4a,roughness:.2,metalness:.3});
var CY=4.3,D=[]; function det(g,c,sh){ D.push({g:g,color:c,shade:sh||1}); }
var fus=loft([
{x:19.2,w:.1,h:.1,y:CY-.5},{x:18.7,w:1.4,h:1.3,y:CY-.42,p:2},{x:17.4,w:2.9,h:2.8,y:CY-.2},{x:15.4,w:4.1,h:4.1,y:CY-.05},{x:12.8,w:4.9,h:5.0,y:CY},{x:9.0,w:5.2,h:5.3,y:CY},
{x:-6.0,w:5.2,h:5.3,y:CY},{x:-10.2,w:4.8,h:5.0,y:CY+.15},{x:-14.0,w:3.7,h:4.0,y:CY+.75},{x:-17.2,w:2.3,h:2.7,y:CY+1.4},{x:-19.4,w:.9,h:1.1,y:CY+1.85},{x:-20.2,w:.3,h:.4,y:CY+1.95}],32,1);
var body=new THREE.Mesh(fus,bodyM); body.castShadow=true; grp.add(body);
// wing root fairing
[-1,1].forEach(function(s){
var fair=loft([{x:5.0,w:.1,h:.1,y:2.7,z:s*2.4},{x:3.0,w:2.0,h:1.1,y:3.0,z:s*2.7,p:2.5},{x:-3.0,w:2.6,h:1.2,y:3.0,z:s*2.9,p:2.5},{x:-7.5,w:.5,h:.5,y:3.2,z:s*2.3}],14,1); grp.add(new THREE.Mesh(fair,bodyM));
// swept wing with dihedral, flaps and winglet
var wg=wingLoft([{s:2.3,xle:4.6,chord:10.0,y:3.0,t:.13},{s:9.0,xle:-2.4,chord:5.2,y:3.35,t:.105},{s:16.2,xle:-8.0,chord:2.2,y:4.5,t:.085}],'z',s,1);
var wm=new THREE.Mesh(wg,wingM); wm.castShadow=true; grp.add(wm);
var wl=wingLoft([{s:0,xle:-8.0,chord:2.2,y:4.5,t:.08},{s:1.2,xle:-8.8,chord:1.5,y:4.5,t:.06},{s:2.5,xle:-9.7,chord:.8,y:4.5,t:.05}],'y',1,1);
var wlm=new THREE.Mesh(wl,livM); wlm.position.set(0,0,s*16.15); wlm.rotation.x=s*.22; wlm.castShadow=true; grp.add(wlm);
// horizontal stabilizer
var hs=wingLoft([{s:1.0,xle:-13.4,chord:4.6,y:5.9,t:.09},{s:6.3,xle:-18.0,chord:1.9,y:6.4,t:.07}],'z',s,1); var hm=new THREE.Mesh(hs,wingM); hm.castShadow=true; grp.add(hm);
// engine: nacelle, lip, fan face, nozzle, pylon
var ex=7.1*s;
var nac=latheX([[-2.2,.55],[-1.6,.85],[-.6,1.12],[1.3,1.2],[2.2,1.26],[2.55,1.18],[2.62,1.02]],24); nac.translate(1.2,2.2,ex); var nm=new THREE.Mesh(nac,wingM); nm.castShadow=true; grp.add(nm);
det(mgT(new THREE.TorusGeometry(1.1,.08,8,24),3.82,2.2,ex,0,Math.PI/2,0),0xaeb3b6);
det(mgT(new THREE.CircleGeometry(1.05,24),3.7,2.2,ex,0,Math.PI/2,0),0x15191c);
det(mgT(new THREE.CircleGeometry(.36,16),3.74,2.2,ex,0,Math.PI/2,0),0x8a9096);
for(var b=0;b<18;b++){ var ba=b/18*Math.PI*2; det(mgT(new THREE.BoxGeometry(.04,.62,.12),3.72,2.2+Math.sin(ba)*.7,ex+Math.cos(ba)*.7,ba,0,0),0x5d6469); }
det(mgT(latheX([[0,.74],[.9,.58],[1.4,.36]],16),-1.0,2.2,ex),0x3a4046); det(mgT(latheX([[0,.0],[.9,.3],[1.3,.0]],12),-1.0,2.2,ex),0x2a2f33);
det(mgT(extrudePlate([[2.0,3.3],[1.2,1.15],[-2.0,1.15],[-3.4,3.45]],.3,.04),0,0,ex),0xdadddb);
});
// vertical stabilizer in livery colour
var vf=wingLoft([{s:0,xle:-10.2,chord:8.6,y:6.0,t:.11},{s:4.5,xle:-13.2,chord:5.6,y:6.0,t:.09},{s:9.2,xle:-16.8,chord:3.2,y:6.0,t:.07}],'y',1,1);
var vm=new THREE.Mesh(vf,livM); vm.castShadow=true; vm.position.y=0; grp.add(vm);
det(mgT(latheX([[0,.0],[.3,.35],[.9,.0]],10),-20.2,CY+1.95,0),0x6a6f73);
// beacons, antennas
det(mgT(new THREE.SphereGeometry(.16,8,6),-6,CY+2.7,0),0xff3030,2); det(mgT(new THREE.SphereGeometry(.16,8,6),4,CY-2.6,0),0xff3030,2);
det(mgT(new THREE.CylinderGeometry(.03,.04,.9,5),8,CY+2.8,0),0x30353a); det(mgT(new THREE.BoxGeometry(1.3,.12,.25),-2,CY+2.65,0),0xd8dbd8);
// landing gear: nose + two 4-wheel bogies, doors
var gearC=0x474c51;
det(mgT(new THREE.CylinderGeometry(.14,.18,2.0,8),13.5,.9,0),gearC); var nt=mkTire(.55,.38); [-.38,.38].forEach(function(dz){ det(mgT(nt[0].clone(),13.5,.55,dz),0x101010); det(mgT(nt[1].clone(),13.5,.55,dz),0x8a9096); });
det(mgT(new THREE.BoxGeometry(1.8,.08,1.6),13.2,1.9,0),0x2c3135);
[-1,1].forEach(function(s){
det(mgT(new THREE.CylinderGeometry(.2,.26,2.4,8),-1.2,1.65,s*3.3),gearC); det(mgT(new THREE.BoxGeometry(2.4,.16,.18),-1.2,.62,s*3.3),0x3a3f44);
[-.75,.75].forEach(function(dx){ [-.5,.5].forEach(function(dz){ var mt=mkTire(.6,.42); det(mgT(mt[0].clone(),-1.2+dx,.6,s*3.3+dz),0x101010); det(mgT(mt[1].clone(),-1.2+dx,.6,s*3.3+dz),0x8a9096); }); });
});
var dm=new THREE.Mesh(mergeGeo(D),new THREE.MeshStandardMaterial({vertexColors:true,roughness:.5,metalness:.4})); dm.castShadow=true; grp.add(dm);
var o=registerCustom(grp,body,38,31,11,'airliner',240000000,11000,190,{radius:17,dmg:55});
o.isPlane=true; return o;
}


var jet=null, jetFlame=null, jetMat=null, jetGear=null, jetStrobe=null;
var jetBurners=[];
(function buildAirbase(){
var grp=new THREE.Group(); scene.add(grp);
var rw=new THREE.Mesh(new THREE.PlaneGeometry(150,15),new THREE.MeshStandardMaterial({color:0x2e2e33,roughness:0.95}));
rw.rotation.x=-Math.PI/2; rw.position.set(-3,0.04,BASE.z); rw.receiveShadow=true; grp.add(rw);
var stripeM=new THREE.MeshBasicMaterial({color:0xe8e4c8});
for(var i=0;i<9;i++){ var st=new THREE.Mesh(new THREE.PlaneGeometry(7,0.7),stripeM); st.rotation.x=-Math.PI/2; st.position.set(-66+i*16,0.07,BASE.z); grp.add(st);}
var edgeM=new THREE.MeshBasicMaterial({color:0xffe27a});
for(var e2=0;e2<10;e2++){ [-8.2,8.2].forEach(function(dz){ var lm=new THREE.Mesh(new THREE.SphereGeometry(0.3,6,5),edgeM); lm.position.set(-70+e2*15,0.4,BASE.z+dz); grp.add(lm);});}
// hangars + tower — set well back from the runway with a clear apron
// behind it. (The hangar roofs used to be rotated so their 22m length ran
// north–south, reaching to within ~1.5m of the runway's south edge, and a
// blank 30m board floated unsupported at y=5 right behind the strip —
// together they read as a second runway laid right behind the real one.)
var hangM=new THREE.MeshStandardMaterial({color:0x5d6a72,roughness:0.8});
[[-38,230],[2,232],[42,230]].forEach(function(p){
var h=new THREE.Mesh(new THREE.BoxGeometry(22,7,14),hangM); h.position.set(p[0],3.5,p[1]); h.castShadow=true; grp.add(h);
var rf=new THREE.Mesh(new THREE.CylinderGeometry(8,8,22,10,1,false,0,Math.PI),new THREE.MeshStandardMaterial({color:0x48545c,roughness:0.8}));
rf.rotation.z=Math.PI/2; rf.position.set(p[0],7,p[1]); grp.add(rf);
});
var tw=new THREE.Mesh(new THREE.BoxGeometry(4,15,4),new THREE.MeshStandardMaterial({color:0xb9c0c4,roughness:0.7}));
tw.position.set(66,7.5,214); tw.castShadow=true; grp.add(tw);
var cab=new THREE.Mesh(new THREE.BoxGeometry(6,3,6),new THREE.MeshStandardMaterial({color:0x2b3d4a,roughness:0.25,metalness:0.3}));
cab.position.set(66,16.5,214); grp.add(cab);
})();

function jetTex(){
var c=document.createElement('canvas'); c.width=c.height=256; var g=c.getContext('2d');
g.fillStyle='#c3c9cf'; g.fillRect(0,0,256,256);
// two-tone air-superiority grey camouflage: big soft blotches, never flat
var cols=['#a7b0b8','#959fa8','#b4bcc2'];
for(var i=0;i<30;i++){ g.fillStyle=cols[i%3]; g.globalAlpha=0.5; g.beginPath(); g.ellipse(Math.random()*256,Math.random()*256,26+Math.random()*52,14+Math.random()*30,Math.random()*3,0,Math.PI*2); g.fill(); }
g.globalAlpha=1;
for(var n=0;n<2200;n++){ g.fillStyle='rgba('+(Math.random()<0.5?'20,26,32':'240,244,246')+','+(Math.random()*0.05).toFixed(3)+')'; g.fillRect(Math.random()*256,Math.random()*256,2,2);}
// panel lines + access hatches + rivet rows — the detail that reads as a real airframe
g.strokeStyle='rgba(28,34,40,0.4)'; g.lineWidth=1.3;
for(var px=0;px<=256;px+=42){ g.beginPath(); g.moveTo(px,0); g.lineTo(px,256); g.stroke(); }
for(var py=0;py<=256;py+=58){ g.beginPath(); g.moveTo(0,py); g.lineTo(256,py); g.stroke(); }
g.strokeStyle='rgba(28,34,40,0.3)';
for(var hp=0;hp<7;hp++){ g.strokeRect(Math.random()*190,Math.random()*190,26+Math.random()*36,18+Math.random()*26); }
g.fillStyle='rgba(28,34,40,0.5)';
for(var rx=6;rx<256;rx+=13)for(var ry=6;ry<256;ry+=58){ g.fillRect(rx,ry,1.6,1.6); }
// exhaust soot + grime streaks trailing backwards
for(var st=0;st<9;st++){ var grd=g.createLinearGradient(0,0,70,0); grd.addColorStop(0,'rgba(24,22,18,0.30)'); grd.addColorStop(1,'rgba(24,22,18,0)'); g.save(); g.translate(Math.random()*170,Math.random()*256); g.fillStyle=grd; g.fillRect(0,0,70,4.5); g.restore(); }
var t=new THREE.CanvasTexture(c); t.wrapS=t.wrapT=THREE.RepeatWrapping; if(THREE.SRGBColorSpace)t.colorSpace=THREE.SRGBColorSpace; return t;
}
(function buildJet(){
jet=new THREE.Group();
buildFighterModel();
jet.scale.setScalar(1.18);
jet.rotation.order='YXZ';
jet.position.set(BASE.runStart,1.35,BASE.z);
scene.add(jet);
})();
function flickBurners(a,b){ for(var i=0;i<jetBurners.length;i++){ jetBurners[i].scale.set(rand(a,b),rand(0.88,1.08),rand(0.88,1.08)); } }
var jetState={active:false,down:false,hp:70,maxHp:70,yaw:0,pitch:0,speed:0,fireCd:2.2,mslCd:5,burst:0,burstT:0,smokeT:0};
var enemyShots=[]; // {mesh,vel,kind,dmg,life}
var eShotGeo=new THREE.SphereGeometry(0.32,8,6);
var eGunMat=new THREE.MeshBasicMaterial({color:0xffd23c}); eGunMat.color.setRGB(4.5,0.9,0.25);
var eMslMat=new THREE.MeshStandardMaterial({color:0xe8e8e8,roughness:0.3});
/* ================= enemy attack helicopter ================= */
var EH_PAD={x:-110,z:-110}; // NW corner block centre — enemy heli pad (city default; kept clear of buildings)
var eheli=null, eRotorMain=null, eRotorTail=null, eHeliMat=null, eRotorSpeed=0;
(function buildEnemyPad(){
var grp=new THREE.Group(); grp.position.set(EH_PAD.x,0,EH_PAD.z); scene.add(grp); enemyPadGroup=grp;
var base=new THREE.Mesh(new THREE.CylinderGeometry(8.6,8.6,0.2,32),new THREE.MeshStandardMaterial({color:0x3a3230,roughness:0.95}));
base.position.y=0.16; base.receiveShadow=true; grp.add(base);
var ring=new THREE.Mesh(new THREE.TorusGeometry(7.1,0.22,8,40),new THREE.MeshStandardMaterial({color:0xff5a3c,roughness:0.5,emissive:0x571a08}));
ring.rotation.x=Math.PI/2; ring.position.y=0.3; grp.add(ring);
var hMat=new THREE.MeshStandardMaterial({color:0xff5a3c,roughness:0.55});
[-1.55,1.55].forEach(function(hx){ var bar=new THREE.Mesh(new THREE.BoxGeometry(0.9,0.07,4.6),hMat); bar.position.set(hx,0.3,0); grp.add(bar);});
var cross=new THREE.Mesh(new THREE.BoxGeometry(2.3,0.07,0.9),hMat); cross.position.set(0,0.3,0); grp.add(cross);
var lm2=new THREE.MeshBasicMaterial({color:0xff8a70});
for(var i=0;i<8;i++){ var a=i/8*Math.PI*2; var s=new THREE.Mesh(new THREE.SphereGeometry(0.3,8,6),lm2); s.position.set(Math.cos(a)*8,0.45,Math.sin(a)*8); grp.add(s);}
})();
(function buildEnemyHeli(){
eheli=new THREE.Group();
eHeliMat=new THREE.MeshStandardMaterial({color:0x5c3226,roughness:0.5,metalness:0.42});
regEnv(eHeliMat,0.45);
buildHeliEnemy();
eheli.scale.setScalar(0.92);
eheli.rotation.order='YXZ';
eheli.position.set(EH_PAD.x,1.85,EH_PAD.z);
scene.add(eheli);
})();
var ehState={active:false,down:false,hp:55,maxHp:55,yaw:0,vel:new THREE.Vector3(),fireCd:3.2,burst:0,burstT:0,smokeT:0};
function resetEnemyHeli(){
ehState.maxHp=(currentStage==='military')?75:55; ehState.active=false; ehState.down=false; ehState.hp=ehState.maxHp;
ehState.yaw=0; ehState.vel.set(0,0,0); ehState.fireCd=3.2; ehState.burst=0; ehState.burstT=0; ehState.smokeT=0;
eRotorSpeed=0;
if(eheli){ eheli.visible=true; eheli.position.set(EH_PAD.x,1.85,EH_PAD.z); eheli.rotation.set(0,0.8,0);}
if(eHeliMat)eHeliMat.color.setHex(0x5c3226);
var eb=document.getElementById('ehBox'); if(eb)eb.classList.remove('on');
var ebb=document.getElementById('ehBar'); if(ebb)ebb.style.width='100%';
}
function damageEnemyHeli(dmg){
if(!ehState.active||ehState.down)return;
ehState.hp-=dmg;
if(eHeliMat){ eHeliMat.color.setHex(0xff9a6a); setTimeout(function(){ if(eHeliMat&&!ehState.down)eHeliMat.color.setHex(0x5c3226);},90);}
var eb=document.getElementById('ehBar'); if(eb)eb.style.width=clamp(ehState.hp/ehState.maxHp*100,0,100)+'%';
if(ehState.hp<=0){
ehState.down=true; ehState.active=false;
spawnExplosion(eheli.position.clone(),true);
spawnExplosion(eheli.position.clone().add(new THREE.Vector3(-2,1,1)),false);
eheli.visible=false;
document.getElementById('ehBox').classList.remove('on');
G.score+=2500; G.yen+=6000000;
showCenter('敵ヘリ撃墜！ ＋2,500点');
updateHUD();
}
}
function ehFireGun(){
// aimed burst from the enemy heli's chin turret — lighter damage than the jet's gun
var lead=heliState.vel.clone().multiplyScalar(eheli.position.distanceTo(heliState.pos)/95*0.45);
var aim=heliState.pos.clone().add(lead).sub(eheli.position).normalize();
aim.x+=rand(-0.055,0.055); aim.y+=rand(-0.04,0.04); aim.z+=rand(-0.055,0.055); aim.normalize();
var m=new THREE.Mesh(eShotGeo,eGunMat);
m.position.copy(eheli.position).add(aim.clone().multiplyScalar(3.5)); m.position.y-=0.6;
scene.add(m);
enemyShots.push({mesh:m,vel:aim.multiplyScalar(95),kind:'gun',dmg:3,life:2.2});
sGun(eheli.position);
}
function updateEnemyHeli(dt){
if(!ehState.active||ehState.down)return;
eRotorSpeed=38;
var pos=eheli.position;
var toPlayer=heliState.pos.clone().sub(pos);
var dist=toPlayer.length();
// orbit point around the player at the player's own altitude — circles and strafes instead of ramming
G.ehOrbit=(G.ehOrbit||0)+dt*0.42;
var bothActive=jetState.active&&!jetState.down;
var orbitR=bothActive?46:36;
var target=heliState.pos.clone().add(new THREE.Vector3(Math.cos(G.ehOrbit)*orbitR,2.5,Math.sin(G.ehOrbit)*orbitR));
if(dist>85)target.copy(heliState.pos).add(new THREE.Vector3(0,2,0)); // close in first
target.y=clamp(target.y,13,64);
var desired=target.sub(pos);
var dLen=desired.length();
var speed=dist>85?29:24;
var desiredVel=dLen>0.1?desired.normalize().multiplyScalar(Math.min(speed,dLen*1.4+4)):new THREE.Vector3();
ehState.vel.lerp(desiredVel,1-Math.pow(0.01,dt));
pos.addScaledVector(ehState.vel,dt);
pos.y=clamp(pos.y,groundY(pos.x,pos.z)+11,Math.max(66,heliState.pos.y+45));
// face the player when in gun range, otherwise face the direction of travel
var faceDir=(dist<72)?toPlayer.clone():ehState.vel.clone();
var dyaw=0;
if(faceDir.lengthSq()>0.01){
faceDir.normalize();
var targetYaw=Math.atan2(-faceDir.z,faceDir.x);
dyaw=Math.atan2(Math.sin(targetYaw-ehState.yaw),Math.cos(targetYaw-ehState.yaw));
ehState.yaw+=clamp(dyaw,-1.9*dt,1.9*dt);
}
eheli.rotation.y=ehState.yaw;
eheli.rotation.z=clamp(-ehState.vel.length()*0.006,-0.18,0.05);
eheli.rotation.x=clamp(-dyaw*0.3,-0.3,0.3);
// gun bursts — pauses between bursts, and eases off while the jet is also firing
ehState.fireCd-=dt;
if(ehState.burst>0){
ehState.burstT-=dt;
if(ehState.burstT<=0){ ehFireGun(); ehState.burst--; ehState.burstT=0.1;}
} else if(dist<68&&dist>10){
var toHN=toPlayer.clone(); toHN.y=0; var dh=toHN.length(); toHN.normalize();
var fwd=new THREE.Vector3(Math.cos(ehState.yaw),0,-Math.sin(ehState.yaw));
if(dh>1&&fwd.dot(toHN)>0.75&&ehState.fireCd<=0){
ehState.burst=4; ehState.burstT=0;
ehState.fireCd=rand(2.9,4.1)*(bothActive?1.7:1); // never both enemies pouring fire non-stop
}
}
// damaged: dark smoke trail
if(ehState.hp<ehState.maxHp*0.55){ ehState.smokeT-=dt; if(ehState.smokeT<=0){ ehState.smokeT=0.08; spawnPuff(pos.clone(),0x2e2c28,2.4,1.1,1.3,0.6);} }
}
function resetJet(){
jetState.maxHp=(currentStage==='military')?95:70; jetState.active=false; jetState.down=false; jetState.hp=jetState.maxHp;
jetState.yaw=0; jetState.pitch=0; jetState.speed=0; jetState.fireCd=2.2; jetState.mslCd=5; jetState.burst=0; jetState.burstT=0;
jet.visible=true; jet.position.set(BASE.runStart,1.36,BASE.z); jet.rotation.set(0,0,0);
if(jetFlame)jetFlame.visible=false;
if(jetGear)jetGear.visible=true;
if(jetMat)jetMat.color.setHex(0x8d99a4);
for(var i=enemyShots.length-1;i>=0;i--)scene.remove(enemyShots[i].mesh);
enemyShots.length=0;
var jb=document.getElementById('jetBox'); if(jb)jb.classList.remove('on');
}
function damageJet(dmg){
if(!jetState.active||jetState.down)return;
jetState.hp-=dmg;
if(jetMat){ jetMat.color.setHex(0xff9a6a); setTimeout(function(){ if(jetMat&&!jetState.down)jetMat.color.setHex(0x8d99a4);},90);}
var jb=document.getElementById('jetBar'); if(jb)jb.style.width=clamp(jetState.hp/jetState.maxHp*100,0,100)+'%';
if(jetState.hp<=0){
jetState.down=true; jetState.active=false;
spawnExplosion(jet.position.clone(),true);
spawnExplosion(jet.position.clone().add(new THREE.Vector3(2,1,0)),false);
jet.visible=false;
document.getElementById('jetBox').classList.remove('on');
G.score+=5000; G.yen+=12000000;
showCenter('戦闘機撃墜！ ＋5,000点');
updateHUD();
}
}
function damageHeli(dmg,label){
if(G.mode!=='play'||G.scramblePhase==='cutscene'||G.ehPhase==='intro')return;
G.heliHp-=dmg; shake=Math.min(shake+0.65,1.5); fxHurt(0.9); fxHitStop(0.5,0.07);
var hf=document.getElementById('hitFlash'); hf.classList.remove('on'); void hf.offsetWidth; hf.classList.add('on');
sHit(); updateHpBar();
spawnExplosion(heliState.pos.clone().add(new THREE.Vector3(rand(-1,1),0,rand(-1,1))),false);
if(G.heliHp<=30&&G.heliHp>0)showCenter('機体損傷大！ 帰還を急げ');
if(G.heliHp<=0){ G.heliHp=0; updateHpBar(); startCrash('shotdown'); }
}
function jetFireGun(){
var dir=heliState.pos.clone().sub(jet.position);
var dist=dir.length(); dir.normalize();
dir.x+=rand(-0.05,0.05); dir.y+=rand(-0.04,0.04); dir.z+=rand(-0.05,0.05); dir.normalize();
// lead the target slightly — fast movers dodge out of the line
var lead=heliState.vel.clone().multiplyScalar(dist/95*0.55);
var aim=heliState.pos.clone().add(lead).sub(jet.position).normalize();
aim.x+=rand(-0.045,0.045); aim.y+=rand(-0.035,0.035); aim.z+=rand(-0.045,0.045); aim.normalize();
var m=new THREE.Mesh(eShotGeo,eGunMat);
m.position.copy(jet.position).add(aim.clone().multiplyScalar(4));
scene.add(m);
enemyShots.push({mesh:m,vel:aim.multiplyScalar(95),kind:'gun',dmg:5,life:2.2});
sGun(jet.position);
}
function jetFireMissile(){
var grp=new THREE.Group();
var b=new THREE.Mesh(mslGeo,eMslMat); b.rotation.z=Math.PI/2; grp.add(b);
var tip=new THREE.Mesh(new THREE.ConeGeometry(0.24,0.7,8),mslTipMat); tip.rotation.z=-Math.PI/2; tip.position.x=1.4; grp.add(tip);
var fl=new THREE.Mesh(new THREE.SphereGeometry(0.34,8,6),new THREE.MeshBasicMaterial({color:0xff5a3c})); fl.position.x=-1.3; grp.add(fl);
var fwd=new THREE.Vector3(1,0,0).applyQuaternion(jet.quaternion);
grp.position.copy(jet.position).add(fwd.clone().multiplyScalar(4)); grp.position.y-=0.6;
grp.quaternion.setFromUnitVectors(new THREE.Vector3(1,0,0),fwd.clone());
scene.add(grp);
enemyShots.push({mesh:grp,vel:fwd.multiplyScalar(46),kind:'missile',dmg:14,life:4.5});
showCenter('⚠ 敵ミサイル接近！ 回避せよ');
sLaunch(jet.position);
}
function updateJet(dt){
if(!jetState.active||jetState.down)return;
// steer toward a moving intercept / orbit point around the heli
var toHeli=heliState.pos.clone().sub(jet.position);
var dist=toHeli.length();
var orbitSide=(Math.floor(G.elapsed/9)%2===0)?1:-1;
var target=heliState.pos.clone();
if(dist<34){ // break away to re-attack instead of ramming
target=heliState.pos.clone().add(new THREE.Vector3(Math.sin(jetState.yaw+2.4)*55,10,Math.cos(jetState.yaw+2.4)*55*orbitSide));
} else {
target.y+=7;
}
var desired=target.sub(jet.position);
// Steering: jetState.yaw is rotation.y directly; forward = (cos yaw, 0, -sin yaw)
var fwd=new THREE.Vector3(1,0,0).applyQuaternion(jet.quaternion); fwd.y=0; fwd.normalize();
var desN=desired.clone(); desN.y=0; desN.normalize();
var crossY=fwd.x*desN.z-fwd.z*desN.x; // sign of turn
var dot=clamp(fwd.dot(desN),-1,1);
var turnRate=clamp(-crossY*1.9,-1.15,1.15);
if(dot<-0.4)turnRate=(crossY>=0?-1.15:1.15);
jetState.yaw+=turnRate*dt;
jetState.speed=lerp(jetState.speed,50,1-Math.pow(0.05,dt));
var targetPitch=clamp((heliState.pos.y+6-jet.position.y)*0.012,-0.28,0.28);
jetState.pitch=lerp(jetState.pitch,targetPitch,1-Math.pow(0.01,dt));
jet.rotation.y=jetState.yaw;
jet.rotation.z=jetState.pitch;
jet.rotation.x=clamp(-turnRate*0.55,-0.7,0.7);
var nf=new THREE.Vector3(1,0,0).applyQuaternion(jet.quaternion);
jet.position.addScaledVector(nf,jetState.speed*dt);
jet.position.y=clamp(jet.position.y,groundY(jet.position.x,jet.position.z)+14,Math.max(80,heliState.pos.y+60));
if(jetFlame){ jetFlame.visible=true; flickBurners(0.8,1.25); }
// weapons: only when roughly facing the heli and in range — dodging breaks the line
var freshFwd=new THREE.Vector3(1,0,0).applyQuaternion(jet.quaternion); freshFwd.y=0; freshFwd.normalize();
var toHN=toHeli.clone(); toHN.y=0; var distH=toHN.length(); toHN.normalize();
var facing=freshFwd.dot(toHN);
jetState.fireCd-=dt; jetState.mslCd-=dt;
if(jetState.burst>0){
jetState.burstT-=dt;
if(jetState.burstT<=0){ jetFireGun(); jetState.burst--; jetState.burstT=0.09;}
} else if(distH<85&&distH>12&&facing>0.82&&jetState.fireCd<=0){
jetState.burst=5; jetState.burstT=0; jetState.fireCd=rand(2.3,3.4)*((ehState.active&&!ehState.down)?1.6:1);
}
if(distH<95&&distH>25&&facing>0.6&&jetState.mslCd<=0){
jetFireMissile(); jetState.mslCd=rand(6.5,9)*((ehState.active&&!ehState.down)?1.35:1);
}
}
function updateEnemyShots(dt){
for(var i=enemyShots.length-1;i>=0;i--){
var s=enemyShots[i]; s.life-=dt;
if(s.kind==='missile'){
// limited homing: sharp turns / altitude changes shake it off
var toH=(s.decoy&&s.decoy.t<s.decoy.life?s.decoy.mesh.position:heliState.pos).clone().sub(s.mesh.position);
var d=toH.length(); toH.normalize();
var cur=s.vel.clone().normalize();
var steered=cur.lerp(toH,clamp(1.35*dt,0,0.3)).normalize();
s.vel.copy(steered.multiplyScalar(Math.min(s.vel.length()+26*dt,62)));
s.mesh.quaternion.setFromUnitVectors(new THREE.Vector3(1,0,0),s.vel.clone().normalize());
}
s.mesh.position.addScaledVector(s.vel,dt);
var p=s.mesh.position;
if(s.decoy&&s.decoy.t<s.decoy.life&&p.distanceTo(s.decoy.mesh.position)<7){ spawnExplosion(p.clone(),false); scene.remove(s.mesh); enemyShots.splice(i,1); continue; }
var hitR=s.kind==='missile'?4.2:3.1;
if(G.mode==='play'&&p.distanceTo(heliState.pos)<hitR){
damageHeli(s.dmg,s.kind);
scene.remove(s.mesh); enemyShots.splice(i,1); continue;
}
if(s.life<=0||p.y<groundY(p.x,p.z)+0.4||Math.abs(p.x)>9000||Math.abs(p.z)>9000){
if(s.kind==='missile'&&p.y<6)spawnExplosion(p.clone().setY(1.5),false);
scene.remove(s.mesh); enemyShots.splice(i,1);
}
}
}
// distant layered hills / mountains + clouds
(function(){
var cloudMat=new THREE.MeshStandardMaterial({color:0xffffff,roughness:1,transparent:true,opacity:0.88,emissive:0x665544,emissiveIntensity:0.12});
var cloudMat2=new THREE.MeshStandardMaterial({color:0xf6e8d4,roughness:1,transparent:true,opacity:0.75});
window.__clouds=[];
for(var j=0;j<0;j++){
var cl=new THREE.Group();
var puffs=4+Math.floor(Math.random()*3);
for(var k=0;k<puffs;k++){ var s=new THREE.Mesh(new THREE.SphereGeometry(rand(6,14),10,8),k%2?cloudMat:cloudMat2); s.position.set(k*8-puffs*4,rand(-1.2,1.8),rand(-4,4)); s.scale.set(1.25,0.42,0.9); cl.add(s);}
cl.position.set(rand(-340,340),rand(95,145),rand(-340,340)); scene.add(cl); window.__clouds.push(cl);
}
// soft cloud shadows drifting across the ground — moving light sells the scale
window.__cloudShadows=[];
(function(){
var sc2=document.createElement('canvas'); sc2.width=sc2.height=128; var sg3=sc2.getContext('2d');
var rg3=sg3.createRadialGradient(64,64,6,64,64,62); rg3.addColorStop(0,'rgba(18,22,20,0.62)'); rg3.addColorStop(0.7,'rgba(18,22,20,0.30)'); rg3.addColorStop(1,'rgba(18,22,20,0)');
sg3.fillStyle=rg3; sg3.fillRect(0,0,128,128);
var stx=new THREE.CanvasTexture(sc2);
var sm=new THREE.MeshBasicMaterial({map:stx,transparent:true,opacity:0.5,depthWrite:false});
for(var si=0;si<6;si++){ var sh=new THREE.Mesh(new THREE.PlaneGeometry(rand(90,150),rand(60,100)),sm); sh.rotation.x=-Math.PI/2; sh.position.set(rand(-320,320),0.16,rand(-320,320)); sh.renderOrder=1; scene.add(sh); window.__cloudShadows.push(sh);}
})();
// a loose flock of birds circling high over the town — flapping wings, sells the scale
window.__birds={g:new THREE.Group(),wings:[]};
(function(){
var birdM=new THREE.MeshBasicMaterial({color:0x2c3136});
for(var bi=0;bi<7;bi++){
var b=new THREE.Group();
var a=bi/7*Math.PI*2, r=120+ (bi%3)*26;
b.position.set(Math.cos(a)*r,86+(bi%4)*6,Math.sin(a)*r);
b.rotation.y=-a;
var wgL=new THREE.BoxGeometry(1.7,0.07,0.5); wgL.translate(0.85,0,0);
var wgR=new THREE.BoxGeometry(1.7,0.07,0.5); wgR.translate(-0.85,0,0);
var wl=new THREE.Mesh(wgL,birdM), wr=new THREE.Mesh(wgR,birdM);
b.add(wl); b.add(wr);
var bd=new THREE.Mesh(new THREE.ConeGeometry(0.22,1.3,5),birdM); bd.rotation.z=Math.PI/2; b.add(bd);
window.__birds.g.add(b);
window.__birds.wings.push({l:wl,r:wr,ph:bi*1.3});
}
scene.add(window.__birds.g);
})();
})();
treesGroup=new THREE.Group(); scene.add(treesGroup);
// trees — varied broadleaf canopies, hedges along sidewalks
(function(){
var trunkM=new THREE.MeshStandardMaterial({color:0x5d4128,roughness:1});
var leafMs=[new THREE.MeshStandardMaterial({color:0x3d7031,roughness:1,flatShading:true}),new THREE.MeshStandardMaterial({color:0x4d8438,roughness:1,flatShading:true}),new THREE.MeshStandardMaterial({color:0x2f612c,roughness:1,flatShading:true})];
var trunkG=new THREE.CylinderGeometry(0.28,0.46,2.8,7);
var spots=[];
for(var i=0;i<80;i++){
var x=rand(-WORLD,WORLD), z=rand(-WORLD,WORLD);
if(Math.abs(((x%44)+44)%44)<8.5||Math.abs(((z%44)+44)%44)<8.5) continue;
if(Math.sqrt((x-PAD.x)*(x-PAD.x)+(z-PAD.z)*(z-PAD.z))<14) continue;
if(Math.sqrt((x-FUEL.x)*(x-FUEL.x)+(z-FUEL.z)*(z-FUEL.z))<14) continue;
if(Math.sqrt((x-REPAIR.x)*(x-REPAIR.x)+(z-REPAIR.z)*(z-REPAIR.z))<14) continue;
if(Math.sqrt((x-EH_PAD.x)*(x-EH_PAD.x)+(z-EH_PAD.z)*(z-EH_PAD.z))<14) continue;
spots.push([x,z]);
}
spots.forEach(function(p){
var t=new THREE.Group();
var tr=new THREE.Mesh(trunkG,trunkM); tr.position.y=1.4; tr.castShadow=true; t.add(tr);
var lm=leafMs[Math.floor(Math.random()*3)];
var c1=new THREE.Mesh(new THREE.SphereGeometry(rand(2.4,3.3),9,7),lm); c1.position.y=4.6; c1.scale.y=0.82; c1.castShadow=true; t.add(c1);
var c2=new THREE.Mesh(new THREE.SphereGeometry(rand(1.6,2.2),8,6),lm); c2.position.set(rand(-1.2,1.2),5.7,rand(-1,1)); c2.castShadow=true; t.add(c2);
if(Math.random()<0.3){ var c3=new THREE.Mesh(new THREE.ConeGeometry(2.3,5.2,7),lm); c3.position.y=5.2; t.add(c3);}
t.position.set(p[0],0,p[1]); t.scale.setScalar(rand(0.85,1.35)); t.rotation.y=rand(0,6); treesGroup.add(t);
});
// low hedges by the plaza / pad
var hedgeM=new THREE.MeshStandardMaterial({color:0x355e2e,roughness:1});
[[-2,-52],[14,-52],[30,-52],[-2,8],[30,8]].forEach(function(p){ var hg=new THREE.Mesh(new THREE.BoxGeometry(9,1.15,1.5),hedgeM); hg.position.set(p[0],0.58,p[1]); hg.castShadow=true; treesGroup.add(hg);});
})();

/* ================= destructibles ================= */
var destructibles=[]; // {group,mesh(s),type,hp,maxHp,value,scorePts,w,d,height,explosive:0|radius/dmg, destroyed, collapsing, rubble, baseY, mats:[], stage}
var totalCount=0;

function registerDestructible(o){ destructibles.push(o); totalCount++; return o;}

/* ================= architectural detail for destructible buildings (merged: one extra draw call each) ================= */
var BLD_MAT=null;
function bxg(w,h,d,x,y,z,c,sh){ return {g:mgT(new THREE.BoxGeometry(w,h,d),x,y,z),color:c,shade:sh||1}; }
function buildingDetail(grp,w,h,d,type,tintHex){
if(!BLD_MAT){ BLD_MAT=new THREE.MeshStandardMaterial({vertexColors:true,roughness:.72,metalness:.12}); regEnv(BLD_MAT,.25); }
var P=[],base=new THREE.Color(tintHex||0xcccccc),dk=base.clone().multiplyScalar(.62).getHex(),lt=base.clone().multiplyScalar(1.12).getHex(),stone=0x6e6a62;
var isHouse=type==='house',isTower=type==='tower'||h>38;
if(!isHouse){
// plinth, corner piers, cornices
P.push(bxg(w+.5,1.2,d+.5,0,.6,0,stone)); P.push(bxg(w+1.1,.5,d+1.1,0,h+.05,0,lt)); P.push(bxg(w+.7,.3,d+.7,0,h-.35,0,dk));
[[-1,-1],[1,-1],[-1,1],[1,1]].forEach(function(c){ P.push(bxg(.7,h,.7,c[0]*(w/2),h/2,c[1]*(d/2),dk)); });
// pilasters + spandrel bands on the four faces
var nW=Math.max(1,Math.round(w/4.6)),nD=Math.max(1,Math.round(d/4.6));
for(var i=1;i<nW;i++){ var px=-w/2+w*i/nW; P.push(bxg(.34,h-1.2,.36,px,(h+1.2)/2,d/2+.1,dk)); P.push(bxg(.34,h-1.2,.36,px,(h+1.2)/2,-d/2-.1,dk)); }
for(var j=1;j<nD;j++){ var pz=-d/2+d*j/nD; P.push(bxg(.36,h-1.2,.34,w/2+.1,(h+1.2)/2,pz,dk)); P.push(bxg(.36,h-1.2,.34,-w/2-.1,(h+1.2)/2,pz,dk)); }
var step=isTower?9.3:6.2;
for(var y=step;y<h-1;y+=step){ P.push(bxg(w+.28,.26,d+.28,0,y,0,lt)); }
// storefront awning + sign on the street side
var awC=[0xb23a30,0x2f6a9a,0x2f8a58,0xc9962c,0x6a4a8a][Math.floor(Math.random()*5)];
if(w>7){ var aw=mgT(new THREE.BoxGeometry(w*.7,.14,1.7),0,3.3,d/2+.95,.32,0,0); P.push({g:aw,color:awC,shade:1}); var sg=mgT(new THREE.BoxGeometry(w*.55,.7,.12),0,3.95,d/2+.34); P.push({g:sg,color:[0xffd23c,0xff7a3c,0x7ad0ff,0xe8e8e8][Math.floor(Math.random()*4)],shade:1.8}); }
// balconies on mid-height residential blocks
if(!isTower&&h>9&&h<46&&w>10){ var nb=Math.max(2,Math.round(w/6)); for(var f=4.6;f<h-3;f+=6.2){ for(var b=0;b<nb;b++){ var bxp=-w/2+w*(b+.5)/nb; P.push(bxg(1.9,.14,.95,bxp,f,d/2+.55,lt)); P.push(bxg(1.9,.7,.05,bxp,f+.42,d/2+1.0,dk)); } } }
// rooftop crown: stepped machine room, spire, helipad
if(isTower){ P.push(bxg(w*.58,Math.max(2,h*.05),d*.58,0,h+Math.max(2,h*.05)/2+.4,0,dk)); var sh2=Math.max(6,h*.14); P.push({g:mgT(new THREE.CylinderGeometry(.08,.26,sh2,6),0,h+Math.max(2,h*.05)+.4+sh2/2,0),color:0x9aa2a8,shade:1}); }
if(h>44&&w>18){ var hp=mgT(new THREE.CylinderGeometry(4.2,4.2,.15,24),w*.22,h+.55,d*.22); P.push({g:hp,color:0x3a3f44,shade:1}); var ring=mgT(new THREE.TorusGeometry(3.5,.12,6,24),w*.22,h+.66,d*.22,Math.PI/2,0,0); P.push({g:ring,color:0xf2f2f2,shade:1.5}); P.push(bxg(.4,.06,2.4,w*.22-.9,h+.68,d*.22,0xf2f2f2,1.5)); P.push(bxg(.4,.06,2.4,w*.22+.9,h+.68,d*.22,0xf2f2f2,1.5)); P.push(bxg(1.8,.06,.4,w*.22,h+.68,d*.22,0xf2f2f2,1.5)); }
// roof stair/elevator bulkhead
P.push(bxg(Math.min(5,w*.3),2.6,Math.min(4,d*.3),-w*.22,h+1.6,-d*.2,dk));
} else {
// house: gable roof, chimney, eaves, porch
var rc=[0x8c4a34,0x6a4a3c,0x555d66,0x7a5a3a][Math.floor(Math.random()*4)],rh=Math.max(2.6,w*.32);
var rg=W2A.roofGeo?W2A.roofGeo.clone():null;
if(rg){ rg.scale(w*1.12,rh,d*1.1); rg.translate(0,h+.3,0); P.push({g:rg,color:rc,shade:1}); }
P.push(bxg(.9,2.4,.9,w*.25,h+rh*.55,-d*.15,0x7a5a50)); P.push(bxg(w*.5,.14,1.4,0,2.4,d/2+.7,0x6a5a4a)); P.push(bxg(.15,2.4,.15,-w*.22,1.2,d/2+1.3,0x6a5a4a)); P.push(bxg(.15,2.4,.15,w*.22,1.2,d/2+1.3,0x6a5a4a));
}
var m=new THREE.Mesh(mergeGeo(P),BLD_MAT); m.castShadow=true; m.receiveShadow=true; grp.add(m);
return m;
}
function buildRubble(rub,w,d,h){
var P=[],n=Math.min(46,10+Math.round(h*.5)),cols=[0x6f6a63,0x58534d,0x7f7a70,0x403d39,0x8d867a];
for(var i=0;i<n;i++){ var s=rand(.7,Math.min(5.2,2+h*.08)),ang=rand(0,Math.PI*2),r=Math.sqrt(Math.random());
var g=new THREE.BoxGeometry(s*rand(.8,2.2),s*rand(.35,1),s*rand(.8,2)); mgT(g,Math.cos(ang)*r*w*.46,s*.35+rand(0,1.2)*(1-r)*Math.min(5,h*.12),Math.sin(ang)*r*d*.46,rand(-.5,.5),rand(0,3),rand(-.5,.5)); P.push({g:g,color:cols[i%cols.length],shade:rand(.7,1.1)}); }
for(var k=0;k<14;k++){ var rb=new THREE.CylinderGeometry(.04,.04,rand(1.5,4),4); mgT(rb,rand(-w*.4,w*.4),rand(.8,3),rand(-d*.4,d*.4),rand(-1,1),rand(0,3),rand(-1.2,1.2)); P.push({g:rb,color:0x6a4a38,shade:1}); }
var pile=new THREE.ConeGeometry(Math.min(w,d)*.34,Math.min(7,2.5+h*.1),7); mgT(pile,rand(-1,1),Math.min(7,2.5+h*.1)/2,rand(-1,1)); P.push({g:pile,color:0x575249,shade:1});
var m=new THREE.Mesh(mergeGeo(P),new THREE.MeshStandardMaterial({vertexColors:true,roughness:1,metalness:0})); m.castShadow=true; rub.add(m); return m;
}

/* ================= progressive destruction: impact craters through the facade + top-down crumbling =================
   every building shares one set of uniforms across all of its parts: hits punch burning holes (hollow shell shows),
   a descending cut plane makes the structure pancake from the top while dust, smoke and debris pour off the break line. */
var BLD_LIT={value:0}, HOLEFIRE=[];
function dmgPatch(mat,U,winGlow){
if(typeof mat.onBeforeCompile!=='function')mat.onBeforeCompile=function(){};
var prev=mat.onBeforeCompile,pk=mat.customProgramCacheKey?mat.customProgramCacheKey():'std';
mat.userData.baseOBC=prev; mat.userData.win=winGlow; mat.side=THREE.DoubleSide;
mat.onBeforeCompile=function(sh,r){
if(prev)prev(sh,r);
sh.uniforms.uCut=U.uCut; sh.uniforms.uHit=U.uHit; sh.uniforms.uBurn=U.uBurn; sh.uniforms.uNH=U.uNH; sh.uniforms.uBase=U.uBase; sh.uniforms.uLit=BLD_LIT; sh.uniforms.uLow=U.uLow||(U.uLow={value:-1e5}); sh.uniforms.uMov=U.uMov||(U.uMov={value:0}); sh.uniforms.uGInv=U.uGInv||(U.uGInv={value:new THREE.Matrix4()});
sh.vertexShader='varying vec3 vDW;\n'+sh.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\n vDW=(modelMatrix*vec4(transformed,1.0)).xyz;');
var glass=winGlow?'float lumW=dot(diffuseColor.rgb,vec3(0.3333)); float wGl=(1.0-smoothstep(0.26,0.5,lumW))*(gl_FrontFacing?1.0:0.0); wGl=max(wGl,wm);':'float wGl=0.0;';
var win=winGlow?'float wm=smoothstep(0.55,0.8,diffuseColor.r)*step(diffuseColor.b+0.1,diffuseColor.r)*(gl_FrontFacing?1.0:0.0); totalEmissiveRadiance+=vec3(1.0,0.7,0.3)*wm*uLit*1.1;':'float wm=0.0;';
var code=[
'vec3 vB=uMov>0.5?(uGInv*vec4(vDW,1.0)).xyz:vDW;',
'float nz=fract(sin(dot(floor(vB*1.9),vec3(12.9898,78.233,37.719)))*43758.5453);',
'if(vB.y>uCut+(nz-0.5)*1.7) discard;',
'if(vB.y<uLow+(nz-0.5)*1.7) discard;',
'float hole=0.0;',
'if(uNH>0.5){ for(int i=0;i<6;i++){ vec4 h=uHit[i]; if(h.w>0.0){ float dd=distance(vB,h.xyz); float rr=h.w*(0.6+0.85*(vn3(vB*1.25+float(i)*7.3)*0.65+vn3(vB*3.7)*0.35)); if(dd<rr) discard; hole=max(hole,smoothstep(rr*1.55,rr,dd)); } } }',
'diffuseColor.rgb*=mix(0.6,1.0,smoothstep(0.0,9.0,vB.y-uBase));',
win,
glass,
'wGlass=wGl;',
'diffuseColor.rgb*=1.0-0.88*hole;',
'totalEmissiveRadiance+=vec3(1.0,0.36,0.06)*hole*uBurn*(0.6+nz*0.9);',
'if(!gl_FrontFacing){ diffuseColor.rgb=vec3(0.035,0.033,0.03); totalEmissiveRadiance+=vec3(0.9,0.3,0.05)*uBurn*0.25*nz; }'
].join('\n');
sh.fragmentShader='float wGlass=0.0;\nuniform float uCut,uBurn,uNH,uBase,uLit,uLow,uMov; uniform mat4 uGInv; uniform vec4 uHit[6]; varying vec3 vDW;\nfloat h3(vec3 p){ return fract(sin(dot(p,vec3(12.9898,78.233,37.719)))*43758.5453); }\nfloat vn3(vec3 p){ vec3 i=floor(p),f=fract(p); f=f*f*(3.0-2.0*f); return mix(mix(mix(h3(i),h3(i+vec3(1,0,0)),f.x),mix(h3(i+vec3(0,1,0)),h3(i+vec3(1,1,0)),f.x),f.y),mix(mix(h3(i+vec3(0,0,1)),h3(i+vec3(1,0,1)),f.x),mix(h3(i+vec3(0,1,1)),h3(i+vec3(1,1,1)),f.x),f.y),f.z); }\n'+sh.fragmentShader.replace('#include <alphatest_fragment>','#include <alphatest_fragment>\n'+code).replace('#include <roughnessmap_fragment>','float roughnessFactor=roughness*mix(1.0,0.14,wGlass);').replace('#include <metalnessmap_fragment>','float metalnessFactor=clamp(metalness+wGlass*0.42,0.0,1.0);');
};
mat.customProgramCacheKey=function(){ return 'dmg'+(winGlow?'W':'L')+pk; };
mat.needsUpdate=true;
}
function dmgSetup(grp,mat,rub,topY,baseY,winGlow){
var U={uCut:{value:1e5},uHit:{value:[0,1,2,3,4,5].map(function(){ return new THREE.Vector4(0,-9999,0,0); })},uBurn:{value:0},uNH:{value:0},uBase:{value:baseY||0},n:0,top:topY,base:baseY||0};
dmgPatch(mat,U,winGlow); if(winGlow){ mat.userData.envI=0.9; mat.envMapIntensity=0.9; }
grp.traverse(function(c){
if(!c.isMesh||c===rub||c.parent===rub||c.material===mat)return;
var m=c.material; if(!m||m.transparent||m.isMeshBasicMaterial)return;
var cm=m.clone(); if(m.onBeforeCompile&&!m.userData.dmgd)cm.onBeforeCompile=m.onBeforeCompile; cm.userData={dmgd:1}; c.material=cm; dmgPatch(cm,U,false);
});
grp.userData.U=U;
}
function dmgHole(o,dmg,fromPos){
var U=o.group.userData.U; if(!U||o.isCar||o.isTank)return;
var gx=o.group.position.x,gz=o.group.position.z,hw=o.w/2,hd=o.d/2,by=o.baseY||0,top=o.height;
var px=fromPos?fromPos.x:gx+rand(-hw,hw),pz=fromPos?fromPos.z:gz+rand(-hd,hd),py=fromPos?fromPos.y:by+(top-by)*rand(0.3,0.8);
var dx=px-gx,dz=pz-gz,x,z;
if(Math.abs(dx)/hw>Math.abs(dz)/hd){ x=gx+Math.sign(dx||1)*hw; z=gz+clamp(dz,-hd*0.9,hd*0.9); } else { z=gz+Math.sign(dz||1)*hd; x=gx+clamp(dx,-hw*0.9,hw*0.9); }
var y=clamp(py,by+2,Math.max(by+3,top-1.5));
var frac=clamp(dmg/Math.max(1,o.maxHp),0,1),r=clamp(1.7+dmg*0.05+frac*6,1.9,9.5)*rand(0.85,1.15);
var n=frac>0.4?2:1;
for(var i=0;i<n;i++){ var slot=U.n%6; U.n++; U.uHit.value[slot].set(x+rand(-1,1)*(i?r*0.6:0),y+rand(-1,1)*(i?r*0.5:0),z+rand(-1,1)*(i?r*0.6:0),i?r*0.7:r); }
U.uNH.value=1; U.uBurn.value=Math.min(1,(1-o.hp/o.maxHp)*1.4+0.25);
try{ strDamage(o,x,y,z,r,dmg); if(!o.destroyed)strCheck(o); }catch(eS){ console.warn(eS); }
for(var k=0;k<5;k++)PS.emit(k<2?1:0,x+rand(-1,1),y+rand(-1,1),z+rand(-1,1),rand(-2,2),rand(1.5,4),rand(-2,2),k<2?rand(1.4,2.4):rand(2.4,3.8),k<2?0.8:2.2,k<2?rand(0.5,0.9):rand(3,5),k<2?0.9:0.3,1,0.85,0.8,2,0);
if(HOLEFIRE.length>=26)HOLEFIRE.shift();
HOLEFIRE.push({x:x,y:y,z:z,r:r,t:0,dur:rand(14,24),e:0,o:o});
for(var c=0;c<3;c++){ var chk=getChunk(); if(!chk)break; var bs=rand(0.3,0.8); chk.visible=true; chk.scale.setScalar(bs); chk.position.set(x,y,z); chk.rotation.set(rand(0,3),rand(0,3),rand(0,3));
effects.push({kind:'chunk',hot:true,mesh:chk,vel:new THREE.Vector3((x-gx)*0.25+rand(-3,3),rand(2,7),(z-gz)*0.25+rand(-3,3)),av:new THREE.Vector3(rand(-6,6),rand(-6,6),rand(-6,6)),bs:bs,t:0,dur:rand(1.2,1.9)}); }
}
function dmgUpdate(dt){
BLD_LIT.value=DUSK.cur;
for(var i=HOLEFIRE.length-1;i>=0;i--){
var f=HOLEFIRE[i]; f.t+=dt; var k=f.t/f.dur; if(k>=1||(f.o&&f.o.collapsing<0)){ HOLEFIRE.splice(i,1); continue; }
f.e-=dt; if(f.e<=0){ f.e=0.14; var inten=k<0.6?1:1-(k-0.6)/0.4;
PS.emit(1,f.x+rand(-1,1)*f.r*0.4,f.y+rand(-0.4,0.4),f.z+rand(-1,1)*f.r*0.4,rand(-0.6,0.6),rand(2,4.5),rand(-0.6,0.6),rand(1.2,2.2)*Math.min(1.6,f.r/3),0.8,rand(0.5,0.9),0.85*inten,1,0.75*inten,0.9,3.5,0);
if(Math.random()<0.6)PS.emit(0,f.x,f.y+1,f.z,rand(-0.5,0.5),rand(3,6),rand(-0.5,0.5),rand(2.4,4),2.6,rand(4,7),0.15,1,0.5*inten+0.15,0.32,1,0); } }
}
function dmgCollapse(o,ct,dt){
var U=o.group.userData.U,by=o.baseY||0,H=o.height;
if(ct<0.1){ var sh=ct/0.1; o.group.position.x=(o.baseX||0)+rand(-0.08,0.08)*sh; o.group.position.z=(o.baseZ||0)+rand(-0.08,0.08)*sh; return; }
var cp=(ct-0.1)/0.9,e=Math.pow(cp,1.55);
o.group.position.x=o.baseX||o.group.position.x; o.group.position.z=o.baseZ||o.group.position.z;
o.group.rotation.x=(o.baseRotX||0)+(o.leanRX||0)*e*0.7; o.group.rotation.z=(o.baseRotZ||0)+(o.leanRZ||0)*e*0.7;
var cutY=by+(H-by)*(1-Math.min(1,e*1.03)); U.uCut.value=cutY;
if(!o.dustKicked){ o.dustKicked=true; U.uBurn.value=1; spawnDust(o.group.position,Math.max(o.w,o.d)*0.9); }
if(o.rubble){ o.rubble.visible=true; var rs=0.25+0.75*e; o.rubble.scale.set(rs,rs,rs); if(o.rubble.children)for(var rc=0;rc<o.rubble.children.length;rc++)o.rubble.children[rc].visible=true; }
o.cutT=(o.cutT||0)-dt;
if(o.cutT<=0){ o.cutT=0.06; var gx=o.group.position.x,gz=o.group.position.z,hw=o.w/2,hd=o.d/2;
for(var i=0;i<3;i++){ var a=rand(0,Math.PI*2),ex=Math.cos(a)*hw*rand(0.4,1.05),ez=Math.sin(a)*hd*rand(0.4,1.05);
PS.emit(2,gx+ex,cutY+rand(0,2),gz+ez,Math.cos(a)*rand(2,6),rand(-1,2),Math.sin(a)*rand(2,6),rand(4,8)*Math.min(1.8,0.6+hw/14),1.5,rand(1.6,2.8),0,1,rand(0.4,0.6),1.4,0.2,-1.2);
if(i===0)PS.emit(0,gx+ex*0.8,cutY+2,gz+ez*0.8,rand(-1,1),rand(2,5),rand(-1,1),rand(5,9),2.4,rand(4,7),0.2,1,0.55,0.4,1.2,0); }
if(Math.random()<0.55){ var chk=getChunk(); if(chk){ var bs=rand(0.5,1.5),a2=rand(0,Math.PI*2); chk.visible=true; chk.scale.setScalar(bs); chk.position.set(gx+Math.cos(a2)*hw*0.9,cutY,gz+Math.sin(a2)*hd*0.9); chk.rotation.set(rand(0,3),rand(0,3),rand(0,3));
effects.push({kind:'chunk',hot:false,mesh:chk,vel:new THREE.Vector3(Math.cos(a2)*rand(2,7),rand(-1,3),Math.sin(a2)*rand(2,7)),av:new THREE.Vector3(rand(-6,6),rand(-6,6),rand(-6,6)),bs:bs,t:0,dur:rand(1.3,2.2)}); } }
var dd=heliState.pos.distanceTo(o.group.position); shake=Math.min(shake+0.012*clamp(1.2-dd/160,0.05,1)*(H/40+0.4),1.6);
}
}
/* ================= structural integrity: columns per floor, load paths, topple / pancake / settle =================
   Damage knocks out columns around the impact. When a floor can no longer carry what is above it (too few columns, or the
   remaining support is lopsided) the whole upper block is released as a rigid body: it tips over its weakest side, drops
   straight down and crushes the floors below, or slumps and comes to rest on the stump - exactly what the structure allows. */
var STR_BODIES=[];
function strInit(o){
if(o.struct)return o.struct;
var by=o.baseY||0,H=Math.max(4,o.height-by),F=clamp(Math.round(H/3.4),2,48),nx=clamp(Math.round(o.w/4.5),2,5),nz=clamp(Math.round(o.d/4.5),2,5),C=nx*nz;
var cpx=[],cpz=[]; for(var i=0;i<nx;i++)for(var j=0;j<nz;j++){ cpx.push((-0.5+(i+0.5)/nx)*o.w*0.88); cpz.push((-0.5+(j+0.5)/nz)*o.d*0.88); }
var health=new Float32Array(F*C); for(var k=0;k<health.length;k++)health[k]=1;
return (o.struct={F:F,nx:nx,nz:nz,C:C,H:H,fh:H/F,cpx:cpx,cpz:cpz,health:health,top:F,by:by,H0:H});
}
function strDamage(o,x,y,z,r,dmg){
var S=strInit(o),gx=o.group.position.x,gz=o.group.position.z,C=S.C;
var amt=clamp(dmg/(o.maxHp*0.22),0.12,1.7);
for(var f=0;f<S.top;f++){ var fy=S.by+(f+0.5)*S.fh,dy=Math.abs(fy-y); if(dy>r+S.fh*1.2)continue;
for(var c=0;c<C;c++){ var dh=Math.sqrt(Math.pow(gx+S.cpx[c]-x,2)+Math.pow(gz+S.cpz[c]-z,2)+Math.pow(dy*0.8,2)); if(dh<r+2.0){ S.health[f*C+c]-=(1-dh/(r+2.0))*amt; } } }
}
function strFloorState(S,o,f){
var C=S.C,alive=0,sx=0,sz=0;
for(var c=0;c<C;c++){ var h=clamp(S.health[f*C+c],0,1); alive+=h; sx+=h*S.cpx[c]; sz+=h*S.cpz[c]; }
var cx=alive>0.01?sx/alive:0,cz=alive>0.01?sz/alive:0;
return {alive:alive,cx:cx,cz:cz,off:Math.hypot(cx/(o.w*0.44),cz/(o.d*0.44))};
}
function strCheck(o){
var S=o.struct; if(!S||S.top<2)return false;
for(var f=0;f<S.top;f++){
var st=strFloorState(S,o,f);
if(st.alive<S.C*0.3||(st.alive<S.C*0.72&&st.off>0.28)){ strRelease(o,f,st,null); return true; }
}
return false;
}
function strFinish(o,fromPos){
var S=strInit(o); if(S.top<2)return;
var by=S.by,f=fromPos?clamp(Math.floor((fromPos.y-by)/S.fh),0,S.top-1):Math.floor(S.top*rand(0.1,0.5));
if(Math.random()<0.5&&fromPos)f=Math.min(f,Math.max(0,Math.floor(S.top*0.35)));
var C=S.C; for(var c=0;c<C;c++)S.health[f*C+c]=Math.min(S.health[f*C+c],-0.5+Math.random()*0.4);
var st=strFloorState(S,o,f); strRelease(o,f,st,fromPos);
}
function cloneBuildingGroup(src,U2){
var g=new THREE.Group(); g.position.copy(src.position); g.rotation.copy(src.rotation); g.scale.copy(src.scale);
src.children.forEach(function(c){
if(!c.isMesh||c.material&&c.material.transparent)return; if(c.material&&c.material.isMeshBasicMaterial)return;
var m=c.material.clone(); m.onBeforeCompile=(c.material.userData&&c.material.userData.baseOBC)||function(){}; m.userData={dmgd:1}; dmgPatch(m,U2,c.material.userData&&c.material.userData.win);
var mm=new THREE.Mesh(c.geometry,m); mm.position.copy(c.position); mm.rotation.copy(c.rotation); mm.scale.copy(c.scale); mm.castShadow=true; mm.receiveShadow=true; g.add(mm);
});
return g;
}
function strRelease(o,f,st,fromPos){
var S=o.struct,U=o.group.userData.U,by=S.by,gx=o.group.position.x,gz=o.group.position.z;
var yfail=Math.max(by+2.2,by+(f+0.5)*S.fh),hu=o.height-yfail; if(hu<3.5||!U){ S.top=f; return; }
// block = clone of the whole building, keeping everything above the break
var U2={uCut:{value:1e5},uHit:{value:U.uHit.value.map(function(v){ return v.clone(); })},uBurn:{value:U.uBurn.value},uNH:{value:U.uNH.value},uBase:{value:U.uBase.value},uLow:{value:yfail},uMov:{value:0},uGInv:{value:new THREE.Matrix4()},n:U.n,top:o.height,base:by};
var blk=cloneBuildingGroup(o.group,U2); stageGroup.add(blk); blk.updateMatrixWorld(true);
var M0=blk.matrixWorld.clone();
// stump keeps the lower floors with a ragged break line
U.uCut.value=yfail; o.height=yfail; S.top=f;
var fracKept=(yfail-by)/S.H0;
o.hp=Math.min(o.hp,Math.max(o.maxHp*0.12,o.maxHp*fracKept)); o.struct.top=f;
var award=Math.round(o.scorePts*(1-fracKept)*0.5); G.score+=award; G.yen+=Math.round(o.value*(1-fracKept)*0.5); updateHUD();
spawnPopup(new THREE.Vector3(gx,yfail+hu*0.4,gz),'崩落 +'+fmt(award),'big');
// decide how the block moves
var offLen=Math.hypot(st.cx,st.cz),mode=(st.alive<S.C*0.3||offLen<o.w*0.12)?'pancake':'topple';
var dir=new THREE.Vector3(-st.cx,0,-st.cz); if(dir.lengthSq()<0.01&&fromPos)dir.set(gx-fromPos.x,0,gz-fromPos.z); if(dir.lengthSq()<0.01)dir.set(rand(-1,1),0,rand(-1,1)); dir.normalize();
if(mode==='topple'&&hu<12)mode='pancake';
var e=Math.abs(dir.x)*o.w/2+Math.abs(dir.z)*o.d/2;
var hinge=new THREE.Vector3(gx-dir.x*Math.max(0.6,Math.min(e,offLen)),yfail,gz-dir.z*Math.max(0.6,Math.min(e,offLen)));
var body={blk:blk,U2:U2,M0:M0,mode:mode,o:o,t:0,yfail:yfail,hu:hu,w:o.w,d:o.d,dir:dir,hinge:hinge,p0:new THREE.Vector3(gx,blk.position.y,gz),q0:blk.quaternion.clone(),th:0,om:0.04,vy:0,drop:0,phase:'fall',emitT:0,fh:S.fh,floorsAbove:Math.round(hu/S.fh),floorsBelow:f,rest:null,axis:new THREE.Vector3(dir.z,0,-dir.x),h0:Math.max(0.8,Math.hypot(gx-hinge.x,gz-hinge.z)),landed:false};
STR_BODIES.push(body);
try{ spawnDust(new THREE.Vector3(gx,yfail,gz),Math.max(o.w,o.d)); }catch(e2){}
for(var k=0;k<10;k++){ var a=rand(0,6.28); PS.emit(1,gx+Math.cos(a)*o.w*0.4,yfail,gz+Math.sin(a)*o.d*0.4,Math.cos(a)*rand(1,4),rand(1,5),Math.sin(a)*rand(1,4),rand(2,4),1,rand(0.5,0.9),0.9,1,0.8,1.2,3,0); }
if(window.sCollapse)sCollapse(new THREE.Vector3(gx,yfail,gz),hu); showCenter(mode==='topple'?'⚠ ビルが傾いた！':'⚠ ビルの上部が崩落！');
shake=Math.min(shake+0.5,2);
}
var _sq=new THREE.Quaternion(),_sv=new THREE.Vector3(),_sm=new THREE.Matrix4();
function strShatter(b,pos){
var o=b.o,grp=b.blk; stageGroup.remove(grp); grp.traverse(function(c){ if(c.isMesh&&c.material&&c.material.dispose)c.material.dispose(); });
var gp=pos||new THREE.Vector3(b.p0.x,0,b.p0.z),by=o.baseY||0;
spawnDust(new THREE.Vector3(gp.x,by,gp.z),Math.max(b.w,b.d)*1.5); spawnDust(new THREE.Vector3(gp.x,by,gp.z),Math.max(b.w,b.d)*1.1);
for(var i=0;i<16;i++){ var a=rand(0,6.28),r=rand(0,Math.max(b.w,b.d)*0.7); PS.emit(i%3===0?1:0,gp.x+Math.cos(a)*r,by+rand(0.5,5),gp.z+Math.sin(a)*r,Math.cos(a)*rand(1,6),rand(2,9),Math.sin(a)*rand(1,6),rand(5,10),2.4,rand(4,8),0.4,1,0.7,0.5,1.4,0); }
for(var c=0;c<12;c++){ var chk=getChunk(); if(!chk)break; var bs=rand(0.5,1.8),a2=rand(0,6.28); chk.visible=true; chk.scale.setScalar(bs); chk.position.set(gp.x,by+rand(2,10),gp.z); chk.rotation.set(rand(0,3),rand(0,3),rand(0,3));
effects.push({kind:'chunk',hot:c%3===0,mesh:chk,vel:new THREE.Vector3(Math.cos(a2)*rand(4,12),rand(5,14),Math.sin(a2)*rand(4,12)),av:new THREE.Vector3(rand(-8,8),rand(-8,8),rand(-8,8)),bs:bs,t:0,dur:rand(1.4,2.2)}); }
try{ var rub=new THREE.Group(); buildRubble(rub,b.w*1.5,b.d*1.5,Math.min(b.hu,40)); rub.position.set(gp.x,by,gp.z); rub.rotation.y=rand(0,6.28); stageGroup.add(rub); }catch(e3){}
addFireSpot(gp.x,gp.z,Math.max(b.w,b.d)*1.2,rand(12,22));
if(window.sCollapse)sCollapse(new THREE.Vector3(gp.x,by,gp.z),b.hu); if(window.sExplosion)sExplosion(false,new THREE.Vector3(gp.x,by+2,gp.z));
var dd=heliState.pos.distanceTo(gp); shake=Math.min(shake+1.1*clamp(1.3-dd/180,0.08,1),2.4); fxKickAdd(0.5*clamp(1.3-dd/180,0.1,1));
b.phase='done';
}
function strUpdate(dt){
for(var i=STR_BODIES.length-1;i>=0;i--){
var b=STR_BODIES[i],o=b.o,blk=b.blk,g=9.81; b.t+=dt;
if(b.phase==='done'){ STR_BODIES.splice(i,1); continue; }
if(b.mode==='topple'&&b.phase==='fall'){
var cT=Math.cos(b.th),sT=Math.sin(b.th),v0=b.hu/2,Iperm=b.hu*b.hu/4+b.h0*b.h0+(b.hu*b.hu+(b.w+b.d)*(b.w+b.d)/4)/12;
var al=g*(b.h0*cT+v0*sT)/Iperm*3.2; b.om+=al*dt; b.th+=b.om*dt;
_sq.setFromAxisAngle(b.axis,b.th); blk.quaternion.copy(_sq).multiply(b.q0); _sv.copy(b.p0).sub(b.hinge).applyQuaternion(_sq).add(b.hinge); blk.position.copy(_sv);
b.emitT-=dt; if(b.emitT<=0){ b.emitT=0.07; PS.emit(2,b.hinge.x+rand(-1,1)*b.w*0.4,b.hinge.y+rand(0,2),b.hinge.z+rand(-1,1)*b.d*0.4,rand(-2,2),rand(0,2),rand(-2,2),rand(4,8),1.4,rand(1.6,2.6),0,1,0.5,1.4,0.2,-1); if(Math.random()<0.5){ var chk=getChunk(); if(chk){ chk.visible=true; chk.scale.setScalar(rand(0.4,1.1)); chk.position.copy(b.hinge); chk.position.x+=rand(-3,3); chk.position.z+=rand(-3,3); effects.push({kind:'chunk',hot:false,mesh:chk,vel:new THREE.Vector3(rand(-4,4),rand(0,4),rand(-4,4)),av:new THREE.Vector3(rand(-5,5),rand(-5,5),rand(-5,5)),bs:1,t:0,dur:rand(1.2,2)}); } } }
var cornerY=b.hinge.y+(b.hu*Math.cos(b.th)-b.h0*Math.sin(b.th))*1.0-Math.abs(b.hu*Math.sin(b.th))*0;
var topH=b.hinge.y+b.hu*Math.cos(b.th); var ground=groundY(b.p0.x,b.p0.z);
if(b.th>0.5+Math.min(0.5,b.hu*0.004)||topH<ground+b.hu*0.35||b.t>7){ var tp=new THREE.Vector3(b.p0.x+b.dir.x*b.hu*0.42,0,b.p0.z+b.dir.z*b.hu*0.42); strShatter(b,tp); }
} else if(b.mode==='pancake'&&b.phase==='fall'){
b.vy-=g*dt*1.0; b.drop+=-b.vy*dt; blk.position.y=b.p0.y-b.drop;
b.emitT-=dt; if(b.emitT<=0){ b.emitT=0.06; var gx=b.p0.x,gz=b.p0.z; for(var k=0;k<2;k++){ var a=rand(0,6.28); PS.emit(2,gx+Math.cos(a)*b.w*0.55,b.yfail-b.drop+rand(0,1.5),gz+Math.sin(a)*b.d*0.55,Math.cos(a)*rand(3,7),rand(-1,1.5),Math.sin(a)*rand(3,7),rand(4,8),1.4,rand(1.6,2.8),0,1,0.5,1.4,0.2,-1); } }
var stumpTop=Math.min(b.yfail,b.yfail-b.drop-0.2); o.group.userData.U.uCut.value=Math.max((o.baseY||0)+0.5,stumpTop);
var landed=(b.yfail-b.drop)<=(o.baseY||0)+0.6;
if(!b.landed&&b.drop>=b.fh*1.1){ b.landed=true;
// impact on the lower floors: progressive collapse only if the block is heavy compared to what it lands on
var heavy=b.floorsAbove>b.floorsBelow*0.55||b.floorsBelow<2;
spawnDust(new THREE.Vector3(b.p0.x,b.yfail-b.drop,b.p0.z),Math.max(b.w,b.d)); shake=Math.min(shake+0.5,2); if(window.sThunk)sThunk(new THREE.Vector3(b.p0.x,b.yfail-b.drop,b.p0.z));
if(!heavy){ b.phase='rest'; b.rest={rx:rand(-0.05,0.05),rz:rand(-0.05,0.05)}; blk.rotation.x+=b.rest.rx; blk.rotation.z+=b.rest.rz; o.height=b.yfail-b.drop+0.0; o.group.userData.U.uCut.value=b.yfail-b.drop; showCenter('上部がずれ落ちて止まった'); b.phase='rest'; }
else { b.vy*=0.55; }
}
if(b.phase==='fall'&&landed){ o.group.userData.U.uCut.value=(o.baseY||0)+0.3; o.height=(o.baseY||0)+1; if(o.struct)o.struct.top=0; strShatter(b,new THREE.Vector3(b.p0.x,0,b.p0.z)); }
} else if(b.phase==='rest'){ b.t+=0; }
// keep the clip frame in sync with the moving block
if(b.phase!=='done'){ blk.updateMatrixWorld(true); _sm.copy(blk.matrixWorld).invert(); b.U2.uGInv.value.copy(b.M0).multiply(_sm); b.U2.uMov.value=1; }
}
}

function makeBuilding(x,z,w,d,h,tex,tint,type,value,scorePts){
var grp=new THREE.Group(); grp.position.set(x,0,z);
// per-building texture repeat so windows keep real-world scale (~3.1m floor)
var btex=tex.clone(); btex.needsUpdate=true; btex.wrapS=btex.wrapT=THREE.RepeatWrapping; btex.repeat.set(Math.max(1,Math.round(w/11)),Math.max(1,Math.round(h/22)));
var mat=new THREE.MeshStandardMaterial({map:btex,bumpMap:btex,bumpScale:0.9,roughness:type==='tower'?0.3:0.74,metalness:type==='tower'?0.3:0.06});
regEnv(mat,type==='tower'?0.9:0.28);
// slight per-building tint variation so identical facade textures never
// look cloned side by side (kept in baseTint so damage darkening matches)
var tintHex;
if(tint){ mat.color=new THREE.Color(tint); tintHex=tint; }
else { var tv=rand(0.9,1.04); mat.color=new THREE.Color(Math.min(1,tv*rand(0.97,1.03)),Math.min(1,tv),Math.min(1,tv*rand(0.94,1.0))); tintHex=mat.color.getHex(); }
var mesh=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),mat);
mesh.position.y=h/2; mesh.castShadow=true; mesh.receiveShadow=true; grp.add(mesh);
// entrance canopy + door glow (street-level realism)
if(type!=='house'){
var can=new THREE.Mesh(new THREE.BoxGeometry(3.6,0.28,1.9),new THREE.MeshStandardMaterial({color:0x2e343a,roughness:0.5,metalness:0.3})); can.position.set(0,2.75,d/2+0.85); grp.add(can);
var door=new THREE.Mesh(new THREE.BoxGeometry(2.4,2.5,0.12),new THREE.MeshStandardMaterial({color:0x8fb8cc,roughness:0.15,metalness:0.4,emissive:0x443a18,emissiveIntensity:0.5})); door.position.set(0,1.25,d/2+0.06); grp.add(door);
}
// facade clutter on taller blocks: outdoor AC units + a vertical drain pipe
if(h>=11&&type!=='house'){
var acM=new THREE.MeshStandardMaterial({color:0xc9ccca,roughness:0.55,metalness:0.35});
var acN=2+(Math.random()<0.5?1:0);
for(var aci=0;aci<acN;aci++){ var acu=new THREE.Mesh(new THREE.BoxGeometry(0.95,0.75,0.55),acM); acu.position.set(rand(-w/2+1.6,w/2-1.6),rand(2.2,Math.max(2.6,h-2.5)),d/2+0.3); grp.add(acu); }
var pipe=new THREE.Mesh(new THREE.CylinderGeometry(0.09,0.09,h-1,5),new THREE.MeshStandardMaterial({color:0x8f9598,roughness:0.5,metalness:0.5}));
pipe.position.set(w/2-0.5,(h-1)/2,-d/2-0.12); grp.add(pipe);
}
// roof parapet + rooftop equipment (AC units, water tank, antenna, duct)
var roof=new THREE.Mesh(new THREE.BoxGeometry(w+0.7,0.7,d+0.7),new THREE.MeshStandardMaterial({color:0x43484e,roughness:0.9}));
roof.position.y=h+0.3; roof.castShadow=true; grp.add(roof);
var eqM=new THREE.MeshStandardMaterial({color:0x9aa0a4,roughness:0.55,metalness:0.45});
var eqM2=new THREE.MeshStandardMaterial({color:0x6e767c,roughness:0.7,metalness:0.3});
var nEq=h>12?2+(Math.random()<0.6?1:0):1;
for(var ei=0;ei<nEq;ei++){
var ac=new THREE.Mesh(new THREE.BoxGeometry(rand(1.6,2.6),rand(0.9,1.4),rand(1.4,2.2)),Math.random()<0.5?eqM:eqM2);
ac.position.set(rand(-w/2+2,w/2-2),h+0.65+ac.geometry.parameters.height/2,rand(-d/2+2,d/2-2)); ac.castShadow=true; grp.add(ac);
}
if(h>20&&Math.random()<0.55){ var wt=new THREE.Mesh(new THREE.CylinderGeometry(1.15,1.15,2.1,10),new THREE.MeshStandardMaterial({color:0x7a6a58,roughness:0.8})); wt.position.set(rand(-w/3,w/3),h+1.7,rand(-d/3,d/3)); wt.castShadow=true; grp.add(wt);}
if(h>24){ var ant=new THREE.Mesh(new THREE.CylinderGeometry(0.07,0.12,rand(3,5.5),5),eqM2); ant.position.set(w/2-1.2,h+2.6, -d/2+1.2); grp.add(ant); var tipL=new THREE.Mesh(new THREE.SphereGeometry(0.22,6,5),new THREE.MeshBasicMaterial({color:0xff4444})); tipL.position.set(w/2-1.2,h+2.6+ant.geometry.parameters.height/2, -d/2+1.2); grp.add(tipL);}
try{ buildingDetail(grp,w,h,d,type,tintHex); }catch(eDet){ console.warn(eDet); }
// rubble (hidden)
var rub=new THREE.Group();
var rm=new THREE.MeshStandardMaterial({color:0x6f6a63,roughness:1});
var r1=new THREE.Mesh(new THREE.BoxGeometry(w*0.92,1.6,d*0.9),rm); r1.position.y=0.8; r1.rotation.y=rand(-0.2,0.2); rub.add(r1);
var r2=new THREE.Mesh(new THREE.BoxGeometry(w*0.5,2.4,d*0.45),rm); r2.position.set(w*0.15,1.2,d*0.1); r2.rotation.z=0.25; rub.add(r2);
var r3=new THREE.Mesh(new THREE.ConeGeometry(Math.min(w,d)*0.3,2.2,5),rm); r3.position.set(-w*0.2,1.1,-d*0.15); rub.add(r3);
try{ buildRubble(rub,w,d,h); }catch(eRb){} rub.visible=false; grp.add(rub);
// soft contact shadow grounding the building on the pavement (one shared
// gradient texture + unit plane, scaled per footprint — almost free)
if(!makeBuilding._csMat){
var csc=document.createElement('canvas'); csc.width=csc.height=128; var csg=csc.getContext('2d');
var csgr=csg.createRadialGradient(64,64,10,64,64,62); csgr.addColorStop(0,'rgba(12,12,10,0.55)'); csgr.addColorStop(0.62,'rgba(12,12,10,0.34)'); csgr.addColorStop(1,'rgba(12,12,10,0)');
csg.fillStyle=csgr; csg.fillRect(0,0,128,128);
makeBuilding._csTex=new THREE.CanvasTexture(csc);
makeBuilding._csMat=new THREE.MeshBasicMaterial({map:makeBuilding._csTex,transparent:true,depthWrite:false});
makeBuilding._csGeo=new THREE.PlaneGeometry(1,1); makeBuilding._csGeo.rotateX(-Math.PI/2);
}
var cs=new THREE.Mesh(makeBuilding._csGeo,makeBuilding._csMat); cs.scale.set(w+5,1,d+5); cs.position.y=0.028; cs.renderOrder=1; grp.add(cs);
try{ dmgSetup(grp,mat,rub,h,0,true); }catch(eDm){ console.warn(eDm); }
stageGroup.add(grp);
return registerDestructible({group:grp,main:mesh,roof:roof,rubble:rub,type:type,hp:0,maxHp:0,value:value,scorePts:scorePts,w:w,d:d,height:h,explosive:null,destroyed:false,collapsing:0,stage:0,mat:mat,baseTint:tintHex,yenGiven:0,scoreGiven:0});
}
function setHp(o,hp){ o.hp=hp; o.maxHp=hp;}

function buildCityStage(){
var spacing=44;
var used=[];
function spotFree(x,z,r){ for(var i=0;i<used.length;i++){ var u=used[i]; if(Math.abs(u[0]-x)<r+u[2]&&Math.abs(u[1]-z)<r+u[2])return false;} return true;}
// blocks between roads
for(var bx=-3;bx<=3;bx++)for(var bz=-3;bz<=3;bz++){
var cx=bx*spacing+22, cz=bz*spacing+22; // block center offset from road lines at multiples of 44... roads at -132..132 step44, blocks centered +22
if(Math.abs(cx)>WORLD-16||Math.abs(cz)>WORLD-16) continue;
if(bx===0&&bz===-1) continue; // keep a plaza near spawn
if(bx===-3&&bz===2) continue; // fuel spot block (NW corner) stays clear for landing
if(bx===2&&bz===-3) continue; // repair depot block stays clear for landing
if(bx===-3&&bz===-3) continue; // enemy heli pad block stays clear — the pad sits at this block's centre, no building may share it
var roll=Math.random();
if(roll<0.05){
// house cluster: 2 houses
for(var hh=0;hh<2;hh++){
var hx=cx+(hh===0?-8:8)+rand(-2,2), hz=cz+rand(-6,6);
if(!spotFree(hx,hz,8))continue; used.push([hx,hz,8]);
var h=rand(4.5,6.5), w=rand(7,9), d=rand(7,9);
var house=makeBuilding(hx,hz,w,d,h,texB,0xd8c9ae,'house',8500000,900);
setHp(house,34);
var roofM=new THREE.Mesh(new THREE.ConeGeometry(Math.max(w,d)*0.72,h*0.55,4),new THREE.MeshStandardMaterial({color:0x9c4a32,roughness:0.9,flatShading:true}));
roofM.position.y=h+h*0.27; roofM.rotation.y=Math.PI/4; roofM.castShadow=true; house.group.add(roofM); house.roof2=roofM;
}
} else if(roll<0.08){
// tank yard
var tx=cx+rand(-4,4), tz=cz+rand(-4,4);
if(spotFree(tx,tz,10)){ used.push([tx,tz,10]);
var grp=new THREE.Group(); grp.position.set(tx,0,tz); grp.rotation.y=rand(0,Math.PI);
var body=new THREE.Mesh(new THREE.CylinderGeometry(3.4,3.4,11,14),new THREE.MeshStandardMaterial({color:0xe8e4da,roughness:0.35,metalness:0.5}));
body.rotation.z=Math.PI/2; body.position.y=3.6; body.castShadow=true; grp.add(body);
var band=new THREE.Mesh(new THREE.CylinderGeometry(3.5,3.5,1.6,14),new THREE.MeshStandardMaterial({color:0xd8542e,roughness:0.5}));
band.rotation.z=Math.PI/2; band.position.y=3.6; grp.add(band);
var legM=new THREE.MeshStandardMaterial({color:0x555a5e,roughness:0.8});
[-3.6,3.6].forEach(function(lx){ var leg=new THREE.Mesh(new THREE.BoxGeometry(0.8,2.2,5),legM); leg.position.set(lx,1.1,0); grp.add(leg);});
var rub2=new THREE.Mesh(new THREE.CylinderGeometry(3.2,3.6,2,10),new THREE.MeshStandardMaterial({color:0x4c4a46,roughness:1}));
rub2.position.y=1; rub2.visible=false; grp.add(rub2);
stageGroup.add(grp);
var tank=registerDestructible({group:grp,main:body,rubble:rub2,type:'tank',hp:42,maxHp:42,value:26000000,scorePts:2600,w:12,d:8,height:7,explosive:{radius:17,dmg:55},destroyed:false,collapsing:0,stage:0,mat:body.material,baseTint:0xffffff,yenGiven:0,scoreGiven:0});
tank.isTank=true;
}
} else {
// office / skyscraper
var tall=Math.random()<0.66;
var w=rand(11,15), d=rand(11,15), h=tall?rand(36,96):rand(18,34);
var bx2=cx+rand(-3,3), bz2=cz+rand(-3,3);
if(!spotFree(bx2,bz2,11))continue; used.push([bx2,bz2,11]);
var tex=tall?texGlass:(Math.random()<0.5?texA:texC);
var val=tall?Math.round(h*9800000):Math.round(h*5200000);
var b=makeBuilding(bx2,bz2,w,d,h,tex,null,tall?'tower':'office',val,tall?Math.round(h*160):Math.round(h*105));
setHp(b,tall?170:85);
// denser city: half the blocks get a second, smaller block-mate building
// (diagonal corner of the same block; checked directly against the main
// building's footprint — the shared spotFree radii are too generous here)
if(Math.random()<0.95){
var w2=rand(8,11), d2=rand(8,11), h2=rand(15,46);
var ox=bx2+(Math.random()<0.5?-12.5:12.5), oz=bz2+(Math.random()<0.5?-12.5:12.5);
if(Math.sqrt((ox-EH_PAD.x)*(ox-EH_PAD.x)+(oz-EH_PAD.z)*(oz-EH_PAD.z))<20){ /* too close to the enemy pad — never let a block-mate building crowd it */ }
else if(Math.abs(ox-bx2)>(w+w2)/2+0.5||Math.abs(oz-bz2)>(d+d2)/2+0.5){ used.push([ox,oz,7]);
var b2=makeBuilding(ox,oz,w2,d2,h2,Math.random()<0.5?texA:texWhite,null,'office',Math.round(h2*5200000),Math.round(h2*105));
setHp(b2,72);
}
}
}
}
// second pass: small annexes / shops / houses on leftover block edges
function edgeFree(x,z){
for(var i=0;i<used.length;i++){ var u=used[i]; var th=4+u[2]*0.66; if(Math.abs(u[0]-x)<th&&Math.abs(u[1]-z)<th)return false; }
return true;
}
var added2=0;
for(var ex=-3;ex<=3&&added2<70;ex++)for(var ez=-3;ez<=3&&added2<70;ez++){
if(Math.random()<0.08)continue;
var ecx=ex*44+22, ecz=ez*44+22;
if(Math.abs(ecx)>WORLD-16||Math.abs(ecz)>WORLD-16)continue;
var side=Math.floor(Math.random()*4);
var ax=ecx+(side===0?-13:(side===1?13:0)), az=ecz+(side===2?-13:(side===3?13:0));
if(Math.sqrt((ax-PAD.x)*(ax-PAD.x)+(az-PAD.z)*(az-PAD.z))<17)continue;
if(Math.sqrt((ax-FUEL.x)*(ax-FUEL.x)+(az-FUEL.z)*(az-FUEL.z))<17)continue;
if(Math.sqrt((ax-REPAIR.x)*(ax-REPAIR.x)+(az-REPAIR.z)*(az-REPAIR.z))<17)continue;
if(Math.sqrt((ax-EH_PAD.x)*(ax-EH_PAD.x)+(az-EH_PAD.z)*(az-EH_PAD.z))<17)continue;
if(!edgeFree(ax,az))continue; used.push([ax,az,6]);
added2++;
var isHouse=Math.random()<0.4;
var fw=rand(7,9), fd=rand(7,9), fh=isHouse?rand(4.5,6.5):rand(8,16);
var fb=makeBuilding(ax,az,fw,fd,fh,isHouse?texB:(Math.random()<0.5?texA:texWhite),isHouse?0xd8c9ae:null,isHouse?'house':'office',isHouse?8500000:Math.round(fh*5200000),isHouse?900:Math.round(fh*105));
setHp(fb,isHouse?34:70);
if(isHouse){ var hrf=new THREE.Mesh(new THREE.ConeGeometry(Math.max(fw,fd)*0.72,fh*0.55,4),new THREE.MeshStandardMaterial({color:0x7d4a3a,roughness:0.9,flatShading:true})); hrf.position.y=fh+fh*0.27; hrf.rotation.y=Math.PI/4; hrf.castShadow=true; fb.group.add(hrf); fb.roof2=hrf; }
}
// distant skyline ring (background only — not destructible, not counted)
addSkylineRing(90,190,330,32,125,0,Math.PI*2,function(x,z){return z>176&&Math.abs(x)<108;}); // keep the airbase yard behind the fighter runway clear of skyline towers
// gas station (SE)
(function(){
var gx=88, gz=88;
var grp=new THREE.Group(); grp.position.set(gx,0,gz);
var base=new THREE.Mesh(new THREE.BoxGeometry(14,4.5,9),new THREE.MeshStandardMaterial({map:texB,roughness:0.7}));
base.position.set(-4,2.25,0); base.castShadow=true; grp.add(base);
var canopy=new THREE.Mesh(new THREE.BoxGeometry(17,0.9,13),new THREE.MeshStandardMaterial({color:0xe8491d,roughness:0.5}));
canopy.position.set(6,6.4,0); canopy.castShadow=true; grp.add(canopy);
var pilM=new THREE.MeshStandardMaterial({color:0xd8d8d8,roughness:0.6});
[[0,-5],[12,-5],[0,5],[12,5]].forEach(function(p){ var pil=new THREE.Mesh(new THREE.CylinderGeometry(0.35,0.35,6,8),pilM); pil.position.set(p[0],3,p[1]); grp.add(pil);});
var pumpM=new THREE.MeshStandardMaterial({color:0xf0f0f0,roughness:0.4});
[[4,0],[8.5,0]].forEach(function(p){ var pu=new THREE.Mesh(new THREE.BoxGeometry(1.1,1.9,0.8),pumpM); pu.position.set(p[0],0.95,p[1]); pu.castShadow=true; grp.add(pu);});
var rub3=new THREE.Group();
var rm=new THREE.MeshStandardMaterial({color:0x5c564e,roughness:1});
var rr=new THREE.Mesh(new THREE.BoxGeometry(16,1.8,11),rm); rr.position.y=0.9; rr.rotation.z=0.06; rub3.add(rr);
rub3.visible=false; grp.add(rub3);
stageGroup.add(grp);
var gas=registerDestructible({group:grp,main:base,rubble:rub3,type:'gas',hp:55,maxHp:55,value:68000000,scorePts:6800,w:20,d:14,height:7,explosive:{radius:30,dmg:95},destroyed:false,collapsing:0,stage:0,mat:base.material,baseTint:0xffffff,yenGiven:0,scoreGiven:0});
gas.extraParts=[canopy];
})();
enhanceCityRealism();
document.getElementById('totalNum').textContent=totalCount;
}

/* cars */
var cars=[];
var carColors=[0xd8452e,0x2e6fd8,0xe8e8e8,0x30343a,0xe8b02e,0x3fae5a,0xf2f2f2];
var _plateTexs=null;
function plateTexture(){
if(!_plateTexs){ _plateTexs=[]; var nums=['品川 300|あ 12-34','横浜 500|さ 56-78','世田谷 330|た 90-12','練馬 400|な 34-56'];
for(var i=0;i<nums.length;i++){ var c=document.createElement('canvas'); c.width=128; c.height=64; var g=c.getContext('2d'); var parts=nums[i].split('|');
g.fillStyle='#f4f4ec'; g.fillRect(0,0,128,64); g.strokeStyle='#2e7d46'; g.lineWidth=3; g.strokeRect(2,2,124,60);
g.fillStyle='#1d3a24'; g.font='700 19px sans-serif'; g.textAlign='center'; g.fillText(parts[0],64,24);
g.font='900 27px sans-serif'; g.fillText(parts[1],64,52);
var t=new THREE.CanvasTexture(c); if(THREE.SRGBColorSpace)t.colorSpace=THREE.SRGBColorSpace; _plateTexs.push(t);} }
return _plateTexs[Math.floor(Math.random()*_plateTexs.length)];
}
/* ================= cars v2: lofted bodies in 6 types, real wheels/lights/plates, dense city traffic ================= */
var CARGEO={},_carGlass=null,_carDetMat=null;
function carGeos(type){
if(CARGEO[type])return CARGEO[type];
var P=[],D=[],G=[];
function det(g,c,sh){ D.push({g:g,color:c,shade:sh||1}); }
var L=2.25,sed={
sedan:{L:2.25,hh:.72,bodyH:.72,cab:[1.15,-1.55],roof:.62,cabH:.6,cy:1.36,wb:1.4},
hatch:{L:1.95,hh:.74,bodyH:.74,cab:[1.0,-1.7],roof:.5,cabH:.66,cy:1.4,wb:1.25},
suv:{L:2.35,hh:.95,bodyH:.95,cab:[1.2,-2.0],roof:.85,cabH:.78,cy:1.62,wb:1.5},
taxi:{L:2.25,hh:.72,bodyH:.72,cab:[1.15,-1.55],roof:.62,cabH:.6,cy:1.36,wb:1.4},
van:{L:2.6,hh:1.15,bodyH:1.15,cab:[1.9,-2.5],roof:1.3,cabH:1.0,cy:1.88,wb:1.7}}[type];
var s=sed,hh=s.hh;
var body=loft([
{x:s.L,w:1.55,h:.4,y:.5,p:3,bf:.5},{x:s.L-.3,w:1.82,h:.58,y:.6,p:3.2,bf:.5},{x:s.L-1.0,w:1.9,h:hh*.92,y:.55+hh*.45,p:3.4,bf:.5},{x:.3,w:1.9,h:hh,y:.55+hh*.48,p:3.4,bf:.5},
{x:-.9,w:1.9,h:hh,y:.55+hh*.48,p:3.4,bf:.5},{x:-s.L+.45,w:1.86,h:hh*.88,y:.55+hh*.43,p:3.3,bf:.5},{x:-s.L,w:1.62,h:hh*.62,y:.55+hh*.3,p:3,bf:.5}],18,1);
P.push({g:body,color:0xffffff});
var cabLoft=loft([{x:s.cab[0],w:1.52,h:.1,y:s.cy-s.cabH*.4},{x:s.cab[0]-.4,w:1.7,h:s.cabH*.9,y:s.cy-.04,p:2.6},{x:(s.cab[0]+s.cab[1])/2,w:1.74,h:s.cabH,y:s.cy,p:2.7},{x:s.cab[1]+.45,w:1.7,h:s.cabH*.88,y:s.cy-.05,p:2.6},{x:s.cab[1],w:1.52,h:.1,y:s.cy-s.cabH*.4}],16,1);
G.push(cabLoft);
var roofPlate=loft([{x:s.cab[0]-.5,w:1.4,h:.05,y:s.cy+s.cabH*.5+.01,p:3},{x:(s.cab[0]+s.cab[1])/2,w:1.64,h:.08,y:s.cy+s.cabH*.5+.02,p:3},{x:s.cab[1]+.5,w:1.4,h:.05,y:s.cy+s.cabH*.5+.01,p:3}],12,1);
P.push({g:roofPlate,color:0xffffff});
// pillars
[[s.cab[0]-.35],[ (s.cab[0]+s.cab[1])/2 ],[s.cab[1]+.35]].forEach(function(a){ [-1,1].forEach(function(sd){ det(mgT(new THREE.BoxGeometry(.1,s.cabH*.8,.07),a[0],s.cy,sd*.84),0x1a1c1e); }); });
// bumpers, grille, lamps, plates, mirrors, handles, underbody
var bz=.9,L2=s.L;
det(mgT(new THREE.BoxGeometry(.3,.26,1.8),L2-.05,.42,0),0x1b1d20); det(mgT(new THREE.BoxGeometry(.3,.26,1.8),-L2+.05,.42,0),0x1b1d20);
det(mgT(new THREE.BoxGeometry(.08,.22,1.0),L2+.0,.66,0),0x0c0d0e);
[-1,1].forEach(function(sd){ det(mgT(new THREE.BoxGeometry(.14,.2,.5),L2-.12,.76,sd*.7),0xfff3c8,2.4); det(mgT(new THREE.BoxGeometry(.14,.18,.5),-L2+.12,.78,sd*.72),0xff2a1c,1.8);
det(mgT(new THREE.BoxGeometry(.08,.14,.3),.55,1.0+(type==='suv'||type==='van'?.1:0),sd*1.0),0x15171a); det(mgT(new THREE.BoxGeometry(.08,.06,.36),.35,.9+hh*.18,sd*.96),0x2a2d30); det(mgT(new THREE.BoxGeometry(.08,.06,.36),-.65,.9+hh*.18,sd*.96),0x2a2d30);
det(mgT(new THREE.BoxGeometry(2.6,.04,.04),-0.15,.52,sd*.97),0x15171a); });
det(mgT(new THREE.BoxGeometry(.04,.22,.5),L2+.04,.52,0),0xf2f2ee); det(mgT(new THREE.BoxGeometry(.04,.22,.5),-L2-.04,.55,0),0xf2f2ee);
det(mgT(new THREE.BoxGeometry(L2*1.8,.18,1.7),0,.3,0),0x101112);
var wr=type==='suv'?.4:(type==='van'?.38:.34),wx=s.wb;
[[wx,-1],[wx,1],[-wx,-1],[-wx,1]].forEach(function(p){ var tp=mkTire(wr,.26); det(mgT(tp[0].clone(),p[0],wr,p[1]*.9),0x111111); det(mgT(tp[1].clone(),p[0],wr,p[1]*.88),0xb7bcc0,1.3); det(mgT(new THREE.CylinderGeometry(wr*.28,wr*.28,.3,8).rotateX(Math.PI/2),p[0],wr,p[1]*.86),0x2a2d30); });
if(type==='taxi'){ det(mgT(new THREE.BoxGeometry(.5,.2,.9),-.1,s.cy+s.cabH*.5+.2,0),0xfff1b8,2.0); det(mgT(new THREE.BoxGeometry(2.6,.12,.02),-.1,.75,.99),0x111111); det(mgT(new THREE.BoxGeometry(2.6,.12,.02),-.1,.75,-.99),0x111111); }
if(type==='suv'||type==='van'){ [-1,1].forEach(function(sd){ det(mgT(new THREE.BoxGeometry(1.8,.05,.06),-.3,s.cy+s.cabH*.5+.08,sd*.6),0x1a1c1e); }); }
CARGEO[type]={paint:mergeGeo(P),glass:cabLoft,det:mergeGeo(D),w:type==='van'?5.4:4.7,d:2.0,h:s.cy+s.cabH*.5+.2};
return CARGEO[type];
}
function makeCar(x,z,roadAxis,dir,forceType){
var isTruck=!forceType&&Math.random()<0.1;
var r=Math.random(),type=forceType||(r<0.46?'sedan':r<0.66?'hatch':r<0.82?'suv':r<0.9?'van':'taxi');
var grp=new THREE.Group(),col,mat,body,o;
if(!_carGlass){ _carGlass=new THREE.MeshStandardMaterial({color:0x1d2a36,roughness:0.06,metalness:0.55,transparent:true,opacity:0.88}); regEnv(_carGlass,1.4); _carDetMat=new THREE.MeshStandardMaterial({vertexColors:true,roughness:0.55,metalness:0.35}); }
if(!_carGlowMat){ _carGlowMat=new THREE.SpriteMaterial({map:texGlow,color:new THREE.Color(0xffe9a8).multiplyScalar(2.2),transparent:true,opacity:0.55,blending:THREE.AdditiveBlending,depthWrite:false}); _carTailMat=new THREE.SpriteMaterial({map:texGlow,color:new THREE.Color(0xff4030).multiplyScalar(2.4),transparent:true,opacity:0.5,blending:THREE.AdditiveBlending,depthWrite:false}); _carPoolMat=new THREE.MeshBasicMaterial({map:texGlow,color:0xffc98a,transparent:true,opacity:0.10,blending:THREE.AdditiveBlending,depthWrite:false}); }
var carFx;
if(isTruck){
col=[0xe6e6e2,0xdadad2,0x3a6fb8,0xc9402e][Math.floor(Math.random()*4)];
mat=new THREE.MeshStandardMaterial({color:0xf0f0ec,roughness:.5,metalness:.15});
var cargo=new THREE.Mesh(new THREE.BoxGeometry(4.2,2.5,2.3),mat); cargo.position.set(-1.0,2.05,0); cargo.castShadow=true; grp.add(cargo); body=cargo;
var cabM=new THREE.MeshStandardMaterial({color:col,roughness:.35,metalness:.5}); regEnv(cabM,.7);
var cab=new THREE.Mesh(loft([{x:3.4,w:1.9,h:.5,y:.95,p:3,bf:.5},{x:3.1,w:2.1,h:1.4,y:1.35,p:3.4,bf:.5},{x:2.0,w:2.15,h:1.9,y:1.6,p:3.4,bf:.5},{x:1.1,w:2.15,h:1.9,y:1.6,p:3.4,bf:.5}],14,1),cabM); cab.castShadow=true; grp.add(cab);
var wsh=new THREE.Mesh(new THREE.BoxGeometry(.06,.8,1.9),_carGlass); wsh.position.set(3.1,1.95,0); wsh.rotation.z=.12; grp.add(wsh);
var tp=[];
[[2.3,-1],[2.3,1],[-.4,-1],[-.4,1],[-2.6,-1],[-2.6,1]].forEach(function(p){ var t=mkTire(.52,.34); tp.push({g:t[0],color:0x111111}); tp.push({g:t[1],color:0xb7bcc0}); t[0].translate(p[0],.52,p[1]*1.0); t[1].translate(p[0],.52,p[1]*.96); });
tp.push({g:mgT(new THREE.BoxGeometry(6.8,.3,1.7),0,.55,0),color:0x151617}); tp.push({g:mgT(new THREE.BoxGeometry(.3,.3,2.1),3.35,.55,0),color:0x1b1d20});
[-1,1].forEach(function(sd){ tp.push({g:mgT(new THREE.BoxGeometry(.14,.24,.5),3.35,.85,sd*.7),color:0xfff3c8,shade:2.4}); tp.push({g:mgT(new THREE.BoxGeometry(.14,.3,.4),-3.1,.9,sd*.8),color:0xff2a1c,shade:1.8}); });
var dm=new THREE.Mesh(mergeGeo(tp),_carDetMat); dm.castShadow=true; grp.add(dm);
carFx=3.7; type='truck';
} else {
col=type==='taxi'?0xf2c418:(type==='van'?[0xe8e8e8,0xf2f2f2,0x5a6a7a][Math.floor(Math.random()*3)]:[0xd8452e,0x2e6fd8,0xe8e8e8,0x30343a,0xe8b02e,0x3fae5a,0xf2f2f2,0x1a1c20,0x8a8f96,0x7a2a3a,0x1f3a6a][Math.floor(Math.random()*11)]);
mat=new THREE.MeshStandardMaterial({color:col,roughness:rand(0.2,0.34),metalness:0.62}); regEnv(mat,0.9);
var G=carGeos(type);
body=new THREE.Mesh(G.paint,mat); body.castShadow=true; grp.add(body);
var gl=new THREE.Mesh(G.glass,_carGlass); gl.renderOrder=2; grp.add(gl);
var dm2=new THREE.Mesh(G.det,_carDetMat); dm2.castShadow=true; grp.add(dm2);
carFx=type==='van'?2.95:2.5;
}
var hlGlow=new THREE.Sprite(_carGlowMat); hlGlow.scale.set(2.8,1.6,1); hlGlow.position.set(carFx,0.85,0); grp.add(hlGlow);
var tlGlow=new THREE.Sprite(_carTailMat); tlGlow.scale.set(2.0,1.1,1); tlGlow.position.set(-carFx,0.9,0); grp.add(tlGlow);
var hlPool=new THREE.Mesh(new THREE.PlaneGeometry(8,4.4),_carPoolMat); hlPool.rotation.x=-Math.PI/2; hlPool.position.set(carFx+3.6,0.12,0); grp.add(hlPool);
grp.userData.lights=[hlGlow,tlGlow,hlPool]; hlGlow.visible=tlGlow.visible=hlPool.visible=false;
grp.position.set(x,0,z);
if(roadAxis==='z')grp.rotation.y=dir>0?-Math.PI/2:Math.PI/2; else grp.rotation.y=dir>0?0:Math.PI;
stageGroup.add(grp);
o=registerDestructible({group:grp,main:body,rubble:null,type:'car',hp:22,maxHp:22,value:4200000,scorePts:420,w:type==='truck'?7.2:(type==='van'?5.6:4.8),d:2.5,height:isTruck?3.4:2.2,explosive:{radius:9,dmg:26},destroyed:false,collapsing:0,stage:0,mat:mat,baseTint:col,yenGiven:0,scoreGiven:0});
o.isCar=true; o.axis=roadAxis; o.dir=dir; o.speed=rand(7,13); o.moving=true; o.phase=Math.random()*6.28; o.travel=0; o.ctype=type;
cars.push(o); return o;
}
/* dense road traffic: lane = offset 2.4*dir from each road centre line (left-hand traffic), evenly spaced per lane */
function spawnTraffic(perLane,lines){
lines=lines||[-132,-88,-44,0,44,88,132]; var span=WORLD*2+20;
lines.forEach(function(rl){ ['x','z'].forEach(function(ax){ [-1,1].forEach(function(dr){
var base=rand(9,14),n=perLane;
for(var i=0;i<n;i++){ var along=-WORLD-10+(i+Math.random()*0.6)*(span/n); var off=2.4*dr;
var c; if(ax==='z')c=makeCar(rl+off,along,'z',dr); else c=makeCar(along,rl+off,'x',dr);
c.speed=base*rand(0.96,1.04); } }); }); });
document.getElementById('totalNum').textContent=totalCount;
}
var _carLightT=0;
function carsLightUpdate(dt){
_carLightT-=dt; if(_carLightT>0)return; _carLightT=0.5; var on=DUSK.cur>0.28;
for(var i=0;i<cars.length;i++){ var c=cars[i]; if(c.destroyed||!c.moving||!c.group.userData.lights)continue; var L=c.group.userData.lights; for(var k=0;k<L.length;k++)L[k].visible=on; }
}

function spawnCityCars(){
makeCar(-44+2.4, -120,'z',1); makeCar(44-2.4, 60,'z',-1); makeCar(0+2.4,-40,'z',1); makeCar(-88-2.4,100,'z',-1);
makeCar(-100, 44-2.4,'x',-1); makeCar(30,-44+2.4,'x',1); makeCar(110,0-2.4,'x',-1);
var parked=[[30,30],[-58,74],[74,-58],[-30,-102],[102,30],[-102,-30],[58,118]];
parked.forEach(function(p,i){ var c=makeCar(p[0],p[1], i%2?'x':'z', 1); c.moving=false; c.group.rotation.y=rand(0,Math.PI*2); c.group.userData.parkRot=c.group.rotation.y;});
spawnTraffic(3);
document.getElementById('totalNum').textContent=totalCount;
}


/* ================= stage builders ================= */
function addStaticPlane(x,z,w,d,color,y){
var m=new THREE.Mesh(new THREE.PlaneGeometry(w,d),new THREE.MeshStandardMaterial({color:color,roughness:0.95}));
m.rotation.x=-Math.PI/2; m.position.set(x,y||0.05,z); m.receiveShadow=true; stageGroup.add(m); return m;
}
/* ---- shared-geometry background / filler buildings (cheap: one unit box
   geometry + a handful of shared materials, no shadows, NOT destructible,
   so they never enter the destruction-rate count) ---- */
var _unitBox=null,_unitCone=null,_bgMatCache={};
function bgMat(key,tex,tint){
if(_bgMatCache[key])return _bgMatCache[key];
var m;
if(tex){ var t=tex.clone(); t.needsUpdate=true; t.wrapS=t.wrapT=THREE.RepeatWrapping; t.repeat.set(2,2); m=new THREE.MeshStandardMaterial({map:t,color:tint||0xffffff,roughness:0.85}); }
else m=new THREE.MeshStandardMaterial({color:tint||0x888888,roughness:0.9});
_bgMatCache[key]=m; return m;
}
function bgMats(){
return [bgMat('ba',texA,0xb4b8bc),bgMat('bb',texB,0xbfae94),bgMat('bc',texC,0xa9bfcb),bgMat('bw',texWhite,0xe0dacb),bgMat('bg',texGlass,0xc9d9e4)];
}
function addBgBuilding(x,z,w,d,h,mat,houseRoof){
if(!_unitBox){ _unitBox=new THREE.BoxGeometry(1,1,1); _unitBox.translate(0,0.5,0); _unitCone=new THREE.ConeGeometry(1,1,4); _unitCone.translate(0,0.5,0);}
var m=new THREE.Mesh(_unitBox,mat); m.scale.set(w,h,d); m.position.set(x,0,z); stageGroup.add(m);
if(houseRoof){
var r=new THREE.Mesh(_unitCone,bgMat('hroof',null,0x8a4a38));
r.scale.set(w*0.76,h*0.42,d*0.76); r.position.set(x,h,z); r.rotation.y=Math.PI/4; stageGroup.add(r);
} else {
var s=new THREE.Mesh(_unitBox,bgMat('broof',null,0x4a4e52));
s.scale.set(w+0.7,0.55,d+0.7); s.position.set(x,h-0.28,z); stageGroup.add(s);
}
return m;
}
function addSkylineRing(n,rMin,rMax,hMin,hMax,a0,a1,keepOut){
var mats=bgMats();
for(var i=0;i<n;i++){
var a=a0+(a1-a0)*(i+Math.random()*0.7)/n;
var r=rand(rMin,rMax);
var sx=Math.cos(a)*r, sz=Math.sin(a)*r;
if(keepOut&&keepOut(sx,sz))continue; // leave this sector empty (e.g. the airbase yard)
addBgBuilding(sx,sz,rand(13,24),rand(13,24),rand(hMin,hMax),mats[i%mats.length],false);
}
}
function registerCustom(grp,main,w,d,h,type,value,score,hp,explosive){
var rub=new THREE.Group(); var rm=new THREE.MeshStandardMaterial({color:0x6f6a63,roughness:1});
var r1=new THREE.Mesh(new THREE.BoxGeometry(Math.max(2,w*0.85),1.5,Math.max(2,d*0.85)),rm); r1.position.y=0.75; rub.add(r1);
var r2=new THREE.Mesh(new THREE.BoxGeometry(Math.max(1.5,w*0.45),2.2,Math.max(1.5,d*0.4)),rm); r2.position.set(w*0.12,1.1,0); r2.rotation.z=0.22; rub.add(r2);
rub.visible=false; grp.add(rub); stageGroup.add(grp);
var o=registerDestructible({group:grp,main:main,rubble:rub,type:type,hp:hp,maxHp:hp,value:value,scorePts:score,w:w,d:d,height:h,explosive:explosive||null,destroyed:false,collapsing:0,stage:0,mat:main?main.material:null,baseTint:(main&&main.material&&main.material.color)?main.material.color.getHex():0xffffff,yenGiven:0,scoreGiven:0});
return o;
}
function makeFuelTankAt(x,z,big){
var grp=new THREE.Group(); grp.position.set(x,0,z);
var r=big?4.2:3.2, hh=big?9:7;
var body=new THREE.Mesh(new THREE.CylinderGeometry(r,r,hh,14),new THREE.MeshStandardMaterial({color:0xd8d2c2,roughness:0.35,metalness:0.5}));
body.position.y=hh/2; body.castShadow=true; grp.add(body);
var band=new THREE.Mesh(new THREE.CylinderGeometry(r+0.08,r+0.08,1.3,14),new THREE.MeshStandardMaterial({color:0xb03a1e,roughness:0.5}));
band.position.y=hh*0.62; grp.add(band);
var top=new THREE.Mesh(new THREE.SphereGeometry(r,12,6,0,Math.PI*2,0,Math.PI/2),new THREE.MeshStandardMaterial({color:0xb9b2a0,roughness:0.5})); top.position.y=hh; top.scale.y=0.35; grp.add(top);
var o=registerCustom(grp,body,r*2,r*2,hh,'tank',big?34000000:26000000,big?3400:2600,big?50:42,{radius:big?20:17,dmg:60});
o.isTank=true; return o;
}
var radarSpinners=[];
function makeRadarAt(x,z){
var grp=new THREE.Group(); grp.position.set(x,0,z);
var pole=new THREE.Mesh(new THREE.CylinderGeometry(0.7,1.1,7,8),new THREE.MeshStandardMaterial({color:0x8a9296,roughness:0.6,metalness:0.4})); pole.position.y=3.5; pole.castShadow=true; grp.add(pole);
var spin=new THREE.Group(); spin.position.y=7.6; grp.add(spin); radarSpinners.push(spin);
var dish=new THREE.Mesh(new THREE.SphereGeometry(3.4,12,8,0,Math.PI*2,0,Math.PI/2.4),new THREE.MeshStandardMaterial({color:0xe4e7e4,roughness:0.35,metalness:0.3,side:THREE.DoubleSide}));
dish.rotation.x=-0.7; dish.castShadow=true; spin.add(dish);
var base=new THREE.Mesh(new THREE.BoxGeometry(5,1.2,5),new THREE.MeshStandardMaterial({color:0x6d7468,roughness:0.8})); base.position.y=0.6; grp.add(base);
return registerCustom(grp,dish,6,6,9,'radar',38000000,4200,55,null);
}
function makeTankVehicle(x,z,rotY){
var grp=new THREE.Group(); grp.position.set(x,0,z); grp.rotation.y=rotY||0;
var mat=new THREE.MeshStandardMaterial({color:0x55603e,roughness:0.65,metalness:0.35});
var body=new THREE.Mesh(new THREE.BoxGeometry(6.4,1.5,3.1),mat); body.position.y=1.15; body.castShadow=true; grp.add(body);
var tur=new THREE.Mesh(new THREE.BoxGeometry(2.9,1.0,2.3),mat); tur.position.set(-0.3,2.35,0); tur.castShadow=true; grp.add(tur);
var barrel=new THREE.Mesh(new THREE.CylinderGeometry(0.17,0.2,3.8,7),new THREE.MeshStandardMaterial({color:0x39402c,roughness:0.5,metalness:0.5})); barrel.rotation.z=Math.PI/2; barrel.position.set(2.4,2.5,0); grp.add(barrel);
var trM=new THREE.MeshStandardMaterial({color:0x22241e,roughness:0.95});
[-1,1].forEach(function(sd){ var tr=new THREE.Mesh(new THREE.BoxGeometry(6.6,1.0,0.7),trM); tr.position.set(0,0.5,sd*1.45); grp.add(tr);});
var o=registerCustom(grp,body,6.6,3.4,3,'tankcar',22000000,3000,55,{radius:10,dmg:30});
o.isTank=true; return o;
}
function makeGateAt(x,z,w,color,type,value,score){
var grp=new THREE.Group(); grp.position.set(x,0,z);
var mat=new THREE.MeshStandardMaterial({color:color,roughness:0.6});
var p1=new THREE.Mesh(new THREE.BoxGeometry(1.1,5.2,1.1),mat); p1.position.set(-w/2,2.6,0); p1.castShadow=true; grp.add(p1);
var p2=new THREE.Mesh(new THREE.BoxGeometry(1.1,5.2,1.1),mat); p2.position.set(w/2,2.6,0); grp.add(p2);
var top=new THREE.Mesh(new THREE.BoxGeometry(w+1.6,1.0,1.3),mat); top.position.y=5.4; top.castShadow=true; grp.add(top);
return registerCustom(grp,top,w+1,2,6,type,value,score,40,null);
}
function makePoolAt(x,z){
var grp=new THREE.Group(); grp.position.set(x,0,z);
var rim=new THREE.Mesh(new THREE.BoxGeometry(24,1.0,13),new THREE.MeshStandardMaterial({color:0xd8dcd8,roughness:0.7})); rim.position.y=0.5; rim.castShadow=true; grp.add(rim);
var water=new THREE.Mesh(new THREE.BoxGeometry(21,0.5,10),new THREE.MeshStandardMaterial({color:0x2e9fd8,roughness:0.15,metalness:0.2})); water.position.y=0.85; grp.add(water);
var board=new THREE.Mesh(new THREE.BoxGeometry(3.2,2.6,2.2),new THREE.MeshStandardMaterial({color:0xe8e8e8,roughness:0.6})); board.position.set(-9,1.3,-4); grp.add(board);
return registerCustom(grp,water,24,13,2,'pool',12000000,1500,36,null);
}
function makeTollAt(x,z){
var grp=new THREE.Group(); grp.position.set(x,0,z);
var roofM2=new THREE.MeshStandardMaterial({color:0x2e6da8,roughness:0.5});
var roof=new THREE.Mesh(new THREE.BoxGeometry(7,0.8,30),roofM2); roof.position.y=6.2; roof.castShadow=true; grp.add(roof);
var boothM=new THREE.MeshStandardMaterial({color:0xe8e6da,roughness:0.6});
[-10,-5,0,5,10].forEach(function(bz){ var b=new THREE.Mesh(new THREE.BoxGeometry(2.6,3.4,2.6),boothM); b.position.set(0,1.7,bz); b.castShadow=true; grp.add(b); var pil=new THREE.Mesh(new THREE.CylinderGeometry(0.3,0.3,6,7),boothM); pil.position.set(3,3,bz); grp.add(pil);});
return registerCustom(grp,roof,8,30,6.6,'toll',30000000,3600,60,null);
}
function makeGantryAt(x,z){
var grp=new THREE.Group(); grp.position.set(x,0,z);
var mat=new THREE.MeshStandardMaterial({color:0x707880,roughness:0.5,metalness:0.5});
[-9,9].forEach(function(gz){ var p=new THREE.Mesh(new THREE.BoxGeometry(0.7,7.5,0.7),mat); p.position.set(0,3.75,gz); grp.add(p);});
var beam=new THREE.Mesh(new THREE.BoxGeometry(1.0,1.6,19),new THREE.MeshStandardMaterial({color:0x2e7d46,roughness:0.55})); beam.position.y=7.2; beam.castShadow=true; grp.add(beam);
return registerCustom(grp,beam,2,19,8,'gantry',9000000,1200,30,null);
}
/* ================= realism kit: shared detail helpers for the
   city / military / highway / airport stages (school-level detail,
   built from shared cached materials + canvas sign textures so the
   extra meshes stay cheap: no per-prop textures, almost no shadows) */
var _signTexCache={};
function addSign(parent,w,h,text,bg,fg,x,y,z,rotY){
var key=text+'|'+bg+'|'+fg;
var tex=_signTexCache[key];
if(!tex){
var c=document.createElement('canvas'); c.width=512; c.height=128; var g=c.getContext('2d');
g.fillStyle=bg; g.fillRect(0,0,512,128);
g.strokeStyle=fg; g.lineWidth=5; g.strokeRect(8,8,496,112);
var px=text.length>9?42:(text.length>6?54:(text.length>4?66:80));
g.fillStyle=fg; g.font='900 '+px+'px "Hiragino Kaku Gothic ProN","Hiragino Sans","Noto Sans JP",sans-serif';
g.textAlign='center'; g.textBaseline='middle'; g.fillText(text,256,68);
tex=new THREE.CanvasTexture(c); tex.colorSpace=THREE.SRGBColorSpace; _signTexCache[key]=tex;
}
var m=new THREE.Mesh(new THREE.PlaneGeometry(w,h),new THREE.MeshBasicMaterial({map:tex}));
m.position.set(x,y,z); if(rotY)m.rotation.y=rotY; parent.add(m); return m;
}
var _rMats={};
function rMat(key,color,rough,metal){
if(!_rMats[key])_rMats[key]=new THREE.MeshStandardMaterial({color:color,roughness:(rough==null?0.8:rough),metalness:metal||0});
return _rMats[key];
}
var _gmMats={};
function groundMark(x,z,w,d,color,y){
if(!_gmMats[color])_gmMats[color]=new THREE.MeshBasicMaterial({color:color});
var m=new THREE.Mesh(new THREE.PlaneGeometry(w,d),_gmMats[color]);
m.rotation.x=-Math.PI/2; m.position.set(x,y||0.07,z); stageGroup.add(m); return m;
}
/* perimeter fence run: posts + 2 rails + faint mesh panel (5-8 meshes per run) */
function fenceRun(x1,z1,x2,z2,h){
var railM=rMat('fenceRail',0x707a70,0.5,0.5);
var meshM=null;
if(!_rMats['fenceMesh']){ _rMats['fenceMesh']=new THREE.MeshStandardMaterial({color:0x9aa79c,roughness:0.7,metalness:0.4,transparent:true,opacity:0.22,side:THREE.DoubleSide}); }
meshM=_rMats['fenceMesh'];
var len=Math.sqrt((x2-x1)*(x2-x1)+(z2-z1)*(z2-z1));
var cx=(x1+x2)/2, cz=(z1+z2)/2, ang=Math.atan2(z2-z1,x2-x1);
function seg(w,hh,d,mat,y){
var m=sBox(stageGroup,w,hh,d,mat,cx,y,cz,false); m.rotation.y=-ang; return m;
}
seg(len,h*0.82,0.04,meshM,h*0.52);
seg(len,0.07,0.07,railM,h);
seg(len,0.06,0.06,railM,h*0.55);
var np=Math.max(2,Math.round(len/24));
for(var i=0;i<=np;i++){ sBox(stageGroup,0.2,h,0.2,railM,x1+(x2-x1)*i/np,h/2,z1+(z2-z1)*i/np,false); }
}
/* sagging overhead wire between two points (power / telephone line) */
var _wireMat=null;
function sagWire(parent,x1,y1,z1,x2,y2,z2,sag){
if(!_wireMat)_wireMat=new THREE.LineBasicMaterial({color:0x1c1e20,transparent:true,opacity:0.65});
var pts=[];
for(var i=0;i<=12;i++){ var t=i/12; var mx=lerp(x1,x2,t), mz=lerp(z1,z2,t); var my=lerp(y1,y2,t)-Math.sin(t*Math.PI)*(sag||0.9); pts.push(new THREE.Vector3(mx,my,mz)); }
var line=new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts),_wireMat);
parent.add(line); return line;
}
/* ================= CITY realism: signs, konbini, park, bus stops, poles */
function enhanceCityRealism(){
var list=destructibles.slice();
var names=['ホテル サンライズ','カラオケBOX','やまだ薬局','みらい銀行','ラーメン一番','フィットネスジム','ほんの森 書店','カフェ・ド・空','さくら歯科','不動産ハウス','ゲームセンター','駅前百貨店'];
var bgs=['#17384a','#7a1f2b','#1e5c3a','#1d3a6e','#8a3320','#37424a'];
var ni=0;
for(var i=0;i<list.length&&ni<14;i++){
var o=list[i];
if((o.type!=='office'&&o.type!=='tower')||o.height<11)continue;
var sw=Math.min(o.w-1.5,11.5), sy=Math.min(o.height-2.2,5.4);
sBox(o.group,sw+0.5,1.8,0.3,rMat('signBack',0x22262a,0.6,0.3),0,sy,o.d/2+0.08,false);
addSign(o.group,sw,1.55,names[ni%names.length],bgs[ni%bgs.length],'#f4efe0',0,sy,o.d/2+0.26,0);
ni++;
}
/* --- convenience store on the plaza block (destructible) --- */
(function(){
var grp=new THREE.Group(); grp.position.set(38,0,-10);
var body=sBox(grp,13,4.6,8,rMat('konbiniWall',0xf0eee6,0.7,0),0,2.3,0,true);
sBox(grp,13.6,0.5,8.6,rMat('konbiniRoof',0x37424a,0.7,0.2),0,4.85,0,false);
sBox(grp,13.2,1.5,0.25,rMat('konbiniGlass',0x39586e,0.15,0.35),0,1.6,4.05,false); // glass front
sBox(grp,13.2,0.9,0.28,new THREE.MeshStandardMaterial({color:0xffe9a8,roughness:0.4,emissive:0x77662a,emissiveIntensity:0.7}),0,3.4,4.05,false); // lit interior band
sBox(grp,2.2,2.6,0.2,rMat('konbiniGlass',0x39586e,0.15,0.35),-3,1.3,4.08,false); // automatic door
addSign(grp,12.4,1.5,'コンビニ 24時間営業','#e8491d','#ffffff',0,4.1,4.2,0);
addSign(grp,3.4,1.1,'ATM','#17384a','#ffffff',4.6,2.9,4.2,0);
var o=registerCustom(grp,body,13,8,5.1,'konbini',16000000,1700,48,null);
o.mat=null;
})();
// konbini parking bays + vending machines by the road
for(var pv=0;pv<4;pv++) groundMark(32.5+pv*3.1,-3.4,0.28,4.6,0xe9e6d8,0.065);
(function(){
var vm=new THREE.Group(); vm.position.set(29.5,0,-4.6); stageGroup.add(vm);
sBox(vm,1.1,1.9,0.8,rMat('vendRed',0xc23a1e,0.45,0.2),0,0.95,0,true);
sBox(vm,1.1,1.9,0.8,rMat('vendWhite',0xe8e8e8,0.45,0.2),1.3,0.95,0,false);
sBox(vm,0.7,0.9,0.1,rMat('konbiniGlass',0x39586e,0.15,0.35),0,1.25,0.42,false);
sBox(vm,0.55,0.5,0.6,rMat('binGray',0x5a6068,0.8,0.2),2.5,0.25,0,false);
})();
/* --- pocket park opposite the pad: lawn, benches, slide, shade trees --- */
addStaticPlane(6,-38,21,15,0x5d7d43,0.045);
addStaticPlane(6,-38,3.2,15,0xcfc8b4,0.055);
addStaticPlane(6,-38,21,2.6,0xcfc8b4,0.055);
(function(){
var pg=new THREE.Group(); stageGroup.add(pg);
var benchM=rMat('benchWood',0x8a6a48,0.85,0);
[[-1,-33],[13,-33],[13,-43]].forEach(function(bp){
sBox(pg,2.6,0.12,0.6,benchM,bp[0],0.55,bp[1],false);
sBox(pg,2.6,0.7,0.1,benchM,bp[0],1.0,bp[1]-0.3,false);
sBox(pg,0.15,0.55,0.5,benchM,bp[0]-1.1,0.27,bp[1],false);
sBox(pg,0.15,0.55,0.5,benchM,bp[0]+1.1,0.27,bp[1],false);
});
var sl=sBox(pg,1.0,0.14,4.4,rMat('slideRed',0xd84a3a,0.4,0.3),0,1.1,-41,true); sl.rotation.x=0.42;
sBox(pg,1.2,1.5,1.2,rMat('jungleGreen',0x3a7d5c,0.5,0.4),0,0.75,-43.2,false);
sBox(pg,3.4,0.18,3.4,rMat('sand',0xd8c49a,1,0),11,0.1,-37,false); // sandbox
})();
makeGreenTree(stageGroup,-3,-43,1.05); makeGreenTree(stageGroup,15,-36,0.9); makeGreenTree(stageGroup,-3,-32,0.85);
/* --- utility poles along the west avenues --- */
(function(){
var poleM=rMat('poleWood',0x4c3d2c,0.95,0);
var crossM=rMat('poleCross',0x3a3f44,0.6,0.4);
[-100,-60,20,60,100].forEach(function(pz){
var pg2=new THREE.Group(); pg2.position.set(-50.5,0,pz); stageGroup.add(pg2);
sCyl(pg2,0.16,0.22,8.6,poleM,0,4.3,0,7);
sBox(pg2,0.18,0.18,2.6,crossM,0,7.9,0,false);
sBox(pg2,0.5,0.7,0.5,crossM,0.35,6.9,0,false); // transformer can
});
})();
/* --- bus stops (both directions on the central avenue) --- */
[[58,7.2,0],[-58,-7.2,Math.PI]].forEach(function(bs){
var bg2=new THREE.Group(); bg2.position.set(bs[0],0,bs[1]); bg2.rotation.y=bs[2]; stageGroup.add(bg2);
sBox(bg2,4.6,0.18,1.6,rMat('busRoof',0x2e6da8,0.5,0.3),0,2.5,-0.4,false);
[-2,-0.7,0.7,2].forEach(function(bx){ sCyl(bg2,0.06,0.06,2.5,rMat('poleSteel',0xb9bec2,0.4,0.6),bx,1.25,-1.05,6); });
sBox(bg2,3.6,0.5,0.12,rMat('benchWood',0x8a6a48,0.85,0),0,0.6,-0.9,false);
sCyl(bg2,0.07,0.09,3.1,rMat('poleSteel',0xb9bec2,0.4,0.6),2.9,1.55,0,7);
addSign(bg2,1.5,1.0,'バス停','#f4efe0','#27313a',2.9,3.3,0.1,0);
});
/* --- sagging power lines between the utility poles + worn road patches --- */
(function(){
var pzList=[-100,-60,20,60,100];
for(var wi=0;wi<pzList.length-1;wi++){
sagWire(stageGroup,-50.5,7.9,pzList[wi],-50.5,7.9,pzList[wi+1],1.1);
sagWire(stageGroup,-50.5,7.45,pzList[wi],-50.5,7.45,pzList[wi+1],1.3);
}
for(var rp=0;rp<9;rp++){
var onV=Math.random()<0.5;
var rx=onV?(Math.floor(rand(-3,3))*44):rand(-130,130);
var rz=onV?rand(-130,130):(Math.floor(rand(-3,3))*44);
groundMark(rx,rz,rand(4,8),rand(3,5),0x2b2b2e,0.062);
}
groundMark(-7.5,0,0.55,8.6,0xf2eed8,0.075); groundMark(7.5,0,0.55,8.6,0xf2eed8,0.075); // stop lines at the central crossing
})();
}
/* ================= MILITARY realism: hangar doors + roofs, HQ flag,
   ammo mounds, fuel bund, watchtowers, checkpoint, perimeter fence */
function enhanceMilitaryRealism(){
var list=destructibles.slice();
var steel=rMat('milSteel',0x707a72,0.45,0.5);
var darkSteel=rMat('milDark',0x454e46,0.55,0.4);
for(var i=0;i<list.length;i++){
var o=list[i];
if(o.type==='hangar'){
var slopeLen=Math.sqrt((o.w/2)*(o.w/2)+3.2*3.2), ang=Math.atan2(3.2,o.w/2);
[-1,1].forEach(function(sd){
var p=sBox(o.group,slopeLen,0.3,o.d+1.4,rMat('hangarRoof',0x5d6656,0.6,0.3),sd*o.w/4,o.height+1.5,0,true);
p.rotation.z=-sd*ang;
});
sBox(o.group,0.55,0.4,o.d+1.4,darkSteel,0,o.height+3.05,0,false);
sBox(o.group,o.w*0.72,o.height*0.78,0.25,steel,0,o.height*0.39,o.d/2+0.16,false); // sliding door
for(var sx2=-2;sx2<=2;sx2++) sBox(o.group,0.14,o.height*0.78,0.1,darkSteel,sx2*o.w*0.17,o.height*0.39,o.d/2+0.3,false);
sBox(o.group,o.w*0.72,0.16,0.1,darkSteel,0,o.height*0.58,o.d/2+0.3,false);
addSign(o.group,5.6,1.25,'格納庫','#37424a','#f4efe0',0,o.height*0.9,o.d/2+0.2,0);
}
else if(o.type==='hq'){
sCyl(o.group,0.07,0.1,9.5,rMat('poleSteel',0xb9bec2,0.4,0.6),6,4.75,o.d/2+3.6,8);
var fl=new THREE.Mesh(new THREE.PlaneGeometry(2.3,1.5),new THREE.MeshBasicMaterial({map:schoolFlagTex(),side:THREE.DoubleSide}));
fl.position.set(7.2,8.6,o.d/2+3.6); fl.rotation.y=0.25; o.group.add(fl);
addSign(o.group,6.4,1.5,'司令部','#2e4a3a','#f4efe0',0,o.height-2,o.d/2+0.16,0);
sBox(o.group,7,0.35,3.4,rMat('milCanopy',0x5a6068,0.55,0.3),0,3.2,o.d/2+1.6,false);
}
else if(o.type==='barracks'){
addSign(o.group,4.6,1.15,'隊舎','#4a5548','#f4efe0',0,o.height-1.7,o.d/2+0.16,0);
}
else if(o.type==='ammo'){
var mound=new THREE.Mesh(new THREE.SphereGeometry(1,14,9),rMat('moundGrass',0x6d7a52,1,0));
mound.scale.set(o.w*0.58,3.4,o.d*0.6); mound.position.y=o.height-0.6; mound.castShadow=true; o.group.add(mound);
addSign(o.group,4.8,1.2,'弾薬庫','#8a1f14','#ffffff',0,2.6,o.d/2+0.2,0);
}
else if(o.type==='tower'){
sBox(o.group,7.4,2.6,7.4,rMat('milGlass',0x2c404e,0.18,0.35),0,o.height+1.5,0,true);
sBox(o.group,8.4,0.45,8.4,darkSteel,0,o.height+3,0,false);
}
}
/* --- fuel farm: concrete bund wall, connecting pipe, warning sign --- */
(function(){
var conc=rMat('bundConc',0xa8a294,0.95,0);
sBox(stageGroup,25,1.15,0.55,conc,-96,0.58,-70.5,false);
sBox(stageGroup,25,1.15,0.55,conc,-96,0.58,-17.5,false);
sBox(stageGroup,0.55,1.15,53.5,conc,-108.5,0.58,-44,false);
sBox(stageGroup,0.55,1.15,53.5,conc,-83.5,0.58,-44,false);
var pipe=sCyl(stageGroup,0.32,0.32,26,rMat('pipeSteel',0xb9bec2,0.35,0.6),-96,1.3,-44,10); pipe.rotation.x=Math.PI/2;
var sg=new THREE.Group(); sg.position.set(-83,0,-44); sg.rotation.y=Math.PI/2; stageGroup.add(sg);
sCyl(sg,0.08,0.1,3.4,conc,0,1.7,0,7);
addSign(sg,4.6,1.5,'燃料庫 立入禁止','#8a1f14','#ffffff',0,3.4,0.1,0);
})();
/* --- watchtowers at two corners (destructible) --- */
[[-120,100],[120,-80]].forEach(function(wp){
var grp=new THREE.Group(); grp.position.set(wp[0],0,wp[1]);
var legM=rMat('towerLeg',0x5d6656,0.7,0.3);
[[-1.6,-1.6],[1.6,-1.6],[-1.6,1.6],[1.6,1.6]].forEach(function(lp){ sBox(grp,0.32,6.4,0.32,legM,lp[0],3.2,lp[1],false); });
sBox(grp,4.6,0.3,4.6,legM,0,6.4,0,false);
var cab=sBox(grp,4.2,2.4,4.2,rMat('towerCab',0x77816e,0.7,0.2),0,7.7,0,true);
sBox(grp,4.3,0.9,4.3,rMat('milGlass',0x2c404e,0.18,0.35),0,8.1,0,false);
var roof=new THREE.Mesh(new THREE.ConeGeometry(3.6,1.6,4),rMat('towerRoof',0x454e46,0.7,0.2));
roof.position.y=9.7; roof.rotation.y=Math.PI/4; roof.castShadow=true; grp.add(roof);
sBox(grp,0.5,5.6,0.12,legM,0,2.8,2.05,false); // ladder
var o=registerCustom(grp,cab,4.6,4.6,10.5,'watchtower',18000000,2200,50,null);
o.mat=null;
});
/* --- checkpoint on the in-base road + guardhouse --- */
var gate=makeGateAt(0,-62,14,0x55603e,'icgate',9000000,1100); gate.group.rotation.y=Math.PI/2;
(function(){
var bg3=new THREE.Group(); bg3.position.set(3.2,0,-62); stageGroup.add(bg3);
sBox(bg3,0.5,1.15,0.5,rMat('gatePost',0x37424a,0.6,0.3),0,0.58,-4.4,false);
var arm=sBox(bg3,0.28,0.28,6.4,rMat('armRed',0xd84a3a,0.5,0.2),0,1.25,-1.2,false);
sBox(bg3,0.3,0.3,1.6,rMat('vendWhite',0xe8e8e8,0.5,0.2),0,1.25,-2.6,false);
sBox(bg3,0.3,0.3,1.6,rMat('vendWhite',0xe8e8e8,0.5,0.2),0,1.25,0.2,false);
})();
var gh=makeBuilding(10,-56.5,5.5,4.5,3.4,texWhite,0xd8d8c8,'guard',5000000,600); setHp(gh,30);
addSign(gh.group,3.6,1.0,'警衛所','#37424a','#f4efe0',0,2.7,gh.d/2+0.16,0);
/* --- parked fighter jets on the apron (destructible) --- */
[[84,-24,0.5],[-30,-24,-0.4]].forEach(function(fp){
var grp=new THREE.Group(); grp.position.set(fp[0],0,fp[1]); grp.rotation.y=fp[2];
var jm=rMat('jetGray',0x8a949c,0.35,0.6);
var fus=new THREE.Mesh(new THREE.CylinderGeometry(0.85,1.05,9,10),jm);
fus.rotation.z=Math.PI/2; fus.position.y=1.5; fus.castShadow=true; grp.add(fus);
var nose=new THREE.Mesh(new THREE.ConeGeometry(0.85,3.2,10),jm); nose.rotation.z=-Math.PI/2; nose.position.set(6,1.5,0); grp.add(nose);
var can=new THREE.Mesh(new THREE.SphereGeometry(0.72,10,8),rMat('milGlass',0x2c404e,0.18,0.35)); can.scale.set(1.9,0.75,0.9); can.position.set(2.2,2.05,0); grp.add(can);
[-1,1].forEach(function(sd){
var w=new THREE.Mesh(new THREE.BoxGeometry(3.4,0.14,4.4),rMat('jetWing',0x6d767c,0.45,0.5)); w.position.set(-1,1.15,sd*2.4); w.rotation.y=sd*0.5; grp.add(w);
var fin=new THREE.Mesh(new THREE.BoxGeometry(1.8,1.7,0.13),rMat('jetWing',0x6d767c,0.45,0.5)); fin.position.set(-4.1,2.4,sd*0.8); fin.rotation.x=sd*0.2; grp.add(fin);
});
var o=registerCustom(grp,fus,11,7.5,3.2,'fighter',26000000,3200,60,{radius:11,dmg:30});
o.mat=null;
});
/* --- runway strip markings + edge lights --- */
for(var rx=-140;rx<=140;rx+=20) groundMark(rx,84,9,0.95,0xf2eed8,0.07);
for(var te=0;te<4;te++){ groundMark(-148,78.5+te*3.6,6,1.3,0xf2eed8,0.07); groundMark(148,78.5+te*3.6,6,1.3,0xf2eed8,0.07); }
(function(){
var eg=new THREE.SphereGeometry(0.3,6,5), em=new THREE.MeshBasicMaterial({color:0xffe27a});
for(var lx=-140;lx<=140;lx+=28){ [-75.8,92.2].forEach(function(lz){ var s=new THREE.Mesh(eg,em); s.position.set(lx,0.4,lz); stageGroup.add(s); }); }
})();
/* --- perimeter fence (gate side faces the pads, kept low-detail) --- */
fenceRun(-128,-92,128,-92,2.4); fenceRun(128,-92,128,74,2.4); fenceRun(128,94,128,118,2.4); fenceRun(128,118,-128,118,2.4); fenceRun(-128,118,-128,94,2.4); fenceRun(-128,74,-128,-92,2.4);
}
/* ================= HIGHWAY realism: guardrails, median, sound barriers,
   lane dashes, lit gantries, toll barriers, SA canopies + parking ====== */
function enhanceHighwayRealism(){
var list=destructibles.slice();
var steel=rMat('hwSteel',0xb9bec2,0.35,0.65);
var conc=rMat('hwConc',0x9aa0a2,0.9,0);
/* guardrails + concrete median */
sBox(stageGroup,330,0.55,0.25,steel,0,1.0,11.2,false);
sBox(stageGroup,330,0.55,0.25,steel,0,1.0,-11.2,false);
sBox(stageGroup,132,0.85,0.45,conc,-99,0.43,0,false);
sBox(stageGroup,180,0.85,0.45,conc,75,0.43,0,false);
for(var gx=-160;gx<=160;gx+=32){ sBox(stageGroup,0.2,0.95,0.2,steel,gx,0.48,11.2,false); sBox(stageGroup,0.2,0.95,0.2,steel,gx,0.48,-11.2,false); }
/* lane divider dashes */
for(var dx=-162;dx<=162;dx+=18){ groundMark(dx,3.5,7,0.45,0xf5efcf,0.075); groundMark(dx,-3.5,7,0.45,0xf5efcf,0.075); }
/* sound-barrier walls (translucent panels) along residential stretches */
(function(){
var panelM=null;
if(!_rMats['soundPanel'])_rMats['soundPanel']=new THREE.MeshStandardMaterial({color:0x8fb4c4,roughness:0.25,metalness:0.2,transparent:true,opacity:0.72});
panelM=_rMats['soundPanel'];
for(var px=-150;px<=-62;px+=15) sBox(stageGroup,14.4,3.6,0.25,panelM,px,2.3,-12.6,false);
for(var px2=62;px2<=150;px2+=15) sBox(stageGroup,14.4,3.6,0.25,panelM,px2,2.3,-12.6,false);
for(var px3=-45;px3<=45;px3+=15) sBox(stageGroup,14.4,3.6,0.25,panelM,px3,2.3,12.6,false);
})();
/* highway lighting */
[-150,-90,-30,30,90,150].forEach(function(lx,li){
var lg=new THREE.Group(); lg.position.set(lx,0,li%2?10.6:-10.6); stageGroup.add(lg);
sCyl(lg,0.13,0.19,7.4,rMat('poleDark',0x3a4046,0.55,0.6),0,3.7,0,7);
sBox(lg,0.16,0.16,2.6,rMat('poleDark',0x3a4046,0.55,0.6),0,7.3,li%2?-1.1:1.1,false);
sBox(lg,1.1,0.2,0.5,new THREE.MeshStandardMaterial({color:0x554a30,roughness:0.4,emissive:0xffb84d,emissiveIntensity:0.9}),0,7.35,li%2?-2.2:2.2,false);
});
/* gantry + toll + SA dressing */
var gantryTexts=['東京方面','名古屋方面','次の出口 1km'];
var gi=0, saSeen=0;
for(var i=0;i<list.length;i++){
var o=list[i];
if(o.type==='gantry'){
var gt=gantryTexts[gi%gantryTexts.length]; gi++;
addSign(o.group,9.5,1.45,gt,'#14532d','#ffffff',0.62,7.2,0,Math.PI/2);
addSign(o.group,9.5,1.45,gt,'#14532d','#ffffff',-0.62,7.2,0,-Math.PI/2);
}
else if(o.type==='toll'){
addSign(o.group,10,1.35,'ETC ・ 一般','#3a2a6e','#ffffff',3.65,6.2,0,Math.PI/2);
[-10,0,10].forEach(function(bz){
sBox(o.group,0.3,0.3,0.35,rMat('gatePost',0x37424a,0.6,0.3),4.4,0.6,bz+1.4,false);
sBox(o.group,4.4,0.24,0.24,rMat('armRed',0xd84a3a,0.5,0.2),2.3,1.2,bz+1.4,false);
sBox(o.group,1.5,0.26,0.26,rMat('vendWhite',0xe8e8e8,0.5,0.2),1.6,1.2,bz+1.4,false);
});
}
else if(o.type==='sa'&&saSeen<2){
saSeen++;
addSign(o.group,11,1.7,'サービスエリア','#1d4ed8','#ffffff',0,o.height-1.9,-o.d/2-0.16,Math.PI);
sBox(o.group,17,0.7,9.5,rMat('saCanopy',0xe8491d,0.5,0.2),0,5.7,-o.d/2-6.5,true);
[[-7,-o.d/2-10.5],[7,-o.d/2-10.5],[-7,-o.d/2-2.5],[7,-o.d/2-2.5]].forEach(function(pp){ sCyl(o.group,0.3,0.3,5.4,rMat('poleSteel',0xb9bec2,0.4,0.6),pp[0],2.7,pp[1],8); });
[-3.5,3.5].forEach(function(pp2){ sBox(o.group,1.1,1.9,0.8,rMat('vendWhite',0xe8e8e8,0.45,0.2),pp2,0.95,-o.d/2-6.5,false); });
}
else if(o.type==='pa'){
addSign(o.group,8.5,1.4,'パーキングエリア','#1d4ed8','#ffffff',0,o.height-1.7,-o.d/2-0.16,Math.PI);
}
}
/* SA parking bay lines + parked cars/trucks */
for(var pv=0;pv<7;pv++){ groundMark(-132+pv*3.4,31,0.28,9.5,0xe9e6d8,0.06); groundMark(90+pv*3.4,33,0.28,9.5,0xe9e6d8,0.06); }
[[-126,31],[92,33]].forEach(function(pp){
var c=makeCar(pp[0],pp[1],'x',1); c.moving=false; c.group.rotation.y=Math.PI/2; c.group.userData.parkRot=Math.PI/2;
});
/* blue roadside information signs */
[[-60,13.8,'出口 500m',Math.PI],[120,-13.8,'SA まで 2km',0]].forEach(function(rs){
var rg=new THREE.Group(); rg.position.set(rs[0],0,rs[1]); stageGroup.add(rg);
sCyl(rg,0.09,0.12,3.6,rMat('poleDark',0x3a4046,0.55,0.6),0,1.8,0,7);
addSign(rg,6.4,1.6,rs[2],'#1d4ed8','#ffffff',0,3.9,0,rs[3]);
});
}
/* ================= AIRPORT realism: terminal dressing, runway markings,
   PAPI + approach lights, windsock, ground service vehicles, fence ==== */
function enhanceAirportRealism(){
var list=destructibles.slice();
var glass=rMat('apGlass',0x2b3d4a,0.15,0.35);
for(var i=0;i<list.length;i++){
var o=list[i];
if(o.type==='terminal'){
addSign(o.group,36,3.6,'第1ターミナル','#17384a','#ffffff',0,14.3,-o.d/2-0.2,Math.PI);
addSign(o.group,36,3.6,'第1ターミナル','#17384a','#ffffff',0,14.3,o.d/2+0.2,0);
sBox(o.group,o.w-4,3.4,0.3,glass,0,2.3,-o.d/2-0.1,false);
sBox(o.group,o.w-4,3.4,0.3,glass,0,2.3,o.d/2+0.1,false);
sBox(o.group,o.w*0.72,0.5,6.5,rMat('apCanopy',0x9aa2a8,0.5,0.4),0,5.4,o.d/2+3.4,true); // departures canopy
[-o.w*0.3,-o.w*0.1,o.w*0.1,o.w*0.3].forEach(function(cx3){ sCyl(o.group,0.22,0.22,5.2,rMat('poleSteel',0xb9bec2,0.4,0.6),cx3,2.6,o.d/2+6.2,8); });
[-54,50].forEach(function(jx){ // two extra jet bridges
var jb=new THREE.Mesh(new THREE.BoxGeometry(2.2,2.6,7),rMat('apBridge',0x9aa2a8,0.5,0.4));
jb.position.set(jx,4.6,-14.2); jb.castShadow=true; o.group.add(jb);
var jh=new THREE.Mesh(new THREE.BoxGeometry(2.4,1.1,2.2),rMat('apBridge2',0x6e767c,0.5,0.4));
jh.position.set(jx,3.4,-17.4); o.group.add(jh);
});
var cols=['#2e6da8','#c23a1e','#2e8a5a','#e8b02e'];
for(var ci=0;ci<4;ci++) addSign(o.group,7,1.3,['出発 ロビー','到着 ロビー','国際線','国内線'][ci],'#f4efe0','#27313a',-27+ci*18,4.6,-o.d/2-0.25,Math.PI);
}
else if(o.type==='tower'){
var bc=new THREE.Mesh(new THREE.SphereGeometry(0.42,8,6),new THREE.MeshBasicMaterial({color:0xff3333}));
bc.position.y=o.height+8.6; o.group.add(bc);
addSign(o.group,6.2,1.4,'管制塔','#37424a','#f4efe0',0,20,-o.d/2-0.16,Math.PI);
}
else if(o.type==='hotel'){
addSign(o.group,13,1.9,'エアポートホテル','#17384a','#ffffff',0,o.height-2.2,-o.d/2-0.16,Math.PI);
}
else if(o.type==='parking'){
[3.6,6.8,10].forEach(function(by){ sBox(o.group,o.w+0.35,0.4,o.d+0.35,rMat('parkBand',0xe8e6da,0.7,0.1),0,by,0,false); });
addSign(o.group,8,1.8,'P 駐車場','#1d4ed8','#ffffff',0,o.height-1.6,-o.d/2-0.2,Math.PI);
}
else if(o.type==='cargo'){
addSign(o.group,9,1.6,'貨物ターミナル','#37424a','#f4efe0',0,o.height-1.8,o.d/2+0.16,0);
}
else if(o.type==='hangar'){
addSign(o.group,7,1.5,'整備格納庫','#37424a','#f4efe0',0,o.height-1.8,-o.d/2-0.16,Math.PI);
}
}
/* --- runway threshold piano keys + designator numbers --- */
for(var t=0;t<6;t++){ groundMark(-148,-39+t*3.4,8,1.5,0xf2eed8,0.08); groundMark(148,-39+t*3.4,8,1.5,0xf2eed8,0.08); }
(function(){
function numPlane(x,txt,rz){
var c=document.createElement('canvas'); c.width=c.height=256; var g=c.getContext('2d');
g.clearRect(0,0,256,256); g.fillStyle='rgba(245,240,220,0.95)'; g.font='900 150px "Hiragino Kaku Gothic ProN",sans-serif';
g.textAlign='center'; g.textBaseline='middle'; g.fillText(txt,128,138);
var tex=new THREE.CanvasTexture(c); tex.colorSpace=THREE.SRGBColorSpace;
var m=new THREE.Mesh(new THREE.PlaneGeometry(11,11),new THREE.MeshBasicMaterial({map:tex,transparent:true}));
m.rotation.x=-Math.PI/2; m.rotation.z=rz; m.position.set(x,0.09,-30); stageGroup.add(m);
}
numPlane(-136,'16',Math.PI/2); numPlane(136,'34',-Math.PI/2);
})();
/* PAPI lights beside both thresholds */
(function(){
var wg=new THREE.SphereGeometry(0.34,6,5);
var wm=new THREE.MeshBasicMaterial({color:0xffffff}), rm2=new THREE.MeshBasicMaterial({color:0xff2e22});
for(var p=0;p<4;p++){
var a=new THREE.Mesh(wg,p<2?wm:rm2); a.position.set(-134,-0+0.45,-13.6+p*1.5); stageGroup.add(a);
var b=new THREE.Mesh(wg,p<2?rm2:wm); b.position.set(134,0.45,-46.4+p*1.5); stageGroup.add(b);
}
})();
/* windsock */
(function(){
var wg2=new THREE.Group(); wg2.position.set(-100,0,-52); stageGroup.add(wg2);
sCyl(wg2,0.09,0.13,6.5,rMat('poleSteel',0xb9bec2,0.4,0.6),0,3.25,0,7);
var sock=new THREE.Mesh(new THREE.ConeGeometry(0.75,3.4,9),rMat('sockOrange',0xe8491d,0.6,0));
sock.rotation.z=Math.PI/2-0.18; sock.position.set(1.6,6.3,0); wg2.add(sock);
var stripe=new THREE.Mesh(new THREE.ConeGeometry(0.5,1.1,9),rMat('vendWhite',0xe8e8e8,0.6,0));
stripe.rotation.z=Math.PI/2-0.18; stripe.position.set(0.75,6.42,0); wg2.add(stripe);
})();
/* apron stand lead-in lines + stop bars for each parked airliner */
[[-46,44],[10,44],[62,42],[-70,-80]].forEach(function(ap){
groundMark(ap[0],ap[1]-11,0.4,15,0xd8b13a,0.065);
groundMark(ap[0],ap[1]-3,6.5,0.4,0xd8b13a,0.065);
});
/* --- ground service vehicles (baggage train, fuel truck, catering) --- */
function svcVehicle(x,z,rotY,kind){
var g=new THREE.Group(); g.position.set(x,0,z); g.rotation.y=rotY; stageGroup.add(g);
var dark=rMat('svcDark',0x22262a,0.8,0.2), white=rMat('svcWhite',0xf0f0ea,0.45,0.2);
sBox(g,2.3,0.5,1.4,dark,0,0.45,0,false);
if(kind==='baggage'){
sBox(g,2.2,1.1,1.35,white,0,1.25,0,true);
sBox(g,0.9,0.7,1.2,glass,0.85,1.5,0,false);
for(var ct=1;ct<=2;ct++){
var cx4=-2.6-ct*2.9;
sBox(g,2.5,0.4,1.5,dark,cx4,0.4,0,false);
sBox(g,2.4,1.0,1.45,rMat('cartSide',0x9aa2a8,0.55,0.3),cx4,1.1,0,false);
sBox(g,0.9,0.55,0.8,rMat('bag'+ct+'a',ct===1?0xc23a1e:0x2e6da8,0.6,0),cx4-0.5,1.85,0,false);
sBox(g,0.8,0.45,0.7,rMat('bag'+ct+'b',ct===1?0xe8b02e:0x3fae5a,0.6,0),cx4+0.55,1.8,0.1,false);
}
} else if(kind==='fuel'){
var tank=new THREE.Mesh(new THREE.CylinderGeometry(1.05,1.05,4.6,12),white);
tank.rotation.z=Math.PI/2; tank.position.set(-0.6,1.5,0); tank.castShadow=true; g.add(tank);
sBox(g,4.8,0.3,0.2,rMat('armRed',0xd84a3a,0.5,0.2),-0.6,1.5,1.08,false);
sBox(g,1.5,1.3,1.5,white,2.6,1.15,0,false);
sBox(g,1.3,0.7,1.35,glass,2.65,1.75,0,false);
} else {
sBox(g,5.2,2.9,2.1,white,-0.2,2.15,0,true);
sBox(g,5.3,0.5,2.15,rMat('svcStripe',0x2e6da8,0.5,0.2),-0.2,2.9,0,false);
sBox(g,1.4,1.2,1.6,white,3.1,1.1,0,false);
sBox(g,1.2,0.65,1.45,glass,3.15,1.65,0,false);
}
return g;
}
svcVehicle(-37,35,0.25,'baggage');
svcVehicle(19,35,-0.2,'fuel');
svcVehicle(54,51,Math.PI/2,'catering');
svcVehicle(-61,-71,0.8,'baggage');
svcVehicle(-52,-88,-0.5,'fuel');
/* perimeter fence around the airfield */
fenceRun(-158,-102,158,-102,2.0); fenceRun(158,-102,158,132,2.0); fenceRun(158,132,-158,132,2.0); fenceRun(-158,132,-158,-102,2.0);
}
/* ================= HYPER realism (city / military / highway / airport):
   second detail pass — rooftop clutter, entrances, wet puddles, worn
   surfaces, street / base / road / airfield furniture. Static dressing
   only: no new destructibles, no rule or layout changes. School is
   deliberately excluded from this pass. ============================ */
function enhanceHyperRealism(id){
var steel=rMat('hrSteel',0x8a929c,0.35,0.7);
var darkM=rMat('hrDark',0x2c3034,0.6,0.3);
if(!_rMats['hrPuddle'])_rMats['hrPuddle']=new THREE.MeshStandardMaterial({color:0x39434e,roughness:0.06,metalness:0.55,transparent:true,opacity:0.6});
var pudM=_rMats['hrPuddle'];
function puddle(x,z,w,d,y){ var m=new THREE.Mesh(new THREE.PlaneGeometry(w,d),pudM); m.rotation.x=-Math.PI/2; m.rotation.z=rand(0,3); m.position.set(x,y||0.085,z); stageGroup.add(m); }
function cone(x,z){ var c=new THREE.Mesh(new THREE.ConeGeometry(0.32,0.85,9),rMat('hrCone',0xe8491d,0.55,0.05)); c.position.set(x,0.43,z); stageGroup.add(c); sBox(stageGroup,0.55,0.07,0.55,rMat('hrCone',0xe8491d,0.55,0.05),x,0.04,z,false); }
/* street lamp: pole + arm + warm head, a glow sprite and a pool of light on
   the asphalt. Glow/pool use shared materials whose opacity the dusk
   system raises as the sun goes down, so the streets "switch on". */
if(!_lampGlowMat){ _lampGlowMat=new THREE.SpriteMaterial({map:texGlow,color:new THREE.Color(0xffbe78).multiplyScalar(2.2),transparent:true,opacity:0.4,blending:THREE.AdditiveBlending,depthWrite:false}); _lampPoolMat=new THREE.MeshBasicMaterial({map:texGlow,color:0xff9e4e,transparent:true,opacity:0.08,blending:THREE.AdditiveBlending,depthWrite:false}); }
function lamp(x,z,rotY){ var g=new THREE.Group(); g.position.set(x,0,z); g.rotation.y=rotY||0; stageGroup.add(g); sCyl(g,0.09,0.13,5.6,rMat('hrLamp',0x3c4247,0.5,0.6),0,2.8,0,7); sBox(g,1.7,0.09,0.09,rMat('hrLamp',0x3c4247,0.5,0.6),0.75,5.55,0,false); var head=new THREE.Mesh(new THREE.BoxGeometry(0.55,0.12,0.24),new THREE.MeshBasicMaterial({color:0xffd9a0})); head.position.set(1.45,5.48,0); g.add(head); var gl=new THREE.Sprite(_lampGlowMat); gl.scale.set(3.6,3.6,1); gl.position.set(1.45,5.42,0); g.add(gl); var pool=new THREE.Mesh(new THREE.PlaneGeometry(9,9),_lampPoolMat); pool.rotation.x=-Math.PI/2; pool.position.set(1.45,0.09,0); g.add(pool); }
function lampGrid(){ [-100,-56,56,100].forEach(function(lz){ lamp(-5.6,lz,0); lamp(5.6,lz,Math.PI); lamp(lz,-5.6,-Math.PI/2); lamp(lz,5.6,Math.PI/2); }); }
/* rooftop clutter (AC units, water tanks, antennae) on destructible
   buildings + entrance canopies for city offices */
var list=destructibles.slice();
for(var i=0;i<list.length;i++){
var o=list[i];
if(o.height&&o.height>=19&&!o.isCar&&o.type!=='radiotower'&&o.type!=='relay')addBeacon(o);
if(o.isCar||o.isTank||o.isPlane||!o.height||o.height<8)continue;
if(o.type==='hangar'||o.type==='watchtower'||o.type==='radiotower'||o.type==='relay')continue;
var n=1+Math.floor(rand(0,2.4));
for(var k=0;k<n;k++) sBox(o.group,rand(1.2,2.6),rand(0.7,1.3),rand(1.2,2.2),rMat('hrAC',0xb9bec2,0.5,0.5),rand(-0.3,0.3)*o.w,o.height+0.55,rand(-0.3,0.3)*o.d,false);
if(o.height>=13&&Math.random()<0.55) sCyl(o.group,1.05,1.05,1.6,rMat('hrTankW',0xd8d4c8,0.55,0.3),o.w*0.28,o.height+0.8,-o.d*0.25,10);
if(o.height>=17&&Math.random()<0.5) sBox(o.group,0.16,2.8,0.16,steel,o.w*0.32,o.height+1.4,o.d*0.3,false);
if(id==='city'&&(o.type==='office'||o.type==='tower')){
sBox(o.group,o.w*0.5,0.28,2.6,rMat('hrCanopy',0x37424a,0.5,0.4),0,3.1,o.d/2+1.2,false);
sBox(o.group,o.w*0.42,0.22,1.6,rMat('hrConc',0xa9a294,0.95,0),0,0.11,o.d/2+0.9,false);
}
}
if(id==='city'){
lampGrid();
for(var mi=0;mi<14;mi++){ var onV=Math.random()<0.5; var mx=onV?(Math.floor(rand(-3,3))*44)+rand(-2.5,2.5):rand(-130,130); var mz=onV?rand(-130,130):(Math.floor(rand(-3,3))*44)+rand(-2.5,2.5); groundMark(mx,mz,1.15,1.15,0x24262a,0.075); }
for(var pi=0;pi<11;pi++){ var pv=Math.random()<0.5; puddle(pv?(Math.floor(rand(-3,3))*44)+rand(-3,3):rand(-125,125),pv?rand(-125,125):(Math.floor(rand(-3,3))*44)+rand(-3,3),rand(3.5,8),rand(2.5,5)); }
[-1,1].forEach(function(sd){ for(var hx=-118;hx<=-58;hx+=7.5) sBox(stageGroup,6.8,0.85,0.8,rMat('hrHedge',0x2e5c2a,1,0),hx,0.43,sd*8.1,false); for(var hx2=58;hx2<=118;hx2+=7.5) sBox(stageGroup,0.8,0.85,6.8,rMat('hrHedge',0x2e5c2a,1,0),sd*8.1,0.43,hx2,false); });
makeGreenTree(stageGroup,-14,14,1.0); makeGreenTree(stageGroup,58,-14,0.95); makeGreenTree(stageGroup,-58,58,1.1); makeGreenTree(stageGroup,102,-58,0.9); makeGreenTree(stageGroup,-102,102,1.0);
(function(){ var pb=new THREE.Group(); pb.position.set(9.5,0,9.5); stageGroup.add(pb); sBox(pb,0.9,1.25,0.65,rMat('hrPost',0xc23a1e,0.5,0.15),0,0.63,0,true); sBox(pb,0.94,0.1,0.69,darkM,0,1.3,0,false); })();
[[-9.5,-9.5],[52.5,9.5],[-52.5,-9.5]].forEach(function(bp){ sCyl(stageGroup,0.34,0.3,0.95,rMat('hrBin',0x3a4a42,0.7,0.3),bp[0],0.48,bp[1],9); });
cone(64,20); cone(67.5,20); cone(64,26); cone(67.5,26);
sBox(stageGroup,4.6,1.05,0.35,rMat('hrBarrier',0xe8e6da,0.55,0.1),65.7,0.53,23,false);
sBox(stageGroup,4.6,0.3,0.37,rMat('hrCone',0xe8491d,0.55,0.05),65.7,0.75,23,false);
(function(){ var br=new THREE.Group(); br.position.set(-30,0,8.6); stageGroup.add(br); sBox(br,4.4,0.07,0.07,steel,0,0.55,0,false); for(var bi=0;bi<4;bi++){ var bk=new THREE.Group(); bk.position.set(-1.6+bi*1.05,0,0.25); bk.rotation.x=0.12; br.add(bk); sBox(bk,0.07,0.75,1.05,darkM,0,0.5,0,false); sBox(bk,0.07,0.07,1.15,steel,0,0.95,0,false); } })();
}
if(id==='military'){
function sandbags(x,z,rotY,len){ var g=new THREE.Group(); g.position.set(x,0,z); g.rotation.y=rotY; stageGroup.add(g); var sm=rMat('hrSand',0x9a8a68,1,0); for(var r2=0;r2<3;r2++)for(var s2=0;s2<len;s2++) sBox(g,0.95,0.34,0.52,sm,-(len-1)*0.5+s2*1.0+(r2%2)*0.3,0.18+r2*0.33,0,false); }
sandbags(-6,8.5,0,7); sandbags(7,8.5,0,7); sandbags(-14,-62,Math.PI/2,6);
function crates(x,z){ var g=new THREE.Group(); g.position.set(x,0,z); g.rotation.y=rand(0,3); stageGroup.add(g); var cm=rMat('hrCrate',0x5d6656,0.85,0.05); for(var ci2=0;ci2<5;ci2++) sBox(g,1.5,0.85,1.1,cm,(ci2%2)*1.6-0.8,0.43+Math.floor(ci2/3)*0.87,(ci2%3)*0.4-0.4,ci2===0); sBox(g,1.5,0.85,1.1,cm,0,1.3,0,false); }
crates(58,54); crates(-58,54); crates(96,30); crates(-100,-16);
function barrels(x,z){ var g=new THREE.Group(); g.position.set(x,0,z); stageGroup.add(g); [[0,0],[1.1,0.3],[0.4,1.1],[1.5,1.2]].forEach(function(bp,bi2){ sCyl(g,0.42,0.42,1.15,bi2%2?rMat('hrBarrelO',0x6d7a52,0.6,0.35):rMat('hrBarrelR',0x7a4a30,0.7,0.3),bp[0],0.58,bp[1],10); }); }
barrels(72,66); barrels(-76,66); barrels(40,-100); barrels(-44,-96);
(function(){ var g=new THREE.Group(); g.position.set(52,0,32); stageGroup.add(g); [[-4,-3],[4,-3],[-4,3],[4,3]].forEach(function(pp){ sCyl(g,0.09,0.09,3.4,steel,pp[0],1.7,pp[1],6); }); if(!_rMats['hrCamo'])_rMats['hrCamo']=new THREE.MeshStandardMaterial({color:0x55603e,roughness:1,transparent:true,opacity:0.82,side:THREE.DoubleSide}); var net=new THREE.Mesh(new THREE.PlaneGeometry(9.5,7.5),_rMats['hrCamo']); net.rotation.x=-Math.PI/2; net.position.y=3.45; g.add(net); })();
(function(){ var g=new THREE.Group(); g.position.set(-84,0,44); stageGroup.add(g); sCyl(g,0.14,0.3,17,steel,0,8.5,0,7); sBox(g,0.14,0.14,3.4,steel,0,15.8,0,false); sBox(g,0.14,0.14,2.2,steel,0,13.4,0,false); sagWire(g,0,16.8,0,-26,0.2,40,1.6); })();
for(var tm=0;tm<7;tm++){ groundMark(-120+tm*38,80.5,16,1.15,0x232326,0.06); groundMark(-102+tm*38,87.5,16,1.15,0x232326,0.06); }
puddle(-30,30,7,4.5,0.055); puddle(48,-20,6,4,0.055); puddle(-70,-44,5.5,3.6,0.055); puddle(20,96,6.5,4,0.055);
}
if(id==='highway'){
for(var sk=0;sk<9;sk++){ var sx=rand(-150,150), sl=(Math.random()<0.5?-1.8:1.8); groundMark(sx,sl-0.8,rand(9,20),0.45,0x1e1e21,0.08); groundMark(sx,sl+0.8,rand(9,20),0.45,0x1e1e21,0.08); }
for(var oi=0;oi<6;oi++) puddle(rand(-150,150),(Math.random()<0.5?-5.2:5.2),rand(3,6),rand(1.6,2.6),0.075);
for(var dp=-152;dp<=152;dp+=24){ [-10.4,10.4].forEach(function(dz){ sBox(stageGroup,0.14,0.95,0.14,rMat('hrDelin',0xe8e6da,0.6,0.1),dp,0.48,dz,false); sBox(stageGroup,0.15,0.18,0.05,rMat('hrRefl',0xd83a2a,0.4,0.2),dp,0.82,dz+(dz<0?0.09:-0.09),false); }); }
[[-76,11.8],[88,-11.8]].forEach(function(ep){ var g=new THREE.Group(); g.position.set(ep[0],0,ep[1]); stageGroup.add(g); sCyl(g,0.09,0.11,1.5,steel,0,0.75,0,7); sBox(g,0.55,0.8,0.35,rMat('hrPhone',0xe8821e,0.5,0.15),0,1.85,0,true); });
for(var rp2=0;rp2<10;rp2++){ groundMark(-140+rp2*30,9.6,1.1,0.32,0xd8d4c4,0.07); groundMark(-140+rp2*30,-9.6,1.1,0.32,0xd8d4c4,0.07); }
for(var wd=0;wd<14;wd++){ var wx=rand(-155,155), wz=(Math.random()<0.5?-12.1:12.1); var wc=new THREE.Mesh(new THREE.ConeGeometry(rand(0.3,0.5),rand(0.5,0.9),6),rMat('hrWeed',0x4a6d35,1,0)); wc.position.set(wx,0.3,wz); stageGroup.add(wc); }
}
if(id==='airport'){
for(var td=0;td<8;td++){ groundMark(-128+td*9,-33.5,10,1.5,0x1d1d20,0.085); groundMark(-128+td*9,-26.5,10,1.5,0x1d1d20,0.085); groundMark(128-td*9,-33.5,10,1.5,0x1d1d20,0.085); groundMark(128-td*9,-26.5,10,1.5,0x1d1d20,0.085); }
[[-60,-4.5,'A'],[24,-4.5,'B'],[96,-4.5,'C']].forEach(function(ts){ var g=new THREE.Group(); g.position.set(ts[0],0,ts[1]); stageGroup.add(g); sBox(g,1.7,0.85,0.18,darkM,0,0.75,0,false); addSign(g,1.55,0.72,ts[2],'#14161a','#ffd21e',0,0.75,0.1,0); sBox(g,0.12,0.35,0.12,steel,-0.6,0.18,0,false); sBox(g,0.12,0.35,0.12,steel,0.6,0.18,0,false); });
[[-46,44],[10,44],[62,42],[-70,-80],[118,28]].forEach(function(ap){ cone(ap[0]+13,ap[1]-6); cone(ap[0]+13,ap[1]+6); cone(ap[0]-14,ap[1]); var g=new THREE.Group(); g.position.set(ap[0]+6,0,ap[1]-8.5); g.rotation.y=rand(-0.3,0.3); stageGroup.add(g); sBox(g,2.2,0.9,1.3,rMat('hrGPU',0xe8b02e,0.5,0.2),0,0.65,0,true); sBox(g,2.3,0.25,1.35,darkM,0,1.2,0,false); var w1=sCyl(g,0.3,0.3,0.25,darkM,-0.8,0.3,0.68,8); w1.rotation.x=Math.PI/2; var w2=sCyl(g,0.3,0.3,0.25,darkM,0.8,0.3,0.68,8); w2.rotation.x=Math.PI/2; });
(function(){ var bm=rMat('hrBlast',0x707880,0.5,0.5); for(var bf=0;bf<6;bf++){ var p=sBox(stageGroup,7.6,2.3,0.18,bm,-96+bf*7.8,1.15,-97,false); p.rotation.y=0.12; } })();
(function(){ var lm=new THREE.MeshBasicMaterial({color:0xfff6d8}); [-1,1].forEach(function(sd){ for(var al=0;al<4;al++){ var b=new THREE.Mesh(new THREE.BoxGeometry(0.5,0.35,3.4),lm); b.position.set(sd*(160+al*9),0.5,-30); stageGroup.add(b); } }); })();
puddle(-20,52,8,5,0.06); puddle(40,58,6.5,4,0.06); puddle(-100,-66,7,4.5,0.06); puddle(90,20,5.5,3.6,0.06);
}
if(id==='office'){
lampGrid();
// wet patches + manholes on the business-district streets (sky-mirror
// puddles sell the glass towers above them)
for(var op=0;op<9;op++){ var ov=Math.random()<0.5; puddle(ov?(Math.floor(rand(-3,3))*44)+rand(-3,3):rand(-125,125),ov?rand(-125,125):(Math.floor(rand(-3,3))*44)+rand(-3,3),rand(3.5,8),rand(2.5,5)); }
for(var om=0;om<10;om++){ var omv=Math.random()<0.5; var omx=omv?(Math.floor(rand(-3,3))*44)+rand(-2.5,2.5):rand(-130,130); var omz=omv?rand(-130,130):(Math.floor(rand(-3,3))*44)+rand(-2.5,2.5); groundMark(omx,omz,1.15,1.15,0x24262a,0.075); }
}
if(id==='radio'){
// transmission-site ground wear: gravel stains, puddles, work cones
for(var rp3=0;rp3<8;rp3++){ groundMark(rand(-120,120),rand(-120,120),rand(3,7),rand(2.5,5),0x3a3f36,0.06); }
puddle(-58,44,6.5,4,0.055); puddle(30,66,5.5,3.6,0.055); puddle(72,-16,6,4,0.055); puddle(-16,-70,5,3.4,0.055);
cone(19.5,19.5); cone(23.5,19.5); cone(-19.5,-14); cone(60,44); cone(64,44);
for(var tr3=0;tr3<5;tr3++){ groundMark(-100+tr3*44,95.5,15,1.1,0x232326,0.06); }
}
}
/* ================= school stage: 小学校 =================
   A recognisably Japanese elementary school, laid out like a real campus:
   long 4-storey classroom block (north) -> dirt schoolyard with a running
   track -> gym (east), 25m pool (NE), annex + covered walkway (west),
   playground (SW), bike shed, main gate + perimeter fence (south). */
var schoolTexCache={};
function schoolCanvasTex(key,w,h,draw){
if(schoolTexCache[key])return schoolTexCache[key];
var c=document.createElement('canvas'); c.width=w; c.height=h; var g=c.getContext('2d');
draw(g,w,h);
var t=new THREE.CanvasTexture(c); t.colorSpace=THREE.SRGBColorSpace; t.wrapS=t.wrapT=THREE.RepeatWrapping; t.anisotropy=4;
schoolTexCache[key]=t; return t;
}
function schoolClassroomTex(){ // classroom side: 6 bays x 4 floors of big windows
return schoolCanvasTex('schClass',512,256,function(g){
g.fillStyle='#e9e2d2'; g.fillRect(0,0,512,256);
for(var n=0;n<1600;n++){ g.fillStyle='rgba(90,80,60,'+(Math.random()*0.05).toFixed(3)+')'; g.fillRect(Math.random()*512,Math.random()*256,2,2);}
for(var f=0;f<4;f++){
var y0=f*64;
g.fillStyle='#cfc6b2'; g.fillRect(0,y0+58,512,6); // floor slab line
for(var b2=0;b2<6;b2++){
var x0=b2*85+7;
// big classroom window: pale blue glass, white frame, some curtains / open sashes
var grd=g.createLinearGradient(x0,y0+8,x0,y0+54); grd.addColorStop(0,'#cfe6f2'); grd.addColorStop(0.55,'#8fbcd6'); grd.addColorStop(1,'#6d9dbd');
g.fillStyle=grd; g.fillRect(x0,y0+8,72,46);
g.strokeStyle='#f4f1e8'; g.lineWidth=3; g.strokeRect(x0,y0+8,72,46);
g.beginPath(); g.moveTo(x0+24,y0+8); g.lineTo(x0+24,y0+54); g.moveTo(x0+48,y0+8); g.lineTo(x0+48,y0+54); g.moveTo(x0,y0+31); g.lineTo(x0+72,y0+31); g.stroke();
if((b2+f)%3===0){ g.fillStyle='rgba(250,248,238,0.75)'; g.fillRect(x0+2,y0+10,22,42);} // curtain
if((b2*2+f)%5===0){ g.fillStyle='rgba(40,60,75,0.55)'; g.fillRect(x0+49,y0+10,21,20);} // open dark sash
}
}
});
}
function schoolCorridorTex(){ // corridor side: small high windows only
return schoolCanvasTex('schCorr',512,256,function(g){
g.fillStyle='#e3dbc8'; g.fillRect(0,0,512,256);
for(var n=0;n<1400;n++){ g.fillStyle='rgba(90,80,60,'+(Math.random()*0.05).toFixed(3)+')'; g.fillRect(Math.random()*512,Math.random()*256,2,2);}
for(var f=0;f<4;f++){
var y0=f*64;
g.fillStyle='#c6bca6'; g.fillRect(0,y0+58,512,6);
for(var b2=0;b2<8;b2++){
var x0=b2*64+8;
var grd=g.createLinearGradient(x0,y0+6,x0,y0+26); grd.addColorStop(0,'#bcd8e8'); grd.addColorStop(1,'#7ba7c2');
g.fillStyle=grd; g.fillRect(x0,y0+6,48,20);
g.strokeStyle='#efece2'; g.lineWidth=2.5; g.strokeRect(x0,y0+6,48,20);
g.beginPath(); g.moveTo(x0+24,y0+6); g.lineTo(x0+24,y0+26); g.stroke();
}
}
});
}
function schoolPlateTex(key,text,bg,fg,px){
return schoolCanvasTex(key,512,128,function(g){
g.fillStyle=bg; g.fillRect(0,0,512,128);
g.strokeStyle=fg; g.lineWidth=5; g.strokeRect(9,9,494,110);
g.fillStyle=fg; g.font='900 '+(px||64)+'px "Hiragino Kaku Gothic ProN","Hiragino Sans","Noto Sans JP",sans-serif';
g.textAlign='center'; g.textBaseline='middle'; g.fillText(text,256,68);
});
}
function schoolClockTex(){
return schoolCanvasTex('schClock',128,128,function(g){
g.fillStyle='#fdfdf8'; g.beginPath(); g.arc(64,64,60,0,Math.PI*2); g.fill();
g.strokeStyle='#2b2f33'; g.lineWidth=6; g.beginPath(); g.arc(64,64,58,0,Math.PI*2); g.stroke();
g.fillStyle='#2b2f33';
for(var i=0;i<12;i++){ var a=i/12*Math.PI*2; g.save(); g.translate(64+Math.cos(a)*48,64+Math.sin(a)*48); g.rotate(a); g.fillRect(-2,-5,4,10); g.restore();}
function hand(a,len,wd){ g.strokeStyle='#1d2126'; g.lineWidth=wd; g.beginPath(); g.moveTo(64,64); g.lineTo(64+Math.cos(a)*len,64+Math.sin(a)*len); g.stroke();}
hand(-Math.PI/2+0.55,30,7); hand(-Math.PI/2+2.6,44,5); // about 8:05 — morning assembly time
g.fillStyle='#c23a1e'; g.beginPath(); g.arc(64,64,5,0,Math.PI*2); g.fill();
});
}
function schoolGetabakoTex(){ // shoe-locker grid seen at the entrance porch
return schoolCanvasTex('schGeta',256,128,function(g){
g.fillStyle='#8a6a48'; g.fillRect(0,0,256,128);
for(var r=0;r<4;r++)for(var col=0;col<8;col++){
g.fillStyle='#5d4530'; g.fillRect(col*32+3,r*32+3,26,26);
g.fillStyle=['#d84a3a','#3a6fd8','#e8e8e8','#3fae5a','#e8b02e'][((r*8+col)%5)]; g.fillRect(col*32+7,r*32+16,18,9); // shoes
}
});
}
function schoolYardTex(){ // dirt yard: running-track oval + soccer lines, reads instantly from the air
return schoolCanvasTex('schYard',1024,724,function(g){
g.fillStyle='#c8b088'; g.fillRect(0,0,1024,724);
for(var n=0;n<9000;n++){ var v=Math.random(); g.fillStyle=v<0.5?'rgba(120,95,55,0.10)':'rgba(240,228,195,0.10)'; g.fillRect(Math.random()*1024,Math.random()*724,3,2);}
for(var p=0;p<7;p++){ g.fillStyle='rgba(110,88,50,0.07)'; g.beginPath(); g.ellipse(Math.random()*1024,Math.random()*724,60+Math.random()*90,30+Math.random()*50,Math.random()*3,0,Math.PI*2); g.fill();}
g.strokeStyle='rgba(252,250,242,0.92)'; g.lineWidth=5;
for(var lane=0;lane<3;lane++){ g.beginPath(); g.ellipse(512,362,452-lane*30,300-lane*30,0,0,Math.PI*2); g.stroke();}
// soccer pitch inside the track
g.lineWidth=4.5; g.strokeStyle='rgba(252,250,242,0.85)';
g.strokeRect(262,172,500,380);
g.beginPath(); g.moveTo(512,172); g.lineTo(512,552); g.stroke();
g.beginPath(); g.arc(512,362,62,0,Math.PI*2); g.stroke();
g.strokeRect(262,272,80,180); g.strokeRect(682,272,80,180);
g.strokeRect(262,322,30,80); g.strokeRect(732,322,30,80);
});
}
function schoolFlagTex(){
return schoolCanvasTex('schFlag',128,84,function(g){
g.fillStyle='#fbfbf6'; g.fillRect(0,0,128,84);
g.fillStyle='#c8102e'; g.beginPath(); g.arc(64,42,15,0,Math.PI*2); g.fill();
});
}
function sBox(grp,w,h,d,mat,x,y,z,cast){
var m=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),mat);
m.position.set(x,y,z); if(cast)m.castShadow=true; m.receiveShadow=true; grp.add(m); return m;
}
function sCyl(grp,rt,rb,h,mat,x,y,z,seg){
var m=new THREE.Mesh(new THREE.CylinderGeometry(rt,rb,h,seg||8),mat);
m.position.set(x,y,z); m.castShadow=true; grp.add(m); return m;
}
function schoolFaceMats(longTex,corrTex,endTex,roofMat,longIsZ){
var lt=longTex.clone(); lt.needsUpdate=true;
var ct=corrTex.clone(); ct.needsUpdate=true;
var et=endTex.clone(); et.needsUpdate=true; et.repeat.set(1,2);
var lm=new THREE.MeshStandardMaterial({map:lt,roughness:0.75});
var cm=new THREE.MeshStandardMaterial({map:ct,roughness:0.78});
var em=new THREE.MeshStandardMaterial({map:et,roughness:0.78});
if(longIsZ) return {mats:[lm,cm,roofMat,roofMat,em,em],face:lm}; // long faces face ±x
return {mats:[em,em,roofMat,roofMat,lm,cm],face:lm}; // +z classroom side, -z corridor side
}
var swayTrees=[];
function makeSakura(parent,x,z,s){
var t=new THREE.Group(); t.position.set(x,0,z); t.scale.setScalar(s||1);
var tr=new THREE.Mesh(new THREE.CylinderGeometry(0.22,0.38,2.6,7),new THREE.MeshStandardMaterial({color:0x4c3826,roughness:1}));
tr.position.y=1.3; tr.castShadow=true; t.add(tr);
var pink=new THREE.MeshStandardMaterial({color:0xf2b7c8,roughness:1,flatShading:true});
var pink2=new THREE.MeshStandardMaterial({color:0xe99fb6,roughness:1,flatShading:true});
var c1=new THREE.Mesh(new THREE.SphereGeometry(2.5,9,7),pink); c1.position.y=4.1; c1.scale.y=0.78; c1.castShadow=true; t.add(c1);
var c2=new THREE.Mesh(new THREE.SphereGeometry(1.8,8,6),pink2); c2.position.set(1.3,4.9,0.6); t.add(c2);
var c3=new THREE.Mesh(new THREE.SphereGeometry(1.5,8,6),pink); c3.position.set(-1.4,4.7,-0.5); t.add(c3);
swayTrees.push({g:t,ph:Math.random()*6.28,am:0.013+Math.random()*0.011});
parent.add(t); return t;
}
function makeGreenTree(parent,x,z,s){
var t=new THREE.Group(); t.position.set(x,0,z); t.scale.setScalar(s||1);
var tr=new THREE.Mesh(new THREE.CylinderGeometry(0.24,0.4,2.8,7),new THREE.MeshStandardMaterial({color:0x5d4128,roughness:1}));
tr.position.y=1.4; tr.castShadow=true; t.add(tr);
var lm=new THREE.MeshStandardMaterial({color:0x3d7031,roughness:1,flatShading:true});
var c1=new THREE.Mesh(new THREE.SphereGeometry(2.7,9,7),lm); c1.position.y=4.6; c1.scale.y=0.85; c1.castShadow=true; t.add(c1);
var c2=new THREE.Mesh(new THREE.SphereGeometry(1.8,8,6),lm); c2.position.set(1.1,5.6,0.4); t.add(c2);
swayTrees.push({g:t,ph:Math.random()*6.28,am:0.013+Math.random()*0.011});
parent.add(t); return t;
}
/* ================= SCHOOL realism: school route, crosswalk, guardrails,
   utility poles + wires, flower beds, yard floodlights, sakura petals === */
function enhanceSchoolRealism(){
var white=rMat('schWhite',0xeef0ee,0.5,0.3);
var railM=rMat('schGuard',0xd8dcda,0.35,0.55);
/* --- crosswalk in front of the main gate (front road, z=79) --- */
for(var cz=74.6;cz<=83.6;cz+=1.65) groundMark(0,cz,4.6,0.85,0xf2eed8,0.075);
groundMark(-4.6,79,0.55,7.5,0xf2eed8,0.075); // stop line
groundMark(13.5,79,0.55,7.5,0xf2eed8,0.075);
/* green school-zone strip + road text on the approach lane */
groundMark(24,82.6,30,2.9,0x2e8a5a,0.062);
groundMark(-27,76.2,30,2.9,0x2e8a5a,0.062);
(function(){
function roadText(x,z,txt,rz){
var c=document.createElement('canvas'); c.width=512; c.height=96; var g=c.getContext('2d');
g.clearRect(0,0,512,96); g.fillStyle='rgba(250,250,246,0.92)'; g.font='900 62px "Hiragino Kaku Gothic ProN","Hiragino Sans",sans-serif';
g.textAlign='center'; g.textBaseline='middle'; g.fillText(txt,256,52);
var tex=new THREE.CanvasTexture(c); tex.colorSpace=THREE.SRGBColorSpace;
var m=new THREE.Mesh(new THREE.PlaneGeometry(15,2.8),new THREE.MeshBasicMaterial({map:tex,transparent:true}));
m.rotation.x=-Math.PI/2; m.rotation.z=rz; m.position.set(x,0.085,z); stageGroup.add(m);
}
roadText(24,82.6,'スクールゾーン',0);
roadText(-27,76.2,'スクールゾーン',Math.PI);
})();
/* --- white guardrails along the front sidewalk, both sides of the gate --- */
[-1,1].forEach(function(sd){
for(var gx=sd*10;Math.abs(gx)<=42;gx+=sd*4){
sBox(stageGroup,0.16,0.75,0.16,railM,gx,0.38,71.6,false);
}
sBox(stageGroup,32,0.14,0.14,railM,sd*26,0.72,71.6,false);
sBox(stageGroup,32,0.12,0.12,railM,sd*26,0.42,71.6,false);
});
/* --- 通学路 signs flanking the gate --- */
[[-9.5,0],[9.5,Math.PI]].forEach(function(sp){
var sg=new THREE.Group(); sg.position.set(sp[0],0,71.2); sg.rotation.y=sp[1]; stageGroup.add(sg);
sCyl(sg,0.07,0.09,3.2,rMat('poleSteel',0xb9bec2,0.4,0.6),0,1.6,0,7);
addSign(sg,2.6,1.05,'通学路','#e8b02e','#27313a',0,3.35,0.08,0);
sBox(sg,0.5,0.5,0.06,rMat('schWhite',0xeef0ee,0.5,0.3),0,2.45,0.05,false);
});
/* --- utility poles + sagging wires along the front road --- */
(function(){
var poleM=rMat('poleWood',0x4c3d2c,0.95,0);
var crossM=rMat('poleCross',0x3a3f44,0.6,0.4);
var pxs=[-72,-34,44,84];
pxs.forEach(function(px){
var pg=new THREE.Group(); pg.position.set(px,0,71.9); stageGroup.add(pg);
sCyl(pg,0.17,0.24,9.2,poleM,0,4.6,0,7);
sBox(pg,0.18,0.18,2.8,crossM,0,8.5,0,false);
sBox(pg,0.55,0.75,0.55,crossM,0.4,7.3,0,false);
});
for(var wi=0;wi<pxs.length-1;wi++){
sagWire(stageGroup,pxs[wi],8.5,71.9,pxs[wi+1],8.5,71.9,1.2);
sagWire(stageGroup,pxs[wi],8.05,71.9,pxs[wi+1],8.05,71.9,1.45);
}
})();
/* --- flower beds along the entrance approach --- */
(function(){
var soil=rMat('flowerSoil',0x4c3a28,1,0);
var cols=[0xe86a8a,0xe8b02e,0xd84a3a,0xf2f2f2,0xe87ab0];
[-5.6,5.6].forEach(function(fx){
for(var fz=26;fz<=58;fz+=11){
sBox(stageGroup,1.7,0.42,8.6,soil,fx,0.21,fz,true);
for(var fl=0;fl<7;fl++){
var fm=new THREE.Mesh(new THREE.SphereGeometry(0.21,6,5),rMat('flower'+((fl+fz)%5),cols[(fl+fz)%5],0.7,0));
fm.position.set(fx+rand(-0.55,0.55),0.55,fz+rand(-3.8,3.8)); fm.scale.y=0.75; stageGroup.add(fm);
sBox(stageGroup,0.07,0.3,0.07,rMat('flowerStem',0x3d7031,1,0),fm.position.x,0.4,fm.position.z,false);
}
}
});
})();
/* --- schoolyard floodlight poles --- */
[[-46,-12],[38,40]].forEach(function(lp){
var lg=new THREE.Group(); lg.position.set(lp[0],0,lp[1]); stageGroup.add(lg);
sCyl(lg,0.14,0.2,7.6,rMat('poleDark',0x3a4046,0.55,0.6),0,3.8,0,7);
sBox(lg,2.2,0.5,0.4,new THREE.MeshStandardMaterial({color:0x554a30,roughness:0.4,emissive:0xffb84d,emissiveIntensity:0.7}),0,7.6,0,false);
[-0.7,0.7].forEach(function(hx){ sBox(lg,0.55,0.3,0.3,rMat('schWhite',0xeef0ee,0.5,0.3),hx,7.55,0.25,false); });
});
/* --- half-buried tyre playground row near the jungle gym --- */
(function(){
var tyreM=rMat('tyre',0x22242a,0.95,0);
var paint=[0xd84a3a,0x2e6da8,0xe8b02e,0x3fae5a,0xe8e8e8];
for(var ti=0;ti<5;ti++){
var ty=new THREE.Mesh(new THREE.TorusGeometry(0.62,0.2,7,14),rMat('tyrePaint'+ti,paint[ti],0.7,0));
ty.position.set(-86+ti*3.1,0.28,16+(ti%2)*1.4); ty.rotation.y=0.3*ti; stageGroup.add(ty);
}
})();
/* --- notice board just inside the gate --- */
(function(){
var nb=new THREE.Group(); nb.position.set(10.5,0,64); nb.rotation.y=-0.35; stageGroup.add(nb);
sBox(nb,0.14,1.7,0.14,rMat('poleWood',0x4c3d2c,0.95,0),-1.5,0.85,0,false);
sBox(nb,0.14,1.7,0.14,rMat('poleWood',0x4c3d2c,0.95,0),1.5,0.85,0,false);
sBox(nb,3.6,1.5,0.12,rMat('boardWood',0x8a6a48,0.85,0),0,1.55,0,true);
sBox(nb,3.8,0.16,0.5,rMat('boardRoof',0x5d4a34,0.85,0),0,2.42,0,false);
var paper=rMat('boardPaper',0xf6f3e8,0.9,0);
sBox(nb,1.0,0.75,0.04,paper,-0.85,1.6,0.09,false);
sBox(nb,0.8,0.6,0.04,paper,0.75,1.55,0.09,false);
addSign(nb,2.2,0.5,'お知らせ','#f4efe0','#27313a',0,2.05,0.09,0);
})();
/* --- fallen sakura petals under the front row + by the gate --- */
(function(){
var petalM=new THREE.MeshBasicMaterial({color:0xf4c3d2,transparent:true,opacity:0.8,side:THREE.DoubleSide});
var petalG=new THREE.PlaneGeometry(1.5,1.1);
for(var pi=0;pi<16;pi++){
var pm=new THREE.Mesh(petalG,petalM);
pm.rotation.x=-Math.PI/2; pm.rotation.z=rand(0,3);
pm.position.set(rand(-86,86),0.06,rand(57,67));
if(Math.abs(pm.position.x)<8)pm.position.x+=12;
pm.scale.setScalar(rand(0.8,1.9));
stageGroup.add(pm);
}
})();
}
function buildSchoolStage(){
cityBase.material.color.setHex(0x9aa87e);
var concM=new THREE.MeshStandardMaterial({color:0xb9b4a4,roughness:0.9});
var stoneM=new THREE.MeshStandardMaterial({color:0x9aa0a2,roughness:0.85});
var darkGlassM=new THREE.MeshStandardMaterial({color:0x2c404e,roughness:0.18,metalness:0.35});
var roofMat=new THREE.MeshStandardMaterial({color:0x77726a,roughness:0.95});
var whiteMetalM=new THREE.MeshStandardMaterial({color:0xeef0ee,roughness:0.4,metalness:0.45});
/* ---------- grounds & roads ---------- */
addStaticPlane(0,79,320,11,0x3a3a3e,0.05); // front road (south)
addStaticPlane(0,72.8,320,2.6,0xbdbcb4,0.055); // sidewalk
var yardTex=schoolYardTex();
var yard=new THREE.Mesh(new THREE.PlaneGeometry(94,66),new THREE.MeshStandardMaterial({map:yardTex,roughness:1}));
yard.rotation.x=-Math.PI/2; yard.position.set(-4,0.045,14); yard.receiveShadow=true; stageGroup.add(yard);
addStaticPlane(0,18,7,100,0xcfc8b4,0.06); // entrance approach: gate -> schoolyard -> entrance
addStaticPlane(-66,56,30,13,0x4a4a4e,0.04); // staff car park (SW)
addStaticPlane(30,57,20,10,0xd8d2c0,0.04); // bike-shed apron (SE of yard)
/* ---------- perimeter fence / wall ---------- */
(function(){
var fenceG=new THREE.Group(); stageGroup.add(fenceG);
var railM=new THREE.MeshStandardMaterial({color:0x5f7263,roughness:0.55,metalness:0.5});
function run(x1,z1,x2,z2){
var len=Math.sqrt((x2-x1)*(x2-x1)+(z2-z1)*(z2-z1));
var cx=(x1+x2)/2, cz=(z1+z2)/2, ang=Math.atan2(z2-z1,x2-x1);
var wall=sBox(fenceG,len,1.05,0.42,concM,cx,0.52,cz,true); wall.rotation.y=-ang;
var rail=sBox(fenceG,len,0.09,0.09,railM,cx,1.62,cz,false); rail.rotation.y=-ang;
var rail2=sBox(fenceG,len,0.07,0.07,railM,cx,1.28,cz,false); rail2.rotation.y=-ang;
var np=Math.max(2,Math.round(len/19));
for(var i=0;i<=np;i++){ var px=x1+(x2-x1)*i/np, pz=z1+(z2-z1)*i/np; sBox(fenceG,0.22,1.7,0.22,railM,px,0.85,pz,false);}
}
run(-95,-70,95,-70); run(95,-70,95,70); run(-95,-70,-95,70);
run(-95,70,-7.5,70); run(7.5,70,95,70); // gap at the main gate
})();
/* ---------- main gate (destructible) ---------- */
(function(){
var grp=new THREE.Group(); grp.position.set(0,0,70);
var p1=sBox(grp,1.5,4.8,1.5,stoneM,-6,2.4,0,true);
sBox(grp,1.5,4.8,1.5,stoneM,6,2.4,0,true);
sBox(grp,1.9,0.55,1.9,stoneM,-6,5.05,0,false); sBox(grp,1.9,0.55,1.9,stoneM,6,5.05,0,false);
var beam=sBox(grp,13.6,1.15,0.7,new THREE.MeshStandardMaterial({color:0x37424a,roughness:0.6}),0,5.6,0,true);
var plate=new THREE.Mesh(new THREE.PlaneGeometry(9.6,2.4),new THREE.MeshBasicMaterial({map:schoolPlateTex('schGateName','小学校','#f4efe0','#27313a',72)}));
plate.position.set(0,5.6,0.37); grp.add(plate);
var plate2=plate.clone(); plate2.rotation.y=Math.PI; plate2.position.z=-0.37; grp.add(plate2);
// low sliding gate leaves, half open
var leafM=new THREE.MeshStandardMaterial({color:0x707880,roughness:0.45,metalness:0.6});
sBox(grp,4.6,1.5,0.12,leafM,-3.4,0.95,0.5,false); sBox(grp,4.6,1.5,0.12,leafM,4.8,0.95,-0.5,false);
var o=registerCustom(grp,beam,13.6,2,6.2,'gate',7000000,900,40,null);
o.mat=null;
})();
/* ---------- MAIN SCHOOL BUILDING ---------- */
(function(){
var W=84,H=13,D=14;
var grp=new THREE.Group(); grp.position.set(0,0,-38);
var fm=schoolFaceMats(schoolClassroomTex(),schoolCorridorTex(),texWhite,roofMat,false);
fm.mats[4].map.repeat.set(3,1);
var main=new THREE.Mesh(new THREE.BoxGeometry(W,H,D),fm.mats);
main.position.y=H/2; main.castShadow=true; main.receiveShadow=true; grp.add(main);
sBox(grp,W+1.2,0.7,D+1.2,new THREE.MeshStandardMaterial({color:0x8d867a,roughness:0.95}),0,0.35,0,false); // plinth
sBox(grp,W+1.6,0.55,D+1.6,roofMat,0,H+0.24,0,true); // roof slab
// stairwell towers at both ends (taller, vertical window strip)
[-33,33].forEach(function(tx){
sBox(grp,7.5,H+1.4,D+1.2,new THREE.MeshStandardMaterial({map:texWhite,roughness:0.8}),tx,(H+1.4)/2,0,true);
sBox(grp,1.3,H-2.5,0.14,darkGlassM,tx,(H)/2,D/2+0.68,false);
sBox(grp,1.3,H-2.5,0.14,darkGlassM,tx,(H)/2,-D/2-0.68,false);
});
// rooftop: fence rails + posts, stair penthouse, water tank
var railM2=new THREE.MeshStandardMaterial({color:0xb9bec2,roughness:0.4,metalness:0.6});
[6.6,-6.6].forEach(function(rz){
sBox(grp,W-1,0.07,0.07,railM2,0,H+1.45,rz,false); sBox(grp,W-1,0.07,0.07,railM2,0,H+0.95,rz,false);
for(var px=-40;px<=40;px+=10)sBox(grp,0.09,1.5,0.09,railM2,px,H+0.75,rz,false);
});
[41,-41].forEach(function(rx){
sBox(grp,0.07,0.07,12.4,railM2,rx,H+1.45,0,false); sBox(grp,0.07,0.07,12.4,railM2,rx,H+0.95,0,false);
});
sBox(grp,8,2.5,6.5,new THREE.MeshStandardMaterial({color:0xd8d2c0,roughness:0.8}),12,H+1.8,0,true); // roof penthouse
sCyl(grp,1.7,1.7,2.4,new THREE.MeshStandardMaterial({color:0xa8a294,roughness:0.6,metalness:0.3}),-16,H+1.7,-2,12); // water tank
// wall clock + school-name board on the classroom face, above the entrance
var clock=new THREE.Mesh(new THREE.CircleGeometry(1.7,24),new THREE.MeshBasicMaterial({map:schoolClockTex()}));
clock.position.set(0,9.9,D/2+0.1); grp.add(clock);
var rim=new THREE.Mesh(new THREE.TorusGeometry(1.72,0.09,8,28),new THREE.MeshStandardMaterial({color:0x2b2f33,roughness:0.5}));
rim.position.set(0,9.9,D/2+0.08); grp.add(rim);
var board=new THREE.Mesh(new THREE.PlaneGeometry(15,2.1),new THREE.MeshBasicMaterial({map:schoolPlateTex('schBldgName','小学校','#2e4a3a','#f4efe0',76)}));
board.position.set(0,12.1,D/2+0.1); grp.add(board);
// entrance porch （昇降口）: canopy on pillars, glass doors, shoe lockers, steps
sBox(grp,14,0.4,4.6,new THREE.MeshStandardMaterial({color:0x5a6068,roughness:0.55,metalness:0.3}),0,3.45,D/2+2.1,true);
[-6.4,6.4].forEach(function(cx2){ sCyl(grp,0.16,0.16,3.3,whiteMetalM,cx2,1.65,D/2+3.9,8);});
sBox(grp,5.2,2.9,0.16,darkGlassM,0,1.45,D/2+0.09,false); // doors
sBox(grp,0.14,2.9,0.2,whiteMetalM,0,1.45,D/2+0.12,false);
var getaM=new THREE.MeshStandardMaterial({map:schoolGetabakoTex(),roughness:0.85});
[-4.9,4.9].forEach(function(gx){
var gb=sBox(grp,3.6,2.3,0.55,getaM,gx,1.15,D/2+0.35,false);
});
var signE=new THREE.Mesh(new THREE.PlaneGeometry(3.6,0.9),new THREE.MeshBasicMaterial({map:schoolPlateTex('schEnt','昇降口','#f4efe0','#27313a',72)}));
signE.position.set(0,3.05,D/2+0.12); grp.add(signE);
sBox(grp,9,0.28,2.0,concM,0,0.14,D/2+1.2,false); // entrance steps
var o=registerCustom(grp,main,W,D,14.5,'school',85000000,5600,175,null);
o.mat=fm.face; o.baseTint=0xffffff;
})();
/* ---------- ANNEX （特別教室棟） + covered walkway ---------- */
(function(){
var W=14,H=10,D=40;
var grp=new THREE.Group(); grp.position.set(-67,0,-28);
var fm=schoolFaceMats(schoolClassroomTex(),schoolCorridorTex(),texWhite,roofMat,true);
fm.mats[0].map.repeat.set(2,1); fm.mats[1].map.repeat.set(2,1);
var main=new THREE.Mesh(new THREE.BoxGeometry(W,H,D),fm.mats);
main.position.y=H/2; main.castShadow=true; main.receiveShadow=true; grp.add(main);
sBox(grp,W+1.4,0.5,D+1.4,roofMat,0,H+0.22,0,true);
sBox(grp,5,2.2,4.5,new THREE.MeshStandardMaterial({color:0xd8d2c0,roughness:0.8}),-2,H+1.3,-8,true); // roof penthouse
// small entrance canopy on the yard side
sBox(grp,0.35,0.3,6,new THREE.MeshStandardMaterial({color:0x5a6068,roughness:0.55,metalness:0.3}),W/2+1.4,3.1,10,false);
sBox(grp,0.16,2.7,3.4,darkGlassM,W/2+0.09,1.35,10,false);
// covered walkway （渡り廊下） east to the main building's west end
var wk=new THREE.Group(); wk.position.set(W/2+8.5,0,-10); grp.add(wk);
sBox(wk,17.5,0.25,3.6,new THREE.MeshStandardMaterial({color:0xcfc8b4,roughness:0.95}),0,0.13,0,false);
sBox(wk,17.5,0.3,3.8,new THREE.MeshStandardMaterial({color:0x6a7076,roughness:0.6,metalness:0.3}),0,3.15,0,true);
[-7.5,-2.5,2.5,7.5].forEach(function(wx){ [-1.6,1.6].forEach(function(wz){ sCyl(wk,0.11,0.11,3.0,whiteMetalM,wx,1.5,wz,6);});});
sBox(wk,17.5,0.9,0.08,new THREE.MeshStandardMaterial({color:0x9fc4d4,roughness:0.2,metalness:0.2,transparent:true,opacity:0.55}),0,2.2,-1.75,false); // glass side panels
sBox(wk,17.5,0.9,0.08,new THREE.MeshStandardMaterial({color:0x9fc4d4,roughness:0.2,metalness:0.2,transparent:true,opacity:0.55}),0,2.2,1.75,false);
var o=registerCustom(grp,main,W,D,H,'school-annex',42000000,3200,115,null);
o.mat=fm.face; o.baseTint=0xffffff;
})();
/* ---------- GYMNASIUM （体育館） ---------- */
(function(){
var grp=new THREE.Group(); grp.position.set(68,0,20);
var wallM=new THREE.MeshStandardMaterial({color:0xe6dfca,roughness:0.8});
var walls=sBox(grp,23,8,35,wallM,0,4,0,true);
sBox(grp,24,0.6,36,new THREE.MeshStandardMaterial({color:0x8d867a,roughness:0.95}),0,0.3,0,false);
// steep gable roof — clearly not a classroom block
var gymRoofM=new THREE.MeshStandardMaterial({color:0x44586a,roughness:0.5,metalness:0.35});
var slopeLen=Math.sqrt(11.5*11.5+4.2*4.2), slopeAng=Math.atan2(4.2,11.5);
[-1,1].forEach(function(sd){
var panel=sBox(grp,slopeLen,0.35,36.8,gymRoofM,sd*5.75,10.1,0,true);
panel.rotation.z=-sd*slopeAng;
});
sBox(grp,0.5,0.4,36.8,new THREE.MeshStandardMaterial({color:0x37424a,roughness:0.6}),0,12.25,0,false); // ridge cap
[-17.6,17.6].forEach(function(gz){
var shape=new THREE.Shape();
shape.moveTo(-11.5,0); shape.lineTo(11.5,0); shape.lineTo(0,4.2); shape.closePath();
var gable=new THREE.Mesh(new THREE.ShapeGeometry(shape),new THREE.MeshStandardMaterial({color:0xdfd7c2,roughness:0.85,side:THREE.DoubleSide}));
gable.position.set(0,8,gz); grp.add(gable);
sBox(grp,9,1.5,0.14,new THREE.MeshStandardMaterial({color:0xa8cade,roughness:0.15,metalness:0.25}),0,9.6,gz+(gz>0?0.12:-0.12),false);
});
// high window bands down both long sides
[-11.6,11.6].forEach(function(wx){
sBox(grp,0.14,1.8,30,new THREE.MeshStandardMaterial({color:0xa8cade,roughness:0.15,metalness:0.25,emissive:0x2a3c46,emissiveIntensity:0.4}),wx,6.4,0,false);
sBox(grp,0.14,0.5,30,new THREE.MeshStandardMaterial({color:0x7a7466,roughness:0.8}),wx,5.3,0,false);
});
// entrance on the yard side (-x): big sliding doors, canopy, sign
sBox(grp,0.18,3.6,6.4,darkGlassM,-11.6,1.8,0,false);
sBox(grp,4.2,0.35,8,new THREE.MeshStandardMaterial({color:0x5a6068,roughness:0.55,metalness:0.3}),-13,3.9,0,true);
var signG=new THREE.Mesh(new THREE.PlaneGeometry(5.4,1.35),new THREE.MeshBasicMaterial({map:schoolPlateTex('schGym','体育館','#37424a','#f4efe0',84)}));
signG.rotation.y=-Math.PI/2; signG.position.set(-11.72,5.2,0); grp.add(signG);
var o=registerCustom(grp,walls,23,35,13.5,'gym',40000000,3400,125,null);
})();
/* ---------- 25m POOL ---------- */
(function(){
var grp=new THREE.Group(); grp.position.set(69,0,-42);
var deck=sBox(grp,17,1.0,31,new THREE.MeshStandardMaterial({color:0xdcdcd2,roughness:0.75}),0,0.5,0,true);
var water=sBox(grp,13.5,0.35,27.5,new THREE.MeshStandardMaterial({color:0x27a8dd,roughness:0.12,metalness:0.25,emissive:0x0a3d55,emissiveIntensity:0.5}),0,0.95,0,false);
// lane lines on the water + dark lane ropes
for(var li=0;li<5;li++){ sBox(grp,0.28,0.06,26,new THREE.MeshStandardMaterial({color:0x14425e,roughness:0.4}),-5.4+li*2.7,1.14,0,false);}
for(var wi=0;wi<6;wi++){ sBox(grp,0.5,0.05,1.1,new THREE.MeshStandardMaterial({color:0xf4f4f0,roughness:0.5}),-6.75+wi*2.7,1.14,12.6,false);}
// starting blocks at the north end, diving board at the south end
for(var si=0;si<6;si++){ sBox(grp,0.85,0.75,0.85,new THREE.MeshStandardMaterial({color:0x3a6da8,roughness:0.5}),-6.75+si*2.7,1.35,-14.6,true);}
sBox(grp,1.1,1.6,1.1,stoneM,0,1.8,15.8,true);
sBox(grp,0.7,0.14,3.4,new THREE.MeshStandardMaterial({color:0xe8e8e8,roughness:0.5}),0,2.65,14.4,false);
// fence around the deck + a shower / foot-wash corner
var pfM=new THREE.MeshStandardMaterial({color:0x8fa5ad,roughness:0.4,metalness:0.6});
[-9.3,9.3].forEach(function(fx){ sBox(grp,0.07,0.07,33,pfM,fx,1.55,0,false); sBox(grp,0.07,0.07,33,pfM,fx,0.9,0,false);});
[-16.3,16.3].forEach(function(fz){ sBox(grp,18.6,0.07,0.07,pfM,0,1.55,fz,false); sBox(grp,18.6,0.07,0.07,pfM,0,0.9,fz,false);});
for(var pi=0;pi<8;pi++){ sBox(grp,0.09,1.6,0.09,pfM,-9.3+pi*2.65,0.8,-16.3,false); sBox(grp,0.09,1.6,0.09,pfM,-9.3+pi*2.65,0.8,16.3,false);}
var o=registerCustom(grp,water,17,31,2.6,'pool',14000000,1600,45,null);
o.main=deck;
})();
/* ---------- schoolyard props: goals, back net, podium, flag poles ---------- */
(function(){
var g2=new THREE.Group(); stageGroup.add(g2);
function goal(x,z,flip){
var gg=new THREE.Group(); gg.position.set(x,0,z); if(flip)gg.rotation.y=Math.PI;
[-3.65,3.65].forEach(function(gx){ sCyl(gg,0.09,0.09,2.44,whiteMetalM,gx,1.22,0,8);});
var bar=sCyl(gg,0.09,0.09,7.5,whiteMetalM,0,2.44,0,8); bar.rotation.z=Math.PI/2;
[-3.65,3.65].forEach(function(gx){ var bk=sCyl(gg,0.07,0.07,1.6,whiteMetalM,gx,0.8,1.5,6); bk.rotation.x=0.5;});
var net=new THREE.Mesh(new THREE.PlaneGeometry(7.3,2.3),new THREE.MeshBasicMaterial({color:0xe8f0e8,transparent:true,opacity:0.28,side:THREE.DoubleSide}));
net.position.set(0,1.2,1.45); gg.add(net);
g2.add(gg);
}
goal(-4,-8,true); goal(-4,36,false);
// back net behind the south goal
[-6,6].forEach(function(bx){ sCyl(g2,0.12,0.12,3.4,whiteMetalM,-4+bx,1.7,45,8);});
var bn=new THREE.Mesh(new THREE.PlaneGeometry(13,3.2),new THREE.MeshBasicMaterial({color:0x9fb8a4,transparent:true,opacity:0.35,side:THREE.DoubleSide}));
bn.position.set(-4,1.7,45); g2.add(bn);
sBox(g2,13,0.09,0.09,whiteMetalM,-4,3.35,45,false);
// morning-assembly podium （朝礼台） in front of the school building
sBox(g2,4.6,0.85,2.4,concM,13,0.43,-19,true);
sBox(g2,5.2,0.18,3.0,stoneM,13,0.95,-19,false);
// flag poles: national flag in the middle
var flagTex=schoolFlagTex();
[-21,-14,-7].forEach(function(fx,i){
sCyl(g2,0.07,0.1,9.5,whiteMetalM,fx,4.75,-20,8);
var fm2;
if(i===1){ fm2=new THREE.MeshBasicMaterial({map:flagTex,side:THREE.DoubleSide}); }
else { fm2=new THREE.MeshBasicMaterial({color:i===0?0x2e6da8:0xe8b02e,side:THREE.DoubleSide}); }
var fl=new THREE.Mesh(new THREE.PlaneGeometry(2.3,1.5),fm2);
fl.position.set(fx+1.18,8.5,-20); fl.rotation.y=0.25; g2.add(fl);
});
})();
/* ---------- playground （遊具） — one destructible cluster ---------- */
(function(){
var grp=new THREE.Group(); grp.position.set(-72,0,30);
var barM=new THREE.MeshStandardMaterial({color:0x3a7d5c,roughness:0.45,metalness:0.55});
var barM2=new THREE.MeshStandardMaterial({color:0xc25e2e,roughness:0.45,metalness:0.5});
// jungle gym: 3 x 2 grid frame
for(var jx=0;jx<3;jx++)for(var jz=0;jz<2;jz++)for(var jy=0;jy<3;jy++){
sBox(grp,0.1,0.1,2.6,barM,-3.4+jx*3.4,0.8+jy*0.95,-1.3+jz*2.6,false);
}
for(var vx=0;vx<3;vx++)for(var vz=0;vz<2;vz++)sBox(grp,0.11,2.8,0.11,barM,-3.4+vx*3.4,1.4,-1.3+vz*2.6,false);
for(var hz=0;hz<2;hz++)for(var hy=0;hy<3;hy++)sBox(grp,7,0.1,0.1,barM,0,0.8+hy*0.95,-1.3+hz*2.6,false);
// swing set
var swingTop=null;
[-2.6,2.6].forEach(function(sx){
var l1=sBox(grp,0.11,3.1,0.11,barM2,6.5+sx,1.45,-1.1,false); l1.rotation.x=0.3;
var l2=sBox(grp,0.11,3.1,0.11,barM2,6.5+sx,1.45,1.1,false); l2.rotation.x=-0.3;
});
swingTop=sCyl(grp,0.08,0.08,6.4,barM2,6.5,3.0,0,8); swingTop.rotation.x=Math.PI/2;
[-1.3,1.3].forEach(function(sw){
sBox(grp,0.05,1.7,0.05,barM2,6.5+sw,2.1,-0.35,false); sBox(grp,0.05,1.7,0.05,barM2,6.5+sw,2.1,0.35,false);
sBox(grp,0.5,0.09,1.1,new THREE.MeshStandardMaterial({color:0x37424a,roughness:0.6}),6.5+sw,1.22,0,false);
});
// horizontal bars （鉄棒） at three heights
[1.05,1.35,1.65].forEach(function(bh,bi){
var bx=-7+bi*2.6;
sBox(grp,0.09,bh,0.09,barM,bx-1,bh/2,5.5,false);
sBox(grp,0.09,bh,0.09,barM,bx+1,bh/2,5.5,false);
var hb=sCyl(grp,0.05,0.05,2.1,whiteMetalM,bx,bh,5.5,6); hb.rotation.z=Math.PI/2;
});
// slide
var sl=sBox(grp,1.0,0.14,4.6,new THREE.MeshStandardMaterial({color:0xd84a3a,roughness:0.4,metalness:0.3}),1.5,1.15,-6.5,true); sl.rotation.x=0.42;
sBox(grp,1.2,1.6,1.2,barM,1.5,0.8,-8.6,false);
sBox(grp,0.08,1.5,0.08,barM,1.1,0.75,-8.6,false); sBox(grp,0.08,1.5,0.08,barM,1.9,0.75,-8.6,false);
var o=registerCustom(grp,swingTop,15,13,3.2,'playground',7000000,800,30,null);
})();
/* ---------- bike shed （自転車置き場） ---------- */
(function(){
var grp=new THREE.Group(); grp.position.set(30,0,57);
var roofB=sBox(grp,15,0.22,5,new THREE.MeshStandardMaterial({color:0x5f7d8a,roughness:0.5,metalness:0.4}),0,2.65,0,true);
[-7,-2.4,2.4,7].forEach(function(px){ sCyl(grp,0.08,0.08,2.6,whiteMetalM,px,1.3,-2.1,6); sCyl(grp,0.08,0.08,2.6,whiteMetalM,px,1.3,2.1,6);});
sBox(grp,15,1.1,0.1,new THREE.MeshStandardMaterial({color:0x9fb6ad,roughness:0.7}),0,0.85,-2.45,false); // back panel
var wheelM=new THREE.MeshStandardMaterial({color:0x22242a,roughness:0.8});
var frameMs=[0xd8452e,0x2e6fd8,0x30343a,0x3fae5a,0xe8b02e];
for(var bi2=0;bi2<5;bi2++){
var bx2=-5.6+bi2*2.8, bike=new THREE.Group(); bike.position.set(bx2,0,0.4); bike.rotation.y=0.06*(bi2%2?1:-1);
[-0.55,0.55].forEach(function(wx){ var wh=new THREE.Mesh(new THREE.TorusGeometry(0.34,0.05,6,14),wheelM); wh.position.set(wx,0.34,0); bike.add(wh);});
var fr=sBox(bike,1.0,0.07,0.07,new THREE.MeshStandardMaterial({color:frameMs[bi2],roughness:0.4,metalness:0.5}),0,0.62,0,false); fr.rotation.z=0.18;
sBox(bike,0.07,0.5,0.07,wheelM,0.5,0.6,0,false);
sBox(bike,0.4,0.06,0.3,new THREE.MeshStandardMaterial({color:0x22242a,roughness:0.7}),-0.45,0.92,0,false);
grp.add(bike);
}
var o=registerCustom(grp,roofB,15,5,2.8,'bikeshed',6000000,700,25,null);
})();
/* ---------- trees: sakura row + shade trees ---------- */
(function(){
var tg=new THREE.Group(); stageGroup.add(tg);
for(var sx=-84;sx<=84;sx+=21){ if(Math.abs(sx)<11)continue; makeSakura(tg,sx,62,rand(0.9,1.15)); }
makeSakura(tg,-8,52,1); makeSakura(tg,8,52,1);
makeSakura(tg,-58,-58,1.1); makeSakura(tg,52,-60,1.05);
makeGreenTree(tg,-90,-36,1.2); makeGreenTree(tg,88,-58,1.15); makeGreenTree(tg,-88,44,1.1); makeGreenTree(tg,88,58,1.2);
makeGreenTree(tg,-50,64,1); makeGreenTree(tg,76,64,1.05);
})();
/* ---------- extra campus buildings (destructible) ---------- */
var xb;
xb=makeBuilding(69,-12,12,8,4.6,texWhite,0xe8e2d2,'school',9000000,950); setHp(xb,42); // pool changing rooms
xb=makeBuilding(54,57,15,9,5.6,texB,0xe2d6ba,'school',11000000,1100); setHp(xb,48); // lunch kitchen （給食棟）
xb=makeBuilding(-88,-56,10,8,4.2,texA,0xcfc8b4,'school',7000000,800); setHp(xb,38); // gym storehouse
xb=makeBuilding(-88,8,9,12,4.8,texWhite,0xdcd4c0,'school',8000000,850); setHp(xb,40); // outdoor store / club rooms
/* ---------- surrounding neighbourhood (background only, not counted) ---------- */
(function(){
var mats=bgMats();
var houses=[[-70,96],[-38,98],[-6,96],[26,98],[58,96],[90,98],[-104,30],[-106,-16],[-104,-52],[104,26],[106,-20],[40,-92],[72,-90],[-30,-92],[-64,-90]];
houses.forEach(function(hp,i){ addBgBuilding(hp[0],hp[1],rand(9,13),rand(8,11),rand(4.5,6.5),mats[i%mats.length],true); });
addBgBuilding(-6,-94,26,16,13,mats[3],false); // apartment block across the north street
addBgBuilding(104,64,15,12,9,mats[1],false); // small clinic / shop SE
})();
/* ---------- cars: staff parking + front-road traffic ---------- */
var pk=[[-76,56],[-68,56],[-60,56],[-52,56]];
pk.forEach(function(pp){ var c=makeCar(pp[0],pp[1],'x',1); c.moving=false; c.group.rotation.y=Math.PI/2+rand(-0.05,0.05); c.group.userData.parkRot=c.group.rotation.y;});
var mv=makeCar(-110,79,'x',1); mv.speed=9;
var mv2=makeCar(110,79,'x',-1); mv2.speed=10;
enhanceSchoolRealism();
document.getElementById('totalNum').textContent=totalCount;
}
function buildMilitaryStage(){
cityBase.material.color.setHex(0x8f8d7c);
addStaticPlane(0,84,300,17,0x3a3a3e,0.05); // in-base runway strip
addStaticPlane(0,20,190,120,0x9c9a8c,0.03); // concrete apron
addStaticPlane(0,-62,200,8,0x5c6058,0.05);
var b;
[[-46,-38],[6,-38],[58,-38]].forEach(function(pp){ var h=makeBuilding(pp[0],pp[1],24,15,9,texA,0x8a927a,'hangar',34000000,3400); setHp(h,95);});
b=makeBuilding(84,18,9,9,23,texWhite,0xc9c9bc,'tower',30000000,3600); setHp(b,80);
b=makeBuilding(0,-2,22,15,12,texC,0x9aa48c,'hq',34000000,3400); setHp(b,100);
b=makeBuilding(-62,18,19,11,9,texB,0xa8a88e,'barracks',16000000,1600); setHp(b,70);
b=makeBuilding(-24,18,19,11,9,texB,0xa8a88e,'barracks',16000000,1600); setHp(b,70);
var ammo=makeBuilding(66,62,15,11,8,texA,0x7d8471,'ammo',42000000,4600); setHp(ammo,70); ammo.explosive={radius:24,dmg:80};
b=makeBuilding(-70,62,16,11,8,texC,0x939b84,'depot',18000000,1800); setHp(b,70);
makeRadarAt(38,44);
makeRadarAt(-38,44);
makeFuelTankAt(-96,-30,true); makeFuelTankAt(-96,-58,true); makeFuelTankAt(96,-58,false);
makeTankVehicle(-30,-66,0.3); makeTankVehicle(18,-66,-0.2); makeTankVehicle(52,44,2.6); makeTankVehicle(-58,-66,0.1);
b=makeBuilding(16,18,19,11,9,texB,0xa8a88e,'barracks',16000000,1600); setHp(b,70);
b=makeBuilding(54,18,19,11,9,texB,0xa8a88e,'barracks',16000000,1600); setHp(b,70);
var bunker=makeBuilding(0,62,18,10,5,texA,0x7d8471,'ammo',30000000,3400); setHp(bunker,60); bunker.explosive={radius:20,dmg:70};
b=makeBuilding(30,62,14,10,6,texC,0x939b84,'depot',14000000,1400); setHp(b,60);
b=makeBuilding(-110,20,13,10,7,texC,0x9aa48c,'depot',13000000,1300); setHp(b,60);
b=makeBuilding(110,103,16,11,8,texA,0x8a927a,'hangar',22000000,2200); setHp(b,80);
// distant base structures (background only, not counted)
(function(){
var mats=bgMats();
[[-90,124],[-40,128],[10,124],[60,128],[110,124]].forEach(function(hp,i){ addBgBuilding(hp[0],hp[1],24,14,8,mats[i%mats.length],false); });
addBgBuilding(-128,-96,18,12,10,mats[0],false); addBgBuilding(128,60,18,12,10,mats[2],false);
addBgBuilding(0,-128,30,16,12,mats[3],false);
})();
var t1=makeCar(-10,84,'x',1); t1.speed=8; var t2=makeCar(60,84,'x',-1); t2.speed=8;
var pk2=[[30,-20],[-84,30],[84,-30]];
pk2.forEach(function(pp){ var c=makeCar(pp[0],pp[1],'x',1); c.moving=false; c.group.rotation.y=rand(0,Math.PI*2); c.group.userData.parkRot=c.group.rotation.y;});
// denser base: extra hangar, depots, barracks row, ammo store, fuel tanks
b=makeBuilding(110,-38,20,13,9,texA,0x8a927a,'hangar',30000000,3000); setHp(b,90);
b=makeBuilding(-100,-2,17,11,8,texC,0x9aa48c,'depot',15000000,1500); setHp(b,65);
b=makeBuilding(120,40,16,11,8,texB,0xa8a88e,'barracks',16000000,1600); setHp(b,70);
var ammo2=makeBuilding(-40,110,16,10,6,texA,0x7d8471,'ammo',36000000,4000); setHp(ammo2,65); ammo2.explosive={radius:22,dmg:75};
b=makeBuilding(88,110,19,11,9,texB,0xa8a88e,'barracks',16000000,1600); setHp(b,70);
b=makeBuilding(-116,64,15,10,7,texC,0x939b84,'depot',14000000,1400); setHp(b,60);
makeFuelTankAt(60,-100,false); makeFuelTankAt(-38,-102,false);
makeTankVehicle(-88,100,0.7);
enhanceMilitaryRealism();
document.getElementById('totalNum').textContent=totalCount;
}
function buildHighwayStage(){
cityBase.material.color.setHex(0xa3a6a0);
addStaticPlane(0,0,330,21,0x333336,0.05); // main highway deck
addStaticPlane(0,-4.8,330,0.5,0xf5efcf,0.07); addStaticPlane(0,4.8,330,0.5,0xf5efcf,0.07);
addStaticPlane(62,52,64,40,0x3d3d40,0.04); // interchange apron
addStaticPlane(62,52,10,86,0x3d3d40,0.045); // ramp road N-S
addStaticPlane(-118,42,52,26,0xbdbcb4,0.04); // SA parking west
addStaticPlane(104,44,46,24,0xbdbcb4,0.04); // SA parking east
var b;
b=makeBuilding(-118,46,22,13,8,texWhite,null,'sa',20000000,2000); setHp(b,65);
b=makeBuilding(104,48,20,12,8,texA,null,'sa',19000000,1900); setHp(b,65);
b=makeBuilding(28,-48,17,11,7,texB,0xd8c9ae,'pa',12000000,1200); setHp(b,50);
b=makeBuilding(-52,-48,15,10,7,texWhite,null,'pa',11000000,1100); setHp(b,50);
makeTollAt(-24,0); makeTollAt(96,52);
makeGantryAt(-84,0); makeGantryAt(38,0); makeGantryAt(124,0);
makeGateAt(-120,20,16,0x2e6da8,'icgate',8000000,1000);
makeFuelTankAt(-96,44,false);
// roadside buildings filling the shoulders (destructible)
b=makeBuilding(76,-44,16,11,8,texWhite,null,'sa',17000000,1700); setHp(b,60);
b=makeBuilding(-16,44,13,10,6,texB,0xd8c9ae,'house',9000000,950); setHp(b,40);
b=makeBuilding(138,32,12,10,7,texA,null,'pa',11000000,1100); setHp(b,50);
b=makeBuilding(-138,-36,13,10,6,texWhite,0xe8dfc8,'pa',10000000,1000); setHp(b,48);
// roadside houses + far skyline (background only, not counted)
(function(){
var mats=bgMats();
var hh=[[-120,-78],[-70,-84],[-20,-78],[30,-84],[86,-78],[128,-84],[-120,86],[-64,80],[-8,86],[48,80],[104,86],[140,78]];
hh.forEach(function(hp,i){ addBgBuilding(hp[0],hp[1],rand(9,13),rand(8,11),rand(4.5,7),mats[i%mats.length],true); });
addSkylineRing(14,225,300,18,46,Math.PI*1.08,Math.PI*1.92);
})();
// car stream on the highway lanes
var lanes=[{z:-5.2,dir:1},{z:5.2,dir:-1},{z:-1.8,dir:1},{z:1.8,dir:-1}];
for(var ci=0;ci<44;ci++){ var ln=lanes[ci%4]; var c=makeCar(-145+Math.floor(ci/4)*26+rand(-5,5),ln.z,'x',ln.dir); c.speed=rand(13,19); }
var pk=[[ -132,30],[132,34],[-100,30],[86,32]];
pk.forEach(function(pp){ var c2=makeCar(pp[0],pp[1],'x',1); c2.moving=false; c2.group.rotation.y=rand(0,Math.PI*2); c2.group.userData.parkRot=c2.group.rotation.y;});
// denser roadsides: more SA / PA / roadside buildings on both shoulders
b=makeBuilding(-60,54,18,12,8,texWhite,null,'sa',18000000,1800); setHp(b,62);
b=makeBuilding(-142,50,14,11,7,texA,null,'pa',12000000,1200); setHp(b,52);
b=makeBuilding(14,64,16,11,7,texB,0xd8c9ae,'house',9500000,1000); setHp(b,42);
b=makeBuilding(-100,-58,15,11,7,texWhite,0xe8dfc8,'pa',11000000,1100); setHp(b,50);
b=makeBuilding(110,-62,16,11,8,texA,null,'sa',16000000,1600); setHp(b,58);
b=makeBuilding(142,-50,13,10,6,texWhite,null,'pa',10000000,1000); setHp(b,48);
b=makeBuilding(-30,-64,14,10,6,texB,0xd8c9ae,'house',9000000,950); setHp(b,40);
enhanceHighwayRealism();
document.getElementById('totalNum').textContent=totalCount;
}
function buildAirportStage(){
cityBase.material.color.setHex(0x9fa3a0);
// --- runway (E-W, south side) + parallel taxiway + connectors ---
addStaticPlane(0,-30,308,26,0x2e2e33,0.05);
for(var rx=-140;rx<=140;rx+=20){ addStaticPlane(rx,-30,10,1.3,0xf2eed8,0.075); } // centreline dashes
[-43,-17].forEach(function(ez){ for(var ex=-144;ex<=144;ex+=24){ addStaticPlane(ex,ez,1.6,1.6,0x8f8a6a,0.07);} }); // edge markers
addStaticPlane(0,2,308,12,0x3a3a3e,0.05); // parallel taxiway
addStaticPlane(0,2,308,0.7,0xd8b13a,0.07); // taxiway centreline
[-90,-30,30,90].forEach(function(cx2){ addStaticPlane(cx2,-11,10,20,0x3a3a3e,0.048); }); // connectors
// --- apron + service road + remote stand + parking ---
addStaticPlane(4,48,292,44,0xb0b2ac,0.04);
addStaticPlane(0,70,308,8,0x4a4a4e,0.045);
addStaticPlane(-70,-80,52,38,0xa8aaa4,0.04); // remote stand (SW)
addStaticPlane(-86,96,46,28,0x3d3d40,0.04); // terminal car park (W)
var edgeMat=new THREE.MeshBasicMaterial({color:0xffe27a});
for(var lx=-140;lx<=140;lx+=28){ [-45.5,-14.5].forEach(function(lz){ var s=new THREE.Mesh(new THREE.SphereGeometry(0.32,6,5),edgeMat); s.position.set(lx,0.4,lz); stageGroup.add(s);});}
var b;
// --- terminal (the big prize building) + jet bridges ---
b=makeBuilding(-12,93,78,22,17,texGlass,0xdfe8ee,'terminal',120000000,6000); setHp(b,150);
[-28,-2,24].forEach(function(jx){
var jb=new THREE.Mesh(new THREE.BoxGeometry(2.2,2.6,7),new THREE.MeshStandardMaterial({color:0x9aa2a8,roughness:0.5,metalness:0.4}));
jb.position.set(jx,4.6,-14.2); jb.castShadow=true; b.group.add(jb);
var jh=new THREE.Mesh(new THREE.BoxGeometry(2.4,1.1,2.2),new THREE.MeshStandardMaterial({color:0x6e767c,roughness:0.5,metalness:0.4}));
jh.position.set(jx,3.4,-17.4); b.group.add(jh);
});
// --- control tower with glass cab ---
b=makeBuilding(64,90,10,10,26,texWhite,0xe4e6e0,'tower',60000000,5000); setHp(b,90);
var cab=new THREE.Mesh(new THREE.BoxGeometry(7.6,3.0,7.6),new THREE.MeshStandardMaterial({color:0x2b3d4a,roughness:0.15,metalness:0.35}));
cab.position.y=28.2; cab.castShadow=true; b.group.add(cab);
var cabRoof=new THREE.Mesh(new THREE.BoxGeometry(8.6,0.5,8.6),new THREE.MeshStandardMaterial({color:0x43484e,roughness:0.8}));
cabRoof.position.y=29.9; b.group.add(cabRoof);
var ant=new THREE.Mesh(new THREE.CylinderGeometry(0.07,0.12,4.4,5),new THREE.MeshStandardMaterial({color:0x6e767c,roughness:0.6}));
ant.position.y=32.2; b.group.add(ant);
// --- hangars ---
b=makeBuilding(-116,54,30,18,10,texA,0xb9c0c4,'hangar',34000000,3400); setHp(b,95);
b=makeBuilding(-84,64,26,16,9,texC,0xaeb6ba,'hangar',30000000,3000); setHp(b,90);
b=makeBuilding(114,56,28,18,10,texA,0xb9c0c4,'hangar',34000000,3400); setHp(b,95);
// --- cargo warehouses (NE) ---
b=makeBuilding(108,102,30,16,9,texB,0xcac2ae,'cargo',26000000,2400); setHp(b,80);
b=makeBuilding(110,80,22,13,8,texWhite,0xd8d4c4,'cargo',20000000,1900); setHp(b,70);
// --- catering / airport ops building ---
b=makeBuilding(42,102,20,12,7,texWhite,0xe2ddca,'ops',14000000,1400); setHp(b,55);
// --- parked airliners: the headline targets (tough, staged damage, huge score) ---
makeAirlinerAt(-46,44,0x2e6da8);
makeAirlinerAt(10,44,0xc23a1e);
makeAirlinerAt(62,42,0x2e8a5a);
makeAirlinerAt(-70,-80,0x7048a8);
// --- fuel farm (E, south of taxiway): chain-explosion starters ---
makeFuelTankAt(116,-72,true); makeFuelTankAt(132,-86,true); makeFuelTankAt(100,-86,false);
makeFuelTankAt(-96,26,false);
// --- ground vehicles: parked in the car park + service traffic ---
var pk=[[-100,88],[-88,88],[-76,88],[-100,102],[-88,102],[-76,102],[-64,88],[-64,102]];
pk.forEach(function(pp,i){ var c=makeCar(pp[0],pp[1],'x',1); c.moving=false; c.group.rotation.y=(i%2?0.06:-0.05); c.group.userData.parkRot=c.group.rotation.y;});
b=makeBuilding(-40,120,32,15,11,texA,0xb9c0c4,'parking',28000000,2600); setHp(b,95); // multi-storey car park
b=makeBuilding(66,112,21,13,16,texGlass,0xdfe8ee,'hotel',46000000,4200); setHp(b,110); // airport hotel
b=makeBuilding(-128,96,20,14,8,texC,0xaeb6ba,'cargo',20000000,1900); setHp(b,70);
b=makeBuilding(24,124,24,13,8,texWhite,0xd8d4c4,'ops',18000000,1700); setHp(b,65);
// distant city skyline to the north + low sheds (background only, not counted)
addSkylineRing(15,215,295,18,50,Math.PI*1.06,Math.PI*1.94);
(function(){
var mats=bgMats();
addBgBuilding(-140,-40,22,14,8,mats[0],false); addBgBuilding(142,20,22,14,8,mats[2],false); addBgBuilding(140,110,20,13,9,mats[1],false);
})();
// denser airport: more cargo / ops buildings, an extra hangar + airliner
b=makeBuilding(-80,124,26,14,9,texB,0xcac2ae,'cargo',22000000,2100); setHp(b,75);
b=makeBuilding(136,120,22,13,8,texWhite,0xd8d4c4,'cargo',20000000,1900); setHp(b,70);
b=makeBuilding(86,124,20,12,8,texA,0xb9c0c4,'ops',17000000,1600); setHp(b,62);
b=makeBuilding(142,-54,20,14,9,texC,0xaeb6ba,'hangar',28000000,2800); setHp(b,85);
b=makeBuilding(-142,24,16,12,8,texB,0xcac2ae,'cargo',18000000,1700); setHp(b,65);
makeAirlinerAt(118,28,0xe8b02e);
var sv1=makeCar(-130,70,'x',1); sv1.speed=10;
var sv2=makeCar(130,70,'x',-1); sv2.speed=11;
var sv3=makeCar(-60,2,'x',1); sv3.speed=8;
var sv4=makeCar(80,2,'x',-1); sv4.speed=8;
enhanceAirportRealism();
airlinerFix();
document.getElementById('totalNum').textContent=totalCount;
}
/* ================= OFFICE stage: オフィス街 (6th stage) =================
   A dense business district of glass high-rise office towers: taller and
   tighter than the city stage, with company signage, a central plaza with
   a fountain, a multi-storey car park and a fuel-tank yard for combos.
   The four corners stay clear for pad / enemy pad / fuel / repair. */
function buildOfficeStage(){
cityBase.material.color.setHex(0x9aa0a6);
var spacing=44;
var used=[];
function spotFree(x,z,r){ for(var i=0;i<used.length;i++){ var u=used[i]; if(Math.abs(u[0]-x)<r+u[2]&&Math.abs(u[1]-z)<r+u[2])return false;} return true;}
function nearPad(x,z){ return Math.sqrt((x-PAD.x)*(x-PAD.x)+(z-PAD.z)*(z-PAD.z))<21||Math.sqrt((x-FUEL.x)*(x-FUEL.x)+(z-FUEL.z)*(z-FUEL.z))<21||Math.sqrt((x-REPAIR.x)*(x-REPAIR.x)+(z-REPAIR.z)*(z-REPAIR.z))<21||Math.sqrt((x-EH_PAD.x)*(x-EH_PAD.x)+(z-EH_PAD.z)*(z-EH_PAD.z))<21; }
addStaticPlane(22,22,34,34,0xb4b8ba,0.04); // central plaza pavement
addStaticPlane(22,22,4,34,0xcfc8b4,0.055);
addStaticPlane(22,22,34,4,0xcfc8b4,0.055);
for(var bx=-3;bx<=3;bx++)for(var bz=-3;bz<=3;bz++){
var cx=bx*spacing+22, cz=bz*spacing+22;
if(Math.abs(cx)>WORLD-16||Math.abs(cz)>WORLD-16)continue;
if(nearPad(cx,cz))continue;
if(bx===0&&bz===0)continue; // central plaza block
if(bx===-1&&bz===1){ makeFuelTankAt(cx-6,cz,false); makeFuelTankAt(cx+7,cz+2,false); used.push([cx,cz,12]); continue; } // tank yard: chain-explosion starter
var roll=Math.random();
if(roll<0.10){
var pb=makeBuilding(cx,cz,22,15,9,texWhite,0xd6d2c4,'parking',24000000,2300); setHp(pb,85);
used.push([cx,cz,13]); continue;
}
var tall=Math.random()<0.82;
var w=rand(13,17), d=rand(13,17), h=tall?rand(48,128):rand(26,46);
if(!spotFree(cx,cz,11))continue; used.push([cx,cz,11]);
var btex2=tall?texOffice:(Math.random()<0.65?texOffice:(Math.random()<0.5?texC:texA));
var b=makeBuilding(cx+rand(-2,2),cz+rand(-2,2),w,d,h,btex2,null,tall?'tower':'office',Math.round(h*11500000),Math.round(h*175));
setHp(b,tall?200:125);
if(Math.random()<0.96){
var w2=rand(9,12), d2=rand(9,12), h2=rand(20,56);
var ox=cx+(Math.random()<0.5?-13:13), oz=cz+(Math.random()<0.5?-13:13);
if((Math.abs(ox-cx)>(w+w2)/2+0.5||Math.abs(oz-cz)>(d+d2)/2+0.5)&&!nearPad(ox,oz)){ used.push([ox,oz,7]);
var b2=makeBuilding(ox,oz,w2,d2,h2,Math.random()<0.7?texOffice:(Math.random()<0.5?texA:texWhite),null,'office',Math.round(h2*6200000),Math.round(h2*110));
setHp(b2,80);
}
}
}
var cafe=makeBuilding(36,10,10,7,5.5,texWhite,0xe8e0cc,'office',10000000,1050); setHp(cafe,42);
var shop=makeBuilding(8,36,9,7,6.5,texB,0xd8c9ae,'office',11000000,1150); setHp(shop,45);
(function(){
var grp=new THREE.Group(); grp.position.set(22,0,22);
var basin=new THREE.Mesh(new THREE.CylinderGeometry(5.2,5.6,1.1,18),new THREE.MeshStandardMaterial({color:0x9aa2a8,roughness:0.7})); basin.position.y=0.55; basin.castShadow=true; grp.add(basin);
var water=new THREE.Mesh(new THREE.CylinderGeometry(4.7,4.7,0.3,18),new THREE.MeshStandardMaterial({color:0x2e9fd8,roughness:0.15,metalness:0.25})); water.position.y=1.05; grp.add(water);
var pillar=new THREE.Mesh(new THREE.CylinderGeometry(0.55,0.8,3.6,10),new THREE.MeshStandardMaterial({color:0xb9bec2,roughness:0.5,metalness:0.4})); pillar.position.y=2.6; grp.add(pillar);
var orb=new THREE.Mesh(new THREE.SphereGeometry(1.05,12,10),new THREE.MeshStandardMaterial({color:0x8fb8cc,roughness:0.15,metalness:0.5})); orb.position.y=5; grp.add(orb);
var o=registerCustom(grp,basin,11,11,6,'fountain',15000000,1600,45,null); o.mat=null;
})();
spawnTraffic(3); makeCar(-44+2.4,-120,'z',1); makeCar(44-2.4,80,'z',-1); makeCar(0+2.4,-60,'z',1); makeCar(-88-2.4,100,'z',-1); makeCar(88+2.4,-20,'z',1);
makeCar(-100,44-2.4,'x',-1); makeCar(40,-44+2.4,'x',1); makeCar(120,0-2.4,'x',-1); makeCar(-30,88+2.4,'x',1);
[[46.4,100,'z',-1],[-46.4,-80,'z',1],[100,-46.4,'x',-1],[-100,46.4,'x',1],[2.4,124,'z',1],[-2.4,-124,'z',-1]].forEach(function(p){ var c=makeCar(p[0],p[1],p[2],p[3]); c.moving=false; c.group.userData.parkRot=c.group.rotation.y; });
addSkylineRing(100,190,330,45,150,0,Math.PI*2);
enhanceOfficeRealism();
document.getElementById('totalNum').textContent=totalCount;
}
function enhanceOfficeRealism(){
var list=destructibles.slice();
var names=['まるばつ商事','株式会社まるまる','まるコーポレーション','株式会社さんかく','ばつまる商事','しかくコーポレーション','株式会社まるさん','まるしかく商事','株式会社ばつばつ','ばつコーポレーション','株式会社まるばつ','まるさん商事','株式会社しかく','さんかく商事','株式会社まるしかく','しかく商事 本社'];
var bgs=['#17384a','#1d3a6e','#37424a','#2e4a3a','#7a1f2b','#27313a'];
var ni=0;
for(var i=0;i<list.length&&ni<16;i++){
var o=list[i];
if((o.type!=='office'&&o.type!=='tower')||o.height<14)continue;
var sw=Math.min(o.w-1.5,12), sy=o.height-2.2; // company sign up near the rooftop, not down low
sBox(o.group,sw+0.5,1.9,0.3,rMat('signBack',0x22262a,0.6,0.3),0,sy,o.d/2+0.08,false);
addSign(o.group,sw,1.6,names[ni%names.length],bgs[ni%bgs.length],'#f4efe0',0,sy,o.d/2+0.26,0);
sBox(o.group,sw+0.5,1.9,0.3,rMat('signBack',0x22262a,0.6,0.3),0,sy,-o.d/2-0.08,false);
addSign(o.group,sw,1.6,names[ni%names.length],bgs[ni%bgs.length],'#f4efe0',0,sy,-o.d/2-0.26,Math.PI);
ni++;
}
makeGreenTree(stageGroup,10,10,1.0); makeGreenTree(stageGroup,34,34,1.0); makeGreenTree(stageGroup,12,22,0.9); makeGreenTree(stageGroup,22,34,0.9);
var benchM=rMat('benchWood',0x8a6a48,0.85,0);
[[14,22],[30,22],[22,14],[22,30]].forEach(function(bp){ sBox(stageGroup,2.6,0.12,0.6,benchM,bp[0],0.55,bp[1],false); sBox(stageGroup,0.15,0.55,0.5,benchM,bp[0]-1.1,0.27,bp[1],false); sBox(stageGroup,0.15,0.55,0.5,benchM,bp[0]+1.1,0.27,bp[1],false); });
for(var rp=0;rp<8;rp++){ var onV=Math.random()<0.5; var rx=onV?(Math.floor(rand(-3,3))*44):rand(-130,130); var rz=onV?rand(-130,130):(Math.floor(rand(-3,3))*44); groundMark(rx,rz,rand(4,8),rand(3,5),0x2b2b2e,0.062); }
}
/* ================= RADIO stage: 電波塔 (7th stage) =================
   A broadcast transmission site dominated by a 62m red-and-white lattice
   tower at the centre: tapered truss legs with X-bracing, an equipment
   deck, mast + spire and aviation beacons. Around it: relay towers,
   satellite dishes, a transmitter station, a broadcast centre, fuel
   tanks for chain explosions and parked broadcast vans. The four
   corners stay clear for pad / enemy pad / fuel / repair. */
function latticeBeam(grp,x1,y1,z1,x2,y2,z2,r,mat){
var dx=x2-x1, dy=y2-y1, dz=z2-z1;
var len=Math.sqrt(dx*dx+dy*dy+dz*dz);
var m=new THREE.Mesh(new THREE.CylinderGeometry(r,r,len,6),mat);
m.position.set((x1+x2)/2,(y1+y2)/2,(z1+z2)/2);
m.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),new THREE.Vector3(dx/len,dy/len,dz/len));
m.castShadow=true; grp.add(m); return m;
}
var radioRedMat=null, radioWhiteMat=null, radioDarkMat=null, radioBeaconMat=null;
function radioMats(){
if(!radioRedMat){
radioRedMat=new THREE.MeshStandardMaterial({color:0xc8401f,roughness:0.55,metalness:0.35});
radioWhiteMat=new THREE.MeshStandardMaterial({color:0xe9e7de,roughness:0.5,metalness:0.3});
radioDarkMat=new THREE.MeshStandardMaterial({color:0x3a4046,roughness:0.6,metalness:0.45});
radioBeaconMat=new THREE.MeshBasicMaterial({color:0xff3020});
}
}
function makeMainRadioTower(){
radioMats();
var grp=new THREE.Group(); grp.position.set(0,0,0);
var plinth=new THREE.Mesh(new THREE.BoxGeometry(27,1.1,27),new THREE.MeshStandardMaterial({color:0x9a9a94,roughness:0.95}));
plinth.position.y=0.55; plinth.castShadow=true; plinth.receiveShadow=true; grp.add(plinth);
var hut=new THREE.Mesh(new THREE.BoxGeometry(6,3,4.5),radioDarkMat); hut.position.set(9,2.6,6); hut.castShadow=true; grp.add(hut);
var TOP=44, LEVELS=5, lh=TOP/LEVELS;
function hw(y){ return 11+(3.6-11)*(y/TOP); }
var corners=[[-1,-1],[1,-1],[1,1],[-1,1]];
for(var i=0;i<LEVELS;i++){
var y0=i*lh, y1=y0+lh, h0=hw(y0), h1=hw(y1);
var band=(i%2===0)?radioRedMat:radioWhiteMat;
for(var c=0;c<4;c++){
var sx=corners[c][0], sz=corners[c][1];
latticeBeam(grp,sx*h0,y0,sz*h0,sx*h1,y1,sz*h1,0.6,band);
var nx=corners[(c+1)%4][0], nz=corners[(c+1)%4][1];
latticeBeam(grp,sx*h1,y1,sz*h1,nx*h1,y1,nz*h1,0.34,band);
latticeBeam(grp,sx*h0,y0,sz*h0,nx*h1,y1,nz*h1,0.26,band);
if(i%2===1)latticeBeam(grp,nx*h0,y0,nz*h0,sx*h1,y1,sz*h1,0.26,band);
}
}
var deck=new THREE.Mesh(new THREE.BoxGeometry(11.5,2.8,11.5),radioDarkMat); deck.position.y=45.4; deck.castShadow=true; grp.add(deck);
var equip=new THREE.Mesh(new THREE.BoxGeometry(7,2.2,7),radioWhiteMat); equip.position.y=47.9; equip.castShadow=true; grp.add(equip);
var mast=new THREE.Mesh(new THREE.CylinderGeometry(0.35,0.85,8.5,8),radioRedMat); mast.position.y=53.2; mast.castShadow=true; grp.add(mast);
var spire=new THREE.Mesh(new THREE.CylinderGeometry(0.09,0.22,4.8,6),radioWhiteMat); spire.position.y=59.6; grp.add(spire);
[[-5.2,-5.2],[5.2,-5.2],[5.2,5.2],[-5.2,5.2]].forEach(function(bp){ var b=new THREE.Mesh(new THREE.SphereGeometry(0.34,6,5),radioBeaconMat); b.position.set(bp[0],47.1,bp[1]); grp.add(b); });
var bm2=new THREE.Mesh(new THREE.SphereGeometry(0.38,6,5),radioBeaconMat); bm2.position.set(1.1,53.2,0); grp.add(bm2);
var bt=new THREE.Mesh(new THREE.SphereGeometry(0.5,7,6),radioBeaconMat); bt.position.set(0,62.3,0); grp.add(bt);
var o=registerCustom(grp,deck,17,17,62,'radiotower',260000000,15000,460,null);
var rm2=new THREE.MeshStandardMaterial({color:0x5c564e,roughness:1});
var rb1=new THREE.Mesh(new THREE.BoxGeometry(16,2.2,3),rm2); rb1.position.set(2,1.1,2); rb1.rotation.set(0.2,0.6,0.35); o.rubble.add(rb1);
var rb2=new THREE.Mesh(new THREE.BoxGeometry(3,2.6,14),rm2); rb2.position.set(-4,1.3,-3); rb2.rotation.set(0.3,0.2,0.9); o.rubble.add(rb2);
var rb3=new THREE.Mesh(new THREE.CylinderGeometry(0.5,0.5,15,6),rm2); rb3.position.set(6,0.8,-5); rb3.rotation.z=Math.PI/2.2; o.rubble.add(rb3);
return o;
}
function makeRelayTower(x,z,h){
radioMats();
var grp=new THREE.Group(); grp.position.set(x,0,z); grp.rotation.y=rand(0,Math.PI);
var L=4, lh=h/L;
function hw(y){ return 5+(1.5-5)*(y/h); }
var corners=[[-1,-1],[1,-1],[1,1],[-1,1]];
for(var i=0;i<L;i++){
var y0=i*lh, y1=y0+lh, h0=hw(y0), h1=hw(y1);
var band=(i%2===0)?radioRedMat:radioWhiteMat;
for(var c=0;c<4;c++){
var sx=corners[c][0], sz=corners[c][1];
latticeBeam(grp,sx*h0,y0,sz*h0,sx*h1,y1,sz*h1,0.34,band);
var nx=corners[(c+1)%4][0], nz=corners[(c+1)%4][1];
latticeBeam(grp,sx*h1,y1,sz*h1,nx*h1,y1,nz*h1,0.2,band);
if(c<2)latticeBeam(grp,sx*h0,y0,sz*h0,nx*h1,y1,nz*h1,0.15,band);
}
}
var topBox=new THREE.Mesh(new THREE.BoxGeometry(2.6,1.6,2.6),radioDarkMat); topBox.position.y=h+0.8; topBox.castShadow=true; grp.add(topBox);
var ant=new THREE.Mesh(new THREE.CylinderGeometry(0.08,0.16,5,6),radioWhiteMat); ant.position.y=h+4; grp.add(ant);
var bc=new THREE.Mesh(new THREE.SphereGeometry(0.34,6,5),radioBeaconMat); bc.position.set(0,h+6.7,0); grp.add(bc);
return registerCustom(grp,topBox,9,9,h+5,'relay',55000000,4200,150,null);
}
function buildRadioStage(){
cityBase.material.color.setHex(0x8f968a);
addStaticPlane(0,0,46,46,0x8a877c,0.04); // gravel apron under the main tower
addStaticPlane(0,96,250,9,0x55565a,0.045); // south access road
addStaticPlane(-96,0,9,190,0x55565a,0.045); // west access road
addStaticPlane(-38,16,32,24,0x9a9a94,0.05);
addStaticPlane(42,-26,30,22,0x9a9a94,0.05);
makeMainRadioTower();
// perimeter fence around the tower compound (gap on the south side)
(function(){
var steel=rMat('radioFence',0x8a929c,0.4,0.6);
for(var fx=-17;fx<=17;fx+=8.5) sBox(stageGroup,0.14,1.6,0.14,steel,fx,0.8,-17,false);
for(var fx2=-17;fx2<=17;fx2+=8.5) sBox(stageGroup,0.14,1.6,0.14,steel,fx2,0.8,17,false);
for(var fz=-17;fz<=17;fz+=8.5) sBox(stageGroup,0.14,1.6,0.14,steel,-17,0.8,fz,false);
for(var fz2=-17;fz2<=17;fz2+=8.5) sBox(stageGroup,0.14,1.6,0.14,steel,17,0.8,fz2,false);
sBox(stageGroup,34.2,0.09,0.09,steel,0,1.55,-17,false); sBox(stageGroup,34.2,0.09,0.09,steel,0,0.85,-17,false);
sBox(stageGroup,14,0.09,0.09,steel,-10,1.55,17,false); sBox(stageGroup,14,0.09,0.09,steel,-10,0.85,17,false);
sBox(stageGroup,14,0.09,0.09,steel,10,1.55,17,false); sBox(stageGroup,14,0.09,0.09,steel,10,0.85,17,false);
sBox(stageGroup,0.09,0.09,34.2,steel,-17,1.55,0,false); sBox(stageGroup,0.09,0.09,34.2,steel,-17,0.85,0,false);
sBox(stageGroup,0.09,0.09,34.2,steel,17,1.55,0,false); sBox(stageGroup,0.09,0.09,34.2,steel,17,0.85,0,false);
})();
makeRelayTower(-72,44,36);
makeRelayTower(68,-52,32);
makeRadarAt(58,56); makeRadarAt(-52,-60); makeRadarAt(-88,6);
var st=makeBuilding(-38,16,21,13,9.5,texWhite,0xdcd8cc,'office',42000000,2600); setHp(st,110);
addSign(st.group,6.4,1.5,'送信所','#7a1f2b','#f4efe0',0,7.4,6.66,0);
var bc2=makeBuilding(42,-26,19,12,12,texA,null,'office',56000000,3400); setHp(bc2,130);
addSign(bc2.group,8.5,1.6,'放送センター','#1d3a6e','#f4efe0',0,9.9,6.16,0);
var wh=makeBuilding(-26,-44,14,10,6.5,texC,null,'office',18000000,1500); setHp(wh,70);
addSign(wh.group,5.4,1.3,'機材倉庫','#37424a','#f4efe0',0,4.9,5.16,0);
var gh=makeBuilding(24,44,8,7,4.5,texB,0xd8c9ae,'house',6000000,700); setHp(gh,34);
makeFuelTankAt(86,24,false); makeFuelTankAt(78,34,false);
[[30,20,'x',1],[-16,32,'z',-1],[54,-6,'x',-1]].forEach(function(p){ var c=makeCar(p[0],p[1],p[2],p[3]); c.moving=false; c.group.userData.parkRot=c.group.rotation.y; });
makeGreenTree(stageGroup,90,80,1.05); makeGreenTree(stageGroup,-90,80,0.95); makeGreenTree(stageGroup,90,-72,1.0); makeGreenTree(stageGroup,-30,84,0.9); makeGreenTree(stageGroup,70,86,1.0); makeGreenTree(stageGroup,-84,-44,0.95); makeGreenTree(stageGroup,16,-84,0.9); makeGreenTree(stageGroup,98,2,1.0); makeGreenTree(stageGroup,-58,-88,0.9); makeGreenTree(stageGroup,120,60,1.05);
addSkylineRing(24,215,300,16,44,0,Math.PI*2);
document.getElementById('totalNum').textContent=totalCount;
}
function clearStageWorld(){
if(W2.ready)w2ResetWorld();
for(var i=projectiles.length-1;i>=0;i--){ scene.remove(projectiles[i].mesh); }
projectiles.length=0; pendingChains.length=0;
while(stageGroup.children.length>0){ var ch=stageGroup.children[0]; stageGroup.remove(ch); }
destructibles.length=0; cars.length=0; totalCount=0;
beacons.length=0; radarSpinners.length=0; swayTrees.length=0;
for(var ei=0;ei<embers.length;ei++){ scene.remove(embers[ei].mesh); if(embers[ei].mesh.material)embers[ei].mesh.material.dispose(); }
embers.length=0;
clearScorches();
}
function movePadsForStage(id){
var def=STAGE_DEFS[id];
PAD.x=def.pad.x; PAD.z=def.pad.z;
if(heliportGroup)heliportGroup.position.set(PAD.x,0,PAD.z);
if(padPillar)padPillar.position.set(PAD.x,55,PAD.z);
if(padMarker)padMarker.position.set(PAD.x,19,PAD.z);
EH_PAD.x=def.ehPad.x; EH_PAD.z=def.ehPad.z;
if(enemyPadGroup)enemyPadGroup.position.set(EH_PAD.x,0,EH_PAD.z);
FUEL.x=def.fuel.x; FUEL.z=def.fuel.z;
if(fuelGroup){ fuelGroup.position.set(FUEL.x,0,FUEL.z); fuelGroup.visible=true; }
if(fuelPillar){ fuelPillar.position.set(FUEL.x,55,FUEL.z); fuelPillar.visible=true; }
if(fuelMarker){ fuelMarker.position.set(FUEL.x,19,FUEL.z); fuelMarker.visible=true; }
REPAIR.x=def.repair.x; REPAIR.z=def.repair.z;
if(repairGroup)repairGroup.position.set(REPAIR.x,0,REPAIR.z);
if(repairPillar)repairPillar.position.set(REPAIR.x,55,REPAIR.z);
if(repairMarker)repairMarker.position.set(REPAIR.x,19,REPAIR.z);
if(typeof eheli!=='undefined'&&eheli&&!ehState.active&&!ehState.down){ eheli.position.set(EH_PAD.x,1.85,EH_PAD.z); }
}
/* ================= SIM flight model, countermeasures, camera views, flight HUD ================= */
var SIMMODE=false, SIM={pitch:0,roll:0,coll:0.5,collKb:0.5}, VIEWMODE=0;
var FLARE={n:24,cd:0,t:0}, flares=[];
function onFlightModelChanged(){ SIM.pitch=heliState.pitch||0; SIM.roll=heliState.roll||0; SIM.collKb=0.5; try{ toast(SETTINGS.flight==='sim'?'飛行モデル: シミュレーター':'飛行モデル: アーケード'); }catch(e){} }
function simTorque(){ return -(SIM.coll-0.5)*0.55; }
function simStep(dt,mx,mz,climbK){
var S=SIM,sens=SETTINGS.sens,g=9.81;
var padCol=JOY.connected&&JOY.collActive;
S.collKb=clamp(S.collKb+climbK*dt*0.5,0,1);
if(!padCol&&Math.abs(climbK)<0.05)S.collKb+=(0.5-S.collKb)*Math.min(1,dt*1.3);
var coll=padCol?clamp(JOY.coll+climbK*0.0,0,1):S.collKb; S.coll=coll;
S.pitch+=(-mz*1.05*sens)*dt; S.roll+=(-mx*1.35*sens)*dt;
S.pitch*=Math.exp(-(Math.abs(mz)<0.05?0.7:0.12)*dt); S.roll*=Math.exp(-(Math.abs(mx)<0.05?0.8:0.12)*dt);
S.pitch=clamp(S.pitch,-0.62,0.5); S.roll=clamp(S.roll,-0.75,0.75);
var sy=Math.sin(heliState.yaw),cy=Math.cos(heliState.yaw),fx=-sy,fz=-cy,rx=cy,rz=-sy;
var tx=fx*Math.sin(S.pitch)-rx*Math.sin(S.roll),tz=fz*Math.sin(S.pitch)-rz*Math.sin(S.roll),ty=Math.cos(S.pitch)*Math.cos(S.roll);
var tl=Math.sqrt(tx*tx+ty*ty+tz*tz); tx/=tl; ty/=tl; tz/=tl;
var v=heliState.vel,hs=Math.sqrt(v.x*v.x+v.z*v.z),agl=heliState.pos.y-groundY(heliState.pos.x,heliState.pos.z);
var dens=1-clamp(heliState.pos.y/7000,0,0.55);
var T=g*(0.12+coll*1.76)*(0.82+0.3*THR)*(1+0.12*Math.min(1,hs/18))*(1+0.16*(1-clamp(agl/10,0,1)))*dens;
var ax=tx*T-v.x*(0.05+0.0014*hs),ay=ty*T-g-v.y*(0.35+0.004*Math.abs(v.y)),az=tz*T-v.z*(0.05+0.0014*hs);
v.x+=ax*dt; v.y+=ay*dt; v.z+=az*dt;
if(agl<2.4){ var f=Math.pow(0.08,dt); v.x*=f; v.z*=f; if(coll<0.4){ S.pitch*=Math.exp(-3*dt); S.roll*=Math.exp(-3*dt); } }
}
/* --- flares: decoys that pull enemy homing missiles off --- */
function fireFlares(){
if(FLARE.cd>0||FLARE.n<=0){ if(FLARE.n<=0)toast('フレア弾切れ'); return; }
FLARE.cd=0.9; FLARE.n--;
var first=null;
for(var i=0;i<4;i++){
var sp=new THREE.Sprite(new THREE.SpriteMaterial({map:texGlow,color:new THREE.Color(6,3.6,1.3),transparent:true,depthWrite:false,blending:THREE.AdditiveBlending})); sp.scale.setScalar(2.4);
sp.position.copy(heliState.pos); sp.position.y-=1.2; scene.add(sp);
var fl={mesh:sp,vel:new THREE.Vector3(rand(-16,16),rand(-4,1),rand(-16,16)).addScaledVector(heliState.vel,0.5),t:0,life:3.4,pt:0}; flares.push(fl); if(!first)first=fl;
}
for(var k=0;k<enemyShots.length;k++){ var s=enemyShots[k]; if(s.kind==='missile'&&s.mesh.position.distanceTo(heliState.pos)<750&&Math.random()<0.85)s.decoy=first; }
if(window.sFlare)sFlare();
}
function updateFlares(dt){
FLARE.cd-=dt; FLARE.t+=dt; if(FLARE.t>14&&FLARE.n<24){ FLARE.t=0; FLARE.n++; }
for(var i=flares.length-1;i>=0;i--){ var f=flares[i]; f.t+=dt; f.vel.y-=7*dt; f.vel.multiplyScalar(Math.pow(0.5,dt)); f.mesh.position.addScaledVector(f.vel,dt);
f.mesh.scale.setScalar(2.2+Math.sin(f.t*40)*0.5); f.mesh.material.opacity=Math.min(1,(f.life-f.t)*2);
f.pt-=dt; if(f.pt<=0){ f.pt=0.06; spawnPuff(f.mesh.position.clone(),0xdedede,1.4,0.9,0.4,0.3); }
if(f.t>=f.life){ scene.remove(f.mesh); f.mesh.material.dispose(); flares.splice(i,1); } }
}
function cycleView(){ VIEWMODE=(VIEWMODE+1)%3; heli.visible=(VIEWMODE!==1); try{ toast(['視点: 後方追尾','視点: コクピット','視点: 遠景'][VIEWMODE]); }catch(e){} }
/* --- flight HUD (canvas overlay) --- */
var H2={cv:null,g:null,w:0,h:0,dpr:1,warnT:0};
function hud2Init(){
var c=document.createElement('canvas'); c.id='simHud'; c.style.cssText='position:fixed;left:0;top:0;width:100%;height:100%;pointer-events:none;z-index:3;display:none'; document.body.appendChild(c); H2.cv=c; H2.g=c.getContext('2d');
}
function hud2Resize(){ var d=Math.min(window.devicePixelRatio||1,1.5),w=window.innerWidth,h=window.innerHeight; if(H2.w!==w||H2.h!==h||H2.dpr!==d){ H2.w=w; H2.h=h; H2.dpr=d; H2.cv.width=w*d; H2.cv.height=h*d; } }
function hud2Draw(dt){
if(!H2.cv)return;
var mode=SETTINGS.hud||'full';
if(G.mode!=='play'||mode==='off'||G.paused){ H2.cv.style.display='none'; return; }
H2.cv.style.display='block'; hud2Resize();
var g=H2.g,d=H2.dpr,W=H2.w,Hh=H2.h; g.setTransform(d,0,0,d,0,0); g.clearRect(0,0,W,Hh);
var GC='#8dffb8',GS='rgba(0,0,0,0.55)',aero=SETTINGS.units==='aero';
var hs=Math.sqrt(heliState.vel.x*heliState.vel.x+heliState.vel.z*heliState.vel.z),vy=heliState.vel.y;
var gY=groundY(heliState.pos.x,heliState.pos.z),agl=Math.max(0,heliState.pos.y-gY),msl=heliState.pos.y;
var hdg=((-heliState.yaw*180/Math.PI)%360+360)%360;
g.font='700 13px ui-monospace,Menlo,Consolas,monospace'; g.textBaseline='middle'; g.lineWidth=1.6;
function T(txt,x,y,al,col){ g.textAlign=al||'left'; g.fillStyle=GS; g.fillText(txt,x+1,y+1); g.fillStyle=col||GC; g.fillText(txt,x,y); }
// heading tape
var cx=W/2,ty=VIEWMODE===1?Hh*0.16:34;
g.strokeStyle=GC; g.fillStyle=GC; g.textAlign='center';
g.save(); g.beginPath(); g.rect(cx-150,ty-14,300,34); g.clip();
for(var a=-90;a<=90;a+=5){ var hv=Math.round((hdg+a)/5)*5,off=(hv-hdg)*2.6; var X=cx+off; if(Math.abs(off)>150)continue; var maj=(hv%30===0); g.beginPath(); g.moveTo(X,ty+(maj?-2:2)); g.lineTo(X,ty+8); g.stroke();
if(maj){ var hh=((hv%360)+360)%360,lab=hh===0?'N':hh===90?'E':hh===180?'S':hh===270?'W':String(hh/10|0).padStart(2,'0'); T(lab,X,ty+18,'center'); } }
g.restore(); g.beginPath(); g.moveTo(cx,ty-10); g.lineTo(cx-6,ty-18); g.lineTo(cx+6,ty-18); g.closePath(); g.fill();
T(String(Math.round(hdg)).padStart(3,'0')+'°',cx,ty-28,'center');
if(mode==='full'||true){
// speed (left) / altitude (right) boxes
var sx=W*0.5-250,ax=W*0.5+250,by=VIEWMODE===1?Hh*0.5:Hh*0.5;
var spd=aero?hs*1.944:hs*3.6; T(Math.round(spd)+(aero?' KT':' km/h'),sx,by,'right');
g.strokeStyle='rgba(141,255,184,0.5)'; g.strokeRect(sx-92,by-13,98,26);
T('GS',sx-100,by-24,'right','rgba(141,255,184,0.7)');
var alt=aero?msl*3.281:msl,ag=aero?agl*3.281:agl; T(Math.round(alt)+(aero?' ft':' m'),ax,by,'left'); g.strokeRect(ax-6,by-13,98,26); T('ALT',ax+92,by-24,'right','rgba(141,255,184,0.7)');
T('AGL '+Math.round(ag),ax,by+26,'left',agl<30?'#ffb04a':GC);
var vsv=aero?vy*196.85:vy; T('VS '+(vy>=0?'+':'')+Math.round(vsv),ax,by+44,'left',vy<-8?'#ffb04a':GC);
// collective + torque bar
var cl=SIMMODE?SIM.coll:clamp(0.5+vy/50,0,1); var thr=THR; var bx=sx-96,bh=90; g.strokeStyle='rgba(141,255,184,0.6)'; g.strokeRect(bx,by+40,10,bh); g.fillStyle=GC; g.fillRect(bx+1,by+40+bh-bh*cl+0,8,bh*cl); T('COLL',bx-2,by+bh+54,'left','rgba(141,255,184,0.75)'); g.strokeRect(bx-18,by+40,10,bh); g.fillStyle='#ffd34a'; g.fillRect(bx-17,by+40+bh-bh*thr,8,bh*thr); T('THR',bx-28,by+bh+54,'left','rgba(255,211,74,0.85)'); T(Math.round(thr*100)+'%',bx-28,by+bh+70,'left','rgba(255,211,74,0.85)');
// attitude indicator
var ar=44,acx=W/2,acy=Hh-72; if(VIEWMODE===1){ acy=Hh-Hh*0.2; }
var pitchReal=-(heliState.pitch||0),rollv=heliState.roll||0;
g.save(); g.beginPath(); g.arc(acx,acy,ar,0,Math.PI*2); g.clip(); g.translate(acx,acy); g.rotate(rollv); var po=clamp(pitchReal,-0.7,0.7)*ar*1.6;
g.fillStyle='rgba(60,120,200,0.55)'; g.fillRect(-ar*2,-ar*2+po,ar*4,ar*2); g.fillStyle='rgba(120,84,48,0.6)'; g.fillRect(-ar*2,po,ar*4,ar*2); g.strokeStyle=GC; g.beginPath(); g.moveTo(-ar,po); g.lineTo(ar,po); g.stroke();
for(var pl=-30;pl<=30;pl+=10){ if(!pl)continue; var yy=po+(-pl*Math.PI/180)*ar*1.6*1.0; g.beginPath(); g.moveTo(-10,yy); g.lineTo(10,yy); g.stroke(); }
g.restore(); g.strokeStyle=GC; g.beginPath(); g.arc(acx,acy,ar,0,Math.PI*2); g.stroke(); g.beginPath(); g.moveTo(acx-18,acy); g.lineTo(acx-6,acy); g.moveTo(acx+6,acy); g.lineTo(acx+18,acy); g.moveTo(acx,acy-6); g.lineTo(acx,acy); g.stroke();
}
// radar / minimap (heading-up)
if(mode==='full'){
var rr=70,rcx=rr+16,rcy=Hh-rr-16,range=700; if(window.matchMedia&&window.matchMedia('(pointer:coarse)').matches){ rcx=W-rr-16; rcy=rr+90; }
g.fillStyle='rgba(6,16,10,0.55)'; g.beginPath(); g.arc(rcx,rcy,rr,0,Math.PI*2); g.fill(); g.strokeStyle='rgba(141,255,184,0.45)'; g.stroke();
g.beginPath(); g.arc(rcx,rcy,rr/2,0,Math.PI*2); g.strokeStyle='rgba(141,255,184,0.18)'; g.stroke();
var cs=Math.cos(heliState.yaw),sn=Math.sin(heliState.yaw);
function RP(x,z){ var dx=x-heliState.pos.x,dz=z-heliState.pos.z; var fwd=dx*(-sn)+dz*(-cs),rgt=dx*cs+dz*(-sn); return [rcx+rgt/range*rr,rcy-fwd/range*rr,Math.hypot(dx,dz)]; }
g.save(); g.beginPath(); g.arc(rcx,rcy,rr-1,0,Math.PI*2); g.clip();
g.fillStyle='rgba(150,160,150,0.5)'; var cnt=0; for(var i=0;i<destructibles.length&&cnt<260;i++){ var o=destructibles[i]; if(o.destroyed||o.isCar)continue; var p=RP(o.group.position.x,o.group.position.z); if(p[2]>range)continue; g.fillRect(p[0]-1.2,p[1]-1.2,2.4,2.4); cnt++; }
function dot(x,z,col,sz){ var p=RP(x,z); var ang=Math.atan2(p[1]-rcy,p[0]-rcx),dd=Math.hypot(p[0]-rcx,p[1]-rcy); if(dd>rr-4){ p[0]=rcx+Math.cos(ang)*(rr-4); p[1]=rcy+Math.sin(ang)*(rr-4); } g.fillStyle=col; g.fillRect(p[0]-sz,p[1]-sz,sz*2,sz*2); }
dot(PAD.x,PAD.z,'#4da3ff',3); dot(FUEL.x,FUEL.z,'#57d977',3); dot(REPAIR.x,REPAIR.z,'#ffd34a',3);
if(ehState.active&&!ehState.down)dot(eheli.position.x,eheli.position.z,'#ff4a3a',3.5); if(jetState.active&&!jetState.down)dot(jet.position.x,jet.position.z,'#ff4a3a',3.5);
for(var m=0;m<enemyShots.length;m++){ if(enemyShots[m].kind==='missile')dot(enemyShots[m].mesh.position.x,enemyShots[m].mesh.position.z,'#ff9a3a',2); }
g.restore(); g.fillStyle=GC; g.beginPath(); g.moveTo(rcx,rcy-6); g.lineTo(rcx-4,rcy+4); g.lineTo(rcx+4,rcy+4); g.closePath(); g.fill(); T('N↑'.replace('N↑','前'),rcx,rcy-rr-8,'center','rgba(141,255,184,0.7)');
T('フレア '+FLARE.n,rcx,rcy+rr+10,'center','rgba(255,214,120,0.9)'); T((SIMMODE?'SIM':'ARC')+'  '+['追尾','CKPT','遠景'][VIEWMODE],rcx,rcy+rr+26,'center','rgba(141,255,184,0.6)');
}
// warnings
H2.warnT+=dt; var blink=Math.floor(H2.warnT*4)%2===0; var wy=VIEWMODE===1?Hh*0.26:Hh*0.2;
var msl2=false; for(var q=0;q<enemyShots.length;q++){ if(enemyShots[q].kind==='missile'&&enemyShots[q].mesh.position.distanceTo(heliState.pos)<420)msl2=true; }
if(agl<35&&vy<-7&&agl>2.5){ if(blink)T('PULL UP',cx,wy,'center','#ff4a3a'); if(window.sPullUp)sPullUp(dt); }
if(msl2){ if(blink)T('⚠ MISSILE — FLARE [R]',cx,wy+22,'center','#ff9a3a'); if(window.sMslWarn)sMslWarn(dt); }
if(heliState.pos.y>1380)T('ALTITUDE LIMIT',cx,wy+44,'center','#ffd34a');
}

/* ================= time of day: sun/moon, sky, fog, light colours, lit windows, landing light ================= */
var TOD={h:15.5,flow:false,sunDir:new THREE.Vector3(0.4,0.8,0.4),moonDir:new THREE.Vector3(-0.4,-0.8,-0.4),lightDir:new THREE.Vector3(0.4,0.8,0.4),e:0.8,lamp:null};
function _ss(a,b,x){ var t=Math.min(1,Math.max(0,(x-a)/(b-a))); return t*t*(3-2*t); }
var _tc1=new THREE.Color(),_tc2=new THREE.Color(),_tc3=new THREE.Color();
function todStep(dt){
if(TOD.flow&&G.mode==='play'){ TOD.h=(TOD.h+dt*0.02)%24; }
var h=TOD.h,ang=Math.PI*(h-6)/12;
TOD.sunDir.set(-Math.cos(ang)*0.9,Math.sin(ang),0.42).normalize(); TOD.moonDir.copy(TOD.sunDir).multiplyScalar(-1);
var e=TOD.sunDir.y; TOD.e=e;
var dayK=_ss(-0.06,0.38,e),nightK=1-_ss(-0.14,0.04,e),warm=1-_ss(0.06,0.5,e),sunsetK=Math.exp(-Math.pow((e-0.04)/0.2,2));
var sunI=_ss(-0.03,0.5,e)*1.65, moonI=nightK*0.16;
if(e>=0.01){ TOD.lightDir.copy(TOD.sunDir); _tc1.setRGB(1,0.96,0.9); _tc2.setRGB(1,0.5,0.18); _tc1.lerp(_tc2,warm*0.9); sun.color.copy(_tc1); sun.intensity=sunI*LG; }
else { TOD.lightDir.copy(TOD.moonDir); sun.color.setRGB(0.55,0.68,1.0); sun.intensity=moonI*LG; }
// hemisphere: sky colour follows the day, ground bounce stays warm
_tc1.setHex(0x0b1430); _tc2.setHex(0xbfd9f2); hemi.color.copy(_tc1).lerp(_tc2,dayK); _tc3.setHex(0xf0a070); hemi.color.lerp(_tc3,sunsetK*0.35);
hemi.groundColor.setHex(0x1a1a22).lerp(_tc1.setHex(0x6b5f45),dayK);
hemi.intensity=lerp(0.07,0.62,dayK)*LG*(1+sunsetK*0.1); amb.intensity=lerp(0.03,0.14,dayK)*LG;
// fog / horizon haze
_tc1.setHex(0x050a18); _tc2.setHex(0xd6d4c4); scene.fog.color.copy(_tc1).lerp(_tc2,dayK); _tc3.setRGB(0.86,0.56,0.38); scene.fog.color.lerp(_tc3,sunsetK*0.8*dayK+sunsetK*0.25);
renderer.toneMappingExposure=lerp(1.35,1.18,dayK);
DUSK.cur=1-_ss(0.02,0.4,e); DUSK.sunset=sunsetK; DUSK.night=nightK;
// landing light on the helicopter at night
if(!TOD.lamp&&typeof heli!=='undefined'&&heli){ var sl=new THREE.SpotLight(0xfff0d0,0,260,0.46,0.55,1.6); sl.position.set(2.2,-.2,0); sl.target.position.set(40,-14,0); heli.add(sl); heli.add(sl.target); TOD.lamp=sl; }
if(TOD.lamp)TOD.lamp.intensity=_ss(0.1,0.7,DUSK.cur)*2600;
w2Fog(0);
}
function todSet(h){ TOD.h=((h%24)+24)%24; todStep(0); }
function todLabel(h){ var hh=Math.floor(h),mm=Math.floor((h-hh)*60); return (hh<10?'0':'')+hh+':'+(mm<10?'0':'')+mm; }

/* sky-matched image-based lighting: re-bake the reflection environment from the real sky shader as the time of day changes */
var ENVS={scene:null,mat:null,rt:null,lastE:9,lastN:9,t:0};
function envUpdate(dt,force){
if(!W2.ready||!W2.sky)return; ENVS.t-=dt;
if(!force){ if(ENVS.t>0)return; if(Math.abs(TOD.e-ENVS.lastE)<0.04&&Math.abs(DUSK.night-ENVS.lastN)<0.07)return; }
ENVS.t=2.5; ENVS.lastE=TOD.e; ENVS.lastN=DUSK.night;
try{
if(!ENVS.scene){ ENVS.scene=new THREE.Scene(); ENVS.mat=W2.sky.material.clone(); ENVS.scene.add(new THREE.Mesh(new THREE.SphereGeometry(10,32,16),ENVS.mat)); }
var su=W2.sky.material.uniforms,du=ENVS.mat.uniforms; for(var k in su){ if(du[k]&&du[k].value&&du[k].value.copy)du[k].value.copy(su[k].value); else if(du[k])du[k].value=su[k].value; } du.uAlt.value=0;
var pm=new THREE.PMREMGenerator(renderer); var rt=pm.fromScene(ENVS.scene,0,0.1,100); pm.dispose();
var old=ENVS.rt; ENVS.rt=rt; envMapTex=rt.texture;
for(var i=0;i<envMats.length;i++){ var m=envMats[i]; m.envMap=envMapTex; m.envMapIntensity=m.userData.envI||0.4; }
if(W2.water){ W2.water.material.envMap=envMapTex; W2.water.material.envMapIntensity=1.5; }
if(old)old.dispose();
}catch(e){ console.warn('env',e); }
}

var FUELMAX=150;
/* airport: slide parked airliners clear of hangars, terminals and each other (no more clipping) */
function airlinerFix(){
var planes=destructibles.filter(function(o){ return o.type==='airliner'; }); if(!planes.length)return;
var obs=[];
stageGroup.children.forEach(function(ch){
for(var i=0;i<planes.length;i++)if(planes[i].group===ch)return;
var b=new THREE.Box3().setFromObject(ch); if(b.isEmpty())return;
if(b.max.x-b.min.x>150||b.max.z-b.min.z>150||b.max.y<2.6)return; obs.push(b);
});
var placed=[];
function free(cx,cz){
var b=new THREE.Box3(new THREE.Vector3(cx-22,0.2,cz-18),new THREE.Vector3(cx+22,17,cz+18));
for(var i=0;i<obs.length;i++)if(b.intersectsBox(obs[i]))return false;
for(var j=0;j<placed.length;j++)if(b.intersectsBox(placed[j]))return false;
return Math.abs(cx)<150&&Math.abs(cz)<150;
}
planes.forEach(function(pl){
var g=pl.group,ox=g.position.x,oz=g.position.z,cands=[];
for(var dx=-70;dx<=70;dx+=4)for(var dz=-50;dz<=50;dz+=4)cands.push([dx,dz,dx*dx+dz*dz*1.4]);
cands.sort(function(a,b){ return a[2]-b[2]; });
var pick=null; for(var k=0;k<cands.length;k++){ if(free(ox+cands[k][0],oz+cands[k][1])){ pick=cands[k]; break; } }
var nx=pick?ox+pick[0]:ox,nz=pick?oz+pick[1]:oz; g.position.x=nx; g.position.z=nz; if(pl.baseX!==undefined){ pl.baseX=nx; pl.baseZ=nz; }
placed.push(new THREE.Box3(new THREE.Vector3(nx-22,0.2,nz-18),new THREE.Vector3(nx+22,17,nz+18)));
});
}

/* ================= helicopter v2 extras: painted skin + normal map, rotor wash, 3D cockpit ================= */
var HSKIN=null,tadsGroup=null,COCKPIT=null;
function heliSkinMaps(){
if(HSKIN)return HSKIN;
var W=1024,H=2048,c=document.createElement('canvas'); c.width=W; c.height=H; var g=c.getContext('2d');
g.fillStyle='#585f4c'; g.fillRect(0,0,W,H);
var tones=['#4a5240','#666b55','#3d4636','#707558','#525a45'];
for(var i=0;i<260;i++){ g.fillStyle=tones[i%tones.length]; g.globalAlpha=0.35+Math.random()*0.3; g.beginPath(); var x=Math.random()*W,y=Math.random()*H,rx=30+Math.random()*130,ry=40+Math.random()*190; g.ellipse(x,y,rx,ry,Math.random()*3,0,Math.PI*2); g.fill(); }
g.globalAlpha=1;
var hc=document.createElement('canvas'); hc.width=W; hc.height=H; var hg=hc.getContext('2d'); hg.fillStyle='#b4b4b4'; hg.fillRect(0,0,W,H);
// panel grid
var vl=[],ul=[]; for(var v=0;v<H;v+=96+Math.floor(Math.random()*70))vl.push(v); for(var u=0;u<W;u+=128+Math.floor(Math.random()*100))ul.push(u);
g.lineWidth=1.4; hg.lineWidth=3;
vl.forEach(function(y){ g.strokeStyle='rgba(18,20,16,0.55)'; g.beginPath(); g.moveTo(0,y); g.lineTo(W,y); g.stroke(); g.strokeStyle='rgba(200,205,180,0.16)'; g.beginPath(); g.moveTo(0,y+2); g.lineTo(W,y+2); g.stroke(); hg.strokeStyle='#505050'; hg.beginPath(); hg.moveTo(0,y); hg.lineTo(W,y); hg.stroke();
for(var x=4;x<W;x+=15){ g.fillStyle='rgba(20,22,18,0.55)'; g.fillRect(x,y-4,2,2); g.fillStyle='rgba(215,220,195,0.2)'; g.fillRect(x+1,y-5,1,1); hg.fillStyle='#ffffff'; hg.fillRect(x,y-5,3,3); } });
ul.forEach(function(x){ g.strokeStyle='rgba(18,20,16,0.5)'; g.beginPath(); g.moveTo(x,0); g.lineTo(x,H); g.stroke(); hg.strokeStyle='#585858'; hg.beginPath(); hg.moveTo(x,0); hg.lineTo(x,H); hg.stroke(); });
// access panels, hatches
for(var p=0;p<46;p++){ var px=Math.random()*W,py=Math.random()*H,pw=40+Math.random()*90,ph=26+Math.random()*60; g.fillStyle='rgba(180,185,160,0.10)'; g.fillRect(px,py,pw,ph); g.strokeStyle='rgba(20,22,18,0.6)'; g.strokeRect(px,py,pw,ph); hg.strokeStyle='#484848'; hg.lineWidth=2; hg.strokeRect(px,py,pw,ph);
for(var q=0;q<4;q++){ g.fillStyle='rgba(30,32,28,0.7)'; g.fillRect(px+3+q*(pw-9)/3,py+3,3,3); g.fillRect(px+3+q*(pw-9)/3,py+ph-6,3,3); } }
// stencils
g.font='700 22px Arial,sans-serif'; g.textBaseline='middle';
var stn=[['U.S. ARMY',0.14,0.30],['NO STEP',0.40,0.22],['AH-64',0.10,0.42],['07-0742',0.6,0.55],['DANGER',0.34,0.12],['REMOVE BEFORE FLIGHT',0.75,0.30]];
stn.forEach(function(s){ g.save(); g.translate(s[1]*W,s[2]*H); g.rotate(-Math.PI/2); g.fillStyle='rgba(235,235,215,0.78)'; g.fillText(s[0],0,0); g.restore(); });
g.fillStyle='rgba(235,200,40,0.8)'; for(var hz=0;hz<8;hz++){ g.save(); g.translate(0.52*W+hz*14,0.8*H); g.rotate(0.6); g.fillRect(0,0,6,70); g.restore(); }
// weathering: soot aft of exhausts, oil, streaks, scratches
var sg=g.createLinearGradient(0,H*0.30,0,H*0.46); sg.addColorStop(0,'rgba(10,10,8,0)'); sg.addColorStop(0.5,'rgba(10,10,8,0.5)'); sg.addColorStop(1,'rgba(10,10,8,0)'); g.fillStyle=sg; g.fillRect(0,H*0.30,W*0.5,H*0.16);
for(var s2=0;s2<420;s2++){ g.fillStyle='rgba(15,15,10,'+(0.03+Math.random()*0.08).toFixed(3)+')'; g.fillRect(Math.random()*W,Math.random()*H,1+Math.random()*3,20+Math.random()*130); }
for(var o2=0;o2<28;o2++){ var rg2=g.createRadialGradient(0,0,0,0,0,40+Math.random()*50); rg2.addColorStop(0,'rgba(12,10,6,0.45)'); rg2.addColorStop(1,'rgba(12,10,6,0)'); g.save(); g.translate(Math.random()*W,Math.random()*H); g.fillStyle=rg2; g.fillRect(-100,-100,200,200); g.restore(); }
g.strokeStyle='rgba(205,205,190,0.4)'; g.lineWidth=1; for(var sc=0;sc<180;sc++){ var sx=Math.random()*W,sy=Math.random()*H; g.beginPath(); g.moveTo(sx,sy); g.lineTo(sx+(Math.random()-0.5)*50,sy+(Math.random()-0.5)*50); g.stroke(); }
// normal map from the height canvas (Sobel)
var hd=hg.getImageData(0,0,W,H).data,nc=document.createElement('canvas'); nc.width=W; nc.height=H; var ng=nc.getContext('2d'),nid=ng.createImageData(W,H),nd=nid.data;
for(var y=1;y<H-1;y++)for(var x=1;x<W-1;x++){ var i0=(y*W+x)*4; var dx=(hd[i0+4]-hd[i0-4])/255*2.2,dy=(hd[i0+W*4]-hd[i0-W*4])/255*2.2; var l=1/Math.sqrt(dx*dx+dy*dy+1); nd[i0]=(-dx*l*0.5+0.5)*255; nd[i0+1]=(dy*l*0.5+0.5)*255; nd[i0+2]=(l*0.5+0.5)*255; nd[i0+3]=255; }
ng.putImageData(nid,0,0);
var map=new THREE.CanvasTexture(c); map.wrapS=map.wrapT=THREE.RepeatWrapping; map.colorSpace=THREE.SRGBColorSpace; map.anisotropy=MAX_ANISO;
var nm=new THREE.CanvasTexture(nc); nm.wrapS=nm.wrapT=THREE.RepeatWrapping; nm.anisotropy=MAX_ANISO;
return (HSKIN={map:map,normal:nm});
}
/* rotor wash: dust (or spray over water) blown outwards when flying low */
var _washT=0;
function rotorWash(dt){
if(G.mode!=='play'||G.paused)return;
var gY=groundY(heliState.pos.x,heliState.pos.z),agl=heliState.pos.y-gY; if(agl>28)return;
_washT-=dt; if(_washT>0)return; var k=1-agl/28; _washT=0.05/(0.25+k);
var water=terrainH(heliState.pos.x,heliState.pos.z)<0;
for(var i=0;i<2;i++){ var a=rand(0,Math.PI*2),r=rand(2,7),sp=rand(7,15)*(0.4+k);
PS.emit(2,heliState.pos.x+Math.cos(a)*r,gY+0.6,heliState.pos.z+Math.sin(a)*r,Math.cos(a)*sp+heliState.vel.x*0.3,rand(0.5,2.2),Math.sin(a)*sp+heliState.vel.z*0.3,rand(3,6.5),1.3,rand(1.3,2.2),water?1:0,0,rand(0.18,0.34)*k,1.7,0.3,-0.3); }
}
/* ---------- 3D cockpit (camera-mounted) ---------- */
function mfdCanvas(){ var c=document.createElement('canvas'); c.width=c.height=256; return c; }
function buildCockpit(){
if(COCKPIT)return COCKPIT;
var grp=new THREE.Group(),dark=new THREE.MeshStandardMaterial({color:0x1a1d20,roughness:0.78,metalness:0.2,emissive:0x040506}),trim=new THREE.MeshStandardMaterial({color:0x2c3136,roughness:0.6,metalness:0.4,emissive:0x050606});
var dash=new THREE.Mesh(loft([{x:-0.78,w:0.05,h:0.05,y:0},{x:-0.7,w:0.5,h:0.3,y:0,p:3},{x:0,w:0.8,h:0.36,y:0,p:3.4},{x:0.7,w:0.5,h:0.3,y:0,p:3},{x:0.78,w:0.05,h:0.05,y:0}],12,1),dark); dash.rotation.set(0,Math.PI/2,0); dash.position.set(0,-0.46,-0.82); dash.scale.set(1,1,1.2); grp.add(dash);
var hood=new THREE.Mesh(new THREE.BoxGeometry(1.55,0.07,0.34),trim); hood.position.set(0,-0.22,-0.98); hood.rotation.x=0.38; grp.add(hood);
// MFDs
COCKPIT_MFD=[mfdCanvas(),mfdCanvas(),mfdCanvas()]; var tex=COCKPIT_MFD.map(function(cv){ var t=new THREE.CanvasTexture(cv); t.colorSpace=THREE.SRGBColorSpace; return t; });
[[-0.36,-0.31,0],[0,-0.33,1],[0.36,-0.31,2]].forEach(function(p){ var m=new THREE.Mesh(new THREE.PlaneGeometry(0.27,0.27),new THREE.MeshBasicMaterial({map:tex[p[2]],toneMapped:false})); m.position.set(p[0],p[1],-0.66); m.rotation.x=-0.5; grp.add(m);
var bez=new THREE.Mesh(new THREE.BoxGeometry(0.3,0.3,0.03),trim); bez.position.set(p[0],p[1]-0.005,-0.672); bez.rotation.x=-0.5; grp.add(bez); });
// cyclic + collective
var stick=new THREE.Group(); stick.position.set(0,-0.88,-0.42); var shaft=new THREE.Mesh(new THREE.CylinderGeometry(0.014,0.02,0.46,8),trim); shaft.position.y=0.23; stick.add(shaft); var grip=new THREE.Mesh(new THREE.CylinderGeometry(0.03,0.026,0.13,10),dark); grip.position.y=0.5; stick.add(grip); var hat=new THREE.Mesh(new THREE.SphereGeometry(0.014,8,6),new THREE.MeshBasicMaterial({color:0xc04030})); hat.position.set(0,0.57,-0.02); stick.add(hat); grp.add(stick);
var coll=new THREE.Group(); coll.position.set(-0.62,-0.84,-0.28); var cl=new THREE.Mesh(new THREE.CylinderGeometry(0.016,0.016,0.52,8),trim); cl.rotation.x=Math.PI/2; cl.position.z=-0.26; coll.add(cl); var cg2=new THREE.Mesh(new THREE.CylinderGeometry(0.03,0.026,0.15,10),dark); cg2.rotation.x=Math.PI/2; cg2.position.z=-0.55; coll.add(cg2); grp.add(coll);
// canopy bows + rails
[[-1.3,0.62,-1.15],[0,0.82,-1.18],[1.3,0.62,-1.15]].forEach(function(a){ });
function bow(z,w,h){ var pts=[]; for(var t=0;t<=10;t++){ var ang=Math.PI*(t/10); pts.push([Math.cos(ang)*w,Math.sin(ang)*h-0.34,z]); } var tb=new THREE.Mesh(tubeArc(pts,0.025,16),dark); grp.add(tb); }
bow(-1.15,1.05,0.95); bow(-0.1,1.12,1.0); bow(-1.9,0.75,0.8);
[[-1.0,0.05,-0.1,-1.2],[1.0,0.05,-0.1,-1.2]].forEach(function(r){ var rail=new THREE.Mesh(new THREE.BoxGeometry(0.05,0.05,1.9),dark); rail.position.set(r[0],r[1]-0.34,-1.05); grp.add(rail); });
COCKPIT={grp:grp,stick:stick,coll:coll,tex:tex,t:0}; grp.visible=false; camera.add(grp); scene.add(camera); return COCKPIT;
}
var COCKPIT_MFD=null;
function cockpitUpdate(dt){
if(!COCKPIT)return; var vis=(VIEWMODE===1&&G.mode==='play'); COCKPIT.grp.visible=vis; if(!vis)return;
var mx=0,mz=0; mx=(actDown('right')?1:0)-(actDown('left')?1:0)+JOY.roll; mz=(actDown('back')?1:0)-(actDown('forward')?1:0)+JOY.pitch;
COCKPIT.stick.rotation.x+=(clamp(mz,-1,1)*0.32-COCKPIT.stick.rotation.x)*Math.min(1,dt*10); COCKPIT.stick.rotation.z+=(-clamp(mx,-1,1)*0.32-COCKPIT.stick.rotation.z)*Math.min(1,dt*10);
var cp=SIMMODE?SIM.coll:clamp(0.5+heliState.vel.y/50,0,1); COCKPIT.coll.rotation.x=(0.5-cp)*0.55;
COCKPIT.t-=dt; if(COCKPIT.t>0)return; COCKPIT.t=0.14;
var night=DUSK.cur,glow='#7dffb0';
// MFD 0: flight data
var g=COCKPIT_MFD[0].getContext('2d'); g.fillStyle='#040a06'; g.fillRect(0,0,256,256); g.strokeStyle=glow; g.fillStyle=glow; g.lineWidth=2; g.font='700 20px monospace'; g.textBaseline='middle';
var gy=groundY(heliState.pos.x,heliState.pos.z),spd=Math.hypot(heliState.vel.x,heliState.vel.z),hdg=((-heliState.yaw*180/Math.PI)%360+360)%360;
g.save(); g.beginPath(); g.arc(128,100,72,0,6.283); g.clip(); g.translate(128,100); g.rotate(heliState.roll||0); var po=clamp(-(heliState.pitch||0),-0.7,0.7)*110; g.fillStyle='#1f4f8f'; g.fillRect(-120,-120+po,240,120); g.fillStyle='#6b4a2a'; g.fillRect(-120,po,240,120); g.strokeStyle='#fff'; g.beginPath(); g.moveTo(-90,po); g.lineTo(90,po); g.stroke(); g.restore(); g.strokeStyle=glow; g.beginPath(); g.arc(128,100,72,0,6.283); g.stroke(); g.beginPath(); g.moveTo(98,100); g.lineTo(118,100); g.moveTo(138,100); g.lineTo(158,100); g.stroke();
g.fillStyle=glow; g.textAlign='center'; g.fillText(Math.round(hdg)+'°',128,196); g.textAlign='left'; g.fillText(Math.round(spd*3.6)+' km/h',10,226); g.textAlign='right'; g.fillText(Math.round(heliState.pos.y)+' m',248,226);
// MFD 1: engine / power
g=COCKPIT_MFD[1].getContext('2d'); g.fillStyle='#040a06'; g.fillRect(0,0,256,256); g.strokeStyle=glow; g.fillStyle=glow; g.font='700 18px monospace'; g.textAlign='left';
var bars=[['THR',THR],['COLL',SIMMODE?SIM.coll:clamp(0.5+heliState.vel.y/50,0,1)],['FUEL',G.time/FUELMAX],['HP',clamp(G.heliHp/100,0,1)]];
bars.forEach(function(b,i){ var y=34+i*50; g.fillStyle=glow; g.fillText(b[0],12,y); g.strokeRect(80,y-12,150,22); g.fillStyle=(b[0]==='HP'&&b[1]<0.35)||(b[0]==='FUEL'&&b[1]<0.2)?'#ff5a3a':glow; g.fillRect(82,y-10,146*clamp(b[1],0,1),18); });
g.fillStyle=glow; g.fillText('FLARE '+FLARE.n,12,236);
// MFD 2: radar
g=COCKPIT_MFD[2].getContext('2d'); g.fillStyle='#040a06'; g.fillRect(0,0,256,256); g.strokeStyle='rgba(125,255,176,0.5)'; g.lineWidth=1.5; g.beginPath(); g.arc(128,128,110,0,6.283); g.stroke(); g.beginPath(); g.arc(128,128,55,0,6.283); g.stroke();
var cs=Math.cos(heliState.yaw),sn=Math.sin(heliState.yaw),range=700;
function rp(x,z){ var dx=x-heliState.pos.x,dz=z-heliState.pos.z; var f=dx*(-sn)+dz*(-cs),r=dx*cs+dz*(-sn); return [128+r/range*110,128-f/range*110]; }
g.fillStyle='rgba(150,170,150,0.7)'; var n=0; for(var i=0;i<destructibles.length&&n<240;i++){ var o=destructibles[i]; if(o.destroyed||o.isCar)continue; var p=rp(o.group.position.x,o.group.position.z); if(Math.hypot(p[0]-128,p[1]-128)>108)continue; g.fillRect(p[0]-1.5,p[1]-1.5,3,3); n++; }
function mark(x,z,col){ var p=rp(x,z); var ang=Math.atan2(p[1]-128,p[0]-128),d=Math.hypot(p[0]-128,p[1]-128); if(d>104){ p[0]=128+Math.cos(ang)*104; p[1]=128+Math.sin(ang)*104; } g.fillStyle=col; g.fillRect(p[0]-3,p[1]-3,6,6); }
mark(PAD.x,PAD.z,'#4da3ff'); mark(FUEL.x,FUEL.z,'#57d977'); mark(REPAIR.x,REPAIR.z,'#ffd34a'); if(ehState.active&&!ehState.down)mark(eheli.position.x,eheli.position.z,'#ff4a3a'); if(jetState.active&&!jetState.down)mark(jet.position.x,jet.position.z,'#ff4a3a');
g.fillStyle=glow; g.beginPath(); g.moveTo(128,120); g.lineTo(123,134); g.lineTo(133,134); g.closePath(); g.fill();
for(var k=0;k<3;k++)COCKPIT.tex[k].needsUpdate=true;
}

function loadStage(id){
currentStage=id; FREE=(id==='world'); w2SetMetro(id==='city'||id==='office'); document.body.classList.toggle('free',FREE);
clearStageWorld();
if(roadsGroup)roadsGroup.visible=(id==='city'||id==='office');
if(treesGroup)treesGroup.visible=(id==='city'); // school has its own sakura / shade trees now
movePadsForStage(id);
if(id==='city'){ cityBase.material.color.setHex(0xa3a6a0); buildCityStage(); spawnCityCars(); }
else if(id==='school')buildSchoolStage();
else if(id==='military')buildMilitaryStage();
else if(id==='airport'||id==='world')buildAirportStage();
else if(id==='office')buildOfficeStage();
else if(id==='radio')buildRadioStage();
else buildHighwayStage();
if(id!=='school')enhanceHyperRealism(id);
// parked cars sit dark: kill their headlight glow (moving traffic keeps it)
for(var ci9=0;ci9<cars.length;ci9++){ var cc9=cars[ci9]; if(!cc9.moving&&cc9.group.userData.lights)cc9.group.userData.lights.forEach(function(s){ s.visible=false; }); }
document.getElementById('totalNum').textContent=totalCount;
heliState.pos.set(PAD.x,26,PAD.z); heliState.vel.set(0,0,0);
if(typeof heli!=='undefined'&&heli)heli.position.copy(heliState.pos);
if(W2.ready){ W2.queue.dirty=true; w2Stream(true); }
updateStageBestLine();
}
function updateStageBestLine(){
var nm=STAGE_DEFS[currentStage].name;
var bb=bestByStage[currentStage];
var el1=document.getElementById('stageBest'); if(el1)el1.textContent=bb?('ベスト記録（'+nm+'）： スコア '+fmt(bb.score)+' ／ 破壊率 '+bb.rate.toFixed(1)+'% ／ ランク '+bb.rank):('ベスト記録（'+nm+'）： まだなし');
var bl=document.getElementById('bestLine'); if(bl)bl.innerHTML=bb?('ベスト記録（'+nm+'）： スコア <b>'+fmt(bb.score)+'</b> ／ 破壊率 '+bb.rate.toFixed(1)+'% ／ ランク '+bb.rank):('ベスト記録（'+nm+'）： まだなし — まずは更地にしよう');
}

/* ================= helicopter ================= */
var heli=new THREE.Group();
var rotorMain, rotorTail, heliBodyMat, rotorBlur, tailBlur, heliStrobe, gunTurret, gunBarrel, gunMuzzle;
var heliExhaust=[];
function heliTex(){
var c=document.createElement('canvas'); c.width=c.height=256; var g=c.getContext('2d');
g.fillStyle='#46564a'; g.fillRect(0,0,256,256);
// disruptive two-tone camo blotches + grime (real airframes are never one flat colour)
var cols=['#3a4a3f','#526355','#2f3d33','#5d6d58'];
for(var i=0;i<46;i++){ g.fillStyle=cols[i%4]; g.globalAlpha=0.5; g.beginPath(); g.ellipse(Math.random()*256,Math.random()*256,18+Math.random()*44,10+Math.random()*26,Math.random()*3,0,Math.PI*2); g.fill();}
g.globalAlpha=1;
for(var n=0;n<2600;n++){ g.fillStyle='rgba('+(Math.random()<0.5?'0,0,0':'255,255,255')+','+(Math.random()*0.06).toFixed(3)+')'; g.fillRect(Math.random()*256,Math.random()*256,2,2);}
// panel lines + rivet rows
g.strokeStyle='rgba(16,20,17,0.5)'; g.lineWidth=1.4;
for(var px=0;px<=256;px+=52){ g.beginPath(); g.moveTo(px,0); g.lineTo(px,256); g.stroke();}
for(var py=0;py<=256;py+=64){ g.beginPath(); g.moveTo(0,py); g.lineTo(256,py); g.stroke();}
g.fillStyle='rgba(20,24,20,0.65)';
for(var rx=8;rx<256;rx+=16)for(var ry=8;ry<256;ry+=64){ g.fillRect(rx,ry,2,2);}
// exhaust soot streaks
for(var st=0;st<10;st++){ var grd=g.createLinearGradient(0,0,60,0); grd.addColorStop(0,'rgba(20,18,14,0.35)'); grd.addColorStop(1,'rgba(20,18,14,0)'); g.save(); g.translate(Math.random()*200,Math.random()*256); g.fillStyle=grd; g.fillRect(0,0,60,5); g.restore();}
var t=new THREE.CanvasTexture(c); t.wrapS=t.wrapT=THREE.RepeatWrapping; if(THREE.SRGBColorSpace)t.colorSpace=THREE.SRGBColorSpace; return t;
}
(function buildHeli(){
buildHeliPlayer();
heli.scale.setScalar(0.92);
heli.rotation.order='YXZ';
scene.add(heli);
})();

/* ================= effects ================= */
var effects=[]; // {kind, t, dur,...}
/* ---- realism pass: blinking aviation obstruction lights on tall
   buildings + smouldering embers left in fresh rubble ---- */
var beacons=[]; // {o, m, s, ph}
var embers=[]; // {mesh, t, dur, s0, ph, smokeT, x, z}
var _bcGeo=null,_bcMat=null,_bcGlowMat=null;
function addBeacon(o){
if(!_bcGeo){ _bcGeo=new THREE.SphereGeometry(0.34,8,6); _bcMat=new THREE.MeshBasicMaterial({color:0xff2a20}); _bcGlowMat=new THREE.SpriteMaterial({map:texGlow,color:new THREE.Color(0xff3524).multiplyScalar(3),transparent:true,opacity:0.85,blending:THREE.AdditiveBlending,depthWrite:false}); }
var m=new THREE.Mesh(_bcGeo,_bcMat); m.position.set(0,o.height+0.42,0); o.group.add(m);
var s=new THREE.Sprite(_bcGlowMat); s.scale.set(4.6,4.6,1); s.position.copy(m.position); o.group.add(s);
beacons.push({o:o,m:m,s:s,ph:Math.random()*1.7});
}
function spawnEmber(pos,w){
if(embers.length>=22){ var old=embers.shift(); scene.remove(old.mesh); if(old.mesh.material)old.mesh.material.dispose(); }
var mat=new THREE.SpriteMaterial({map:texGlow,color:0xff7a26,transparent:true,opacity:0.4,blending:THREE.AdditiveBlending,depthWrite:false});
var sp=new THREE.Sprite(mat); var s0=rand(3.5,6.5)+w*0.22; sp.scale.set(s0,s0*0.6,1); sp.position.set(pos.x,1.1,pos.z); scene.add(sp);
embers.push({mesh:sp,t:0,dur:rand(13,21),s0:s0,ph:rand(0,6),smokeT:rand(0.2,0.9),x:pos.x,z:pos.z});
}
/* scorch marks: soft black radial burns left on the ground by blasts,
   fading over ~a minute, capped so a long rampage stays cheap */
var scorches=[];
var _scorchGeo=null;
function addScorch(pos,scale){
if(!_scorchGeo)_scorchGeo=new THREE.PlaneGeometry(1,1);
if(scorches.length>=22){ var so=scorches.shift(); scene.remove(so.mesh); so.mesh.material.dispose(); }
var m=new THREE.Mesh(_scorchGeo,new THREE.MeshBasicMaterial({map:texGlow,color:0x141210,transparent:true,opacity:0,depthWrite:false}));
m.rotation.x=-Math.PI/2; m.rotation.z=rand(0,3);
var ss3=(6.5+rand(0,3.5))*Math.min(scale,1.8); m.scale.set(ss3,ss3,1);
m.position.set(pos.x,0.1+(scorches.length%8)*0.004,pos.z); m.renderOrder=1; scene.add(m);
scorches.push({mesh:m,t:0,dur:55});
}
function clearScorches(){ for(var si=0;si<scorches.length;si++){ scene.remove(scorches[si].mesh); scorches[si].mesh.material.dispose(); } scorches.length=0; }
var particlePool=[];
function spawnPuff(pos,color,size,up,dur,opacity){
var geo=new THREE.BufferGeometry(); var n=1; var positions=new Float32Array([pos.x,pos.y,pos.z]);
geo.setAttribute('position',new THREE.BufferAttribute(positions,3));
var mat=new THREE.PointsMaterial({size:size,map:texPuff,color:color,transparent:true,opacity:opacity,depthWrite:false});
var pts=new THREE.Points(geo,mat); scene.add(pts);
effects.push({kind:'smoke',mesh:pts,vels:[new THREE.Vector3(rand(-0.6,0.6),up,rand(-0.6,0.6))],t:0,dur:dur});
}
/* delayed secondary effects (lingering smoke column after big blasts) */
var pendingFx=[];
/* pooled solid debris chunks — real tumbling geometry, reused across blasts */
var chunkPool=[];
var chunkGeo=new THREE.BoxGeometry(1,1,1);
var chunkMat=new THREE.MeshStandardMaterial({color:0x35322c,roughness:0.95});
function getChunk(){
for(var i=0;i<chunkPool.length;i++) if(!chunkPool[i].visible) return chunkPool[i];
if(chunkPool.length>=36) return null;
var m=new THREE.Mesh(chunkGeo,chunkMat); m.visible=false; m.castShadow=true; scene.add(m); chunkPool.push(m); return m;
}
/* ================= explosion v2: volumetric sprite particles =================
   One draw call, ~1100 soft noise-eroded billboards. Fire is HDR (feeds the bloom),
   smoke is underlit by the fire, dust is sun-lit, sparks are velocity-stretched streaks. */
var PS=(function(){
var N=1100;
var geo=new THREE.InstancedBufferGeometry(); var base=new THREE.PlaneGeometry(1,1);
geo.index=base.index; geo.setAttribute('position',base.attributes.position); geo.setAttribute('uv',base.attributes.uv);
var aPos=new Float32Array(N*4),aA=new Float32Array(N*4),aB=new Float32Array(N*4),aV=new Float32Array(N*3);
function mk(arr,n){ var a=new THREE.InstancedBufferAttribute(arr,n); a.setUsage(THREE.DynamicDrawUsage); return a; }
var attrs=[mk(aPos,4),mk(aA,4),mk(aB,4),mk(aV,3)];
geo.setAttribute('iPosSize',attrs[0]); geo.setAttribute('iA',attrs[1]); geo.setAttribute('iB',attrs[2]); geo.setAttribute('iVel',attrs[3]);
geo.instanceCount=0;
// tileable fBm noise (periodic value noise)
var NS=256, nd=new Uint8Array(NS*NS*4), lat=[];
function lattice(sz){ var a=new Float32Array(sz*sz); for(var i=0;i<a.length;i++)a[i]=Math.random(); return a; }
var oct=[4,8,16,32,64],amp=[0.5,0.27,0.14,0.07,0.04];
for(var o=0;o<oct.length;o++)lat.push(lattice(oct[o]));
function sm(t){ return t*t*(3-2*t); }
for(var y=0;y<NS;y++)for(var x=0;x<NS;x++){
var v=0;
for(var o2=0;o2<oct.length;o2++){ var sz=oct[o2], fx=x/NS*sz, fy=y/NS*sz, ix=Math.floor(fx), iy=Math.floor(fy), tx=sm(fx-ix), ty=sm(fy-iy);
var L=lat[o2], x0=ix%sz,x1=(ix+1)%sz,y0=iy%sz,y1=(iy+1)%sz;
var a=L[y0*sz+x0]*(1-tx)+L[y0*sz+x1]*tx, b=L[y1*sz+x0]*(1-tx)+L[y1*sz+x1]*tx;
v+=(a*(1-ty)+b*ty)*amp[o2]; }
v=Math.max(0,Math.min(1,(v-0.12)*1.35));
var p=(y*NS+x)*4; nd[p]=nd[p+1]=nd[p+2]=Math.round(v*255); nd[p+3]=255;
}
var tex=new THREE.DataTexture(nd,NS,NS,THREE.RGBAFormat); tex.wrapS=tex.wrapT=THREE.RepeatWrapping; tex.minFilter=THREE.LinearMipmapLinearFilter; tex.magFilter=THREE.LinearFilter; tex.generateMipmaps=true; tex.needsUpdate=true;
var vs=[
'attribute vec4 iPosSize; attribute vec4 iA; attribute vec4 iB; attribute vec3 iVel;',
'varying vec2 vUv; varying vec4 vA; varying vec4 vB;',
'void main(){',
' vec4 vp=viewMatrix*vec4(iPosSize.xyz,1.0); float sz=iPosSize.w; vec2 q=position.xy; vec2 off;',
' if(iB.z>0.5){ vec3 vv=(viewMatrix*vec4(iVel,0.0)).xyz; vec2 d=vv.xy; float l=length(d); d=l>1e-4?d/l:vec2(1.0,0.0); float len=sz*(1.0+min(length(iVel)*0.075,7.0)); off=d*q.x*len+vec2(-d.y,d.x)*q.y*sz; }',
' else { float cr=cos(iB.x), sr=sin(iB.x); off=vec2(q.x*cr-q.y*sr,q.x*sr+q.y*cr)*sz; }',
' vp.xy+=off; gl_Position=projectionMatrix*vp; vUv=uv; vA=iA; vB=iB; }'].join('\n');
var fs=[
'precision highp float; uniform sampler2D tNoise; uniform vec3 uSun; varying vec2 vUv; varying vec4 vA; varying vec4 vB;',
'void main(){',
' float k=vA.x, heat=vA.y, seed=vA.z, kind=vA.w, alpha=vB.y; vec2 c=vUv-0.5;',
' if(kind>2.5){',
'  float ax=abs(c.x)*2.0, ay=abs(c.y)*2.0; float a=smoothstep(1.0,0.0,ax)*smoothstep(1.0,0.15,ay)*alpha; float hot=1.0-k;',
'  vec3 col=mix(vec3(2.4,0.6,0.12),vec3(7.0,4.2,1.4),hot*hot); gl_FragColor=vec4(col*a,0.0);',
' } else {',
'  float r=length(c)*2.0; vec2 uv=vUv*0.9+vec2(seed*7.13,seed*3.71);',
'  float n1=texture2D(tNoise,uv+vec2(0.0,-k*0.2)).r; float n2=texture2D(tNoise,uv*2.7+vec2(seed*1.9,k*0.35)).r; float n=n1*0.62+n2*0.38;',
'  float erode=(n-0.5)*(0.9+k*0.9); float edge=smoothstep(1.0,0.35,r-erode*0.55); float dens=edge*smoothstep(0.0,0.5,n+0.55-r*0.55);',
'  float a=clamp(dens,0.0,1.0)*alpha;',
'  if(kind<0.5){',
'   float shade=0.55+0.9*n; vec3 col=vec3(0.085,0.08,0.075)*shade; col+=vec3(0.9,0.32,0.07)*heat*0.9*(1.0-r*0.7); col+=uSun*0.07*smoothstep(0.2,1.0,n)*(0.4+k);',
'   gl_FragColor=vec4(col*a,a);',
'  } else if(kind<1.5){',
'   float h=clamp(heat*(1.15-r*0.65)*(0.55+0.9*n),0.0,1.5); vec3 col=mix(vec3(0.30,0.04,0.015),vec3(2.7,0.85,0.16),smoothstep(0.0,0.55,h)); col=mix(col,vec3(6.0,4.4,2.0),smoothstep(0.7,1.2,h));',
'   gl_FragColor=vec4(col*a,a*0.30);',
'  } else {',
'   vec3 dc=vec3(0.44,0.38,0.30)*(0.65+0.7*n); dc=mix(dc,vec3(0.78,0.84,0.9),clamp(heat,0.0,1.0)); dc*=(0.35+uSun*0.9); gl_FragColor=vec4(dc*a,a);',
'  }',
' }',
' #include <tonemapping_fragment>',
' #include <colorspace_fragment>',
'}'].join('\n');
var mat=new THREE.ShaderMaterial({uniforms:{tNoise:{value:tex},uSun:{value:new THREE.Color(1,0.88,0.7)}},vertexShader:vs,fragmentShader:fs,transparent:true,depthWrite:false,blending:THREE.CustomBlending,blendEquation:THREE.AddEquation,blendSrc:THREE.OneFactor,blendDst:THREE.OneMinusSrcAlphaFactor,blendSrcAlpha:THREE.OneFactor,blendDstAlpha:THREE.OneMinusSrcAlphaFactor});
var mesh=new THREE.Mesh(geo,mat); mesh.frustumCulled=false; mesh.renderOrder=4; scene.add(mesh);
var X=new Float32Array(N),Y=new Float32Array(N),Z=new Float32Array(N),VX=new Float32Array(N),VY=new Float32Array(N),VZ=new Float32Array(N),
S0=new Float32Array(N),GRW=new Float32Array(N),LF=new Float32Array(N),AG=new Float32Array(N),H0=new Float32Array(N),HP=new Float32Array(N),SD=new Float32Array(N),
KD=new Float32Array(N),RT=new Float32Array(N),RV=new Float32Array(N),AL=new Float32Array(N),DR=new Float32Array(N),BU=new Float32Array(N),GV=new Float32Array(N);
var head=0;
function emit(kind,px,py,pz,vx,vy,vz,size,grow,life,heat,hp,alpha,drag,buoy,grav){
var i=head; head=(head+1)%N;
X[i]=px;Y[i]=py;Z[i]=pz;VX[i]=vx;VY[i]=vy;VZ[i]=vz;S0[i]=size;GRW[i]=grow;LF[i]=life;AG[i]=0;H0[i]=heat;HP[i]=hp;SD[i]=Math.random();KD[i]=kind;RT[i]=Math.random()*6.283;RV[i]=(Math.random()-0.5)*(kind===0?0.9:1.8);AL[i]=alpha;DR[i]=drag;BU[i]=buoy;GV[i]=grav||0;
}
function update(dt){
mesh.material.uniforms.uSun.value.copy(sun.color);
var w=0;
for(var i=0;i<N;i++){
if(LF[i]<=0)continue;
AG[i]+=dt; var k=AG[i]/LF[i];
if(k>=1){ LF[i]=0; continue; }
var d=Math.exp(-DR[i]*dt); VX[i]*=d; VY[i]*=d; VZ[i]*=d;
var kind=KD[i];
VY[i]+=(GV[i]+BU[i]*(1-k))*dt;
if(kind===0){ VX[i]+=dt*0.9; VZ[i]+=dt*0.3; }
X[i]+=VX[i]*dt; Y[i]+=VY[i]*dt; Z[i]+=VZ[i]*dt;
if(kind===3){ if(Y[i]<0.2){ Y[i]=0.2; VY[i]*=-0.38; VX[i]*=0.7; VZ[i]*=0.7; } }
else if(Y[i]<0.35){ Y[i]=0.35; if(VY[i]<0)VY[i]=0; }
RT[i]+=RV[i]*dt;
var sz=S0[i]*(1+GRW[i]*Math.sqrt(k));
var heat=H0[i]*Math.pow(1-k,HP[i]);
var al;
if(kind===1)al=AL[i]*Math.min(1,k*10)*Math.pow(1-k,0.9);
else if(kind===0)al=AL[i]*Math.min(1,k*5)*(1-k*k);
else if(kind===2)al=AL[i]*Math.min(1,k*8)*(1-k);
else al=AL[i]*(1-k);
var p=w*4;
aPos[p]=X[i];aPos[p+1]=Y[i];aPos[p+2]=Z[i];aPos[p+3]=sz;
aA[p]=k;aA[p+1]=heat;aA[p+2]=SD[i];aA[p+3]=kind;
aB[p]=RT[i];aB[p+1]=al;aB[p+2]=kind===3?1:0;aB[p+3]=0;
aV[w*3]=VX[i];aV[w*3+1]=VY[i];aV[w*3+2]=VZ[i];
w++;
}
geo.instanceCount=w;
if(w>0){ for(var a=0;a<4;a++)attrs[a].needsUpdate=true; }
mesh.visible=w>0;
}
function clear(){ for(var i=0;i<N;i++)LF[i]=0; geo.instanceCount=0; mesh.visible=false; }
return {emit:emit,update:update,clear:clear,tex:tex};
})();
function _rs(){ return Math.random()*2-1; }
function pDust(pos,w){
var n=Math.min(18,6+Math.round(w*0.45));
for(var i=0;i<n;i++){ var a=rand(0,Math.PI*2), sp=rand(3,10)*(0.6+w*0.04);
PS.emit(2,pos.x+Math.cos(a)*rand(0,w*0.4),rand(0.6,1.6),pos.z+Math.sin(a)*rand(0,w*0.4),Math.cos(a)*sp,rand(0.8,3.2),Math.sin(a)*sp,rand(4.5,8)*(0.7+w*0.03),1.3,rand(2.0,3.2),0,1,rand(0.4,0.65),1.5,0.3,-0.4); }
}
var fireSpots=[];
function addFireSpot(x,z,w,dur){ if(fireSpots.length>=7)fireSpots.shift(); fireSpots.push({x:x,z:z,w:Math.max(3,w),t:0,dur:dur||rand(14,24),eT:0,sT:0}); }
function clearFireSpots(){ fireSpots.length=0; PS.clear(); }
function updateFireSpots(dt){
for(var i=fireSpots.length-1;i>=0;i--){
var f=fireSpots[i]; f.t+=dt; var k=f.t/f.dur; if(k>=1){ fireSpots.splice(i,1); continue; }
var inten=k<0.6?1:1-(k-0.6)/0.4; var ws=clamp(f.w/10,0.7,1.7);
f.eT-=dt;
if(f.eT<=0){ f.eT=0.09/(0.35+inten); var n=Math.max(1,Math.round(f.w/7));
for(var j=0;j<n;j++)PS.emit(1,f.x+_rs()*f.w*0.32,rand(0.8,2.0),f.z+_rs()*f.w*0.32,_rs()*0.7,rand(3,6.5),_rs()*0.7,rand(2,3.4)*ws,0.7,rand(0.5,0.95),0.9*inten,1.0,0.8*inten,0.9,4.2,0); }
f.sT-=dt;
if(f.sT<=0){ f.sT=0.26/(0.3+inten); PS.emit(0,f.x+_rs()*f.w*0.25,rand(2.5,4),f.z+_rs()*f.w*0.25,_rs()*0.8,rand(4,7),_rs()*0.8,rand(4,6.5)*ws,2.8,rand(5,8.5),0.12,1,0.5*inten+0.18,0.32,1.1,0); }
}
}
function chunkTrail(e,dt,k){
if(k>0.75)return; e.trailT=(e.trailT||0)-dt;
if(e.trailT<=0){ e.trailT=0.045; var p=e.mesh.position;
PS.emit(0,p.x,p.y,p.z,_rs()*0.6,rand(0.4,1.4),_rs()*0.6,rand(1.0,1.8),2.2,rand(1.2,2.0),0.35,1,0.55,0.8,0.5,0);
if(k<0.45)PS.emit(1,p.x,p.y,p.z,0,rand(0.5,1.5),0,rand(0.9,1.5),0.4,rand(0.25,0.4),0.8,1,0.7,1,1,0); }
}
function spawnDust(pos,w){ pDust(pos,w); }
function spawnExplosion(pos,big){
var scale=big?2.3:1.25;
var flash=new THREE.Sprite(new THREE.SpriteMaterial({map:texGlow,color:0xffe9b0,transparent:true,opacity:0.95,depthWrite:false,blending:THREE.AdditiveBlending})); flash.material.color.multiplyScalar(3.2);
flash.position.copy(pos); flash.position.y+=1; scene.add(flash);
effects.push({kind:'flash',mesh:flash,t:0,dur:0.2,s0:5*scale,s1:17*scale});
// fireball body: billowing HDR sprites that boil outwards then rise
var nf=big?18:9, hy=pos.y;
for(var i=0;i<nf;i++){
var th=rand(0,Math.PI*2), ph=Math.acos(rand(-0.25,1)), sp=rand(2.5,8.5)*scale;
PS.emit(1,pos.x+_rs()*1.3*scale,hy+0.8+rand(0,1.6)*scale,pos.z+_rs()*1.3*scale,Math.sin(ph)*Math.cos(th)*sp,Math.cos(ph)*sp*0.9+2.2*scale,Math.sin(ph)*Math.sin(th)*sp,rand(3.6,6.2)*scale,1.3,rand(0.55,1.05),1.0,1.25,rand(0.75,0.95),2.1,5.5,0);
}
PS.emit(1,pos.x,hy+1.4,pos.z,0,2,0,rand(8,11)*scale,1.1,0.3,1.2,1.0,0.95,1.5,0,0);
PS.emit(1,pos.x,hy+2.2,pos.z,0,3,0,rand(5,7)*scale,1.4,0.5,1.2,1.2,0.95,1.5,3,0);
// licking fire plumes thrown outward
var npf=big?12:5;
for(var i2=0;i2<npf;i2++){ var a2=rand(0,Math.PI*2), s2=rand(8,17)*scale*0.7;
PS.emit(1,pos.x,hy+1.2,pos.z,Math.cos(a2)*s2,rand(4,12)*scale*0.7,Math.sin(a2)*s2,rand(2.2,3.8)*scale,0.9,rand(0.5,0.95),0.95,1.1,0.85,1.7,3,-9); }
// smoke column: staggered waves so it builds into a stem and a mushrooming head
var waves=big?[0,0.12,0.3,0.55]:[0,0.2];
waves.forEach(function(dl,wi){
pendingFx.push({t:Math.max(0.001,dl),fn:function(){
var ns=big?9:7;
for(var j=0;j<ns;j++){ var aa=rand(0,Math.PI*2), rr=rand(0,2.2)*scale*(1+wi*0.2);
PS.emit(0,pos.x+Math.cos(aa)*rr,hy+rand(0.5,3.5)+wi*2*scale,pos.z+Math.sin(aa)*rr,Math.cos(aa)*rand(0.8,3.5)*scale,rand(6,13)*scale*(0.8+wi*0.12),Math.sin(aa)*rand(0.8,3.5)*scale,rand(4.2,6.8)*scale*(0.9+wi*0.1),2.3,rand(4.2,7.2),0.55-wi*0.12,1.6,rand(0.7,0.92),0.62,2.3,0); }
}});
});
// ground-hugging dust ring
if(pos.y<16)pDust(pos,big?22:12);
// sparks: velocity-stretched hot streaks that bounce
var nsp=big?46:20;
for(var i3=0;i3<nsp;i3++){ var a3=rand(0,Math.PI*2), s3=rand(10,34)*Math.min(scale,1.8), up=rand(-0.1,1)*s3*0.9;
PS.emit(3,pos.x,hy+1,pos.z,Math.cos(a3)*s3*0.8,up+6,Math.sin(a3)*s3*0.8,rand(0.22,0.45),0,rand(0.6,1.7),1,1,1,0.28,0,-27); }
if(pos.y<9)addScorch(pos,scale);
// ground shock rings (kept: they read well) + light
var ring=new THREE.Mesh(new THREE.TorusGeometry(1,0.32,6,28),new THREE.MeshBasicMaterial({color:0xd8cbb2,transparent:true,opacity:0.5,depthWrite:false}));
ring.rotation.x=Math.PI/2; ring.position.set(pos.x,Math.max(0.7,pos.y*0.4),pos.z); scene.add(ring);
effects.push({kind:'ring',mesh:ring,t:0,dur:0.55,scale:scale,rate:17,op0:0.5});
var ring3=new THREE.Mesh(new THREE.TorusGeometry(1,0.14,6,30),new THREE.MeshBasicMaterial({color:0xfff6e0,transparent:true,opacity:0.5,depthWrite:false,blending:THREE.AdditiveBlending}));
ring3.rotation.x=Math.PI/2; ring3.position.set(pos.x,Math.max(0.8,pos.y*0.35),pos.z); scene.add(ring3);
effects.push({kind:'ring',mesh:ring3,t:0,dur:0.34,scale:scale,rate:38,op0:0.5});
var light=new THREE.PointLight(0xff8c30,big?6:3,30+28*scale); light.position.copy(pos); light.position.y+=2; scene.add(light);
effects.push({kind:'light',mesh:light,t:0,dur:big?0.9:0.6,i0:big?6.5:3});
// tumbling burning chunks
var cn=big?12:5;
for(var ci3=0;ci3<cn;ci3++){
var chk=getChunk(); if(!chk)break;
var bs=rand(0.45,big?1.7:1.1);
chk.visible=true; chk.scale.setScalar(bs); chk.position.copy(pos); chk.position.y+=1; chk.rotation.set(rand(0,3),rand(0,3),rand(0,3));
var ca=rand(0,Math.PI*2), cs2=rand(7,19)*Math.min(scale,1.6);
effects.push({kind:'chunk',hot:true,mesh:chk,vel:new THREE.Vector3(Math.cos(ca)*cs2,rand(11,24),Math.sin(ca)*cs2),av:new THREE.Vector3(rand(-8,8),rand(-8,8),rand(-8,8)),bs:bs,t:0,dur:rand(1.4,2.1)});
}
// cook-off: a second fireball punches through
if(big||Math.random()<0.45){
(function(dly,ss2){
pendingFx.push({t:dly,fn:function(){
var p2=pos.clone(); p2.x+=rand(-1.4,1.4); p2.z+=rand(-1.4,1.4); p2.y+=rand(0.2,1.4);
for(var q=0;q<(big?7:4);q++)PS.emit(1,p2.x+_rs(),p2.y+rand(0,1.5),p2.z+_rs(),_rs()*5*ss2,rand(2,7)*ss2,_rs()*5*ss2,rand(3,5.4)*ss2,1.3,rand(0.45,0.8),1.0,1.2,0.9,2.0,5,0);
var sl=new THREE.PointLight(0xff8c30,2.6,26); sl.position.copy(p2); sl.position.y+=1.5; scene.add(sl);
effects.push({kind:'light',mesh:sl,t:0,dur:0.4,i0:2.6});
}});
})(rand(0.08,0.18),scale*rand(0.55,0.85));
}
if(big&&pos.y<8)addFireSpot(pos.x,pos.z,9*scale/2.3*1.4,rand(9,16));
var shD=pos.distanceTo(heliState.pos);
var shF=clamp(1.15-shD/110,0.12,1);
shake=Math.min(shake+(big?1.9:0.85)*shF,2.6);
fxKickAdd((big?0.95:0.5)*shF);
if(big||shF>0.7){ fxShock(pos); }
if(big&&shF>0.45)fxHitStop(0.42,0.09);
sExplosion(big,pos);
}
function pCollapseBurst(o){
var p=o.group.position, w=Math.max(o.w,o.d), h=o.height||10;
for(var i=0;i<12;i++){ var a=rand(0,6.283), r=rand(0,w*0.4); PS.emit(0,p.x+Math.cos(a)*r,rand(1,h*0.25),p.z+Math.sin(a)*r,Math.cos(a)*rand(0.5,3),rand(4,10),Math.sin(a)*rand(0.5,3),rand(5,9)*Math.min(1.8,0.6+w/22),2.4,rand(4.5,8),0.12,1,rand(0.55,0.8),0.55,1.8,0); }
for(var j=0;j<(h>20?10:5);j++)PS.emit(1,p.x+_rs()*w*0.3,rand(1,3),p.z+_rs()*w*0.3,_rs()*3,rand(3,8),_rs()*3,rand(3,6),1,rand(0.4,0.8),0.8,1,0.8,1.5,3,0);
}

function updateEffects(dt){
PS.update(dt); updateFireSpots(dt); dmgUpdate(dt); strUpdate(dt);
for(var pf=pendingFx.length-1;pf>=0;pf--){ pendingFx[pf].t-=dt; if(pendingFx[pf].t<=0){ var pfn=pendingFx[pf].fn; pendingFx.splice(pf,1); pfn(); } }
for(var i=effects.length-1;i>=0;i--){
var e=effects[i]; e.t+=dt; var k=e.t/e.dur;
if(k>=1){ if(e.kind==='chunk'){ e.mesh.visible=false; } else { scene.remove(e.mesh); if(e.mesh.geometry)e.mesh.geometry.dispose(); if(e.mesh.material&&e.mesh.material.dispose)e.mesh.material.dispose(); } effects.splice(i,1); continue;}
if(e.kind==='fire'){ var fe=1-Math.pow(1-k,2.1); var fs2=(0.3+fe*2.05)*e.scale; var ffl=1+Math.sin(e.t*43+(e.ph||0))*0.055+rand(-0.025,0.025); e.mesh.scale.set(fs2*ffl,fs2*(1-k*0.3),fs2*(2-ffl)); e.mesh.material.opacity=0.95*Math.pow(1-k,1.2); if(e.colA)e.mesh.material.color.lerpColors(e.colA,e.colB,k); e.mesh.position.y+=dt*(e.vy||4.5)*(1-k*0.65);}
else if(e.kind==='flash'){ var fs=e.s0+(e.s1-e.s0)*k; e.mesh.scale.set(fs,fs,1); e.mesh.material.opacity=0.95*(1-k);}
else if(e.kind==='shock'){ var ss=1+k*e.maxR; e.mesh.scale.set(ss,ss*0.82,ss); e.mesh.material.opacity=0.34*Math.pow(1-k,1.4);}
else if(e.kind==='chunk'){ if(e.hot)chunkTrail(e,dt,k); e.vel.y-=30*dt; e.mesh.position.addScaledVector(e.vel,dt); e.mesh.rotation.x+=e.av.x*dt; e.mesh.rotation.y+=e.av.y*dt; e.mesh.rotation.z+=e.av.z*dt; var fl2=e.bs*0.5; if(e.mesh.position.y<fl2){ e.mesh.position.y=fl2; e.vel.y*=-0.35; e.vel.x*=0.55; e.vel.z*=0.55; e.av.multiplyScalar(0.5);} if(k>0.82){ var cq=Math.max(0.02,1-(k-0.82)/0.18); e.mesh.scale.setScalar(e.bs*cq);} }
else if(e.kind==='ring'){ var rs=1+k*(e.rate||15)*e.scale; e.mesh.scale.set(rs,rs,1); e.mesh.material.opacity=(e.op0!=null?e.op0:0.55)*(1-k);}
else if(e.kind==='light'){ e.mesh.intensity=(1-k)*(e.i0||2.8)*(0.72+Math.random()*0.5);}
else if(e.kind==='smoke'||e.kind==='debris'||e.kind==='dust'||e.kind==='spark'){
var pos=e.mesh.geometry.attributes.position;
var grav=e.kind==='debris'?-27:(e.kind==='spark'?-36:(e.kind==='dust'?-0.6:2.2));
for(var j=0;j<e.vels.length;j++){
e.vels[j].y+=grav*dt*(e.kind==='debris'||e.kind==='spark'?1:0.32);
if(e.kind==='smoke'){ e.vels[j].x+=dt*1.15; e.vels[j].z+=dt*0.4; }
if(e.kind==='dust'){ e.vels[j].x*=Math.pow(0.35,dt); e.vels[j].z*=Math.pow(0.35,dt);}
pos.array[j*3]+=e.vels[j].x*dt; pos.array[j*3+1]+=e.vels[j].y*dt; pos.array[j*3+2]+=e.vels[j].z*dt;
if(pos.array[j*3+1]<0.3&&(e.kind==='debris'||e.kind==='dust'||e.kind==='spark')){pos.array[j*3+1]=0.3;e.vels[j].y*=(e.kind==='spark'?-0.4:0);}
}
pos.needsUpdate=true;
if(e.size0)e.mesh.material.size=e.size0*(1+k*(e.grow||1.5));
e.mesh.material.opacity=(e.kind==='debris'||e.kind==='spark'?1:(e.kind==='dust'?0.62:0.8))*(1-k*k);
}
}
// smouldering rubble: ember glow flickers and thins out, thin smoke keeps
// curling up for a while after the collapse dust has settled
for(var eb=embers.length-1;eb>=0;eb--){
var em=embers[eb]; em.t+=dt; var ek=em.t/em.dur;
if(ek>=1){ scene.remove(em.mesh); if(em.mesh.material)em.mesh.material.dispose(); embers.splice(eb,1); continue; }
var fade=ek<0.7?1:1-(ek-0.7)/0.3;
em.mesh.material.opacity=(0.26+0.16*Math.sin(em.t*11+em.ph)+Math.random()*0.1)*fade;
var es2=em.s0*(1+0.08*Math.sin(em.t*7+em.ph)); em.mesh.scale.set(es2,es2*0.6,1);
em.smokeT-=dt;
if(em.smokeT<=0&&ek<0.65){ em.smokeT=rand(0.45,0.95); spawnPuff(new THREE.Vector3(em.x+rand(-1.5,1.5),2.2,em.z+rand(-1.5,1.5)),0x3d3a36,3.2,2.0,2.6,0.4); }
}
// scorch marks darken in fast, then weather away over about a minute
for(var sc3=scorches.length-1;sc3>=0;sc3--){
var so2=scorches[sc3]; so2.t+=dt; var sk2=so2.t/so2.dur;
if(sk2>=1){ scene.remove(so2.mesh); so2.mesh.material.dispose(); scorches.splice(sc3,1); continue; }
so2.mesh.material.opacity=0.52*Math.min(so2.t/1.1,1)*(sk2>0.8?1-(sk2-0.8)/0.2:1);
}
// collapsing buildings
for(var b=0;b<destructibles.length;b++){
var o=destructibles[b];
if(o.collapsing>0){
o.collapsing+=dt; var cDur=o.collapseDur||0.85; var ct=Math.min(o.collapsing/cDur,1);
if(o.isCar){ var ce=ct*ct; o.group.scale.y=1-ce*0.6; }
else if(o.isTank){ var ce2=ct*ct; o.group.scale.y=1-ce2*0.55; o.group.rotation.z=(o.baseRotZ||0)+ce2*0.5; }
else if(o.group.userData.U){ dmgCollapse(o,ct,dt); }
else if(ct<0.13){
// the structure shudders and groans for a beat before it lets go
var sh2=ct/0.13; o.group.position.x=(o.baseX||0)+rand(-0.07,0.07)*sh2; o.group.position.z=(o.baseZ||0)+rand(-0.07,0.07)*sh2; o.group.scale.y=1-sh2*0.03;
} else {
var cp=(ct-0.13)/0.87; var ease=Math.pow(cp,2.4); // gravity takes it: a slow yield, then a violent finish
o.group.position.x=o.baseX||o.group.position.x; o.group.position.z=o.baseZ||o.group.position.z;
o.group.scale.y=1-ease*0.88; o.group.position.y=-ease*o.height*0.1;
o.group.rotation.x=(o.baseRotX||0)+(o.leanRX||0)*ease;
o.group.rotation.z=(o.baseRotZ||0)+(o.leanRZ||0)*ease;
if(!o.dustKicked){ o.dustKicked=true; spawnDust(o.group.position,Math.max(o.w,o.d)*0.85); }
if(!o.chunkDropped&&cp>0.4){ o.chunkDropped=true;
for(var cd2=0;cd2<2;cd2++){ var chk2=getChunk(); if(!chk2)break; var cbs=rand(0.5,1.2); chk2.visible=true; chk2.scale.setScalar(cbs); chk2.position.set(o.group.position.x+rand(-0.3,0.3)*o.w,o.height*rand(0.5,0.75),o.group.position.z+rand(-0.3,0.3)*o.d); chk2.rotation.set(rand(0,3),rand(0,3),rand(0,3)); effects.push({kind:'chunk',mesh:chk2,vel:new THREE.Vector3(rand(-3,3),rand(-1,1),rand(-3,3)),av:new THREE.Vector3(rand(-6,6),rand(-6,6),rand(-6,6)),bs:cbs,t:0,dur:rand(1.2,1.7)}); }
}
}
if(ct>=1){
o.collapsing=-1;
if(!o.isCar){ spawnDust(o.group.position,Math.max(o.w,o.d)); pCollapseBurst(o); addFireSpot(o.group.position.x,o.group.position.z,Math.max(o.w,o.d)*0.9,rand(10,20)); spawnPuff(o.group.position.clone().setY(3),0x4a453f,5.5,3.2,2.8,0.55); spawnPuff(o.group.position.clone().setY(6),0x5a544c,6.5,2.6,3.4,0.45);
// the whole frame hitting the ground kicks the camera and thuds, scaled by size and distance
var impD=heliState.pos.distanceTo(o.group.position); var impF=clamp(1.1-impD/120,0.1,1); shake=Math.min(shake+clamp((o.height||8)/34,0.25,0.8)*impF,2.6); fxKickAdd(clamp((o.height||8)/60,0.12,0.6)*impF); if((o.height||8)>26&&impF>0.45)fxHitStop(0.5,0.07); sThunk(); }
if(!o.isCar&&o.group&&o.group.children){ for(var ch2=0;ch2<o.group.children.length;ch2++){ if(o.group.children[ch2]!==o.rubble)o.group.children[ch2].visible=false; } }
if(o.main)o.main.visible=false;
if(o.roof)o.roof.visible=false;
if(o.roof2)o.roof2.visible=false;
if(o.extraParts)o.extraParts.forEach(function(p){p.visible=false;});
if(o.rubble){ o.rubble.visible=true; o.rubble.scale.set(1,1,1); if(o.rubble.children)for(var rc=0;rc<o.rubble.children.length;rc++)o.rubble.children[rc].visible=true; }
if(o.isTank&&o.rubble)o.rubble.visible=true;
o.group.scale.y=1; o.group.position.y=0; if(o.baseX!==undefined){ o.group.position.x=o.baseX; o.group.position.z=o.baseZ; }
}
}
}
}

/* ================= game state ================= */
var G={
mode:'title', // title | play | over
time:90, score:0, yen:0, destroyed:0,
combo:0, comboTimer:0, maxCombo:0,
heliHp:100, shake:0,
bombCd:0, mslCd:0, gunCd:0, homCd:0, homLeft:3,
hitCd:0, elapsed:0, fuelT:0, fuelUsed:false, repairT:0, repairRate:0, repairCd:0,
warnBeep:0, crashT:0, crashStage:0, crashWait:0, crashReason:'fuel',
scramblePhase:'none', scrambleT:0,
ehPhase:'none', ehIntroT:0, ehOrbit:0
};
var EH_INTRO_DUR=3.8;
var SCRAMBLE_AT=35, SCRAMBLE_DUR=3.8;
var shake=0;
var best=null; // in-memory session best
var heliState={pos:new THREE.Vector3(PAD.x,26,PAD.z),vel:new THREE.Vector3(),yaw:0, pitch:0, roll:0};
var keys={};
var input={mx:0,mz:0,up:false,down:false,turnL:false,turnR:false,gun:false};
var pendingChains=[]; // {t, pos, radius, dmg}

var projectiles=[]; // {mesh, vel, kind}
var bombMeshGeo=new THREE.SphereGeometry(0.55,10,8);
var bombMat=new THREE.MeshStandardMaterial({color:0x23272c,roughness:0.4,metalness:0.5});
var mslGeo=new THREE.CylinderGeometry(0.22,0.28,2.2,8);
var mslMat=new THREE.MeshStandardMaterial({color:0xe8e8e8,roughness:0.3,metalness:0.4});
var mslTipMat=new THREE.MeshStandardMaterial({color:0xe8491d,roughness:0.4});

/* ---- view-camera aim (crosshair) ----
The crosshair is slaved to the drag-look camera: yaw = heli heading +
camYawOff (where the player is looking right now, even before the
airframe finishes swinging round), pitch = -camPitchOff (drag up to
look up = aim up, drag down = aim down). The missile and the machine
gun fire along aimDir and converge on aimPoint; the HUD crosshair is
projected from aimPoint every frame so it rides with the view.
Flight is untouched: none of this tilts the heli or changes where
the stick takes it. */
var aimDir=new THREE.Vector3(0,0,-1);
var aimPoint=new THREE.Vector3(0,20,-90);
var _aimTmp=new THREE.Vector3();
function updateAimDir(){
var totalYaw=heliState.yaw+camYawOff;
var el=clamp(-camPitchOff,-1.0,1.0);
var cp=Math.cos(el);
aimDir.set(-Math.sin(totalYaw)*cp,Math.sin(el),-Math.cos(totalYaw)*cp).normalize();
aimPoint.copy(heliState.pos).addScaledVector(aimDir,90);
}

function fireBomb(){
if(G.mode!=='play'||G.bombCd>0)return;
G.bombCd=0.55;
var m=new THREE.Mesh(bombMeshGeo,bombMat); m.castShadow=true;
m.position.copy(heliState.pos); m.position.y-=1.6;
scene.add(m);
projectiles.push({mesh:m,vel:heliState.vel.clone().multiplyScalar(0.45),kind:'bomb'});
sThunk();
}
function fireMissile(){
if(G.mode!=='play'||G.mslCd>0)return;
G.mslCd=0.38;
var grp=new THREE.Group();
var body=new THREE.Mesh(mslGeo,mslMat); body.rotation.z=Math.PI/2; grp.add(body);
var tip=new THREE.Mesh(new THREE.ConeGeometry(0.24,0.7,8),mslTipMat); tip.rotation.z=-Math.PI/2; tip.position.x=1.4; grp.add(tip);
var flame=new THREE.Mesh(new THREE.SphereGeometry(0.34,8,6),new THREE.MeshBasicMaterial({color:0xffb02e}));
flame.position.x=-1.3; grp.add(flame); grp.userData.flame=flame;
// missiles fly along the crosshair (view-camera aim), not the nose
var fwd=aimDir.clone();
grp.position.copy(heliState.pos).addScaledVector(fwd,3.2); grp.position.y-=0.4;
grp.quaternion.setFromUnitVectors(new THREE.Vector3(1,0,0),fwd.clone());
scene.add(grp);
projectiles.push({mesh:grp,vel:fwd.multiplyScalar(58).add(heliState.vel.clone().multiplyScalar(0.3)),kind:'missile',life:3});
sLaunch();
}
/* homing missile: locks onto the nearest active enemy aircraft and
   steers hard toward it. A hit deals heavy damage (50), but as it
   closes in the target may pop flares and spoof the seeker onto a
   decoy point — then it misses. Any detonation within 16 units of
   the player splashes back and damages the player's own heli. */
function homingTarget(){
var best=null,bd=1e9;
if(ehState.active&&!ehState.down){ var d1=heliState.pos.distanceTo(eheli.position); if(d1<bd){bd=d1;best='eh';} }
if(jetState.active&&!jetState.down){ var d2=heliState.pos.distanceTo(jet.position); if(d2<bd){bd=d2;best='jet';} }
return (best&&bd<=210)?best:null;
}
function fireHoming(){
if(G.mode!=='play'||G.homCd>0)return;
if(G.homLeft<=0){ showCenter('🎯 誘導ミサイルは残り0発 — もう撃てない'); return; }
var tgt=homingTarget();
if(!tgt){ showCenter('🎯 ロックオン対象なし（敵機がいない）'); return; }
G.homCd=3.0;
G.homLeft--;
var grp=new THREE.Group();
var body=new THREE.Mesh(mslGeo,new THREE.MeshStandardMaterial({color:0xd8f4ee,roughness:0.3,metalness:0.4})); body.rotation.z=Math.PI/2; grp.add(body);
var tip=new THREE.Mesh(new THREE.ConeGeometry(0.24,0.7,8),new THREE.MeshStandardMaterial({color:0x18b898,roughness:0.4})); tip.rotation.z=-Math.PI/2; tip.position.x=1.4; grp.add(tip);
var flame=new THREE.Mesh(new THREE.SphereGeometry(0.36,8,6),new THREE.MeshBasicMaterial({color:0x7dffd8}));
flame.position.x=-1.3; grp.add(flame); grp.userData.flame=flame;
// launched along the crosshair like the other weapons, then it steers
var fwd=aimDir.clone();
grp.position.copy(heliState.pos).addScaledVector(fwd,3.2); grp.position.y-=0.4;
grp.quaternion.setFromUnitVectors(new THREE.Vector3(1,0,0),fwd.clone());
scene.add(grp);
projectiles.push({mesh:grp,vel:fwd.multiplyScalar(62).add(heliState.vel.clone().multiplyScalar(0.3)),kind:'homing',life:3.4,target:tgt,evadeChecked:false,decoy:null});
showCenter('🎯 ロックオン — 誘導ミサイル発射！（残り'+G.homLeft+'発）');
sLaunch();
}
function homingSplash(pos){
var d=pos.distanceTo(heliState.pos);
if(d<16){ var dmg=Math.max(6,Math.round(32*(1-d/16))); showCenter('💥 近すぎる！ 爆発に巻き込まれた'); damageHeli(dmg,'homing-splash'); }
}
/* chin-turret machine gun: hold to fire — fast tracers, direct damage only
   (no explosion), best against cars and the enemy aircraft */
var gunGeo=new THREE.SphereGeometry(0.2,6,5);
var gunMat=new THREE.MeshBasicMaterial({color:0xffd23c}); gunMat.color.setRGB(4.0,3.2,0.7);
function fireGun(){
if(G.mode!=='play'||G.gunCd>0)return;
G.gunCd=0.09;
// rounds leave the belly turret's muzzle and converge on the crosshair
var mpos;
if(gunMuzzle){ gunMuzzle.getWorldPosition(_aimTmp); mpos=_aimTmp.clone(); }
else { mpos=heliState.pos.clone().addScaledVector(aimDir,3.4); mpos.y-=0.9; }
var fwd=aimPoint.clone().sub(mpos).normalize();
fwd.x+=rand(-0.012,0.012); fwd.y+=rand(-0.01,0.01); fwd.z+=rand(-0.012,0.012); fwd.normalize();
var m=new THREE.Mesh(gunGeo,gunMat);
// elongated tracer streak, so each round clearly reads while it flies
m.scale.set(3.2,1,1);
m.quaternion.setFromUnitVectors(new THREE.Vector3(1,0,0),fwd);
m.position.copy(mpos);
scene.add(m);
projectiles.push({mesh:m,vel:fwd.multiplyScalar(125).add(heliState.vel.clone().multiplyScalar(0.25)),kind:'gun',life:1.1});
spawnPuff(mpos.clone(),0xffc46b,2.4,0.2,0.18,0.9); // muzzle flash at the belly gun
sGun();
}

function explodeAt(pos,radius,dmg,big){
spawnExplosion(pos,big||radius>=20);
// damage destructibles
for(var i=0;i<destructibles.length;i++){
var o=destructibles[i];
if(o.destroyed)continue;
var dx=o.group.position.x-pos.x, dz=o.group.position.z-pos.z;
var hd=Math.sqrt(dx*dx+dz*dz);
var reach=radius+Math.max(o.w,o.d)*0.42;
if(hd>reach)continue;
var topY=o.height;
if(pos.y>topY+radius)continue;
var fall=clamp(1-(hd/reach)*0.55,0.4,1);
damageObject(o,Math.round(dmg*fall),pos);
}
if(jetState.active&&!jetState.down&&pos.distanceTo(jet.position)<=radius+4){
damageJet(Math.round(dmg*0.8));
}
if(ehState.active&&!ehState.down&&pos.distanceTo(eheli.position)<=radius+4){
damageEnemyHeli(Math.round(dmg*0.8));
}
}
function damageObject(o,dmg,fromPos){
if(o.destroyed||dmg<=0)return;
o.hp-=dmg;
// proportional yen/score for damage dealt
var frac=clamp(dmg/o.maxHp,0,1);
var yenAdd=Math.min(Math.round(o.value*frac),o.value-o.yenGiven);
if(yenAdd>0){ o.yenGiven+=yenAdd; G.yen+=yenAdd;}
var scAdd=Math.round(o.scorePts*frac*0.4);
o.scoreGiven+=scAdd; G.score+=scAdd;
// visual stage
var ratio=o.hp/o.maxHp;
var stage=ratio>0.66?0:(ratio>0.33?1:2);
if(stage>o.stage){
o.stage=stage;
if(o.mat&&o.mat.color&&!o.isCar){ o.mat.color.setHex(o.baseTint); o.mat.color.multiplyScalar(stage===1?0.78:0.55);}
if(o.isCar&&o.mat){ o.mat.color.multiplyScalar(0.7);}
if(stage===2&&!o.isCar&&!o.isTank){ o.group.rotation.z=rand(0.02,0.05)*(Math.random()<0.5?-1:1); o.group.rotation.x=rand(0.01,0.035);}
if(stage===1&&!o.isCar&&!o.isTank){ o.group.rotation.z=rand(0.005,0.015);}
}
if(o.group.userData.U&&dmg>=3&&!o.isCar&&!o.isTank)dmgHole(o,dmg,fromPos);
if(o.hp<=0) destroyObject(o,fromPos);
}
function destroyObject(o,fromPos){
o.destroyed=true; o.collapsing=0.0001; G.destroyed++; if(!o.isCar&&o.height>6)sCollapse(o.group.position,o.height); if(o.lite)w2LiteDestroyed(o);
if(o.isCar&&o.group.userData.lights)o.group.userData.lights.forEach(function(s){ s.visible=false; });
if(!o.isCar){
spawnEmber(o.group.position,Math.max(o.w,o.d));
// staged collapse setup: duration grows with height, and the frame leans
// away from the blast that killed it as it goes down
if(!o.isTank&&o.group.userData.U){ try{ strFinish(o,fromPos); }catch(eF){ console.warn(eF); } }
o.collapseDur=o.isTank?0.8:(o.group.userData.U?clamp(1.7+(o.height||8)*0.05,2.2,6.5):clamp(0.55+(o.height||8)*0.014,0.62,1.3));
o.baseX=o.group.position.x; o.baseZ=o.group.position.z; o.baseRotX=o.group.rotation.x; o.baseRotZ=o.group.rotation.z;
o.dustKicked=false; o.chunkDropped=false;
if(fromPos){ var lx=o.group.position.x-fromPos.x, lz=o.group.position.z-fromPos.z; var ll=Math.sqrt(lx*lx+lz*lz)||1; o.leanRZ=-(lx/ll)*0.06; o.leanRX=(lz/ll)*0.06; }
else { o.leanRX=rand(-0.03,0.03); o.leanRZ=rand(-0.03,0.03); }
}
// combo
if(G.comboTimer>0)G.combo++; else G.combo=1;
G.comboTimer=2.5;
if(G.combo>G.maxCombo)G.maxCombo=G.combo;
var mult=1+Math.min(G.combo-1,20)*0.12;
var bonus=Math.round(o.scorePts*0.6*mult);
G.score+=bonus;
showCombo();
try{
var popTot=(o.scoreGiven||0)+bonus;
spawnPopup(new THREE.Vector3(o.group.position.x,Math.max(3,(o.height||6)*0.72),o.group.position.z),'+'+fmt(popTot),(popTot>=2000?'big ':'')+(G.combo>=5?'hot':''));
if(G.combo>=5&&G.combo%5===0)spawnPopup(heliState.pos.clone().add(new THREE.Vector3(0,5,0)),'COMBO ×'+G.combo+'!','combo',1.5);
}catch(ePop){}
// ensure full value counted
if(o.yenGiven<o.value){ G.yen+=(o.value-o.yenGiven); o.yenGiven=o.value;}
// chain explosion
if(o.explosive){
pendingChains.push({t:o.type==='gas'?0.12:0.18,pos:o.group.position.clone().setY(Math.min(4,o.height*0.5)),radius:o.explosive.radius,dmg:o.explosive.dmg,big:o.type==='gas'});
}
if(o.type==='gas')showCenter('ガソリンスタンド誘爆！');
updateHUD();
}

/* ================= HUD ================= */
var el={};
['timeNum','scoreNum','yenLine','rateNum','downNum','maxComboNum','hpBar','bombState','mslState','gunState','homState','combo','comboNum','comboBar','centerMsg','timeBox','btnBomb','btnMissile','btnGun','btnHoming','homCount','fuelBar','padArrow','padDist','returnWarn','fuelDist','refuelBox','refuelBar','refuelSec','repairDist','repairBox','repairBar','repairSec','cross'].forEach(function(id){el[id]=document.getElementById(id);});
var centerTimer=null;
function showCenter(txt){ el.centerMsg.textContent=txt; el.centerMsg.classList.add('show'); if(centerTimer)clearTimeout(centerTimer); centerTimer=setTimeout(function(){el.centerMsg.classList.remove('show');},1300);}
function showCombo(){
if(G.combo>=2){ el.comboNum.textContent=G.combo; el.combo.classList.add('show'); el.combo.classList.remove('bump'); void el.combo.offsetWidth; el.combo.classList.add('bump'); }
}
function updateHUD(){
el.scoreNum.textContent=fmt(G.score);
el.yenLine.textContent='被害総額 '+fmtYen(G.yen);
var rate=totalCount? (G.destroyed/totalCount*100):0;
el.rateNum.textContent=rate.toFixed(1);
el.downNum.textContent=G.destroyed;
el.maxComboNum.textContent=G.combo>0?('×'+G.maxCombo):'0';
}
function updateHpBar(){
el.hpBar.style.width=clamp(G.heliHp,0,100)+'%';
el.hpBar.classList.toggle('hurt',G.heliHp<35);
}
function padDistance(){
var dx=PAD.x-heliState.pos.x, dz=PAD.z-heliState.pos.z;
return Math.sqrt(dx*dx+dz*dz);
}
function updatePadNav(){
var dx=PAD.x-heliState.pos.x, dz=PAD.z-heliState.pos.z;
var dist=Math.sqrt(dx*dx+dz*dz);
var fdx0=FUEL.x-heliState.pos.x, fdz0=FUEL.z-heliState.pos.z;
var fdist0=Math.sqrt(fdx0*fdx0+fdz0*fdz0);
el.fuelDist.textContent=G.fuelUsed?'⛽ 給油スポット 使用済み（1回のみ）':(fdist0<=FUEL.r?(heliState.pos.y>2.4?'⛽ 給油スポット上空 — 降下して着陸':'⛽ 給油スポット — 5秒待機で給油'):'⛽ 給油スポット '+Math.round(fdist0)+'m');
var rdx0=REPAIR.x-heliState.pos.x, rdz0=REPAIR.z-heliState.pos.z;
var rdist0=Math.sqrt(rdx0*rdx0+rdz0*rdz0);
el.repairDist.textContent=G.repairCd>0?'🔧 整備場 — クールダウン中 あと'+Math.ceil(G.repairCd)+'秒':(rdist0<=REPAIR.r?(heliState.pos.y>2.4?'🔧 整備場上空 — 降下して着陸':(G.heliHp>=100?'🔧 整備場 — 耐久は満タン':'🔧 整備場 — 3秒整備で全回復')):'🔧 整備場 '+Math.round(rdist0)+'m');
if(dist<=PAD.r){
el.padArrow.textContent='▼';
el.padArrow.style.transform='translate(-50%,-50%) translate(0px,58px)';
el.padDist.textContent=heliState.pos.y>2.4?'ヘリポート上空 — 降下して着陸':'ヘリポート — 減速して接地';
return;
}
var targetYaw=Math.atan2(-dx,-dz);
var rel=Math.atan2(Math.sin(targetYaw-heliState.yaw),Math.cos(targetYaw-heliState.yaw));
var ax=Math.sin(rel)*58, ay=-Math.cos(rel)*58;
el.padArrow.textContent='▲';
el.padArrow.style.transform='translate(-50%,-50%) translate('+ax.toFixed(1)+'px,'+ay.toFixed(1)+'px) rotate('+(rel*180/Math.PI).toFixed(1)+'deg)';
el.padDist.textContent='ヘリポート '+Math.round(dist)+'m';
}
/* repair box has two faces: while a repair runs, and while the 10s
   post-use cooldown is still ticking (pad occupied but no repair yet) */
var _rpMode='';
function setRepairBoxMode(m){
if(_rpMode===m)return; _rpMode=m;
var lab=el.repairBox.querySelector('.rpLab'), sub=el.repairBox.querySelector('.rpSub');
if(m==='cd'){
lab.textContent='🔧 整備場クールダウン中 — まだ整備できない';
if(sub.childNodes[0])sub.childNodes[0].textContent='使用可能まで あと ';
if(sub.childNodes[2])sub.childNodes[2].textContent=' 秒（クールダウン中は回復が始まらない）';
} else {
lab.textContent='🔧 整備中… 敵の攻撃に注意！';
if(sub.childNodes[0])sub.childNodes[0].textContent='あと ';
if(sub.childNodes[2])sub.childNodes[2].textContent=' 秒キープで 耐久 全回復（被弾すると回復しきれない）';
}
}
function checkLanding(){
if(FREE)return false;
if(padDistance()>PAD.r)return false;
if(heliState.pos.y>2.4)return false;
var hs=Math.sqrt(heliState.vel.x*heliState.vel.x+heliState.vel.z*heliState.vel.z);
if(hs>7.5)return false;
endGame('landed');
return true;
}

/* ================= input ================= */
/* ================= input manager: key rebinding + gamepad / joystick (Thrustmaster etc.) ================= */
var ACTIONS=[
{id:'forward',label:'前進 / ピッチ前',def:['KeyW','ArrowUp'],grp:'飛行'},
{id:'back',label:'後退 / ピッチ後',def:['KeyS','ArrowDown'],grp:'飛行'},
{id:'left',label:'左へ移動 / 左ロール',def:['KeyA'],grp:'飛行'},
{id:'right',label:'右へ移動 / 右ロール',def:['KeyD'],grp:'飛行'},
{id:'yawL',label:'左旋回(ペダル)',def:['KeyQ','ArrowLeft'],grp:'飛行'},
{id:'yawR',label:'右旋回(ペダル)',def:['KeyE','ArrowRight'],grp:'飛行'},
{id:'up',label:'上昇(コレクティブ上げ)',def:['Space'],grp:'飛行'},
{id:'down',label:'下降(コレクティブ下げ)',def:['ShiftLeft','ShiftRight','KeyC'],grp:'飛行'},
{id:'thrUp',label:'スロットル上げ(出力↑・速度↑)',def:['PageUp','KeyT'],grp:'飛行'},
{id:'thrDown',label:'スロットル下げ',def:['PageDown','KeyB'],grp:'飛行'},
{id:'bomb',label:'爆弾',def:['KeyF'],grp:'武装',btn:1},
{id:'missile',label:'ミサイル',def:['KeyG'],grp:'武装',btn:2},
{id:'gun',label:'機関銃(長押し)',def:['KeyH'],grp:'武装',btn:0,hold:true},
{id:'homing',label:'誘導ミサイル',def:['KeyJ'],grp:'武装',btn:3},
{id:'flare',label:'フレア(ミサイル回避)',def:['KeyR'],grp:'武装',btn:4},
{id:'view',label:'視点切替',def:['KeyV'],grp:'システム',btn:5},
{id:'camReset',label:'視点リセット',def:['KeyX'],grp:'システム',btn:6},
{id:'map',label:'大型マップ',def:['KeyN'],grp:'システム',btn:7},
{id:'mute',label:'BGMオン/オフ',def:['KeyM'],grp:'システム'},
{id:'pause',label:'ポーズ / 設定',def:['Escape','KeyP'],grp:'システム',btn:9}
];
var ACT_BY_ID={}; ACTIONS.forEach(function(a){ ACT_BY_ID[a.id]=a; });
var SETTINGS=(function(){
var d={bind:{},pad:{dev:'auto',roll:{ax:0,inv:false,dz:0.08,ex:0.35},pitch:{ax:1,inv:false,dz:0.08,ex:0.35},yaw:{ax:2,inv:false,dz:0.12,ex:0.3},climb:{ax:3,inv:true,dz:0.02,ex:0,min:-1,max:1,hover:0.5},throttle:{ax:-1,inv:false,dz:0,ex:0,min:-1,max:1},lookX:{ax:-1,inv:false,dz:0.15,ex:0.2},lookY:{ax:-1,inv:false,dz:0.15,ex:0.2},btn:{},init:false},
gfx:'auto',vol:{master:1,sfx:1,music:0.6,amb:0.8},flight:'arcade',sens:1,view:'chase',units:'metric'};
try{ var raw=localStorage.getItem('heri.settings.v2'); if(raw){ var o=JSON.parse(raw); (function merge(a,b){ for(var k in b){ if(b[k]&&typeof b[k]==='object'&&!Array.isArray(b[k])&&a[k]&&typeof a[k]==='object')merge(a[k],b[k]); else a[k]=b[k]; } })(d,o); } }catch(e){}
return d;
})();
function saveSettings(){ try{ localStorage.setItem('heri.settings.v2',JSON.stringify(SETTINGS)); }catch(e){} }
function bindsOf(id){ var b=SETTINGS.bind[id]; return b?b:ACT_BY_ID[id].def; }
function actDown(id){ var b=bindsOf(id); for(var i=0;i<b.length;i++)if(keys[b[i]])return true; return PADBTN[id]===true; }
var PADBTN={}, PADPREV={};
var JOY={roll:0,pitch:0,yaw:0,climb:0,coll:0.5,collP:0.5,collActive:false,lookX:0,lookY:0,connected:false,name:'',axes:[],buttons:[],analog:false};
var CAL=null;
var BIND_CAPTURE=null; // {kind:'key'|'axis'|'btn', cb}
function keyLabel(c){ if(!c)return '—'; var m={Space:'Space',ShiftLeft:'左Shift',ShiftRight:'右Shift',ControlLeft:'左Ctrl',ControlRight:'右Ctrl',AltLeft:'左Alt',AltRight:'右Alt',Escape:'Esc',ArrowUp:'↑',ArrowDown:'↓',ArrowLeft:'←',ArrowRight:'→',Enter:'Enter',Tab:'Tab',Backspace:'BS',Mouse0:'クリック'}; if(m[c])return m[c]; if(c.indexOf('Key')===0)return c.slice(3); if(c.indexOf('Digit')===0)return c.slice(5); if(c.indexOf('Numpad')===0)return 'テン'+c.slice(6); return c; }
function inputKeyDown(e){
if(BIND_CAPTURE&&BIND_CAPTURE.kind==='key'){ e.preventDefault(); e.stopPropagation(); BIND_CAPTURE.cb(e.code); return; }
keys[e.code]=true;
if(e.repeat&&!(ACT_BY_ID.gun&&bindsOf('gun').indexOf(e.code)>=0))return;
for(var i=0;i<ACTIONS.length;i++){ var a=ACTIONS[i]; if(bindsOf(a.id).indexOf(e.code)<0)continue; triggerAction(a.id,e); }
if(G.mode==='play'&&['Space','ArrowUp','ArrowDown','ArrowLeft','ArrowRight','Tab'].indexOf(e.code)>=0)e.preventDefault();
}
function triggerAction(id,e){
if(id==='pause'){ if(G.mode==='play'||G.paused)togglePause(); return; }
if(id==='mute'){ if(G.mode==='play')musicToggle(); return; }
if(G.mode!=='play'||G.paused)return;
if(id==='bomb')fireBomb(); else if(id==='missile')fireMissile(); else if(id==='gun')fireGun(); else if(id==='homing')fireHoming();
else if(id==='flare'&&window.fireFlares)fireFlares();
else if(id==='view'&&window.cycleView)cycleView();
else if(id==='camReset'){ camYawOff=0; camPitchOff=0; }
else if(id==='map'&&window.toggleBigMap)toggleBigMap();
}
function readKeyboard(){
var mx=0,mz=0,up=false,down=false,tl=false,tr=false;
if(actDown('forward'))mz-=1; if(actDown('back'))mz+=1; if(actDown('left'))mx-=1; if(actDown('right'))mx+=1;
if(actDown('yawL'))tl=true; if(actDown('yawR'))tr=true; if(actDown('up'))up=true; if(actDown('down'))down=true;
return {mx:mx,mz:mz,up:up,down:down,tl:tl,tr:tr};
}
function shapeAxis(v,cfg){ var s=cfg.inv?-1:1; v=v*s; var a=Math.abs(v); if(a<cfg.dz)return 0; a=(a-cfg.dz)/(1-cfg.dz); a=Math.pow(a,1+cfg.ex); return Math.sign(v)*Math.min(1,a); }
function activePad(){
var gps=(navigator.getGamepads?navigator.getGamepads():[])||[]; var best=null;
for(var i=0;i<gps.length;i++){ var g=gps[i]; if(!g||!g.connected)continue; if(SETTINGS.pad.dev!=='auto'){ if(g.id===SETTINGS.pad.dev)return g; continue; } if(!best||g.axes.length>best.axes.length)best=g; }
return best;
}
function applyPadPreset(g){
var P=SETTINGS.pad;
if(g.mapping==='standard'){ P.roll.ax=0;P.pitch.ax=1;P.yaw.ax=2;P.climb.ax=3;P.climb.inv=true; P.btn={gun:7,bomb:5,missile:4,homing:0,flare:2,view:3,camReset:10,map:8,pause:9}; }
else { P.roll.ax=0;P.pitch.ax=1;P.yaw.ax=(g.axes.length>5?5:2);P.climb.ax=(g.axes.length>3?3:-1);P.climb.inv=true; P.btn={gun:0,bomb:1,missile:2,homing:3,flare:4,view:5,camReset:6,map:7,pause:9}; }
P.init=true; saveSettings();
}
var _lastPadId=null;
function pollGamepad(){
var g=activePad();
if(!g){ JOY.connected=false; JOY.collActive=false; JOY.roll=JOY.pitch=JOY.yaw=JOY.climb=JOY.lookX=JOY.lookY=0; JOY.analog=false; for(var k in PADBTN)PADBTN[k]=false; return; }
if(_lastPadId!==g.id){ _lastPadId=g.id; if(!SETTINGS.pad.init)applyPadPreset(g); try{ toast('🎮 '+g.id.replace(/\(.*?\)/g,'').slice(0,42)+' を検出'); }catch(e){} }
JOY.connected=true; JOY.name=g.id; JOY.axes=g.axes; JOY.buttons=g.buttons;
var P=SETTINGS.pad;
function ax(c){ return c.ax>=0&&c.ax<g.axes.length?shapeAxis(g.axes[c.ax],c):0; }
function lever(c,v){ var lo=c.min,hi=c.max; if(hi===undefined||lo===undefined||hi-lo<0.2){ lo=-1; hi=1; } var q=clamp((v-lo)/(hi-lo),0,1); return c.inv?1-q:q; }
JOY.roll=ax(P.roll); JOY.pitch=ax(P.pitch); JOY.yaw=ax(P.yaw); JOY.lookX=ax(P.lookX); JOY.lookY=ax(P.lookY);
if(CAL&&CAL.cfg.ax>=0&&CAL.cfg.ax<g.axes.length){ var rv=g.axes[CAL.cfg.ax]; CAL.min=Math.min(CAL.min,rv); CAL.max=Math.max(CAL.max,rv); if(performance.now()>CAL.end){ if(CAL.max-CAL.min>0.3){ CAL.cfg.min=CAL.min; CAL.cfg.max=CAL.max; saveSettings(); toast('校正完了: '+CAL.min.toFixed(2)+' 〜 '+CAL.max.toFixed(2)); } else toast('レバーが動いていません。もう一度校正してください'); CAL=null; } }
if(P.climb.ax>=0&&P.climb.ax<g.axes.length){ var cp=lever(P.climb,g.axes[P.climb.ax]),hv=P.climb.hover||0.5; JOY.collActive=true; JOY.collP=cp; JOY.coll=cp<hv?0.5*cp/hv:0.5+0.5*(cp-hv)/(1-hv); JOY.climb=Math.abs(cp-hv)<0.04?0:(cp<hv?(cp-hv)/hv:(cp-hv)/(1-hv)); } else { JOY.collActive=false; JOY.climb=0; }
if(P.throttle.ax>=0&&P.throttle.ax<g.axes.length){ THR=lever(P.throttle,g.axes[P.throttle.ax]); }
JOY.analog=true;
if(BIND_CAPTURE&&BIND_CAPTURE.kind==='btn'){ for(var b=0;b<g.buttons.length;b++){ if(g.buttons[b].pressed&&!PADPREV['b'+b]){ PADPREV['b'+b]=true; BIND_CAPTURE.cb(b); break; } } }
for(var bi=0;bi<g.buttons.length;bi++){ if(!g.buttons[bi].pressed)PADPREV['b'+bi]=false; }
for(var i=0;i<ACTIONS.length;i++){
var a=ACTIONS[i]; var bn=P.btn[a.id]; var down=(bn!==undefined&&bn>=0&&bn<g.buttons.length&&g.buttons[bn].pressed);
var was=PADBTN[a.id]===true; PADBTN[a.id]=down;
if(down&&!was&&!BIND_CAPTURE)triggerAction(a.id,null);
}
}
function togglePause(){
if(G.mode!=='play'&&!G.paused)return;
G.paused=!G.paused;
var pm=document.getElementById('pauseMenu'); if(pm){ pm.classList.toggle('on',G.paused); var pf=document.getElementById('pmFinish'); if(pf)pf.style.display=FREE?'block':'none'; }
if(AC){ try{ if(G.paused)AC.suspend(); else AC.resume(); }catch(e){} }
if(!G.paused)closeSettings();
}

function thrUpdate(dt){ if(G.mode!=='play'||G.paused)return; if(actDown('thrUp'))THR=Math.min(1,THR+dt*0.45); if(actDown('thrDown'))THR=Math.max(0,THR-dt*0.45); }

/* ================= settings / pause UI ================= */
function toast(msg,ms){
var t=document.getElementById('toast'); if(!t){ t=document.createElement('div'); t.id='toast'; document.body.appendChild(t); }
t.textContent=msg; t.classList.add('on'); clearTimeout(toast._t); toast._t=setTimeout(function(){ t.classList.remove('on'); },ms||2400);
}
function applyGfx(){
var m=SETTINGS.gfx;
if(m==='auto'){ FX.pinned=false; return; }
var q={high:3,medium:2,low:1,off:0}[m]; if(q===undefined)return;
FX.pinned=true; try{ buildFX(q); }catch(e){ FX.failed=true; buildFX(0); }
}
function applySettings(){ saveSettings(); if(window.audioApplyVol)audioApplyVol(); }
function el$(h){ var d=document.createElement('div'); d.innerHTML=h; return d.firstChild; }
function esc(s){ return String(s).replace(/[&<>"]/g,function(c){ return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]; }); }
var SM={tab:'keys',raf:0};
function buildSettings(){
if(document.getElementById('settingsModal'))return;
var m=el$('<div id="settingsModal"><div class="sm-card"><div class="sm-head"><b>⚙ 設定</b><button id="smClose" class="sm-x">✕ 閉じる</button></div><div class="sm-tabs"></div><div class="sm-body"></div></div></div>');
document.body.appendChild(m);
var tabs=[['keys','⌨ キー割り当て'],['pad','🕹 ジョイスティック'],['gfx','🖥 画質・世界'],['snd','🔊 サウンド'],['fly','🚁 飛行・操作']];
var th=m.querySelector('.sm-tabs');
tabs.forEach(function(t){ var b=document.createElement('button'); b.textContent=t[1]; b.dataset.tab=t[0]; b.onclick=function(){ SM.tab=t[0]; renderSettings(); }; th.appendChild(b); });
m.querySelector('#smClose').onclick=closeSettings;
m.addEventListener('pointerdown',function(e){ e.stopPropagation(); });
}
function openSettings(){ buildSettings(); document.getElementById('settingsModal').classList.add('on'); renderSettings(); cancelCapture(); }
function closeSettings(){ var m=document.getElementById('settingsModal'); if(m)m.classList.remove('on'); cancelCapture(); cancelAnimationFrame(SM.raf); saveSettings(); }
function cancelCapture(){ BIND_CAPTURE=null; var c=document.querySelectorAll('.capturing'); for(var i=0;i<c.length;i++)c[i].classList.remove('capturing'); }
function renderSettings(){
var m=document.getElementById('settingsModal'); var body=m.querySelector('.sm-body');
[].forEach.call(m.querySelectorAll('.sm-tabs button'),function(b){ b.classList.toggle('on',b.dataset.tab===SM.tab); });
cancelAnimationFrame(SM.raf);
body.innerHTML='';
if(SM.tab==='keys')renderKeys(body); else if(SM.tab==='pad')renderPad(body); else if(SM.tab==='gfx')renderGfx(body); else if(SM.tab==='snd')renderSnd(body); else renderFly(body);
}
function removeKeyFrom(id,code){ var b=bindsOf(id).slice(); var i=b.indexOf(code); if(i>=0){ b.splice(i,1); SETTINGS.bind[id]=b; } }
function assignKey(id,idx,code){
if(code==='Escape'&&id!=='pause'){ renderSettings(); return; }
ACTIONS.forEach(function(a){ if(a.id!==id&&bindsOf(a.id).indexOf(code)>=0&&!(a.id==='pause'&&code==='Escape')){ removeKeyFrom(a.id,code); toast('「'+keyLabel(code)+'」は「'+a.label+'」から外しました'); } });
var b=bindsOf(id).slice(); if(idx>=0&&idx<b.length)b[idx]=code; else if(b.indexOf(code)<0)b.push(code);
SETTINGS.bind[id]=b; saveSettings(); BIND_CAPTURE=null; renderSettings();
}
function renderKeys(body){
body.appendChild(el$('<p class="sm-note">項目の「キー」をクリックして、割り当てたいキーを押してください(Escでキャンセル)。1つの操作に複数のキーを割り当てられます。</p>'));
var grp='';
ACTIONS.forEach(function(a){
if(a.grp!==grp){ grp=a.grp; body.appendChild(el$('<h4>'+grp+'</h4>')); }
var row=el$('<div class="sm-row"><span class="sm-lab">'+esc(a.label)+'</span><span class="sm-keys"></span></div>');
var kc=row.querySelector('.sm-keys');
bindsOf(a.id).forEach(function(code,idx){
var b=document.createElement('button'); b.className='kchip'; b.textContent=keyLabel(code);
b.onclick=function(){ cancelCapture(); b.classList.add('capturing'); b.textContent='キーを押す…'; BIND_CAPTURE={kind:'key',cb:function(c){ assignKey(a.id,idx,c); }}; };
var x=document.createElement('span'); x.className='kx'; x.textContent='×'; x.title='このキーを外す'; x.onclick=function(e){ e.stopPropagation(); var bb=bindsOf(a.id).slice(); bb.splice(idx,1); SETTINGS.bind[a.id]=bb; saveSettings(); renderSettings(); };
b.appendChild(x); kc.appendChild(b);
});
var add=document.createElement('button'); add.className='kchip add'; add.textContent='＋';
add.onclick=function(){ cancelCapture(); add.classList.add('capturing'); add.textContent='キーを押す…'; BIND_CAPTURE={kind:'key',cb:function(c){ assignKey(a.id,-1,c); }}; };
kc.appendChild(add); body.appendChild(row);
});
var rb=el$('<div class="sm-actions"><button class="sm-btn">キー割り当てを初期化</button></div>'); rb.querySelector('button').onclick=function(){ SETTINGS.bind={}; saveSettings(); renderSettings(); toast('キー割り当てを初期化しました'); };
body.appendChild(rb);
}
function startAxisCapture(cfgKey,btn){
var g=activePad(); if(!g){ toast('ジョイスティックが見つかりません。ボタンを押すか動かしてください'); return; }
cancelCapture(); btn.classList.add('capturing'); btn.textContent='軸を動かす…';
var base=g.axes.slice();
BIND_CAPTURE={kind:'axis',cb:null};
(function wait(){
if(!BIND_CAPTURE||BIND_CAPTURE.kind!=='axis')return;
var gg=activePad(); if(gg){ var best=-1,bv=0.55; for(var i=0;i<gg.axes.length;i++){ var d=Math.abs(gg.axes[i]-(base[i]||0)); if(d>bv){ bv=d; best=i; } } if(best>=0){ SETTINGS.pad[cfgKey].ax=best; SETTINGS.pad.init=true; saveSettings(); BIND_CAPTURE=null; renderSettings(); return; } }
requestAnimationFrame(wait);
})();
}
function renderPad(body){
var P=SETTINGS.pad;
var gps=(navigator.getGamepads?navigator.getGamepads():[])||[]; var list=[]; for(var i=0;i<gps.length;i++)if(gps[i]&&gps[i].connected)list.push(gps[i]);
var sel='<select id="padDev"><option value="auto">自動選択</option>'+list.map(function(g){ return '<option value="'+esc(g.id)+'"'+(P.dev===g.id?' selected':'')+'>'+esc(g.id.slice(0,70))+'</option>'; }).join('')+'</select>';
body.appendChild(el$('<p class="sm-note">Thrustmaster(T.16000M / TCA / Warthog など)・Logicool・Xboxコントローラー等に対応しています。ブラウザがジョイスティックを認識するには、接続後にスティックのボタンを1回押すか動かしてください。</p>'));
body.appendChild(el$('<div class="sm-row"><span class="sm-lab">デバイス</span><span>'+sel+'</span></div>'));
body.querySelector('#padDev').onchange=function(e){ P.dev=e.target.value; P.init=false; saveSettings(); _lastPadId=null; renderSettings(); };
body.appendChild(el$('<div class="sm-status" id="padStat">'+(list.length?'接続中: '+esc(list[0].id.slice(0,60)):'未接続 — ジョイスティックのボタンを押してください')+'</div>'));
body.appendChild(el$('<h4>軸の割り当て(「割当」を押してスティックを動かす)</h4>'));
[['roll','ロール(左右移動)'],['pitch','ピッチ(前後移動)'],['yaw','ヨー / ペダル / ツイスト(旋回)'],['lookX','視点 左右(ハット等)'],['lookY','視点 上下']].forEach(function(r){
var c=P[r[0]];
var row=el$('<div class="sm-row pad"><span class="sm-lab">'+r[1]+'</span><span class="sm-axctl"><button class="kchip">'+(c.ax>=0?'軸 '+c.ax:'未割当')+'</button><label><input type="checkbox"'+(c.inv?' checked':'')+'> 反転</label><label>デッドゾーン <input type="range" min="0" max="0.4" step="0.01" value="'+c.dz+'"></label><label>カーブ <input type="range" min="0" max="1.5" step="0.05" value="'+c.ex+'"></label><span class="axbar"><i data-ax="'+r[0]+'"></i></span></span></div>');
var ins=row.querySelectorAll('input');
row.querySelector('button').onclick=function(e){ startAxisCapture(r[0],e.target); };
ins[0].onchange=function(e){ c.inv=e.target.checked; saveSettings(); };
ins[1].oninput=function(e){ c.dz=parseFloat(e.target.value); saveSettings(); };
ins[2].oninput=function(e){ c.ex=parseFloat(e.target.value); saveSettings(); };
if(r[0].indexOf('look')===0){ var un=document.createElement('button'); un.className='kchip'; un.textContent='解除'; un.onclick=function(){ c.ax=-1; saveSettings(); renderSettings(); }; row.querySelector('.sm-axctl').insertBefore(un,row.querySelector('.sm-axctl').children[1]); }
body.appendChild(row);
});
body.appendChild(el$('<p class="sm-note">ヘリコプターでは、スティックの<b>スロットルレバー(スライダー)は「コレクティブ」</b>=上昇・下降に割り当てるのが標準です(実機・DCS・MSFS共通)。エンジン出力(速度)用に、別軸を「スロットル」に割り当てることもできます。レバーの可動範囲は「校正」で合わせてください。</p>'));
[['climb','コレクティブ(スロットルレバー): 上げる=上昇 / 下げる=下降'],['throttle','スロットル(エンジン出力): 上げるほど前進が速い']].forEach(function(r){
var c=P[r[0]];
var row=el$('<div class="sm-row pad"><span class="sm-lab">'+r[1]+'</span><span class="sm-axctl"><button class="kchip">'+(c.ax>=0?'軸 '+c.ax:'未割当')+'</button><button class="kchip small" data-k="un">解除</button><label><input type="checkbox"'+(c.inv?' checked':'')+'> 反転</label><button class="kchip small" data-k="cal">校正</button>'+(r[0]==='climb'?'<button class="kchip small" data-k="hov">ホバー位置=今のレバー位置</button>':'')+'<span class="axbar"><i data-ax="lev_'+r[0]+'"></i></span></span></div>');
row.querySelector('button').onclick=function(e){ startAxisCapture(r[0],e.target); };
row.querySelector('[data-k=un]').onclick=function(){ c.ax=-1; saveSettings(); renderSettings(); };
row.querySelector('input').onchange=function(e){ c.inv=e.target.checked; saveSettings(); };
row.querySelector('[data-k=cal]').onclick=function(){ var g=activePad(); if(!g||c.ax<0){ toast('先に軸を割り当ててください'); return; } CAL={cfg:c,min:g.axes[c.ax],max:g.axes[c.ax],end:performance.now()+6000}; toast('6秒以内にレバーを最小〜最大まで動かしてください'); };
var hv=row.querySelector('[data-k=hov]'); if(hv)hv.onclick=function(){ var g=activePad(); if(!g||c.ax<0)return; var lo=c.min===undefined?-1:c.min,hi=c.max===undefined?1:c.max,q=Math.min(1,Math.max(0,(g.axes[c.ax]-lo)/(hi-lo))); c.hover=c.inv?1-q:q; saveSettings(); toast('ホバー位置を '+Math.round(c.hover*100)+'% に設定'); };
body.appendChild(row);
});
body.appendChild(el$('<h4>ボタンの割り当て(「割当」を押してスティックのボタンを押す)</h4>'));
ACTIONS.forEach(function(a){
if(['forward','back','left','right','yawL','yawR','mute'].indexOf(a.id)>=0)return;
var cur=P.btn[a.id];
var row=el$('<div class="sm-row"><span class="sm-lab">'+esc(a.label)+'</span><span><button class="kchip">'+(cur!==undefined&&cur>=0?'ボタン '+cur:'未割当')+'</button> <button class="kchip small">解除</button></span></div>');
var bs=row.querySelectorAll('button');
bs[0].onclick=function(e){ cancelCapture(); e.target.classList.add('capturing'); e.target.textContent='ボタンを押す…'; var g=activePad(); if(g){ for(var b=0;b<g.buttons.length;b++)PADPREV['b'+b]=g.buttons[b].pressed; } BIND_CAPTURE={kind:'btn',cb:function(n){ ACTIONS.forEach(function(o){ if(o.id!==a.id&&P.btn[o.id]===n)delete P.btn[o.id]; }); P.btn[a.id]=n; P.init=true; saveSettings(); BIND_CAPTURE=null; renderSettings(); }}; };
bs[1].onclick=function(){ delete P.btn[a.id]; saveSettings(); renderSettings(); };
body.appendChild(row);
});
body.appendChild(el$('<h4>入力モニター</h4>'));
var mon=el$('<div class="padmon"><div class="axes"></div><div class="btns"></div></div>'); body.appendChild(mon);
var actions=el$('<div class="sm-actions"><button class="sm-btn">標準プリセットを適用</button></div>'); actions.querySelector('button').onclick=function(){ var g=activePad(); if(g){ applyPadPreset(g); renderSettings(); toast('プリセットを適用しました'); } else toast('ジョイスティックが見つかりません'); }; body.appendChild(actions);
(function tick(){
var g=activePad(); var ax=mon.querySelector('.axes'), bt=mon.querySelector('.btns');
if(g){
if(ax.children.length!==g.axes.length){ ax.innerHTML=''; for(var i=0;i<g.axes.length;i++)ax.appendChild(el$('<div><span>軸'+i+'</span><b><i></i></b></div>')); }
for(var j=0;j<g.axes.length;j++){ ax.children[j].querySelector('i').style.left=((g.axes[j]*0.5+0.5)*100)+'%'; }
if(bt.children.length!==g.buttons.length){ bt.innerHTML=''; for(var k=0;k<g.buttons.length;k++)bt.appendChild(el$('<span>'+k+'</span>')); }
for(var q=0;q<g.buttons.length;q++)bt.children[q].classList.toggle('on',g.buttons[q].pressed);
[].forEach.call(body.querySelectorAll('.axbar i'),function(e){ var k=e.dataset.ax,v=0; if(k.indexOf('lev_')===0){ var cc=SETTINGS.pad[k.slice(4)]; if(cc.ax>=0&&g.axes[cc.ax]!==undefined){ var lo=cc.min===undefined?-1:cc.min,hi=cc.max===undefined?1:cc.max,qq=Math.min(1,Math.max(0,(g.axes[cc.ax]-lo)/(hi-lo))); v=(cc.inv?1-qq:qq)*2-1; } } else v=JOY[k]||0; e.style.left=((v*0.5+0.5)*100)+'%'; });
}
SM.raf=requestAnimationFrame(tick);
})();
}
function slider(label,val,min,max,step,cb,fmtf){
var row=el$('<div class="sm-row"><span class="sm-lab">'+label+'</span><span class="sm-sl"><input type="range" min="'+min+'" max="'+max+'" step="'+step+'" value="'+val+'"><b>'+(fmtf?fmtf(val):val)+'</b></span></div>');
var inp=row.querySelector('input'), b=row.querySelector('b'); inp.oninput=function(){ var v=parseFloat(inp.value); b.textContent=fmtf?fmtf(v):v; cb(v); };
return row;
}
function selectRow(label,opts,cur,cb,note){
var row=el$('<div class="sm-row"><span class="sm-lab">'+label+(note?'<small>'+note+'</small>':'')+'</span><span class="sm-opts"></span></div>');
var c=row.querySelector('.sm-opts');
opts.forEach(function(o){ var b=document.createElement('button'); b.className='opt'+(o[0]===cur?' on':''); b.textContent=o[1]; b.onclick=function(){ cb(o[0]); [].forEach.call(c.children,function(x){ x.classList.remove('on'); }); b.classList.add('on'); }; c.appendChild(b); });
return row;
}
function renderGfx(body){
body.appendChild(selectRow('描画品質',[['auto','自動'],['high','最高'],['medium','高'],['low','中'],['off','ポスト処理なし']],SETTINGS.gfx,function(v){ SETTINGS.gfx=v; applySettings(); applyGfx(); },'自動はFPSに応じて調整'));
body.appendChild(selectRow('描画距離(世界の生成範囲)',[[1,'近い'],[2,'標準'],[3,'遠い'],[4,'最大']],SETTINGS.dist||2,function(v){ SETTINGS.dist=v; applySettings(); if(window.worldApplyDist)worldApplyDist(); },'遠いほど地形と街が遠くまで見える(重い端末は「近い」)'));
body.appendChild(selectRow('影',[[1,'オン'],[0,'オフ']],SETTINGS.shadow===0?0:1,function(v){ SETTINGS.shadow=v; applySettings(); renderer.shadowMap.enabled=!!v; scene.traverse(function(o){ if(o.material){ var ms=Array.isArray(o.material)?o.material:[o.material]; ms.forEach(function(m){ m.needsUpdate=true; }); } }); }));
body.appendChild(selectRow('FPS表示',[[1,'表示'],[0,'非表示']],SETTINGS.fps?1:0,function(v){ SETTINGS.fps=v; applySettings(); if(window.fpsShow)fpsShow(!!v); }));
}
function renderSnd(body){
var V=SETTINGS.vol; var f=function(v){ return Math.round(v*100)+'%'; };
body.appendChild(slider('マスター音量',V.master,0,1,0.05,function(v){ V.master=v; applySettings(); },f));
body.appendChild(slider('効果音',V.sfx,0,1,0.05,function(v){ V.sfx=v; applySettings(); },f));
body.appendChild(slider('BGM',V.music,0,1,0.05,function(v){ V.music=v; applySettings(); },f));
body.appendChild(slider('環境音・エンジン音',V.amb,0,1,0.05,function(v){ V.amb=v; applySettings(); },f));
}
function renderFly(body){
body.appendChild(selectRow('飛行モデル',[['arcade','アーケード'],['sim','シミュレーター']],SETTINGS.flight,function(v){ SETTINGS.flight=v; applySettings(); if(window.onFlightModelChanged)onFlightModelChanged(); },'シムはコレクティブ/サイクリック/ペダルを使うリアル寄りの操縦(ジョイスティック推奨)'));
body.appendChild(slider('操作感度',SETTINGS.sens,0.4,2,0.05,function(v){ SETTINGS.sens=v; applySettings(); },function(v){ return '×'+v.toFixed(2); }));
body.appendChild(selectRow('標準視点',[['chase','後方追尾'],['cockpit','コクピット'],['far','遠景']],SETTINGS.view,function(v){ SETTINGS.view=v; applySettings(); }));
body.appendChild(selectRow('HUD表示',[['full','フル(レーダー付)'],['min','最小'],['off','なし']],SETTINGS.hud||'full',function(v){ SETTINGS.hud=v; applySettings(); }));
body.appendChild(selectRow('速度・高度の単位',[['metric','m・km/h'],['aero','ft・kt']],SETTINGS.units,function(v){ SETTINGS.units=v; applySettings(); }));
}
function buildPauseMenu(){
if(document.getElementById('pauseMenu'))return;
var p=el$('<div id="pauseMenu"><div class="pm-card"><h2>⏸ ポーズ</h2><button id="pmResume" class="bigbtn">▶ 再開</button><button id="pmSet" class="subbtn">⚙ 設定(キー割り当て・ジョイスティック)</button><button id="pmFinish" class="subbtn" style="display:none">📋 ミッション終了(リザルトへ)</button><button id="pmQuit" class="subbtn">🏠 タイトルへ戻る</button></div></div>');
document.body.appendChild(p);
p.querySelector('#pmResume').onclick=function(){ togglePause(); };
p.querySelector('#pmSet').onclick=openSettings;
p.querySelector('#pmFinish').onclick=function(){ togglePause(); endGame('landed'); };
p.querySelector('#pmQuit').onclick=function(){ if(confirm('現在のプレイを終了してタイトルに戻りますか?'))location.reload(); };
p.addEventListener('pointerdown',function(e){ e.stopPropagation(); });
}
function buildTitleButtons(){
var sb=document.getElementById('startBtn'); if(!sb||document.getElementById('openSettingsBtn'))return;
var tb=el$('<div id="todBox"><div class="todLab">🕒 時間帯 <b id="todClock"></b></div><div class="todBtns"></div><input id="todSlider" type="range" min="0" max="24" step="0.25"><label class="todFlow"><input type="checkbox" id="todFlow"> 時間を進める</label></div>');
var presets=[['早朝',5.9],['朝',8.5],['昼',12.5],['夕方',17.6],['夜',21.5],['深夜',1.5]]; var bw=tb.querySelector('.todBtns');
presets.forEach(function(p){ var b=document.createElement('button'); b.className='opt'; b.textContent=p[0]; b.onclick=function(){ SETTINGS.tod=p[1]; todSet(p[1]); saveSettings(); syncTod(); }; bw.appendChild(b); });
sb.parentNode.insertBefore(tb,sb);
var sl=tb.querySelector('#todSlider'),ck=tb.querySelector('#todFlow');
function syncTod(){ sl.value=TOD.h; tb.querySelector('#todClock').textContent=todLabel(TOD.h); ck.checked=!!SETTINGS.todFlow; }
sl.oninput=function(){ SETTINGS.tod=parseFloat(sl.value); todSet(SETTINGS.tod); saveSettings(); syncTod(); };
ck.onchange=function(){ SETTINGS.todFlow=ck.checked; saveSettings(); };
syncTod();
var b=document.createElement('button'); b.id='openSettingsBtn'; b.className='subbtn'; b.textContent='⚙ 設定(キー割り当て・ジョイスティック・画質)';
sb.parentNode.insertBefore(b,sb.nextSibling); b.onclick=openSettings;
}
function fpsShow(on){
var f=document.getElementById('fpsBox');
if(on&&!f){ f=document.createElement('div'); f.id='fpsBox'; document.body.appendChild(f); }
if(f)f.style.display=on?'block':'none';
}
var _fpsAcc=0,_fpsN=0;
function fpsTick(raw){ if(!SETTINGS.fps)return; _fpsAcc+=raw; _fpsN++; if(_fpsAcc>0.5){ var f=document.getElementById('fpsBox'); if(f)f.textContent=Math.round(_fpsN/_fpsAcc)+' FPS · Q'+FX.q; _fpsAcc=0; _fpsN=0; } }

window.addEventListener('keydown',inputKeyDown);
window.addEventListener('keyup',function(e){keys[e.code]=false;});
renderer.domElement.addEventListener('pointerdown',function(){ audio(); if(G.mode==='title'){}});

/* ---- drag-to-look camera orbit ----
Dragging anywhere that is not the stick or a button swings the camera around
the heli (check the city below, enemies, the pad). The yaw part turns the
heli itself. Dragging also swings the CROSSHAIR with the view: the pitch
part tilts the aim up/down and the missile + machine gun fire where the
crosshair points. It still never tilts the heli or changes where the
heli flies — only the camera and the aim move. */
var camYawOff=0, camPitchOff=0;
var camDrag={id:null,lx:0,ly:0,endT:0};
var CAM_UP=new THREE.Vector3(0,1,0);
renderer.domElement.addEventListener('pointerdown',function(e){
if(camDrag.id!==null)return;
camDrag.id=e.pointerId; camDrag.lx=e.clientX; camDrag.ly=e.clientY;
try{renderer.domElement.setPointerCapture(e.pointerId);}catch(err){}
});
renderer.domElement.addEventListener('pointermove',function(e){
if(e.pointerId!==camDrag.id)return;
var dx=e.clientX-camDrag.lx, dy=e.clientY-camDrag.ly;
camDrag.lx=e.clientX; camDrag.ly=e.clientY;
camYawOff=clamp(camYawOff-dx*0.0052,-Math.PI,Math.PI);
camPitchOff=clamp(camPitchOff+dy*0.0042,-1.0,1.0);
camDrag.endT=performance.now();
});
function camDragEnd(e){
if(e.pointerId!==camDrag.id)return;
camDrag.id=null; camDrag.endT=performance.now();
}
renderer.domElement.addEventListener('pointerup',camDragEnd);
renderer.domElement.addEventListener('pointercancel',camDragEnd);

// virtual stick
(function(){
var base=document.getElementById('stickBase'), knob=document.getElementById('stickKnob');
var activeId=null;
function setKnob(dx,dy){ knob.style.transform='translate(calc(-50% + '+dx+'px), calc(-50% + '+dy+'px))';}
function handle(e){
var r=base.getBoundingClientRect();
var cx=r.left+r.width/2, cy=r.top+r.height/2;
var dx=e.clientX-cx, dy=e.clientY-cy;
var max=r.width/2-8; var len=Math.sqrt(dx*dx+dy*dy);
if(len>max){dx*=max/len;dy*=max/len;}
setKnob(dx,dy);
input.mx=dx/max; input.mz=dy/max;
}
base.addEventListener('pointerdown',function(e){activeId=e.pointerId;base.setPointerCapture(e.pointerId);audio();handle(e);e.preventDefault();});
base.addEventListener('pointermove',function(e){if(e.pointerId===activeId)handle(e);});
function end(e){if(e.pointerId===activeId){activeId=null;input.mx=0;input.mz=0;setKnob(0,0);}}
base.addEventListener('pointerup',end); base.addEventListener('pointercancel',end);
})();
// hold buttons
function bindHold(id,on,off){
var b=document.getElementById(id);
function dn(e){e.preventDefault();audio();b.classList.add('held');on();}
function up(e){b.classList.remove('held');if(off)off();}
b.addEventListener('pointerdown',dn);
b.addEventListener('pointerup',up); b.addEventListener('pointerleave',up); b.addEventListener('pointercancel',up);
b.addEventListener('contextmenu',function(e){e.preventDefault();});
}
bindHold('btnUp',function(){input.up=true;},function(){input.up=false;});
bindHold('btnDown',function(){input.down=true;},function(){input.down=false;});
bindHold('btnTurnL',function(){input.turnL=true;},function(){input.turnL=false;});
bindHold('btnTurnR',function(){input.turnR=true;},function(){input.turnR=false;});
bindHold('btnBomb',function(){fireBomb();});
bindHold('btnMissile',function(){fireMissile();});
bindHold('btnHoming',function(){fireHoming();});
bindHold('btnGun',function(){input.gun=true; fireGun();},function(){input.gun=false;});

/* ================= enemy heli takeoff intro ================= */
var ehIntroOverlay=document.getElementById('ehIntroOverlay');
function startEHIntro(){
G.ehPhase='intro'; G.ehIntroT=0;
ehIntroOverlay.classList.add('on');
sWarn(true);
if(eheli){ eheli.visible=true; eheli.position.set(EH_PAD.x,1.85,EH_PAD.z); eheli.rotation.set(0,0.8,0);}
eRotorSpeed=0;
}
function endEHIntro(){
if(G.ehPhase!=='intro')return;
G.ehPhase='done';
ehIntroOverlay.classList.remove('on');
// airborne just off its pad, already turning toward the city / player
eheli.position.set(EH_PAD.x+16,27,EH_PAD.z+10);
ehState.yaw=Math.atan2(-(PAD.z-EH_PAD.z),(PAD.x-EH_PAD.x));
eheli.rotation.set(0,ehState.yaw,0);
ehState.vel.set(Math.cos(ehState.yaw)*18,0,-Math.sin(ehState.yaw)*18);
ehState.active=true; ehState.fireCd=3.4; ehState.burst=0;
eRotorSpeed=38;
document.getElementById('ehBox').classList.add('on');
document.getElementById('ehBar').style.width='100%';
showCenter('敵ヘリ接近！');
}
document.getElementById('ehSkipBtn').addEventListener('click',function(e){ e.stopPropagation(); endEHIntro();});
function updateEHIntro(dt){
G.ehIntroT+=dt;
var t=G.ehIntroT;
// player heli hovers in place; the mission timer stays paused during the intro
heliState.vel.multiplyScalar(Math.pow(0.02,dt));
heli.position.copy(heliState.pos);
heli.rotation.y=heliState.yaw+Math.PI/2;
// rotor spin-up, then a straight vertical lift-off, then a turn toward the city
eRotorSpeed=lerp(eRotorSpeed,t<1.1?38:38,1-Math.pow(0.02,dt));
if(t<1.1){
eheli.position.set(EH_PAD.x,1.85+Math.sin(t*40)*0.03*Math.min(1,t),EH_PAD.z);
eheli.rotation.y=0.8;
if(Math.random()<0.25)spawnPuff(eheli.position.clone().setY(0.7),0x9a8d7a,2.6,0.5,0.9,0.4);
} else if(t<2.9){
var k=(t-1.1)/1.8; var ease=1-Math.pow(1-k,3);
eheli.position.set(EH_PAD.x,lerp(1.85,27,ease),EH_PAD.z);
var targetYaw=Math.atan2(-(PAD.z-EH_PAD.z),(PAD.x-EH_PAD.x));
eheli.rotation.y=lerp(0.8,targetYaw,ease);
ehState.yaw=eheli.rotation.y;
if(k<0.4&&Math.random()<0.5)spawnPuff(eheli.position.clone().setY(0.7),0x9a8d7a,3.4,0.4,1.1,0.45);
} else {
var k2=clamp((t-2.9)/(EH_INTRO_DUR-2.9),0,1);
var fwd=new THREE.Vector3(Math.cos(ehState.yaw),0,-Math.sin(ehState.yaw));
eheli.position.addScaledVector(fwd,dt*(10+k2*22));
eheli.position.y=27+k2*3;
eheli.rotation.z=-0.12*k2;
}
// camera watches the enemy pad for the takeoff
tmpV.set(eheli.position.x+17,eheli.position.y+6,eheli.position.z+21);
camPos.lerp(tmpV,1-Math.pow(0.0001,dt));
camera.position.copy(camPos);
camera.lookAt(eheli.position.x,eheli.position.y+0.5,eheli.position.z);
updateEffects(dt);
if(t>=EH_INTRO_DUR)endEHIntro();
}

/* ================= scramble cutscene ================= */
var scrambleOverlay=document.getElementById('scrambleOverlay');
function startScramble(){
G.scramblePhase='cutscene'; G.scrambleT=0;
scrambleOverlay.classList.add('on');
sSiren(); sJetRoar();
jet.visible=true; jet.position.set(BASE.runStart,1.36,BASE.z); jet.rotation.set(0,0,0);
if(jetFlame)jetFlame.visible=false;
if(jetGear)jetGear.visible=true;
}
function endScramble(){
if(G.scramblePhase!=='cutscene')return;
G.scramblePhase='done';
scrambleOverlay.classList.remove('on');
// jet is airborne, entering from the south heading for the city
jet.position.set(58,42,BASE.z-38);
jetState.yaw=2.55; jetState.pitch=0; jetState.speed=50;
jet.rotation.set(0,jetState.yaw,0);
jetState.active=true; jetState.fireCd=2.6; jetState.mslCd=6;
if(jetFlame)jetFlame.visible=true;
if(jetGear)jetGear.visible=false;
document.getElementById('jetBox').classList.add('on');
document.getElementById('jetBar').style.width='100%';
showCenter('戦闘機が迎撃に来た！');
}
document.getElementById('skipBtn').addEventListener('click',function(e){ e.stopPropagation(); endScramble();});
scrambleOverlay.addEventListener('pointerdown',function(){ /* taps on banner area do not skip accidentally; button does */ });
function updateScramble(dt){
G.scrambleT+=dt;
var t=G.scrambleT;
// heli hovers in place during the short cutscene; the mission timer is paused
heliState.vel.multiplyScalar(Math.pow(0.02,dt));
heli.position.copy(heliState.pos);
heli.rotation.y=heliState.yaw+Math.PI/2;
if(t<0.7){
// on the runway, burners lighting
jet.position.set(BASE.runStart,1.36,BASE.z);
if(jetFlame){ jetFlame.visible=t>0.25; flickBurners(0.7,1.3); }
} else if(t<2.5){
var k=(t-0.7)/1.8; var ease=k*k;
jet.position.x=lerp(BASE.runStart,BASE.runEnd,ease);
jet.position.y=1.36; jet.position.z=BASE.z;
if(jetFlame){ jetFlame.visible=true; flickBurners(0.9,1.5); }
} else {
var k2=clamp((t-2.5)/(SCRAMBLE_DUR-2.5),0,1);
jet.position.x=BASE.runEnd+k2*46;
jet.position.y=1.36+k2*k2*36;
jet.position.z=BASE.z-k2*30;
jet.rotation.z=k2*0.38;
if(jetGear)jetGear.visible=k2<0.35;
jetState.yaw=lerp(0,0.55,k2); jet.rotation.y=jetState.yaw;
}
// runway chase camera
tmpV.set(jet.position.x-6,jet.position.y+5.5,jet.position.z+24);
camPos.lerp(tmpV,1-Math.pow(0.0001,dt));
camera.position.copy(camPos);
camera.lookAt(jet.position.x+6,jet.position.y+1,jet.position.z);
updateEffects(dt);
if(t>=SCRAMBLE_DUR)endScramble();
}

/* ================= flow ================= */
var hud=document.getElementById('hud');
var startScreen=document.getElementById('startScreen');
var resultScreen=document.getElementById('resultScreen');
function resetWorld(){
if(W2.ready)w2ResetWorld();
for(var i=0;i<destructibles.length;i++){
var o=destructibles[i];
o.hp=o.maxHp; o.destroyed=false; o.collapsing=0; o.stage=0; o.yenGiven=0; o.scoreGiven=0;
o.group.scale.set(1,1,1); o.group.position.y=0; o.group.rotation.set(0,o.isCar?o.group.rotation.y:0,0);
if(o.isCar){ o.group.rotation.y=o.axis==='z'?(o.dir>0?-Math.PI/2:Math.PI/2):(o.dir>0?0:Math.PI); if(!o.moving)o.group.rotation.y=o.group.userData.parkRot||o.group.rotation.y;}
if(o.group&&o.group.children){ for(var ch3=0;ch3<o.group.children.length;ch3++)o.group.children[ch3].visible=true; }
if(o.isCar&&o.group.userData.lights)o.group.userData.lights.forEach(function(s){ s.visible=!!o.moving; });
if(o.main){o.main.visible=true; if(o.mat&&o.mat.color)o.mat.color.setHex(o.baseTint);}
if(o.roof)o.roof.visible=true;
if(o.roof2)o.roof2.visible=true;
if(o.extraParts)o.extraParts.forEach(function(p){p.visible=true;});
if(o.rubble)o.rubble.visible=false;
}
// store parked rotations once
cars.forEach(function(c){ if(!c.moving&&c.group.userData.parkRot===undefined)c.group.userData.parkRot=c.group.rotation.y;});
for(var p=projectiles.length-1;p>=0;p--){scene.remove(projectiles[p].mesh);}
projectiles.length=0; pendingChains.length=0;
for(var e2=effects.length-1;e2>=0;e2--){ if(effects[e2].kind==='chunk')effects[e2].mesh.visible=false; else scene.remove(effects[e2].mesh);}
effects.length=0; pendingFx.length=0;
for(var e3=0;e3<embers.length;e3++){ scene.remove(embers[e3].mesh); if(embers[e3].mesh.material)embers[e3].mesh.material.dispose(); }
embers.length=0;
clearScorches(); popupsClear(); clearFireSpots();
}
function startGame(){
audio();
resetWorld();
resetJet();
resetEnemyHeli();
G.mode='play'; G.time=FUELMAX; G.score=0; G.yen=0; G.destroyed=0;
G.combo=0; G.comboTimer=0; G.maxCombo=0; G.heliHp=100; G.bombCd=0; G.mslCd=0; G.gunCd=0; G.homCd=0; G.homLeft=3; G.hitCd=0; G.elapsed=0; G.fuelT=0; G.fuelUsed=false; G.repairT=0; G.repairRate=0; G.repairCd=0;
if(fuelGroup)fuelGroup.visible=true; if(fuelPillar)fuelPillar.visible=true; if(fuelMarker)fuelMarker.visible=true;
G.warnBeep=0; G.crashT=0; G.crashStage=0; G.crashWait=0; G.crashReason='fuel';
G.scramblePhase='none'; G.scrambleT=0;
G.ehPhase='none'; G.ehIntroT=0; G.ehOrbit=0;
camYawOff=0; camPitchOff=0; camDrag.id=null;
scrambleOverlay.classList.remove('on');
ehIntroOverlay.classList.remove('on');
shake=0;
heliState.pos.set(PAD.x,26,PAD.z); heliState.vel.set(0,0,0); heliState.yaw=0; heliState.pitch=0; heliState.roll=0;
heli.visible=true; heliBodyMat.color.setHex(0xffffff);
audioBoot(); TOD.h=SETTINGS.tod===undefined?15.5:SETTINGS.tod; TOD.flow=!!SETTINGS.todFlow; todStep(0); startRotorSound(); musicStart(); VIEWMODE=({chase:0,cockpit:1,far:2})[SETTINGS.view]||0; heli.visible=(VIEWMODE!==1); FLARE.n=24; SIM.collKb=0.5; SIM.pitch=0; SIM.roll=0;
startScreen.classList.add('hidden'); resultScreen.classList.add('hidden');
hud.classList.add('on');
el.combo.classList.remove('show');
el.returnWarn.classList.remove('show');
el.refuelBox.classList.remove('show');
el.repairBox.classList.remove('show');
el.timeBox.classList.remove('low'); el.timeBox.classList.remove('warn');
updateHUD(); updateHpBar(); updatePadNav();
el.timeNum.textContent='90';
el.fuelBar.style.width='100%';
startEHIntro();
}
function rankFor(rate,score){
if(rate>=70)return'S'; if(rate>=50)return'A'; if(rate>=35)return'B'; if(rate>=20)return'C'; return'D';
}
var lastResult=null;
function startCrash(reason){
if(G.mode!=='play')return;
G.mode='crash'; G.crashT=0; G.crashStage=0; G.crashWait=0; G.crashReason=reason||'fuel';
el.returnWarn.classList.remove('show');
if(el.refuelBox)el.refuelBox.classList.remove('show');
if(el.repairBox)el.repairBox.classList.remove('show');
scrambleOverlay.classList.remove('on');
ehIntroOverlay.classList.remove('on'); if(G.ehPhase==='intro')G.ehPhase='none';
showCenter(reason==='shotdown'?'撃墜された！':'燃料切れ！');
stopRotorSound(true); musicStop();
sEngineFail();
}
function startFuelCrash(){ startCrash('fuel'); }
function endGame(reason){
if(G.mode!=='play'&&G.mode!=='crash')return;
G.mode='over';
stopRotorSound(false); musicStop();
ehIntroOverlay.classList.remove('on');
hud.classList.remove('on');
el.returnWarn.classList.remove('show');
var landed=(reason==='landed'), fuelOut=(reason==='fuel'), shotDown=(reason==='shotdown'||reason==='down');
var isOut=fuelOut||shotDown;
if(isOut&&heli.visible){ spawnExplosion(heliState.pos,true); heli.visible=false;}
var rate=totalCount?(G.destroyed/totalCount*100):0;
var rank=rankFor(rate,G.score);
var remain=Math.max(0,Math.ceil(G.time));
lastResult={score:G.score,rate:rate,yen:G.yen,down:G.destroyed,combo:G.maxCombo,rank:rank,hp:Math.max(0,Math.round(G.heliHp)),reason:reason,remain:remain,stage:currentStage};
document.getElementById('rStage').textContent=STAGE_DEFS[currentStage].name;
var rankBig=document.getElementById('rankBig');
rankBig.textContent=isOut?'アウト':rank;
rankBig.style.color=isOut?'var(--danger)':'';
document.getElementById('rankWord').textContent=landed?'帰還成功 — RANK':(fuelOut?'燃料切れで墜落':(shotDown?'戦闘機に撃墜されて墜落':'RANK'));
var note=document.getElementById('resultNote');
if(landed){ note.textContent='✈ ヘリポートへの帰還を確認 — ミッション完了！'; note.className='good'; note.style.display='block';}
else if(fuelOut){ note.textContent='燃料切れで墜落… スコアは参考値で、この結果は記録されません'; note.className='bad'; note.style.display='block';}
else if(shotDown){ note.textContent='戦闘機に撃墜されて墜落… スコアは参考値で、この結果は記録されません'; note.className='bad'; note.style.display='block';}
else { note.textContent=''; note.style.display='none';}
document.getElementById('rOutcome').textContent=landed?'帰還成功':(isOut?'アウト（記録なし）':'機体大破');
document.getElementById('rRemain').textContent=remain+'秒';
document.getElementById('rScore').textContent=fmt(G.score);
document.getElementById('rRate').textContent=rate.toFixed(1)+'%（'+G.destroyed+'/'+totalCount+'）';
document.getElementById('rYen').textContent=fmtYenFull(G.yen);
document.getElementById('rDown').textContent=G.destroyed+'棟・台';
document.getElementById('rCombo').textContent='×'+G.maxCombo;
document.getElementById('rHp').textContent=Math.max(0,Math.round(G.heliHp));
var isBest=false;
var prevBest=bestByStage[currentStage];
if(!isOut&&(!prevBest||G.score>prevBest.score)){ bestByStage[currentStage]={score:G.score,rate:rate,rank:rank}; best=bestByStage[currentStage]; isBest=true; }
best=bestByStage[currentStage]||null;
document.getElementById('newBest').style.display=isBest?'block':'none';
if(best){
document.getElementById('bestLine2').innerHTML='ベスト（'+STAGE_DEFS[currentStage].name+'）： スコア <b style="color:#ffb02e">'+fmt(best.score)+'</b> ／ 破壊率 '+best.rate.toFixed(1)+'% ／ ランク '+best.rank;
updateStageBestLine();
} else {
document.getElementById('bestLine2').textContent='ベスト（'+STAGE_DEFS[currentStage].name+'）： まだなし — 帰還に成功すると記録されます';
}
document.getElementById('copyBtn').style.display=isOut?'none':'block';
document.getElementById('copyMsg').textContent='';
resultScreen.classList.remove('hidden');
try{ resultReveal(G.score); }catch(eRv){}
}
function resultReveal(score){
var card=resultScreen.querySelector('.card'); card.classList.remove('anim'); void card.offsetWidth; card.classList.add('anim'); card.scrollTop=0;
var out=document.getElementById('rScore'); var t0=performance.now(); var dur=1200;
if(window.matchMedia&&window.matchMedia('(prefers-reduced-motion: reduce)').matches){ out.textContent=fmt(score); return; }
(function tick(){ var k=Math.min(1,(performance.now()-t0)/dur); var e=1-Math.pow(1-k,3); out.textContent=fmt(score*e); if(k<1)requestAnimationFrame(tick); else out.textContent=fmt(score); })();
}
document.querySelectorAll('.stageCard').forEach(function(card){
card.addEventListener('click',function(){
if(G.mode==='play')return;
document.querySelectorAll('.stageCard').forEach(function(c){c.classList.remove('sel');});
card.classList.add('sel');
audio();
loadStage(card.getAttribute('data-stage'));
});
});
document.getElementById('toStageBtn').addEventListener('click',function(){
G.mode='title';
resultScreen.classList.add('hidden');
startScreen.classList.remove('hidden');
hud.classList.remove('on');
heli.visible=true;
updateStageBestLine();
});
document.getElementById('startBtn').addEventListener('click',startGame);
document.getElementById('againBtn').addEventListener('click',startGame);
document.getElementById('copyBtn').addEventListener('click',function(){
if(!lastResult)return;
var landed=lastResult.reason==='landed';
var txt='🚁結果発表！\n'+
'ステージ：'+STAGE_DEFS[lastResult.stage||'city'].name+'\n'+
'結果：'+(landed?'帰還成功':'機体大破')+'\n'+
'ランク：'+lastResult.rank+'\n'+
'スコア：'+fmt(lastResult.score)+'\n'+
'破壊率：'+lastResult.rate.toFixed(1)+'%（'+lastResult.down+'/'+totalCount+'棟・台）\n'+
'被害総額：'+fmtYenFull(lastResult.yen)+'\n'+
'最大コンボ：×'+lastResult.combo+'\n'+
(landed?('残り燃料：'+lastResult.remain+'秒でヘリポートへ帰還成功。君も帰って来られる？'):('街をここまで更地にした。君は超えられる？'));
var msg=document.getElementById('copyMsg');
function done(){ msg.textContent='コピーしました！ SNSに貼って自慢しよう';}
function fallback(){
var ta=document.createElement('textarea'); ta.value=txt; ta.style.position='fixed'; ta.style.opacity='0';
document.body.appendChild(ta); ta.select();
try{document.execCommand('copy'); done();}catch(e){ msg.textContent='コピーできませんでした';}
document.body.removeChild(ta);
}
if(navigator.clipboard&&navigator.clipboard.writeText){ navigator.clipboard.writeText(txt).then(done,fallback);} else fallback();
});

/* ================= update ================= */
var clock=new THREE.Clock();
var camPos=new THREE.Vector3(0,42,110);
var tmpV=new THREE.Vector3(), tmpV2=new THREE.Vector3();

function step(dt){
// clouds drift always
var clouds=window.__clouds||[];
for(var ci=0;ci<clouds.length;ci++){ clouds[ci].position.x+=dt*1.2; if(clouds[ci].position.x>300)clouds[ci].position.x=-300;}
var csh=window.__cloudShadows||[];
for(var csi=0;csi<csh.length;csi++){ csh[csi].position.x+=dt*1.2; if(csh[csi].position.x>340)csh[csi].position.x=-340;}
// birds circle + flap
if(window.__birds&&window.__birds.g){
window.__birds.g.rotation.y+=dt*0.022;
var btNow=performance.now()*0.006;
for(var bwi=0;bwi<window.__birds.wings.length;bwi++){ var bw=window.__birds.wings[bwi]; var flap=Math.sin(btNow+bw.ph)*0.55; bw.l.rotation.z=flap; bw.r.rotation.z=-flap; }
}
// radar dishes keep sweeping; street trees sway in a light wind — both
// are a handful of rotation writes per frame, no new geometry or passes
for(var rsi=0;rsi<radarSpinners.length;rsi++)radarSpinners[rsi].rotation.y+=dt*0.55;
var swNow=performance.now()*0.001;
for(var swi=0;swi<swayTrees.length;swi++){ var sw=swayTrees[swi]; sw.g.rotation.z=Math.sin(swNow*0.9+sw.ph)*sw.am; sw.g.rotation.x=Math.cos(swNow*0.7+sw.ph)*sw.am*0.6; }
/* dusk progression + obstruction-light blink (runs in every mode so the
   title orbit also eases back to late afternoon) */
todStep(dt); var dk=DUSK.cur;
if(_lampGlowMat)_lampGlowMat.opacity=lerp(0.38,0.8,dk);
if(_lampPoolMat)_lampPoolMat.opacity=lerp(0.07,0.18,dk);
if(_carGlowMat){ _carGlowMat.opacity=lerp(0.5,0.95,dk); _carTailMat.opacity=lerp(0.45,0.85,dk); _carPoolMat.opacity=lerp(0.09,0.2,dk); }
var bcNow=performance.now()*0.001;
for(var bcn=0;bcn<beacons.length;bcn++){ var bc=beacons[bcn]; if(bc.o.destroyed){ if(bc.m.visible){ bc.m.visible=false; bc.s.visible=false; } continue; } var bon=((bcNow+bc.ph)%1.7)<0.95; if(bc.m.visible!==bon){ bc.m.visible=bon; bc.s.visible=bon; } }
// traffic signals cycle green -> yellow -> red like real intersections
// (only the active lamp is lit; the others sit dim). Colour writes happen
// only on a phase change, so this costs nothing between switches.
for(var tsi=0;tsi<trafficSignals.length;tsi++){ var ts=trafficSignals[tsi]; var tph=(bcNow+ts.off)%7; var act=tph<2.6?2:(tph<3.4?1:0); for(var tci=0;tci<3;tci++){ var ton=tci===act; var tst=ton?'on':'off'; if(ts.st[tci]!==tst){ ts.st[tci]=tst; ts.mats[tci].color.setHex(ton?ts.base[tci]:ts.dim[tci]); } } }
var rotorSpeed=G.mode==='play'?38:(G.mode==='crash'?Math.max(0,20-G.crashT*15):16);
rotorMain.rotation.y+=dt*rotorSpeed;
rotorTail.rotation.z+=dt*(rotorSpeed*1.2);
if(eRotorMain)eRotorMain.rotation.y+=dt*eRotorSpeed;
if(eRotorTail)eRotorTail.rotation.z+=dt*eRotorSpeed*1.2;
if(G.mode==='title')eRotorSpeed=lerp(eRotorSpeed,0,1-Math.pow(0.05,dt));
if(rotorBlur)rotorBlur.material.opacity=G.mode==='crash'?clamp(rotorSpeed/38,0,1)*0.13:0.13;
if(heliStrobe){ var sph=performance.now()%1500; heliStrobe.visible=(sph<55||(sph>150&&sph<205)); }
// hot exhaust shimmer-glow behind the engine outlets, flickering with
// rotor load — two shared sprites, no extra lights or particles
for(var exi=0;exi<heliExhaust.length;exi++){ heliExhaust[exi].material.opacity=clamp(rotorSpeed/38,0,1)*(0.12+0.06*Math.sin(performance.now()*0.023+exi*2.1)+0.03*Math.sin(performance.now()*0.11+exi)); }
if(tailBlur)tailBlur.material.opacity=0.14;
if(jetFlame&&jetFlame.visible)flickBurners(0.85,1.2);
if(jetStrobe){ var jph=performance.now()%1400; jetStrobe.visible=(jph<50||(jph>140&&jph<190)); }
// sun + shadow camera follow the heli (snapped to a grid) so shadow texel density stays high where the action is
var sunTx=Math.round(heliState.pos.x/4)*4, sunTz=Math.round(heliState.pos.z/4)*4;
sun.target.position.set(sunTx,0,sunTz);
sun.position.set(sunTx+150,lerp(118,70,DUSK.cur),sunTz+88);
// heliport beacon animation
if(padPillar)padPillar.material.opacity=0.13+Math.sin(performance.now()*0.004)*0.05;
if(padMarker){ padMarker.rotation.y+=dt*1.6; padMarker.position.y=19+Math.sin(performance.now()*0.0022)*1.1;}
if(fuelPillar)fuelPillar.material.opacity=0.10+Math.sin(performance.now()*0.004+1.5)*0.045;
if(fuelMarker){ fuelMarker.rotation.y+=dt*1.6; fuelMarker.position.y=19+Math.sin(performance.now()*0.0022+1.5)*1.1;}
if(repairPillar)repairPillar.material.opacity=0.10+Math.sin(performance.now()*0.004+3)*0.045;
if(repairMarker){ repairMarker.rotation.y+=dt*1.6; repairMarker.position.y=19+Math.sin(performance.now()*0.0022+3)*1.1;}

if(G.mode==='title'){
var t=performance.now()*0.00006;
heliState.pos.set(PAD.x+Math.sin(t*3)*6,26+Math.sin(performance.now()*0.001)*1.2,PAD.z);
heli.position.copy(heliState.pos);
heli.rotation.set(0,Math.PI/2+Math.sin(performance.now()*0.0004)*0.3,0);
tmpV.set(heliState.pos.x+Math.sin(t)*46,heliState.pos.y+13,heliState.pos.z+Math.cos(t)*46);
camPos.lerp(tmpV,0.03); camera.position.copy(camPos);
camera.lookAt(heliState.pos.x,10,heliState.pos.z-30);
if(Math.abs(camera.fov-60)>0.05){ camera.fov=lerp(camera.fov,60,1-Math.pow(0.001,dt)); camera.updateProjectionMatrix(); }
updateEffects(dt);
return;
}
if(G.mode==='crash'){
// out of fuel: engine dead, heli stalls, spins and falls
G.crashT+=dt;
if(G.crashStage===0){
var shot=G.crashReason==='shotdown';
heliState.vel.y-=(shot?55:40)*dt; if(heliState.vel.y<-36)heliState.vel.y=-36;
heliState.vel.x*=Math.pow(0.4,dt); heliState.vel.z*=Math.pow(0.4,dt);
heliState.pos.addScaledVector(heliState.vel,dt);
heliState.pos.y=Math.max(heliState.pos.y,1.78);
heliState.yaw+=dt*(shot?4.2:2.4);
heli.position.copy(heliState.pos);
heli.rotation.order='YXZ';
heli.rotation.y=heliState.yaw+Math.PI/2;
heli.rotation.x=lerp(heli.rotation.x,0.55,1-Math.pow(0.01,dt));
heli.rotation.z=lerp(heli.rotation.z,-0.45,1-Math.pow(0.01,dt));
if(heliState.pos.y<=1.85){
G.crashStage=1; G.crashWait=0;
spawnExplosion(heliState.pos.clone().setY(2.5),true);
heli.visible=false; shake=1.8;
}
} else {
G.crashWait+=dt;
if(G.crashWait>1.0){ endGame(G.crashReason); return;}
}
tmpV.set(heliState.pos.x+17,Math.max(heliState.pos.y+8,6),heliState.pos.z+17);
camPos.lerp(tmpV,1-Math.pow(0.001,dt)); camera.position.copy(camPos);
if(shake>0){ shake=Math.max(0,shake-dt*2.2); camera.position.x+=rand(-1,1)*shake*0.5; camera.position.y+=rand(-1,1)*shake*0.4;}
camera.lookAt(heliState.pos.x,2,heliState.pos.z);
updateEffects(dt);
return;
}
if(G.mode!=='play'){ updateEffects(dt); return;}

if(G.ehPhase==='intro'){ updateEHIntro(dt); return;}
if(G.scramblePhase==='cutscene'){ updateScramble(dt); return;}
G.elapsed+=dt;
if(G.scramblePhase==='none'&&G.elapsed>=SCRAMBLE_AT){ startScramble(); return;}
if(FREE)G.time=FUELMAX; else G.time-=dt;
if(G.time<=0){ G.time=0; el.timeNum.textContent='0'; el.fuelBar.style.width='0%'; startFuelCrash(); return;}
el.timeNum.textContent=Math.ceil(G.time);
el.timeBox.classList.toggle('low',G.time<=15);
el.timeBox.classList.toggle('warn',G.time<=30&&G.time>15);
el.fuelBar.style.width=clamp(G.time/FUELMAX*100,0,100)+'%';
// low-fuel warning: banner + beeps (faster under 10s)
var lowFuel=G.time<=30;
el.returnWarn.classList.toggle('show',lowFuel);
if(lowFuel){
el.returnWarn.textContent=G.time<=10?'⚠ 燃料あと'+Math.ceil(G.time)+'秒 — 今すぐヘリポートへ戻れ！':'⚠ 燃料残量わずか — ヘリポートへ戻れ！';
G.warnBeep-=dt;
if(G.warnBeep<=0){ sWarn(G.time<=10); G.warnBeep=G.time<=10?0.6:1.2;}
}

// cooldowns
if(G.bombCd>0)G.bombCd-=dt;
if(G.mslCd>0)G.mslCd-=dt;
if(G.gunCd>0)G.gunCd-=dt;
if(G.homCd>0)G.homCd-=dt;
if(G.hitCd>0)G.hitCd-=dt;
if(G.repairCd>0)G.repairCd-=dt;
// machine gun: hold H (PC) or the touch button for continuous fire
if(keys['KeyH']||input.gun)fireGun();
el.bombState.textContent=G.bombCd>0?G.bombCd.toFixed(1):'READY';
el.bombState.classList.toggle('ready',G.bombCd<=0);
el.mslState.textContent=G.mslCd>0?G.mslCd.toFixed(1):'READY';
el.mslState.classList.toggle('ready',G.mslCd<=0);
el.gunState.textContent=(keys['KeyH']||input.gun)?'発射中':'READY';
el.gunState.classList.toggle('ready',!(keys['KeyH']||input.gun));
el.homState.textContent=G.homLeft<=0?'残り0発':(G.homCd>0?G.homCd.toFixed(1)+' ・ 残'+G.homLeft+'発':'READY ・ 残'+G.homLeft+'発');
el.homState.classList.toggle('ready',G.homCd<=0&&G.homLeft>0);
if(el.homCount)el.homCount.textContent=G.homLeft;
el.btnBomb.classList.toggle('cd',G.bombCd>0);
el.btnMissile.classList.toggle('cd',G.mslCd>0);
el.btnHoming.classList.toggle('cd',G.homCd>0||G.homLeft<=0);

// combo timer
if(G.comboTimer>0){
G.comboTimer-=dt;
el.comboBar.style.width=clamp(G.comboTimer/2.5*100,0,100)+'%';
if(G.comboTimer<=0){ G.combo=0; el.combo.classList.remove('show');}
}

// input merge
var kb=readKeyboard();
var SN=SETTINGS.sens;
var mx=clamp(input.mx+kb.mx+JOY.roll,-1,1), mz=clamp(input.mz+kb.mz+JOY.pitch,-1,1);
var climbK=clamp((input.up?1:0)-(input.down?1:0)+(kb.up?1:0)-(kb.down?1:0),-1,1); SIMMODE=(SETTINGS.flight==='sim'); var climbIn=clamp(climbK+JOY.climb,-1,1);
var up=climbIn>0.12, down=climbIn<-0.12;
var yawIn=clamp((input.turnL?1:0)-(input.turnR?1:0)+(kb.tl?1:0)-(kb.tr?1:0)-JOY.yaw,-1,1);
var tl=yawIn>0.12, tr=yawIn<-0.12;

// heli physics — weighty: smoothed yaw rate, lagged cyclic, hover bob, rotor load audio
var turnInput=yawIn*SN+(SIMMODE?simTorque():0);
heliState.turnVel=lerp(heliState.turnVel||0,turnInput*1.55,1-Math.pow(0.0005,dt));
var turn=heliState.turnVel/1.55;
heliState.yaw+=heliState.turnVel*dt;
var sin=Math.sin(heliState.yaw), cos=Math.cos(heliState.yaw);
var fwdX=-sin, fwdZ=-cos;
var rightX=cos, rightZ=-sin;
// cyclic input is smoothed so the airframe feels like it has mass
heliState.cycX=lerp(heliState.cycX||0,mx,1-Math.pow(0.0008,dt));
heliState.cycZ=lerp(heliState.cycZ||0,mz,1-Math.pow(0.0008,dt));
/* standard flight model: the stick moves the heli horizontally and
   ▲/Space climbs, ▼/Shift descends — directly. The camera pitch
   (camPitchOff, set by dragging up/down) does NOT tilt the heli and
   does NOT change the flight direction — but it does swing the
   crosshair, and the missile / machine gun aim follows it. */
var accel=(30+Math.min(26,Math.max(0,(heliState.pos.y-50)*0.2)))*(0.55+0.75*THR);
var fIn=-heliState.cycZ;
if(SIMMODE){ simStep(dt,mx,mz,climbK); } else {
heliState.vel.x+=(fwdX*fIn+rightX*heliState.cycX)*accel*dt;
heliState.vel.z+=(fwdZ*fIn+rightZ*heliState.cycX)*accel*dt; }
if(!SIMMODE){ if(up||down)heliState.vel.y+=54*dt*climbIn;
heliState.vel.y*=Math.pow(0.30,dt);
heliState.vel.y=clamp(heliState.vel.y,-42,42); }
// gentle hover bob + translational lift (faster forward = slight climb)
var hSpeedPre=Math.sqrt(heliState.vel.x*heliState.vel.x+heliState.vel.z*heliState.vel.z);
if(!up&&!down&&Math.abs(fIn)<0.12)heliState.vel.y+=Math.sin(G.elapsed*1.7)*0.35*dt*8*0.12 + clamp(hSpeedPre*0.008,0,0.06);
setRotorLoad(clamp(hSpeedPre/30+Math.abs(heliState.turnVel)*0.25,0,1));
// damping horizontal (heavier airframe keeps sliding a touch longer)
var damp=SIMMODE?1:Math.pow(0.32,dt);
heliState.vel.x*=damp; heliState.vel.z*=damp;
var hSpeed=Math.sqrt(heliState.vel.x*heliState.vel.x+heliState.vel.z*heliState.vel.z);
var maxSp=SIMMODE?95:(30+Math.min(42,Math.max(0,(heliState.pos.y-50)*0.35)))*(0.55+0.75*THR);
if(hSpeed>maxSp){ heliState.vel.x*=maxSp/hSpeed; heliState.vel.z*=maxSp/hSpeed;}
heliState.pos.addScaledVector(heliState.vel,dt);
var gY=groundY(heliState.pos.x,heliState.pos.z); heliState.pos.y=clamp(heliState.pos.y,gY+1.85,1500); if(heliState.pos.y<=gY+1.9&&heliState.vel.y<0){ if(SIMMODE&&-heliState.vel.y>7.5&&(G.hitCd||0)<=0){ damageHeli((-heliState.vel.y-7)*6,'ハードランディング'); G.hitCd=0.9; shake=Math.min(shake+0.7,2); } heliState.vel.y=0; }
if(heliState.pos.y<=1.9&&heliState.vel.y<0)heliState.vel.y=0;
// rotor downwash kicks up dust while low over the ground
if(heliState.pos.y<11){ G.washT=(G.washT||0)-dt; if(G.washT<=0){ G.washT=0.13; spawnPuff(new THREE.Vector3(heliState.pos.x+rand(-3.5,3.5),0.8,heliState.pos.z+rand(-3.5,3.5)),0xa79b82,3.4,0.8,0.9,0.32);} }

// heli tilt from velocity (local) — deeper pitch in fast flight, banked turns
var lvx=heliState.vel.x*fwdX+heliState.vel.z*fwdZ; // forward speed
var lvz=heliState.vel.x*rightX+heliState.vel.z*rightZ; // right speed
var targetPitch=SIMMODE?SIM.pitch:clamp(lvx*0.014,-0.44,0.32);
var targetRoll=SIMMODE?SIM.roll+heliState.turnVel*-0.1:clamp(-lvz*0.013,-0.46,0.46)+heliState.turnVel*-0.16;
heliState.pitch=lerp(heliState.pitch||0,targetPitch,1-Math.pow(0.004,dt));
heliState.roll=lerp(heliState.roll||0,targetRoll,1-Math.pow(0.004,dt));
heli.position.copy(heliState.pos);
// faint airframe vibration from the rotor — the model is never perfectly still
heli.position.y+=Math.sin(performance.now()*0.085)*0.022+Math.sin(performance.now()*0.031)*0.014;
heli.rotation.order='YXZ';
// model nose is +X; rotation.y = yaw + PI/2 maps +X onto facing (-sin yaw, 0, -cos yaw)
heli.rotation.y=heliState.yaw+Math.PI/2;
heli.rotation.x=heliState.roll;
heli.rotation.z=-heliState.pitch;
updateAimDir();
// the belly gun tracks the crosshair: it yaws with the camera offset and
// pitches with the aim elevation, compensating the airframe's own lean
if(gunTurret){
gunTurret.rotation.y=camYawOff;
if(gunBarrel)gunBarrel.rotation.z=clamp(clamp(-camPitchOff,-1,1)+(heliState.pitch||0),-1.25,1.25);
}
if(tadsGroup){ tadsGroup.rotation.y=camYawOff*0.85; tadsGroup.rotation.z=clamp(-camPitchOff,-1,1)*0.45; }
// landed back at the heliport in time? -> mission complete
if(checkLanding()){ updatePadNav(); return;}

// refuelling spot: sit on the green pad for 5s -> +45s fuel (half a tank).
// The clock keeps ticking and enemy attacks keep coming while you sit there.
var fdx2=FUEL.x-heliState.pos.x, fdz2=FUEL.z-heliState.pos.z;
var onFuel=!G.fuelUsed&&(fdx2*fdx2+fdz2*fdz2<=FUEL.r*FUEL.r)&&heliState.pos.y<=2.4&&hSpeed<=7.5;
if(onFuel){
G.fuelT+=dt;
el.refuelBox.classList.add('show');
el.refuelBar.style.width=clamp(G.fuelT/5*100,0,100)+'%';
el.refuelSec.textContent=Math.max(0,5-G.fuelT).toFixed(1);
if(G.fuelT>=5){
G.fuelT=0;
G.time=Math.min(FUELMAX,G.time+60);
el.timeNum.textContent=Math.ceil(G.time);
el.fuelBar.style.width=clamp(G.time/FUELMAX*100,0,100)+'%';
el.refuelBox.classList.remove('show');
// one-shot spot: once used, the pad, its light pillar and marker are gone for the rest of the run
G.fuelUsed=true;
if(fuelGroup)fuelGroup.visible=false; if(fuelPillar)fuelPillar.visible=false; if(fuelMarker)fuelMarker.visible=false;
showCenter('⛽ 給油完了！ 燃料 +60秒');
sRefuel();
for(var fp=0;fp<6;fp++)spawnPuff(new THREE.Vector3(FUEL.x+rand(-3,3),1.6,FUEL.z+rand(-3,3)),0x7dffb0,2,1.4,0.8,0.5);
}
} else {
if(G.fuelT>0)G.fuelT=0;
el.refuelBox.classList.remove('show');
}

// repair depot: sit on the blue pad for 3s -> hull repaired back to full.
// Healing is applied gradually over the 3s (the full missing HP spread across
// the wait), so enemy hits taken while you sit there are NOT wiped out by the
// repair — take damage mid-repair and you lift off short of full. The fuel
// clock keeps ticking and enemy attacks keep coming the whole time.
var rdx2=REPAIR.x-heliState.pos.x, rdz2=REPAIR.z-heliState.pos.z;
var onRepair=(rdx2*rdx2+rdz2*rdz2<=REPAIR.r*REPAIR.r)&&heliState.pos.y<=2.4&&hSpeed<=7.5;
if(onRepair&&G.heliHp<100&&G.repairCd<=0){
setRepairBoxMode('repair');
if(G.repairT<=0){ G.repairRate=(100-G.heliHp)/3; }
G.repairT+=dt;
G.heliHp=Math.min(100,G.heliHp+G.repairRate*dt);
updateHpBar();
el.repairBox.classList.add('show');
el.repairBar.style.width=clamp(G.repairT/3*100,0,100)+'%';
el.repairSec.textContent=Math.max(0,3-G.repairT).toFixed(1);
if(Math.random()<0.3)spawnPuff(new THREE.Vector3(REPAIR.x+rand(-3.5,3.5),1.4,REPAIR.z+rand(-3.5,3.5)),0x8adcff,1.8,1.2,0.7,0.5);
if(G.repairT>=3){
var fullyFixed=G.heliHp>=99.5;
G.repairT=0; G.repairRate=0;
G.repairCd=10; // one use spent: the depot cannot be used again for 10s
el.repairBox.classList.remove('show');
showCenter(fullyFixed?'🔧 整備完了！ 耐久 全回復':'🔧 整備完了！（被弾分は回復しきれず）');
sRepair();
for(var rp=0;rp<6;rp++)spawnPuff(new THREE.Vector3(REPAIR.x+rand(-3,3),1.6,REPAIR.z+rand(-3,3)),0x8adcff,2,1.4,0.8,0.5);
}
} else {
if(G.repairT>0){ G.repairT=0; G.repairRate=0; }
// repair cooldown display: parked on the pad during the 10s cooldown,
// no repair starts — the box shows the remaining seconds instead
if(onRepair&&G.repairCd>0&&G.heliHp<100){
setRepairBoxMode('cd');
el.repairBox.classList.add('show');
el.repairBar.style.width=clamp((1-G.repairCd/10)*100,0,100)+'%';
el.repairSec.textContent=G.repairCd.toFixed(1);
} else {
el.repairBox.classList.remove('show');
}
}

// collision with buildings
if(G.hitCd<=0){
for(var i=0;i<destructibles.length;i++){
var o=destructibles[i];
if(o.destroyed||o.isCar)continue;
if(heliState.pos.y>o.height+1.2)continue;
var dx2=heliState.pos.x-o.group.position.x, dz2=heliState.pos.z-o.group.position.z;
if(Math.abs(dx2)<o.w/2+1.6&&Math.abs(dz2)<o.d/2+1.6){
G.heliHp-=16; G.hitCd=0.9; shake=Math.min(shake+0.9,1.6); fxHurt(1); fxHitStop(0.4,0.1);
sThunk();
// push out
if(Math.abs(dx2)>Math.abs(dz2)){ heliState.vel.x=(dx2>0?1:-1)*16; heliState.pos.x=o.group.position.x+(dx2>0?1:-1)*(o.w/2+2);}
else { heliState.vel.z=(dz2>0?1:-1)*16; heliState.pos.z=o.group.position.z+(dz2>0?1:-1)*(o.d/2+2);}
damageObject(o,12,heliState.pos);
updateHpBar();
showCenter('激突！ 機体ダメージ');
if(G.heliHp<=0){ G.heliHp=0; updateHpBar(); startCrash('shotdown'); return;}
break;
}
}
}
// ground crash if diving fast at ground handled by clamp; small damage if hitting ground hard
// projectiles
for(var pi=projectiles.length-1;pi>=0;pi--){
var pr=projectiles[pi];
if(pr.kind==='bomb'){ pr.vel.y-=30*dt; pr.mesh.rotation.x+=dt*3;}
else if(pr.kind==='gun'){ pr.life-=dt; if(pr.life<=0){ scene.remove(pr.mesh); projectiles.splice(pi,1); continue;} }
else { pr.life-=dt; pr.vel.y-=4*dt; if(pr.mesh.userData.flame)pr.mesh.userData.flame.scale.setScalar(rand(0.8,1.5)); if(pr.life<=0){ scene.remove(pr.mesh); projectiles.splice(pi,1); continue;}
// white smoke trail
pr.trailT=(pr.trailT||0)-dt; if(pr.trailT<=0){ pr.trailT=0.045; spawnPuff(pr.mesh.position.clone(),0xe8e8e8,1.7,0.4,0.85,0.5); }
// slight homing assist toward the jet so a skilled shot can connect
if(pr.kind==='missile'&&jetState.active&&!jetState.down){
var toJ=jet.position.clone().sub(pr.mesh.position); var dj=toJ.length();
if(dj<70&&dj>4){ var cur2=pr.vel.clone().normalize(); toJ.normalize(); if(cur2.dot(toJ)>0.55){ pr.vel.copy(cur2.lerp(toJ,clamp(1.5*dt,0,0.25)).normalize().multiplyScalar(pr.vel.length())); pr.mesh.quaternion.setFromUnitVectors(new THREE.Vector3(1,0,0),pr.vel.clone().normalize());}}
}
// same homing assist toward the enemy heli
if(pr.kind==='missile'&&ehState.active&&!ehState.down){
var toE=eheli.position.clone().sub(pr.mesh.position); var de=toE.length();
if(de<70&&de>4){ var cur3=pr.vel.clone().normalize(); toE.normalize(); if(cur3.dot(toE)>0.55){ pr.vel.copy(cur3.lerp(toE,clamp(1.5*dt,0,0.25)).normalize().multiplyScalar(pr.vel.length())); pr.mesh.quaternion.setFromUnitVectors(new THREE.Vector3(1,0,0),pr.vel.clone().normalize());}}
}
}
// homing missile: hard steering toward its locked target (or toward a
// flare decoy once the target spoofs the seeker)
if(pr.kind==='homing'){
var tp=null;
if(!pr.decoy){
if(pr.target==='jet'&&jetState.active&&!jetState.down)tp=jet.position;
else if(pr.target==='eh'&&ehState.active&&!ehState.down)tp=eheli.position;
else pr.target=null;
} else tp=pr.decoy;
if(tp){
var toT=tp.clone().sub(pr.mesh.position); var distT=toT.length();
if(pr.decoy&&distT<4.5){ var dp2=pr.mesh.position.clone(); spawnExplosion(dp2,false); homingSplash(dp2); scene.remove(pr.mesh); projectiles.splice(pi,1); updateHUD(); continue; }
if(!pr.decoy&&!pr.evadeChecked&&distT<30){
pr.evadeChecked=true;
if(Math.random()<0.28){
var tn=toT.clone().normalize();
var side=new THREE.Vector3(-tn.z,0,tn.x);
pr.decoy=tp.clone().add(side.multiplyScalar(rand(16,28)*(Math.random()<0.5?-1:1))).add(new THREE.Vector3(0,rand(-3,5),0));
for(var fl=0;fl<5;fl++)spawnPuff(tp.clone().add(new THREE.Vector3(rand(-1.5,1.5),rand(-1,1),rand(-1.5,1.5))),0xffc46b,1.6,0.5,0.5,0.9);
showCenter('敵がフレアを展開！ 誘導が逸れた');
}
}
var curH=pr.vel.clone().normalize(); toT.normalize();
pr.vel.copy(curH.lerp(toT,clamp((pr.decoy?2.2:3.4)*dt,0,0.6)).normalize().multiplyScalar(66));
pr.mesh.quaternion.setFromUnitVectors(new THREE.Vector3(1,0,0),pr.vel.clone().normalize());
}
}
pr.mesh.position.addScaledVector(pr.vel,dt);
var p=pr.mesh.position;
var hit=false;
if(jetState.active&&!jetState.down&&p.distanceTo(jet.position)<4.6){
damageJet(pr.kind==='homing'?50:(pr.kind==='missile'?38:(pr.kind==='gun'?4:20)));
if(pr.kind==='gun')spawnPuff(p.clone(),0xffc46b,2.4,1,0.5,0.65); else spawnExplosion(p.clone(),false);
if(pr.kind==='homing')homingSplash(p.clone());
scene.remove(pr.mesh); projectiles.splice(pi,1); updateHUD(); continue;
}
if(ehState.active&&!ehState.down&&p.distanceTo(eheli.position)<4.6){
damageEnemyHeli(pr.kind==='homing'?50:(pr.kind==='missile'?38:(pr.kind==='gun'?4:20)));
if(pr.kind==='gun')spawnPuff(p.clone(),0xffc46b,2.4,1,0.5,0.65); else spawnExplosion(p.clone(),false);
if(pr.kind==='homing')homingSplash(p.clone());
scene.remove(pr.mesh); projectiles.splice(pi,1); updateHUD(); continue;
}
if(p.y<=groundY(p.x,p.z)+0.6)hit=true;
var hitObj=null;
if(!hit){
for(var bi=0;bi<destructibles.length;bi++){
var bo=destructibles[bi];
if(bo.destroyed)continue;
if(p.y<=bo.height+0.4&&Math.abs(p.x-bo.group.position.x)<bo.w/2+0.5&&Math.abs(p.z-bo.group.position.z)<bo.d/2+0.5){ hit=true; hitObj=bo; break;}
}
}
if(hit){
if(pr.kind==='gun'){
// direct hit only: chips the target, sparks/dust, no explosion
if(hitObj)damageObject(hitObj,9,p);
spawnPuff(p.clone().setY(Math.max(p.y,0.8)),hitObj?0xffc46b:0x9a8d7a,1.9,1.1,0.45,0.55);
}
else if(pr.kind==='bomb')explodeAt(p.clone().setY(Math.max(p.y,1)),13,62,false);
else if(pr.kind==='homing'){ explodeAt(p.clone(),12,55,false); homingSplash(p.clone()); }
else explodeAt(p.clone(),10,48,false);
scene.remove(pr.mesh); projectiles.splice(pi,1);
updateHUD();
} else if(p.y<-4||Math.abs(p.x)>9000||Math.abs(p.z)>9000){ scene.remove(pr.mesh); projectiles.splice(pi,1);}
}
// pending chains
for(var ci2=pendingChains.length-1;ci2>=0;ci2--){
var ch=pendingChains[ci2]; ch.t-=dt;
if(ch.t<=0){ explodeAt(ch.pos,ch.radius,ch.dmg,ch.big); pendingChains.splice(ci2,1); updateHUD();}
}
// cars drive
for(var cai=0;cai<cars.length;cai++){
var c=cars[cai];
if(c.destroyed||!c.moving)continue;
if(c.axis==='z'){ c.group.position.z+=c.dir*c.speed*dt; if(c.group.position.z>WORLD+14)c.group.position.z=-WORLD-14; if(c.group.position.z<-WORLD-14)c.group.position.z=WORLD+14;}
else { c.group.position.x+=c.dir*c.speed*dt; if(c.group.position.x>WORLD+14)c.group.position.x=-WORLD-14; if(c.group.position.x<-WORLD-14)c.group.position.x=WORLD+14;}
// suspension working over the road surface: a small bounce and sway
// phased by distance travelled, so traffic never glides like it's on rails
c.travel=(c.travel||0)+c.speed*dt;
c.group.position.y=Math.abs(Math.sin(c.travel*1.35+(c.phase||0)))*0.05;
c.group.rotation.z=Math.sin(c.travel*0.9+(c.phase||0))*0.006;
}
carsLightUpdate(dt);
updateEnemyHeli(dt);
updateJet(dt);
// damaged jet trails dark smoke; enemy missiles leave thin trails too
if(jetState.active&&!jetState.down&&jetState.hp<jetState.maxHp*0.55){ jetState.smokeT-=dt; if(jetState.smokeT<=0){ jetState.smokeT=0.07; spawnPuff(jet.position.clone(),0x2e2c28,2.6,1.2,1.4,0.6);} }
for(var es=0;es<enemyShots.length;es++){ if(enemyShots[es].kind==='missile'&&Math.random()<0.6)spawnPuff(enemyShots[es].mesh.position.clone(),0xd8d8d8,1.3,0.3,0.7,0.45); }
updateEnemyShots(dt);
if(G.mode!=='play'){ return; } // shot down mid-frame: crash sequence takes over next frame
updateEffects(dt); updateFlares(dt);
// camera chase — with the player's drag orbit applied around the heli
var backDist=VIEWMODE===2?46:21, camH=VIEWMODE===2?16:7.5;
var facing=new THREE.Vector3(1,0,0).applyQuaternion(heli.quaternion); facing.y=0; facing.normalize();
// drag-look yaw: the heli itself turns to face wherever the camera was
// dragged to horizontally. The camera's view direction is heli yaw +
// camYawOff, so transferring the yaw offset into the heli's heading
// (rate-limited, so the airframe visibly swings around instead of
// snapping) points the nose exactly where the player looked.
// Pitch never tilts the heli or its flight direction either — but it
// does swing the crosshair, and the missile / gun aim follows it (the
// lookAt below is along aimDir, which updateAimDir set this frame).
if(camYawOff!==0){
var maxTurn=3.0*dt;
var tAmt=clamp(camYawOff,-maxTurn,maxTurn);
heliState.yaw+=tAmt; camYawOff-=tAmt;
if(Math.abs(camYawOff)<0.002){ heliState.yaw+=camYawOff; camYawOff=0; }
heli.rotation.y=heliState.yaw+Math.PI/2;
}
var offDir=facing.clone().applyAxisAngle(CAM_UP,camYawOff);
var cosP=Math.cos(camPitchOff);
tmpV.copy(heliState.pos).addScaledVector(offDir,-backDist*cosP); tmpV.y=heliState.pos.y+camH+Math.sin(camPitchOff)*backDist*0.75;
camPos.lerp(tmpV,1-Math.pow(0.0001,dt));
// keep camera above ground & out of buildings roughly
if(camPos.y<2.5)camPos.y=2.5;
if(VIEWMODE===1){ tmpV.set(1.05,1.62,0); heli.localToWorld(tmpV); camPos.copy(tmpV); }
camera.position.copy(camPos);
if(shake>0){ shake=Math.max(0,shake-dt*2.2); camera.position.x+=rand(-1,1)*shake*0.5; camera.position.y+=rand(-1,1)*shake*0.4;}
// the camera looks along the aim, so what sits under the crosshair is
// what the player is actually pointing the weapons at
tmpV2.copy(VIEWMODE===1?camera.position:heliState.pos).addScaledVector(aimDir,30);
camera.lookAt(tmpV2);
// speed widens the FOV a touch and the camera banks faintly with the
// airframe — cheap, but it makes fast low passes feel fast
var targetFov=(VIEWMODE===1?74:60)+clamp(hSpeed/30,0,1)*5.5+FX.kick*2.2;
if(Math.abs(camera.fov-targetFov)>0.05){ camera.fov=lerp(camera.fov,targetFov,1-Math.pow(0.001,dt)); camera.updateProjectionMatrix(); }
camera.rotateZ(VIEWMODE===1?clamp(-(heliState.roll||0)*0.95,-0.8,0.8):clamp((heliState.roll||0)*0.22,-0.06,0.06));
// crosshair rides the aim ray: project the convergence point and park the
// reticle on it, so it moves across the screen with the view camera
if(el.cross){
var aimProj=aimPoint.clone().project(camera);
el.cross.style.left=(clamp(aimProj.x*0.5+0.5,0.03,0.97)*100).toFixed(1)+'%';
el.cross.style.top=(clamp(-aimProj.y*0.5+0.5,0.03,0.97)*100).toFixed(1)+'%';
}
updateHUD();
updatePadNav();
}

/* ================= post-processing pipeline (HDR bloom + MSAA + grade) =================
   scene -> HalfFloat MSAA target -> UnrealBloom -> cinematic grade
   (chromatic edge, split-tone, vignette, hurt flash, shockwave warp) -> ACES output.
   An FPS governor steps quality down on weak devices; ?fxq=0..3 pins it. */
var FX={q:0,composer:null,bloom:null,gradePass:null,kick:0,hurt:0,hitKick:0,
ts:1,tsTarget:1,tsHold:0,acc:0,frames:0,low:0,last:0,t0:performance.now(),failed:false,pinned:false,
shock:{on:false,t:0,x:0.5,y:0.5},time:0};
var _fxQuery=(function(){ var o={}; try{ (location.search||'').replace(/^\?/,'').split('&').forEach(function(p){ var kv=p.split('='); if(kv[0])o[kv[0]]=kv[1]; }); }catch(e){} return o; })();
var FX_PARAM={bt:parseFloat(_fxQuery.bt)||1.25, bs:parseFloat(_fxQuery.bs)||0.46, br:parseFloat(_fxQuery.br)||0.62};
function fxPixelRatio(q){ var d=window.devicePixelRatio||1; return q>=3?Math.min(d,1.75):(q===2?Math.min(d,1.35):1.0); }
function fxDispose(){ if(FX.composer){ try{ FX.composer.dispose(); }catch(e){} } FX.composer=null; FX.bloom=null; FX.gradePass=null; }
var FX_GRADE={
uniforms:{tDiffuse:{value:null},uTime:{value:0},uAberr:{value:0.010},uVig:{value:0.30},uHurt:{value:0},uSat:{value:1.07},uAspect:{value:1.7},uShock:{value:0},uShockC:{value:new THREE.Vector2(0.5,0.5)},uShockR:{value:0},uSunS:{value:new THREE.Vector2(0.5,0.5)},uRay:{value:0}},
vertexShader:'varying vec2 vUv; void main(){ vUv=uv; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0); }',
fragmentShader:[
'uniform sampler2D tDiffuse; uniform float uTime,uAberr,uVig,uHurt,uSat,uAspect,uShock,uShockR,uRay; uniform vec2 uShockC,uSunS; varying vec2 vUv;',
'float hash(vec2 p){ return fract(sin(dot(p,vec2(12.9898,78.233)))*43758.5453); }',
'void main(){',
' vec2 uv=vUv; vec2 c=uv-0.5;',
' if(uShock>0.001){ vec2 sc=uv-uShockC; vec2 sa=vec2(sc.x*uAspect,sc.y); float sd=length(sa); float ring=smoothstep(0.075,0.0,abs(sd-uShockR))*uShock; uv+=normalize(sa+1e-5)*vec2(1.0/uAspect,1.0)*ring*0.028; }',
' float r2=dot(c,c);',
' vec2 off=c*r2*uAberr;',
' vec3 col=vec3(texture2D(tDiffuse,uv+off).r,texture2D(tDiffuse,uv).g,texture2D(tDiffuse,uv-off).b);',
' float l=dot(col,vec3(0.2126,0.7152,0.0722));',
' col*=mix(vec3(0.93,0.99,1.08),vec3(1.08,1.0,0.90),smoothstep(0.06,0.85,l));',
' col=mix(vec3(l),col,uSat);',
' float d=length(c)*1.414;',
' col*=1.0-uVig*smoothstep(0.42,1.12,d);',
' col=mix(col,col*vec3(1.7,0.32,0.26)+vec3(0.06,0.0,0.0),clamp(uHurt,0.0,1.0)*smoothstep(0.3,1.05,d));',
' col+=(hash(vUv*vec2(1920.0,1080.0)+fract(uTime*7.0))-0.5)*0.0035;',
' gl_FragColor=vec4(max(col,vec3(0.0)),1.0);',
'}'].join('\n')};
function buildFX(q){
fxDispose(); FX.q=q;
renderer.setPixelRatio(fxPixelRatio(q));
renderer.setSize(window.innerWidth,window.innerHeight);
if(q<=0)return;
var w=window.innerWidth,h=window.innerHeight,pr=renderer.getPixelRatio();
var comp=new THREE.EffectComposer(renderer);
var smp=q>=3?4:(q===2?2:0);
comp.renderTarget1.samples=smp; comp.renderTarget2.samples=smp;
comp.setPixelRatio(pr); comp.setSize(w,h);
comp.addPass(new THREE.RenderPass(scene,camera));
var bloom=new THREE.UnrealBloomPass(new THREE.Vector2(w,h),FX_PARAM.bs,FX_PARAM.br,FX_PARAM.bt);
comp.addPass(bloom);
var gp=new THREE.ShaderPass({uniforms:THREE.UniformsUtils.clone(FX_GRADE.uniforms),vertexShader:FX_GRADE.vertexShader,fragmentShader:FX_GRADE.fragmentShader});
comp.addPass(gp);
comp.addPass(new THREE.OutputPass());
FX.composer=comp; FX.bloom=bloom; FX.gradePass=gp;
gp.uniforms.uAspect.value=w/h;
}
function fxResize(){
var w=window.innerWidth,h=window.innerHeight;
if(FX.composer){ FX.composer.setPixelRatio(renderer.getPixelRatio()); FX.composer.setSize(w,h); if(FX.gradePass)FX.gradePass.uniforms.uAspect.value=w/h; }
}
function fogUpgrade(){
var C=THREE.ShaderChunk;
C.fog_pars_vertex='#ifdef USE_FOG\n varying float vFogDepth; varying vec3 vFogWP;\n#endif';
C.fog_vertex='#ifdef USE_FOG\n vFogDepth=-mvPosition.z; vFogWP=cameraPosition+(transpose(mat3(viewMatrix))*mvPosition.xyz);\n#endif';
C.fog_pars_fragment='#ifdef USE_FOG\n uniform vec3 fogColor; varying float vFogDepth; varying vec3 vFogWP;\n #ifdef FOG_EXP2\n uniform float fogDensity;\n #else\n uniform float fogNear; uniform float fogFar;\n #endif\n#endif';
C.fog_fragment='#ifdef USE_FOG\n float fd=vFogDepth; float dens=2.3/max(fogFar,1.0); float yA=0.5*(cameraPosition.y+vFogWP.y); float hfx=exp(-max(yA,0.0)*0.0017);\n float fogFactor=clamp(1.0-exp(-dens*fd*mix(1.0,hfx,0.72)),0.0,1.0);\n vec3 aer=mix(gl_FragColor.rgb,gl_FragColor.rgb*vec3(0.80,0.9,1.1),clamp(fd/(fogFar*0.9),0.0,1.0)*0.4);\n gl_FragColor.rgb=mix(aer,fogColor,fogFactor);\n#endif';
}
function fxInit(){
try{ fogUpgrade(); }catch(e){ console.warn('fog',e); }
renderer.toneMapping=THREE.NeutralToneMapping; if(_fxQuery.tm==='aces')renderer.toneMapping=THREE.ACESFilmicToneMapping; else if(_fxQuery.tm==='agx')renderer.toneMapping=THREE.AgXToneMapping;
if(_fxQuery.ex)renderer.toneMappingExposure=parseFloat(_fxQuery.ex);
var coarse=(window.matchMedia&&window.matchMedia('(pointer:coarse)').matches)||Math.min(window.innerWidth,window.innerHeight)<500;
var q=coarse?2:3;
if(_fxQuery.fxq!==undefined&&_fxQuery.fxq!==''){ q=clamp(parseInt(_fxQuery.fxq,10)||0,0,3); FX.pinned=true; }
try{
var ex=renderer.extensions;
if(!(ex.has('EXT_color_buffer_float')||ex.has('EXT_color_buffer_half_float'))) q=0;
buildFX(q);
}catch(e){ FX.failed=true; try{ buildFX(0);}catch(e2){} }
}
/* ---- feel: kicks, hit-stop, shock ring, popups ---- */
function fxKickAdd(a){ FX.kick=Math.min(1.4,FX.kick+a); }
function fxHitStop(scale,dur){ if(G.mode!=='play')return; if(scale<FX.tsTarget||FX.tsHold<=0)FX.tsTarget=scale; FX.tsHold=Math.max(FX.tsHold,dur); }
function fxHurt(a){ FX.hurt=Math.min(1,FX.hurt+a); }
var _fxV=new THREE.Vector3(),_fxD=new THREE.Vector3();
function fxShock(pos){
_fxV.copy(pos).project(camera);
if(_fxV.z>1||_fxV.z<-1)return;
FX.shock.on=true; FX.shock.t=0; FX.shock.x=_fxV.x*0.5+0.5; FX.shock.y=_fxV.y*0.5+0.5;
}
var POP={layer:null,pool:[],act:[]};
function popLayer(){ if(!POP.layer){ POP.layer=document.createElement('div'); POP.layer.id='popLayer'; var h=document.getElementById('hud'); (h||document.body).appendChild(POP.layer); } return POP.layer; }
function spawnPopup(pos,txt,cls,dur){
var L=popLayer(); var d=POP.pool.pop();
if(!d){ if(POP.act.length>=16){ var old=POP.act.shift(); d=old.el; } else { d=document.createElement('div'); L.appendChild(d); } }
d.className='pop '+(cls||''); d.textContent=txt; d.style.opacity='0';
POP.act.push({el:d,p:pos.clone(),t:0,dur:dur||1.15,jx:(Math.random()-0.5)*26});
}
function popupsClear(){ for(var i=0;i<POP.act.length;i++){ POP.act[i].el.style.opacity='0'; POP.pool.push(POP.act[i].el); } POP.act.length=0; }
function updatePopups(dt){
if(!POP.act.length)return;
camera.updateMatrixWorld(true);
var W=window.innerWidth,H=window.innerHeight;
for(var i=POP.act.length-1;i>=0;i--){
var a=POP.act[i]; a.t+=dt; var k=a.t/a.dur;
if(k>=1){ a.el.style.opacity='0'; POP.pool.push(a.el); POP.act.splice(i,1); continue; }
_fxV.copy(a.p); _fxV.y+=k*5.5; _fxV.project(camera);
if(_fxV.z>1){ a.el.style.opacity='0'; continue; }
var sx=(_fxV.x*0.5+0.5)*W+a.jx*k, sy=(-_fxV.y*0.5+0.5)*H;
var sc=k<0.12?(0.6+k/0.12*0.55):(1.15-(k-0.12)*0.2);
a.el.style.transform='translate('+sx.toFixed(1)+'px,'+sy.toFixed(1)+'px) translate(-50%,-50%) scale('+sc.toFixed(3)+')';
a.el.style.opacity=(k<0.1?k/0.1:(k>0.65?(1-k)/0.35:1)).toFixed(3);
}
}
function fxTime(dt,raw){
if(G.mode!=='play'){ FX.ts=1; FX.tsTarget=1; FX.tsHold=0; return dt; }
if(FX.tsHold>0){ FX.tsHold-=raw; FX.ts+=(FX.tsTarget-FX.ts)*0.6; }
else { FX.tsTarget=1; FX.ts+=(1-FX.ts)*Math.min(1,raw*9); }
return dt*FX.ts;
}
function fxUpdate(raw){
FX.time+=raw;
FX.kick=Math.max(0,FX.kick-raw*2.4);
FX.hurt=Math.max(0,FX.hurt-raw*1.7);
if(FX.shock.on){ FX.shock.t+=raw; if(FX.shock.t>0.9)FX.shock.on=false; }
updatePopups(raw);
var gp=FX.gradePass; if(!gp)return;
var u=gp.uniforms;
var low=(G.mode==='play'&&G.heliHp<35)?(0.22+0.14*Math.sin(FX.time*7.5)):0;
u.uTime.value=FX.time;
u.uAberr.value=0.009+Math.min(shake,2.4)*0.006+FX.kick*0.016+FX.hurt*0.014;
u.uHurt.value=Math.max(FX.hurt*0.85,low);
u.uVig.value=0.30+FX.hurt*0.15;
if(FX.shock.on){ var st=FX.shock.t/0.9; u.uShock.value=(1-st)*(1-st); u.uShockC.value.set(FX.shock.x,FX.shock.y); u.uShockR.value=st*0.9; } else u.uShock.value=0;
if(FX.bloom)FX.bloom.strength=FX_PARAM.bs+FX.kick*0.34+FX.hurt*0.12;
if(typeof TOD!=='undefined'&&W2.ready){ _fxV.copy(camera.position).addScaledVector(TOD.sunDir,2000).project(camera); camera.getWorldDirection(_fxD); var facing=_fxD.dot(TOD.sunDir); var dayK=Math.max(0,Math.min(1,(TOD.e+0.02)/0.25));
u.uSunS.value.set(_fxV.x*0.5+0.5,_fxV.y*0.5+0.5); u.uRay.value=(_fxV.z<1&&facing>0.05)?Math.min(1,facing*1.4)*dayK*(FX.q>=2?1:0):0; }
}
function fxGovern(ms){
if(FX.pinned||FX.q<=0||ms>250)return;
FX.acc+=ms; FX.frames++;
if(FX.acc>=1600){
var avg=FX.acc/FX.frames; FX.acc=0; FX.frames=0;
if(performance.now()-FX.t0<5000)return;
if(avg>27)FX.low++; else FX.low=0;
if(FX.low>=2){ FX.low=0; try{ buildFX(FX.q-1); }catch(e){ FX.failed=true; buildFX(0); } }
}
}
function fxRender(ms,raw){
if(FX.composer){ try{ FX.composer.render(raw); }catch(e){ FX.failed=true; try{ buildFX(0);}catch(e2){} renderer.render(scene,camera); } }
else renderer.render(scene,camera);
fxGovern(ms);
}

function loop(){
requestAnimationFrame(loop);
pollGamepad(); thrUpdate(Math.min((performance.now()-(FX.last||performance.now()))/1000,0.1));
var now=performance.now(); var rawMs=FX.last?now-FX.last:16.7; FX.last=now;
var raw=Math.min(rawMs/1000,0.1);
var dt=Math.min(clock.getDelta(),0.05);
dt=fxTime(dt,raw);
if(!G.paused){ if(G.mode==='play'&&PADBTN.gun)fireGun(); if(G.mode==='play'&&(JOY.lookX||JOY.lookY)){ camYawOff=clamp(camYawOff-JOY.lookX*raw*2.4,-Math.PI,Math.PI); camPitchOff=clamp(camPitchOff+JOY.lookY*raw*1.7,-1,1); } try{ step(dt);}catch(e){ errBox.style.display='block'; errBox.textContent='Error: '+e.message;} }
fpsTick(raw);
hud2Draw(raw); audioUpdate(raw); rotorWash(raw); cockpitUpdate(raw);
if(W2.ready){ W2A.uDusk.value=DUSK.cur; w2Update(raw); envUpdate(raw,false); w2Stream(false); cloudsUpdate(raw); w2LiteUpdate(raw); }
fxUpdate(raw);
fxRender(rawMs,raw);
}
// initial heli placement — the stage build is deferred one tick so the
// title screen paints (and DOMContentLoaded fires) before the heavy
// synchronous world build runs; the title overlay covers the brief gap
setTimeout(function(){ try{ loadStage('city'); heli.position.copy(heliState.pos); }catch(e){ errBox.style.display='block'; errBox.textContent='Error: '+e.message; } },30);
heli.position.copy(heliState.pos);
resetWorld();
resetEnemyHeli();
updateHUD();
fxInit(); applyGfx(); TOD.h=SETTINGS.tod===undefined?15.5:SETTINGS.tod; w2Init(); cloudsInit(); hud2Init(); buildCockpit(); w2Fog(0); todStep(0); w2Update(0.016); envUpdate(0,true); buildTitleButtons(); buildPauseMenu(); fpsShow(!!SETTINGS.fps);
loop();
setTimeout(function(){ initEnv(); },80);

window.addEventListener('resize',function(){
camera.aspect=window.innerWidth/window.innerHeight;
camera.updateProjectionMatrix();
renderer.setSize(window.innerWidth,window.innerHeight);
fxResize();
});
})();
/* boot complete: engine is running, enable sortie */
window.__heliBooted=true;
var __sb=document.getElementById('startBtn'); if(__sb)__sb.disabled=false;
var __bm=document.getElementById('bootMsg'); if(__bm)__bm.style.display='none';
var __sc=document.querySelectorAll('.stageCard'); for(var __i=0;__i<__sc.length;__i++)__sc[__i].disabled=false;
