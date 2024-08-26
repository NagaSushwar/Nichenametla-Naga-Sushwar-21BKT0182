const express = require("express");
const cors = require("cors");
const http = require("http");
const socketIo = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "http://localhost:3000", // Replace with your React app URL
    methods: ["GET", "POST"],
  },
});

app.use(express.json());
app.use(
  cors({
    origin: "http://localhost:3000", // Replace with your React app URL
  })
);

const gridWidth = 5;
const gridHeight = 5;

let grid = [];

let currentPlayer = "A";
let moveHistory = {
  A: [],
  B: [],
};
const initializeBoard = (composition) => {
  grid = Array.from({ length: gridHeight }, () => Array(gridWidth).fill(""));

  // Place pieces for Player A
  let row = 0;
  for (let i = 0; i < composition.Pawns; i++) {
    grid[row][i] = `A-P${i + 1}`;
  }
  grid[row][4] = `A-H1`;
  grid[row][3] = `A-H2`;
  grid[row][2] = `A-H3`;

  // Place pieces for Player B
  row = gridHeight - 1;
  for (let i = 0; i < composition.Pawns; i++) {
    grid[row][i] = `B-P${i + 1}`;
  }
  grid[row][4] = `B-H1`;
  grid[row][3] = `B-H2`;
  grid[row][2] = `B-H3`;
};

io.on("connection", (socket) => {
  console.log("New client connected");
  socket.on("setupBoard", (composition) => {
    initializeBoard(composition);
    // Send initial board state and move history to the client
    socket.emit("boardUpdate", { grid, currentPlayer, moveHistory });
  });

  // Send initial board state and move history to the client
  socket.emit("boardUpdate", { grid, currentPlayer, moveHistory });

  // Handle move requests
  socket.on("move", ({ piece, direction }) => {
    const [row, col] = findPiecePosition(piece);
    if (row === -1 || col === -1) {
      socket.emit("error", { message: "Piece not found" });
      return;
    }

    let [, type] = piece.split("-");
    if (type[0] == "P") type = "P";
    const [newRow, newCol] = getNewPosition(row, col, direction, type);

    // Validate move
    if (
      newRow >= 0 &&
      newRow < gridHeight &&
      newCol >= 0 &&
      newCol < gridWidth
    ) {
      const targetCell = grid[newRow][newCol];
      const isCapture = targetCell && targetCell[0] !== currentPlayer;

      // Check if the target cell is occupied by the current player's piece
      if (targetCell && targetCell[0] === currentPlayer) {
        socket.emit("error", {
          message: "Invalid move: Friendly piece in the way",
        });
        return;
      }

      // Move piece
      grid[newRow][newCol] = piece;
      grid[row][col] = "";

      // Log move
      moveHistory[currentPlayer].push({
        piece,
        direction,
        from: [row, col],
        to: [newRow, newCol],
        captured: isCapture ? targetCell : null,
      });

      // Switch player
      currentPlayer = currentPlayer === "A" ? "B" : "A";

      // Check for winner
      const winner = checkWinner();
      if (winner) {
        io.emit("gameOver", { winner });
      } else {
        // Broadcast the updated board state and move history to all connected clients
        io.emit("boardUpdate", { grid, currentPlayer, moveHistory });
      }
    } else {
      socket.emit("error", { message: "Invalid move: Out of bounds" });
    }
  });

  socket.on("getPossibleMoves", ({ piece, row, col }) => {
    const possibleMoves = getPossibleMoves(
      row,
      col,
      piece,
      grid,
      currentPlayer
    );
    socket.emit("possibleMoves", { possibleMoves });
  });

  socket.on("disconnect", () => {
    console.log("Client disconnected");
  });
});

// Find the position of a piece in the grid
const findPiecePosition = (piece) => {
  for (let row = 0; row < gridHeight; row++) {
    for (let col = 0; col < gridWidth; col++) {
      if (grid[row][col] === piece) {
        return [row, col];
      }
    }
  }
  return [-1, -1];
};

// Calculate new position based on move
const getNewPosition = (row, col, move, type) => {
  let newRow = row;
  let newCol = col;

  // Reverse moves for Player B
  const isPlayerB = currentPlayer === "B";

  if (type === "P") {
    if (move === "L") newCol += isPlayerB ? 1 : -1;
    if (move === "R") newCol += isPlayerB ? -1 : 1;
    if (move === "F") newRow += isPlayerB ? 1 : -1;
    if (move === "B") newRow += isPlayerB ? -1 : 1;
  } else if (type === "H1") {
    if (move === "L") newCol += isPlayerB ? 2 : -2;
    if (move === "R") newCol += isPlayerB ? -2 : 2;
    if (move === "F") newRow += isPlayerB ? 2 : -2;
    if (move === "B") newRow += isPlayerB ? -2 : 2;
  } else if (type === "H2") {
    // Hero2's diagonal movement logic
    if (move === "FL") {
      newRow += isPlayerB ? 2 : -2;
      newCol += isPlayerB ? 2 : -2;
    }
    if (move === "FR") {
      newRow += isPlayerB ? 2 : -2;
      newCol += isPlayerB ? -2 : 2;
    }
    if (move === "BL") {
      newRow += isPlayerB ? -2 : 2;
      newCol += isPlayerB ? 2 : -2;
    }
    if (move === "BR") {
      newRow += isPlayerB ? -2 : 2;
      newCol += isPlayerB ? -2 : 2;
    }
  } else if (type === "H3") {
    // Hero3's movement logic
    if (move === "FL") {
      newRow += isPlayerB ? 2 : -2;
      newCol += isPlayerB ? -1 : 1;
    }
    if (move === "FR") {
      newRow += isPlayerB ? 2 : -2;
      newCol += isPlayerB ? 1 : -1;
    }
    if (move === "BL") {
      newRow += isPlayerB ? -2 : 2;
      newCol += isPlayerB ? -1 : 1;
    }
    if (move === "BR") {
      newRow += isPlayerB ? -2 : 2;
      newCol += isPlayerB ? 1 : -1;
    }
    if (move === "RF") {
      newRow += isPlayerB ? 1 : -1;
      newCol += isPlayerB ? 2 : -2;
    }
    if (move === "RB") {
      newRow += isPlayerB ? -1 : 1;
      newCol += isPlayerB ? 2 : -2;
    }
    if (move === "LF") {
      newRow += isPlayerB ? 1 : -1;
      newCol += isPlayerB ? -2 : 2;
    }
    if (move === "LB") {
      newRow += isPlayerB ? -1 : 1;
      newCol += isPlayerB ? -2 : 2;
    }
  }

  return [newRow, newCol];
};

// Example of handling possible moves on the server
const getPossibleMoves = (row, col, piece, grid, currentPlayer) => {
  const moves = [];
  let [, type] = piece.split("-");
  if (type[0] == "P") type = "P";

  const directions = {
    P: ["L", "R", "F", "B"],
    H1: ["L", "R", "F", "B"],
    H2: ["FL", "FR", "BL", "BR"],
    H3: ["FL", "FR", "BL", "BR", "RF", "RB", "LF", "LB"],
  };

  directions[type].forEach((move) => {
    let [newRow, newCol] = getNewPosition(row, col, move, type);

    if (
      newRow >= 0 &&
      newRow < grid.length &&
      newCol >= 0 &&
      newCol < grid[0].length
    ) {
      // Only add move if the target cell is empty or contains an opponent's piece
      if (
        grid[newRow][newCol] === "" ||
        grid[newRow][newCol][0] !== currentPlayer
      ) {
        moves.push([newRow, newCol]);
      }
    }
  });

  return moves;
};

// Check if there is a winner
const checkWinner = () => {
  let playerAPieces = 0;
  let playerBPieces = 0;

  for (let row = 0; row < gridHeight; row++) {
    for (let col = 0; col < gridWidth; col++) {
      if (grid[row][col] && grid[row][col][0] === "A") playerAPieces++;
      if (grid[row][col] && grid[row][col][0] === "B") playerBPieces++;
    }
  }

  if (playerAPieces === 0) return "B";
  if (playerBPieces === 0) return "A";

  return null; // No winner yet
};

server.listen(4000, () => {
  console.log("Server is running on port 4000");
});
