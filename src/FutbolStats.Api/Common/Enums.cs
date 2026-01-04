namespace FutbolStats.Api.Common;

public enum MatchStatus
{
    Scheduled,
    Live,
    HalfTime,
    Finished,
    Postponed,
    Cancelled
}

public enum EventType
{
    Goal,
    OwnGoal,
    Assist,
    YellowCard,
    RedCard,
    SecondYellow,
    SubstitutionIn,
    SubstitutionOut,
    PenaltyScored,
    PenaltyMissed
}

public enum PlayerPosition
{
    Goalkeeper,
    Defender,
    Midfielder,
    Forward
}

public enum ChampionshipStatus
{
    Upcoming,
    InProgress,
    Finished
}

public enum UserRole
{
    Admin,
    Editor
}
