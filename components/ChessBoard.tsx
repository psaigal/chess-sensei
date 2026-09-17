"use client";

import { useState, useRef } from "react";
import { Chess } from "chess.js";
import { Chessboard } from "react-chessboard";

const ChessBoard = () => {
  const game = useRef(new Chess());
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
      const move = game.current.move({
        from: sourceSquare,
        to: targetSquare,
        promotion: "q",
      });

      setPosition(game.current.fen());
      setIsThinking(true);
      setTimeout(() => {
        makeComputerMove();
        setIsThinking(false);
      }, 500);

      return true;
    } catch (error) {
      setChessError("Invalid move");
      return false;
    }
  };

  const makeComputerMove = () => {
    const possibleMoves = game.current.moves();
    if (possibleMoves.length === 0) return;

    const randomIndex = Math.floor(Math.random() * possibleMoves.length);

    const nextMove = possibleMoves[randomIndex];

    game.current.move(nextMove);
    setPosition(game.current.fen());
  };

  return (
    <div>
      <Chessboard options={{ position, onPieceDrop }} />
      {chessError && <p>{chessError}</p>}
      {isThinking && <p>Sensei is thinking...</p>}
    </div>
  );
};

export default ChessBoard;
