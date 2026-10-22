const GRAPH_SIZE=1600,NS='http://www.w3.org/2000/svg';
let source=null,sourceRequest=null;
const liveTiles=new Map();
const $=selector=>document.querySelector(selector);

export function loadNativeMap(){
 return sourceRequest??=(async()=>{
  const response=await fetch('assets/map-source.json');
  if(!response.ok)throw Error('High-resolution map metadata unavailable');
  source=await response.json();
  if(source.width!==7680||source.height!==7680||!source.tiles?.length)throw Error('Invalid original map dimensions');
  return source;
 })();
}

function intersects(tile,box){return tile.x<box.x+box.width&&tile.x+tile.width>box.x&&tile.y<box.y+box.height&&tile.y+tile.height>box.y;}

export function renderNativeMap(view,viewportHeight){
 if(!source)return;
 const layer=$('#map-detail-layer'),ratio=source.width/GRAPH_SIZE;
 const detail=viewportHeight/view.h*(window.devicePixelRatio||1)>.9*source.previewWidth/GRAPH_SIZE;
 const box={x:view.x*ratio,y:view.y*ratio,width:view.w*ratio,height:view.h*ratio};
 const visible=detail?source.tiles.filter(tile=>intersects(tile,box)):[],keep=new Set(visible.map(tile=>tile.id));
 for(const[id,image]of liveTiles)if(!keep.has(id)){image.remove();liveTiles.delete(id);}
 for(const tile of visible){
  if(liveTiles.has(tile.id))continue;
  const image=document.createElementNS(NS,'image');
  image.setAttribute('href',tile.src);image.setAttribute('x',tile.x/ratio);image.setAttribute('y',tile.y/ratio);
  image.setAttribute('width',tile.width/ratio);image.setAttribute('height',tile.height/ratio);
  image.setAttribute('data-native-tile',tile.id);image.setAttribute('preserveAspectRatio','none');
  layer.append(image);liveTiles.set(tile.id,image);
 }
}

export async function renderOriginalMap(body,focus={x:950,y:800}){
 if(!source){body.textContent='Loading the original map…';try{await loadNativeMap();}catch{body.textContent='The original map could not load. Please refresh and try again.';return;}}
 const {width,height}=source;
 body.innerHTML=`<div class="eyebrow">HIGH-RESOLUTION ORIGINAL · 原圖像素</div><h2>See the original detail.</h2><p class="dialog-lead">Your original map at <strong>${width} × ${height}</strong>, with every source pixel preserved. At 100%, one source pixel occupies one screen pixel. Drag to inspect the lettering.</p><div class="original-map-tools"><button id="original-fit">Fit view</button><button id="original-minus">−</button><button id="original-100">100% · Original size</button><button id="original-plus">+</button><span id="original-scale">100%</span><button id="download-native-map">Download ${width}px PNG ↧</button></div><div id="original-scroll" class="original-scroll"><div id="original-map-surface" role="img" aria-label="Original ${width} by ${height} Hong Kong map at native resolution"><img class="original-map-preview" src="${source.preview}" alt="" draggable="false"><div id="original-native-tiles" aria-hidden="true"></div></div></div>`;
 const area=$('#original-scroll'),surface=$('#original-map-surface'),layer=$('#original-native-tiles'),images=new Map();let scale=1;
 function render(){
  surface.style.width=width*scale+'px';surface.style.height=height*scale+'px';
  const detail=scale*(window.devicePixelRatio||1)>.9*source.previewWidth/width;
  const box={x:area.scrollLeft/scale,y:area.scrollTop/scale,width:area.clientWidth/scale,height:area.clientHeight/scale};
  const visible=detail?source.tiles.filter(tile=>intersects(tile,box)):[],keep=new Set(visible.map(tile=>tile.id));
  for(const[id,image]of images)if(!keep.has(id)){image.remove();images.delete(id);}
  for(const tile of visible){
   let image=images.get(tile.id);
   if(!image){image=new Image();image.src=tile.src;image.alt='';image.draggable=false;image.decoding='async';layer.append(image);images.set(tile.id,image);}
   Object.assign(image.style,{left:tile.x*scale+'px',top:tile.y*scale+'px',width:tile.width*scale+'px',height:tile.height*scale+'px'});
  }
 }
 function setScale(value){
  const x=(area.scrollLeft+area.clientWidth/2)/scale,y=(area.scrollTop+area.clientHeight/2)/scale;
  scale=Math.max(.03,Math.min(3,value));surface.style.width=width*scale+'px';surface.style.height=height*scale+'px';
  area.scrollLeft=x*scale-area.clientWidth/2;area.scrollTop=y*scale-area.clientHeight/2;
  $('#original-scale').textContent=Math.round(scale*100)+'%';render();
 }
 $('#original-fit').addEventListener('click',()=>setScale(Math.min(area.clientWidth/width,area.clientHeight/height)));
 $('#original-minus').addEventListener('click',()=>setScale(scale/1.25));$('#original-plus').addEventListener('click',()=>setScale(scale*1.25));$('#original-100').addEventListener('click',()=>setScale(1));
 area.addEventListener('scroll',render,{passive:true});
 const resize=new ResizeObserver(render);resize.observe(area);$('#content-dialog').addEventListener('close',()=>resize.disconnect(),{once:true});
 let pan=null;
 area.addEventListener('pointerdown',event=>{pan={x:event.clientX,y:event.clientY,left:area.scrollLeft,top:area.scrollTop};area.setPointerCapture(event.pointerId);area.classList.add('dragging');});
 area.addEventListener('pointermove',event=>{if(pan){area.scrollLeft=pan.left-(event.clientX-pan.x);area.scrollTop=pan.top-(event.clientY-pan.y);}});
 for(const type of ['pointerup','pointercancel'])area.addEventListener(type,()=>{pan=null;area.classList.remove('dragging');});
 $('#download-native-map').addEventListener('click',async event=>{
  const button=event.currentTarget,label=button.textContent;button.disabled=true;button.setAttribute('aria-busy','true');
  try{
   const canvas=document.createElement('canvas');canvas.width=width;canvas.height=height;
   const context=canvas.getContext('2d');if(!context)throw Error('PNG export unavailable');
   for(let i=0;i<source.tiles.length;i++){
    button.textContent=`Preparing PNG · ${Math.round(i/source.tiles.length*100)}%`;
    const tile=source.tiles[i],image=new Image();image.src=tile.src;await image.decode();const core=tile.core;
    context.drawImage(image,core.x-tile.x,core.y-tile.y,core.width,core.height,core.x,core.y,core.width,core.height);
   }
   const blob=await new Promise(resolve=>canvas.toBlob(resolve,'image/png'));if(!blob)throw Error('PNG export unavailable');
   const url=URL.createObjectURL(blob),link=document.createElement('a');link.href=url;link.download=`Hong_Kong_Map_Original_${width}.png`;link.click();setTimeout(()=>URL.revokeObjectURL(url),60000);
  }catch{button.textContent='Export failed · Try again';return;}
  finally{button.disabled=false;button.removeAttribute('aria-busy');}
  button.textContent=label;
 });
 requestAnimationFrame(()=>{render();area.scrollLeft=focus.x*width/GRAPH_SIZE-area.clientWidth/2;area.scrollTop=focus.y*height/GRAPH_SIZE-area.clientHeight/2;render();});
}
