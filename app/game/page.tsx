import ChessBoard from "@/components/ChessBoard";
import MoveCounter from "@/components/MoveCounter";

const ChessGame = () => {
  return (
    <>
      <h1>Chess Sensei</h1>
      <p>Your Game</p>
      <p>Chess board coming soon.</p>
      <MoveCounter />
      <ChessBoard />
    </>
  );
};

export default ChessGame;
