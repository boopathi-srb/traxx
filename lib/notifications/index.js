const teamsNotifier = require("./teams");
const slackNotifier = require("./slack");
const googleChatNotifier = require("./googleChat");

module.exports = {
  teams: teamsNotifier,
  slack: slackNotifier,
  googleChat: googleChatNotifier,
};
