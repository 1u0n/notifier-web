var SseChannel = require('sse-channel');


var myChannel = new SseChannel({
    pingInterval: 60000,
    cors: { origins: ['*'] }
});

myChannel.connectedClientsList = [];

myChannel.on('connect', (ch, req, res) => {
    if (req.body.userId)
        myChannel.connectedClientsList.push({ id: req.body.userId, res: res });
});
myChannel.on('disconnect', (ch, res) => {
    for (var i = 0; i < myChannel.connectedClientsList.length; i++)
        if (res === myChannel.connectedClientsList[i].res) {
            myChannel.connectedClientsList.splice(i, 1);
            break;
        }
});


module.exports = myChannel;