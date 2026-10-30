#!/usr/bin/env python3
"""Validate the prompt pack/content contracts, not a playable game engine."""
import argparse
import hashlib
import json
import re
from pathlib import Path

parser=argparse.ArgumentParser()
parser.add_argument('--root',type=Path,default=Path(__file__).resolve().parents[2])
args=parser.parse_args();root=args.root.resolve()
checks=[];errors=[]
def require(ok,message):
    (checks if ok else errors).append(message)
def get(name):
    return json.loads((root/'09_Data'/name).read_text(encoding='utf-8'))

fighters=get('fighters.json')['fighters']
attacks=get('attacks.json')['attacks']
weapons=get('weapons.json')['weapons']
maps=get('maps.json')['maps']
physics=get('physics.json')
rules=get('rules.json')
assets=get('asset_manifest.json')['assets']
campaign=get('campaign.json')
aids={a['id'] for a in attacks};wids={w['id'] for w in weapons};fids={f['id'] for f in fighters}
require(len(fighters)==12 and len(fids)==12,'12 distinct fighters')
require(len(weapons)==9 and len(wids)==9,'Eight weapon families plus unarmed')
require(len(attacks)==147 and len(aids)==147,'147 distinct attack IDs')
require(sum(a['ownerType']=='fighter' for a in attacks)==72,'72 character signatures')
require(sum(a['ownerType']=='weapon' for a in attacks)==75,'75 shared/unarmed moves')
require(len(maps)==6 and len({m['id'] for m in maps})==6,'Six distinct arenas')
require(physics['tickRate']==60 and physics['fixedScale']==256,'60 Hz / Q8 physics contract')
require(rules.get('offlineOnly') is True and rules.get('requiresNetwork') is False and rules.get('requiresAccount') is False,'Fully offline rules')
require('network' not in rules and 'onlineMaxPlayers' not in rules,'No service-dependent rules')
require(rules['difficultyIds']==['easy','hard','extreme'],'Three requested difficulty IDs')
require(rules['storyLevelCount']==84 and rules['storyChapterCount']==14,'Story scope matches rules')
levels=campaign['levels']
require(campaign['offlineOnly'] is True,'Offline campaign')
require(len(levels)==84 and len(campaign['chapters'])==14,'84 levels / 14 chapters')
require([level['id'] for level in levels]==[f'L{i:03d}' for i in range(1,85)],'Stable sequential level IDs')
require(sum(level['kind']=='waves' for level in levels)==16,'16 multiple-opponent levels')
require(sum(level['kind']=='boss' for level in levels)==11,'11 single-boss levels')
for i,level in enumerate(levels):
    lid=level['id']
    require(level['previousLevel']==(f'L{i:03d}' if i else None),lid+': previous level')
    require(level['nextLevel']==(f'L{i+2:03d}' if i<83 else None),lid+': next level')
    require(level['unlockAfter']==level['previousLevel'],lid+': unlock order')
    require(level['chapter']==i//6+1,lid+': chapter order')
    require(bool(level['scripture']) and bool(level['objective']) and bool(level['uniqueRule']),lid+': source/objective/unique rule')
    require(level['requiresNetwork'] is False,lid+': no connection required')
    require(level['difficulties']==['easy','hard','extreme'],lid+': requested difficulty IDs')
    require((root/level['prompt']).is_file(),lid+': standalone prompt exists')
    require(level['implementationStatus']=='design_prompt_only',lid+': honest implementation status')
    require(level['combatEnabled']==(level['kind'] in ('waves','boss')),lid+': combat policy')
    if level['kind']=='waves':require(len(level['waves'])>=3 and all(len(w)>1 for w in level['waves']),lid+': multiple opponents and finite waves')
    if level['kind']=='boss':require(len(level['boss']['phases'])==3,lid+': three authored boss phases')
for chapter in campaign['chapters']:
    require(len(chapter['levels'])==6,chapter['id']+': six levels')
require(all(not level['combatEnabled'] for level in levels[-6:]),'Final six levels noncombat')
require('Matthew 28' in levels[-1]['scripture'] and 'John 20' in levels[-1]['scripture'],'Resurrection endpoint references')

for f in fighters:
    prefix=f['id']
    require(sum(f['stats'].values())==15 and all(1<=x<=9 for x in f['stats'].values()),prefix+': equal stat budget')
    require(len(f['weaponPair'])==2 and len(set(f['weaponPair']))==2 and set(f['weaponPair'])<=wids,prefix+': valid distinct weapon pair')
    require(len(f['signatureIds'])==6 and set(f['signatureIds'])<=aids,prefix+': six valid signatures')
    expected={(w,d) for w in f['weaponPair'] for d in ('neutral','side','down')}
    actual={(a['weapon'],a['input']['direction']) for a in attacks if a['ownerType']=='fighter' and a['ownerId']==prefix}
    require(expected==actual,prefix+': complete directional signature coverage')
    require((root/f['conceptImage']).is_file(),prefix+': concept image exists')
    require(f['animationStatus']=='not_created',prefix+': honest animation readiness')
for w in weapons:
    require(set(w['attackIds'])<=aids,w['id']+': attack references resolve')
    require(len(w['attackIds'])==(11 if w['id']=='unarmed' else 8),w['id']+': kit count')
for a in attacks:
    aid=a['id'];S=a['startup'];A=a['active'];R=a['recovery']
    require(all(isinstance(v,int) and v>0 for v in (S,A,R)) and a['totalTicks']==S+A+R,aid+': frame totals')
    require(isinstance(a['damageTenths'],int) and 0<a['damageTenths']<1000,aid+': bounded damage')
    require(str(a['launchAngle']) in physics['directionLookup'],aid+': deterministic launch vector')
    require(not a['invulnerability'],aid+': no hidden attack invulnerability')
    require(a['oneHitPerTarget'],aid+': single-hit ledger contract')
    if a['delivery']=='projectile':
        p=a['projectile']
        require(bool(p) and p['spawnTick']==S and not a['collisionPhases'],aid+': projectile-only collision source')
        require(p['maxHits']==1 and 0<p['lifetimeTicks']<=90 and p['capClass'] in ('light','signature'),aid+': bounded projectile')
        require(str(p['travelAngle']) in physics['directionLookup'],aid+': deterministic projectile vector')
    else:
        require(a['projectile'] is None and len(a['collisionPhases'])>0,aid+': melee phases present')
        for phase in a['collisionPhases']:
            rect=phase['rectUnits']
            require(S<=phase['firstTick']<phase['lastTickExclusive']<=S+A,aid+': phase inside active window')
            require(len(rect)==4 and rect[2]>0 and rect[3]>0 and all(isinstance(x,int) for x in rect),aid+': valid prototype rectangle')
    expected={'recovery':1} if a['ownerType']=='weapon' and a['id'].endswith('_recovery') else {}
    require(a['resourceCostOnActionStart']==expected,aid+': resource consumed once at start')
    require(all('consumeResource' not in e for e in a['motionEvents']),aid+': no duplicate resource event')

for m in maps:
    b=m['blastBoundsUnits'];x,y,w,h=m['main']['rectUnits']
    require(w>0 and h>0 and b['minX']<x<x+w<b['maxX'] and b['minY']<y-h<y<b['maxY'],m['id']+': main within blast bounds')
    require(m['competitiveApproved'] is False,m['id']+': competitive approval not fabricated')
    for p in m['platforms']:
        px,py,pw,ph=p['rectUnits']
        require(pw>0 and ph>0 and b['minX']<px<px+pw<b['maxX'] and y<py<b['maxY'],p['id']+': upper platform valid')
    for sx,sy in m['spawnFeetUnits']:
        require(x+20<sx<x+w-20 and sy>=y and sy+74<b['maxY'],m['id']+': safe authored spawn range')
    require((root/m['artReference']).is_file(),m['id']+': concept image exists')

require(len(assets)==18,'18 generated deliverable PNGs')
for a in assets:
    p=root/a['destination']
    require(p.is_file(),a['id']+': asset exists')
    if p.is_file():
        raw=p.read_bytes()
        require(raw[:8]==b'\x89PNG\r\n\x1a\n',a['id']+': PNG signature')
        require(hashlib.sha256(raw).hexdigest()==a['sha256'],a['id']+': SHA-256 matches manifest')
        require(p.stat().st_size==a['sizeBytes'],a['id']+': size matches manifest')
    require(a['readiness']=='concept_reference_only' and not a['runtimeAnimationCreated'],a['id']+': concept status accurate')
    require((root/a['prompt']).is_file(),a['id']+': original generation prompt exists')

link_count=0
for p in root.rglob('*.md'):
    text=p.read_text(encoding='utf-8')
    require(text.count('```')%2==0,str(p.relative_to(root))+': balanced fenced blocks')
    for target in re.findall(r'!?\[[^\]]*\]\(([^)]+)\)',text):
        if re.match(r'^(https?://|mailto:|#)',target):continue
        pathpart=target.split('#',1)[0]
        if not pathpart:continue
        link_count+=1
        require((p.parent/pathpart).resolve().exists(),str(p.relative_to(root))+': local link '+target)
htmlpath=root/'ART_GALLERY.html'
if htmlpath.is_file():
    text=htmlpath.read_text(encoding='utf-8')
    for target in re.findall(r'(?:href|src)="([^"]+)"',text):
        if not re.match(r'^(https?://|#)',target):
            require((root/target).exists(),'Gallery target '+target)
require(link_count>100,'Markdown references covered')

summary={'scope':'package/content consistency only, not engine/gameplay/device tests','passed_checks':len(checks),'failed_checks':len(errors),'markdown_links_checked':link_count,'fighters':len(fighters),'attacks':len(attacks),'maps':len(maps),'artwork':len(assets),'campaign_levels':len(levels),'chapters':len(campaign['chapters']),'offline_only':rules['offlineOnly'],'errors':errors}
print(json.dumps(summary,ensure_ascii=False,indent=2))
raise SystemExit(1 if errors else 0)
