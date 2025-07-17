import * as room from 'pixel_combats/room';
import * as teams from './default_teams.js';

const player = Room.Players.GetByRoomId(123);
const roomId = player.IdInRoom;

player.Properties.Get("Number").Value = player.IdInRoom; 
Teams.OnRequestJoinTeam.Add((player, team) => {
    player.Properties.Get("Number").Value = player.IdInRoom;
    team.Add(player);
});

LeaderBoard.PlayerLeaderBoardValues = [
    { Value: "RoomId", DisplayName: Номер игрока" }
];

Damage.FriendlyFire = true;
BreackGraph.OnlyPlayerBlocksDmg = false;
BreackGraph.WeakBlocks = false;
BreackGraph.BreackAll = false;

export const BLUE_TEAM_NAME = "Blue";
export const BLUE_TEAM_DISPLAY_NAME = "Teams/Blue";
export const BLUE_TEAM_SPAWN_POINTS_GROUP = 1

export function create_team_blue() {
    Teams.Add(BLUE_TEAM_NAME, BLUE_TEAM_DISPLAY_NAME, new Color(0, 0, 1, 0));
    Teams.Get(BLUE_TEAM_NAME).Spawns.SpawnPointsGroups.Add(BLUE_TEAM_SPAWN_POINTS_GROUP);
    return Teams.Get(BLUE_TEAM_NAME);
}
 room.Teams.OnRequestJoinTeam.Add(function (player, team) { team.Add(player); }); room.Teams.OnPlayerChangeTeam.Add(function (player) { player.Spawns.Spawn(); });
}
