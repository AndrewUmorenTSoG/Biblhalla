"""Build a side-by-side animation review from two revisions of the runtime art."""
import io,json,subprocess,sys
from pathlib import Path
from PIL import Image,ImageDraw

hero,revision=sys.argv[1:3]
manifest="assets/runtime/fighters/fighters.json"
def previous(path):
    return subprocess.check_output(["git","show",revision+":"+path])
old=json.loads(previous(manifest))[hero]
new=json.loads(Path(manifest).read_text())[hero]
weapons=next(f["weaponPair"] for f in json.loads(Path("production-pack/09_Data/fighters.json").read_text())["fighters"] if f["id"]==hero)
weapon=weapons[0]
stages=[("Idle","idle"),("Run","run"),("Light",weapon+"_nlight"),("Signature",hero+"_"+weapon+"_nsig"),("Hit reaction","hitstun")]
views=[(old,Image.open(io.BytesIO(previous(old["image"]))).convert("RGBA")),(new,Image.open(new["image"]).convert("RGBA"))]
sequence=[]
for tick in range(0,96,2):
    img=Image.new("RGB",(840,245),"#263540")
    draw=ImageDraw.Draw(img)
    for row,(entry,sheet) in enumerate(views):
        for col,(label,action) in enumerate(stages):
            clip=entry["clips"][action]
            scale=96/entry["frames"]["idle"]["h"]
            t=tick%sum(clip["ticks"])
            for key,dt in zip(clip["frames"],clip["ticks"]):
                if t<dt:break
                t-=dt
            if action=="idle":
                prefix="equipped_"+weapon+"_idle_"
                key=prefix+str(tick//3%12) if prefix+"0" in entry["frames"] else f"equipped_{weapon}_{tick//24%2}"
            if action=="run":key=f"gait_{weapon}_{tick//2%12}"
            f=entry["frames"][key]
            sprite=sheet.crop((f["x"],f["y"],f["x"]+f["w"],f["y"]+f["h"])).resize((round(f["w"]*scale),round(f["h"]*scale)),Image.Resampling.LANCZOS)
            img.paste(sprite,(95+col*158-round(f["pivotX"]*scale),126+row*113-round(f["pivotY"]*scale)),sprite)
            if not row:draw.text((76+col*158,3),label,fill="white")
        draw.text((3,75+row*113),["Before","After"][row],fill="white")
    sequence.append(img)
sequence[0].save(f"assets/animation-production/{hero}-motion-review.gif",save_all=True,append_images=sequence[1:],duration=[30,30,40]*16,loop=0)
