"use client";

import { useState, useRef, useEffect } from "react";
import { Chess } from "chess.js";
import { Chessboard } from "react-chessboard";

type Analysis = {
  evaluation: number;
  bestMove: string;
};

type TotalAnalysis = {
  before: Analysis | null;
  after: Analysis | null;
};

const ChessBoard = () => {
  const game = useRef(new Chess());
  const stockfishWorker = useRef<Worker | null>(null);

  const [position, setPosition] = useState(game.current.fen());
  const [chessError, setChessError] = useState<string | null>(null);
  const [analysis, setAnalysis] = useState<TotalAnalysis>({
    before: null,
    after: null,
  });
  const [isThinking, setIsThinking] = useState(false);
  const latestScore = useRef<number | null>(null);

  console.log({ analysis });

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

      stockfishWorker.current?.postMessage(
        `position fen ${game.current.fen()}`,
      );
      stockfishWorker.current?.postMessage("go depth 10");

      setPosition(game.current.fen());
      setIsThinking(true);

      return true;
    } catch (error) {
      setChessError("Invalid move");
      return false;
    }
  };

  // intial setup for Stockfish
  useEffect(() => {
    stockfishWorker.current = new Worker(
      "/stockfish/stockfish-19-lite-single.js",
    );

    stockfishWorker.current.onmessage = (event) => {
      const eventData = event.data;
      if (eventData === "uciok") {
        stockfishWorker.current?.postMessage(
          `position fen ${game.current.fen()}`,
        );
        stockfishWorker.current?.postMessage("go depth 10");
      }
      const match = eventData.match(/score cp (-?\d+)/);
      if (match) {
        latestScore.current = Number(match[1]);
      }

      const bestMove = eventData.match(/bestmove (\S+)/);
      if (bestMove) {
        setAnalysis((prev) => {
          return {
            ...prev,
            before: {
              evaluation: latestScore.current!,
              bestMove: bestMove[1],
            },
          };
        });
      }
    };

    stockfishWorker.current.postMessage("uci");

    return () => {
      if (stockfishWorker.current) {
        stockfishWorker.current.terminate();
        stockfishWorker.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (!isThinking) {
      return;
    }

    const timer = setTimeout(() => {
      setIsThinking(false);
    }, 500);

    return () => clearTimeout(timer);
  }, [isThinking]);

  return (
    <div>
      <Chessboard options={{ position, onPieceDrop }} />
      {chessError && <p>{chessError}</p>}
      {isThinking && <p>Sensei is thinking...</p>}
    </div>
  );
};

export default ChessBoard;
