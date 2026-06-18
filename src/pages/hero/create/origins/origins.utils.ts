export const PRIMARY = '#d7baff';   // primary
export const SECONDARY = '#ffb86c'; // secondary
export const TERTIARY = '#31e368';  // tertiary

export const ATTR_LABELS: Record<string, string> = {
  str: 'FOR', dex: 'DES', con: 'CON', int: 'INT', wis: 'SAB', cha: 'CAR',
};

export const ATTR_TOOLTIP: Record<string, string> = {
  str: 'Força — músculos e poder físico',
  dex: 'Destreza — agilidade, reflexos e precisão',
  con: 'Constituição — resistência e vitalidade',
  int: 'Inteligência — raciocínio e memória',
  wis: 'Sabedoria — percepção e intuição',
  cha: 'Carisma — presença e força de personalidade',
};

export const KEY_ATTR_PT: Record<string, string> = {
  str: 'FOR', dex: 'DES', con: 'CON', int: 'INT', wis: 'SAB', cha: 'CAR',
};

export function formatBonuses(bonuses: Record<string, number>): string {
  return Object.entries(bonuses)
    .filter(([k]) => k !== 'eligible')
    .map(([attr, val]) => `${val > 0 ? '+' : ''}${val} ${ATTR_LABELS[attr] ?? attr.toUpperCase()}`)
    .join(', ');
}
