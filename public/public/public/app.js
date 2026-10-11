const socket = io();

const nameInput = document.getElementById("name");

const roomInput = document.getElementById("room");

const joinButton = document.getElementById("join");

const message = document.getElementById("message");

const lobby = document.getElementById("lobby");

const playersList = document.getElementById("players");

joinButton.addEventListener("click", () => {

  const playerName = nameInput.value.trim();

  const roomCode = roomInput.value.trim().toUpperCase();

  if (!playerName || !roomCode) {

    message.textContent = "اكتب اسمك ورمز الغرفة أولاً.";

    return;

  }

  message.textContent = "عم نحاول ندخّلك عالغرفة...";

  socket.emit("joinRoom", { playerName, roomCode });

});

socket.on("connect", () => {

  message.textContent = "";

});

socket.on("errorMessage", (text) => {

  message.textContent = text;

});

socket.on("playersUpdate", (players) => {

  lobby.hidden = false;

  playersList.replaceChildren();

  players.forEach((name) => {

    const item = document.createElement("li");

    item.textContent = name;

    playersList.appendChild(item);

  });

  message.textContent = "تم تحديث قائمة اللاعبين.";

});

socket.on("disconnect", () => {

  message.textContent = "انقطع الاتصال. جرّب تحدّث الصفحة.";

})
