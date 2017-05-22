var assert = require('assert');
var channel = require('../app/modules/SSE');


describe('SSE module', function() {

    var initialLength;
    var mockResponse = {};

    before(function() {
        initialLength = channel.connectedClientsList.length;
    });


    it('should call onConnect, adding 1 user', function() {
        channel.emit("connect", null, { body: { userId: "1" } }, mockResponse);
        assert.equal(channel.connectedClientsList.length, initialLength + 1);
    });

    it('should call onDisconnect, removing 1 user', function() {
        channel.emit("disconnect", null, mockResponse);
        assert.equal(channel.connectedClientsList.length, initialLength);
    });


});