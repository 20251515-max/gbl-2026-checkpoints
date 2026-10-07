/* Visual layer adjustments kept separate from the game rules. */
(function applyBattleArt() {
  const redraw = () => {
    const scene = game.scene.getScene('Battle');
    if (!scene || !scene.sys.isActive()) return false;
    const graphics = scene.children.list.find(child => child instanceof Phaser.GameObjects.Graphics);
    if (!graphics) return false;

    graphics.clear();
    graphics.fillStyle(0x4e9847).fillRect(0, 0, GAME_W, GAME_H);
    for (let x = 0; x < GAME_W; x += 48) for (let y = 0; y < GAME_H; y += 48) {
      graphics.fillStyle((x / 48 + y / 48) % 2 ? 0x67ad54 : 0x438b43, 0.34).fillRect(x + 1, y + 1, 46, 46);
    }
    graphics.lineStyle(46, 0x544237, 1).beginPath().moveTo(pathPoints[0].x, pathPoints[0].y);
    pathPoints.slice(1).forEach(p => graphics.lineTo(p.x, p.y)); graphics.strokePath();
    graphics.lineStyle(34, 0xc69e6c, 1).beginPath().moveTo(pathPoints[0].x, pathPoints[0].y);
    pathPoints.slice(1).forEach(p => graphics.lineTo(p.x, p.y)); graphics.strokePath();
    [[125,300],[250,445],[470,125],[510,440],[725,145],[850,290]].forEach(([x,y]) => {
      graphics.fillStyle(0x356b41).fillCircle(x,y,24).lineStyle(2,0xa2d680).strokeCircle(x,y,24);
    });

    // Full-height castle, its wall on the right battlefield edge.
    graphics.fillStyle(0x66717b).fillRect(934, 0, 90, GAME_H);
    graphics.fillStyle(0x99a4ad).fillRect(942, 0, 74, GAME_H);
    graphics.fillStyle(0x59636d);
    for (let y = 22; y < GAME_H; y += 42) {
      graphics.fillRect(942, y, 74, 3);
      for (let x = 942 + ((y / 42) % 2 ? 0 : 18); x < 1015; x += 36) graphics.fillRect(x, y, 3, 39);
    }
    for (let x = 936; x < 1024; x += 22) graphics.fillRect(x, 0, 13, 16);
    graphics.fillStyle(0x2d3742).fillRect(950, 440, 48, 136).fillStyle(0xb98657).fillRect(956, 448, 36, 128);

    const hero = scene.add.container(973, 33).setDepth(2);
    hero.add([scene.add.circle(0, 0, 10, 0xffd28a), scene.add.triangle(0, 24, -15, 20, 0, 2, 15, 20, 0x3c6fd1), scene.add.rectangle(0, 12, 18, 4, 0x29384e), scene.add.line(14, 10, 0, 0, 22, -15, 0xeef6ff).setLineWidth(3)]);
    scene.children.list.filter(o => o instanceof Phaser.GameObjects.Text && o.text === '전투 준비').forEach(o => o.setVisible(false));
    scene.events.on('postupdate', () => scene.children.list.filter(o => o instanceof Phaser.GameObjects.Arc && o.radius === 4).forEach(o => o.setRadius(6).setStrokeStyle(3, 0xffffff)));
    return true;
  };
  const timer = setInterval(() => { if (redraw()) clearInterval(timer); }, 50);
}());
