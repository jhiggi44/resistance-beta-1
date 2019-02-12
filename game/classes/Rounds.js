let MissionDetails = require('./MissionDetails');

class Rounds {
    constructor(numOfPlayers) {
        this.missionDetails = [];

        this.setRounds = function(numOfPlayers) {
            if (numOfPlayers >= 8) {
                // first five requires that spies get two fails to win
                this.missionDetails.push(new MissionDetails(3, false));
                this.missionDetails.push(new MissionDetails(4, false));
                this.missionDetails.push(new MissionDetails(4, false));
                this.missionDetails.push(new MissionDetails(5, true));
                this.missionDetails.push(new MissionDetails(5, false));
            } else if (numOfPlayers == 7) {
                this.missionDetails.push(new MissionDetails(2, false));
                this.missionDetails.push(new MissionDetails(3, false));
                this.missionDetails.push(new MissionDetails(3, false));
                this.missionDetails.push(new MissionDetails(4, true));
                this.missionDetails.push(new MissionDetails(4, false));
            } else if (numOfPlayers == 6) {
                this.missionDetails.push(new MissionDetails(2, false));
                this.missionDetails.push(new MissionDetails(3, false));
                this.missionDetails.push(new MissionDetails(4, false));
                this.missionDetails.push(new MissionDetails(3, false));
                this.missionDetails.push(new MissionDetails(4, false));
            } else {
                this.missionDetails.push(new MissionDetails(2, false));
                this.missionDetails.push(new MissionDetails(3, false));
                this.missionDetails.push(new MissionDetails(2, false));
                this.missionDetails.push(new MissionDetails(3, false));
                this.missionDetails.push(new MissionDetails(3, false));
            }
        };

        this.setRounds(numOfPlayers);
    }
}

module.exports = Rounds;