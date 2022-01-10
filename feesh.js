// Erik Fredericks - 2021
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

      if (this.growTimer > 0) {
        this.diameter += this.growTarget / 10;
        this.growTimer--;
      } else {
        this.growTimer = 0;
        this.growTarget = 0;
      }

      if (this.shieldActive > 0) {
        this.shieldActive-=0.2;
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
      circle(0, 0, this.diameter + (this.shieldActive*3));
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
*/
function MAPEcycle() {
  let knob_threshold = 20;
  let fps_threshold = 30;

  // randomly add an enemy
  if (random() > 0.98) {
    entities.push(new Entity(startingVelocity, startingDiamater));
    debugLog.push(`${ticks}:Random enemy added:${entities.length}`);
  }

  let score = int(player.diameter);

  let scoreCheck = int(score / knob_threshold);
  if (scoreCheck > lastThreshold) {
    lastThreshold = scoreCheck;
    debugLog.push(`${ticks}:New threshold: ${lastThreshold}`);

    while (entities.length < ((lastThreshold + 1) * numEntities)) { // scale # of blobs based on threshold?
      entities.push(new Entity(startingVelocity, startingDiamater));
    }
    debugLog.push(`${ticks}:Enemies increased:${entities.length}`);
  }

  if (player.diameter > width/2) {
    // player.growTimer = 10;
    player.diameter /= 8;
    // player.growTarget = player.diameter / 2;
    debugLog.push(`${ticks}:PlayerDiameter decreased:${player.diameter/8}`);
  }

  if (frameRate() < fps_threshold) {
    if (bouncy) {
      bouncy = false;
      // bouncyBox.attribute('checked') = false; --> can't seem to update the value in real time and unsure how to set an id to reference via DOM?
      debugLog.push(`${ticks}:FPS exceeded:Debounced`)
    }

    // remove up to 5 at a time
    if (entities.length > 1) {
      entities.splice(entities.length - 1, 1);
      debugLog.push(`${ticks}:FPS exceeded:Enemies decreased:${entities.length}`);
    }
  } else {
    // if (!bouncy) {
    //   debugLog.push("Rebounced")
    //   bouncy = true;
    // }
  }



  // draw debuglog
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
}

// enable/disable entity bouncing
function bouncyBoxChanged() {
  if (this.checked()) {
    bouncy = true;
  } else {
    bouncy = false;
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
let startingDiamater = { 'small': 3, 'large': 100 };
let player;

let bg;
let pg;
let eg;

let bouncyBox;
let bouncy;

let testsBox;
let tests;

let debugLog = [];
let lastThreshold;

let STATE;
let STATES = {
  start: 0,
  running: 1,
  paused: 2,
  gameOver: 3,
  win: 4,
};

// re-initialize everything as needed
function setupGame() {
  ticks = 0;
  bouncy = true;
  bouncyBox.checked = true;

  entities = [];
  debugLog = [];
  player = null;
  bg = color(60, 35, 92);
  pg = color(187, 28, 203);
  eg = color(212, 148, 147);

  for (let i = 0; i < numEntities; i++) entities.push(new Entity(startingVelocity, startingDiamater));

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
  player.growTarget = 5;

  STATE = STATES.running;

  lastThreshold = 0;
}

let ticks;
let mainCanvas;

function setup() {
  mainCanvas = createCanvas(1024, 480);
  mainCanvas.parent('canvas-container');
  frameRate(60);

  bouncyBox = createCheckbox('bouncy blobs?', true);
  bouncyBox.parent('controls');
  bouncyBox.changed(bouncyBoxChanged);
  bouncy = true;

  setupGame();

  // testsBox = createCheckbox('run-time testing?', false);
  // testsBox.parent('controls');
  // testsBox.changed(testsBoxChanged);
  // tests = false;

  STATE = STATES.start;

  // add some extra entities for the splash
  for (let i = 0; i < numEntities; i++) entities.push(new Entity(startingVelocity, startingDiamater));
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
            entities.push(new Entity(startingVelocity, startingDiamater)); // add a new one back

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
      save(mainCanvas, Date.now()+"_screenshot.png");
    } else if (key === "r" || key === "R") {
      if (key === "R") dumpLog();
      setupGame();
    }
  }
}

function dumpLog() {
  debugLog.push(`${ticks}:gameOver:${STATE}:${player.diameter}:${player.score}`)
  let fname = Date.now();
  if (STATE === STATES.gameOver) fname += "_LOSS.txt";
  else fname += "_WIN.txt";
  save(debugLog, fname);
}