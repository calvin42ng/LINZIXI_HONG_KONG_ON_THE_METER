export const TAXIS = {
 red:{name:'Red taxi',zh:'紅色的士',bonus:0,areas:['islands','nt','kowloon','hk'],range:'All Hong Kong',rangeZh:'全香港',color:'#df4b40'},
 green:{name:'Green taxi',zh:'綠色的士',bonus:6,areas:['islands','nt'],range:'New Territories + Airport & Islands',rangeZh:'新界及機場與離島',color:'#188d68'},
 blue:{name:'Blue taxi',zh:'藍色的士',bonus:10,areas:['islands'],range:'Airport & Islands',rangeZh:'機場與離島',color:'#298bc5'}
};
export const REGIONS = {islands:{name:'Airport & Islands',zh:'機場與離島',view:[310,155,805,707]},nt:{name:'New Territories',zh:'新界',view:[750,0,1295,740]},kowloon:{name:'Kowloon',zh:'九龍',view:[340,680,1280,1030]},hk:{name:'Hong Kong Island',zh:'香港島',view:[350,1155,1290,1580]}};
export const CARDS = {
 red:[
 {id:'R01',title:'Rush Hour',zh:'高峰擠塞',text:'Reduce your next base move by 2 steps. Always move at least 1 step.',effect:'penalty',value:2},
 {id:'R02',title:'Roadworks',zh:'道路施工',text:'Backtrack 2 steps along the route just taken. If you moved only 1 step, go back 1.',effect:'back',value:2},
 {id:'R03',title:'Tyre Care',zh:'輪胎保養',text:'Pay 40 game coins for tyre maintenance.',effect:'pay',value:40},
 {id:'R04',title:'Refuel',zh:'燃料補給',text:'Pay 30 game coins to refuel your taxi.',effect:'pay',value:30},
 {id:'R05',title:'Rainy Roads',zh:'雨天慢行',text:'Reduce your next base move by 1 step. Always move at least 1 step.',effect:'penalty',value:1},
 {id:'R06',title:'Road Reopened',zh:'恢復通行',text:'Save a card roll for your next turn. Tap 空車 / VACANT then; one roll per turn still applies.',effect:'extra'},
 {id:'R07',title:'Cabin Cleaning',zh:'車廂清潔',text:'Pay 20 game coins to clean the cabin.',effect:'pay',value:20},
 {id:'R08',title:'Radio Traffic Tip',zh:'電召路況提示',text:'Move up to 2 steps towards your destination on the shortest legal route.',effect:'forward',value:2},
 {id:'R09',title:'Fleet Subsidy',zh:'車隊營運補貼',text:'Add 30 coins to this order’s pending reward. Collect on delivery.',effect:'reward',value:30},
 {id:'R10',title:'Route Check',zh:'路線覆核',text:'In 20 seconds, point to and name your current destination. Succeed to save a card roll for your next turn.',effect:'challenge-extra',challenge:'destination'}
 ],
 green:[
 {id:'G01',title:'Polite Pickup',zh:'禮貌接客',text:'Greet your passenger and confirm the destination. Complete the challenge to add 6 coins on delivery.',effect:'challenge',challenge:'greet',value:6},
 {id:'G02',title:'Luggage Help',zh:'行李協助',text:'Ask the passenger’s permission before helping with luggage. Complete the challenge to add 6 coins on delivery.',effect:'challenge',challenge:'luggage',value:6},
 {id:'G03',title:'Passenger Praise',zh:'乘客好評',text:'Your service earns a good review. Add 10 coins to this order’s reward.',effect:'reward',value:10},
 {id:'G04',title:'Clear Road',zh:'暢通路段',text:'Move forward 2 steps on a legal route. Do not draw another event card.',effect:'forward',value:2},
 {id:'G05',title:'Radio Booking',zh:'電召加單',text:'Add 10 coins when this order is delivered. Award this bonus once only.',effect:'reward',value:10},
 {id:'G06',title:'Quick Meter Tap',zh:'快速打表',text:'Save a 1–6 card roll for your next turn. Only one dice roll is allowed per turn.',effect:'extra'},
 {id:'G07',title:'Know Your Taxi',zh:'車型知識',text:'State where your current taxi colour may travel in this game. Answer within 20 seconds to add 6 coins on delivery.',effect:'challenge',challenge:'taxi',value:6},
 {id:'G08',title:'Local Landmark',zh:'地標導賞',text:'Name one place in your current district and its landmark. Answer within 20 seconds to add 8 coins on delivery.',effect:'challenge',challenge:'landmark',value:8},
 {id:'G09',title:'Fare Check',zh:'車資計算',text:'Airport → Tung Chung: 15 steps shortest, 25 taken. What is the base fare? Answer within 20 seconds to add 6 coins on delivery.',effect:'challenge',challenge:'fare',value:6},
 {id:'G10',title:'Ride Receipt',zh:'乘車憑證',text:'Asked for proof of the ride? Give a receipt and remind the passenger to note the plate. Complete the challenge for 6 coins on delivery.',effect:'challenge',challenge:'receipt',value:6}
 ]
};
export class Game {
 constructor(nodes,rng=Math.random){this.nodes=nodes;this.rng=rng;this.state=null;this.routeCache=new Map();}
 get player(){return this.state.players[this.state.current];}
 allowed(id,taxi){return !!TAXIS[taxi]?.areas.includes(this.nodes[id]?.region);}
 hasTaxi(p=this.player){return !!TAXIS[p.taxi]&&(!p.job||p.job.initialTaxi!=null);}
 point(id){return '#'+String(id+1).padStart(4,'0');}
 shortest(start,end,taxi,transfers=true){
  const cacheKey=`${start}:${end}:${taxi}:${transfers}`;if(this.routeCache.has(cacheKey))return this.routeCache.get(cacheKey);
  if(!this.allowed(start,taxi))return null;
  const key=(id,t)=>id+':'+t,first=key(start,taxi),dist=new Map([[first,0]]),prev=new Map();let todo=[[0,start,taxi]],last=null;
  while(todo.length){todo.sort((a,b)=>b[0]-a[0]);const[d,u,t]=todo.pop(),k=key(u,t);if(d!==dist.get(k))continue;if(u===end){last=k;break;}
   const edges=this.nodes[u].adj.filter(v=>this.allowed(u,t)&&this.allowed(v,t)).map(v=>[v,t,1]);
   if(transfers&&this.nodes[u].type==='transfer')for(const other of Object.keys(TAXIS))if(other!==t&&this.allowed(u,other))edges.push([u,other,0]);
   for(const[v,tt,w]of edges){const kk=key(v,tt);if(d+w<(dist.get(kk)??Infinity)){dist.set(kk,d+w);prev.set(kk,k);todo.push([d+w,v,tt]);}}
  }
  if(!last)return null;const path=[];let k=last;while(k){const[id,t]=k.split(':');path.push({id:+id,taxi:t});k=prev.get(k);}const r={steps:dist.get(last),path:path.reverse()};this.routeCache.set(cacheKey,r);return r;
 }
 shuffle(a){const v=[...a];for(let i=v.length-1;i>0;i--){const j=Math.floor(this.rng()*(i+1));[v[i],v[j]]=[v[j],v[i]];}return v;}
 log(text){this.state.log.unshift(text);this.state.log=this.state.log.slice(0,50);}
 newGame(names,minutes=60){
  this.state={version:9,focusRevision:0,turnRollUsed:false,lastRoll:null,players:names.map((name,i)=>({name:name.trim().slice(0,24)||'Driver '+String.fromCharCode(65+i),coins:0,trips:0,taxi:null,bonusRolls:0,pos:null,job:null,penalty:0,heldPenalties:[],letter:String.fromCharCode(65+i)})),current:0,elapsed:0,limit:minutes*60,phase:'order',remaining:0,dice:null,closing:false,paused:false,decks:{red:[],green:[]},log:[],turn:1,card:null,viewRegion:'all',view:null,rolls:0};
  this.newOrder();return this.state;
 }
 newOrder(){
  if(this.state.closing){this.state.phase='finished';return;}
  const p=this.player,stops=this.nodes.filter(n=>n.name),from=stops[Math.floor(this.rng()*stops.length)];const choices=stops.filter(n=>n.id!==from.id),to=choices[Math.floor(this.rng()*choices.length)];
  p.pos=from.id;p.taxi=null;p.bonusRolls=0;p.job={from:from.id,to:to.id,shortest:null,bonus:0,initialTaxi:null,rewards:0,actual:0,history:[from.id],lastMove:[from.id],events:[],counts:{red:0,green:0},rewardedOnce:[],rolls:0,drawAttempts:0};this.state.phase='order';this.state.dice=null;this.state.remaining=0;this.state.card=null;
  this.focusView();this.log(p.name+' · new order: '+from.name+' → '+to.name);
 }
 focusView(){const s=this.state;s.viewRegion=this.nodes[this.player.pos].region;s.view=null;s.focusRevision=(s.focusRevision||0)+1;}
 acceptOrder(){if(this.state.phase!=='order'||this.state.paused)return false;this.state.phase='draw';return true;}
 // View edits are optional and never change a dice phase, position, fare or remaining steps.
 requestView(target,options={}){
  const s=this.state;if(!s||!['all',...Object.keys(REGIONS)].includes(target))return false;
  const previous=s.view;
  s.view={target,previous:previous?.previous??s.viewRegion,beforeCamera:previous?.beforeCamera??options.beforeCamera,targetCamera:options.targetCamera||null};
  s.viewRegion=target;return true;
 }
 confirmView(){const s=this.state;if(!s)return null;const target=s.viewRegion;s.view=null;return{stage:'confirmed',target};}
 cancelView(){const s=this.state,v=s?.view;if(!v)return false;s.viewRegion=v.previous;s.view=null;return v;}

 drawTaxi(){
  const s=this.state;if(s.phase!=='draw'||s.paused||s.closing||s.turnRollUsed||!this.player.job)return null;
  const p=this.player,raw=1+Math.floor(this.rng()*6),taxi=raw<=2?'blue':raw<=4?'green':'red';
  s.dice=raw;s.turnRollUsed=true;s.rolls++;p.job.drawAttempts=(p.job.drawAttempts||0)+1;
  const valid=this.allowed(p.pos,taxi),result={kind:'draw',turn:s.turn,name:p.name,letter:p.letter,point:p.pos,raw,taxi,valid};
  if(valid){
   p.taxi=taxi;p.job.initialTaxi=taxi;p.job.bonus=TAXIS[taxi].bonus;p.job.shortest=this.shortest(p.pos,p.job.to,taxi,true).steps;
   result.shortest=p.job.shortest;result.bonus=p.job.bonus;
   this.log(p.name+' · draw '+raw+' = '+TAXIS[taxi].name+'; D='+p.job.shortest+', fixed fare '+p.job.shortest*5+'. Driving starts on their next turn.');
  }else{
   p.taxi=null;this.log(p.name+' · draw '+raw+': '+TAXIS[taxi].name+' cannot serve this pickup. No taxi placed; turn passes. Retry on their next turn.');
  }
  s.phase='end';this.next();result.nextName=this.player.name;s.lastRoll=result;return result;
 }
 roll(){
  const s=this.state,p=this.player;
  if(!['roll','bonusroll'].includes(s.phase)||s.paused||s.turnRollUsed||!p.job?.initialTaxi||!this.hasTaxi(p))return null;
  const extra=s.phase==='bonusroll';if(extra&&!p.bonusRolls)return null;
  const raw=1+Math.floor(this.rng()*6),penalty=extra?0:p.penalty,steps=Math.max(1,raw-penalty);
  if(extra)p.bonusRolls--;else{p.penalty=0;p.heldPenalties=[];}
  s.turnRollUsed=true;s.dice=raw;s.remaining=steps;s.extraMove=extra;s.phase='move';s.rolls++;p.job.rolls++;p.job.lastMove=[p.pos];
  s.lastRoll={kind:'move',turn:s.turn,name:p.name,letter:p.letter,point:p.pos,raw,steps,extra};
  this.log(p.name+' · '+(extra?'queued card ':'')+'roll '+raw+(penalty?' − '+penalty+' = '+steps:''));return{raw,steps,penalty};
 }
 moves(){
  const s=this.state,p=this.player;if(s.paused||!['move','eventmove'].includes(s.phase)||!p.job)return[];
  const allowed=this.nodes[p.pos].adj.filter(id=>this.allowed(p.pos,p.taxi)&&this.allowed(id,p.taxi));
  if(s.closing||s.forceShortest){const d=this.shortest(p.pos,p.job.to,p.taxi,true)?.steps;return allowed.filter(id=>this.shortest(id,p.job.to,p.taxi,true)?.steps===d-1);}
  return allowed;
 }
 move(id){
  if(!this.moves().includes(id))return false;const s=this.state,p=this.player,previous=this.nodes[p.pos].region,eventMove=s.phase==='eventmove';p.pos=id;p.job.actual++;p.job.history.push(id);p.job.lastMove.push(id);s.remaining--;
  if(id===p.job.to)this.deliver();
  else if(s.remaining<=0)this.land(eventMove);
  else if(s.closing&&this.needsTransfer()){s.transferResume=eventMove?'eventmove':'move';s.phase='transfer';}
  else if(eventMove&&s.forceShortest&&!this.moves().length){s.remaining=0;this.land(true);}
  if(this.nodes[id].region!==previous)this.log('Entered '+REGIONS[this.nodes[id].region].name+' · '+s.remaining+' steps remain at '+this.point(id));
  return true;
 }
 needsTransfer(){const p=this.player;if(!p.job||this.nodes[p.pos].type!=='transfer')return false;const r=this.shortest(p.pos,p.job.to,p.taxi,true);return r?.path[1]?.id===p.pos&&r.path[1].taxi!==p.taxi;}
 land(suppress=false){
  const s=this.state,p=this.player,n=this.nodes[p.pos];s.remaining=0;s.extraMove=false;s.forceShortest=false;
  if(!suppress&&!s.closing&&['red','green'].includes(n.type)&&p.job.counts[n.type]<2&&!p.job.events.includes(p.pos)){s.phase='card';s.cardColor=n.type;s.card=null;}
  else{s.phase=n.type==='transfer'?'transfer':'end';if(['red','green'].includes(n.type)&&!suppress&&!s.closing)this.log(p.name+' · event skipped: '+(p.job.events.includes(p.pos)?'point already used this order':'two '+n.type+' cards already drawn'));}
 }
 drawCard(color=this.state.cardColor){
  const s=this.state,p=this.player;if(s.phase!=='card'||s.card||s.paused||s.closing||color!==s.cardColor||p.job.counts[color]>=2||p.job.events.includes(p.pos))return null;
  if(!s.decks[color].length){const held=new Set(s.players.flatMap(q=>q.heldPenalties||[]));s.decks[color]=this.shuffle([...Array(10).keys()].filter(i=>!held.has(CARDS[color][i].id)));}const idx=s.decks[color].pop();s.card={...CARDS[color][idx],color,index:idx};p.job.counts[color]++;p.job.events.push(p.pos);this.log(p.name+' · '+s.card.id+' '+s.card.title+' ('+p.job.counts[color]+'/2 '+color+')');return s.card;
 }
 resolveCard(success=false){
  const s=this.state,p=this.player,c=s.card;if(s.phase!=='card'||!c)return false;s.card=null;s.phase='end';let message='';
  if(s.closing&&['penalty','back','extra','forward','challenge-extra'].includes(c.effect)){message='Final fare: continue only on the shortest legal route.';s.phase=this.needsTransfer()?'transfer':'end';this.log(message);return message;}
  switch(c.effect){
   case'penalty':p.penalty+=c.value;p.heldPenalties.push(c.id);message='Next base move −'+c.value+' steps; minimum 1.';break;
   case'pay':p.coins-=c.value;message='−'+c.value+' coins paid now.';break;
   case'reward':if(c.id==='G05'&&p.job.rewardedOnce.includes('G05')){message='Radio Booking was already added to this order; no duplicate payment.';}else{p.job.rewards+=c.value;if(c.id==='G05')p.job.rewardedOnce.push('G05');message='+'+c.value+' coins pending delivery.';}break;
   case'back':{const path=p.job.lastMove;let count=0;while(count<c.value&&path.length>1){const id=path[path.length-2];if(!this.allowed(p.pos,p.taxi)||!this.allowed(id,p.taxi))break;path.pop();p.job.history.pop();p.pos=id;p.job.actual++;count++;if(p.pos===p.job.to){this.deliver();break;}}message='Backtracked '+count+' steps on the route actually taken.';if(p.job&&this.nodes[p.pos].type==='transfer')s.phase='transfer';break;}
   case'extra':p.bonusRolls++;message='Card roll saved for your next turn. Only one dice roll is allowed this turn.';break;
   case'forward':s.phase='eventmove';s.remaining=c.value;s.forceShortest=c.id==='R08';p.job.lastMove=[p.pos];message=c.id==='R08'?'Choose up to 2 steps on the shortest legal route.':'Choose 2 legal steps. This card movement triggers no new card.';if(!this.moves().length)this.land(true);break;
   case'challenge':if(success){p.job.rewards+=c.value;message='Correct! +'+c.value+' coins pending delivery.';}else message='Challenge missed; the card still counts towards this order’s limit.';break;
   case'challenge-extra':if(success){p.bonusRolls++;message='Destination confirmed! Your card roll is saved for your next turn.';}else message='Challenge missed; no card roll saved.';break;
  }
  this.log(p.name+' · '+message);return message;
 }
 switchTaxi(taxi){const s=this.state;if(s.phase!=='transfer'||s.paused||!this.allowed(this.player.pos,taxi))return false;if(s.closing&&this.shortest(this.player.pos,this.player.job.to,taxi,true)?.path[1]?.id===this.player.pos)return false;this.player.taxi=taxi;s.phase=s.transferResume||'end';s.transferResume=null;this.log(this.player.name+' · transfer group '+this.nodes[this.player.pos].transferGroup+': '+TAXIS[taxi].name+'; D and first bonus unchanged');return true;}
 deliver(){const s=this.state,p=this.player,j=p.job,amount=j?.initialTaxi?j.shortest*5+j.bonus+j.rewards:null;if(amount==null)return false;p.bonusRolls=0;p.coins+=amount;p.trips++;s.receipt={...j,name:p.name,amount,taxi:p.taxi};p.job=null;s.remaining=0;s.phase='delivered';s.card=null;s.forceShortest=false;s.extraMove=false;this.log(p.name+' · delivered! +'+amount+' coins. Net balance '+p.coins);}
 next(){
  const s=this.state;if(s.paused||!['end','delivered'].includes(s.phase))return false;
  if(s.closing&&!s.players.some(p=>p.job)){s.phase='finished';return true;}
  let next=s.current;
  for(let i=0;i<s.players.length;i++){next=(next+1)%s.players.length;if(!s.closing||s.players[next].job)break;}
  s.current=next;s.turn++;s.turnRollUsed=false;s.card=null;s.dice=null;s.remaining=0;s.forceShortest=false;s.extraMove=false;s.transferResume=null;
  if(!this.player.job){this.newOrder();return true;}
  s.phase=!this.player.job.initialTaxi?'draw':this.player.bonusRolls&&!s.closing?'bonusroll':'roll';
  if(s.closing&&this.needsTransfer()){s.transferResume='roll';s.phase='transfer';}
  this.focusView();
  this.log(this.player.name+' · next dice turn; existing order and point '+this.point(this.player.pos)+' retained');return true;
 }

 tick(seconds){const s=this.state;if(!s||s.paused||s.phase==='finished')return false;s.elapsed+=seconds;if(s.elapsed<s.limit||s.closing)return false;
  s.closing=true;this.log(Math.round(s.limit/60)+'-minute shift ended. No new orders or cards; each driver finishes their existing order by a shortest legal route.');
  for(const p of s.players)if(p.job&&!p.job.initialTaxi){p.job=null;p.taxi=null;p.bonusRolls=0;this.log(p.name+' · no taxi drawn before time-up; unstarted order closed without fare.');}
  if(!this.player.job){const receiptPending=s.phase==='delivered';if(!receiptPending){if(s.players.some(p=>p.job)){s.phase='end';this.next();}else s.phase='finished';}}
  else if(s.phase==='card'&&!s.card){s.phase=this.needsTransfer()?'transfer':'end';}
  else if(s.phase==='move'&&this.needsTransfer()){s.transferResume='move';s.phase='transfer';}
  else if(s.phase==='eventmove'){s.phase='end';s.remaining=0;s.forceShortest=false;}
  else if(s.phase==='end'&&this.needsTransfer())s.phase='transfer';
  return true;
 }
 hint(){const p=this.player;return p.job?this.shortest(p.pos,p.job.to,p.taxi,true):null;}
 rankings(){return [...this.state.players].sort((a,b)=>b.coins-a.coins||b.trips-a.trips);}
 restore(s){
  if(![6,7,8,9].includes(s?.version)||!Array.isArray(s.players)||!s.players.length||s.players.length>6||!s.players.every(p=>p.pos==null||this.nodes[p.pos])||!s.players[s.current])return false;
  const older=s.version<9;
  if(['zoom-park','zoom-position','overview'].includes(s.phase))s.phase=s.view?.resume||'roll';
  for(const p of s.players){p.heldPenalties??=[];p.bonusRolls??=0;if(p.job){p.job.rewardedOnce??=[];p.job.drawAttempts??=0;if(!p.job.initialTaxi)p.taxi=null;}}
  this.state=s;
  if(older){
   s.lastRoll=null;s.turnRollUsed=['move','eventmove','card','transfer','end','delivered'].includes(s.phase);
   if(s.phase==='bonusroll'){this.player.bonusRolls++;s.turnRollUsed=true;s.phase='end';}
   else if(s.phase==='fare'||(s.phase==='draw'&&s.dice!=null)||(s.phase==='roll'&&this.player.job?.rolls===0&&s.dice!=null)){s.turnRollUsed=true;s.phase='end';this.next();}
  }
  s.turnRollUsed??=false;s.version=9;this.focusView();return true;
 }
}
