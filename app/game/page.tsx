import ChessBoard from "@/components/ChessBoard";
import MoveCounter from "@/components/MoveCounter";

const ChessGame = () => {
  return (
    <>
      <h1>Chess Sensei</h1>
      <p>Your Game</p>
      <p>Chess board coming soon.</p>
      <MoveCounter />
      <div style={{ width: "800px", height: "800px" }}>
        <ChessBoard />
      </div>
    </>
  );
};

export default ChessGame;
