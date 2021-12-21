import axios from "axios";
import { useState, useEffect } from "react";
import { useCookies } from "react-cookie";
import { Redirect } from "react-router";
import Unity, { UnityContext } from "react-unity-webgl";
import { NavBar } from "../navbar/navbar";
import { GameManager } from "./data/gamemanager";
import './Unity.css'


const ip = window.location.hostname;

function init_player1_settings(game: GameManager) {
  game.ID = "Player1";
  game.P1ready = true;
  game.P2ready = true;
  unityContext.send("Ball", "setID", game.ID);
}

function init_player2_settings(game: GameManager) {
  game.ID = "Player2";
}

const unityContext = new UnityContext({
  loaderUrl: "./Build/webgl.loader.js",
  dataUrl: "./Build/webgl.data",
  frameworkUrl: "./Build/webgl.framework.js",
  codeUrl: "./Build/webgl.wasm",
});

async function isLogged(cookies: any, setUnauthorized: any) {

  await axios.request({
    url: '/user/me',
    method: 'get',
    baseURL: `http://${ip}:5000`,
    headers: {
      "Authorization": `Bearer ${cookies.access_token}`,
    }
  }).catch(err => {
    if (err.response.status === 401) {
      setUnauthorized(true);
    }
  });
  setUnauthorized(false);
}



function check_ready(game: GameManager) {
  if (game.P1ready === true && game.P2ready === true) {
    if (game.ID === "Player2")
    {
      unityContext.send("RemotePaddle", "setID", game.ID);
      unityContext.send("HUD", "setID", game.ID);
      unityContext.send("Ball", "setID", game.ID);
    }
    else if (game.ID === "Player1")
    {
      unityContext.send("LocalPaddle", "setID", game.ID);
      unityContext.send("HUD", "setID", game.ID);
      unityContext.send("Ball", "setID", game.ID);
    }
    console.log("we passed here!");
    unityContext.send("HUD", "gameInit");
    unityContext.send("Ball", "setID", game.ID);
    unityContext.send("LocalPaddle", "setGameStarted", 1);
    unityContext.send("RemotePaddle", "setGameStarted", 1);
    game.P1ready = false;
    game.P2ready = false;
  }
}

export function Play() {


  const [unauthorized, setUnauthorized] = useState(false);
  const [cookies] = useCookies();
  var game = new GameManager();

  useEffect(() => {
    document.addEventListener('keydown', (e) => {

      if (e.key === '1') {
        init_player1_settings(game);
      }
      if (e.key === 'r') {
        init_player2_settings(game);
      }
    })
  })
  useEffect(function () {
    unityContext.on("setReady", function (ready) {  
      if (game.ID === "Player1")
        game.P1ready = true;
      else if (game.ID === "Player2")
        game.P2ready = true;
      game.Socket.emit('ReadyUp', { Pseudo: game.ID });
    });
  });
  useEffect(function () {
    unityContext.on("SetBallPos", function (posx, posy) {
      if (game.ID === "Player1")
        game.Socket.emit('SetBallPos', posx, posy)
		});
  });
  useEffect(function () {
      unityContext.on("GameResult", function (PointToAdd, score1, score2) {
        console.log(`${score1} ${score2}`)
        if (game.ID === "Player1")
        {
          if (score1 === 15 && score1 !== 10 && score2 !== 10)
            game.Socket.emit('AddPoint', "add1");
          else if (score1 !== 10 && score2 !== 10)
            game.Socket.emit('AddPoint', 'add2');
        }
      if (score1 === 10 || score2 === 10)
      {
        unityContext.send("LocalPaddle", "setGameStarted", 0);
        unityContext.send("RemotePaddle", "setGameStarted", 0);
      }
		});
  });
  useEffect(function () {
    unityContext.on("SendPosition", function (Position: number) {
        game.Socket.emit('SetPosition', Position, game.ID)
		});
  });
  useEffect(function () {
    game.Socket.on('SetPosition', (Position: number, Player: string) => { 
      if (game.ID !== Player)
      {
        if (game.ID === "Player1")
          unityContext.send("RemotePaddle", "SetPosition", Position);
        else
        unityContext.send("LocalPaddle", "SetPosition", Position);
      }
    })
  });
  useEffect(function () {
    game.Socket.on('AddPoint', (Player: string) => {
      if (game.ID === "Player2")
      {
        if (Player === "add1")
          unityContext.send("HUD", "AddScore", "RightWall");
        else
          unityContext.send("HUD", "AddScore", "LeftWall");
      }
    })
  });
  useEffect(function () {
      game.Socket.on('ReadyUp', (pseudo: any) => {
        if (pseudo.Pseudo === "Player1")
        {
          game.P1ready = true;
        }
        else if (pseudo.Pseudo === "Player2")
        {
          game.P2ready = true;
        }
      })
    });
    useEffect(function () { 
      game.Socket.on('SetBallPos', (posx: number, posy: number) => {
        var posToSend: string = `${posx} ${posy}`;
        if (game.ID === "Player2")
          unityContext.send("Ball", 'setPos', posToSend);
      })
    });

  setInterval(() => {
    check_ready(game)
  }, 1000);
  useEffect(() => {
    isLogged(cookies, setUnauthorized);
  }, [cookies])
  if (unauthorized) {
    return (<Redirect to="/" />);
  }

  return (
    <div>
      <NavBar page="Play" />
      <Unity className="UnityGame" unityContext={unityContext} />
    </div>
  )
}