module.exports = function (RED) {
  "use strict";
  const axios = require('axios');

  function addPocket(n) {
    RED.nodes.createNode(this, n);

    this.pocket = RED.nodes.getNode(n.pocket);

    if (!this.pocket.credentials.accessToken) {
      this.status({ fill: "red", shape: "ring", text: "error.no-access-token" });
      return;
    }

    let node = this;

    node.on("input", async function (msg) {
      let url = msg.url || n.url,
        title = msg.title || n.title,
        tags = msg.tags || n.tags,
        tweet_id = msg.tweet_id || n.tweet_id;

      if (!url) {
        this.status({ fill: "red", shape: "ring", text: "error.url-required" });
        node.error('Error:', RED._('error.url-required'))
        return;
      }

      let body = {
        consumer_key: this.pocket.credentials.consumerKey,
        access_token: this.pocket.credentials.accessToken,
        url
      }

      if (title) {
        body = { ...body, title }
      }

      if (tags) {
        body = { ...body, tags }
      }

      if (tweet_id) {
        body = { ...body, tweet_id }
      }

      try {
        let data = await addList(body);

        msg.payload = data;
        node.send(msg);
        node.status({ fill: "green", shape: "ring", text: "success.add-pocket" });
      } catch (error) {
        node.error('Error: ' + error.response.data)
        node.status({ fill: "red", shape: "dot", text: "error.add-pocket" });
        return;
      }
    });
  }
  RED.nodes.registerType("add-pocket", addPocket);

  async function addList(body) {
    let { data } = await axios.post("https://getpocket.com/v3/add", body);

    return data;
  }
};
