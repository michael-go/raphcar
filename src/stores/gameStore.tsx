import { create } from "zustand";
import * as THREE from "three";
import React from "react";

interface GameStore {
  carRef: React.RefObject<THREE.Group>;
  coinIds: string[];
  credits: number;

  setCarRef: (ref: React.RefObject<THREE.Group>) => void;
  addCoinId: (id: string) => void;
  removeCoinId: (id: string) => void;
  addCredits: (credits: number) => void;
}

const useGameStore = create<GameStore>((set) => ({
  carRef: React.createRef(),
  coinIds: [],
  credits: 0,

  setCarRef: (ref: React.RefObject<THREE.Group>) => set({ carRef: ref }),
  addCoinId: (id: string) =>
    set((state: GameStore) => ({ coinIds: [...state.coinIds, id] })),
  removeCoinId: (id: string) =>
    set((state: GameStore) => ({
      coinIds: state.coinIds.filter((coinId: string) => coinId !== id),
    })),
  addCredits: (credits: number) =>
    set((state: GameStore) => ({ credits: state.credits + credits })),
}));

export { useGameStore };
export type { GameStore };
