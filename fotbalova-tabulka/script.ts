abstract class FotbalovyTym {
  jmenoTymu: string;
  zapasy: number;
  vyhra: number;
  remiza: number;
  prohra: number;
  vstreleneGoly: number;
  obdrzeneGoly: number;

  constructor(jmenoTymu: string) {
    this.jmenoTymu = jmenoTymu;
    this.zapasy = 0;
    this.vyhra = 0;
    this.remiza = 0;
    this.prohra = 0;
    this.vstreleneGoly = 0;
    this.obdrzeneGoly = 0;
  }

  getRozdilSkore(): number {
    return this.vstreleneGoly - this.obdrzeneGoly;
  }

  abstract vypocitejBody(): number;
}

class TymZakladniCast extends FotbalovyTym {
  private _typ: string;

  constructor(jmenoTymu: string) {
    super(jmenoTymu);
    this._typ = "zakladni";
  }

  vypocitejBody(): number {
    return (this.vyhra * 3) + (this.remiza * 1);
  }

  get typ(): string {
    return this._typ;
  }
}

class TymNadstavba extends FotbalovyTym {
  private _typ: string;
  private _bodyZeZakladniCasti: number;

  constructor(jmenoTymu: string, bodyZeZakladniCasti: number) {
    super(jmenoTymu);
    this._typ = "nadstavba";
    this._bodyZeZakladniCasti = bodyZeZakladniCasti;
  }

  vypocitejBody(): number {
    const nadstavbaBody = (this.vyhra * 3) + (this.remiza * 1);
    return nadstavbaBody + this._bodyZeZakladniCasti;
  }

  get typ(): string {
    return this._typ;
  }
}

let liga: FotbalovyTym[] = [];

// ── UI HELPERS ────────────────────────────────────────────
function showToast(msg: string, err: boolean = false): void {
  const t = document.getElementById('toast') as HTMLElement;
  t.textContent = msg;
  t.className = 'toast show' + (err ? ' err' : '');
  clearTimeout((t as any)._tid);
  (t as any)._tid = setTimeout(() => t.className = 'toast', 2500);
}

function updateStats(): void {
  (document.getElementById('statTeams') as HTMLElement).textContent = liga.length.toString();
  const totalMatches = liga.reduce((s, t) => s + t.zapasy, 0) / 2;
  (document.getElementById('statMatches') as HTMLElement).textContent = Math.round(totalMatches).toString();
  const totalGoals = liga.reduce((s, t) => s + t.vstreleneGoly, 0);
  (document.getElementById('statGoals') as HTMLElement).textContent = totalGoals.toString();
}

function renderTable(): void {
  const tbody = document.getElementById('tableBody') as HTMLTableSectionElement;

  if (liga.length === 0) {
    tbody.innerHTML = `<tr><td colspan="9"><div class="empty"><div class="icon">🏟️</div>Zatím žádné týmy. Přidej tým v panelu vpravo.</div></td></tr>`;
    updateStats();
    return;
  }

  const sorted = [...liga].sort((a, b) => {
    const bodyDiff = b.vypocitejBody() - a.vypocitejBody();
    if (bodyDiff !== 0) return bodyDiff;
    return b.getRozdilSkore() - a.getRozdilSkore();
  });

  tbody.innerHTML = sorted.map((tym, i) => {
    const rank = i + 1;
    const diff = tym.getRozdilSkore();
    const body = tym.vypocitejBody();
    const rankClass = rank <= 3 ? ` rank-${rank}` : '';
    const diffClass = diff > 0 ? 'diff-pos' : diff < 0 ? 'diff-neg' : '';
    const badgeType = tym instanceof TymNadstavba ? 'badge-nadstavba' : 'badge-zakladni';
    const badgeText = tym instanceof TymNadstavba ? 'N' : 'Z';
    const diffSign = diff > 0 ? '+' : '';

    return `<tr>
      <td><span class="rank${rankClass}">${rank}</span></td>
      <td>
        <span class="team-name">${tym.jmenoTymu}</span>
        <span class="team-type-badge ${badgeType}">${badgeText}</span>
      </td>
      <td>${tym.zapasy}</td>
      <td>${tym.vyhra}</td>
      <td>${tym.remiza}</td>
      <td>${tym.prohra}</td>
      <td>${tym.vstreleneGoly}:${tym.obdrzeneGoly}</td>
      <td class="${diffClass}">${diffSign}${diff}</td>
      <td><span class="pts">${body}</span></td>
    </tr>`;
  }).join('');

  updateStats();
}

function renderTeamList(): void {
  const el = document.getElementById('teamList') as HTMLElement;
  if (liga.length === 0) { el.innerHTML = ''; return; }
  el.innerHTML = liga.map((t, i) => `
    <div class="team-item">
      <span>${t.jmenoTymu} <span class="team-type-badge ${t instanceof TymNadstavba ? 'badge-nadstavba' : 'badge-zakladni'}">${t instanceof TymNadstavba ? 'N' : 'Z'}</span></span>
      <button class="del-btn" onclick="removeTeam(${i})" title="Smazat tým">✕</button>
    </div>`).join('');
}

function renderSelects(): void {
  const names = liga.map(t => t.jmenoTymu);
  ['inHome', 'inAway'].forEach(id => {
    const sel = document.getElementById(id) as HTMLSelectElement;
    const cur = sel.value;
    sel.innerHTML = names.length
      ? names.map(n => `<option value="${n}">${n}</option>`).join('')
      : '<option value="">– žádné týmy –</option>';
    if (names.includes(cur)) sel.value = cur;
  });
}

function refresh(): void {
  renderTable();
  renderTeamList();
  renderSelects();
}

function addTeam(): void {
  const name = (document.getElementById('inName') as HTMLInputElement).value.trim();
  const typ = (document.getElementById('inType') as HTMLSelectElement).value;

  if (!name) { showToast('Zadej název týmu!', true); return; }
  if (liga.find(t => t.jmenoTymu.toLowerCase() === name.toLowerCase())) {
    showToast('Tým s tímto názvem už existuje!', true); return;
  }

  let tym: FotbalovyTym;
  if (typ === 'nadstavba') {
    const bzzVal = parseInt((document.getElementById('inBodyZZ') as HTMLInputElement).value) || 0;
    tym = new TymNadstavba(name, bzzVal);
  } else {
    tym = new TymZakladniCast(name);
  }

  liga.push(tym);
  (document.getElementById('inName') as HTMLInputElement).value = '';
  (document.getElementById('inBodyZZ') as HTMLInputElement).value = '';
  showToast(`✅ Tým "${name}" přidán!`);
  refresh();
}

function removeTeam(index: number): void {
  const name = liga[index].jmenoTymu;
  liga.splice(index, 1);
  showToast(`🗑 Tým "${name}" odebrán.`);
  refresh();
}

function addMatch(): void {
  if (liga.length < 2) { showToast('Potřebuješ aspoň 2 týmy!', true); return; }

  const homeName = (document.getElementById('inHome') as HTMLSelectElement).value;
  const awayName = (document.getElementById('inAway') as HTMLSelectElement).value;
  if (homeName === awayName) { showToast('Domácí a hosté musí být různé týmy!', true); return; }

  const homeG = parseInt((document.getElementById('inHomeG') as HTMLInputElement).value) || 0;
  const awayG = parseInt((document.getElementById('inAwayG') as HTMLInputElement).value) || 0;

  const home = liga.find(t => t.jmenoTymu === homeName)!;
  const away = liga.find(t => t.jmenoTymu === awayName)!;

  home.zapasy++; away.zapasy++;
  home.vstreleneGoly += homeG; home.obdrzeneGoly += awayG;
  away.vstreleneGoly += awayG; away.obdrzeneGoly += homeG;

  if (homeG > awayG) { home.vyhra++; away.prohra++; }
  else if (homeG < awayG) { away.vyhra++; home.prohra++; }
  else { home.remiza++; away.remiza++; }

  showToast(`⚽ ${homeName} ${homeG}:${awayG} ${awayName}`);

  (document.getElementById('inHomeG') as HTMLInputElement).value = '0';
  (document.getElementById('inAwayG') as HTMLInputElement).value = '0';
  refresh();
}

function resetAll(): void {
  if (!confirm('Opravdu resetovat celou ligu?')) return;
  liga = [];
  showToast('Liga resetována.');
  refresh();
}

document.getElementById('inType')!.addEventListener('change', function() {
  (document.getElementById('nadstavbaRow') as HTMLElement).style.display =
    (this as HTMLSelectElement).value === 'nadstavba' ? 'block' : 'none';
});

refresh();