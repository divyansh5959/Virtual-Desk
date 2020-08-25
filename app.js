const express = require("express");
const socket = require("socket.io");

// App setup
const PORT = 3000;
const app = express();
const server = app.listen(PORT, function () {
	console.log(`Listening on port ${PORT}`);
	console.log(`http://localhost:${PORT}`);
});

// Static files
app.use(express.static("public"));

app.get("/", function (req, res) {
	res.sendFile(__dirname + "/public/index.html");
})

app.get("/admin", function (req, res) {
	res.sendFile(__dirname + "/public/admin.html");
})
// Socket setup
const io = socket(server);

const activeUsers = [];
const socketIds = [];
var adminId = "";

io.on("connection", function (socket) {
	console.log("Made socket connection");

	socket.on("new user", function (data) {
		socket.userId = data;
		socketIds.push(socket.id);
		activeUsers.push(data);
		io.emit("new user", [...activeUsers]);
	});

	socket.on("disconnect", () => {
		if (socket.userId === "admin") {
			io.emit("admin disconnected");
		}
		else {
			if (socket.id === socketIds[0] && activeUsers.length > 1) {
				io.to(socketIds[1]).emit("your turn");
			}
			for (let i = 0; i < activeUsers.length; i++) {
				if (activeUsers[i] === socket.userId) {
					activeUsers.splice(i, 1);
					socketIds.splice(i, 1);
				}
			}
			io.emit("user disconnected", socket.userId);
		}
	});

	socket.on("chat message", function (data) {
		io.to(adminId).emit("chat message", data);
		io.to(socketIds[0]).emit("chat message", data);
	});

	socket.on("typing", function (data) {
		io.to(adminId).emit("typing", data);
		io.to(socketIds[0]).emit("typing", data);
	});

	socket.on("admin connected", function () {
		if (activeUsers.length > 0) {
			io.to(socketIds[0]).emit("your turn");
		}
		socket.userId = "admin";
		adminId = socket.id;
		io.emit("admin connected");
	});
});

