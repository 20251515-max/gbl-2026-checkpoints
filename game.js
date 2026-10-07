/* Phaser 3 CDN prototype: no bundler required. Serve this directory with VS Code Live Server. */
const GAME_W = 1024, GAME_H = 576;
const state = { gold: 120, core: 20, wave: 1, waveActive: false, tower: 'archer' };
const towerData = {
  archer: { cost: 40, color: 0x67d5e8, range: 125, rate: 550, damage: 15, label: '궁수 탑' },
  cannon: { cost: 70, color: 0xffae56, range: 150, rate: 1200, damage: 38, label: '포격 탑' },
  frost: { cost: 55, color: 0xa8c9ff, range: 105, rate: 700, damage: 8, label: '빙결 탑' }
};
const pathPoints = [{x:-20,y:150},{x:230,y:150},{x:350,y:270},{x:610,y:270},{x:730,y:410},{x:1045,y:410}];
function syncHud() { document.querySelector('#gold-value').textContent = state.gold; document.querySelector('#core-value').textContent = state.core; document.querySelector('#wave-value').textContent = `${state.wave} / 5`; }

class BattleScene extends Phaser.Scene {
  constructor() { super('Battle'); }
  create() {
    this.towers = []; this.enemies = []; this.shots = []; this.spawned = 0; this.killed = 0;
    this.drawMap(); this.add.text(22, 20, '전투 준비', { fontFamily: 'Arial', fontSize: '18px', color: '#e8f6ff', fontStyle: 'bold' }).setDepth(3);
    this.status = this.add.text(22, 47, '빈 타일을 클릭해 타워를 배치하세요', { fontFamily: 'Arial', fontSize: '13px', color: '#a9c5d9' }).setDepth(3);
    this.input.on('pointerdown', p => this.placeTower(p.x, p.y));
    this.events.on('start-wave', () => this.startWave());
    this.time.addEvent({ delay: 1000, loop: true, callback: () => this.updateStatus() });
  }
  drawMap() {
    const g = this.add.graphics(); g.fillStyle(0x173954); g.fillRect(0,0,GAME_W,GAME_H);
    for (let x=0; x<GAME_W; x+=48) for (let y=0; y<GAME_H; y+=48) { g.fillStyle((x/48+y/48)%2 ? 0x1c4560 : 0x204b66, .45); g.fillRect(x+1,y+1,46,46); }
    g.lineStyle(46, 0x473a32, 1); g.beginPath(); g.moveTo(pathPoints[0].x,pathPoints[0].y); pathPoints.slice(1).forEach(p=>g.lineTo(p.x,p.y)); g.strokePath();
    g.lineStyle(34, 0xc59b67, 1); g.beginPath(); g.moveTo(pathPoints[0].x,pathPoints[0].y); pathPoints.slice(1).forEach(p=>g.lineTo(p.x,p.y)); g.strokePath();
    g.fillStyle(0x183141); g.fillCircle(956,410,53); g.lineStyle(4,0x79d7e8); g.strokeCircle(956,410,45); g.fillStyle(0x76dff0); g.fillTriangle(938,425,956,378,974,425);
    [[125,300],[250,445],[470,125],[510,440],[725,145],[850,290]].forEach(([x,y])=>{ g.fillStyle(0x254c60); g.fillCircle(x,y,24); g.lineStyle(2,0x4e8294); g.strokeCircle(x,y,24); });
  }
  placeTower(x,y) {
    if (!this.isBuildSpot(x,y)) { this.status.setText('표시된 원형 건설 지점에 배치하세요'); return; }
    if (this.towers.some(t => Phaser.Math.Distance.Between(t.x,t.y,x,y) < 38)) { this.status.setText('이미 타워가 있습니다'); return; }
    const d=towerData[state.tower]; if (state.gold < d.cost) { this.status.setText('골드가 부족합니다'); return; }
    state.gold -= d.cost; syncHud(); const tower={x,y,...d,nextShot:0};
    const base=this.add.circle(x,y,20,0x132634).setStrokeStyle(2,d.color); const gun=this.add.rectangle(x,y-7,8,25,d.color).setOrigin(.5,1); const icon=this.add.text(x,y+4,state.tower==='archer'?'⌁':state.tower==='cannon'?'✹':'❄',{fontSize:'16px',color:'#fff'}).setOrigin(.5);
    tower.parts=[base,gun,icon]; tower.gun=gun; this.towers.push(tower); this.status.setText(`${d.label} 배치 완료`);
  }
  isBuildSpot(x,y) { return [[125,300],[250,445],[470,125],[510,440],[725,145],[850,290]].some(([a,b])=>Phaser.Math.Distance.Between(a,b,x,y)<29); }
  startWave() { if(state.waveActive || state.wave>5) return; state.waveActive=true; this.spawned=0; this.killed=0; this.status.setText(`웨이브 ${state.wave} 진행 중`); const total=6+state.wave*2; this.spawner=this.time.addEvent({delay:650,repeat:total-1,callback:()=>this.spawnEnemy()}); }
  spawnEnemy() { const hp=42+state.wave*16; const e={hp,maxHp:hp,segment:0,progress:0,speed:38+state.wave*4}; e.body=this.add.circle(-15,150,13,0xd9515b).setStrokeStyle(2,0xffc3a0); e.bar=this.add.graphics(); this.enemies.push(e); this.spawned++; }
  update(_,delta) {
    this.enemies.slice().forEach(e=>this.moveEnemy(e,delta));
    this.towers.forEach(t=>this.fire(t)); this.shots.slice().forEach(s=>this.moveShot(s,delta));
    if(state.waveActive && this.spawned>=6+state.wave*2 && this.enemies.length===0) { state.waveActive=false; state.wave++; syncHud(); document.querySelector('#wave-button').disabled=false; this.status.setText(state.wave>5?'모든 웨이브를 방어했습니다!':'웨이브 완료! 다음 웨이브를 시작하세요'); }
  }
  moveEnemy(e,delta) { const a=pathPoints[e.segment], b=pathPoints[e.segment+1]; const dist=Phaser.Math.Distance.Between(a.x,a.y,b.x,b.y); e.progress+=(e.speed*delta/1000)/dist; if(e.progress>=1){e.segment++;e.progress=0;if(e.segment>=pathPoints.length-1){this.removeEnemy(e);state.core=Math.max(0,state.core-1);syncHud();return;}} const p=Phaser.Math.Linear(a.x,b.x,e.progress), q=Phaser.Math.Linear(a.y,b.y,e.progress);e.body.setPosition(p,q);e.bar.clear().fillStyle(0x131b27).fillRect(p-14,q-21,28,4).fillStyle(0x80e697).fillRect(p-14,q-21,28*(e.hp/e.maxHp),4); }
  fire(t) { const target=this.enemies.find(e=>Phaser.Math.Distance.Between(t.x,t.y,e.body.x,e.body.y)<=t.range); if(!target || this.time.now<t.nextShot)return; t.nextShot=this.time.now+t.rate; t.gun.rotation=Phaser.Math.Angle.Between(t.x,t.y,target.body.x,target.body.y)+Math.PI/2; const shot={x:t.x,y:t.y,target,damage:t.damage,color:t.color};shot.dot=this.add.circle(t.x,t.y,4,t.color);this.shots.push(shot); }
  moveShot(s,delta) { if(!this.enemies.includes(s.target)){s.dot.destroy();this.shots.splice(this.shots.indexOf(s),1);return;} const angle=Phaser.Math.Angle.Between(s.x,s.y,s.target.body.x,s.target.body.y), step=460*delta/1000;s.x+=Math.cos(angle)*step;s.y+=Math.sin(angle)*step;s.dot.setPosition(s.x,s.y);if(Phaser.Math.Distance.Between(s.x,s.y,s.target.body.x,s.target.body.y)<13){s.target.hp-=s.damage;s.dot.destroy();this.shots.splice(this.shots.indexOf(s),1);if(s.target.hp<=0){this.removeEnemy(s.target);state.gold+=10;syncHud();}} }
  removeEnemy(e) { e.body.destroy();e.bar.destroy();const i=this.enemies.indexOf(e);if(i>=0)this.enemies.splice(i,1); }
  updateStatus() { if(!state.waveActive && state.wave<=5) this.status.setText(`타워 선택: ${towerData[state.tower].label} (${towerData[state.tower].cost} G)`); }
}
const game = new Phaser.Game({ type: Phaser.AUTO, parent: 'game-container', width: GAME_W, height: GAME_H, scene: BattleScene, backgroundColor: '#173954', scale:{mode:Phaser.Scale.FIT,autoCenter:Phaser.Scale.CENTER_BOTH} });
document.querySelectorAll('.tower-button').forEach(b=>b.addEventListener('click',()=>{state.tower=b.dataset.tower;document.querySelectorAll('.tower-button').forEach(x=>x.classList.toggle('selected',x===b));}));
document.querySelector('#wave-button').addEventListener('click',e=>{game.scene.getScene('Battle').events.emit('start-wave');if(state.wave<=5)e.currentTarget.disabled=true;}); syncHud();
