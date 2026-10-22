from pathlib import Path
import json,math
from collections import deque,Counter
from PIL import Image,ImageDraw
D=Path('/workspace/scratch/49d5cc24f195')
nodes=[n for n in json.loads((D/'detected-nodes.json').read_text()) if n['type']!='yellow']
nodes += [dict(x=486,y=358,type='normal'),dict(x=735,y=512,type='normal')]
stops=[
 ('Hong Kong International Airport','香港國際機場',423,262,'islands'),('Tai O','大澳',486,358,'islands'),('HZMB Hong Kong Port','港珠澳大橋香港口岸',567,262,'islands'),('Tung Chung','東涌',727,262,'islands'),('Cheung Sha Beach','長沙海灘',454,534,'islands'),('Ngong Ping · Tian Tan Buddha','昂坪 · 天壇大佛',525,434,'islands'),('Po Lin Monastery','寶蓮禪寺',607,434,'islands'),('Mui Wo','梅窩',677,534,'islands'),('Hong Kong Disneyland','香港迪士尼樂園',633,657,'islands'),
 ('Lok Ma Chau','落馬洲',792,131,'nt'),('Huanggang Port','皇崗口岸',1032,44,'nt'),('Lo Wu','羅湖',1250,131,'nt'),('Tin Shui Wai','天水圍',858,261,'nt'),('Yuen Long','元朗',966,261,'nt'),('Lam Tsuen','林村',1075,261,'nt'),('Fanling','粉嶺',1206,261,'nt'),('Kam Tin','錦田',901,391,'nt'),('Sha Tin','沙田',989,457,'nt'),('Ma On Shan','馬鞍山',1075,457,'nt'),('Tai Po','大埔',1184,391,'nt'),('Tsuen Wan','荃灣',901,521,'nt'),('Sai Kung','西貢',1163,521,'nt'),
 ('Sham Shui Po','深水埗',856,729,'kowloon'),('Prince Edward','太子',944,729,'kowloon'),('Yau Ma Tei','油麻地',988,729,'kowloon'),('Wong Tai Sin','黃大仙',1075,729,'kowloon'),('Diamond Hill','鑽石山',1119,729,'kowloon'),('Kowloon City','九龍城',1206,729,'kowloon'),('Cheung Sha Wan','長沙灣',506,848,'kowloon'),('Nathan Road','彌敦道',724,848,'kowloon'),('Jordan','佐敦',901,848,'kowloon'),('Tsim Sha Tsui','尖沙咀',988,918,'kowloon'),('Hung Hom','紅磡',1075,918,'kowloon'),('Kai Tak','啟德',1185,848,'kowloon'),('Olympic City','奧海城',506,970,'kowloon'),('Hong Kong Palace Museum','香港故宮文化博物館',724,970,'kowloon'),('West Kowloon · M+','西九龍 · M+',901,970,'kowloon'),('Kwun Tong','觀塘',1185,970,'kowloon'),
 ('Kennedy Town','堅尼地城',856,1253,'hk'),('Sheung Wan','上環',944,1253,'hk'),('Central','中環',988,1253,'hk'),('Admiralty','金鐘',1075,1253,'hk'),('Wan Chai','灣仔',1119,1253,'hk'),('Causeway Bay','銅鑼灣',1206,1253,'hk'),('Digital Harbor','數碼港',518,1381,'hk'),("St. Mary’s Hospital",'聖瑪麗醫院',729,1381,'hk'),('North Point','北角',1227,1338,'hk'),('Shau Kei Wan','筲箕灣',1227,1423,'hk'),('Victoria Peak','太平山頂',1031,1423,'hk'),('Wah Fu Estate','華富邨',518,1510,'hk'),('Tin Wan Estate','田灣邨',729,1510,'hk'),('Aberdeen','香港仔',901,1510,'hk'),('Ocean Park','海洋公園',1031,1510,'hk'),('Stanley','赤柱',1161,1510,'hk')]
# Yellow dots are connected to the landmark labels in the artwork; restore their road centres.
for en,zh,x,y,reg in stops:
 nodes=[n for n in nodes if math.hypot(n['x']-x,n['y']-y)>10]
 nodes.append(dict(x=x,y=y,type='yellow',name=en,zh=zh,region=reg))
def connect(ns):
 adj=[[] for _ in ns]
 for i,a in enumerate(ns):
  for j in range(i):
   b=ns[j]; dx=abs(a['x']-b['x']);dy=abs(a['y']-b['y']);d=math.hypot(dx,dy)
   if 6<d<27 and (dx<7 or dy<7 or d<23 or (710<a['x']<760 and 710<b['x']<760 and 480<a['y']<540 and 480<b['y']<540)):adj[i].append(j);adj[j].append(i)
 # The painted red-to-green bend east of Mui Wo is 23.17 units apart.
 # Restore this reviewed edge explicitly; widening the global threshold could join unrelated roads.
 for start,end in [((699,534),(720,525))]:
  a=min(range(len(ns)),key=lambda i:math.hypot(ns[i]['x']-start[0],ns[i]['y']-start[1]))
  b=min(range(len(ns)),key=lambda i:math.hypot(ns[i]['x']-end[0],ns[i]['y']-end[1]))
  assert math.hypot(ns[a]['x']-start[0],ns[a]['y']-start[1])<2
  assert math.hypot(ns[b]['x']-end[0],ns[b]['y']-end[1])<2
  if b not in adj[a]:adj[a].append(b)
  if a not in adj[b]:adj[b].append(a)
 return adj
def components(adj):
 seen=set();comps=[]
 for i in range(len(adj)):
  if i in seen:continue
  q=[i];seen.add(i);c=[]
  while q:
   u=q.pop();c.append(u)
   for v in adj[u]:
    if v not in seen:seen.add(v);q.append(v)
  comps.append(c)
 return sorted(comps,key=len,reverse=True)
adj=connect(nodes); comps=components(adj)
print('Components before:',[len(c) for c in comps])
for c in comps:
 if len(c)<4: print('small',[(round(nodes[i]['x']),round(nodes[i]['y']),nodes[i].get('name','')) for i in c])
# Only retain circles belonging to the drawn road network.
keep=comps[0];nodes=[nodes[i] for i in keep];nodes.sort(key=lambda n:(n['y'],n['x']));adj=connect(nodes)
for i,n in enumerate(nodes):
 n['id']=i;n['adj']=adj[i]
 if 'region' not in n:
  x,y=n['x'],n['y']
  n['region']='islands' if (x<776 and y<700) else 'nt' if y<718 else 'hk' if y>=1242 else 'kowloon'
 if 'name' not in n:
  near=min(stops,key=lambda s:math.hypot(s[2]-n['x'],s[3]-n['y']))
  n['near']=near[0];n['nearZh']=near[1]
 (n['x'],n['y'])=(round(n['x'],2),round(n['y'],2))
seen_groups=set();group=0
for n in nodes:
 if n['type']!='transfer' or n['id'] in seen_groups:continue
 group+=1;q=[n['id']];seen_groups.add(n['id'])
 while q:
  u=q.pop();nodes[u]['transferGroup']=group
  for v in nodes[u]['adj']:
   if nodes[v]['type']=='transfer' and v not in seen_groups:seen_groups.add(v);q.append(v)
Path('dist/assets/board.json').write_text(json.dumps(nodes,ensure_ascii=False,separators=(',',':')))
print('Final',len(nodes),'stops',sum(n['type']=='yellow' for n in nodes),'degree',dict(Counter(len(a) for a in adj)))
start=next(n['id'] for n in nodes if n.get('name')=='Hong Kong International Airport');end=next(n['id'] for n in nodes if n.get('name')=='Tung Chung')
q=deque([(start,0)]);seen={start}
while q:
 u,d=q.popleft()
 if u==end: print('Airport to Tung Chung shortest:',d);break
 for v in adj[u]:
  if v not in seen:seen.add(v);q.append((v,d+1))
im=Image.open(D/'map-1600.png');draw=ImageDraw.Draw(im)
for n in nodes:
 x,y=n['x'],n['y']
 for v in n['adj']:
  b=nodes[v];draw.line((x,y,b['x'],b['y']),fill='#005d45',width=2)
 draw.ellipse((x-4,y-4,x+4,y+4),fill='yellow' if n['type']=='yellow' else 'white')
 if len(n['adj'])<2:draw.text((x+5,y),str(n['id']),fill='black')
im.save(D/'graph-final.jpg')
