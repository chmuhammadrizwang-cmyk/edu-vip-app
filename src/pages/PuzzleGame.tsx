import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import BrandingFooter from "@/components/BrandingFooter";
import AppHeader from "@/components/AppHeader";
import AppSidebar from "@/components/AppSidebar";
import { RotateCcw, Trophy } from "lucide-react";

const PuzzleGame = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [tiles, setTiles] = useState<number[]>([]);
  const [moves, setMoves] = useState(0);
  const [won, setWon] = useState(false);

  const GRID = 4;
  const TOTAL = GRID * GRID;

  const shuffle = () => {
    const arr: number[] = [];
    for (let i = 1; i < TOTAL; i++) arr.push(i);
    arr.push(0); // 0 = empty
    // Fisher-Yates shuffle (ensure solvable)
    for (let i = arr.length - 2; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    setTiles(arr);
    setMoves(0);
    setWon(false);
  };

  useEffect(() => { shuffle(); }, []);

  const handleTileClick = (index: number) => {
    if (won || tiles[index] === 0) return;
    const emptyIdx = tiles.indexOf(0);
    const row = Math.floor(index / GRID);
    const col = index % GRID;
    const eRow = Math.floor(emptyIdx / GRID);
    const eCol = emptyIdx % GRID;

    if ((Math.abs(row - eRow) === 1 && col === eCol) || (Math.abs(col - eCol) === 1 && row === eRow)) {
      const newTiles = [...tiles];
      [newTiles[index], newTiles[emptyIdx]] = [newTiles[emptyIdx], newTiles[index]];
      setTiles(newTiles);
      setMoves((m) => m + 1);

      // Check win
      const isWon = newTiles.every((t, i) => (i === TOTAL - 1 ? t === 0 : t === i + 1));
      if (isWon) {
        setWon(true);
        toast.success(`🎉 Solved in ${moves + 1} moves!`);
      }
    }
  };

  const getColor = (n: number): string => {
    if (n === 0) return "transparent";
    const colors = [
      "bg-gradient-primary", "bg-gradient-secondary", "bg-gradient-accent",
      "bg-gradient-primary", "bg-gradient-secondary", "bg-gradient-accent",
    ];
    return colors[n % colors.length];
  };

  return (
    <div className="min-h-screen flex flex-col">
      <AppSidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <AppHeader onMenuClick={() => setSidebarOpen(true)} title="Puzzle Game" />

      <main className="flex-1 flex flex-col items-center justify-center px-4 py-6">
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="w-full max-w-sm">
          <div className="flex items-center justify-between mb-6">
            <div className="glass rounded-xl px-4 py-2">
              <p className="text-sm text-muted-foreground">Moves</p>
              <p className="text-2xl font-display font-bold text-gradient-primary">{moves}</p>
            </div>
            <button
              onClick={shuffle}
              className="flex items-center gap-2 px-4 py-3 rounded-xl bg-gradient-secondary text-secondary-foreground font-medium hover:opacity-90 transition-opacity"
            >
              <RotateCcw className="h-4 w-4" />
              Reset
            </button>
          </div>

          {won && (
            <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="mb-4 text-center glass rounded-2xl p-4 glow-primary">
              <Trophy className="h-10 w-10 text-neon-orange mx-auto mb-2" />
              <p className="font-display text-lg font-bold text-gradient-primary">You Won!</p>
            </motion.div>
          )}

          <div className="grid grid-cols-4 gap-2 glass rounded-2xl p-3">
            {tiles.map((tile, idx) => (
              <motion.button
                key={idx}
                whileTap={{ scale: 0.95 }}
                onClick={() => handleTileClick(idx)}
                className={`aspect-square rounded-xl flex items-center justify-center text-xl font-display font-bold transition-all ${
                  tile === 0
                    ? "bg-transparent"
                    : `${getColor(tile)} text-primary-foreground hover:opacity-80 glow-primary`
                }`}
              >
                {tile !== 0 && tile}
              </motion.button>
            ))}
          </div>

          <p className="text-center text-muted-foreground text-sm mt-4">
            Tap a tile next to the empty space to move it. Arrange 1-15 in order!
          </p>
        </motion.div>
      </main>

      <BrandingFooter />
    </div>
  );
};

export default PuzzleGame;
