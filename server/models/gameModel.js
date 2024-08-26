// server/models/gameModel.js

// Initialize the game state
function initializeGame(data) {
  const { player1, player2 } = data;

  const gameState = {
    board: Array(5)
      .fill()
      .map(() => Array(5).fill(null)),
    players: {
      0: {
        id: player1.id,
        characters: player1.characters,
        positions: player1.positions,
      },
      1: {
        id: player2.id,
        characters: player2.characters,
        positions: player2.positions,
      },
    },
    turn: 0, // Player 0 starts
    status: "ONGOING",
  };

  // Place characters on the board
  placeCharacters(gameState);

  return gameState;
}

// Place characters on the board based on initial positions
function placeCharacters(gameState) {
  gameState.players[0].positions.forEach(({ name, x, y }) => {
    gameState.board[x][y] = { player: 0, name };
  });

  gameState.players[1].positions.forEach(({ name, x, y }) => {
    gameState.board[x][y] = { player: 1, name };
  });
}

// Validate and process a move
function processMove(gameState, player, character, move) {
  if (gameState.status !== "ONGOING") {
    return { success: false, message: "Game over" };
  }

  if (gameState.turn !== player) {
    return { success: false, message: "Not your turn" };
  }

  const playerCharacters = gameState.players[player].characters;
  if (!playerCharacters.includes(character)) {
    return { success: false, message: "Invalid character" };
  }

  const characterPosition = findCharacterPosition(gameState, player, character);
  if (!characterPosition) {
    return { success: false, message: "Character not found" };
  }

  const moveResult = applyMove(
    gameState,
    player,
    character,
    characterPosition,
    move
  );
  if (moveResult.success) {
    gameState.turn = (gameState.turn + 1) % 2; // Switch turns
    checkGameEnd(gameState);
  }
  return moveResult;
}

// Find the position of a character
function findCharacterPosition(gameState, player, character) {
  return gameState.players[player].positions.find(
    (pos) => pos.name === character
  );
}

// Apply a move to the game state
function applyMove(gameState, player, character, characterPosition, move) {
  const { x, y } = characterPosition;
  let newX = x;
  let newY = y;
  const characterType = gameState.board[x][y]?.name.slice(0, 2); // Extract character type

  switch (characterType) {
    case "P1":
    case "P2":
    case "P3": // Assuming 'P1', 'P2', 'P3' are Pawns
      ({ newX, newY } = movePawn(x, y, move));
      break;
    case "H1":
      ({ newX, newY } = moveHero1(x, y, move));
      break;
    case "H2":
      ({ newX, newY } = moveHero2(x, y, move));
      break;
    case "H3":
      ({ newX, newY } = moveHero3(x, y, move));
      break;
    default:
      return { success: false, message: "Invalid character type" };
  }

  if (
    !isInBounds(newX, newY) ||
    gameState.board[newX][newY]?.player === player
  ) {
    return { success: false, message: "Invalid move" };
  }

  // Capture opponent piece if present
  if (
    gameState.board[newX][newY] &&
    gameState.board[newX][newY].player !== player
  ) {
    removeCharacter(
      gameState,
      gameState.board[newX][newY].player,
      gameState.board[newX][newY].name
    );
  }

  // Move character
  gameState.board[x][y] = null;
  gameState.board[newX][newY] = { player, name: character };
  updateCharacterPosition(gameState, player, character, newX, newY);

  return { success: true, gameState };
}

// Move Pawn
function movePawn(x, y, move) {
  switch (move) {
    case "L":
      return { newX: x, newY: y - 1 };
    case "R":
      return { newX: x, newY: y + 1 };
    case "F":
      return { newX: x - 1, newY: y };
    case "B":
      return { newX: x + 1, newY: y };
    default:
      return { newX: x, newY: y };
  }
}

// Move Hero1
function moveHero1(x, y, move) {
  switch (move) {
    case "L":
      return { newX: x, newY: y - 2 };
    case "R":
      return { newX: x, newY: y + 2 };
    case "F":
      return { newX: x - 2, newY: y };
    case "B":
      return { newX: x + 2, newY: y };
    default:
      return { newX: x, newY: y };
  }
}

// Move Hero2
function moveHero2(x, y, move) {
  switch (move) {
    case "FL":
      return { newX: x - 2, newY: y - 2 };
    case "FR":
      return { newX: x - 2, newY: y + 2 };
    case "BL":
      return { newX: x + 2, newY: y - 2 };
    case "BR":
      return { newX: x + 2, newY: y + 2 };
    default:
      return { newX: x, newY: y };
  }
}

// Move Hero3
function moveHero3(x, y, move) {
  switch (move) {
    case "FL":
      return { newX: x - 2, newY: y - 1 };
    case "FR":
      return { newX: x - 2, newY: y + 1 };
    case "BL":
      return { newX: x + 2, newY: y - 1 };
    case "BR":
      return { newX: x + 2, newY: y + 1 };
    case "RF":
      return { newX: x + 1, newY: y + 2 };
    case "RB":
      return { newX: x - 1, newY: y + 2 };
    case "LF":
      return { newX: x + 1, newY: y - 2 };
    case "LB":
      return { newX: x - 1, newY: y - 2 };
    default:
      return { newX: x, newY: y };
  }
}

// Check if the position is within bounds of the board
function isInBounds(x, y) {
  return x >= 0 && x < 5 && y >= 0 && y < 5;
}

// Remove a character from the game
function removeCharacter(gameState, player, character) {
  gameState.players[player].positions = gameState.players[
    player
  ].positions.filter((pos) => pos.name !== character);
}

// Update the position of a character
function updateCharacterPosition(gameState, player, character, x, y) {
  const pos = gameState.players[player].positions.find(
    (pos) => pos.name === character
  );
  if (pos) {
    pos.x = x;
    pos.y = y;
  }
}

// Check if the game has ended
function checkGameEnd(gameState) {
  const player0Characters = gameState.players[0].positions.length;
  const player1Characters = gameState.players[1].positions.length;

  if (player0Characters === 0) {
    gameState.status = "PLAYER2_WON";
  } else if (player1Characters === 0) {
    gameState.status = "PLAYER1_WON";
  }
}

module.exports = {
  initializeGame,
  processMove,
};
