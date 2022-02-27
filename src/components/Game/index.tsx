import React from "react";

import Background from "src/assets/Backgrounds/1.png";
import PipeTop from "src/assets/Backgrounds/Obstacle1.png";
import PipeBottom from "src/assets/Backgrounds/Obstacle2.png";

import style from "./index.module.scss";

const DEGREE = Math.PI / 180;

const background = new Image();
background.src = Background;

const pipeTop = new Image();
pipeTop.src = PipeTop;

const pipeBottom = new Image();
pipeBottom.src = PipeBottom;

const defaultSize = {
  bird: {
    width: 216,
    height: 150,
  }
};

function getRandomInt(min: number, max: number) {
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(Math.random() * (max - min)) + min; //Максимум не включается, минимум включается
}

enum PipePosition {
  TOP,
  BOTTOM
}

export default class Game extends React.Component<any, any> {

  private readonly game: React.RefObject<HTMLCanvasElement>;
  private ctx!: CanvasRenderingContext2D;
  private background: {
    width: number,
    height: number,

    coordinates: {
      [key: number]: {
        x: number,
        y: number
      }
    },

    dx: number,
    count: number,
    lastIndex?: number
  } = {
    width: 400,
    height: 715,

    coordinates: {},

    dx: 1,
    count: 3
  };
  private bird: {
    width: number,
    height: number,

    x: number,
    y: number,

    radius: number,

    speed: number,
    gravity: number,
    jump: number,
    rotation: number,

    frame: number,
    animImages: Array<HTMLImageElement>
  } = {
    width: 216,
    height: 150,

    x: 0,
    y: 0,

    radius : 20,

    speed: 0,
    gravity: 0.25,
    jump: 4.6,
    rotation: 0,

    frame: 0,
    animImages: []
  };
  private pipes: {
    width: number,
    height: number,

    position: Array<{
      type: PipePosition,
      x: number,
      y: number
    }>,

    dx: number
  } = {
    width: 105,
    height: 345,

    position : [],

    dx: 2
  };
  private frame = 0;
  private mounted = false;
  private gameState = "PAUSE";

  constructor(props: any) {
    super(props);

    this.game = React.createRef();

    this.draw = this.draw.bind(this);
    this.loop = this.loop.bind(this);
    this.drawBird = this.drawBird.bind(this);
    this.flapBird = this.flapBird.bind(this);
    this.drawPipes = this.drawPipes.bind(this);
    this.updatePipes = this.updatePipes.bind(this);
  }

  async componentDidMount() {
    const { width, count, coordinates } = this.background;

    for (let i = 0; i < count; i++) {
      coordinates[i] = {
        x: (i * width),
        y: 0
      };

      this.background.lastIndex = i;
    }

    const birdAnim: Array<HTMLImageElement> = [];

    for (let i = 0; i < 20; i++) {
      const number = i < 10 ? ("0" + i) : i;
      const path = (await import(`src/assets/Bird/Bird01/Bird01_${number}.png`)).default;

      const image = await new Promise((resolve) => {
        const image = new Image();
        image.src = path;

        image.onload = () => {
          resolve(image);
        }
      });

      birdAnim.push(image as HTMLImageElement);
    }

    this.bird.animImages = birdAnim;

    this.loop();

    document.addEventListener('click', this.flapBird);
  }

  create() {
    this.mounted = true;

    this.createBird();
  }

  draw() {
    const cvs = this.game.current;

    if (!cvs) {
      return;
    }

    const ctx = cvs.getContext("2d");

    if (!ctx) {
      return;
    }

    this.ctx = ctx;

    ctx.fillStyle = "#70c5ce";
    ctx.fillRect(0, 0, cvs.width, cvs.height);

    if (!this.mounted) {
      this.create();
    }

    this.drawBackground();
    this.drawBird();
    this.drawPipes();
  }

  update() {
    this.updateBackground();
    this.updateBird();
    this.updatePipes();
    this.updateGameState();
  }

  drawBackground() {
    const {
      width,
      height,
      count,
      coordinates,
      lastIndex
    } = this.background;

    for (let i = 0; i < count; i++) {
      const cord = coordinates[i];
      this.ctx.drawImage(background, cord.x, cord.y, width, height);

      if (cord.x <= -450 && lastIndex !== undefined) {
        cord.x = coordinates[lastIndex].x + width;
        this.background.lastIndex = lastIndex < (count - 1) ? (lastIndex + 1) : 0;
      }
    }
  }

  updateBackground() {
    const { coordinates, dx, count } = this.background;

    for (let i = 0; i < count; i++) {
      const cord = coordinates[i];
      cord.x = (cord.x - dx);
    }
  }

  createBird() {
    const cvs = this.game.current;

    if (!cvs) {
      return;
    }

    const width = defaultSize.bird.width / 1.2;
    const height = defaultSize.bird.height / 1.2;

    this.bird.width = width;
    this.bird.height = height;

    this.bird.x = 30;
    this.bird.y = (cvs.height / 2) - (height / 2);

    this.bird.rotation = 0;
  }

  drawBird() {
    const { width, height, x, y, radius, rotation, frame, animImages } = this.bird;

    const translate = {
      x: x + width / 2,
      y: y + height / 2
    };

    this.ctx.save();

    this.ctx.translate(translate.x, translate.y);
    this.ctx.rotate(rotation);
    this.ctx.translate(-translate.x, -translate.y);

    this.ctx.drawImage(animImages[frame], x, y, width, height);

    this.ctx.beginPath();
    this.ctx.arc(x + width / 2, y + height / 2, radius, 0, 2 * Math.PI);
    this.ctx.fill();
    this.ctx.lineWidth = 1;
    this.ctx.strokeStyle = 'red';
    this.ctx.stroke();

    this.ctx.restore();

    if (this.frame % 2 !== 0) {
      return;
    }

    this.bird.frame = frame !== 19 ? (frame + 1) : 0;
  }

  updateBird() {
    const { y, speed, gravity, jump } = this.bird;

    const cvs = this.game.current;

    if (!cvs) {
      return;
    }

    if (this.gameState !== "PLAY") {
      return;
    }

    this.bird.speed += gravity;
    this.bird.y += speed;

    if (speed >= jump) {
      this.bird.rotation = 90 * DEGREE;
      this.bird.frame = 1;
    } else {
      this.bird.rotation = -25 * DEGREE;
    }

    const bgHeight = this.background.height;

    // If bird up screen or down it
    if (
      (y >= bgHeight)
      || (y < -100)
    ) {
      this.gameState = "PAUSE";
    }
  }

  flapBird() {
    this.gameState = "PLAY";
    this.bird.speed =- this.bird.jump;
  }

  drawPipes() {
    const { width, height, position } = this.pipes;

    for (let i  = 0; i < position.length; i++) {
      const p = position[i];

      if (p.type === PipePosition.TOP) {
        this.ctx.drawImage(pipeTop, p.x, p.y, width, height);
      } else {
        this.ctx.drawImage(pipeBottom, p.x, (this.background.height - height - p.y), width, height);
      }
    }
  }

  updatePipes() {
    const { width, height, dx, position } = this.pipes;

    const cvs = this.game.current;

    if (!cvs) {
      return;
    }

    if (this.gameState === "STOP") {
      return;
    }

    if (this.frame % 100 === 0) {
      const lastPipe = position[position.length - 1] || { type: PipePosition.BOTTOM };

      this.pipes.position.push({
        type: lastPipe.type === PipePosition.TOP ? PipePosition.BOTTOM : PipePosition.TOP,
        x: getRandomInt(-50, 100) + cvs.width,
        y: getRandomInt(-100, -25)
      });
    }

    for (let i = 0; i < position.length; i++) {
      const p = position[i];

      const bird = {
        x: this.bird.x + this.bird.width / 2,
        y: this.bird.y + this.bird.height / 2
      };

      const bottomPipeYPos = this.background.height - height - p.y;


      if (
        (
          p.type === PipePosition.TOP
          && (bird.x + this.bird.radius > p.x)
          && (bird.x - this.bird.radius < p.x + width)
          && (bird.y + this.bird.radius > p.y)
          && (bird.y - this.bird.radius < p.y + height)
        ) || (
          p.type === PipePosition.BOTTOM
          && (bird.x + this.bird.radius > p.x)
          && (bird.x - this.bird.radius < p.x + width)
          && (bird.y + this.bird.radius > bottomPipeYPos)
          && (bird.y - this.bird.radius < bottomPipeYPos + height)
        )
      ) {
        this.gameState = "STOP";
      }

      // COLLISION DETECTION
      // TOP PIPE
      // if (bird.x + this.bird.radius > p.x && bird.x - this.bird.radius < p.x + width && bird.y + this.bird.radius > p.y && bird.y - this.bird.radius < p.y + height) {
      //   this.gameState = "PAUSE";
        // state.current = state.over;
        // HIT.play();
      // }
      // BOTTOM PIPE
      // if(bird.x + bird.radius > p.x && bird.x - bird.radius < p.x + this.w && bird.y + bird.radius > bottomPipeYPos && bird.y - bird.radius < bottomPipeYPos + this.h){
      //   state.current = state.over;
      //   HIT.play();
      // }

      p.x -= dx;

      if (p.x + width <= 0) {
        this.pipes.position.shift();
      }
    }
  }

  updateGameState() {
    if (this.gameState === "PAUSE") {
      this.createBird();
    }
  }

  updateFrame() {
    this.frame = this.frame !== 10000 ? (this.frame + 1) : 0;
  }

  loop() {
    const cvs = this.game.current;

    if (!cvs) {
      return;
    }

    const body = document.getElementsByTagName('body');
    const bodyRect = body[0].getBoundingClientRect();

    cvs.width = bodyRect.width;
    cvs.height = bodyRect.height;

    this.update();
    this.draw();

    this.updateFrame();

    requestAnimationFrame(this.loop);
  }

  render() {
    return (
      <div>
        <canvas
          className={style.game}
          ref={this.game}
        />
      </div>
    );
  }

}