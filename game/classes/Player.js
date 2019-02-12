class Player {
    constructor(username, connection) {
        this.username = username;
        this.connection = connection;
        this.role = "resistance";
        this.setRole = function(role) {
            this.role = role;
        };
    }
}

module.exports = Player;