from pathlib import Path
from PIL import Image,ImageDraw
from scipy import ndimage
import numpy as np,json,shutil
SRC=Path('/workspace/scratch/49d5cc24f195/upload'); OUT=Path('/workspace/sites/hk-on-the-meter-play/dist/assets')
OUT.mkdir(parents=True,exist_ok=True)
for name,fn in [('meter','打卡机2(8).png'),('meter-side','打卡机1(3).png'),('screen','1(20261022-035521).png'),('screen-angle','2(20261022-035522).png'),('screen-controls','3(20261022-035522).png'),('table','HK_Taxi_Game_Hand_Edges_Fixed(1).png')]:
 im=Image.open(SRC/fn).convert('RGBA'); box=im.getchannel('A').getbbox(); im=im.crop(box)
 im.thumbnail((1600,1200)); im.save(OUT/(name+'.webp'),quality=90,method=6)
# Red and blue use reviewed transparent cutouts. Never erase dark foreground by RGB.
for col in ['red','blue']:
 cutout=OUT/f'taxi-{col}-cutout.png'
 if not cutout.exists():raise FileNotFoundError(f'Restore the reviewed transparent artwork: {cutout}')
with Image.open(SRC/'小车绿1(9).png') as source:
 im=source.convert('RGBA');box=im.getchannel('A').getbbox();im=im.crop(box)
 im.thumbnail((600,480));im.save(OUT/'taxi-green.webp',quality=94,method=6)
for col,fn in [('red','Red_Event_Cards_Transparent(2).png'),('green','Green_Event_Cards_Transparent(6).png')]:
 im=Image.open(SRC/fn)
 for i in range(11):
  row=i//4; column=i%4
  x=[29,317,603,891][column]; y=[89,479,870][row]
  card=im.crop((x,y,x+258,y+368));card.save(OUT/f'{col}-{i+1 if i<10 else "back"}.webp',lossless=True,method=4)
 im.save(OUT/(col+'-cards.webp'),quality=92)
rules=Image.open(SRC/'游戏规则.png');rules.save(OUT/'rules.webp',quality=95)
rules.crop((163,0,908,185)).save(OUT/'logo.png')
im=Image.open(SRC/'香港四区地图_7680_字体统一(10).png').convert('RGB'); im.save(OUT/'map.webp',lossless=True,method=4); im.resize((800,800)).save(OUT/'map-preview.webp',quality=90)
a=np.array(im.resize((1600,1600))).astype(float); nodes=[]
colors={'normal':(195,201,204),'red':(248,111,113),'green':(159,207,122),'transfer':(164,110,209),'yellow':(249,227,155)}
for typ,rgb in colors.items():
 mask=np.max(np.abs(a-np.array(rgb)),axis=2)<13
 lab,n=ndimage.label(mask)
 for idx,sl in enumerate(ndimage.find_objects(lab),1):
  if sl is None:continue
  h=sl[0].stop-sl[0].start;w=sl[1].stop-sl[1].start
  if not (7<=w<=18 and 7<=h<=22):continue
  reg=lab[sl]==idx; area=reg.sum()
  if area<40 or area/(w*h)<.4:continue
  cy,cx=ndimage.center_of_mass(reg);x=sl[1].start+cx;y=sl[0].start+cy
  nodes.append({'x':round(x,2),'y':round(y,2),'type':typ})
Path('/workspace/scratch/49d5cc24f195/detected-nodes.json').write_text(json.dumps(nodes))
preview=im.resize((1600,1600)); d=ImageDraw.Draw(preview)
for n in nodes:
 x,y=n['x'],n['y'];d.ellipse((x-7,y-7,x+7,y+7),outline='black',width=2)
preview.save('/workspace/scratch/49d5cc24f195/graph-detected.jpg')
print('Detected',len(nodes),'nodes', {k:sum(n['type']==k for n in nodes) for k in colors})

# Animate the original VACANT sign independently while preserving the device artwork.
meter=Image.open(OUT/'meter.webp').convert('RGBA');body=meter.copy();body.paste((0,0,0,0),(0,0,body.width,270));body.save(OUT/'meter-body.webp',lossless=True);meter.crop((270,0,720,270)).save(OUT/'meter-vacant.webp',lossless=True)

# Keep the recent upload byte for byte as an overview preview. Full 7680px detail
# is generated separately by prepare_native_map.py from the higher-resolution source.
shutil.copyfile(SRC/'香港四区地图_7680_字体统一(10).png',OUT/'map-original.png')
