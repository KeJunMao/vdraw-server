import allRoom from "../data/rooms.mjs";
let nextUserId = 1;

export default class RoomInfo {
  constructor(name, password) {
    this.name = name;
    this.password = password;
    this.time = 59;
    this.users = [];
    this.history = [];
    this.initJSON = [];
  }
  addUser(user) {
    let userId;
    if (user && user.id) {
      userId = user.id;
    } else {
      userId = nextUserId++;
    }
    if (!user.id) {
      user.id = userId;
    }
    if (!user.name) {
      user.name = "user" + userId;
    }
    const found = this.users.find(u => user.id === u.id);
    if (found) {
      this.del();
      return [found, true];
    }
    this.users.push(user);
    return [user, false];
  }
  removeUser(user) {
    this.users = this.users.filter(v => {
      return v.id !== user.id;
    });
    this.del();
  }
  addHistory(emitData) {
    this.history.push(emitData);
  }
  del() {
    // 无用户时释放房间
    if (this.users.length === 0) {
      delete allRoom[this.name];
    }
  }
  clear() {
    this.history = [];
  }
}
