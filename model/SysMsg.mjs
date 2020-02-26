export default class SysMsg {
  /**
   *Creates an instance of SysMsg.
   * @param {string} msg
   * @param {number} code
    * info
    * 200 通用成功
    * 201 创建房间成功
    * 202 加入房间成功
    * 203 同步成功
    * 204 用户离开成功
    * 205 我离开成功
    * 206 更新房间
    *
    * error
    * 400 通用客户端错误
    * 401 密码错误
    * 402 重复加入
    * 500 服务器通用错误
    * 501 同步失败
    * 502 要退出的房间不存在
   * @param {*} data
   * @memberof SysMsg
   */
  constructor(msg, code, data) {
    this.msg = msg;
    this.code = code || 200;
    this.data = data || null;
  }
}
