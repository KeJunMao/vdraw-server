import express from "express";
import { Server } from "http";
import socketIo from "socket.io";
import RoomInfo from "./model/RoomInfo.mjs";
import SysMsg from "./model/SysMsg.mjs";
import allRoom from "./data/rooms.mjs";

const app = express();
const http = Server(app);
const io = socketIo(http);
const PORT = process.env.PORT || 3000;

app.get("/", function(req, res) {
  res.send("Vdraw Socket.io Api!");
});

io.on("connection", socket => {
  let curUser = {};
  let curRoom = null;
  socket.on("join", ({ name, password, user, data = {} }) => {
    let isCreate = false,
      error;
    if (!allRoom[name]) {
      isCreate = true;
      allRoom[name] = new RoomInfo(name, password);
      allRoom[name].initJSON = data.json || [];
      [curUser, error] = allRoom[name].addUser(user);
      if (error) {
        io.to(socket.id).emit("sys", new SysMsg("加入房间失败！", 500));
        return;
      }
    }
    curRoom = allRoom[name];
    if (curRoom && curRoom.password !== password) {
      io.to(socket.id).emit("sys", new SysMsg("密码错误！", 401));
      return;
    }
    socket.join(name);
    let msg = "";
    let code = 200;
    if (isCreate) {
      msg = curUser.name + "创建房间！";
      code = 201;
    } else {
      [curUser, error] = curRoom.addUser(user);
      if (error) {
        io.to(socket.id).emit("sys", new SysMsg("你已经在房间！", 402));
        return;
      }
      msg = curUser.name + "加入本房间！";
      code = 202;
    }
    io.in(name).emit(
      "sys",
      new SysMsg(msg, code, {
        room: curRoom,
        user: curUser
      })
    );

    if (code === 202) {
      io.to(socket.id).emit("init", { json: curRoom.initJSON, user: curUser });
      io.to(socket.id).emit("sys", new SysMsg("同步中..."));
      curRoom.history.forEach(emitData => {
        io.to(socket.id).emit(emitData.type, emitData);
      });
      io.to(socket.id).emit("sys", new SysMsg("同步成功...", 203));
    }

    socket.on("disconnect", function() {
      curRoom.removeUser(curUser);
    });
  });
  socket.on("leave", ({ name, user }) => {
    if (curRoom) {
      curRoom.removeUser(user);
      socket.leave(name);
      io.in(name).emit(
        "sys",
        new SysMsg(`${user.name}已退出房间"`, 204, { room: curRoom })
      );
      io.to(socket.id).emit("sys", new SysMsg("已退出房间", 205));
    } else {
      io.to(socket.id).emit("sys", new SysMsg("房间不存在", 502));
    }
  });
  socket.on("action", ({ room, type, data }) => {
    const user = curUser;
    if (!room) return;
    if (curRoom && curRoom.password === room.password) {
      let emitData = {};
      if (type === "draw") {
        const { layerName, pathName, action, json } = data;
        emitData = {
          type,
          layerName,
          pathName,
          action,
          data: {
            json,
            user
          }
        };
      }
      if (type === "layer") {
        const { layerName, action, json } = data;
        emitData = {
          type,
          layerName,
          action,
          data: {
            json,
            user
          }
        };
      }
      if (type === "clear") {
        const { json } = data;
        emitData = {
          type,
          data: {
            json,
            user
          }
        };
        curRoom.clear();
      }
      if (emitData.type) {
        io.in(room.name).emit(emitData.type, emitData);
        curRoom.addHistory(emitData);
      }
    }
  });
});

http.listen(PORT, () => {
  console.log(`listening on *:${PORT}`);
});
