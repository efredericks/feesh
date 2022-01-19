// Erik Fredericks - 2021-2022
// Gameplay based on the classic Fishy flash game
// Color palette: https://www.color-hex.com/color-palette/103536
// Blobby: https://thecodingtrain.com/CodingChallenges/036-blobby.html

// TBD:
// * comment cleanup
// * offscreen culling optimization
// * difficulty selection

// powerups?

// Generic entity
class Entity {
  constructor(vel, diam) {
    this.cooldown = 0; // bounce cooldown

    this.yoff = 0.0; // blob parameter
    // ensure all don't blob the same
    this.offRand = createVector(random(50000), random(50000));
    this.diameter = int(random(diam.small, diam.large));

    // randomly start its position/direction
    if (random() > 0.5) {
      this.velocity = createVector(random(-vel.large, vel.small), 0);
      this.position = createVector(
        random(width + this.diameter, width + this.diameter + 500),
        random(height)
      );
    } else {
      this.velocity = createVector(random(vel.small, vel.large), 0);
      this.position = createVector(
        random(-this.diameter, -this.diameter - 500),
        random(height)
      );
    }
    this.color = eg;
  }

  // only bounce if in bounds
  inBounds() {
    return ((this.position.x > 0) &&
      (this.position.x < width) &&
      (this.position.y > 0) &&
      (this.position.y < height))
  }

  // collision between entities occurred, bounce
  // https://p5js.org/examples/motion-bouncy-bubbles.html
  bounce(other) {
    this.cooldown = 5;

    let dx = other.position.x - this.position.x;
    let dy = other.position.y - this.position.y;

    let spring = 0.05;

    let distance = sqrt(dx * dx + dy * dy);
    let minDist = other.diameter / 2 + this.diameter / 2;
    let angle = atan2(dy, dx);
    let targetX = this.position.x + cos(angle) * minDist;
    let targetY = this.position.y + sin(angle) * minDist;
    let ax = (targetX - other.position.x) * spring;
    let ay = (targetY - other.position.y) * spring;
    this.velocity.x -= ax;
    this.velocity.y -= ay;
  }

  // update position, boundaries, sizing, etc.
  update() {
    this.position.x += this.velocity.x;
    this.position.y += this.velocity.y;

    // update all entities that are not the player
    if (!this.isPlayer) {
      // cooldown
      if (this.cooldown > 0)
        this.cooldown--;

      // bounds wrapping
      if (this.velocity.x < 0) {
        // left bound
        if (this.position.x + this.diameter < 0) {
          this.position.x = width + this.diameter + random(150);
          this.diameter = random(3, 100);
          this.position.y = random(this.diameter, height - this.diameter);
        }
      } else {
        // right bound
        if (this.position.x - this.diameter > width) {
          this.position.x = -this.diameter + random(-150);
          this.diameter = random(3, 100);
          this.position.y = random(this.diameter, height - this.diameter);
        }
      }
    } else { // the player
      // easy way to stay in-bounds
      // this.position.x = constrain(this.position.x, this.diameter/2, width-this.diameter/2);
      // this.position.y = constrain(this.position.y, this.diameter/2, height-this.diameter/2);
      // easing
      if (this.veloTimer.x > 0) {
        this.veloTimer.x--;
      } else {
        this.veloTimer.x = 0;
        this.velocity.x = 0;
      }

      if (this.veloTimer.y > 0) {
        this.veloTimer.y--;
      } else {
        this.veloTimer.y = 0;
        this.velocity.y = 0;
      }

      if (this.growTimer > 0 && this.growDirection) {
        this.diameter += this.growTarget / 10;
        this.growTimer--;
      } else if (this.growTimer > 0 && !this.growDirection) {
        this.diameter -= this.growTarget / 10;
        this.diameter = max(this.diameter, 40);
        this.growTimer--;
      } else {
        this.growTimer = 0;
        this.growTarget = 0;
        this.growDirection = true;
      }

      if (this.shieldActive > 0) {
        this.shieldActive -= 0.2;
      } else {
        this.shieldActive = 0;
      }
    }
  }

  // draw each entity
  draw() {
    push();
    // blobby-ize this
    noStroke();
    translate(this.position.x, this.position.y);

    // player fx
    if (this.isPlayer && this.shieldActive > 0) {
      fill(color(255, 0, 0, 100));
      circle(0, 0, this.diameter + (this.shieldActive * 3));
    }

    beginShape();
    fill(this.color);
    let xoff = 0;
    for (let a = 0; a < TWO_PI - PI / 30; a += (2 * PI) / 30) {
      let offset = map(
        noise(xoff + this.offRand.x, this.yoff + this.offRand.y),
        0,
        1,
        -this.diameter / 4,
        this.diameter / 4
      );
      let r = this.diameter / 2 + offset;
      let x = r * cos(a);
      let y = r * sin(a);
      vertex(x, y);
      xoff += 0.1;
    }
    endShape();
    this.yoff += 0.01;
    // noStroke();
    // fill(this.color);
    // circle(this.position.x, this.position.y, this.diameter);
    pop();
  }
}

// monitor-analyze-plan-execute
/* 
  * Monitor: 
    - check score (player size)
    - check number of blobs
    - check existing blob sizes
    - check blob velocities
    - fps
    - time in between increase?
  * Analyze:
    - difficulty scale
    - remove collision detection?
    - deblobbyize?
  * Plan:
    - ensure blob changes are on screen to ensure player knows
  * Execute:
    - scale blob sizes/velocities
    - write changes to debug log

    -- only *adapt* if mape is enabled, but still log for data parsing
*/
let utilBViolated = false;
function MAPEcycle() {
  let knob_threshold = 20;
  let fps_threshold = 40;
  let fps_bottom_threshold = 30;

  let utilA = 1.0; // not helpful at present as game is always active
  let utilB = 1.0; // maintain -- invariant
  let utilC = 1.0;
  let utilD = 1.0;  /// fxn
  let utilE = 1.0;  /// fxn
  let utilF = 1.0;  /// fxn
  let utilG = 1.0;  /// fxn?
  let utilH = 1.0; // trivially 1
  let utilI = 1.0; // trivially 1
  let utilJ = 1.0; // trivially 1

  let numEntitiesPre = entities.length;

  // randomly add an enemy - regardless of MAPE
  if (random() > 0.98) {
    if (mapeEnabled) {
      if (entities.length < maxEnemies) {
        entities.push(new Entity(startingVelocity, startingDiameter));
        debugLog.push(`${ticks}:Random enemy added:${entities.length}`);
        if (mapeEnabled)
          numberOfAdaptations++;
      } else {
        debugLog.push(`${ticks}:Random enemy add failed - max capacity:${entities.length}`);
      }
    } else {
      entities.push(new Entity(startingVelocity, startingDiameter));
      debugLog.push(`${ticks}:Random enemy added:${entities.length}`);
    }
  }
// }

let score = int(player.diameter);

// Goal E/H
// if (mapeEnabled) {
//   let scoreCheck = int(score / knob_threshold);
//   if (scoreCheck > lastThreshold) {
//     lastThreshold = scoreCheck;
//     debugLog.push(`${ticks}:New threshold: ${lastThreshold}`);

//     if (entities.length < maxEnemies) {
//       for (let k = 0; k < maxEnemies/2; k++)
//         entities.push(new Entity(startingVelocity, startingDiameter));
//       // while (entities.length < ((lastThreshold + 1) * numEntities)) { // scale # of blobs based on threshold?
//       //   entities.push(new Entity(startingVelocity, startingDiameter));
//       // }
//       debugLog.push(`${ticks}:Enemies increased:${entities.length}`);
//       numberOfAdaptations++;
//     } else {
//       debugLog.push(`${ticks}:Score check enemy add failed - max capacity:${entities.length}`);
//     }
//   }
// }

// goal E
if (entities.length >= maxEnemies) {
  debugLog.push(`${ticks}:Violation:Too many enemies:${entities.length}`);
  if (entities.length < maxEnemies * 2) utilE = 0.7;
  else if (entities.length < maxEnemies * 4) utilE = 0.4;
  else utilE = 0.0;
} else {
  utilE = 1.0;
}

// Goal F
if (mapeEnabled) {
  if (player.diameter > width / 2 && player.growTimer == 0) {
    // player.growTimer = 10;
    // player.diameter /= 8;

    player.growTimer = 30;
    player.growDirection = false;
    player.growTarget = player.diameter / 2;

    // player.growTarget = player.diameter / 2;
    debugLog.push(`${ticks}:PlayerDiameter decreased:${player.diameter / 2}`);
    numberOfAdaptations++;
  }
}

// Goal B/D
let fr = frameRate();
if (fr < fps_threshold) {

  if (fr < fps_bottom_threshold) {
    utilB = 0.0;
    utilD = 0.0;
    utilBViolated = true; // Goal B violated - can't go back!
    // maxEnemiesToRemove = 30;

    if (entities.length > 10 && mapeEnabled) {
      entities.splice(0, entities.length - 10);
      debugLog.push(`${ticks}:FPS violation:Enemies decreased:${entities.length}:${fr}`);
    }

  } else {
    utilD = 1.0 - (Math.abs(fr - 30) / (30.0 - 20.0));

    // remove enemies based on current FPS and length of enemy list
    if (mapeEnabled) {
      let maxEnemiesToRemove = 10;
      let toRemove = int(random(1, min(maxEnemiesToRemove, entities.length)));
      if (entities.length > toRemove) {
        entities.splice(entities.length - 1, toRemove);
        debugLog.push(`${ticks}:FPS exceeded:Enemies decreased:${entities.length}:${fr}`);
        numberOfAdaptations++;
      }
    }
  }

  if (bouncy && mapeEnabled && fr < fps_bottom_threshold + 5) {
    bouncy = false;
    // bouncyBox.attribute('checked') = false; --> can't seem to update the value in real time and unsure how to set an id to reference via DOM?
    debugLog.push(`${ticks}:FPS exceeded:Debounced:${fr}`)
    numberOfAdaptations++;
  }

} else {
  utilD = 1.0;
  // if (!bouncy) {
  //   debugLog.push("Rebounced")
  //   bouncy = true;
  // }
}

// goal F
if (player.diameter >= width) utilF = 0.0;
else if (player.diameter < width / 2) utilF = 1.0;
else
  utilF = 1.0 - (Math.abs(player.diameter - width / 2) / (width / 2));

// draw debuglog
/*
let yoff = 10;
textSize(12);
fill(color(255))
textAlign(LEFT);

let start = 0;
let end = debugLog.length;
if (end > 20)
  start = end - 20;
for (let i = start; i < end; i++) {
  text(debugLog[i], 40, yoff * (i - start) + 20);
}
*/

utilLog.push({
  'tick': ticks,
  'A': utilA,
  'B': utilB,
  'C': utilC,
  'D': utilD,
  'E': utilE,
  'F': utilF,
  'G': utilG,
  'H': utilH,
  'I': utilI,
  'J': utilJ,
  'frameRate': fr,
  'numEntitiesPreAdapt': numEntitiesPre,
  'numEntitiesPostAdapt': entities.length,
  'intDiameter': score,
});
}

// enable/disable entity bouncing
function bouncyBoxChanged() {
  if (this.checked()) {
    bouncy = true;
  } else {
    bouncy = false;
  }
}

// enable/disable logging
function logBoxChanged() {
  if (this.checked()) {
    logData = true;
  } else {
    logData = false;
  }
}

// enable/disable mape
function mapeBoxChanged() {
  if (STATE == STATES.running)
    debugLog.push("ERROR - MAPE SWITCHED MID-RUN");

  if (this.checked()) {
    mapeEnabled = true;
  } else {
    mapeEnabled = false;
  }
}

// enable/disable RT testing
// function testsBoxChanged() {
//   if (this.checked()) {
//     tests = true;
//   } else {
//     tests = false;
//   }
// }

// Circle-Circle collision
function circleCircle(e1, e2) {
  let d = dist(e1.position.x, e1.position.y, e2.position.x, e2.position.y);

  if (d < e1.diameter / 2 + e2.diameter / 2) return true;
  else return false;
}

// globals
let entities = [];
let numEntities = 20;

let startingVelocity = { 'small': 0.1, 'large': 1.5 };
let startingDiameter = { 'small': 3, 'large': 100 };
let player;

let bg;
let pg;
let eg;

let bouncyBox;
let bouncy;

let logData;
let logBox;
let mapeBox;

let testsBox;
let tests;

let debugLog = [];
let utilLog = [];
let lastThreshold;
let numberOfAdaptations;

let STATE;
let STATES = {
  start: 0,
  running: 1,
  paused: 2,
  gameOver: 3,
  win: 4,
};

let mapeEnabled = true;//false;

// re-initialize everything as needed
function setupGame() {
  ticks = 0;
  numberOfAdaptations = 0;
  bouncy = true;
  bouncyBox.checked = true;

  entities = [];
  debugLog = [];
  utilLog = [];
  player = null;
  bg = color(60, 35, 92);
  pg = color(187, 28, 203);
  eg = color(212, 148, 147);

  maxEnemies = 100;

  for (let i = 0; i < numEntities; i++) entities.push(new Entity(startingVelocity, startingDiameter));

  player = new Entity({ 'small': 0, 'large': 0 }, { 'small': 0, 'large': 0 });
  player.diameter = 0;
  player.color = pg; //color(255, 0, 255);
  player.isPlayer = true;
  player.score = 0;
  player.position.x = width / 2;
  player.position.y = height / 2;
  player.velocity.x = 0;
  player.velocity.y = 0;
  player.veloTimer = createVector(0, 0);

  // setup simple inventory
  player.items = {
    'shield': 5,
    'noncorporeal': 5,
    'flame': 5,
    'laser': 5,
  };

  // chunk into X steps for eased growing
  player.growTimer = 30;
  player.growDirection = true;
  player.growTarget = 5;

  STATE = STATES.running;

  lastThreshold = 0;
}

let ticks;
let mainCanvas;
let maxEnemies;

function setup() {
  mainCanvas = createCanvas(1024, 480);
  mainCanvas.parent('canvas-container');
  frameRate(60);

  bouncyBox = createCheckbox('bouncy blobs?', true);
  bouncyBox.parent('controls');
  bouncyBox.changed(bouncyBoxChanged);
  bouncy = true;

  logBox = createCheckbox("Log data?", true);
  logBox.parent('controls');
  logBox.changed(logBoxChanged);
  logData = true;

  mapeBox = createCheckbox("MAPE enabled? (only update before game start)", true);
  mapeBox.parent('controls');
  mapeBox.changed(mapeBoxChanged);
  mapeEnabled = true;

  setupGame();

  // testsBox = createCheckbox('run-time testing?', false);
  // testsBox.parent('controls');
  // testsBox.changed(testsBoxChanged);
  // tests = false;

  STATE = STATES.start;

  // add some extra entities for the splash
  for (let i = 0; i < numEntities; i++) entities.push(new Entity(startingVelocity, startingDiameter));
}

// function handleRunTimeTesting() {
//   for (i = 0; i < 1000; i++) {
//     fill(255);
//     rect(random(width - 20), random(height - 20), 20, 20);
//   }
// }

function keyReleased() {
  if (key == "1") {
    if (player.items.shield > 0) {
      player.shieldActive = 20;
    }
  }
}

function draw() {
  background(bg);

  if (STATE === STATES.start) {
    entities.forEach((e) => {
      e.update();
      e.draw()
    });

    fill(color(0, 0, 0, 180));
    rect(0, 0, width, height);

    textSize(32);
    fill(255);
    textAlign(CENTER, CENTER);

    text("feesh [research edition]", width / 2, height / 2);

    textSize(16);
    text("Movement: Arrow keys // Pause: Space // Restart: R", width / 2, height / 2 + 24);
    text("Press any key to start", width / 2, height / 2 + 44);

  } else {
    if (STATE === STATES.running) {
      // update floaters
      entities.forEach((e) => e.update());

      // handle continuous keypresses
      if (keyIsDown(LEFT_ARROW)) {
        player.velocity.x += -0.25;
        player.veloTimer.x = 10;
      }
      if (keyIsDown(RIGHT_ARROW)) {
        player.velocity.x += 0.25;
        player.veloTimer.x = 10;
      }
      if (keyIsDown(UP_ARROW)) {
        player.velocity.y += -0.25;
        player.veloTimer.y = 10;
      }
      if (keyIsDown(DOWN_ARROW)) {
        player.velocity.y += 0.25;
        player.veloTimer.y = 10;
      }

      // cap velocity
      player.velocity.x = constrain(player.velocity.x, -3.5, 3.5);
      player.velocity.y = constrain(player.velocity.y, -3.5, 3.5);

      // update player
      player.update();

      // collisions
      for (let i = entities.length - 1; i >= 0; i--) {
        if (circleCircle(player, entities[i])) {
          // player bigger than entity
          if (player.diameter >= entities[i].diameter) {
            player.growTimer = 10;
            player.growTarget = entities[i].diameter / 2;

            entities.splice(i, 1);
            entities.push(new Entity(startingVelocity, startingDiameter)); // add a new one back

            if (player.diameter > width) STATE = STATES.win;

            // player smaller than entity
          } else {
            player.color = color(255, 0, 0);
            STATE = STATES.gameOver;
          }
        }

        // let them BOUNCE
        if (bouncy) {
          for (let j = entities.length - 1; j >= 0; j--) {
            if (i == j) continue;

            if (circleCircle(entities[i], entities[j]) && entities[i].inBounds() && entities[j].inBounds()) {
              if (entities[i].cooldown == 0)
                entities[i].bounce(entities[j]);
              if (entities[j].cooldown == 0)
                entities[j].bounce(entities[i]);
            }
          }
        }
      }

      // MAPE
      MAPEcycle();
    }

    // draw entities
    entities.forEach((e) => e.draw());
    player.draw();

    // you lost
    if (STATE === STATES.gameOver || STATE === STATES.win) {
      fill(color(0, 0, 0, 180));
      rect(0, 0, width, height);

      textSize(32);
      fill(255);
      textAlign(CENTER, CENTER);

      let txt = "YOU DIED";
      if (STATE === STATES.win) txt = "YOU WON";
      text(txt, width / 2, height / 2);

      textSize(16);
      // debugLog.push(`${ticks}:gameOver:${player.diameter}:${player.score}`)
      text(`Score: ${player.score} // Size: ${int(player.diameter)}`, width / 2, height / 2 + 24);
      text("Press any key to restart", width / 2, height / 2 + 44);
    }
  }

  // if (tests) {
  //   handleRunTimeTesting();
  // }

  // fps
  push();
  fill(255);
  textSize(12);
  text(`FPS: ${int(frameRate())}`, 40, 10);
  pop();

  if (STATE === STATES.running) {
    ticks++;
    player.score++;
  }
}

// handle async keypresses
function keyPressed() {
  // restart game if done
  if (STATE === STATES.gameOver || STATE === STATES.win || STATE === STATES.start) {
    if (STATE === STATES.gameOver || STATE === STATES.win) {
      dumpLog();
    }
    setupGame();
  } else {
    if (key === " ") {
      if (STATE === STATES.running) STATE = STATES.paused;
      else STATE = STATES.running;
    } else if (key === "s" && STATE === STATES.running) {
      save(mainCanvas, Date.now() + "_screenshot.png");
    } else if (key === "r" || key === "R") {
      if (key === "R") {
        debugLog.push("keypress event:player aborted game (R)");
        dumpLog();
      }
      setupGame();
    } else if (key === "p" && STATE == STATES.running) {
      player.growTimer = 10;
      player.growTarget = player.diameter + 10;
      player.growDirection = true;
    }

  }
}

function dumpLog() {
  if (logData) {
    for (let i = 0; i < utilLog.length; i++) {
      debugLog.push(JSON.stringify(utilLog[i]));
    }

    debugLog.push(`${ticks}:gameOver:${STATE}:${player.diameter}:${player.score}`)
    debugLog.push(`TotalNumberOfAdaptations:${numberOfAdaptations}`);
    debugLog.push(`GoalBViolated:${utilBViolated}`);



    let fname = Date.now();

    if (mapeEnabled) fname += "_MAPE";
    else fname += "_noMAPE";


    if (STATE === STATES.gameOver) fname += "_LOSS.txt";
    else fname += "_WIN.txt";
    save(debugLog, fname);
  }
}