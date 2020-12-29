module.exports = function (RED) {
  var axios = require("axios").default;

  function PocketNode(config) {
    RED.nodes.createNode(this, config);
    var node = this;

    node.on("input", function (msg) {
      if (!node.credentials || !node.credentials.accessToken) {
        node.status({ fill: "red", shape: "dot", text: "error.no-access-token" });
        return;
      }
    });
  }
  RED.nodes.registerType("pocket-auth", PocketNode, {
    credentials: {
      consumerKey: { type: "password", required: true },
      displayName: { type: "text" }
    },
  });

  RED.httpAdmin.get("/red/pocket/auth", async function (req, res) {
    let id = req.query.id;
    let consumerKey = req.query.consumerKey;
    let callback = req.query.callback;
    let body = { consumer_key: consumerKey, redirect_uri: "/" };

    try {
      let { data: requestToken } = await axios.post("https://getpocket.com/v3/oauth/request", body, {
        headers: { "X-Accept": "application/json" },
      });

      let credentials = {
        consumerKey,
        requestToken: requestToken.code,
      };
      RED.nodes.addCredentials(id, credentials);

      res.redirect(`https://getpocket.com/auth/authorize?request_token=${requestToken.code}&redirect_uri=${callback}`);
    } catch (error) {
      res.send(RED._("error.authorize", { 'err': error.response.statusText }));
    }
  });

  RED.httpAdmin.get("/red/pocket/auth_callback", async function (req, res) {
    let id = req.query.id;
    if (!id) {
      res.send(RED._("error.none-id"));
    }
    let credentials = RED.nodes.getCredentials(id);

    let body = {
      consumer_key: credentials.consumerKey,
      code: credentials.requestToken,
    };
    try {
      let { data } = await axios.post("https://getpocket.com/v3/oauth/authorize", body, {
        headers: { "X-Accept": "application/json" },
      });

      //set credentials
      credentials.accessToken = data.access_token;
      credentials.displayName = data.username;

      RED.nodes.addCredentials(id, credentials);

      res.send(RED._("message.authorized"));
    } catch (error) {
      res.send(RED._("error.authorize"));
    }
  });
};
