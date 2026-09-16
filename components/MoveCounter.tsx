"use client";
import { useState } from "react";

const MoveCounter = () => {
  const [moves, setMoves] = useState(0);
  return (
    <>
      <p>Moves practiced: {moves}</p>
      <button onClick={() => setMoves((prev) => prev + 1)}>Record move</button>
    </>
  );
};

export default MoveCounter;
