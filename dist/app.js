const app=document.querySelector('#app'),$=s=>document.querySelector(s);
const initial={saved:[],requests:[],quiz:{},messages:[],hostVerified:false};
let state;
try{state={...initial,...JSON.parse(localStorage.getItem('elsewhere-prototype-v2')||'{}')}}catch{state={...initial}}
let selectedDate='',selectedDuration=0,guestCount=1,activeBookingId=0,extras=[],calendarMonth=null,bookingNote='';
let view='list',sortOrder='recommended',filters={q:'',interest:'',continent:'',duration:'',budget:'',month:'',comfort:'',language:'',cohort:''},quizStep=0;
const save=()=>{localStorage.setItem('elsewhere-prototype-v2',JSON.stringify(state));$('#save-count').textContent=state.saved.length?`(${state.saved.length})`:''};
save();
const esc=x=>String(x??'').replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;').replaceAll("'",'&#39;');
const euro=n=>'€'+Math.round(n).toLocaleString('en-GB');
const duration=d=>d===2?'Weekend':d===7?'1 week':d===14?'2 weeks':d===21?'3 weeks':d===30?'1 month':d+' days';
const find=id=>experiences.find(x=>x.id===Number(id));
const to=h=>location.hash='#/'+h;
function toast(t){let x=$('#toast');x.textContent=t;x.style.display='block';clearTimeout(toast.timer);toast.timer=setTimeout(()=>x.style.display='none',3000)}
function picture(e){return `<img src="${esc(e.image)}" alt="${esc(e.imageAlt)}">`}
function home(){return `<main><section class="hero"><img src="https://images.unsplash.com/photo-1472396961693-142e6e269027?auto=format&fit=crop&w=2200&q=85" alt="Sunlight in a green forest"><div class="hero-inner"><div class="eyebrow">A little time. A whole new perspective.</div><h1>Don’t visit.<br>Learn.</h1><p>Live and learn with the people who keep a tradition alive.</p><div class="button-row"><a href="#/discover" class="btn light">Explore experiences ↗</a><button class="btn" data-action="quiz">Find your kind of elsewhere</button></div></div></section><div class="wrap home-sections"><section class="section home-section home-feature"><div class="section-title"><div><div class="eyebrow">A few places to begin</div><h2>Learn from someone, somewhere.</h2><p class="sub">Small groups. Real practice. Time to be present.</p></div><a href="#/discover">See all experiences ↗</a></div><div class="discover-grid">${experiences.slice(0,3).map(discoverCard).join("")}</div></section><section class="section home-section"><div class="section-title"><div><div class="eyebrow">A different way to spend your time</div><h2>Stay curious. Go deeper.</h2><p class="sub">A weekend or a month can be enough to learn something with someone who knows it by heart.</p></div></div><div class="compare"><div><strong>Activity marketplaces</strong><p>Hours-long activities and a taste of a place.</p></div><div><strong>Work exchanges</strong><p>Work in exchange for a stay; learning varies.</p></div><div><strong>Retreats</strong><p>Often centred on one topic or institution.</p></div><div><strong>✳ Elsewhere Academy</strong><p>Days or weeks of guided learning rooted in a host’s everyday practice.</p></div></div></section><section class="section-sm home-section"><div class="eyebrow">Different lives, shared curiosity</div><h2>There’s more than one way to begin.</h2><div class="three"><div class="panel"><h3>Two weeks to breathe</h3><p class="sub">For a professional making space to learn and reset.</p></div><div class="panel"><h3>Try a different path</h3><p class="sub">For a career changer exploring a craft before taking the leap.</p></div><div class="panel"><h3>Stay a little longer</h3><p class="sub">For remote workers with a month, or students with a summer window.</p></div></div></section><section class="quiz home-section"><div><div class="eyebrow">Not sure where to begin?</div><h2>Find your kind of elsewhere.</h2><p class="sub">Three questions about your time, curiosity and comfort.</p></div><button class="btn" data-action="quiz">Take the 3-question quiz ↗</button></section><section class="section-sm"><div class="note">✳ &nbsp; Experiences on this prototype are fictional examples. Hosts, verification, availability, reviews and payment flows are simulated.</div></section></div></main>`}
const interestOptions=['Food','Craft','Music','Agriculture','Wellness','Language','Building','Nature & ecology'];const monthOptions=['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
function options(items,value,label){return `<option value="">${label}</option>`+items.map(x=>{let v=Array.isArray(x)?x[0]:x,t=Array.isArray(x)?x[1]:x;return `<option value="${esc(v)}" ${value==v?'selected':''}>${esc(t)}</option>`}).join('')}
function matches(f){
  const cost=e=>perGuest(e,catalogLength(e,f));
  let list=experiences.filter(e=>(!f.q||[e.title,e.place,e.desc,e.host,e.interest].join(' ').toLowerCase().includes(f.q.toLowerCase()))&&(!f.interest||e.interest===f.interest)&&(!f.continent||e.continent===f.continent)&&(!f.duration||e.days.includes(Number(f.duration)))&&(!f.budget||e.price<=Number(f.budget))&&(!f.month||firstBookingDay(e,catalogLength(e,f),1,f.month))&&(!f.comfort||e.comfort>=Number(f.comfort))&&(!f.language||e.language.toLowerCase().includes(f.language.toLowerCase()))&&(!f.cohort||(f.cohort==='solo'?e.solo:e.sharing)));
  if(sortOrder==='price-low')list.sort((a,b)=>cost(a)-cost(b));
  if(sortOrder==='price-high')list.sort((a,b)=>cost(b)-cost(a));
  if(sortOrder==='duration')list.sort((a,b)=>catalogLength(a,f)-catalogLength(b,f));
  return list;
}
function filterCount(f){return Object.keys(f).filter(k=>k!=='q'&&f[k]).length}function fmtRange(days){let a=Math.min(...days),b=Math.max(...days);if(a===b)return duration(a);if(a>=7&&a%7===0&&b%7===0)return `${a/7}–${b/7} weeks`;return `${duration(a)}–${duration(b)}`}
function discoverCard(e){
  const length=catalogLength(e), price=euro(perGuest(e,length)), alt=esc(e.cardAlt||e.imageAlt||e.desc);
  const dots=Array.from({length:5},(_,i)=>`<span class="comfort-dot ${i<e.comfort?'filled':''}"></span>`).join('');
  return `<article class="discover-card"><a class="discover-card-link" href="#/experience/${e.id}" aria-label="${esc(e.title)}, ${esc(e.place)}, ${price} per person for ${duration(length)}">
    <div class="discover-image"><img src="${esc(e.cardImage||e.image)}" alt="${alt}" loading="lazy"><span class="category-chip">${esc(e.interest)}</span></div>
    <div class="discover-card-body"><div class="discover-location">${esc(e.place)}</div><h3>${esc(e.title)}</h3><p class="discover-hook">${esc(e.cardHook||e.desc)}</p>
      <div class="discover-bottom"><div class="discover-meta"><span>◷ &nbsp;${esc(fmtRange(e.days))}</span><span class="comfort" aria-label="Comfort ${e.comfort} out of 5">${dots}<span class="comfort-text">Comfort</span></span></div>
        <div class="discover-footer"><span class="verified-badge">✓ &nbsp;Verified host</span><span class="discover-price">${price} <small>per person · ${duration(length)}</small></span></div>
      </div>
    </div></a>
    <button class="heart ${state.saved.includes(e.id)?'on':''}" data-save="${e.id}" aria-label="${state.saved.includes(e.id)?'Unsave':'Save'} ${esc(e.title)}" aria-pressed="${state.saved.includes(e.id)}">${state.saved.includes(e.id)?'♥':'♡'}</button>
  </article>`;
}
function activeChips(){let labels={interest:'Interest',continent:'Destination',duration:'Duration',budget:'Budget',month:'Month',comfort:'Comfort',language:'Language',cohort:'Group'};return Object.entries(filters).filter(([k,v])=>k!=='q'&&v).map(([k,v])=>{let text=k==='duration'?duration(Number(v)):k==='budget'?'Up to '+euro(v)+'/week':k==='comfort'?v+'/5 or higher':k==='cohort'?(v==='solo'?'Private / solo':'Shared cohort'):v;return `<button class="applied-chip" data-remove-filter="${k}" aria-label="Remove ${labels[k]} filter">${esc(text)} <span>×</span></button>`}).join('')}
function discover(){let found=matches(filters);return `<main class="wrap discover-page"><div class="page-head discover-heading"><div class="eyebrow">The world is full of teachers</div><h1>Follow your curiosity.</h1><p class="sub">Find the people, places and practices that stay with you.</p></div><div class="demo-note"><span>✳</span> &nbsp; A concept to explore: experiences and verified host badges are illustrative.</div><div class="discover-toolbar"><form id="search-form" class="discover-search"><span aria-hidden="true">⌕</span><input name="search" value="${esc(filters.q)}" placeholder="Try matcha, weaving, Japan…" aria-label="Search experiences"><button type="submit" class="search-submit">Search</button></form><button class="filter-trigger" data-action="open-filters" aria-haspopup="dialog" aria-label="Filters, ${filterCount(filters)} applied">☷ &nbsp; Filters <span class="filter-count">${filterCount(filters)}</span></button><label class="sort-control">Sort: <select aria-label="Sort experiences" data-sort><option value="recommended" ${sortOrder==='recommended'?'selected':''}>Recommended</option><option value="price-low" ${sortOrder==='price-low'?'selected':''}>Price: low to high</option><option value="price-high" ${sortOrder==='price-high'?'selected':''}>Price: high to low</option><option value="duration" ${sortOrder==='duration'?'selected':''}>Shortest first</option></select></label></div>${filterCount(filters)?`<div class="applied-filters" aria-label="Applied filters">${activeChips()}</div>`:''}<div class="discover-results"><div><strong>${found.length} ${found.length===1?'experience':'experiences'}</strong><span class="muted"> &nbsp;to get lost in</span></div><div class="view-toggle"><button class="${view==='list'?'selected':''}" data-view="list" aria-pressed="${view==='list'}">List</button><button class="${view==='map'?'selected':''}" data-view="map" aria-pressed="${view==='map'}">Map</button></div></div>${view==='list'?`<div class="discover-grid">${found.length?found.map(discoverCard).join(''):'<div class="empty">No experiences match those filters. Try changing your choices.</div>'}</div>`:`<div class="map"><h2>Explore by place</h2><p class="sub">Select a destination to open its experience. Locations are illustrative.</p><div class="world-map" role="img" aria-label="Illustrative world map"><svg viewBox="0 0 1000 420" preserveAspectRatio="none" aria-hidden="true"><path d="M45 74 L93 35 203 45 250 95 218 128 177 129 160 181 126 159 104 122 59 115Z M203 188 L238 194 267 222 278 274 244 355 221 339 210 290 190 249Z M425 75 L474 61 498 84 480 115 454 118Z M440 145 L497 129 551 155 567 206 534 287 492 305 466 249 442 205Z M508 76 L576 47 683 63 746 81 837 79 919 112 884 153 796 164 754 194 690 181 640 207 597 154 545 139 508 119Z M756 288 L812 270 869 290 887 327 842 354 784 342Z" fill="#c7d6bd"/></svg>${mapPins(found)}</div><div class="map-grid">${found.map(e=>`<button data-goto="experience/${e.id}">⌖ ${esc(e.place)} · ${esc(e.title)}</button>`).join('')||'No matching destinations.'}</div></div>`}<div class="section-sm"></div></main>`}
function openFilters(){let draft={...filters},d=document.createElement('dialog');d.className='filter-drawer';d.setAttribute('aria-label','Filter experiences');d.innerHTML=`<div class="drawer-shell"><div class="drawer-header"><div><span class="eyebrow">MAKE IT YOURS</span><h2>Find your fit.</h2></div><button class="drawer-close" aria-label="Close filters">×</button></div><div class="drawer-scroll"><section><h3>What would you like to learn?</h3><div class="drawer-chips">${interestOptions.map(x=>`<button class="drawer-chip" data-pick="interest" data-value="${esc(x)}">${esc(x)}</button>`).join('')}</div></section><section><h3>Destination</h3><select aria-label="Destination" data-draft="continent">${options(['Africa','Asia','Europe','North America','South America','Oceania'],draft.continent,'Anywhere in the world')}</select></section><section><h3>Time to immerse</h3><div class="drawer-chips">${[[2,'Weekend'],[7,'1 week'],[14,'2 weeks'],[30,'Up to 1 month']].map(([v,l])=>`<button class="drawer-chip" data-pick="duration" data-value="${v}">${l}</button>`).join('')}</div></section><section><div class="drawer-section-title"><h3>Budget per week</h3><strong id="budget-value">Any budget</strong></div><input type="range" aria-label="Maximum budget per week" id="budget-slider" min="0" max="5000" step="50" value="${draft.budget||5000}"><div class="slider-labels"><span>€0</span><span>€5,000+</span></div><button class="text-button" data-draft-clear="budget">Any budget</button></section><section><h3>Month</h3><select aria-label="Month" data-draft="month">${options(monthOptions,draft.month,'Any month')}</select></section><section><h3>Minimum comfort</h3><div class="drawer-chips">${[1,2,3,4,5].map(x=>`<button class="drawer-chip" data-pick="comfort" data-value="${x}">${x} / 5</button>`).join('')}</div></section><section><h3>Language of instruction</h3><select aria-label="Language of instruction" data-draft="language">${options(['English','French','Spanish','Japanese','Portuguese','Italian','Arabic','Indonesian'],draft.language,'Any language')}</select></section><section><h3>Solo or group</h3><div class="drawer-chips"><button class="drawer-chip" data-pick="cohort" data-value="solo">Private / solo</button><button class="drawer-chip" data-pick="cohort" data-value="group">Shared cohort</button></div></section></div><div class="drawer-footer"><button class="text-button" data-draft-clear="all">Clear all</button><button class="btn" data-apply>Show experiences</button></div></div>`;document.body.append(d);function update(){d.querySelectorAll('[data-pick]').forEach(b=>{let on=String(draft[b.dataset.pick])===b.dataset.value;b.classList.toggle('selected',on);b.setAttribute('aria-pressed',on)});d.querySelectorAll('[data-draft]').forEach(el=>el.value=draft[el.dataset.draft]||'');d.querySelector('#budget-slider').value=draft.budget||5000;d.querySelector('#budget-value').textContent=draft.budget?`Up to ${euro(draft.budget)}`:'Any budget';let n=matches(draft).length;d.querySelector('[data-apply]').textContent=`Show ${n} ${n===1?'experience':'experiences'}`}
 d.addEventListener('click',ev=>{let b=ev.target.closest('button');if(!b){if(ev.target===d)d.close();return}if(b.classList.contains('drawer-close'))d.close();if(b.dataset.pick){let k=b.dataset.pick;draft[k]=String(draft[k])===b.dataset.value?'':b.dataset.value;update()}if(b.dataset.draftClear==='budget'){draft.budget='';update()}if(b.dataset.draftClear==='all'){draft={q:filters.q,interest:'',continent:'',duration:'',budget:'',month:'',comfort:'',language:'',cohort:''};update()}if(b.hasAttribute('data-apply')){filters=draft;d.close();preserve()}});d.addEventListener('input',ev=>{if(ev.target.id==='budget-slider'){draft.budget=Number(ev.target.value)>=5000?'':ev.target.value;d.querySelector('#budget-value').textContent=draft.budget?`Up to ${euro(draft.budget)}`:'Any budget';let n=matches(draft).length;d.querySelector('[data-apply]').textContent=`Show ${n} ${n===1?'experience':'experiences'}`}});d.addEventListener('change',ev=>{if(ev.target.dataset.draft){draft[ev.target.dataset.draft]=ev.target.value;update()}});d.addEventListener('close',()=>{d.remove();document.querySelector('[data-action="open-filters"]')?.focus()});update();d.showModal()}
function mapPins(found){const coords={Africa:[48,46],Asia:[70,26],Europe:[48,20],'North America':[17,23],'South America':[24,58],Oceania:[83,72]};return found.map(e=>{let p=coords[e.continent],n=found.filter(x=>x.continent===e.continent).findIndex(x=>x.id===e.id);return `<button class="map-pin" style="left:${p[0]+n%4*2}%;top:${p[1]+Math.floor(n/4)*5}%" data-goto="experience/${e.id}" title="${esc(e.title)} · ${esc(e.place)}" aria-label="${esc(e.title)} in ${esc(e.place)}">⌖</button>`}).join('')}
function galleryFor(e){if(e.id===20)return [{src:'assets/marrakech/oven.jpg',alt:'A cook preparing bread beside an oven'},{src:'assets/marrakech/dough.jpg',alt:'Hands shaping bread dough'},{src:'assets/marrakech/kitchen.jpg',alt:'A cook preparing food in a Moroccan kitchen'},{src:'assets/detail/meal.jpg',alt:'People sharing a meal around a table'},{src:'assets/marrakech/stay.jpg',alt:'Traditional tiled interior in Marrakech'}];if(e.id===7)return [{src:'assets/detail/landscape.jpg',alt:'Green farmland and coastline in Tasmania'},{src:'assets/detail/craft.jpg',alt:'A beekeeper inspecting a honeycomb'},{src:'assets/detail/together.jpg',alt:'Two beekeepers working together'},{src:'assets/detail/meal.jpg',alt:'People sharing a meal around a table'},{src:'assets/detail/stay.jpg',alt:'A warm cabin bedroom'}];let subject=e.cardImage||e.image,other=e.image!==subject?e.image:(experiences.find(x=>x.interest===e.interest&&x.id!==e.id&&(x.cardImage||x.image)!==subject)?.cardImage||'assets/detail/craft.jpg'),third=experiences.find(x=>x.interest===e.interest&&x.id!==e.id&&(x.cardImage||x.image)!==subject&&(x.cardImage||x.image)!==other);return [{src:subject,alt:e.cardAlt||e.imageAlt},{src:other,alt:'A closer view of the practice'},{src:third?.cardImage||'assets/detail/together.jpg',alt:'People sharing skills'},{src:'assets/detail/meal.jpg',alt:'People sharing a meal around a table'},{src:'assets/detail/stay.jpg',alt:'A welcoming guest room'}]}
function skillsFor(e){let sets={Agriculture:[['♧','Read the rhythms','Notice the seasonal patterns that shape daily work.'],['⌁','Work with care','Practise the tools and routines alongside your host.'],['☼','Understand the environment','Explore how weather and local conditions shape the practice.'],['✦','Build confidence','Learn safe techniques you can continue to develop.']],Food:[['♧','Start with ingredients','Discover local ingredients and how they are prepared.'],['⌁','Practise by hand','Learn foundational techniques alongside your host.'],['☼','Understand the process','Explore the timing and decisions behind each stage.'],['✦','Taste and reflect','Develop your palate and keep notes on what you learn.']],Craft:[['⌁','Meet the materials','Learn how the materials are selected and prepared.'],['✂','Learn the tools','Get comfortable with the tools and basic techniques.'],['✦','Practise each step','Build skills through patient, hands-on guidance.'],['◌','Make something your own','Work towards a small piece while respecting local traditions.']],Music:[['♪','Find the rhythm','Practise the fundamental patterns and phrasing.'],['⌁','Get to know the instrument','Explore its construction, sound and care.'],['♬','Practise together','Learn through listening and guided repetition.'],['✦','Understand the context','Hear how the music is shared in daily life.']],Language:[['◌','Start a conversation','Practise greetings and useful everyday phrases.'],['♬','Listen closely','Build confidence with pronunciation and rhythm.'],['⌁','Learn in context','Use language around meals and daily routines.'],['✦','Take notes home','Build a personal phrasebook for continued practice.']],Building:[['⌁','Meet the materials','Explore how earth is prepared for building.'],['◫','Learn foundational techniques','Practise mixing and compacting under guidance.'],['♧','Work safely together','Learn to use tools and protect yourself on site.'],['✦','Understand the craft','Discover why local climate and materials matter.']],Wellness:[['♧','Get to know local plants','Notice their textures, scents and growing conditions.'],['☼','Slow down and observe','Practise a mindful approach to everyday routines.'],['⌁','Try simple preparations','Learn safe, guided techniques with your host.'],['✦','Build a personal practice','Keep notes on what you would like to continue.']]};if(e.id===2)return [['⌁','Choose and shape the wood','Learn how the shell is prepared and shaped.'],['✂','Fit the drumhead','Explore how hide and rope are assembled.'],['✦','Tune the drum','Practise tensioning and listening for the sound.'],['♪','Hear it come alive','Try foundational rhythms on a finished instrument.']];if(e.id===7)return [['♧','Understand the hive','Observe how a colony works and changes through the seasons.'],['⌁','Inspect a hive safely','Use protective gear and learn a calm approach to the bees.'],['✦','Read the frames','Recognise brood, honey stores and signs of colony health.'],['☼','Follow the honey','Explore how honey is handled, extracted and stored.'],['❋','Support pollinators','Learn how nearby plants and habitat sustain bees.']];return sets[e.interest]||sets.Agriculture}
const hostStories=[
"In the tea garden, I look for the youngest leaves and the right moment to pick them. I invite guests to follow that leaf through the mill and into a bowl, with time to notice how each step changes its character.",
"I work with wood, hide and rope to make drums that can hold both a voice and a rhythm. In the workshop, I show guests how the parts come together and why careful tuning matters as much as shaping the shell.",
"My studio days start by preparing clay and seeing how it responds to my hands. I like to teach the wheel slowly, making space for uneven pots and the small discoveries that come with practice.",
"I work alongside other producers to turn shea nuts into butter. The process takes patience and many hands; I enjoy sharing each step, from sorting the nuts to watching the butter come together.",
"I learned to pay attention to fibre, colour and tension at the loom. I welcome guests to practise the steps with me, and to understand the care and time behind a woven piece.",
"Coffee growing has taught me to look closely at soil, weather and the ripeness of a cherry. I share the farm’s daily routines and the decisions that shape the taste of a cup.",
"","At the furnace, timing changes everything. I teach beginners how we gather and shape glass, and why listening to the material is as important as learning to use a tool.",
"I spend the year caring for olive trees and waiting for the harvest. Around the table, I help guests taste the differences between oils and connect those flavours to the grove.",
"I love the moment a stack of loose pages becomes a book. In my workshop, I teach folding, stitching and finishing, with enough time to appreciate the character of the paper.",
"I work with broken ceramics and the patient stages of lacquer repair. I invite guests to look closely at a piece before beginning, and to respect the time each layer needs to cure.",
"My work revolves around the indigo vat and the fabric that passes through it. I show guests how a colour is built through repeated dips and the transformation that happens in the air.",
"I follow cacao from the trees through fermentation, drying and roasting. I like sharing how the choices made on a small farm become the flavours people recognise in chocolate.",
"The bakery starts early, with dough, butter and a careful eye on temperature. I teach guests the folds and timing of laminated pastry, one patient batch at a time.",
"Mushroom growing asks you to notice humidity, cleanliness and tiny changes every day. I share the work of preparing a substrate and looking after a crop as it grows.",
"I work with willow that can be soaked, bent and woven into something useful. My favourite part of teaching is watching a basket take shape from a handful of flexible stems.",
"I use wax to draw lines that will resist the dye. I teach guests how to handle the canting and build a pattern carefully, while sharing the designs I choose to make open to learners.",
"In the dairy, small choices of temperature and timing shape the curd. I guide guests through the work I do each morning and explain how patience continues the process after the cheese is made.",
"I teach Twi through the conversations that make up a day: greetings, meals and the questions we ask one another. I want guests to leave with words they can actually use and the confidence to keep listening.",
"I love the warmth and conversation of a kitchen where bread is made by hand. Guests join me to mix, shape and cook, then we sit down and share what we have prepared.",
"Earth is my building material and the local climate is part of every design decision. I teach guests to prepare and compact a small practice section, safely and at a pace that leaves room for questions.",
"I prepare plant fibres before they are ready to weave, and I enjoy showing how much thought goes into that first step. Guests practise the fundamentals with me and learn which materials I choose to share.",
"The dishes I cook change with the ingredients available around us. I invite guests into the kitchen to prepare an everyday meal together and learn the stories I share around the table.",
"I begin in the garden by checking the soil and what the season is asking of us. Guests learn by helping with planting and composting, then taking the time to observe what is growing.",
"I enjoy the patient work of preparing fibre and setting up a loom. In our sessions, guests practise the basics and see how the choices of material and colour shape a textile.",
"I learned pandeiro by listening and playing with others. I teach the first patterns slowly, then we bring them together so guests can feel the conversation inside the rhythm.",
"I like to start a walk by looking closely at the plants underfoot. I teach observation and responsible identification, with a focus on learning what belongs in a place rather than collecting indiscriminately.",
"Fermentation is part of the rhythm of my kitchen. I show guests how we prepare seasonal vegetables and build flavour, and explain what changes while they rest.",
"My garden is where I pay attention to scent, texture and the changing light. I share gentle ways to observe aromatic plants and make simple preparations with care.",
"I bring songs and everyday conversation into my language lessons. Guests can practise without worrying about perfect grammar, and leave with phrases they have used in real exchanges."
];
function hostCopy(e){if(e.id===7)return {years:12,story:'I started keeping bees in a borrowed corner of my neighbour’s orchard. What began with one hive became a way to understand the landscape around me. Today I care for a small apiary and teach visitors how to move slowly, notice the details and give the bees the space they need.',quote:'The best thing I can teach you is to stop, watch and let the bees tell you what is happening.'};let by={Craft:`I spend my days working with materials, tools and the small details that make each piece different. I love inviting curious beginners into the workshop, sharing the techniques I use and making room for them to find their own pace.`,Food:`My days begin with ingredients and the people who grow them. I enjoy sharing the everyday techniques behind the food I make, and the conversations that happen while we prepare and eat together.`,Agriculture:`My work changes with the weather and the seasons. I welcome guests into those daily rhythms and teach the practical skills that help us care for the land and the living things around us.`,Music:`I learned by listening, practising and making music with other people. Now I share the rhythms and stories that shape my practice, one beat and one conversation at a time.`,Language:`I believe language opens the door to everyday life. We learn through conversation, shared moments and the small phrases that help us feel at home with one another.`,Building:`I work with earth because it connects a building to the place around it. I teach the materials and methods step by step, with time to practise safely and understand the local context.`,Wellness:`My work begins in the garden, paying attention to plants and the changing seasons. I enjoy sharing simple ways to slow down, observe and care for the world around us.`};return {years:6+(e.id%9),story:hostStories[e.id-1]||by[e.interest]||by.Agriculture,quote:'Come with curiosity. We will take the time to learn together.'}}
function dots(n){return `<span class="detail-dots" aria-label="${n} out of 5">${[1,2,3,4,5].map(i=>`<i class="${i<=n?'filled':''}"></i>`).join('')}</span>`}function endDate(date,days){if(!date)return 'Choose a start date';let x=new Date(date+'T12:00:00');x.setDate(x.getDate()+days-1);return x.toLocaleDateString('en-GB',{day:'numeric',month:'short',year:'numeric'})}
const approximateAreas=[[34.89,135.80],[5.36,-4.00],[38.57,-7.91],[10.30,1.38],[17.07,-96.72],[4.64,-75.57],[-41.52,146.65],[45.46,12.35],[37.04,22.11],[43.77,11.25],[35.01,135.77],[34.07,134.55],[-0.99,-77.81],[45.76,4.84],[49.65,-125.30],[51.10,-3.00],[-7.80,110.36],[46.58,7.08],[5.60,-0.19],[31.63,-7.98],[31.63,-7.98],[-38.13,176.25],[-17.80,177.42],[-28.65,153.40],[-13.53,-71.97],[-12.97,-38.50],[53.0,-125.0],[37.56,126.98],[43.90,5.40],[41.39,2.17]];function areaMap(e){let [lat,lon]=approximateAreas[e.id-1],wide=[3,15,16,27,29].includes(e.id)?1.5:.3,bbox=[lon-wide,lat-wide*.6,lon+wide,lat+wide*.6].join('%2C');return `<iframe class="location-map" title="Approximate area near ${esc(e.place)}" loading="lazy" src="https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&amp;layer=mapnik"></iframe>`}
function detail(e){
  let g=galleryFor(e),host=hostCopy(e),sim=experiences.filter(x=>x.id!==e.id&&(x.interest===e.interest||x.continent===e.continent)).slice(0,3),skill=skillsFor(e),saved=state.saved.includes(e.id),m=e.id===7;
  let placeLink='https://www.openstreetmap.org/search?query='+encodeURIComponent(e.place);
  return `<main class="detail-page wrap">
    <div class="detail-topline"><a class="back" href="#/discover">← Back to discovery</a><div class="detail-actions"><button data-share="${e.id}">↗ &nbsp; Share</button><button data-save="${e.id}">${saved?'♥ &nbsp; Saved':'♡ &nbsp; Save'}</button></div></div>
    <div class="detail-title"><h1>${esc(e.title)}</h1><div class="detail-subline"><span>${m?'★ 4.9 (12 reviews)':'<span class="new-badge">New</span>'}</span><span>⌖ &nbsp;${esc(e.place)}</span><span class="verified-badge">✓ &nbsp;Verified host</span></div></div>
    <div class="gallery-grid" id="experience-gallery">${g.map((im,i)=>`<button class="gallery-tile gallery-tile-${i}" data-open-photo="${e.id}" data-photo-index="${i}" aria-label="View photo ${i+1} of 5: ${esc(im.alt)}"><img src="${esc(im.src)}" alt="${esc(im.alt)}" loading="${i?'lazy':'eager'}">${i===4?'<span class="show-photos">▦ &nbsp; Show all photos</span>':''}</button>`).join('')}</div>
    <div class="gallery-mobile" id="gallery-mobile">${g.map((im,i)=>`<button class="gallery-slide" data-open-photo="${e.id}" data-photo-index="${i}" aria-label="View photo ${i+1} of 5: ${esc(im.alt)}"><img src="${esc(im.src)}" alt="${esc(im.alt)}"></button>`).join('')}</div><div class="gallery-counter" id="gallery-counter">1 / 5</div>
    <div class="facts-strip"><div><span>◷</span><p><small>Duration</small><strong>${esc(fmtRange(e.days))}</strong></p></div><div><span>♧</span><p><small>Group size</small><strong>${esc(e.group)}</strong></p></div><div><span>◌</span><p><small>Language</small><strong>${esc(e.language)}</strong></p></div><div><span>⌂</span><p><small>Comfort</small><strong>${dots(e.comfort)}</strong></p></div><div><span>☼</span><p><small>Best season</small><strong>${esc(e.season)}</strong></p></div></div>
    <div class="detail-nav"><button data-scroll="overview">Overview</button><button data-scroll="host">Host</button><button data-scroll="day">Day</button><button data-scroll="stay">Stay</button><button data-scroll="reviews">Reviews</button></div>
    <div class="experience-columns"><div class="experience-content">
      <section class="experience-section" id="overview"><h2>What you’ll learn</h2><p>${esc(e.desc)}</p><div class="skill-list">${skill.map(([icon,title,desc])=>`<div class="skill"><span>${icon}</span><div><strong>${esc(title)}</strong><p>${esc(desc)}</p></div></div>`).join('')}</div><div class="outcome"><span>✧</span><div><strong>Your outcome</strong><p>${esc(e.outcome)}.</p></div></div></section>
      <section class="experience-section" id="host"><h2>Meet your host</h2><div class="detail-host"><img src="${esc(e.portrait)}" alt="Representative photograph for ${esc(e.host)}"><div><div class="host-heading"><h3>${esc(e.host)}</h3><span class="verified-badge">✓ &nbsp;Verified host</span></div><p class="host-meta">${host.years} years of experience &nbsp; · &nbsp; ${esc(e.language)}</p><p>${esc(host.story)}</p><blockquote>“${esc(host.quote)}”</blockquote><button class="text-link" data-ask-host="${e.id}">Message host</button></div></div></section>
      <section class="experience-section included-section"><h2>What’s included</h2><ul><li>Guided learning with your host and shared materials</li><li>Accommodation for the experience duration</li><li>Breakfast and one shared meal each day</li><li>Instruction in ${esc(e.language)}</li></ul><p>Flights, visa fees, travel insurance and meals not listed are not included. A dedicated translator is not included.</p></section>
      <section class="experience-section" id="day"><h2>Itinerary</h2><p class="section-intro">A gentle rhythm, with room for questions and time to take it all in.</p><div class="day-layout"><div class="day-timeline">${[['☼','08:30','Start together','Breakfast and a conversation about the day ahead.'],['⌁','09:30',m?'Meet the bees':'Time to practise',m?'Suit up and inspect the hives with your host.':'Join your host for guided hands-on learning.'],['♧','12:30','Share a meal','Pause for lunch and a little time to rest.'],['✦','14:00','Continue learning',m?'Explore honey handling, the frames and colony care.':'Keep practising, ask questions and compare notes.'],['◌','17:00','Make the evening yours','Rest, explore nearby or join an optional meal.']].map(([icon,time,title,desc])=>`<div class="day-step"><span class="timeline-icon">${icon}</span><div><small>${time}</small><strong>${esc(title)}</strong><p>${esc(desc)}</p></div></div>`).join('')}</div><img src="${esc(g[2].src)}" alt="${esc(g[2].alt)}"></div></section>
      <section class="experience-section" id="stay"><h2>Where you’ll stay</h2><p>Settle into a locally run guesthouse, with time for shared meals and quiet moments of your own.</p><img class="stay-image" src="${esc(g[4].src)}" alt="${esc(g[4].alt)}"><div class="stay-rating">${[['Accommodation',e.comfort,'A private room with simple, comfortable furnishings.'],['Food',Math.min(5,e.comfort+1),'Breakfast and one shared meal each day.'],['Bathroom',e.comfort,e.comfort>=4?'A private bathroom with hot water.':'A shared bathroom; hot water may vary.'],['Connectivity',Math.max(1,e.comfort-1),e.comfort>=4?'Wi-Fi is available; speeds can vary.':'Wi-Fi may be limited or intermittent.'],['Physical effort',e.interest==='Building'?4:2,e.effort+'.']].map(([name,n,desc])=>`<div class="rating-row"><div><strong>${name}</strong><p>${esc(desc)}</p></div>${dots(n)}</div>`).join('')}</div><p class="rating-note">For physical effort, more dots mean a more demanding activity.</p></section>
      <section class="experience-section" id="good-to-know"><h2>Good to know</h2><div class="good-grid"><div><span>♧</span><h3>Cultural etiquette</h3><p>Ask before taking photos and follow your host’s guidance. Family spaces and ceremonies may be private.</p></div><div><span>✚</span><h3>Safety & emergency</h3><p>Your host explains site safety. ${m?'For an emergency in Australia, call 000 for police, fire or ambulance.':'For urgent help, contact local emergency services.'} A host contact is shared before departure.</p>${m?'<a class="text-link" href="https://www.triplezero.gov.au/" target="_blank" rel="noopener">Australian emergency guidance ↗</a>':'<button class="text-link" data-action="emergency">Emergency information</button>'}</div><div><span>♿</span><h3>Accessibility</h3><p>Ask your host about step-free access and adaptations before booking.</p></div><div><span>⌁</span><h3>What to bring</h3><p>${m?'Closed shoes, long sleeves and comfortable outdoor clothing. Protective equipment is provided.':'Comfortable clothes suitable for the work, closed shoes and a reusable water bottle.'}</p></div></div></section>
      <section class="experience-section"><h2>Community impact</h2><p>Your time and your payment can support the people sharing their knowledge.</p><div class="impact-line"><strong>${e.hostShare}%</strong><div><b>Goes to your host</b><p>For teaching, hosting and the work behind your stay.</p></div></div><div class="impact-line"><strong>${e.communityShare}%</strong><div><b>Supports the community</b><p>A contribution to a fund selected by your host.</p></div></div><p class="rating-note">The remaining 25% covers platform and guest support.</p></section>
      <section class="experience-section" id="reviews"><h2>${m?'★ 4.9 · 12 reviews':'Reviews'}</h2>${m?`<div class="review-grid"><div><b>★★★★★</b><h3>“A week that stayed with me.”</h3><p>Mia made space for every question. I left with a much better understanding of bees and the care behind the honey.</p><small>Alex · March 2026</small></div><div><b>★★★★★</b><h3>“Learning at a different pace.”</h3><p>The days felt grounded and generous. I loved being able to practise, then sit down and share a meal together.</p><small>Sam · January 2026</small></div></div>`:'<p>No reviews yet. Be the first to share your experience after your stay.</p>'}</section>
      <section class="experience-section"><h2>Cancellation policy</h2><p>Cancel at least 30 days before the start for a full refund; 15–29 days before for 50%. Within 14 days, the booking is non-refundable.</p><p>If your host cancels, you receive a full refund, including fees. Travel insurance is recommended.</p></section>
      <section class="experience-section"><h2>Where you’ll be</h2><p>⌖ &nbsp;${esc(e.place)}</p>${areaMap(e)}<p><a class="text-link" target="_blank" rel="noopener" href="${placeLink}">Explore the area on OpenStreetMap ↗</a></p><p class="rating-note">The exact meeting location is shared after confirmation.</p></section>
    </div>${detailBookingCard(e)}</div>
    <section class="similar-section"><div class="section-title"><div><span class="eyebrow">KEEP FOLLOWING YOUR CURIOSITY</span><h2>Similar experiences</h2></div><a href="#/discover">See all experiences ↗</a></div><div class="discover-grid">${sim.map(discoverCard).join('')}</div></section>
    ${bookingMobileBar(e)}
  </main>`;
}
function detailGallery(e,index=0){let g=galleryFor(e),d=document.createElement('dialog');d.className='photo-dialog';d.setAttribute('aria-label','Photo gallery');d.innerHTML=`<div class="photo-viewer"><div class="photo-viewer-head"><b>Photos · ${esc(e.title)}</b><button class="drawer-close" data-photo-close aria-label="Close gallery">×</button></div><img id="photo-viewer-img" src="${esc(g[index].src)}" alt="${esc(g[index].alt)}"><div class="photo-viewer-footer"><button class="btn outline small" data-photo-prev aria-label="Previous photo">←</button><span id="photo-viewer-count">${index+1} / 5</span><button class="btn outline small" data-photo-next aria-label="Next photo">→</button></div></div>`;document.body.append(d);d.addEventListener('click',ev=>{let b=ev.target.closest('button');if(!b){if(ev.target===d)d.close();return}if(b.hasAttribute('data-photo-close'))d.close();if(b.hasAttribute('data-photo-prev'))index=(index+4)%5;if(b.hasAttribute('data-photo-next'))index=(index+1)%5;let img=d.querySelector('#photo-viewer-img');img.src=g[index].src;img.alt=g[index].alt;d.querySelector('#photo-viewer-count').textContent=`${index+1} / 5`});d.addEventListener('close',()=>d.remove());d.showModal()}
function journey(index){
  const r=state.requests[index],e=find(r.id),hostName=esc(e.host.split(' ')[0]);
  if(!confirmedStatuses.includes(r.status))return `<main class="narrow trips-page">
    ${tripHeader(r,e,index)}
    <div class="panel">${r.status==='pending'
      ?`<h2>Waiting for ${hostName}’s reply</h2><p>In the demo, you can switch to Host view to accept or decline this request.</p><a class="btn outline" href="#/host">Simulate a host reply ↗</a>`
      :`<h2>This trip is not going ahead</h2><p>Nothing was charged. You can choose a new date or try a different experience.</p><a class="btn outline" href="#/experience/${e.id}">Back to experience</a>`}</div>
  </main>`;
  const completed=r.status==='completed';
  const checklist=['Check visa and passport requirements','Consult a travel health professional about vaccines','Review your travel insurance','Pack for the weather and your host’s activities','Learn a few words in the local language','Read the cultural primer and seasonal notes','Save local emergency numbers and host contact'];
  const messages=state.messages.filter(m=>m.id===e.id&&(m.trip===index||m.trip===undefined));
  return `<main class="narrow trips-page">
    ${tripHeader(r,e,index)}
    <div class="two">
      <section class="panel"><div class="eyebrow">Your countdown</div><h2>${completed?'Welcome home':countdown(r.date)}</h2><p>${completed?'Your sample experience is complete.':'Until your sample experience starts.'}</p></section>
      <section class="panel"><h2>Travel with care</h2><p>Review your insurance and keep local emergency contacts close.</p>
        <div class="button-row"><button class="btn outline small" data-action="emergency">Emergency info</button><button class="btn outline small" data-action="report">Report a problem</button></div></section>
    </div>
    <section class="section-sm">
      <h2>Your preparation list</h2><div class="checklist">${checklist.map((item,i)=>`<label><input type="checkbox" data-check="${i}" ${r.checks?.includes(i)?'checked':''}> ${item}</label>`).join('')}</div>
      <p class="muted">Visa, health and seasonal requirements depend on your nationality, itinerary and dates; check current official guidance.</p>
    </section>
    <section class="two">
      <div class="panel"><h3>Your cultural primer</h3><p>Ask before taking photos. Follow ${hostName}’s lead on dress, meals and tools. Respect private family spaces and ceremonies.</p><p>Ask your host how to say hello and thank you in ${esc(e.language)}.</p></div>
      <div class="panel"><h3>Seasonal notes</h3><p>Best season: ${esc(e.season)}. Weather, harvests and activities vary. Your host would confirm packing and conditions before departure.</p></div>
    </section>
    <section class="section-sm two">
      <div class="panel"><h3>Messages with ${hostName}</h3><p class="muted">Messages stay in this browser.</p>
        ${messages.map(m=>`<p class="note"><b>${esc(m.from)}:</b> ${esc(m.text)}</p>`).join('')||'<p class="note">Your sample host: Looking forward to meeting you.</p>'}
        <form id="message-form" data-id="${e.id}"><div class="form-group"><label for="msg">Your message</label><textarea id="msg" name="message" required></textarea></div><button class="btn small">Send sample message</button></form>
      </div>
      <div class="panel"><h3>Payment & documents</h3><p>No actual payment was taken. A receipt and the host’s contact details would appear here in a live service.</p><button class="btn outline small" data-action="insurance">Travel insurance</button></div>
    </section>
    <div class="panel">${completed?`<h3>Reflect on what you learned</h3><a class="btn" href="#/after/${index}">Continue to reflection ↗</a>`
      :`<h3>Trying the post-experience flow?</h3><button class="btn" data-complete-trip="${index}">Mark sample complete</button>`}</div>
  </main>`;
}
function countdown(date){let x=Math.ceil((new Date(date+'T00:00:00')-new Date())/86400000);return x>0?`${x} days`:x===0?'Today is the day':'Your journey has begun'}function safetyPanel(){return `<div class="note"><strong>Here when you need us.</strong> &nbsp; Safety information, emergency contacts, reporting and clear cancellation terms are part of the proposed journey. All support functions are simulated.</div>`}
function after(index){
  const r=state.requests[index];
  if(r?.status!=='completed')return `<main class="narrow section"><h1>After your experience</h1><p>Reviews become available after your sample trip is complete.</p><a class="btn" href="#/journey">Go to your trips</a></main>`;
  const e=find(r.id);
  return `<main class="narrow">
    <div class="page-head"><a class="back" href="#/journey/${index}">← Back to trip</a><div class="eyebrow">Take the learning with you</div><h1>What will stay with you?</h1><p class="sub">${esc(e.title)} · ${esc(e.host)}</p></div>
    <div class="form-layout"><div>
      <form id="review-form" class="form-card"><h2>Review your experience</h2>
        ${r.review?`<p class="note"><b>Saved review:</b> ${esc(r.review.review)}</p>`:''}
        <div class="form-group"><label for="rating">Overall experience</label><select id="rating" name="rating"><option>★★★★★ · Wonderful</option><option>★★★★☆ · Very good</option><option>★★★☆☆ · Good</option><option>★★☆☆☆ · Needs improvement</option><option>★☆☆☆☆ · Disappointing</option></select></div>
        <div class="form-group"><label for="review">What did you learn?</label><textarea id="review" name="review" required></textarea></div>
        <div class="form-group"><label for="made">What did you make or practise?</label><textarea id="made" name="made"></textarea></div>
        <div class="form-group"><label for="photo">Share a photo <span class="muted">· demo only, not saved</span></label><input id="photo" type="file" accept="image/*"></div>
        <button class="btn">Save sample review</button>
      </form>
      <div class="panel"><h3>Stay connected</h3><p>Keep in touch with ${esc(e.host)}.</p><a class="btn outline small" href="#/journey/${index}">Return to messages</a></div>
    </div><aside class="panel">
      <h3>A note from your host</h3>${r.hostReview?`<p class="note">${esc(r.hostReview)}</p>`:'<p class="muted">A sample host review can be added from Host view.</p>'}
      <a href="#/host">Go to Host view ↗</a>
    </aside></div>
  </main>`;
}
function profile(){
  const saved=experiences.filter(e=>state.saved.includes(e.id));
  return `<main class="wrap"><div class="page-head"><div class="eyebrow">Your corner of elsewhere</div><h1>Your profile.</h1><p class="sub">The places you’re curious about and the journeys you’ve imagined.</p></div>
    <div class="tabs"><a class="active" href="#/profile">Wishlist (${saved.length})</a><a href="#/journey">Your trips (${state.requests.length})</a></div>
    <section class="section-sm"><div class="section-title"><div><div class="eyebrow">Keep dreaming</div><h2>Your wishlist</h2></div><a href="#/discover">Discover more ↗</a></div>
      <div class="discover-grid">${saved.length?saved.map(e=>discoverCard(e)).join(''):'<div class="empty">Save an experience with ♡ and it will be waiting here.</div>'}</div>
    </section></main>`;
}
function host(){
  const requests=state.requests, last=requests.at(-1), latestExperience=last&&find(last.id);
  const earnings=requests.filter(r=>confirmedStatuses.includes(r.status)).reduce((sum,r)=>{
    const e=find(r.id);
    return sum+tripAmount(r,e)*e.hostShare/100;
  },0);
  return `<main class="wrap">
    <div class="page-head"><div class="eyebrow">A space for hosts · illustrative</div><h1>Welcome, ${latestExperience?esc(latestExperience.host.split(' ')[0]):'host'}.</h1><p class="sub">Your knowledge, your terms, your community.</p></div>
    <div class="tabs"><a class="active" href="#/host">Overview</a><a href="#/host-onboarding">Host verification</a><a href="#/journey">Guest view</a></div>
    <div class="three">
      <div class="panel"><div class="eyebrow">Your host profile</div><h3>${latestExperience?esc(latestExperience.host):'Your story goes here'}</h3><p>Set your story, teaching languages and community boundaries.</p><button class="btn outline small" data-action="host-profile">View profile</button></div>
      <div class="panel"><div class="eyebrow">Your calendar</div><h3>Available dates</h3><p>${last?.date?'Latest trip: '+dateLabel(last.date):'Add dates that work for your life and practice.'}</p><button class="btn outline small" data-action="calendar">View sample calendar</button></div>
      <div class="panel"><div class="eyebrow">Earnings & impact</div><h3>${euro(earnings)} <small class="muted">demo host share</small></h3><p>Example split: 65% host, 10% community fund, 25% platform and support.</p></div>
    </div>
    <section class="section-sm">
      <div class="section-title"><div><div class="eyebrow">Guest activity</div><h2>Bookings and requests</h2></div><span class="badge">${requests.filter(r=>r.status==='pending').length} awaiting reply</span></div>
      <div class="trip-list">${requests.length?requests.map((r,index)=>{
        const e=find(r.id);
        return `<div class="panel"><div class="row"><div><h3>${esc(r.name)} · ${esc(e.title)}</h3>
          <p class="muted">${r.date?dateLabel(r.date):'No date'} · ${duration(r.duration)} · ${guestLabel(r.guests||1)}</p></div>
          <span class="status trip-status-${esc(r.status)}">${tripStatus(r)}</span></div>
          ${r.intro?`<p><b>Interests:</b> ${esc(r.intro)}</p>`:''}
          ${r.motivation?`<p><b>Motivation:</b> ${esc(r.motivation)}</p>`:''}
          ${r.needs?`<p><b>Accommodation needs:</b> ${esc(r.needs)}</p>`:''}
          ${r.message?`<p><b>Note from guest:</b> ${esc(r.message)}</p>`:''}
          <div class="button-row">${r.status==='pending'
            ?`<button class="btn small" data-host-decision="accept" data-index="${index}">Accept sample request</button><button class="btn outline small" data-host-decision="decline" data-index="${index}">Decline</button>`
            :`<a class="btn outline small" href="#/journey/${index}">View trip ↗</a>`}
            ${r.status==='completed'?`<button class="btn outline small" data-action="host-review" data-index="${index}">Write a guest review</button>`:''}
          </div></div>`;
      }).reverse().join(''):'<div class="panel"><p>No demo trips yet.</p><a class="btn outline small" href="#/discover">Browse experiences</a></div>'}</div>
    </section><div class="section-sm">${safetyPanel()}</div>
  </main>`;
}
function hostOnboarding(){return `<main class="narrow"><div class="page-head"><a class="back" href="#/host">← Back to host view</a><div class="eyebrow">Host onboarding</div><h1>Let’s build trust, together.</h1><p class="sub">Before welcoming a guest, hosts complete three verification steps. This flow is illustrative and collects no documents.</p></div><div class="form-card"><h2>01 &nbsp; Identity</h2><p>Confirm your identity through a secure verification process.</p><label class="check"><input type="checkbox" class="verify-step"> &nbsp; I understand the identity step</label></div><div class="form-card"><h2>02 &nbsp; References</h2><p>Provide references who can speak to your experience and community connection.</p><label class="check"><input type="checkbox" class="verify-step"> &nbsp; I understand the references step</label></div><div class="form-card"><h2>03 &nbsp; Site check</h2><p>A local partner reviews the proposed setting, safety information, accessibility and host-defined boundaries.</p><label class="check"><input type="checkbox" class="verify-step"> &nbsp; I understand the site check</label></div><button class="btn" data-action="verify">Complete sample onboarding</button><p class="muted" style="font-size:12px">A sample badge does not mean any real verification has occurred.</p></main>`}
function render(){
  const [route='home', id]=location.hash.replace(/^#\/?/,'').split('/').filter(Boolean), e=find(id);
  const detailPage=route==='experience'&&e, checkoutPage=(route==='dates'||route==='request')&&e;
  if(detailPage) initBooking(e);
  app.innerHTML=detailPage?detail(e):checkoutPage?checkout(e,route==='dates'?'instant':'request'):
    route==='discover'?discover():route==='journey'?(state.requests[tripIndex()]?journey(tripIndex()):tripList()):
    route==='after'?after(tripIndex()):route==='profile'?profile():route==='host'?host():route==='host-onboarding'?hostOnboarding():home();
  if(detailPage) requestAnimationFrame(updateDetailNav);
  if(detailPage||checkoutPage) updateBookingSummary(e);
  document.title=(route==='home'?'Live and learn':detailPage?e.title:route==='journey'?'Your trips':route[0].toUpperCase()+route.slice(1))+' · Elsewhere Academy';
  window.scrollTo(0,0);
}
window.addEventListener('hashchange',render);
function preserve(){let y=window.scrollY;render();window.scrollTo(0,y)}function modal(title,body,actions='<button class="btn outline small" data-close>Close</button>'){let d=document.createElement('dialog');d.innerHTML=`<div class="row"><h2 style="font-size:27px;margin:0">${title}</h2><button class="chip" data-close aria-label="Close">×</button></div><div style="margin:20px 0">${body}</div><div class="button-row">${actions}</div>`;document.body.append(d);d.addEventListener('close',()=>d.remove());d.showModal()}
const quizQuestions=[{key:'duration',q:'How much time do you have?',intro:'There is room for a meaningful experience in the time you have.',answers:[[2,'A weekend'],[7,'About a week'],[14,'Two weeks'],[30,'Up to a month']]},{key:'interest',q:'What would you love to learn?',intro:'Follow the thing you keep coming back to.',answers:[['Food','Food & fermentation'],['Craft','Craft & making'],['Music','Music & rhythm'],['Agriculture','Growing & nature'],['Wellness','Wellness'],['Language','Language'],['Building','Building']]},{key:'comfort',q:'How much comfort feels right?',intro:'Both simple stays and extra comforts can be meaningful.',answers:[[2,'Simple & close to daily life'],[3,'A balance of comfort & simplicity'],[4,'A little more comfort']]}];function quiz(){let q=quizQuestions[quizStep];modal(`0${quizStep+1} / 03`, `<h2 style="margin:0 0 12px">${q.q}</h2><p class="muted">${q.intro}</p><div class="chips">${q.answers.map(([v,l])=>`<button class="chip" data-quiz="${esc(v)}">${esc(l)}</button>`).join('')}</div>`,quizStep?'<button class="btn outline small" data-quiz-back>← Back</button>':'<button class="btn outline small" data-close>Skip quiz</button>')}
app.addEventListener('click',event=>{
  const t=event.target.closest('button, [data-action=gallery]');
  if(!t)return;
  if(t.dataset.save){
    const id=Number(t.dataset.save);
    state.saved=state.saved.includes(id)?state.saved.filter(x=>x!==id):[...state.saved,id];
    save();preserve();toast(state.saved.includes(id)?'Saved to your wishlist':'Removed from wishlist');return;
  }
  if(t.dataset.openPhoto){detailGallery(find(t.dataset.openPhoto),Number(t.dataset.photoIndex||0));return}
  if(t.dataset.scroll){document.getElementById(t.dataset.scroll)?.scrollIntoView({behavior:'smooth',block:'start'});return}
  if(t.dataset.detailBook){to(`dates/${t.dataset.detailBook}`);return}
  if(t.dataset.bookingMode){to(`${t.dataset.bookingMode==='instant'?'dates':'request'}/${activeBookingId}`);return}
  if(t.dataset.askHost){
    const host=find(t.dataset.askHost);
    modal('Ask '+esc(host.host.split(' ')[0]),`<p>Write a question about the experience, accommodation or what you will learn.</p><div class="form-group"><label for="host-question">Your question</label><textarea id="host-question" placeholder="What would you like to know?"></textarea></div>`,`<button class="btn small" data-send-question="${host.id}">Save question</button>`);
    return;
  }
  if(t.dataset.share){
    const url=location.origin+location.pathname+'#/experience/'+t.dataset.share;
    const share=()=>modal('Share this experience',`<p>Copy this link:</p><input style="width:100%;padding:12px" readonly value="${esc(url)}">`);
    if(navigator.clipboard&&window.isSecureContext)navigator.clipboard.writeText(url).then(()=>toast('Experience link copied')).catch(share);
    else share();
    return;
  }
  if(t.dataset.view){view=t.dataset.view;preserve();return}
  if(t.dataset.removeFilter){filters[t.dataset.removeFilter]='';preserve();return}
  if(t.dataset.goto){to(t.dataset.goto);return}
  if(t.dataset.hostDecision){
    const r=state.requests[Number(t.dataset.index)];
    if(r?.status!=='pending')return;
    const accept=t.dataset.hostDecision==='accept';
    if(accept&&r.mode==='request'&&bookingSlot(find(r.id),r.date,r.duration,r.guests)!=='available'){
      toast('Not enough places remain for this request. Choose Decline.');return;
    }
    r.status=accept?'confirmed':'declined';
    save();preserve();toast(accept?'Sample request accepted':'Sample request declined');return;
  }
  const a=t.dataset.action;
  if(a==='open-filters'){openFilters();return}
  if(a==='clear-filters'){filters={q:'',interest:'',continent:'',duration:'',budget:'',month:'',comfort:'',language:'',cohort:''};preserve()}
  if(a==='quiz'){quizStep=0;quiz()}
  if(a==='emergency')modal('Emergency information','<p>In a real emergency, contact local emergency services immediately. A confirmed local emergency number and host contact would be shared before departure.</p><p class="notice">This is a prototype; no emergency service is connected.</p>');
  if(a==='report')modal('Report a problem','<p>In a live service, you could report a safety or booking concern to the support team.</p><div class="form-group"><label for="problem">Tell us what happened</label><textarea id="problem" placeholder="Describe your concern"></textarea></div><p class="notice">This prototype cannot send reports or provide live support.</p>');
  if(a==='insurance')modal('Travel insurance','<p>Choose travel insurance that covers medical expenses, cancellation and the activities you plan to do. Read the provider’s terms and check destination-specific requirements.</p>');
  if(a==='calendar')modal('Sample host calendar','<p>Hosts can choose dates and capacity around their own work and community commitments.</p><p class="muted">Explore a guest calendar to see the sample schedule. No live availability is published.</p>');
  if(a==='host-profile')modal('Your host profile','<p>Introduce your practice, your community, teaching languages, accessibility and what you choose to share with guests.</p><p class="notice">This is a sample host view; profiles are fictional.</p>');
  if(a==='gallery')modal('Experience gallery',`<div class="two">${picture(find(t.dataset.id))}${picture(find(t.dataset.id))}</div><p class="muted">Illustrative images of the practice, not a confirmed host or venue.</p>`);
  if(a==='verify'){
    if(document.querySelectorAll('.verify-step:checked').length!==3){toast('Review all three steps first.');return}
    state.hostVerified=true;save();toast('Sample onboarding completed');to('host');
  }
  if(a==='sample-journey'){
    const e=find(1),duration=14,guests=1,date=firstBookingDay(e,duration,guests);
    if(!date){toast('No sample date is available.');return}
    const index=state.requests.push({id:e.id,name:'Alex Morgan',date:isoDay(date),duration,guests,
      total:quote(e,duration,guests).total,status:'confirmed',message:'I’m curious about tea and the people who grow it.'})-1;
    save();to(`journey/${index}`);
  }
  if(a==='host-review'){
    const index=Number(t.dataset.index);
    if(state.requests[index]?.status!=='completed')return;
    modal('Review your guest','<p>Host reviews are only available after an experience is complete.</p><div class="form-group"><label for="hostreview">Your review</label><textarea id="hostreview" placeholder="Share what it was like to host your guest"></textarea></div>',`<button class="btn small" data-sample-review="${index}">Save sample host review</button>`);
  }
});
app.addEventListener('input',event=>{
  if(event.target.id==='booking-note')bookingNote=event.target.value;
});
app.addEventListener('change',({target:el})=>{
  if(el.hasAttribute('data-sort')){sortOrder=el.value;preserve();return}
  if(el.id==='detail-duration'||el.id==='detail-guests'){
    const e=find(activeBookingId);
    if(el.id==='detail-duration')selectedDuration=Number(el.value);
    else guestCount=Number(el.value);
    if(selectedDate&&bookingSlot(e,selectedDate,selectedDuration,guestCount)!=='available'){
      const message='The selected date is unavailable with these options.';
      selectedDate='';
      bookingError(message);
      toast(message);
    }else bookingError();
    updateBookingSummary(e);
    if(!$('#calendar-popover').hidden)renderBookingCalendar();
    return;
  }
  if(el.dataset.extra){
    extras=el.checked?[...new Set([...extras,el.dataset.extra])]:extras.filter(id=>id!==el.dataset.extra);
    updateBookingSummary(find(activeBookingId));
  }
  if(el.dataset.check!==undefined){
    const r=state.requests[tripIndex()], id=Number(el.dataset.check);
    if(!r)return;
    r.checks=el.checked?[...new Set([...(r.checks||[]),id])]:(r.checks||[]).filter(n=>n!==id);
    save();
  }
});
app.addEventListener('submit',event=>{
  event.preventDefault();
  const form=event.target,data=new FormData(form);
  if(form.id==='search-form'){filters.q=data.get('search').trim();preserve()}
  if(form.id==='checkout-form')completeCheckout(form,data);
  if(form.id==='message-form'){
    state.messages.push({id:Number(form.dataset.id),trip:tripIndex(),from:'You',text:data.get('message')});
    save();preserve();toast('Sample message saved in this browser');
  }
  if(form.id==='review-form'){
    const index=tripIndex(),r=state.requests[index];
    if(r?.status!=='completed')return;
    r.review={rating:data.get('rating'),review:data.get('review'),made:data.get('made')};
    save();toast('Sample review saved in this browser');to(`journey/${index}`);
  }
});
document.addEventListener('click',event=>{
  const b=event.target.closest('dialog button');
  if(!b)return;
  const dialog=b.closest('dialog');
  if(b.hasAttribute('data-close'))dialog.close();
  if(b.dataset.sendQuestion){
    const msg=$('#host-question').value.trim();
    if(!msg){toast('Write a question first');return}
    state.messages.push({id:Number(b.dataset.sendQuestion),from:'You',text:msg});
    save();dialog.close();toast('Question saved');
  }
  if(b.hasAttribute('data-sample-review')){
    const r=state.requests[Number(b.dataset.sampleReview)], review=$('#hostreview').value.trim();
    if(r?.status!=='completed')return;
    if(!review){toast('Write a short review first');return}
    r.hostReview=review;save();dialog.close();toast('Sample host review saved');
  }
  if(b.dataset.quiz!==undefined){
    state.quiz[quizQuestions[quizStep].key]=b.dataset.quiz;
    dialog.close();
    if(quizStep<2){quizStep++;quiz()}
    else{
      filters={q:'',continent:'',budget:'',month:'',language:'',cohort:'',duration:state.quiz.duration,interest:state.quiz.interest,comfort:state.quiz.comfort};
      save();
      if(location.hash==='#/discover')render();
      else to('discover');
    }
  }
  if(b.hasAttribute('data-quiz-back')){dialog.close();quizStep--;quiz()}
});
render();

app.addEventListener('keydown',e=>{if((e.key==='Enter'||e.key===' ')&&e.target.matches('[data-action=gallery]')){e.preventDefault();e.target.click()}});

app.addEventListener('click',event=>{
  const b=event.target.closest('button');
  if(!b)return;
  const pane=$('#calendar-popover'),trigger=$('#date-trigger');
  if(b.id==='date-trigger'){
    pane.hidden=!pane.hidden;
    trigger.setAttribute('aria-expanded',String(!pane.hidden));
    if(!pane.hidden)renderBookingCalendar();
  }else if(b.dataset.calNav){
    calendarMonth.setMonth(calendarMonth.getMonth()+Number(b.dataset.calNav));
    renderBookingCalendar();
    (pane.querySelector(`[data-cal-nav="${b.dataset.calNav}"]:enabled`)||pane.querySelector('[data-cal-nav]:enabled'))?.focus();
  }else if(b.dataset.calDate){
    selectedDate=b.dataset.calDate;
    pane.hidden=true;
    trigger.setAttribute('aria-expanded','false');
    updateBookingSummary(find(activeBookingId));
    bookingError();
    trigger.focus();
  }else if(b.hasAttribute('data-cancel-trip')){
    cancelTrip(Number(b.dataset.cancelTrip));
  }else if(b.hasAttribute('data-complete-trip')){
    const index=Number(b.dataset.completeTrip), r=state.requests[index];
    if(!r||!['confirmed','accepted'].includes(r.status))return;
    r.status='completed';
    save();
    to(`after/${index}`);
  }
});
document.addEventListener('click',event=>{
  const pane=$('#calendar-popover'), trigger=$('#date-trigger');
  if(pane&&!pane.hidden&&!event.composedPath().includes(pane)&&!trigger.contains(event.target)){
    pane.hidden=true;
    trigger.setAttribute('aria-expanded','false');
  }
  const b=event.target.closest('dialog [data-confirm-cancel]');
  if(!b)return;
  const r=state.requests[Number(b.dataset.confirmCancel)];
  if(!r||!canCancelTrip(r))return;
  r.status='cancelled';
  save();
  b.closest('dialog').close();
  preserve();
  toast('Demo trip cancelled');
});
document.addEventListener('keydown',ev=>{if(ev.key==='Escape'){let pane=document.querySelector('#calendar-popover');if(pane&&!pane.hidden){pane.hidden=true;let trigger=document.querySelector('#date-trigger');trigger.setAttribute('aria-expanded','false');trigger.focus()}}});
function updateDetailNav(){let sections=['overview','host','day','stay','reviews'],current=sections[0];sections.forEach(id=>{let el=document.getElementById(id);if(el&&el.getBoundingClientRect().top<=140)current=id});document.querySelectorAll('.detail-nav button').forEach(b=>{let active=b.dataset.scroll===current;b.classList.toggle('active',active);if(active)b.setAttribute('aria-current','true');else b.removeAttribute('aria-current')})}window.addEventListener('scroll',updateDetailNav,{passive:true});
app.addEventListener('scroll',e=>{if(e.target.id==='gallery-mobile'){let n=Math.round(e.target.scrollLeft/e.target.clientWidth)+1,c=document.querySelector('#gallery-counter');if(c)c.textContent=`${Math.min(5,n)} / 5`}},true);
