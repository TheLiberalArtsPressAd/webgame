import { newGame, type GameState } from './state';

export type { GameState };

/** 全域遊戲工作階段 */
export const session = {
  state: newGame() as GameState
};
