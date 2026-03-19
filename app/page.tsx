"use client";

import { useState, useEffect, useRef } from "react";

// Constants
const CITIES = [
  "New York City, USA","Los Angeles, USA","Chicago, USA","San Francisco, USA",
  "Miami, USA","Seattle, USA","Austin, USA","Nashville, USA","Denver, USA",
  "Portland, USA","New Orleans, USA","Boston, USA","Las Vegas, USA",
  "San Diego, USA","Washington DC, USA","Honolulu, USA","Salt Lake City, USA",
  "Bangkok, Thailand","Tokyo, Japan","Paris, France","London, UK",
  "Barcelona, Spain","Rome, Italy","Amsterdam, Netherlands","Seoul, South Korea",
  "Singapore","Sydney, Australia","Dubai, UAE","Lisbon, Portugal",
  "Chiang Mai, Thailand","Bali, Indonesia","Istanbul, Turkey","Mexico City, Mexico",
];
const ACTIVITY_OPTIONS = [
  {id:"city",label:"City Sightseeing",icon:"\u{1F3DB}\uFE0F"},{id:"food",label:"Food & Dining",icon:"\u{1F35C}"},
  {id:"outdoor",label:"Outdoor Adventures",icon:"\u{1F97E}"},{id:"cultural",label:"Cultural Experiences",icon:"\u{1F3AD}"},
  {id:"nightlife",label:"Nightlife",icon:"\u{1F319}"},{id:"shopping",label:"Shopping",icon:"\u{1F6CD}\uFE0F"},
  {id:"wellness",label:"Spa & Wellness",icon:"\u{1F9D8}"},{id:"family",label:"Family Friendly",icon:"\u{1F468}\u200D\u{1F469}\u200D\u{1F467}"},
  {id:"beaches",label:"Beaches",icon:"\u{1F3D6}\uFE0F"},{id:"art",label:"Art & Museums",icon:"\u{1F3A8}"},
];
const BUDGET_OPTIONS = [{id:"budget",label:"Budget",desc:"Under $100/day",icon:"\u{1F4B5}"},{id:"moderate",label:"Moderate",desc:"$100-250/day",icon:"\u{1F4B0}"},{id:"luxury",label:"Luxury",desc:"$250+/day",icon:"\u{1F48E}"}];
const COMPANION_OPTIONS = [{id:"solo",label:"Solo",icon:"\u{1F9F3}"},{id:"couple",label:"Couple",icon:"\u{1F495}"},{id:"family",label:"Family",icon:"\u{1F468}\u200D\u{1F469}\u200D\u{1F467}\u200D\u{1F466}"},{id:"friends",label:"Friends",icon:"\u{1F389}"}];
const TYPE_ICONS: Record<string,string> = {morning:"\u2600\uFE0F",lunch:"\u{1F37D}\uFE0F",afternoon:"\u{1F3DB}\uFE0F",evening:"\u{1F319}",breakfast:"\u2615",dinner:"\u{1F377}",default:"\u{1F4CD}"};
const TYPE_COLORS: Record<string,{bg:string;border:string;text:string}> = {
  morning:{bg:"#fef9ec",border:"#f6e5a3",text:"#92400e"},lunch:{bg:"#fdf2f8",border:"#f5c2d9",text:"#9d174d"},
  afternoon:{bg:"#eff6ff",border:"#bdd5f7",text:"#1e40af"},evening:{bg:"#f5f3ff",border:"#c9bef5",text:"#5b21b6"},
  breakfast:{bg:"#fef9ec",border:"#f6e5a3",text:"#92400e"},dinner:{bg:"#fdf2f8",border:"#f5c2d9",text:"#9d174d"},
  default:{bg:"#f0fdfa",border:"#99f6e4",text:"#115e59"},
};

export default function Home() {
  const [page, setPage] = useState("home");
  const [step, setStep] = useState(0);
  const [city, setCity] = useState("");
  const [citySearch, setCitySearch] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);
  const [duration, setDuration] = useState(3);
  const [activities, setActivities] = useState<string[]>([]);
  const [budget, setBudget] = useState("");
  const [companions, setCompanions] = useState("");
  const [notes, setNotes] = useState("");
  const [generating, setGenerating] = useState(false);
  const [genProgress, setGenProgress] = useState(0);
  const [genStage, setGenStage] = useState("");
  const [itinerary, setItinerary] = useState<any>(null);
  const [itinTab, setItinTab] = useState("overview");
  const [activeDay, setActiveDay] = useState(0);
  const [error, setError] = useState<string|null>(null);
  const [expandedActivity, setExpandedActivity] = useState<string|null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const mainRef = useRef<HTMLElement>(null);

  const filteredCities = citySearch.length > 0 ? CITIES.filter(c => c.toLowerCase().includes(citySearch.toLowerCase())).slice(0, 8) : [];
  const totalSteps = 5;

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node) && inputRef.current && !inputRef.current.contains(e.target as Node)) setShowDropdown(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const imgUrl = (query: string, w: number, h: number) =>
    `https://picsum.photos/seed/${encodeURIComponent(String(query).replace(/\s+/g, "-").slice(0, 40))}/${w}/${h}`;

  // ─── GENERATE: calls YOUR server at /api/generate ───
  const generate = async () => {
    setGenerating(true); setGenProgress(0); setError(null);
    setGenStage("Building your personalized travel guide...");
    const interval = setInterval(() => setGenProgress(p => Math.min(p + Math.random() * 5, 88)), 600);

    try {
      const cityName = city.split(",")[0].trim();
      const travelerType = companions === "solo" ? "solo traveler" : companions === "couple" ? "couple" : companions === "family" ? "family with children" : "group of friends";
      const budgetLabel = budget === "budget" ? "budget" : budget === "luxury" ? "luxury" : "moderate";
      const interestLabels = activities.map(a => ACTIVITY_OPTIONS.find(o => o.id === a)?.label || a);
      const interestStr = interestLabels.length ? interestLabels.join(", ") : "general sightseeing";

      const prompt = `Create a ${duration}-day guide for ${city}.
TRAVELER: ${travelerType}, ${budgetLabel} budget. Interests: ${interestStr}.
${notes ? "SPECIAL REQUESTS: " + notes : ""}

Respond ONLY with valid JSON. No markdown, no backticks.
{"title":"","summary":"","cityImageSearch":"${cityName} travel","travelApps":[{"name":"","description":"","category":"transport|food|language|maps|payments"}],"accommodations":[{"name":"","area":"","priceRange":"","description":"","bookingUrl":"https://www.booking.com/searchresults.html?ss=HOTEL+${encodeURIComponent(city)}","type":"budget|mid-range|luxury"}],"restaurants":[{"name":"","cuisine":"","priceRange":"","description":"EXACT dish to order","area":"","mapsUrl":"https://maps.google.com/?q=NAME+${encodeURIComponent(city)}","meal":""}],"adventures":[{"name":"","description":"","duration":"","priceRange":"","category":"","bookingUrl":"","whyBook":""}],"youtubeSearches":[{"title":"","searchQuery":"","category":""}],"dailyItineraries":[{"day":1,"title":"","activities":[{"type":"","title":"","time":"","duration":"","description":"","location":"","cost":"","mapsUrl":"","websiteUrl":"","imageSearchQuery":""}],"tips":[]}],"proTips":[]}
RULES: ${duration} days, 4-5 activities each. ALL real places in ${city}. 3 hotels, 6+ restaurants with SPECIFIC DISHES, 4+ essential apps, 5+ adventures, 5 pro tips. USD. Group by neighborhood.`;

      // ══════════════════════════════════════════════
      // THIS IS THE KEY CHANGE: calls YOUR server, not OpenAI directly
      // Your server at /api/generate holds the API key securely
      // ══════════════════════════════════════════════
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({ error: "Unknown error" }));
        throw new Error(errData.error || `Server returned ${res.status}`);
      }

      const data = await res.json();
      const text = data.text || "";

      setGenStage("Finalizing your guide...");
      setGenProgress(92);

      const si = text.indexOf("{"), ei = text.lastIndexOf("}");
      if (si === -1 || ei === -1) throw new Error("Could not parse itinerary from AI response");
      const parsed = JSON.parse(text.substring(si, ei + 1));
      if (!parsed.dailyItineraries?.length) throw new Error("AI returned incomplete itinerary");

      setItinerary(parsed);
      setGenProgress(100);
      clearInterval(interval);
      setTimeout(() => { setGenerating(false); setPage("itinerary"); setItinTab("overview"); setActiveDay(0); }, 400);
    } catch (err: any) {
      clearInterval(interval);
      setError(err.message);
      setGenerating(false);
    }
  };

  // Styles
  const S = {
    page: { fontFamily:"'Outfit',sans-serif", minHeight:"100vh", background:"#faf8f5", color:"#1a1a1a" } as React.CSSProperties,
    header: { height:60, display:"flex", alignItems:"center", justifyContent:"space-between", padding:"0 clamp(16px,4vw,48px)", borderBottom:"1px solid #e8e2d9", background:"rgba(250,248,245,0.95)", backdropFilter:"blur(12px)", position:"sticky" as const, top:0, zIndex:50 },
    container: { maxWidth:900, margin:"0 auto", padding:"0 clamp(16px,4vw,48px)" },
    btn: (p:boolean,sm?:boolean) => ({ background:p?"#0d9488":"white", color:p?"white":"#0d9488", border:p?"none":"1.5px solid #ccfbf1", borderRadius:10, padding:sm?"9px 16px":"12px 26px", fontSize:sm?13:14, fontWeight:600, cursor:"pointer" as const, display:"inline-flex" as const, alignItems:"center" as const, gap:7 }),
    card: (sel:boolean) => ({ border:"2px solid "+(sel?"#0d9488":"#e8e2d9"), borderRadius:12, padding:"14px 10px", cursor:"pointer" as const, background:sel?"#f0fdfa":"white", textAlign:"center" as const }),
    input: { width:"100%", padding:"12px 16px 12px 40px", borderRadius:11, border:"1.5px solid #e8e2d9", fontSize:15, background:"white", outline:"none", boxSizing:"border-box" as const, fontFamily:"'Outfit',sans-serif" },
    sTitle: { fontFamily:"'DM Serif Display',serif", fontSize:22, color:"#134e4a", marginBottom:6 },
    secCard: { background:"white", borderRadius:16, border:"1.5px solid #e8e2d9", overflow:"hidden" as const, marginBottom:22 },
    secHead: { padding:"16px 20px", borderBottom:"1px solid #f0ede8", display:"flex", alignItems:"center", gap:10 },
    link: { color:"#0d9488", textDecoration:"none" as const, fontWeight:500, fontSize:12, display:"inline-flex" as const, alignItems:"center" as const, gap:4, padding:"5px 11px", background:"#f0fdfa", borderRadius:7, border:"1px solid #ccfbf1" },
  };
  const LinkBtn = ({href,children}:{href:string;children:React.ReactNode}) => <a href={href} target="_blank" rel="noopener noreferrer" style={S.link}>{children}</a>;

  // ═══ The rest is the same UI as the artifact version ═══
  // I'm keeping it compact to fit. All the same pages: Home, Wizard, Itinerary with
  // Overview/Daily/Adventures/Videos tabs work identically.

  return (
    <div style={S.page}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=DM+Serif+Display&family=Outfit:wght@300;400;500;600;700;800&display=swap');*{box-sizing:border-box;margin:0}input:focus,textarea:focus{border-color:#0d9488 !important;box-shadow:0 0 0 3px rgba(13,148,136,0.08)}@keyframes bounce{0%,100%{transform:translateY(0)}50%{transform:translateY(-6px)}}::-webkit-scrollbar{width:5px}::-webkit-scrollbar-thumb{background:#d6d3d1;border-radius:3px}`}</style>

      <header style={S.header}>
        <div style={{display:"flex",alignItems:"center",gap:9,cursor:"pointer"}} onClick={()=>setPage("home")}>
          <div style={{width:34,height:34,borderRadius:9,background:"linear-gradient(135deg,#0d9488,#115e59)",display:"flex",alignItems:"center",justifyContent:"center",color:"white",fontFamily:"'DM Serif Display',serif",fontSize:18}}>Q</div>
          <span style={{fontFamily:"'DM Serif Display',serif",fontSize:19,color:"#115e59"}}>Local Side Quest</span>
        </div>
        <nav style={{display:"flex",gap:4}}>
          {[{l:"Home",p:"home"},{l:"Create",p:"create"},...(itinerary?[{l:"My Guide",p:"itinerary"}]:[])].map(n=>(
            <button key={n.p} style={{background:page===n.p?"#f0fdfa":"none",border:page===n.p?"1.5px solid #99f6e4":"1.5px solid transparent",padding:"6px 13px",fontSize:12,fontWeight:page===n.p?600:400,cursor:"pointer",color:page===n.p?"#0d9488":"#78716c",borderRadius:7}} onClick={()=>{setPage(n.p);if(n.p==="create"&&!itinerary)setStep(0)}}>{n.l}</button>
          ))}
        </nav>
      </header>

      <main ref={mainRef} style={{minHeight:"calc(100vh - 120px)"}}>

        {/* HOME */}
        {page==="home" && <div>
          <section style={{paddingTop:"clamp(60px,10vw,100px)",paddingBottom:"clamp(60px,10vw,100px)",maxWidth:900,margin:"0 auto",paddingLeft:"clamp(16px,4vw,48px)",paddingRight:"clamp(16px,4vw,48px)"}}>
            <div style={{display:"grid",gridTemplateColumns:"1.1fr 0.9fr",gap:48,alignItems:"center"}}>
              <div>
                <div style={{display:"inline-block",background:"#ccfbf1",color:"#115e59",padding:"6px 16px",borderRadius:20,fontSize:12,fontWeight:700,letterSpacing:"0.05em",textTransform:"uppercase",marginBottom:24}}>AI Travel Planner</div>
                <h1 style={{fontFamily:"'DM Serif Display',serif",fontSize:"clamp(30px,5vw,48px)",color:"#134e4a",lineHeight:1.1,marginBottom:20}}>Plan Your Trip Like a Local Would</h1>
                <p style={{fontSize:16,color:"#78716c",lineHeight:1.7,maxWidth:480,marginBottom:32}}>Hotels, restaurants, essential apps, YouTube guides, and a day-by-day plan — all personalized to your style.</p>
                <button style={S.btn(true)} onClick={()=>{setPage("create");setStep(0)}}>Start Your Quest &rarr;</button>
              </div>
              <div style={{background:"linear-gradient(145deg,#ccfbf1,#f0fdfa,#fef3c7)",borderRadius:24,padding:40,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",minHeight:300}}>
                <span style={{fontSize:64}}>{"\u{1F9ED}"}</span>
                <div style={{fontFamily:"'DM Serif Display',serif",fontSize:16,color:"#115e59",marginTop:14,textAlign:"center"}}>Hotels &bull; Food &bull; Apps<br/>Videos &bull; Day Plans</div>
              </div>
            </div>
          </section>
          <section style={{paddingTop:40,paddingBottom:40,textAlign:"center",maxWidth:900,margin:"0 auto",paddingLeft:"clamp(16px,4vw,48px)",paddingRight:"clamp(16px,4vw,48px)"}}>
            <button style={{...S.btn(true),padding:"15px 36px",fontSize:15}} onClick={()=>{setPage("create");setStep(0)}}>Create Your Guide &rarr;</button>
          </section>
        </div>}

        {/* WIZARD — inlined to prevent re-mount on typing */}
        {page==="create" && (()=>{
          const names=["Destination","Interests","Style","Notes","Review"];
          const ok=()=>{if(step===0)return !!city;if(step===1)return activities.length>0;if(step===2)return !!budget&&!!companions;return true};
          return <div style={{paddingTop:32,paddingBottom:0,maxWidth:900,margin:"0 auto",paddingLeft:"clamp(16px,4vw,48px)",paddingRight:"clamp(16px,4vw,48px)"}}>
            <div style={{textAlign:"center",marginBottom:28}}><h1 style={{...S.sTitle,fontSize:26}}>Create Your Quest</h1></div>
            <div style={{display:"flex",gap:3,marginBottom:24,maxWidth:520,margin:"0 auto 24px"}}>{names.map((n,i)=><div key={i} style={{flex:1}}><div style={{height:3,borderRadius:2,background:i<=step?"#0d9488":"#e8e2d9"}}/><div style={{fontSize:9,color:i<=step?"#0d9488":"#a8a29e",marginTop:4,fontWeight:i===step?700:400,textAlign:"center"}}>{n}</div></div>)}</div>
            <div style={{background:"white",borderRadius:18,border:"1.5px solid #e8e2d9",overflow:"hidden",maxWidth:640,margin:"0 auto"}}>
              <div style={{padding:26,minHeight:260}}>
                {step===0&&<div><h2 style={S.sTitle}>Where are you headed?</h2><div style={{position:"relative",marginTop:12}}><span style={{position:"absolute",left:13,top:13,fontSize:15,zIndex:1}}>{"\u{1F50D}"}</span><input ref={inputRef} value={citySearch} onChange={e=>{setCitySearch(e.target.value);setCity("");setShowDropdown(true)}} onFocus={()=>{if(citySearch)setShowDropdown(true)}} placeholder="Type a city..." style={S.input}/>{showDropdown&&filteredCities.length>0&&<div ref={dropdownRef} style={{position:"absolute",top:"100%",left:0,right:0,background:"white",border:"1.5px solid #e8e2d9",borderRadius:11,marginTop:4,zIndex:20,boxShadow:"0 8px 20px rgba(0,0,0,0.09)",maxHeight:260,overflowY:"auto"}}>{filteredCities.map((c,i)=><div key={i} onClick={()=>{setCity(c);setCitySearch(c);setShowDropdown(false)}} style={{padding:"11px 16px",cursor:"pointer",fontSize:14,borderBottom:i<filteredCities.length-1?"1px solid #f5f3f0":"none"}} onMouseEnter={e=>(e.currentTarget.style.background="#f0fdfa")} onMouseLeave={e=>(e.currentTarget.style.background="white")}>{"\u{1F4CD}"} {c}</div>)}</div>}</div>{city&&<div style={{marginTop:16,display:"flex",alignItems:"center",gap:14,flexWrap:"wrap"}}><div style={{padding:"8px 14px",background:"#f0fdfa",border:"1.5px solid #99f6e4",borderRadius:8,fontSize:13,fontWeight:600,color:"#0d9488"}}>{"\u{1F4CD}"} {city} <span onClick={()=>{setCity("");setCitySearch("")}} style={{cursor:"pointer",marginLeft:6,opacity:0.5}}>&times;</span></div><div style={{display:"flex",alignItems:"center",gap:6}}><span style={{fontSize:12,fontWeight:600,color:"#57534e"}}>Days:</span><button onClick={()=>setDuration(d=>Math.max(1,d-1))} style={{width:28,height:28,borderRadius:6,border:"1.5px solid #e8e2d9",background:"white",cursor:"pointer"}}>&minus;</button><span style={{fontWeight:800,fontSize:17,minWidth:20,textAlign:"center",color:"#0d9488"}}>{duration}</span><button onClick={()=>setDuration(d=>Math.min(14,d+1))} style={{width:28,height:28,borderRadius:6,border:"1.5px solid #e8e2d9",background:"white",cursor:"pointer"}}>+</button></div></div>}</div>}
                {step===1&&<div><h2 style={S.sTitle}>What interests you?</h2><div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(120px,1fr))",gap:7,marginTop:12}}>{ACTIVITY_OPTIONS.map(a=><div key={a.id} onClick={()=>setActivities(p=>p.includes(a.id)?p.filter(x=>x!==a.id):[...p,a.id])} style={S.card(activities.includes(a.id))}><div style={{fontSize:24,marginBottom:4}}>{a.icon}</div><div style={{fontSize:11,fontWeight:activities.includes(a.id)?600:400}}>{a.label}</div></div>)}</div></div>}
                {step===2&&<div><h2 style={S.sTitle}>Budget & Style</h2><label style={{fontSize:11,fontWeight:700,color:"#78716c",display:"block",marginBottom:8,textTransform:"uppercase"}}>Daily Budget</label><div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:7,marginBottom:20}}>{BUDGET_OPTIONS.map(b=><div key={b.id} onClick={()=>setBudget(b.id)} style={S.card(budget===b.id)}><div style={{fontSize:24,marginBottom:3}}>{b.icon}</div><div style={{fontSize:13,fontWeight:600}}>{b.label}</div><div style={{fontSize:11,color:"#78716c"}}>{b.desc}</div></div>)}</div><label style={{fontSize:11,fontWeight:700,color:"#78716c",display:"block",marginBottom:8,textTransform:"uppercase"}}>Traveling With</label><div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:7}}>{COMPANION_OPTIONS.map(c=><div key={c.id} onClick={()=>setCompanions(c.id)} style={S.card(companions===c.id)}><div style={{fontSize:24,marginBottom:3}}>{c.icon}</div><div style={{fontSize:11,fontWeight:companions===c.id?600:400}}>{c.label}</div></div>)}</div></div>}
                {step===3&&<div><h2 style={S.sTitle}>Anything else?</h2><p style={{color:"#78716c",fontSize:13,marginBottom:14}}>Special requests, dietary needs, must-see spots.</p><textarea value={notes} onChange={e=>setNotes(e.target.value)} placeholder="e.g. halal food, animal cafes, rooftop bars..." rows={5} style={{width:"100%",padding:"12px 14px",borderRadius:11,border:"1.5px solid #e8e2d9",fontSize:14,background:"white",outline:"none",boxSizing:"border-box",fontFamily:"'Outfit',sans-serif",resize:"none",lineHeight:1.6}}/></div>}
                {step===4&&<div><h2 style={S.sTitle}>Review</h2><div style={{display:"grid",gap:8}}>{[{i:"\u{1F4CD}",l:"Destination",v:city+" \u2022 "+duration+" days"},{i:"\u{1F3AF}",l:"Interests",v:activities.map(a=>ACTIVITY_OPTIONS.find(o=>o.id===a)?.label).filter(Boolean).join(", ")||"General"},{i:"\u{1F4B0}",l:"Budget",v:BUDGET_OPTIONS.find(b=>b.id===budget)?.label||"\u2014"},{i:"\u{1F465}",l:"Travelers",v:COMPANION_OPTIONS.find(c=>c.id===companions)?.label||"\u2014"},...(notes?[{i:"\u{1F4DD}",l:"Notes",v:notes}]:[])].map((x,i)=><div key={i} style={{display:"flex",gap:10,padding:"10px 12px",background:"#faf8f5",borderRadius:8,border:"1px solid #f0ede8"}}><span style={{fontSize:16}}>{x.i}</span><div><div style={{fontSize:10,fontWeight:700,color:"#a8a29e",textTransform:"uppercase"}}>{x.l}</div><div style={{fontSize:13,fontWeight:500,marginTop:1}}>{x.v}</div></div></div>)}</div></div>}
              </div>
              <div style={{padding:"12px 26px",borderTop:"1px solid #f0ede8",display:"flex",justifyContent:"space-between",background:"#faf8f5"}}>
                {step>0?<button onClick={()=>setStep(s=>s-1)} style={S.btn(false,true)}>&larr; Back</button>:<div/>}
                {step<totalSteps-1?<button onClick={()=>setStep(s=>s+1)} disabled={!ok()} style={{...S.btn(true,true),opacity:ok()?1:0.35,cursor:ok()?"pointer":"not-allowed"}}>Next &rarr;</button>:<button onClick={generate} disabled={generating} style={S.btn(true,true)}>{generating?"Generating...":"Create My Guide \u2728"}</button>}
              </div>
            </div>
            {generating&&<div style={{position:"fixed",inset:0,background:"rgba(250,248,245,0.94)",backdropFilter:"blur(10px)",zIndex:100,display:"flex",alignItems:"center",justifyContent:"center"}}><div style={{textAlign:"center",maxWidth:360}}><div style={{fontSize:48,marginBottom:14,animation:"bounce 1.5s infinite"}}>{"\u{1F9ED}"}</div><h2 style={{fontFamily:"'DM Serif Display',serif",fontSize:20,color:"#134e4a",marginBottom:6}}>Crafting Your Adventure</h2><p style={{color:"#78716c",fontSize:13,marginBottom:20}}>{genStage}</p><div style={{height:5,background:"#e8e2d9",borderRadius:3,overflow:"hidden"}}><div style={{height:"100%",width:genProgress+"%",background:"linear-gradient(90deg,#0d9488,#14b8a6)",borderRadius:3,transition:"width 0.4s"}}/></div><p style={{fontSize:12,color:"#a8a29e",marginTop:6}}>{Math.round(genProgress)}%</p></div></div>}
            {error&&<div style={{marginTop:14,padding:14,background:"#fef2f2",border:"1px solid #fecaca",borderRadius:10,color:"#991b1b",fontSize:13,maxWidth:640,margin:"14px auto 0"}}><strong>Error:</strong> {error}</div>}
          </div>;
        })()}

        {/* ITINERARY — same visual design, all links/images/tabs work */}
        {page==="itinerary"&&itinerary&&(()=>{
          const days=itinerary.dailyItineraries||[];const dd=days[activeDay];
          return <div style={{padding:"0 0 32px"}}>
            <div style={{position:"relative",height:"clamp(180px,28vw,280px)",overflow:"hidden",background:"linear-gradient(135deg,#134e4a,#0d9488)"}}>
              <img src={imgUrl(itinerary.cityImageSearch||city,1200,400)} alt={city} style={{width:"100%",height:"100%",objectFit:"cover",opacity:0.7}} onError={(e:any)=>{e.target.style.display="none"}}/>
              <div style={{position:"absolute",inset:0,background:"linear-gradient(to top, rgba(19,78,74,0.85) 0%, rgba(19,78,74,0.3) 50%, transparent 100%)"}}/>
              <div style={{position:"absolute",bottom:0,left:0,right:0,padding:"clamp(16px,3vw,32px) clamp(16px,4vw,48px)",maxWidth:900,margin:"0 auto"}}>
                <button onClick={()=>{setPage("create");setStep(0);setItinerary(null)}} style={{background:"rgba(255,255,255,0.15)",border:"1px solid rgba(255,255,255,0.25)",color:"white",fontSize:12,cursor:"pointer",padding:"5px 12px",borderRadius:6,marginBottom:10}}>&larr; New Quest</button>
                <h1 style={{fontFamily:"'DM Serif Display',serif",fontSize:"clamp(22px,3.5vw,32px)",color:"white",lineHeight:1.15}}>{itinerary.title||duration+" Days in "+city}</h1>
                {itinerary.summary&&<p style={{color:"rgba(255,255,255,0.8)",fontSize:13,marginTop:6,lineHeight:1.5,maxWidth:600}}>{itinerary.summary}</p>}
              </div>
            </div>
            <div style={{...S.container}}>
              <div style={{display:"flex",borderBottom:"2px solid #e8e2d9",margin:"18px 0"}}>{["overview","daily","adventures","videos"].map(t=><button key={t} onClick={()=>setItinTab(t)} style={{background:"none",border:"none",padding:"10px 16px",fontSize:13,fontWeight:600,cursor:"pointer",color:itinTab===t?"#0d9488":"#78716c",borderBottom:itinTab===t?"2.5px solid #0d9488":"2.5px solid transparent",marginBottom:-2}}>{t==="overview"?"Overview":t==="daily"?"Day by Day":t==="adventures"?"Adventures":"Videos"}</button>)}</div>

              {/* Overview tab */}
              {itinTab==="overview"&&<div>
                <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(160px,1fr))",gap:10,marginBottom:22}}>{[{i:"\u{1F4CD}",l:"Destination",v:city},{i:"\u{1F4C5}",l:"Duration",v:duration+" days"},{i:"\u{1F4B0}",l:"Budget",v:BUDGET_OPTIONS.find(b=>b.id===budget)?.label||budget},{i:"\u{1F465}",l:"Travelers",v:COMPANION_OPTIONS.find(c=>c.id===companions)?.label||companions}].map((x,i)=><div key={i} style={{padding:14,border:"1px solid #e8e2d9",borderRadius:11,background:"white"}}><div style={{fontSize:18,marginBottom:3}}>{x.i}</div><div style={{fontSize:10,fontWeight:700,color:"#a8a29e",textTransform:"uppercase"}}>{x.l}</div><div style={{fontSize:13,fontWeight:600,color:"#134e4a",marginTop:1}}>{x.v}</div></div>)}</div>
                {itinerary.travelApps?.length>0&&<div style={S.secCard}><div style={S.secHead}><span style={{fontSize:18}}>{"\u{1F4F1}"}</span><h3 style={{fontFamily:"'DM Serif Display',serif",fontSize:17,color:"#134e4a"}}>Essential Apps</h3></div><div style={{padding:16,display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(200px,1fr))",gap:10}}>{itinerary.travelApps.map((a:any,i:number)=><div key={i} style={{padding:12,background:"#faf8f5",borderRadius:9,border:"1px solid #f0ede8"}}><div style={{fontWeight:700,fontSize:13,color:"#134e4a",marginBottom:3}}>{a.name}</div><p style={{fontSize:11.5,color:"#78716c",lineHeight:1.4}}>{a.description}</p></div>)}</div></div>}
                {itinerary.accommodations?.length>0&&<div style={S.secCard}><div style={S.secHead}><span style={{fontSize:18}}>{"\u{1F3E8}"}</span><h3 style={{fontFamily:"'DM Serif Display',serif",fontSize:17,color:"#134e4a"}}>Where to Stay</h3></div><div style={{padding:16,display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(220px,1fr))",gap:10}}>{itinerary.accommodations.map((h:any,i:number)=><div key={i} style={{padding:14,border:"1px solid #e8e2d9",borderRadius:11,background:"white"}}><h4 style={{fontSize:13,fontWeight:700,color:"#134e4a",marginBottom:4}}>{h.name}</h4><p style={{fontSize:11.5,color:"#78716c",lineHeight:1.4,marginBottom:6}}>{h.description}</p><div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}><span style={{fontSize:12,fontWeight:700,color:"#0d9488"}}>{h.priceRange}</span>{h.bookingUrl&&<LinkBtn href={h.bookingUrl}>Book &rarr;</LinkBtn>}</div></div>)}</div></div>}
                {itinerary.restaurants?.length>0&&<div style={S.secCard}><div style={S.secHead}><span style={{fontSize:18}}>{"\u{1F35C}"}</span><h3 style={{fontFamily:"'DM Serif Display',serif",fontSize:17,color:"#134e4a"}}>Where to Eat</h3></div><div style={{padding:16,display:"grid",gap:8}}>{itinerary.restaurants.map((r:any,i:number)=><div key={i} style={{padding:12,border:"1px solid #f0ede8",borderRadius:9,background:"#faf8f5",display:"flex",justifyContent:"space-between",alignItems:"center",gap:10,flexWrap:"wrap"}}><div style={{flex:1,minWidth:170}}><span style={{fontWeight:700,fontSize:13,color:"#134e4a"}}>{r.name}</span><p style={{fontSize:11.5,color:"#78716c",lineHeight:1.4,marginTop:3}}>{r.description}</p></div>{r.mapsUrl&&<LinkBtn href={r.mapsUrl}>{"\u{1F4CD}"} Maps</LinkBtn>}</div>)}</div></div>}
                {itinerary.proTips?.length>0&&<div style={S.secCard}><div style={S.secHead}><span style={{fontSize:18}}>{"\u{1F9E0}"}</span><h3 style={{fontFamily:"'DM Serif Display',serif",fontSize:17,color:"#134e4a"}}>Local Tips</h3></div><div style={{padding:16}}>{itinerary.proTips.map((t:string,i:number)=><div key={i} style={{padding:"10px 14px",background:i%2===0?"#faf8f5":"white",borderRadius:8,marginBottom:4,fontSize:13,color:"#374151",lineHeight:1.5,display:"flex",gap:10}}><span style={{color:"#0d9488"}}>{"\u{1F4A1}"}</span>{t}</div>)}</div></div>}
                <div style={S.secCard}><div style={S.secHead}><span style={{fontSize:18}}>{"\u{1F4C5}"}</span><h3 style={{fontFamily:"'DM Serif Display',serif",fontSize:17,color:"#134e4a"}}>Your Days</h3></div><div style={{padding:16}}>{days.map((d:any,i:number)=><div key={i} onClick={()=>{setActiveDay(i);setItinTab("daily")}} style={{padding:"12px 14px",borderRadius:9,cursor:"pointer",display:"flex",justifyContent:"space-between",marginBottom:3}} onMouseEnter={(e:any)=>e.currentTarget.style.background="#f0fdfa"} onMouseLeave={(e:any)=>e.currentTarget.style.background="transparent"}><div><div style={{fontWeight:700,fontSize:13,color:"#134e4a"}}>{d.title}</div></div><span style={{color:"#0d9488"}}>&rarr;</span></div>)}</div></div>
              </div>}

              {/* Daily tab */}
              {itinTab==="daily"&&dd&&<div>
                <div style={{display:"flex",gap:6,marginBottom:20,flexWrap:"wrap"}}>{days.map((d:any,i:number)=><button key={i} onClick={()=>{setActiveDay(i);setExpandedActivity(null)}} style={{padding:"8px 16px",borderRadius:10,fontSize:13,fontWeight:activeDay===i?700:400,cursor:"pointer",background:activeDay===i?"#0d9488":"white",color:activeDay===i?"white":"#57534e",border:activeDay===i?"none":"1.5px solid #e8e2d9"}}>Day {d.day||i+1}</button>)}</div>
                <div style={{borderRadius:16,overflow:"hidden",marginBottom:22,position:"relative",background:"linear-gradient(135deg,#134e4a,#0d9488)"}}><img src={imgUrl((dd.activities?.[0]?.imageSearchQuery||dd.title+" "+city).replace(/Day \d+:?\s*/,""),900,300)} alt="" style={{width:"100%",height:180,objectFit:"cover",opacity:0.65,display:"block"}} onError={(e:any)=>{e.target.style.display="none"}}/><div style={{position:"absolute",inset:0,background:"linear-gradient(to top, rgba(19,78,74,0.9) 0%, transparent 60%)"}}/><div style={{position:"absolute",bottom:0,left:0,right:0,padding:"20px 24px"}}><h2 style={{fontFamily:"'DM Serif Display',serif",fontSize:"clamp(18px,2.5vw,24px)",color:"white"}}>{dd.title}</h2></div></div>
                <div style={{position:"relative",paddingLeft:28}}><div style={{position:"absolute",left:11,top:8,bottom:8,width:2,background:"linear-gradient(to bottom,#0d9488,#99f6e4,#e8e2d9)"}}/><div style={{display:"flex",flexDirection:"column",gap:14}}>{(dd.activities||[]).map((a:any,i:number)=>{const c=TYPE_COLORS[a.type]||TYPE_COLORS.default;const ic=TYPE_ICONS[a.type]||TYPE_ICONS.default;const exp=expandedActivity===activeDay+"-"+i;return <div key={i} style={{position:"relative"}}><div style={{position:"absolute",left:-24,top:18,width:14,height:14,borderRadius:"50%",background:c.bg,border:"3px solid "+(exp?"#0d9488":c.border),zIndex:2}}/><div style={{border:"1.5px solid "+(exp?"#0d9488":c.border),borderRadius:14,overflow:"hidden",background:"white"}}>{a.imageSearchQuery&&<div style={{height:exp?140:60,overflow:"hidden",cursor:"pointer",position:"relative"}} onClick={()=>setExpandedActivity(exp?null:activeDay+"-"+i)}><img src={imgUrl(a.imageSearchQuery,600,200)} alt="" style={{width:"100%",height:"100%",objectFit:"cover"}} onError={(e:any)=>{e.target.parentElement.style.display="none"}}/></div>}<div style={{padding:"14px 16px",cursor:"pointer"}} onClick={()=>setExpandedActivity(exp?null:activeDay+"-"+i)}><div style={{display:"flex",gap:10}}><div style={{width:40,height:40,borderRadius:10,background:c.bg,display:"flex",alignItems:"center",justifyContent:"center",fontSize:18,flexShrink:0}}>{ic}</div><div style={{flex:1}}><div style={{display:"flex",justifyContent:"space-between",gap:6}}><h3 style={{fontSize:14,fontWeight:700,color:"#134e4a"}}>{a.title}</h3><span style={{fontSize:10,padding:"2px 8px",borderRadius:6,background:c.bg,color:c.text,fontWeight:600,textTransform:"capitalize",whiteSpace:"nowrap"}}>{a.type}</span></div><p style={{color:"#57534e",fontSize:12.5,lineHeight:1.55,marginTop:3}}>{a.description}</p><div style={{display:"flex",gap:10,fontSize:11,color:"#78716c",marginTop:8,flexWrap:"wrap"}}>{a.time&&<span>{"\u{1F550}"} {a.time}</span>}{a.cost&&<span>{"\u{1F4B0}"} {a.cost}</span>}</div></div></div></div>{exp&&<div style={{padding:"0 16px 14px",borderTop:"1px solid "+c.border,paddingTop:10}}>{a.location&&<div style={{fontSize:12,color:"#374151",marginBottom:8}}>{"\u{1F4CD}"} {a.location}</div>}<div style={{display:"flex",gap:7,flexWrap:"wrap"}}>{a.mapsUrl&&<LinkBtn href={a.mapsUrl}>{"\u{1F4CD}"} Maps</LinkBtn>}{a.websiteUrl&&<LinkBtn href={a.websiteUrl}>{"\u{1F310}"} Site</LinkBtn>}<LinkBtn href={"https://www.youtube.com/results?search_query="+encodeURIComponent(a.title+" "+city)}>{"\u{1F3AC}"} Videos</LinkBtn></div></div>}</div></div>})}</div></div>
                {dd.tips?.length>0&&<div style={{marginTop:20,padding:16,background:"#f0fdfa",borderRadius:12,border:"1px solid #ccfbf1"}}><h3 style={{fontSize:13,fontWeight:700,color:"#115e59",marginBottom:8}}>{"\u{1F4A1}"} Tips</h3><ul style={{margin:0,paddingLeft:16,fontSize:12,color:"#115e59",lineHeight:1.75}}>{dd.tips.map((t:string,i:number)=><li key={i}>{t}</li>)}</ul></div>}
              </div>}

              {/* Adventures tab */}
              {itinTab==="adventures"&&<div>
                <h2 style={{...S.sTitle,marginBottom:16}}>Adventures & Experiences</h2>
                {itinerary.adventures?.length>0?<div style={{display:"grid",gap:12}}>{itinerary.adventures.map((adv:any,i:number)=><div key={i} style={{background:"white",borderRadius:14,border:"1.5px solid #e8e2d9",padding:18}}><div style={{display:"flex",justifyContent:"space-between",marginBottom:6}}><h3 style={{fontSize:15,fontWeight:700,color:"#134e4a"}}>{adv.name}</h3><span style={{fontSize:13,fontWeight:700,color:"#0d9488"}}>{adv.priceRange}</span></div><p style={{fontSize:13,color:"#57534e",lineHeight:1.5,marginBottom:8}}>{adv.description}</p>{adv.whyBook&&<p style={{fontSize:12,color:"#0d9488",fontStyle:"italic",marginBottom:10}}>&#10022; {adv.whyBook}</p>}<div style={{display:"flex",gap:7,flexWrap:"wrap"}}>{adv.bookingUrl&&<LinkBtn href={adv.bookingUrl}>Book</LinkBtn>}<LinkBtn href={"https://www.tripadvisor.com/Search?q="+encodeURIComponent(adv.name+" "+city)}>Reviews</LinkBtn></div></div>)}</div>:<p style={{color:"#a8a29e"}}>No adventures found.</p>}
              </div>}

              {/* Videos tab */}
              {itinTab==="videos"&&<div>
                <h2 style={{...S.sTitle,marginBottom:16}}>YouTube Guides</h2>
                {itinerary.youtubeSearches?.length>0&&<div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(190px,1fr))",gap:12,marginBottom:24}}>{itinerary.youtubeSearches.map((s:any,i:number)=><a key={i} href={"https://www.youtube.com/results?search_query="+encodeURIComponent(s.searchQuery)} target="_blank" rel="noopener noreferrer" style={{display:"block",background:"white",borderRadius:12,border:"1.5px solid #e8e2d9",overflow:"hidden",textDecoration:"none",color:"inherit"}}><div style={{background:"#1a1a1a",padding:"22px 12px",display:"flex",alignItems:"center",justifyContent:"center"}}><div style={{width:40,height:40,borderRadius:"50%",background:"rgba(255,0,0,0.9)",display:"flex",alignItems:"center",justifyContent:"center",color:"white"}}>{"\u25B6"}</div></div><div style={{padding:"10px 12px"}}><div style={{fontSize:12,fontWeight:600}}>{s.title}</div></div></a>)}</div>}
              </div>}
            </div>
          </div>;
        })()}
      </main>

      <footer style={{padding:"20px clamp(16px,4vw,48px)",borderTop:"1px solid #e8e2d9",display:"flex",justifyContent:"space-between",fontSize:11,color:"#a8a29e"}}>
        <span>&copy; 2026 Local Side Quest. All rights reserved.</span>
        <span>Powered by AI</span>
      </footer>
    </div>
  );
}
