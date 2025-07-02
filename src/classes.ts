import * as PIXI from 'pixi.js';

export type Cell = {
  x: number;
  y: number;
  anim?: PIXI.AnimatedSprite;
  graf?: PIXI.Graphics;
  cell_type?: number;
};


export class PlayField {
    width: number;
    height: number;
    grid: Cell[][];

    constructor(width: number, height: number) {
    this.width = width;
    this.height = height;
    this.grid = this.createGrid();
    }
    private createGrid(): Cell[][] {
        const grid: Cell[][] = [];
        for (let y = 0; y < this.width; y++) {
            const row: Cell[] = [];
            for (let x = 0; x < this.height; x++) {
                row.push({x, y});
            };
            grid.push(row)
        };
        return grid;
    };

};