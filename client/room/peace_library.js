using UnityEngine;
using System.Collections.Generic;
using PixelCombats; // Предполагаемый API игры

public class TeamBuildingContest : MonoBehaviour
{
    // Настройки
    public int BuildTime = 300;          // Время на строительство (сек)
    public int VoteTime = 180;           // Время голосования (сек)
    public int MaxVotesPerPlayer = 2;    // Лимит голосов на игрока
    public string[] TeamNames = { "Красные", "Синие", "Зеленые" }; // Названия команд
    
    private Dictionary<Team, int> _teamScores = new Dictionary<Team, int>();
    private List<Team> _teams = new List<Team>();
    private Timer _currentTimer;
    private bool _isBuildPhase = true;

    void Start()
    {
        CreateTeams();
        StartBuildPhase();
        SetBuilderInventory();
    }

    // Создание команд
    void CreateTeams()
    {
        foreach (string name in TeamNames)
        {
            Team team = Teams.Create(
                name,
                $"<color={GetTeamColor(name)}>{name}</color>",
                GetTeamColor(name)
            );
            _teams.Add(team);
            _teamScores[team] = 0;
        }

        // Автобаланс игроков
        TeamsBalancer.AutoBalanceEnabled = true;
    }

    // Цвета для команд
    Color GetTeamColor(string teamName)
    {
        switch (teamName)
        {
            case "Красные": return Color.red;
            case "Синие":   return Color.blue;
            case "Зеленые": return Color.green;
            default:        return Color.white;
        }
    }

    // Настройка инвентаря для строительства
    void SetBuilderInventory()
    {
        var inventory = Inventory.GetContext();
        inventory.Main.Value = false;
        inventory.Secondary.Value = false;
        inventory.Melee.Value = true;  // Нож для дебага
        inventory.Explosive.Value = false;
        inventory.Build.Value = true;
        inventory.BuildInfinity.Value = true;

        var build = Build.GetContext();
        build.FlyEnable.Value = true;
        build.BuildModeEnable.Value = true;
    }

    // Фаза строительства
    void StartBuildPhase()
    {
        _isBuildPhase = true;
        _currentTimer = Timers.Create("BuildTimer", BuildTime);
        _currentTimer.OnTimerEnd += StartVotePhase;
        
        Room.BroadcastMessage(
            $"<color=green>ФАЗА СТРОИТЕЛЬСТВА</color>\n" +
            $"Постройте базу за {BuildTime} секунд!\n" +
            $"Команды: {string.Join(", ", TeamNames)}\n" +
            $"Используйте блоки (B) и полёт (F)!"
        );
    }

    // Фаза голосования
    void StartVotePhase()
    {
        _isBuildPhase = false;
        _currentTimer = Timers.Create("VoteTimer", VoteTime);
        _currentTimer.OnTimerEnd += EndGame;
        
        // Замораживаем стройку
        Build.GetContext().BuildModeEnable.Value = false;
        
        // Даем инструмент для голосования
        Inventory.GetContext().Melee.Value = true; // "Молоток" для выбора
        
        Room.BroadcastMessage(
            $"<color=yellow>ФАЗА ГОЛОСОВАНИЯ</color>\n" +
            $"Осмотрите постройки и нажмите [E] для голоса.\n" +
            $"У вас {MaxVotesPerPlayer} голоса!\n" +
            $"Голосуйте за другие команды!"
        );
    }

    // Обработка голосования
    void OnPlayerInteract(Player voter, Vector3 hitPoint)
    {
        if (!_isBuildPhase && voter.Team != null)
        {
            Team votedTeam = FindTeamByBuild(hitPoint);
            
            if (votedTeam != null && votedTeam != voter.Team)
            {
                int votesUsed = voter.Properties.Get("VotesUsed").Value;
                
                if (votesUsed < MaxVotesPerPlayer)
                {
                    _teamScores[votedTeam]++;
                    voter.Properties.Get("VotesUsed").Value++;
                    voter.PopUp($"Вы проголосовали за {votedTeam.Name}!");
                    
                    // Визуальный эффект
                    SpawnVoteEffect(hitPoint, voter.Team.Color);
                }
                else
                {
                    voter.PopUp("У вас нет голосов!");
                }
            }
        }
    }

    // Определяем команду по точке постройки
    Team FindTeamByBuild(Vector3 point)
    {
        foreach (Team team in _teams)
        {
            // Проверяем, находится ли точка в зоне постройки команды
            if (IsInTeamZone(team, point))
                return team;
        }
        return null;
    }

    // Упрощенная проверка зоны (можно заменить на коллайдеры)
    bool IsInTeamZone(Team team, Vector3 point)
    {
        // Предполагаем, что у каждой команды своя зона спавна
        Vector3 teamSpawn = team.Spawns.MainSpawn.Position;
        return Vector3.Distance(teamSpawn, point) < 50f; // 50 - радиус зоны
    }

    // Эффект при голосовании
    void SpawnVoteEffect(Vector3 pos, Color color)
    {
        Room.SpawnParticle(
            "VoteEffect",
            pos,
            color,
            scale: 2f,
            lifetime: 3f
        );
    }

    // Завершение игры
    void EndGame()
    {
        // Сортируем команды по очкам
        _teams.Sort((a, b) => _teamScores[b].CompareTo(_teamScores[a]));
        
        // Формируем результаты
        string resultText = "<color=orange>ИТОГИ:</color>\n";
        for (int i = 0; i < _teams.Count; i++)
        {
            resultText += $"{i+1}. {_teams[i].Name}: {_teamScores[_teams[i]]} голосов\n";
        }
        
        // Победитель
        Team winner = _teams[0];
        Room.BroadcastMessage(
            resultText + 
            $"<color={winner.Color}>\nПОБЕДИТЕЛЬ: {winner.Name}!</color>"
        );
        
        // Салют победителю
        Room.SpawnParticle(
            "Fireworks",
            winner.Spawns.MainSpawn.Position,
            winner.Color,
            scale: 5f,
            lifetime: 10f
        );

        // Перезапуск через 20 сек
        Timers.Create("RestartTimer", 20, () => 
        {
            Room.RestartGame();
        });
    }

    void OnEnable()
    {
        PlayerInput.OnInteract += OnPlayerInteract;
    }

    void OnDisable()
    {
        PlayerInput.OnInteract -= OnPlayerInteract;
    }
}