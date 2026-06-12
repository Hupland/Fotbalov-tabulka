"use strict";
class FotbalovyTym {
    jmenoTymu;
    zapasy;
    vyhra;
    remiza;
    prohra;
    vstreleneGoly;
    obdrzeneGoly;
    constructor(jmenoTymu) {
        this.jmenoTymu = jmenoTymu;
        this.zapasy = 0;
        this.vyhra = 0;
        this.remiza = 0;
        this.prohra = 0;
        this.vstreleneGoly = 0;
        this.obdrzeneGoly = 0;
    }
    getRozdilSkore() {
        return this.vstreleneGoly - this.obdrzeneGoly;
    }
}
class TymZakladniCast extends FotbalovyTym {
    _typ;
    constructor(jmenoTymu) {
        super(jmenoTymu);
        this._typ = "zakladni";
    }
    vypocitejBody() {
        return (this.vyhra * 3) + (this.remiza * 1);
    }
    get typ() {
        return this._typ;
    }
}
class TymNadstavba extends FotbalovyTym {
    _typ;
    _bodyZeZakladniCasti;
    constructor(jmenoTymu, bodyZeZakladniCasti) {
        super(jmenoTymu);
        this._typ = "nadstavba";
        this._bodyZeZakladniCasti = bodyZeZakladniCasti;
    }
    vypocitejBody() {
        const nadstavbaBody = (this.vyhra * 3) + (this.remiza * 1);
        return nadstavbaBody + this._bodyZeZakladniCasti;
    }
    get typ() {
        return this._typ;
    }
}
let liga = [];
// ── UI HELPERS ────────────────────────────────────────────
function showToast(msg, err = false) {
    const t = document.getElementById('toast');
    t.textContent = msg;
    t.className = 'toast show' + (err ? ' err' : '');
    clearTimeout(t._tid);
    t._tid = setTimeout(() => t.className = 'toast', 2500);
}
function updateStats() {
    document.getElementById('statTeams').textContent = liga.length.toString();
    const totalMatches = liga.reduce((s, t) => s + t.zapasy, 0) / 2;
    document.getElementById('statMatches').textContent = Math.round(totalMatches).toString();
    const totalGoals = liga.reduce((s, t) => s + t.vstreleneGoly, 0);
    document.getElementById('statGoals').textContent = totalGoals.toString();
}
function renderTable() {
    const sections = [
        { id: 'tableBodyZakladni', teams: liga.filter(t => t.typ === 'zakladni'), emptyText: 'Zatím žádné týmy v základní části. Přidej tým v panelu vpravo.' },
        { id: 'tableBodyNadstavba', teams: liga.filter(t => t.typ === 'nadstavba'), emptyText: 'Zatím žádné týmy v nadstavbě. Přidej tým v panelu vpravo.' }
    ];
    const renderRows = (teams) => {
        if (teams.length === 0)
            return null;
        const sorted = [...teams].sort((a, b) => {
            const bodyDiff = b.vypocitejBody() - a.vypocitejBody();
            if (bodyDiff !== 0)
                return bodyDiff;
            return b.getRozdilSkore() - a.getRozdilSkore();
        });
        return sorted.map((tym, i) => {
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
    };
    sections.forEach(section => {
        const tbody = document.getElementById(section.id);
        if (!tbody)
            return;
        const content = renderRows(section.teams);
        if (content) {
            tbody.innerHTML = content;
        }
        else {
            tbody.innerHTML = `<tr><td colspan="9"><div class="empty"><div class="icon">🏟️</div>${section.emptyText}</div></td></tr>`;
        }
    });
    updateStats();
}
function renderTeamList() {
    const el = document.getElementById('teamList');
    if (liga.length === 0) {
        el.innerHTML = '';
        return;
    }
    el.innerHTML = liga.map((t, i) => `
    <div class="team-item">
      <span>${t.jmenoTymu} <span class="team-type-badge ${t instanceof TymNadstavba ? 'badge-nadstavba' : 'badge-zakladni'}">${t instanceof TymNadstavba ? 'N' : 'Z'}</span></span>
      <button class="del-btn" onclick="removeTeam(${i})" title="Smazat tým">✕</button>
    </div>`).join('');
}
function renderSelects() {
    const names = liga.map(t => t.jmenoTymu);
    ['inHome', 'inAway'].forEach(id => {
        const sel = document.getElementById(id);
        const cur = sel.value;
        sel.innerHTML = names.length
            ? names.map(n => `<option value="${n}">${n}</option>`).join('')
            : '<option value="">– žádné týmy –</option>';
        if (names.includes(cur))
            sel.value = cur;
    });
}
function refresh() {
    renderTable();
    renderTeamList();
    renderSelects();
}
function addTeam() {
    const name = document.getElementById('inName').value.trim();
    const typ = document.getElementById('inType').value;
    if (!name) {
        showToast('Zadej název týmu!', true);
        return;
    }
    const existing = liga.find(t => t.jmenoTymu.toLowerCase() === name.toLowerCase());
    if (existing && existing.typ === typ) {
        showToast('Tým s tímto názvem už v této části existuje!', true);
        return;
    }
    let tym;
    if (typ === 'nadstavba') {
        const bzzVal = parseInt(document.getElementById('inBodyZZ').value) || 0;
        tym = new TymNadstavba(name, bzzVal);
    }
    else {
        tym = new TymZakladniCast(name);
    }
    liga.push(tym);
    document.getElementById('inName').value = '';
    document.getElementById('inBodyZZ').value = '';
    showToast(`✅ Tým "${name}" přidán!`);
    refresh();
}
function removeTeam(index) {
    const name = liga[index].jmenoTymu;
    liga.splice(index, 1);
    showToast(`🗑 Tým "${name}" odebrán.`);
    refresh();
}
function addMatch() {
    if (liga.length < 2) {
        showToast('Potřebuješ aspoň 2 týmy!', true);
        return;
    }
    const homeName = document.getElementById('inHome').value;
    const awayName = document.getElementById('inAway').value;
    if (homeName === awayName) {
        showToast('Domácí a hosté musí být různé týmy!', true);
        return;
    }
    const homeG = parseInt(document.getElementById('inHomeG').value) || 0;
    const awayG = parseInt(document.getElementById('inAwayG').value) || 0;
    const home = liga.find(t => t.jmenoTymu === homeName);
    const away = liga.find(t => t.jmenoTymu === awayName);
    home.zapasy++;
    away.zapasy++;
    home.vstreleneGoly += homeG;
    home.obdrzeneGoly += awayG;
    away.vstreleneGoly += awayG;
    away.obdrzeneGoly += homeG;
    if (homeG > awayG) {
        home.vyhra++;
        away.prohra++;
    }
    else if (homeG < awayG) {
        away.vyhra++;
        home.prohra++;
    }
    else {
        home.remiza++;
        away.remiza++;
    }
    showToast(`⚽ ${homeName} ${homeG}:${awayG} ${awayName}`);
    document.getElementById('inHomeG').value = '0';
    document.getElementById('inAwayG').value = '0';
    refresh();
}
function resetAll() {
    if (!confirm('Opravdu resetovat celou ligu?'))
        return;
    liga = [];
    showToast('Liga resetována.');
    refresh();
}
document.getElementById('inType').addEventListener('change', function () {
    document.getElementById('nadstavbaRow').style.display =
        this.value === 'nadstavba' ? 'block' : 'none';
});
refresh();
