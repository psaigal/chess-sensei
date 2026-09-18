"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Chess } from "chess.js";
import { Chessboard } from "react-chessboard";

const ChessBoard = () => {
  const game = useRef(new Chess());
  const stockfishWorker = useRef<Worker | null>(null);

  const [position, setPosition] = useState(game.current.fen());
  const [chessError, setChessError] = useState<string | null>(null);
  const [isThinking, setIsThinking] = useState(false);

  const onPieceDrop = ({
    sourceSquare,
    targetSquare,
  }: {
    sourceSquare: string;
    targetSquare: string;
  }) => {
    setChessError(null);

    const isComputerTurn = game.current.turn() === "b";

    if (isComputerTurn) {
      return false;
    }
    try {
      game.current.move({
        from: sourceSquare,
        to: targetSquare,
        promotion: "q",
      });

      setPosition(game.current.fen());
      setIsThinking(true);

      return true;
    } catch (error) {
      setChessError("Invalid move");
      return false;
    }
  };

  const makeComputerMove = useCallback(() => {
    const possibleMoves = game.current.moves();
    if (possibleMoves.length === 0) return;

    const randomIndex = Math.floor(Math.random() * possibleMoves.length);

    const nextMove = possibleMoves[randomIndex];

    game.current.move(nextMove);
    setPosition(game.current.fen());
  }, []);

  useEffect(() => {
    stockfishWorker.current = new Worker(
      new URL("../workers/stockfish.worker.ts", import.meta.url),
    );

    stockfishWorker.current.onmessage = (event) => {
      console.log(event.data);
    };

    stockfishWorker.current.postMessage("hello");

    return () => {
      if (stockfishWorker.current) {
        stockfishWorker.current.terminate();
      }
    };
  }, []);

  useEffect(() => {
    if (!isThinking) {
      return;
    }

    const timer = setTimeout(() => {
      makeComputerMove();
      setIsThinking(false);
    }, 500);

    return () => clearTimeout(timer);
  }, [isThinking, makeComputerMove]);

  return (
    <div>
      <Chessboard options={{ position, onPieceDrop }} />
      {chessError && <p>{chessError}</p>}
      {isThinking && <p>Sensei is thinking...</p>}
    </div>
  );
};

export default ChessBoard;
