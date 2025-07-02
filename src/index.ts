import * as PIXI from 'pixi.js';
import {gsap} from 'gsap';
import { Cell, PlayField } from './classes';
import * as setting from './game_setting'

const app = new PIXI.Application();
await app.init({ 
    width: setting.cell_delta_x * setting.grid_width + 20, 
    height: setting.cell_delta_y * setting.grid_height + 100, 
    backgroundColor: 0x333333,
    antialias: true,
    resolution: 1,
    preference: 'webgl',
});
document.body.appendChild(app.canvas);

let score = 0;
const score_text = new PIXI.Text({
    text: "Score: 0",
    style: {
        fontFamily: 'COMIC SANS MS',
        fontSize: 24,
        fill: 'white',
        align: 'center',
    },
    anchor: 0.5,
})
score_text.position.set(setting.cell_delta_x * setting.grid_width / 2, setting.cell_delta_y * setting.grid_height + 60)
app.stage.addChild(score_text)

function updateScore (cells: Cell[]) {
    score += cells.length;
    score_text.text = "Score: " + score;
};


function getRandomInt(min:number, max:number) {
  const minCeiled = Math.ceil(min);
  const maxFloored = Math.floor(max);
  return Math.floor(Math.random() * (maxFloored - minCeiled + 1) + minCeiled);
}

const sheetTexture = await PIXI.Assets.load('cube.png');
const global_frames = [];
PIXI.Assets.add({
    alias: 'cube_anim',
    src: 'cube.json',
    data: {texture: sheetTexture}
    });
const sheet = await PIXI.Assets.load('cube_anim')
const frames:PIXI.Texture[] = [];
for (let index = 1; index < 12; index++) {
    const texture = sheet.textures['sprite'+ index + '.png']
    if (texture) {
        frames.push(texture)
    };
  
};

function getMatches() {
    const matches: Set<Cell> = new Set();

    for (let y = 0; y < setting.grid_height; y++) {
        for (let x = 0; x < setting.grid_width - 2; x++) {
            const c1 = play_field.grid[y][x];
            const c2 = play_field.grid[y][x + 1];
            const c3 = play_field.grid[y][x + 2];
            if (c1.cell_type == c2.cell_type && c3.cell_type == c2.cell_type) {
                matches.add(c1);
                matches.add(c2);
                matches.add(c3);
            }
        }
    }

    for (let x = 0; x < setting.grid_width; x++) {
        for (let y = 0; y < setting.grid_height - 2; y++) {
            const c1 = play_field.grid[y][x];
            const c2 = play_field.grid[y + 1][x];
            const c3 = play_field.grid[y + 2][x];
            if (c1.cell_type == c2.cell_type && c3.cell_type == c2.cell_type) {
                matches.add(c1);
                matches.add(c2);
                matches.add(c3);
            }
        }
    }
    return [...matches];
}

function checkCube (cube: Cell) {
    const vertikal_comb: Cell[] = [];
    const horizontal_comb: Cell[] = [];
    let negitive_x = cube.x - 1;
    while (negitive_x >= 0 && play_field.grid[cube.y][negitive_x].cell_type == cube.cell_type) {
        horizontal_comb.push(play_field.grid[cube.y][negitive_x])
        negitive_x -= 1;
    };
    let positive_x = cube.x + 1;
    while (positive_x < setting.grid_width && play_field.grid[cube.y][positive_x].cell_type == cube.cell_type) {
        horizontal_comb.push(play_field.grid[cube.y][positive_x])
        positive_x += 1;
    };
    let positive_y = cube.y + 1;
    while (positive_y <setting.grid_height && play_field.grid[positive_y][cube.x].cell_type == cube.cell_type) {
        vertikal_comb.push(play_field.grid[positive_y][cube.x])
        positive_y += 1;
    };

    let negative_y = cube.y - 1;
    while (negative_y >= 0 && play_field.grid[negative_y][cube.x].cell_type == cube.cell_type) {
        vertikal_comb.push(play_field.grid[negative_y][cube.x])
        negative_y -= 1;
    }
    
    if (horizontal_comb.length >= 2 && vertikal_comb.length >= 2) {
        return horizontal_comb.concat(vertikal_comb);
    } else if (horizontal_comb.length >= 2) {
        return horizontal_comb;
    } else if (vertikal_comb.length >= 2) {
        return vertikal_comb;
    } else {
        return []
    }
    
};

function getCubeNeighbours (x: number, y:number) {
    const neighbours: Cell[] = [];
    if (x > 0) {
        neighbours.push(play_field.grid[y][x - 1])
    }
    if (x < setting.grid_width - 1) {
        neighbours.push(play_field.grid[y][x + 1])
    }
    if (y > 0) {
        neighbours.push(play_field.grid[y - 1][x])
    }
    if (y < setting.grid_height - 1) {
        neighbours.push(play_field.grid[y + 1][x])
    }
    return neighbours
}

function lightOn (cells: Cell[]) {
    cells.forEach(element => {
        if (element.graf) {
            gsap.to(element.graf, {alpha:1, duration:0.2})
        }
    });

}
function lightOff(cells: Cell[]) {
    cells.forEach(element => {
        if (element.graf) {
            gsap.to(element.graf, {alpha:0, duration:0.2})
        }
    });
}

function swapCubes(cubes:Cell[]) {
    [cubes[1].cell_type, cubes[0].cell_type] = [cubes[0].cell_type, cubes[1].cell_type];
    [cubes[1].anim, cubes[0].anim] = [cubes[0].anim, cubes[1].anim];
    cubes.forEach(element => {
        if (element.anim) {
            gsap.to(element.anim, {x:element.graf?.position.x, y:element.graf?.position.y, duration:0.5})
        }
    });
}

function collapseCells () {
    for (let x = 0; x < setting.grid_width; x++) {
        let emptyCount = 0;
        for (let y = setting.grid_height - 1; y >= 0; y--) {
            const cell = play_field.grid[y][x];
            if (cell.cell_type == 0) {
                emptyCount += 1;
            } else if (emptyCount > 0) {
                const target = play_field.grid[y + emptyCount][x];
                target.cell_type = cell.cell_type;
                target.anim = cell.anim;
                if (cell.anim) {
                    gsap.to(cell.anim, {y: target.graf?.position.y, duration:0.4})
                }
            }
        }
        for (let index = 0; index < emptyCount; index++) {
            const cell = play_field.grid[index][x];
            cell.cell_type = getRandomInt(1, 4);
            cell.anim = createCubeAnim(cell.cell_type, cell.x, cell.y);
            cell.anim.alpha = 0;
            gsap.delayedCall(0.4, () => {
                if (cell.anim) {
                    gsap.to(cell.anim, {alpha: 1, duration:0.2})
                }
            }); 
        }
    }
    gsap.delayedCall(0.8, () => {
        const matches: Cell[] = getMatches();
        if (matches.length > 0) {
            removeMatches(matches)
        } else {
            blockClicks = false;
        };
    }); 
}
function removeMatches(matches: Cell[]) {
        matches.forEach(element => {
            if (element.anim) {
                element.anim.play()
                element.anim.onComplete = () => {
                    if (element.anim){
                        app.stage.removeChild(element.anim);
                        element.anim.destroy();
                    }
                };
                element.cell_type = 0;
            }
        });
        updateScore(matches)
        gsap.delayedCall(0.5, () => {
            collapseCells()
        });
};
const clicked_cubes: Cell[] = [];
let blockClicks: boolean = false;
function cubeClick (cube: PIXI.Graphics, x: number, y:number) {
    cube.interactive = true;
    cube.cursor = 'pointer'; 
    cube.onclick = (Event) => {
        if (blockClicks) {
            return
        }
        if (clicked_cubes.length < 1) {
            clicked_cubes.push(play_field.grid[y][x])
            const neighbours = getCubeNeighbours(x, y)
            lightOn(neighbours)
        } else if (clicked_cubes.length == 1) {
            const first_neighbours: Cell[] = getCubeNeighbours(clicked_cubes[0].x, clicked_cubes[0].y)
            if (clicked_cubes[0] == play_field.grid[y][x]) {
                clicked_cubes.pop()
                lightOff(first_neighbours)
            } else if (first_neighbours.includes(play_field.grid[y][x])) {
                lightOff(first_neighbours)
                clicked_cubes.push(play_field.grid[y][x])
                blockClicks = true;
                swapCubes(clicked_cubes)
                clicked_cubes.length = 0;
                const matches: Cell[] = getMatches();
                if (matches.length > 0) {
                    gsap.delayedCall(0.51, () => {
                        removeMatches(matches)
                    });
                } else {
                    blockClicks = false;
                };
            } else {
                clicked_cubes.pop()
                clicked_cubes.push(play_field.grid[y][x])
                const neighbours = getCubeNeighbours(x, y)
                lightOff(first_neighbours)
                lightOn(neighbours)
            };
        };
    };
};

function createCubeAnim (cube_type: number, x: number, y: number) {
    const cube_anim = new PIXI.AnimatedSprite(frames);
    cube_anim.animationSpeed = 0.4;
    cube_anim.loop = false;
    cube_anim.anchor.set(0.5);
    cube_anim.tint = setting.type_colors[cube_type - 1];
    const x_local = setting.start_x_pos + x * setting.cell_delta_x;
    const y_local = setting.start_y_pos + y * setting.cell_delta_y;
    cube_anim.position.set(x_local, y_local);
    app.stage.addChild(cube_anim);
    return cube_anim
}

function createCubeGraf (x: number, y: number) {
    const graphics = new PIXI.Graphics();
    graphics.rect(-setting.cell_width/2, -setting.cell_height/2, setting.cell_width, setting.cell_height);
    graphics.fill({color: 0xffffff, alpha: 0})
    graphics.stroke(0xffffff);
    const x_local = setting.start_x_pos + x * setting.cell_delta_x;
    const y_local = setting.start_y_pos + y * setting.cell_delta_y;
    graphics.position.set(x_local, y_local)
    graphics.alpha = 0;
    return graphics
}

const play_field = new PlayField(10, 10);
play_field.grid.forEach(element => {
    element.forEach(el => {
        el.cell_type = getRandomInt(1, setting.type_colors.length);
        let comb: Cell[] = checkCube(el)
        while (comb.length > 1) {
            el.cell_type = getRandomInt(1, setting.type_colors.length);
            comb = checkCube(el)
        }
        el.anim = createCubeAnim(el.cell_type, el.x, el.y);
        const cube_graf = createCubeGraf(el.x, el.y);
        el.graf = cube_graf;
        app.stage.addChild(el.graf);
        cubeClick(cube_graf, el.x, el.y);
    });
    
});