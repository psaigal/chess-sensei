"use client";

import { useState, useRef, useEffect } from "react";
import { Chess } from "chess.js";
import { Chessboard } from "react-chessboard";

type Analysis = {
  evaluation: number;
  bestMove: string;
  sideToMove: "white" | "black";
};

type TotalAnalysis = {
  before: Analysis | null;
  after: Analysis | null;
};

type PendingMove = {
  attemptedMove: string;
  gameFen: string;
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
  const sideToMove = useRef<"white" | "black">("white");
  const analysisPurpose = useRef<"before" | "after">("before");
  const pendingUserMove = useRef<PendingMove | null>(null);

  console.log({ analysis });

  const normalizeEval = (analysis: Analysis) => {
    const { sideToMove, evaluation } = analysis;
    if (sideToMove === "black") {
      return -evaluation;
    }
    return evaluation;
  };

  const centipawnLoss = (analysisBefore: Analysis, analysisAfter: Analysis) => {
    const normalizeBefore = normalizeEval(analysisBefore);
    const normalizeAfter = normalizeEval(analysisAfter);

    return normalizeBefore - normalizeAfter;
  };

  const analyzePosition = (purpose: "before" | "after") => {
    sideToMove.current = game.current.turn() === "b" ? "black" : "white";
    analysisPurpose.current = purpose;

    stockfishWorker.current?.postMessage(`position fen ${game.current.fen()}`);
    stockfishWorker.current?.postMessage("go depth 10");
  };

  const onPieceDrop = ({
    sourceSquare,
    targetSquare,
  }: {
    sourceSquare: string;
    targetSquare: string;
  }) => {
    setChessError(null);
    pendingUserMove.current = null;

    const isComputerTurn = game.current.turn() === "b";

    if (isComputerTurn) {
      return false;
    }
    const fenBeforeMove = game.current.fen();

    try {
      game.current.move({
        from: sourceSquare,
        to: targetSquare,
        promotion: "q",
      });

      analyzePosition("after");

      pendingUserMove.current = {
        attemptedMove: `${sourceSquare}${targetSquare}`,
        gameFen: fenBeforeMove,
      };

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
        analyzePosition("before");
      }
      const match = eventData.match(/score cp (-?\d+)/);
      if (match) {
        latestScore.current = Number(match[1]);
      }

      const bestMove = eventData.match(/bestmove (\S+)/);
      if (bestMove) {
        if (analysisPurpose.current === "after") {
          setIsThinking(false);
        }
        setAnalysis((prev) => {
          if (analysisPurpose.current === "before") {
            return {
              ...prev,
              before: {
                evaluation: latestScore.current!,
                bestMove: bestMove[1],
                sideToMove: sideToMove.current,
              },
            };
          } else {
            return {
              ...prev,
              after: {
                evaluation: latestScore.current!,
                bestMove: bestMove[1],
                sideToMove: sideToMove.current,
              },
            };
          }
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
    const fetchExplanation = async (totalLoss: number) => {
      try {
        const explanationRes = await fetch("/api/explain", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            pendingUserMove: pendingUserMove.current,
            analysisBefore: analysis.before,
            analysisAfter: analysis.after,
            totalLoss: totalLoss,
          }),
        });

        const responseJson = await explanationRes.json();
        console.log(responseJson);
      } catch (error) {
        console.error("Failed to fetch");
      }
    };

    if (analysis.before && analysis.after) {
      const totalLoss = centipawnLoss(analysis.before, analysis.after);
      if (totalLoss < 150) {
        const sourceSquare = analysis.after.bestMove.slice(0, 2);
        const targetSquare = analysis.after.bestMove.slice(2, 4);

        game.current.move({
          from: sourceSquare,
          to: targetSquare,
          promotion: "q",
        });

        setPosition(game.current.fen());

        setAnalysis((prev) => {
          return { before: null, after: null };
        });

        analyzePosition("before");
      } else {
        game.current.undo();
        setPosition(game.current.fen());
        setAnalysis((prev) => {
          return { ...prev, after: null };
        });
        fetchExplanation(totalLoss);
      }
    }
  }, [analysis]);

  return (
    <div>
      <Chessboard options={{ position, onPieceDrop }} />
      {chessError && <p>{chessError}</p>}
      {isThinking && <p>Sensei is thinking...</p>}
    </div>
  );
};

export default ChessBoard;
