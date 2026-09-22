const LEVEL_PREFIX = 'LEVEL-'
const GROUP_PREFIX = 'OU_GROUP-'

export interface OrgUnitFilterSelection {
    orgUnitIds: string[]
    levels: string[]
    groups: string[]
}

export function parseOrgUnitSelection(ids: string[]): OrgUnitFilterSelection {
    const selection: OrgUnitFilterSelection = {
        orgUnitIds: [],
        levels: [],
        groups: [],
    }

    for (const id of ids) {
        if (id.startsWith(LEVEL_PREFIX)) {
            selection.levels.push(id.slice(LEVEL_PREFIX.length))
        } else if (id.startsWith(GROUP_PREFIX)) {
            selection.groups.push(id.slice(GROUP_PREFIX.length))
        } else {
            selection.orgUnitIds.push(id)
        }
    }

    return selection
}

export function serializeOrgUnitSelection({
    orgUnitIds,
    levels,
    groups,
}: OrgUnitFilterSelection): string[] {
    return [
        ...orgUnitIds,
        ...levels.map((level) => `${LEVEL_PREFIX}${level}`),
        ...groups.map((group) => `${GROUP_PREFIX}${group}`),
    ]
}
