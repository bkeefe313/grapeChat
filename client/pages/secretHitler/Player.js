function Player(team, role) {
    Player.call(this, team, role);
    
}

Player.prototype.getRole = function(){
    return this.role;
}

Player.prototype.getTeam = function(){
    return this.team;
}
