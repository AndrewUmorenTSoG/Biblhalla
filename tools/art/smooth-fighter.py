"""Bake animation inbetweens from registered fighter key art. Run once per fighter."""
import hashlib
import json
import math
from pathlib import Path
import sys
from PIL import Image, ImageDraw

hero = sys.argv[1]
manifest = Path("assets/runtime/fighters/fighters.json")
roster = json.loads(manifest.read_text())
entry = roster[hero]
if entry.get("smoothAnimation"):
    raise SystemExit(f"{hero} already packed")
frames = entry["frames"]
clips = entry["clips"]
old_clips = json.loads(json.dumps(clips))
atlas = Image.open(entry["image"]).convert("RGBA")
images = {k: atlas.crop((f["x"], f["y"], f["x"]+f["w"], f["y"]+f["h"])) for k,f in frames.items()}
moves = {m["id"]: m for m in json.loads(Path("production-pack/09_Data/attacks.json").read_text())["attacks"]}
weapons = next(f["weaponPair"] for f in json.loads(Path("production-pack/09_Data/fighters.json").read_text())["fighters"] if f["id"]==hero)

def pose(source, name, lean=0, lift=0, stretch=0, smear=False):
    if name in frames:
        return name
    base = images[source]
    f = frames[source]
    pad = 28
    w,h = base.size
    # The lower leg stays registered. The torso shifts and the leading arm
    # stretches progressively farther toward the tip during the swing.
    def sample(x,y):
        x,y=x-pad,y-pad
        weight = min(1,max(0,(h-y-12)/(h*.65)))
        reach = max(0,x-f["pivotX"])/(max(1,w-f["pivotX"]))
        return x-weight*(lean+stretch*reach), y+weight*lift
    mesh=[]
    for y in range(0,h+pad,12):
        for x in range(0,w+2*pad,12):
            r,b=min(x+12,w+2*pad),min(y+12,h+pad)
            mesh.append(((x,y,r,b),sum((sample(i,j) for i,j in ((x,y),(x,b),(r,b),(r,y))),())))
    im=base.transform((w+pad*2,h+pad),Image.Transform.MESH,mesh,Image.Resampling.BICUBIC)
    if smear:
        # Short tapered exposure on the leading silhouette, behind the solid pose.
        trail=Image.new("RGBA",im.size)
        for offset,opacity in ((-7,.15),(-4,.28)):
            ghost=im.copy()
            mask=ghost.getchannel("A").point(lambda a: round(a*opacity))
            mask.paste(0,(0,0,min(im.width,f["pivotX"]+pad+8),im.height))
            ghost.putalpha(mask);trail.alpha_composite(ghost,(offset,0))
        trail.alpha_composite(im);im=trail
    box=im.getbbox()
    if not box: raise ValueError(source)
    images[name]=im.crop(box)
    frames[name]={**f,"w":box[2]-box[0],"h":box[3]-box[1],"pivotX":f["pivotX"]+pad-box[0],"pivotY":f["pivotY"]+pad-box[1]}
    if "gripX" in f:
        weight=min(1,max(0,(h-f["gripY"]-12)/(h*.65)))
        frames[name].update(gripX=round(f["gripX"]+pad-box[0]+lean*weight),gripY=round(f["gripY"]+pad-box[1]-lift*weight))
    return name

def idle(w): return f"equipped_{w}_idle_0"
def spread(length,n): return [(i+1)*length//n-i*length//n for i in range(n)]
def sample_clip(c,t):
    for name,duration in zip(c["frames"],c["ticks"]):
        if t<duration:return name
        t-=duration
    return c["frames"][-1]

for w in ["unarmed",*weapons]:
    src="motion_idle" if w=="unarmed" else f"equipped_{w}_0"
    for i in range(12):
        t=i*math.pi/6
        pose(src,f"equipped_{w}_idle_{i}",1.8*math.sin(t),1.6*(1-math.cos(t)),1.2*math.sin(t-.6))
    for i,(lean,lift) in enumerate([(0,0),(-2,-2),(-5,-4),(4,-6),(8,-6),(5,-4),(2,-2),(0,0)]):
        src=(["defence_8","defence_8","defence_9","defence_10","defence_10","defence_11","defence_11","motion_idle"][i] if w=="unarmed" else f"equipped_{w}_{[0,2,2,3,3,11,11,0][i]}")
        pose(src,f"equipped_{w}_dodge_{i}",lean,lift)
    for state,indices in [("land",[10,11,11]),("air_rise",[11,8,8]),("turn",[3,2,0])]:
        for i,index in enumerate(indices):
            src=("land" if state=="land" else "air_rise" if state=="air_rise" else "motion_idle") if w=="unarmed" else f"equipped_{w}_{index}"
            pose(src,f"equipped_{w}_{state}_{i}",[-3,2,0][i],[-3,-1,0][i])
clips["idle"]={"frames":[f"equipped_unarmed_idle_{i}" for i in range(12)],"ticks":[3]*12,"loop":True}
clips["dodge"]={"frames":[f"equipped_unarmed_dodge_{i}" for i in range(8)],"ticks":[2]*7+[3],"loop":False}
hits=["defence_13"]+[pose("defence_13" if i<4 else "defence_14",f"defence_hit_{i}",lean,lift) for i,(lean,lift) in enumerate([(-8,2),(-12,4),(-9,5),(-6,4),(-4,2),(-2,1)],1)]+["defence_14"]
clips["hitstun"]={"frames":hits,"ticks":[2]*len(hits),"loop":False}

for name,move in moves.items():
    if name not in clips:continue
    old=old_clips[name];start,active,recovery=(move[k] for k in ("startup","active","recovery"))
    weapon=next((w for w in weapons if w in name.split("_")),"unarmed")
    rest=idle(weapon)
    first=sample_clip(old,0);wind=sample_clip(old,start-1);contact=sample_clip(old,start)
    follow=sample_clip(old,start+active)
    n=max(4,math.ceil(start/3))
    nt=spread(start,n)
    keys=[]
    for i in range(n):
        frac=i/(n-1)
        src=sample_clip(old,min(start-1,sum(nt[:i])))
        if i==n-1: key=pose(contact,"attack_smear_"+contact,-7,-1,11,True)
        elif i==0:key=first
        else:
            level=round(8*frac)
            key=pose(src,f"attack_wind_{src}_{level}",-level*.95,-level*.4)
        keys.append(key)
    # Retain every authored contact transition, including multi-hit rotations.
    tick=start
    while tick<start+active:
        key=sample_clip(old,tick);end=tick+1
        while end<start+active and sample_clip(old,end)==key:end+=1
        keys.append(key);nt.append(end-tick);tick=end
    n=max(6,math.ceil(recovery/3))
    for i in range(n):
        frac=i/(n-1);level=round(frac*16)
        if i==n-1:key=rest
        elif frac<.5:key=pose(follow,f"attack_follow_{follow}_{level}",8-12*frac,-3+5*frac,5-8*frac)
        else:key=pose(rest,f"equipped_settle_{weapon}_{level}",8*(1-frac),-7*(1-frac))
        keys.append(key)
    nt+=spread(recovery,n)
    assert len(set(keys))>=10 and sum(nt)==move["totalTicks"],name
    clips[name]={"frames":keys,"ticks":nt,"loop":False}

# Scale all authored coordinates together. Gameplay presents the body at 96 px.
def layout(body):
    scale=body/160
    x=y=2;row=0;places={}
    for name,im in sorted(images.items(),key=lambda pair:-pair[1].height):
        w,h=[max(1,round(n*scale)) for n in im.size]
        if x+w+2>2048:x=2;y+=row+3;row=0
        places[name]=(x,y,w,h);x+=w+3;row=max(row,h)
    return places,y+row+2
body=116
while True:
    places,height=layout(body)
    if height<=2048:break
    body-=1
sheet=Image.new("RGBA",(2048,height))
for name,(x,y,w,h) in places.items():
    im=images[name];f=frames[name]
    sheet.paste(im.resize((w,h),Image.Resampling.LANCZOS),(x,y))
    for coord,ratio in [("pivotX",w/im.width),("gripX",w/im.width),("pivotY",h/im.height),("gripY",h/im.height)]:
        if coord in f:
            old=f[coord];f[coord]=round(old*ratio)
            if coord=="pivotY" and old>im.height:f[coord]=max(h+1,f[coord])
    f.update(x=x,y=y,w=w,h=h)
sheet.quantize(256,method=Image.Quantize.FASTOCTREE).save(entry["image"],optimize=True)
raw=Path(entry["image"]).read_bytes()
entry.update(smoothAnimation=1,sha256=hashlib.sha256(raw).hexdigest(),packing=dict(width=2048,height=height,bodyPixels=body,bytes=len(raw)))
manifest.write_text(json.dumps(roster,ensure_ascii=False,indent=2)+"\n",encoding="utf-8")
print(hero,body,height,len(raw),flush=True)
