import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import io from "socket.io-client";

const LANDING_PAGE_LIMITS = {
  Pawns: 5,
  Hero1: 5,
  Hero2: 5,
  Hero3: 5,
};

const MAX_TOTAL_PIECES = 5;
const SOCKET_SERVER_URL = "http://localhost:4000"; 

const LandingPage = () => {
  const navigate = useNavigate();
  const [composition, setComposition] = useState({
    Pawns: 3,
    Hero1: 1,
    Hero2: 1,
    Hero3: 1,
  });

  const socket = io(SOCKET_SERVER_URL);

  const handleChange = (e) => {
    const { name, value } = e.target;
    const newValue = parseInt(value, 10);


    if (newValue > LANDING_PAGE_LIMITS[name]) {
      alert(`Maximum limit for ${name} is ${LANDING_PAGE_LIMITS[name]}`);
      return;
    }

    const totalPieces = Object.values({
      ...composition,
      [name]: newValue,
    }).reduce((a, b) => a + b, 0);

    if (totalPieces <= MAX_TOTAL_PIECES) {
      setComposition({
        ...composition,
        [name]: newValue,
      });
    } else {
      alert(`Total number of pieces cannot exceed ${MAX_TOTAL_PIECES}`);
    }
  };

  const handleStartGame = () => {
    socket.emit("setupBoard", composition);
    navigate("/game");
  };

  return (
    <div className="landing-page">
      <h1>Select Your Pieces</h1>
      <div className="composition-form">
        {Object.keys(composition).map((piece) => (
          <div key={piece}>
            <label>
              {piece}:
              <input
                type="number"
                name={piece}
                min="0"
                value={composition[piece]}
                onChange={handleChange}
              />
            </label>
          </div>
        ))}
      </div>
      <button onClick={handleStartGame}>Start Game</button>
      <style jsx>
        {`
          .landing-page {
            text-align: center;
            color: grey;
            background-color: #333;
            padding: 20px;
          }

          .composition-form {
            margin: 20px 0;
          }

          .composition-form label {
            display: block;
            margin: 10px 0;
          }

          input {
            margin-left: 10px;
            width: 50px;
            text-align: center;
          }

          button {
            margin-top: 20px;
            padding: 10px 20px;
            background-color: #007bff;
            color: white;
            border: none;
            border-radius: 4px;
            cursor: pointer;
            font-size: 1em;
          }

          button:hover {
            background-color: #0056b3;
          }
        `}
      </style>
    </div>
  );
};

export default LandingPage;
