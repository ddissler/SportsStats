namespace SportsStats.API.Infrastructure;

/// <summary>
/// Standard fantasy football DEF/ST scoring rules.
/// </summary>
public static class NflDefenseFantasyScoring
{
    /// <summary>Points earned from the per-game points-allowed bracket.</summary>
    public static double PointsAllowedBracket(int pointsAllowed) => pointsAllowed switch
    {
        0      => 10,
        <= 6   => 7,
        <= 13  => 4,
        <= 20  => 1,
        <= 27  => 0,
        <= 34  => -1,
        _      => -4
    };

    public static (double fpPA, double fpSacks, double fpInts, double fpFumbles,
                   double fpTDs, double fpSafeties, double fpBlocked, double total)
        Calculate(
            IEnumerable<int> perGamePointsAllowed,
            int sacks,
            int interceptions,
            int fumblesRecovered,
            int defensiveTDs,
            int specialTeamsTDs,
            int safeties,
            int blockedKicks)
    {
        var fpPA      = perGamePointsAllowed.Sum(pa => PointsAllowedBracket(pa));
        var fpSacks   = sacks * 1.0;
        var fpInts    = interceptions * 2.0;
        var fpFumbles = fumblesRecovered * 2.0;
        var fpTDs     = (defensiveTDs + specialTeamsTDs) * 6.0;
        var fpSafe    = safeties * 2.0;
        var fpBlocked = blockedKicks * 2.0;
        var total     = fpPA + fpSacks + fpInts + fpFumbles + fpTDs + fpSafe + fpBlocked;

        return (fpPA, fpSacks, fpInts, fpFumbles, fpTDs, fpSafe, fpBlocked, total);
    }
}
