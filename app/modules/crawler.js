var Xray = require('x-ray');

var x = Xray({
    filters: {
        trim: function(value) {
            return typeof value === 'string' ? value.trim() : value;
        },
        collapse: function(value) {
            return typeof value === 'string' ? value.replace(/\s+/g, ' ') : value;
        }
    }
});

module.exports = x;