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
    try {
      game.current.move({
        from: sourceSquare,
        to: targetSquare,
        promotion: "q",
      });

      setPosition(game.current.fen());
      return true;
    } catch (error) {
      setChessError("Invalid move");
      return false;
    }
  };

  return (
    <div>
      <Chessboard options={{ position, onPieceDrop }} />
      {chessError && <p>{chessError}</p>}
    </div>
  );
};

export default ChessBoard;
