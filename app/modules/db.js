var sqlite3 = require('sqlite3');

var db = new sqlite3.Database('./app/db/db.sqlite');




db.getAgents = function(callback) {
    this.each("SELECT * FROM agents", callback);
};

db.getAgentsByUserId = function(id, callback) {
    this.all("SELECT * FROM agents WHERE user_id = ?", id, callback);
};

db.getAgentById = function(id, callback) {
    this.get("SELECT * FROM agents WHERE id = ?", id, callback);
};

db.deleteAgent = function(agentId, callback) {
    this.run("DELETE FROM agents WHERE id=?", agentId, callback);
};

db.updateAgent = function(params, callback) {
    this.run("UPDATE agents SET url=? , selector=? , expect=? , trigger=? , condition=? , frequency=? , exact_time=? , name=? WHERE id=?",
        params.url, params.selector, params.expect, params.trigger, params.condition, params.frequency, params.exact_time, params.name, params.id,
        callback);
};

db.updateAgentLastValue = function(id, lastValue, callback) {
    this.run("UPDATE agents SET last_value = ? WHERE id = ?", lastValue, id, callback);
};

db.createAgent = function(params, callback) {
    this.run("INSERT INTO agents VALUES (null, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
        params.userId, params.url, params.selector, params.expect, params.trigger, params.condition, "", params.frequency, params.exact_time, params.name,
        callback);
};




db.getNotificationsByUserId = function(id, callback) {
    this.all("SELECT notifications.id, notifications.text, notifications.time, agents.name " +
        "FROM notifications JOIN agents ON notifications.agent_id = agents.id WHERE notifications.user_id = ?", id,
        callback);
};

db.deleteNotification = function(id, callback) {
    this.run("DELETE FROM notifications WHERE id = ?", id, callback);
};

db.createNotification = function(userId, agentId, notificationText, callback) {
    this.run("INSERT INTO notifications VALUES (null, ?, ?, ?, datetime('now'))", userId, agentId, notificationText, callback);
}





db.getUserByLogin = function(name, password, callback) {
    this.get("SELECT id FROM users WHERE name = ? and password = ?", name, password, callback);
};

db.createUser = function(name, password, callback) {
    this.run("INSERT INTO users (name, password) VALUES (?, ?)", name, pass, callback);
}



module.exports = db;