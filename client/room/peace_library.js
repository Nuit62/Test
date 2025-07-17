import * as room from 'pixel_combats/room';
import * as teams from './default_teams.js';

player.Properties.Get("Number").Value = player.IdInRoom; 
Teams.OnRequestJoinTeam.Add((player, team) => {
    player.Properties.Get("Number").Value = player.IdInRoom;
    team.Add(player);
});
 room.Teams.OnRequestJoinTeam.Add(function (player, team) { team.Add(player); }); room.Teams.OnPlayerChangeTeam.Add(function (player) { player.Spawns.Spawn(); });
}
