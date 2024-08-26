import React, { useState, useEffect } from "react";
import io from "socket.io-client";

const socket = io("http://localhost:4000");

function App() {
  const [grid, setGrid] = useState([]);
  const [selectedPiece, setSelectedPiece] = useState(null);
  const [currentPlayer, setCurrentPlayer] = useState("A");
  const [gameOver, setGameOver] = useState(false);
  const [winner, setWinner] = useState(null);
  const [moveHistory, setMoveHistory] = useState({ A: [], B: [] });
  const [possibleMoves, setPossibleMoves] = useState([]);
  function refreshPage() {
    window.location.reload();
  }
  useEffect(() => {
    socket.on("boardUpdate", ({ grid, currentPlayer, moveHistory }) => {
      setGrid(grid);
      setCurrentPlayer(currentPlayer);
      setMoveHistory(moveHistory);
    });

    socket.on("gameOver", ({ winner }) => {
      setGameOver(true);
      setWinner(winner);
    });

    socket.on("error", ({ message }) => {
      alert(message);
    });

    socket.on("possibleMoves", ({ possibleMoves }) => {
      setPossibleMoves(possibleMoves);
    });

    return () => {
      socket.off("boardUpdate");
      socket.off("gameOver");
      socket.off("error");
      socket.off("possibleMoves");
    };
  }, []);

  const handlePieceClick = (piece, rowIndex, colIndex) => {
    if (piece && piece.startsWith(currentPlayer) && !gameOver) {
      setSelectedPiece(piece);
      socket.emit("getPossibleMoves", { piece, row: rowIndex, col: colIndex });
    }
  };

  const handleMove = (direction) => {
    if (!selectedPiece || gameOver) return;
    socket.emit("move", {
      piece: selectedPiece,
      direction,
    });
    setSelectedPiece(null);
    setPossibleMoves([]);
  };

  const displayGrid = grid;

  return (
    <div className="app">
      <button
        type="button"
        onClick={refreshPage}
        style={{
          backgroundColor: "#007bff" /* Bright blue background */,
          border: "none",
          color: "white" /* White text */,
          padding: "15px 30px" /* Larger padding for a bigger button */,
          textAlign: "center",
          textDecoration: "none",
          display: "inline-block",
          fontSize: "24px" /* Large font size */,
          fontWeight: "bold" /* Bold text */,
          margin: "10px 5px",
          cursor: "pointer",
          borderRadius: "12px" /* Rounded corners */,
          transition:
            "background-color 0.3s ease, transform 0.2s ease" /* Smooth transitions */,
        }}
        onMouseOver={(e) => {
          e.currentTarget.style.backgroundColor =
            "#0056b3"; /* Darker blue on hover */
          e.currentTarget.style.transform =
            "scale(1.05)"; /* Slightly enlarge button on hover */
        }}
        onMouseOut={(e) => {
          e.currentTarget.style.backgroundColor =
            "#007bff"; /* Original color */
          e.currentTarget.style.transform = "scale(1)"; /* Reset size */
        }}
        onMouseDown={(e) => {
          e.currentTarget.style.backgroundColor =
            "#004080"; /* Even darker blue when button is pressed */
        }}
        onMouseUp={(e) => {
          e.currentTarget.style.backgroundColor =
            "#0056b3"; /* Return to hover color */
        }}
      >
        <span>Start Game</span>
      </button>

      <div className="current-player">Current Player: {currentPlayer}</div>
      {gameOver && <div className="game-over">Game Over! Winner: {winner}</div>}
      <div className="grid">
        {displayGrid.map((row, rowIndex) =>
          row.map((piece, colIndex) => {
            const isPossibleMove = possibleMoves.some(
              ([r, c]) => r === rowIndex && c === colIndex
            );

            return (
              <div
                key={`${rowIndex}-${colIndex}`}
                className={`cell ${piece === selectedPiece ? "selected" : ""} ${
                  isPossibleMove ? "possible-move" : ""
                }`}
                onClick={() => handlePieceClick(piece, rowIndex, colIndex)}
              >
                {piece}
              </div>
            );
          })
        )}
      </div>
      <div className="selected-piece">Selected: {selectedPiece}</div>
      <div className="controls">
        {selectedPiece && selectedPiece.includes("P") && (
          <>
            <button onClick={() => handleMove("L")}>R</button>
            <button onClick={() => handleMove("R")}>L</button>
            <button onClick={() => handleMove("B")}>F</button>
            <button onClick={() => handleMove("F")}>B</button>
          </>
        )}
        {selectedPiece && selectedPiece.includes("H1") && (
          <>
            <button onClick={() => handleMove("L")}>R</button>
            <button onClick={() => handleMove("R")}>L</button>
            <button onClick={() => handleMove("F")}>B</button>
            <button onClick={() => handleMove("B")}>F</button>
          </>
        )}
        {selectedPiece && selectedPiece.includes("H2") && (
          <>
            <button onClick={() => handleMove("FL")}>BL</button>
            <button onClick={() => handleMove("FR")}>BR</button>
            <button onClick={() => handleMove("BL")}>FR</button>
            <button onClick={() => handleMove("BR")}>FL</button>
          </>
        )}
        {selectedPiece && selectedPiece.includes("H3") && (
          <>
            <button onClick={() => handleMove("FL")}>BL</button>
            <button onClick={() => handleMove("FR")}>BR</button>
            <button onClick={() => handleMove("BL")}>FL</button>
            <button onClick={() => handleMove("BR")}>FR</button>
            <button onClick={() => handleMove("RF")}>RB</button>
            <button onClick={() => handleMove("RB")}>RF</button>
            <button onClick={() => handleMove("LF")}>LB</button>
            <button onClick={() => handleMove("LB")}>LF</button>
          </>
        )}
      </div>
      <div className="move-history">
        <h2>Move History</h2>
        <div className="history-list">
          {["A", "B"].map((player) => (
            <div key={player}>
              <h3>Player {player}</h3>
              <ul>
                {moveHistory[player].map((move, index) => (
                  <li key={index}>
                    {player}-{move.piece}: {move.direction}{" "}
                    {move.captured && (
                      <span style={{ color: "red" }}>
                        {" "}
                        - Captured {move.captured}
                      </span>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
      <style jsx>{`
        .app {
          text-align: center;
          color: grey;
          background-color: #333;
          padding: 20px;
        }

        .current-player {
          font-size: 1.5em;
          margin-bottom: 20px;
          color: #fff;
        }

        .game-over {
          font-size: 2em;
          margin-top: 20px;
          color: #ff0000;
        }

        .grid {
          display: grid;
          grid-template-columns: repeat(5, 60px);
          grid-gap: 5px;
          margin: 20px auto;
          justify-content: center;
        }

        .cell {
          width: 60px;
          height: 60px;
          display: flex;
          align-items: center;
          justify-content: center;
          background-color: #444;
          border: 1px solid #555;
          color: white;
          font-weight: bold;
          cursor: pointer;
          user-select: none;
        }

        .cell.selected {
          background-color: #007bff;
          color: #333;
        }

        .cell.possible-move {
          background-color: #28a745;
          color: #333;
        }

        .cell:hover:not(.selected):not(.possible-move) {
          background-color: #555;
        }

        .selected-piece {
          margin-top: 20px;
          font-size: 1.2em;
          color: #fff;
        }

        .controls {
          margin-top: 20px;
        }

        .controls button {
          margin: 5px;
          padding: 10px 20px;
          background-color: #007bff;
          color: white;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          font-size: 1em;
        }

        .controls button:hover {
          background-color: #0056b3;
        }

        .move-history {
          margin-top: 30px;
          color: #fff;
        }

        .history-list {
          text-align: left;
          margin: 0 auto;
          display: inline-block;
        }

        .history-list h3 {
          margin-bottom: 10px;
        }

        .history-list ul {
          list-style-type: none;
          padding: 0;
        }

        .history-list li {
          margin: 5px 0;
        }
      `}</style>
    </div>
  );
}

export default App;
