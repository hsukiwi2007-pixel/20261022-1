// ==========================================
// 全域變數定義與初始化資料
// ==========================================

// 題目資料庫：6組幼兒生活常識（圖卡主題與對應正確文字）
let quizData = [
  { id: 0, title: "吃飯前", correctText: "飯前洗手" },
  { id: 1, title: "睡覺前", correctText: "睡前刷牙" },
  { id: 2, title: "過馬路", correctText: "看紅綠燈" },
  { id: 3, title: "穿鞋子", correctText: "區分左右" },
  { id: 4, title: "吃完飯", correctText: "垃圾丟桶" },
  { id: 5, title: "要健康", correctText: "多吃水果" }
];

let targetZones = []; // 存放上方6個目標圖卡區域的座標與狀態
let textItems = [];   // 存放下方6個可拖曳的文字選項
let confetti = [];    // 滿分/高分時發射的彩帶粒子陣列

let draggedItem = null; // 當前正在被拖曳的文字物件
let isFinished = false; // 是否已交卷看成績
let totalScore = 0;     // 最終計算總得分
let showSubmitBtn = false; // 是否顯示「交卷看成績」按鈕

// ==========================================
// p5.js 初始化與建立畫布 (Setup)
// ==========================================
function setup() {
  // 建立與瀏覽器視窗同寬同高的全螢幕畫布
  createCanvas(windowWidth, windowHeight);
  // 文字置中對齊
  textAlign(CENTER, CENTER);
  // 啟動測驗初始化
  initQuiz();
}

// 初始化測驗與重新排版
function initQuiz() {
  targetZones = [];
  textItems = [];
  confetti = [];
  isFinished = false;
  totalScore = 0;
  draggedItem = null;
  showSubmitBtn = false;

  // 計算圖卡與拖曳選項的排版尺寸
  let marginX = width * 0.04;
  let topY = height * 0.18;
  let zoneWidth = (width - marginX * 7) / 6;
  let zoneHeight = height * 0.35;

  // 1. 建立上方 6 個固定目標區域
  for (let i = 0; i < 6; i++) {
    let x = marginX + i * (zoneWidth + marginX);
    targetZones.push({
      id: quizData[i].id,
      title: quizData[i].title,
      correctText: quizData[i].correctText,
      x: x,
      y: topY,
      w: zoneWidth,
      h: zoneHeight,
      occupiedItem: null // 當前被放入的文字物件
    });
  }

  // 2. 建立下方 6 個可拖曳文字選項（打亂順序）
  let shuffledTexts = [];
  for (let i = 0; i < 6; i++) {
    shuffledTexts.push({
      id: quizData[i].id,
      text: quizData[i].correctText
    });
  }
  // 打亂陣列順序
  shuffledTexts.sort(function() { return Math.random() - 0.5; });

  let bottomY = height * 0.68;
  let itemWidth = zoneWidth;
  let itemHeight = height * 0.12;

  for (let i = 0; i < 6; i++) {
    let x = marginX + i * (itemWidth + marginX);
    textItems.push({
      id: shuffledTexts[i].id,
      text: shuffledTexts[i].text,
      initX: x,
      initY: bottomY,
      x: x,
      y: bottomY,
      w: itemWidth,
      h: itemHeight,
      isDragging: false,
      placedZone: null // 被固定在那個目標區域內
    });
  }
}

// ==========================================
// 主繪圖迴圈 (Draw Loop)
// ==========================================
function draw() {
  // 繪製粉藍色漸層背景
  drawBackground();

  // 繪製標題列
  fill(50, 50, 90);
  textSize(min(width * 0.035, 32));
  textStyle(BOLD);
  text("🌟 幼兒園生活常識 - 配對拖曳小遊戲 🌟", width / 2, height * 0.07);

  // 1. 繪製上方6個目標圖卡
  for (let i = 0; i < targetZones.length; i++) {
    drawTargetZone(targetZones[i]);
  }

  // 2. 繪製下方6個拖曳文字選項
  for (let i = 0; i < textItems.length; i++) {
    // 拖曳中的項目最後才畫（防止被其他卡片遮擋）
    if (textItems[i] !== draggedItem) {
      drawTextCard(textItems[i]);
    }
  }

  // 繪製正在拖曳中的文字選項
  if (draggedItem) {
    drawTextCard(draggedItem);
  }

  // 3. 檢查是否所有選項都已放入目標區
  checkCompletionStatus();

  // 4. 繪製交卷按鈕與結算結果
  if (showSubmitBtn && !isFinished) {
    drawSubmitButton();
  }

  // 5. 若已交卷，顯示成績面板
  if (isFinished) {
    drawScoreBoard();
    // 成績高於等於 80% (答對5題以上) 發射彩帶效果
    if (totalScore >= 80) {
      updateAndDrawConfetti();
    }
  }
}

// ==========================================
// 繪製組件與動畫函式
// ==========================================

// 漸層背景
function drawBackground() {
  for (let y = 0; y < height; y++) {
    let inter = map(y, 0, height, 0, 1);
    let c = lerpColor(color(230, 245, 255), color(255, 240, 245), inter);
    stroke(c);
    line(0, y, width, y);
  }
}

// 繪製目標區域與內部動態圖卡
function drawTargetZone(zone) {
  push();
  strokeWeight(3);
  stroke(180, 200, 230);
  fill(255, 255, 255, 220);
  rect(zone.x, zone.y, zone.w, zone.h, 16);

  // 標題與圖案繪製
  noStroke();
  fill(100, 110, 140);
  textSize(min(zone.w * 0.15, 20));
  text(zone.title, zone.x + zone.w / 2, zone.y + zone.h * 0.18);

  // 畫動態插圖 (使用 time 產生動畫效果)
  drawAnimatedIcon(zone.id, zone.x + zone.w / 2, zone.y + zone.h * 0.5, zone.w * 0.4);

  // 放置提示虛線框
  stroke(200, 210, 225);
  strokeWeight(2);
  noFill();
  rect(zone.x + zone.w * 0.05, zone.y + zone.h * 0.72, zone.w * 0.9, zone.h * 0.24, 10);

  pop();
}

// 動態 GIF 風格圖案繪製
function drawAnimatedIcon(id, cx, cy, sz) {
  push();
  translate(cx, cy);
  let t = millis() * 0.004; // 時間因子

  if (id === 0) { // 洗手 🧼 (泡泡浮動)
    fill(130, 200, 250);
    ellipse(0, 0, sz, sz);
    fill(255, 255, 255, 180);
    ellipse(sin(t) * 10 - 10, cos(t) * 10 - 10, sz * 0.3, sz * 0.3);
    ellipse(cos(t) * 12 + 10, sin(t) * 12 + 10, sz * 0.2, sz * 0.2);
  } else if (id === 1) { // 刷牙 🪥 (左右搖擺)
    rotate(sin(t * 2) * 0.2);
    fill(255, 120, 150);
    rect(-sz * 0.15, -sz * 0.4, sz * 0.3, sz * 0.8, 8);
    fill(255);
    rect(-sz * 0.15, -sz * 0.4, sz * 0.3, sz * 0.3, 4);
  } else if (id === 2) { // 過馬路 🚦 (號誌閃爍)
    fill(80);
    rect(-sz * 0.25, -sz * 0.5, sz * 0.5, sz, 10);
    fill(255, 80, 80);
    ellipse(0, -sz * 0.25, sz * 0.3);
    fill(sin(t * 3) > 0 ? color(80, 255, 80) : color(40, 100, 40));
    ellipse(0, sz * 0.25, sz * 0.3);
  } else if (id === 3) { // 穿鞋 👟 (上下跳動)
    translate(0, sin(t * 2) * 6);
    fill(100, 180, 255);
    ellipse(-10, 0, sz * 0.6, sz * 0.4);
    ellipse(10, 0, sz * 0.6, sz * 0.4);
  } else if (id === 4) { // 垃圾桶 🗑️ (蓋子跳動)
    fill(160, 170, 180);
    rect(-sz * 0.3, -sz * 0.2, sz * 0.6, sz * 0.6, 6);
    push();
    translate(0, -sz * 0.2);
    rotate(sin(t * 2) * 0.1);
    fill(120, 130, 140);
    rect(-sz * 0.35, -sz * 0.1, sz * 0.7, sz * 0.1, 4);
    pop();
  } else if (id === 5) { // 水果 🍎 (縮放微動)
    let s = 1 + sin(t * 2) * 0.08;
    scale(s);
    fill(255, 90, 90);
    ellipse(0, 0, sz * 0.7, sz * 0.7);
    fill(80, 180, 80);
    ellipse(5, -sz * 0.35, sz * 0.2, sz * 0.1);
  }
  pop();
}

// 繪製拖曳文字卡片
function drawTextCard(item) {
  push();
  strokeWeight(2);
  if (item.isDragging) {
    stroke(255, 150, 0);
    fill(255, 245, 220);
    // 繪製拖曳陰影
    drawingContext.shadowBlur = 15;
    drawingContext.shadowColor = 'rgba(0,0,0,0.2)';
  } else {
    stroke(140, 180, 230);
    fill(255);
  }

  rect(item.x, item.y, item.w, item.h, 12);

  // 答案判定顯色（交卷後）
  if (isFinished && item.placedZone) {
    if (item.id === item.placedZone.id) {
      fill(40, 180, 90); // 正確 綠色
    } else {
      fill(230, 60, 60); // 錯誤 紅色
    }
  } else {
    fill(60, 70, 90);
  }

  noStroke();
  textSize(min(item.w * 0.2, 22));
  textStyle(BOLD);
  text(item.text, item.x + item.w / 2, item.y + item.h / 2);
  pop();
}

// 繪製「交卷看成績」按鈕
function drawSubmitButton() {
  push();
  let btnX = width / 2 - 100;
  let btnY = height * 0.85;
  let btnW = 200;
  let btnH = 50;

  // 按鈕懸浮效果
  let isHover = mouseX > btnX && mouseX < btnX + btnW && mouseY > btnY && mouseY < btnY + btnH;
  fill(isHover ? color(255, 120, 0) : color(255, 150, 0));
  stroke(255);
  strokeWeight(3);
  rect(btnX, btnY, btnW, btnH, 25);

  fill(255);
  noStroke();
  textSize(22);
  textStyle(BOLD);
  text("📝 交卷看成績", width / 2, btnY + btnH / 2);
  pop();
}

// 繪製成績彈窗
function drawScoreBoard() {
  push();
  fill(0, 0, 0, 150);
  rect(0, 0, width, height); // 暗色遮罩

  let panelW = min(width * 0.8, 420);
  let panelH = 260;
  let panelX = width / 2 - panelW / 2;
  let panelY = height / 2 - panelH / 2;

  fill(255);
  stroke(255, 200, 0);
  strokeWeight(5);
  rect(panelX, panelY, panelW, panelH, 24);

  noStroke();
  fill(50);
  textSize(28);
  textStyle(BOLD);
  text("測驗結果", width / 2, panelY + 45);

  // 得分文字與顏色
  if (totalScore >= 80) {
    fill(255, 100, 0);
    textSize(38);
    text("🎉 得分：" + totalScore + " 分", width / 2, panelY + 110);
    fill(80);
    textSize(20);
    text("太棒了！你是生活小達人！", width / 2, panelY + 160);
  } else {
    fill(220, 50, 50);
    textSize(38);
    text("💪 得分：" + totalScore + " 分", width / 2, panelY + 110);
    fill(80);
    textSize(20);
    text("再接再厲！再試一次吧！", width / 2, panelY + 160);
  }

  // 重新測驗按鈕
  let reBtnX = width / 2 - 80;
  let reBtnY = panelY + 195;
  fill(100, 180, 255);
  rect(reBtnX, reBtnY, 160, 42, 20);
  fill(255);
  textSize(18);
  text("🔄 重新測驗", width / 2, reBtnY + 21);
  pop();
}

// ==========================================
// 互動事件判斷 (Mouse & Touch)
// ==========================================

function mousePressed() {
  // 1. 若已經交卷，點擊重新測驗按鈕
  if (isFinished) {
    let panelH = 260;
    let panelY = height / 2 - panelH / 2;
    let reBtnX = width / 2 - 80;
    let reBtnY = panelY + 195;
    if (mouseX > reBtnX && mouseX < reBtnX + 160 && mouseY > reBtnY && mouseY < reBtnY + 42) {
      initQuiz();
    }
    return;
  }

  // 2. 點擊交卷看成績按鈕
  if (showSubmitBtn) {
    let btnX = width / 2 - 100;
    let btnY = height * 0.85;
    if (mouseX > btnX && mouseX < btnX + 200 && mouseY > btnY && mouseY < btnY + 50) {
      calculateScore();
      return;
    }
  }

  // 3. 抓取拖曳文字卡片
  for (let i = textItems.length - 1; i >= 0; i--) {
    let item = textItems[i];
    if (mouseX > item.x && mouseX < item.x + item.w && mouseY > item.y && mouseY < item.y + item.h) {
      draggedItem = item;
      item.isDragging = true;

      // 若卡片已在目標區域內，先解除關聯
      if (item.placedZone) {
        item.placedZone.occupiedItem = null;
        item.placedZone = null;
      }
      break;
    }
  }
}

function mouseDragged() {
  // 跟隨滑鼠移動
  if (draggedItem) {
    draggedItem.x = mouseX - draggedItem.w / 2;
    draggedItem.y = mouseY - draggedItem.h / 2;
  }
}

function mouseReleased() {
  if (!draggedItem) return;

  draggedItem.isDragging = false;
  let snapped = false;

  // 判斷是否放入某個目標區域
  for (let i = 0; i < targetZones.length; i++) {
    let zone = targetZones[i];
    let zoneTargetX = zone.x + zone.w * 0.05;
    let zoneTargetY = zone.y + zone.h * 0.72;
    let zoneTargetW = zone.w * 0.9;
    let zoneTargetH = zone.h * 0.24;

    // 碰撞檢查
    if (draggedItem.x + draggedItem.w / 2 > zone.x &&
        draggedItem.x + draggedItem.w / 2 < zone.x + zone.w &&
        draggedItem.y + draggedItem.h / 2 > zone.y &&
        draggedItem.y + draggedItem.h / 2 < zone.y + zone.h) {

      // 若該格已有其他卡片，將舊卡片彈回初始位置
      if (zone.occupiedItem && zone.occupiedItem !== draggedItem) {
        zone.occupiedItem.x = zone.occupiedItem.initX;
        zone.occupiedItem.y = zone.occupiedItem.initY;
        zone.occupiedItem.placedZone = null;
      }

      // 卡片自動吸附至目標位置
      draggedItem.x = zoneTargetX;
      draggedItem.y = zoneTargetY;
      draggedItem.placedZone = zone;
      zone.occupiedItem = draggedItem;
      snapped = true;
      break;
    }
  }

  // 未放入目標區則彈回初始位置
  if (!snapped) {
    draggedItem.x = draggedItem.initX;
    draggedItem.y = draggedItem.initY;
    draggedItem.placedZone = null;
  }

  draggedItem = null;
}

// 檢查是否所有 6 個選項都已完成放置
function checkCompletionStatus() {
  let count = 0;
  for (let i = 0; i < textItems.length; i++) {
    if (textItems[i].placedZone !== null) {
      count++;
    }
  }
  showSubmitBtn = (count === 6);
}

// 計算最終得分 (每題 16.66 分，全對 100 分)
function calculateScore() {
  let correctCount = 0;
  for (let i = 0; i < textItems.length; i++) {
    if (textItems[i].placedZone && textItems[i].id === textItems[i].placedZone.id) {
      correctCount++;
    }
  }
  totalScore = Math.round((correctCount / 6) * 100);
  isFinished = true;

  // 達到 80% 以上觸發彩帶粒子
  if (totalScore >= 80) {
    createConfetti();
  }
}

// ==========================================
// 高分彩帶粒子系統 (Confetti Effect)
// ==========================================

function createConfetti() {
  confetti = [];
  for (let i = 0; i < 150; i++) {
    confetti.push({
      x: random(width),
      y: random(-height, 0),
      size: random(8, 16),
      color: color(random(255), random(255), random(255)),
      speedY: random(3, 8),
      speedX: random(-2, 2),
      rotation: random(TWO_PI),
      rotSpeed: random(-0.1, 0.1)
    });
  }
}

function updateAndDrawConfetti() {
  push();
  noStroke();
  for (let i = 0; i < confetti.length; i++) {
    let p = confetti[i];
    p.y += p.speedY;
    p.x += p.speedX;
    p.rotation += p.rotSpeed;

    // 超出底部循環降落
    if (p.y > height) {
      p.y = random(-50, 0);
      p.x = random(width);
    }

    fill(p.color);
    push();
    translate(p.x, p.y);
    rotate(p.rotation);
    rect(-p.size / 2, -p.size / 2, p.size, p.size * 0.6);
    pop();
  }
  pop();
}

// 視窗動態縮放適配
function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
  initQuiz();
}