const test = require('node:test');
const assert = require('node:assert/strict');
const C = require('../src/simulation.js');

function active(options = {}) {
  const match = C.createMatch(options);
  for (let i = 0; i < 150; i++) C.stepMatch(match);
  assert.equal(match.phase, 'playing');
  return match;
}
function disableBot(match) {
  for (const fighter of match.fighters.slice(1)) {
    fighter.ai.nextDecision = 100000;
    fighter.ai.intent = C.inputFrame();
  }
}
function run(match, ticks, input = C.EMPTY_INPUT) {
  for (let i = 0; i < ticks; i++) C.stepMatch(match, input);
}

test('invalid choices normalize and the countdown excludes combat time', () => {
  const match = active({hero:'bad', difficulty:'bad', mode:'bad', arena:'bad'});
  assert.equal(match.hero,'david'); assert.equal(match.difficulty,'easy');
  assert.equal(match.mode,'duel'); assert.equal(match.remainingTicks,18000);
  assert.equal(match.tick,0);
});
test('pause freezes all gameplay and resume restores countdown or play', () => {
  const match=C.createMatch(); C.stepMatch(match); C.setPaused(match,true);
  const before=JSON.stringify(match);
  run(match,120,{x:1,light:true});
  assert.equal(JSON.stringify(match),before);
  C.setPaused(match,false); assert.equal(match.phase,'countdown');
  run(match,149); assert.equal(match.phase,'playing');
  C.setPaused(match,true);run(match,50);C.setPaused(match,false);
  assert.equal(match.phase,'playing');assert.equal(match.tick,0);
});
test('movement and air jumps use resources and land with a reset', () => {
  const match=active();disableBot(match);const player=match.fighters[0];
  run(match,20,{x:1});assert.ok(player.x>450);
  C.stepMatch(match,{jump:true,jumpHeld:true});assert.equal(player.airJumps,2);
  C.stepMatch(match,{jump:true,jumpHeld:true});assert.equal(player.airJumps,1);
  C.stepMatch(match,{jump:true,jumpHeld:true});assert.equal(player.airJumps,0);
  const vy=player.vy;C.stepMatch(match,{jump:true,jumpHeld:true});assert.ok(player.vy>vy);
  run(match,160);assert.equal(player.onGround,true);assert.equal(player.airJumps,2);
});
test('a recovery costs once and retains upward momentum without a held jump', () => {
  const match=active();disableBot(match);const player=match.fighters[0];
  player.y=100;player.onGround=false;player.platform=null;
  C.stepMatch(match,{heavy:true});assert.equal(player.recoveryReady,false);
  run(match,9);assert.ok(player.vy < -9,'jump-cut must not truncate recovery');
  assert.equal(player.attack.kind,'recovery');
});
test('melee contact deals damage once, projectile contact has a finite lifetime', () => {
  const match=active({hero:'samson'});disableBot(match);
  const [player,enemy]=match.fighters;player.x=600;enemy.x=680;
  C.stepMatch(match,{x:1,light:true});run(match,8);
  assert.ok(enemy.damage>0);assert.equal(match.playerHits,1);
  run(match,25);assert.equal(match.playerHits,1);
  const ranged=active();disableBot(ranged);ranged.fighters[0].x=400;ranged.fighters[1].x=650;
  C.stepMatch(ranged,{x:1,light:true});run(ranged,32);
  assert.ok(ranged.fighters[1].damage>0);run(ranged,80);assert.equal(ranged.projectiles.length,0);
});
test('dodge and spawn immunity prevent contact, voluntary attack removes spawn protection', () => {
  const match=active({hero:'samson'});disableBot(match);
  const [player,enemy]=match.fighters;player.x=600;enemy.x=680;
  enemy.invincible=100;C.stepMatch(match,{x:1,light:true});run(match,8);
  assert.equal(enemy.damage,0);
  run(match,25);enemy.invincible=0;enemy.dodge=14;
  C.startAttack(match,player,false,{x:1,y:0});player.attack.frame=6;
  C.stepMatch(match);assert.equal(enemy.damage,0);
  run(match,35);player.invincible=100;C.stepMatch(match,{light:true});assert.equal(player.invincible,0);
});
test('throw unarms and a neutral crate supplies the next weapon only in range', () => {
  const match=active();disableBot(match);const player=match.fighters[0];
  C.stepMatch(match,{item:true});assert.equal(C.weaponName(player),'Unarmed');
  run(match,30);C.stepMatch(match,{item:true});assert.equal(player.weaponIndex,-1);
  player.x=640;C.stepMatch(match,{item:true});assert.equal(C.weaponName(player),'Sword');
  assert.equal(match.pickup,null);run(match,180);assert.ok(match.pickup);
});
test('ring-out removes one life and respawns with reset damage', () => {
  const match=active();disableBot(match);const player=match.fighters[0];
  player.damage=85;player.x=-200;C.stepMatch(match);
  assert.equal(player.stocks,2);assert.equal(player.respawn,70);
  run(match,70);assert.equal(player.damage,0);assert.equal(player.invincible,100);
  assert.equal(player.stocks,2);
});
test('all three waves clear finite groups and award a real result', () => {
  const match=active({mode:'waves'});assert.equal(match.fighters.length,3);
  let enemies=0;
  for(let wave=1;wave<=3;wave++) {
    assert.equal(match.wave,wave);
    for(const fighter of match.fighters.slice(1)){C.knockOut(match,fighter);enemies++;}
    run(match,101);
  }
  assert.equal(enemies,7);assert.equal(match.phase,'result');assert.equal(match.result.won,true);
});
test('boss has one large opponent and result responds to guard depletion', () => {
  const match=active({mode:'boss'});assert.equal(match.fighters.length,2);
  const boss=match.fighters[1];assert.ok(boss.scale>1);assert.equal(boss.stocks,1);
  boss.guardMeter=0;C.stepMatch(match);assert.equal(match.result.won,true);
});
test('last player life loses, duel timeout prioritizes lives, other encounters time out', () => {
  const loss=active();C.knockOut(loss,loss.fighters[0]);
  loss.fighters[0].respawn=0;C.knockOut(loss,loss.fighters[0]);
  loss.fighters[0].respawn=0;C.knockOut(loss,loss.fighters[0]);
  C.stepMatch(loss);assert.equal(loss.result.won,false);
  const timer=active();disableBot(timer);timer.fighters[1].stocks=1;timer.fighters[0].damage=200;timer.remainingTicks=1;
  C.stepMatch(timer);assert.equal(timer.result.won,true);
  const boss=active({mode:'boss'});boss.remainingTicks=1;C.stepMatch(boss);assert.equal(boss.result.won,false);
});
test('difficulty preserves fighter stats and seeded bot/input matches replay identically', () => {
  for(const difficulty of Object.keys(C.DIFFICULTIES)) {
    const match=active({difficulty});assert.equal(match.fighters[0].width,38);
    assert.equal(match.fighters[1].guardMeter,null);
    const second=active({difficulty});
    for(let tick=0;tick<1200;tick++) {
      const input={x:tick%300<150?1:-1,light:tick%35===0,heavy:tick%71===0,jump:tick%120===0,jumpHeld:tick%120<14,dodge:tick%85===0};
      C.stepMatch(match,input);C.stepMatch(second,input);
    }
    assert.equal(JSON.stringify(match),JSON.stringify(second));
    for(const fighter of match.fighters)assert.ok(Number.isFinite(fighter.x)&&Number.isFinite(fighter.y));
    assert.ok(match.fighters[0].damage>0 || match.fighters[1].damage>0,'computer combat must occur');
  }
});
