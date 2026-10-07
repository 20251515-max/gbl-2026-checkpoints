/* Phaser 3 prototype: no build step required. */
const WIDTH = 900, HEIGHT = 600;
const towers = {
  pulse: { name: '펄스 포탑', desc: '가장 가까운 적에게 에너지 펄스를 발사합니다.', cost: 50, damage: 8, range: 120, cooldown: 550, color: 0x55f4ff },
  arc: { name: '아크 코일', desc: '주변의 적들에게 번개가 연쇄됩니다.', cost: 75, damage: 13, range: 145, cooldown: 850, color: 0xa981ff },
  nova: { name: '노바 캐논', desc: '느리지만 넓은 범위에 큰 피해를 줍니다.', cost: 100, damage: 28, range: 95, cooldown: 1250, color: 0xff896e }
};
let selectedType = 'pulse', sceneRef, energy = 120, wave = 1, health = 20, running = false;
const ui = id => document.getElementById(id);
function updateTop() { ui('energy').textContent = energy; ui('wave').textContent = `${wave} / 5`; ui('base-health').textContent = health; }
function chooseTower(type) { selectedType = type; const t = towers[type]; document.querySelectorAll('.tower-card').forEach(x => x.classList.toggle('selected', x.dataset.tower === type)); ui('selected-name').textContent = t.name; ui('selected-desc').textContent = t.desc; ui('stat-damage').textContent = t.damage; ui('stat-range').textContent = t.range; ui('stat-speed').textContent = `${(t.cooldown / 1000).toFixed(2)}s`; }
document.querySelectorAll('.tower-card').forEach(card => card.addEventListener('click', () => chooseTower(card.dataset.tower)));

class Battle extends Phaser.Scene {
  constructor() { super('Battle'); }
  create() {
    sceneRef = this; this.enemies = []; this.placed = []; this.spawnQueue = 0; this.lastSpawn = 0;
    this.path = [new Phaser.Math.Vector2(-20, 124), new Phaser.Math.Vector2(215, 124), new Phaser.Math.Vector2(215, 390), new Phaser.Math.Vector2(532, 390), new Phaser.Math.Vector2(532, 220), new Phaser.Math.Vector2(920, 220)];
    this.drawMap(); this.createPads(); this.input.on('gameobjectdown', (_, pad) => this.placeTower(pad));
    this.input.keyboard.on('keydown-R', () => startWave()); this.input.keyboard.on('keydown-ESC', () => chooseTower('pulse'));
  }
  drawMap() {
    const g = this.add.graphics(); g.fillStyle(0x081422); g.fillRect(0, 0, WIDTH, HEIGHT); g.lineStyle(1, 0x17344a, .7);
    for (let x = 0; x < WIDTH; x += 40) g.lineBetween(x, 0, x, HEIGHT); for (let y = 0; y < HEIGHT; y += 40) g.lineBetween(0, y, WIDTH, y);
    g.lineStyle(42, 0x102c42, 1); g.beginPath(); g.moveTo(this.path[0].x, this.path[0].y); this.path.slice(1).forEach(p => g.lineTo(p.x,p.y)); g.strokePath();
    g.lineStyle(2, 0x2b8ca0, .8); g.beginPath(); g.moveTo(this.path[0].x, this.path[0].y); this.path.slice(1).forEach(p => g.lineTo(p.x,p.y)); g.strokePath();
    this.add.text(20, 26, 'SECTOR 07  /  APPROACH VECTOR', { fontFamily: 'Orbitron', fontSize: '12px', color: '#6b9eb7' });
    this.add.text(767, 185, 'CORE', { fontFamily: 'Orbitron', fontSize: '12px', color: '#ff8292' });
    g.fillStyle(0x5b1c34); g.fillRect(860, 190, 35, 60); g.lineStyle(2, 0xff657e); g.strokeRect(860,190,35,60);
  }
  createPads() { [[95,235],[360,122],[390,295],[660,375],[700,125],[795,330],[110,475],[290,510]].forEach(([x,y]) => { const p=this.add.container(x,y); const g=this.add.graphics(); g.lineStyle(2,0x3c6b80,.85); g.strokeCircle(0,0,25); g.lineStyle(1,0x3c6b80,.45); g.strokeCircle(0,0,19); p.add(g); p.setSize(54,54).setInteractive({useHandCursor:true}); p.pad=true; }); }
  placeTower(pad) { if (pad.occupied || running && !selectedType) return; const data=towers[selectedType]; if (energy < data.cost) { this.flash('에너지가 부족합니다', '#ff8393'); return; } energy-=data.cost; updateTop(); pad.occupied=true; pad.disableInteractive(); const body=this.add.graphics(); body.fillStyle(0x0c1f31); body.fillCircle(pad.x,pad.y,20); body.lineStyle(2,data.color); body.strokeCircle(pad.x,pad.y,20); body.fillStyle(data.color); body.fillCircle(pad.x,pad.y,9); const tower={x:pad.x,y:pad.y,data,last:0,body}; this.placed.push(tower); this.tweens.add({targets:body, alpha:{from:.25,to:1}, duration:240}); }
  flash(message, color='#8fffff') { const tx=this.add.text(WIDTH/2,65,message,{fontFamily:'Orbitron',fontSize:'16px',color}).setOrigin(.5); this.tweens.add({targets:tx,y:45,alpha:0,duration:900,onComplete:()=>tx.destroy()}); }
  launchWave() { running=true; this.spawnQueue=7 + wave * 2; this.lastSpawn=0; ui('game-state').textContent='적 접근 중'; ui('start-wave').disabled=true; }
  spawnEnemy() { const s=this.add.container(this.path[0].x,this.path[0].y); const g=this.add.graphics(); g.fillStyle(0xdb4567); g.fillTriangle(-13,0,0,-10,13,0,0,10); g.lineStyle(1,0xffb2bc); g.strokeTriangle(-13,0,0,-10,13,0,0,10); s.add(g); this.enemies.push({sprite:s,point:0,hp:22 + wave*5,maxHp:22+wave*5,speed:52+wave*3,dead:false}); }
  update(time, delta) { if (running && this.spawnQueue && time-this.lastSpawn > 700) { this.spawnEnemy(); this.spawnQueue--; this.lastSpawn=time; }
    this.enemies.slice().forEach(e=>this.moveEnemy(e,delta)); this.placed.forEach(t=>this.fireTower(t,time));
    if (running && !this.spawnQueue && !this.enemies.length) { running=false; energy+=35; wave++; updateTop(); ui('game-state').textContent=wave>5?'승리':'파동 대기'; const b=ui('start-wave'); b.disabled=wave>5; b.innerHTML=wave>5?'모든 구역 방어 완료':`WAVE ${String(wave).padStart(2,'0')} 시작 <span>›</span>`; }
  }
  moveEnemy(e, delta) { if(e.dead)return; const target=this.path[e.point+1]; if(!target){ e.sprite.destroy(); this.enemies=this.enemies.filter(x=>x!==e); health=Math.max(0,health-1); updateTop(); return; } const d=Phaser.Math.Distance.Between(e.sprite.x,e.sprite.y,target.x,target.y); const step=e.speed*delta/1000; if(d<=step){e.sprite.setPosition(target.x,target.y);e.point++;} else {e.sprite.x+=(target.x-e.sprite.x)/d*step;e.sprite.y+=(target.y-e.sprite.y)/d*step;} }
  fireTower(t,time) { if(time-t.last<t.data.cooldown)return; const enemy=this.enemies.filter(e=>!e.dead).sort((a,b)=>Phaser.Math.Distance.Between(t.x,t.y,a.sprite.x,a.sprite.y)-Phaser.Math.Distance.Between(t.x,t.y,b.sprite.x,b.sprite.y))[0]; if(!enemy || Phaser.Math.Distance.Between(t.x,t.y,enemy.sprite.x,enemy.sprite.y)>t.data.range)return; t.last=time; const beam=this.add.graphics(); beam.lineStyle(2,t.data.color,.95); beam.lineBetween(t.x,t.y,enemy.sprite.x,enemy.sprite.y); this.tweens.add({targets:beam,alpha:0,duration:105,onComplete:()=>beam.destroy()}); enemy.hp-=t.data.damage; if(enemy.hp<=0){enemy.dead=true; this.tweens.add({targets:enemy.sprite,scale:1.8,alpha:0,duration:180,onComplete:()=>{enemy.sprite.destroy();this.enemies=this.enemies.filter(x=>x!==enemy);energy+=5;updateTop();}});} }
}
function startWave() { if(sceneRef && !running && wave<=5) sceneRef.launchWave(); }
ui('start-wave').addEventListener('click',startWave); updateTop();
new Phaser.Game({ type: Phaser.AUTO, parent:'game', width:WIDTH, height:HEIGHT, backgroundColor:'#07101c', scene:Battle, scale:{ mode:Phaser.Scale.FIT, autoCenter:Phaser.Scale.CENTER_BOTH }, render:{ antialias:true } });
