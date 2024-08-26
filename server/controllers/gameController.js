// server/controllers/gameController.js

const gameService = require("../services/gameService");
const WebSocket = require("ws");

let gameState = {}; // Store game state

// Start a new game
function startGame(data) {
  gameState = gameService.initializeGame(data);
  gameState.turn = 0; // Start with player 0's turn
  return gameState;
}

// Handle incoming messages
function handleMessage(ws, message) {
  try {
    const { type, payload } = JSON.parse(message);
    switch (type) {
      case "MOVE":
        const result = processMove(payload);
        if (result.success) {
          broadcastGameState();
        } else {
          ws.send(
            JSON.stringify({ type: "INVALID_MOVE", payload: result.message })
          );
        }
        break;
      case "CHAT":
        broadcastMessage(payload);
        break;
      default:
        console.error("Unknown message type:", type);
    }
  } catch (err) {
    console.error("Error handling message:", err);
  }
}

// Process a move
function processMove({ player, character, move }) {
  if (gameState.turn !== player) {
    return { success: false, message: "Not your turn" };
  }

  const result = gameService.processMove(player, character, move);
  if (result.success) {
    gameState.turn = (gameState.turn + 1) % 2; // Toggle turn between 0 and 1
  }
  return result;
}

// Get the current game state
function getGameState() {
  return gameState;
}

// Broadcast updated game state to all clients
function broadcastGameState() {
  const state = JSON.stringify({ type: "GAME_STATE", payload: gameState });
  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(state);
    }
  });
}

// Broadcast chat messages to all clients
function broadcastMessage(message) {
  const msg = JSON.stringify({ type: "CHAT", payload: message });
  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(msg);
    }
  });
}

module.exports = { startGame, handleMessage, getGameState };
