import { Rank } from './types';

export function getBrazilianHolidays(year: number): string[] {
  return getHolidaysWithNames(year).map(h => h.date).sort();
}

export function getHolidayName(dateStr: string): string | undefined {
  const year = parseInt(dateStr.split('-')[0]);
  const holidays = getHolidaysWithNames(year);
  const holiday = holidays.find(h => h.date === dateStr);
  return holiday?.name;
}

function getHolidaysWithNames(year: number): { date: string, name: string }[] {
  const holidays = [
    { date: `${year}-01-01`, name: 'CONFRATERNIZAÇÃO' },
    { date: `${year}-04-21`, name: 'TIRADENTES' },
    { date: `${year}-05-01`, name: 'DIA DO TRABALHO' },
    { date: `${year}-09-07`, name: 'INDEPENDÊNCIA' },
    { date: `${year}-10-12`, name: 'N. SRA. APARECIDA' },
    { date: `${year}-11-02`, name: 'FINADOS' },
    { date: `${year}-11-15`, name: 'PROCLAMAÇÃO REP.' },
    { date: `${year}-12-25`, name: 'NATAL' },
  ];

  // Calculate Easter (Meeus/Jones/Butcher's Algorithm)
  const a = year % 19;
  const b = Math.floor(year / 100);
  const c = year % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const month = Math.floor((h + l - 7 * m + 114) / 31);
  const day = ((h + l - 7 * m + 114) % 31) + 1;

  const easterDate = new Date(year, month - 1, day);
  
  // Carnival (47 days before Easter)
  const carnivalDate = new Date(easterDate);
  carnivalDate.setDate(easterDate.getDate() - 47);
  holidays.push({ date: carnivalDate.toISOString().split('T')[0], name: 'CARNAVAL' });

  // Good Friday (2 days before Easter)
  const goodFridayDate = new Date(easterDate);
  goodFridayDate.setDate(easterDate.getDate() - 2);
  holidays.push({ date: goodFridayDate.toISOString().split('T')[0], name: 'PAIXÃO DE CRISTO' });

  // Corpus Christi (60 days after Easter)
  const corpusChristiDate = new Date(easterDate);
  corpusChristiDate.setDate(easterDate.getDate() + 60);
  holidays.push({ date: corpusChristiDate.toISOString().split('T')[0], name: 'CORPUS CHRISTI' });

  return holidays;
}

export const getRankWeight = (rank: string) => {
  const map: Record<string, number> = {
    [Rank.CEL]: 1, 
    [Rank.TEN_CEL]: 2, 
    [Rank.MAJ]: 3, 
    [Rank.CAP]: 4, 
    [Rank.TEN_1]: 5, 
    [Rank.TEN_2]: 6,
    [Rank.ASP]: 7, 
    [Rank.AL_OF]: 8,
    [Rank.SUBTEN]: 9, 
    [Rank.SGT_1]: 10, 
    [Rank.SGT_2]: 11, 
    [Rank.SGT_3]: 12,
    [Rank.CB]: 13, 
    [Rank.SD]: 14, 
    [Rank.CIVIL]: 15
  };
  return map[rank] || 99;
};
