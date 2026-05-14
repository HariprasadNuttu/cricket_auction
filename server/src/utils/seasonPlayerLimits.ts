/** Defaults match legacy hardcoded squad size / reserve rule behavior. */

export const DEFAULT_MAX_PLAYERS_PER_TEAM = 17;
export const DEFAULT_MIN_PLAYERS_PER_TEAM = 17;

export function clampSeasonPlayerLimits(minRaw: unknown, maxRaw: unknown): {
    minPlayersPerTeam: number;
    maxPlayersPerTeam: number;
} | { error: string } {
    let max =
        maxRaw === undefined || maxRaw === null || maxRaw === ''
            ? DEFAULT_MAX_PLAYERS_PER_TEAM
            : parseInt(String(maxRaw), 10);
    let min =
        minRaw === undefined || minRaw === null || minRaw === ''
            ? DEFAULT_MIN_PLAYERS_PER_TEAM
            : parseInt(String(minRaw), 10);

    if (Number.isNaN(max) || max < 1) max = DEFAULT_MAX_PLAYERS_PER_TEAM;
    if (Number.isNaN(min) || min < 1) min = DEFAULT_MIN_PLAYERS_PER_TEAM;
    if (max > 50) max = 50;
    if (min > 50) min = 50;
    if (min > max) {
        return { error: 'Minimum players per team cannot be greater than maximum' };
    }
    return { minPlayersPerTeam: min, maxPlayersPerTeam: max };
}

export function maxPlayersForSeason(season: { maxPlayersPerTeam?: number | null } | null | undefined): number {
    const v = season?.maxPlayersPerTeam;
    if (v == null || Number.isNaN(v) || v < 1) return DEFAULT_MAX_PLAYERS_PER_TEAM;
    return v;
}

export function minPlayersForSeason(season: { minPlayersPerTeam?: number | null } | null | undefined): number {
    const v = season?.minPlayersPerTeam;
    if (v == null || Number.isNaN(v) || v < 1) return DEFAULT_MIN_PLAYERS_PER_TEAM;
    return v;
}
