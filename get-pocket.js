module.exports = function (RED) {
  "use strict";
  const axios = require('axios');

  function getPocket(n) {
    RED.nodes.createNode(this, n);
    
    this.pocket = RED.nodes.getNode(n.pocket);

    if (!this.pocket.credentials.accessToken) {
      this.status({ fill: "red", shape: "ring", text: "pocket.warn.no-access-token" });
      return;
    }

    let node = this;

    node.on("input", async function (msg) {
      try {
        let body = {
          consumer_key: this.pocket.credentials.consumerKey,
          access_token: this.pocket.credentials.accessToken
        }
        let data = await getList(body);
        msg.payload = data
        node.send(msg);
        node.status({ fill: "green", shape: "ring", text: "pocket.success.get-list" });
      } catch (error) {
        node.error('Error:', error.response.data)
        node.status({ fill: "red", shape: "dot", text: "pocket.error.get-list" });
        return;
      }
    });
  }
  RED.nodes.registerType("get-pocket", getPocket);

  async function getList(body) {
    let { data } = await axios.get("https://getpocket.com/v3/get", {params: body});

    return data;
  }
};
