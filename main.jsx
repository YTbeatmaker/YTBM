import React,{useEffect,useRef,useState} from 'react';
import {createRoot} from 'react-dom/client';
import './styles.css';

const CUE_KEYS=['1','2','3','4','5','6','7','8','9','0'];
const COLORS=['#ff4d6d','#ff9f1c','#ffd166','#06d6a0','#00b4d8','#4d96ff','#845ec2','#c77dff','#f72585','#90be6d'];

function extractId(input){
  const s=input.trim();
  if(/^[\w-]{11}$/.test(s)) return s;
  try{const u=new URL(s); if(u.hostname.includes('youtu.be')) return u.pathname.slice(1).split('/')[0]; if(u.searchParams.get('v')) return u.searchParams.get('v'); const m=u.pathname.match(/\/shorts\/([^/]+)/); if(m)return m[1];}catch{}
  return null;
}

function App(){
 const playerRef=useRef(null), playerObj=useRef(null), tick=useRef(null);
 const [url,setUrl]=useState('https://www.youtube.com/watch?v=dQw4w9WgXcQ');
 const [videoId,setVideoId]=useState('dQw4w9WgXcQ');
 const [ready,setReady]=useState(false),[playing,setPlaying]=useState(false),[duration,setDuration]=useState(0),[current,setCurrent]=useState(0);
 const [cues,setCues]=useState(()=>JSON.parse(localStorage.getItem('ytcue-cues')||'[]'));
 const [loop,setLoop]=useState({start:null,end:null,active:false});
 const [search,setSearch]=useState('');
 const [searchResults,setSearchResults]=useState([]);
 const [apiKey,setApiKey]=useState(localStorage.getItem('ytcue-key')||'');
 const [showKey,setShowKey]=useState(false);

 useEffect(()=>{localStorage.setItem('ytcue-cues',JSON.stringify(cues))},[cues]);
 useEffect(()=>{localStorage.setItem('ytcue-key',apiKey)},[apiKey]);
 useEffect(()=>{
   window.onYouTubeIframeAPIReady=()=>loadPlayer();
   if(window.YT?.Player) loadPlayer();
   else {const s=document.createElement('script');s.src='https://www.youtube.com/iframe_api';document.body.appendChild(s)}
   return()=>{clearInterval(tick.current)};
 },[videoId]);
 function loadPlayer(){
   if(playerObj.current) playerObj.current.destroy();
   playerObj.current=new window.YT.Player(playerRef.current,{videoId,playerVars:{playsinline:1,controls:1,rel:0},events:{onReady:e=>{setReady(true);setDuration(e.target.getDuration())},onStateChange:e=>setPlaying(e.data===1)}})
 }
 useEffect(()=>{clearInterval(tick.current);tick.current=setInterval(()=>{if(playerObj.current?.getCurrentTime){const t=playerObj.current.getCurrentTime();setCurrent(t);const d=playerObj.current.getDuration();if(d)setDuration(d);if(loop.active&&loop.start!=null&&loop.end!=null&&t>=loop.end){playerObj.current.seekTo(loop.start,true)}}},80);return()=>clearInterval(tick.current)},[loop.active,loop.start,loop.end]);
 function go(){const id=extractId(url);if(!id)return alert('URL YouTube invalide.');setVideoId(id);setReady(false);}
 function jump(t){playerObj.current?.seekTo(t,true);playerObj.current?.playVideo()}
 function addCue(i){if(!ready)return;const t=playerObj.current.getCurrentTime();setCues(old=>{const n=[...old];n[i]={time:t,name:n[i]?.name||`CUE ${i+1}`};return n})}
 function clearCue(i){setCues(old=>old.map((c,j)=>j===i?null:c))}
 function setLoopPoint(type){const t=playerObj.current?.getCurrentTime()||0;setLoop(l=>({...l,[type]:t}))}
 function format(t){t=Number(t)||0;return `${Math.floor(t/60)}:${String(Math.floor(t%60)).padStart(2,'0')}`}
 async function youtubeSearch(){if(!apiKey||!search.trim())return setShowKey(true);const r=await fetch(`https://www.googleapis.com/youtube/v3/search?part=snippet&type=video&maxResults=8&q=${encodeURIComponent(search)}&key=${encodeURIComponent(apiKey)}`);if(!r.ok)return alert('Recherche impossible : vérifie ta clé YouTube Data API.');const j=await r.json();setSearchResults(j.items||[])}
 useEffect(()=>{const fn=e=>{if((e.target.tagName==='INPUT'))return;const k=e.key.toLowerCase();if(CUE_KEYS.includes(k)){addCue(CUE_KEYS.indexOf(k));e.preventDefault()} if(k===' '){e.preventDefault();if(playerObj.current?.getPlayerState()===1)playerObj.current.pauseVideo();else playerObj.current?.playVideo()} if(k==='[')setLoopPoint('start');if(k===']')setLoopPoint('end')};window.addEventListener('keydown',fn);return()=>window.removeEventListener('keydown',fn)});
 return <div className="app">
  <header><div className="logo">YT<span>CUE</span></div><div className="tag">YOUTUBE BEAT LAB</div><button className="ghost" onClick={()=>setShowKey(!showKey)}>⚙ API</button></header>
  {showKey&&<div className="keybar"><span>YouTube Data API key</span><input value={apiKey} onChange={e=>setApiKey(e.target.value)} placeholder="AIza..."/><button onClick={()=>setShowKey(false)}>OK</button></div>}
  <section className="searchbar"><input value={search} onChange={e=>setSearch(e.target.value)} onKeyDown={e=>e.key==='Enter'&&youtubeSearch()} placeholder="Search YouTube…"/><button onClick={youtubeSearch}>SEARCH</button><div className="divider"/><input value={url} onChange={e=>setUrl(e.target.value)} onKeyDown={e=>e.key==='Enter'&&go()} placeholder="Paste YouTube URL"/><button onClick={go}>LOAD</button></section>
  {searchResults.length>0&&<div className="results">{searchResults.map(v=><button key={v.id.videoId} className="result" onClick={()=>{setVideoId(v.id.videoId);setUrl(`https://youtu.be/${v.id.videoId}`);setSearchResults([])}}><img src={v.snippet.thumbnails.default.url}/><span>{v.snippet.title}</span></button>)}</div>}
  <main>
   <div className="player"><div ref={playerRef} className="yt"/></div>
   <div className="transport"><button onClick={()=>playerObj.current?.seekTo(Math.max(0,current-5),true)}>−5</button><button className="play" onClick={()=>playing?playerObj.current?.pauseVideo():playerObj.current?.playVideo()}>{playing?'Ⅱ':'▶'}</button><button onClick={()=>playerObj.current?.seekTo(Math.min(duration,current+5),true)}>+5</button><span>{format(current)} / {format(duration)}</span></div>
   <div className="timeline" onClick={e=>{const r=e.currentTarget.getBoundingClientRect();jump(((e.clientX-r.left)/r.width)*duration)}}><div className="progress" style={{width:`${duration?current/duration*100:0}%`}}/>{cues.map((c,i)=>c&&<button key={i} className="marker" style={{left:`${duration?c.time/duration*100:0}%`,background:COLORS[i]}} onClick={e=>{e.stopPropagation();jump(c.time)}} title={`${c.name} — ${format(c.time)}`}>{CUE_KEYS[i]}</button>)}{loop.start!=null&&<i className="loopmark start" style={{left:`${duration?loop.start/duration*100:0}%`}}/>}{loop.end!=null&&<i className="loopmark end" style={{left:`${duration?loop.end/duration*100:0}%`}}/>}</div>
   <div className="timecodes"><span>0:00</span><span>{format(duration)}</span></div>
   <section className="panel"><div className="panelhead"><h2>CUES</h2><small>1–0 to trigger · click to jump</small></div><div className="pads">{CUE_KEYS.map((k,i)=>{const c=cues[i];return <div className="padwrap" key={k}><button className="pad" style={{'--accent':COLORS[i]}} onClick={()=>c?jump(c.time):addCue(i)}>{k}<small>{c?format(c.time):'SET'}</small></button>{c&&<button className="x" onClick={()=>clearCue(i)}>×</button>}</div>})}</div></section>
   <section className="panel loop"><div className="panelhead"><h2>LOOP</h2><small>[ set start · ] set end</small></div><div className="loopcontrols"><button onClick={()=>setLoopPoint('start')}>A <b>{loop.start==null?'—':format(loop.start)}</b></button><span>→</span><button onClick={()=>setLoopPoint('end')}>B <b>{loop.end==null?'—':format(loop.end)}</b></button><button className={loop.active?'active':''} onClick={()=>setLoop(l=>({...l,active:!l.active}))}>{loop.active?'LOOP ON':'LOOP OFF'}</button><button onClick={()=>setLoop({start:null,end:null,active:false})}>CLEAR</button></div></section>
  </main>
  <footer><span>YTCUE 0.1</span><span>Local cues are saved in your browser.</span><span>SPACE play/pause · 1–0 cues · [ ] loop</span></footer>
 </div>
}
createRoot(document.getElementById('root')).render(<App/>);
