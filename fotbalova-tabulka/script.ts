"use strict";

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
    abstract get typ(): string;
}

class TymZakladniCast extends FotbalovyTym {
    private _typ: string;

    constructor(jmenoTymu: string) {
        super(jmenoTymu);
        this._typ = "zakladni";
    }

    vypocitejBody(): number {
        return (this.vyhra * 3) + this.remiza;
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
        const nadstavbaBody = (this.vyhra * 3) + this.remiza;
        return nadstavbaBody + this._bodyZeZakladniCasti;
    }

    get typ(): string {
        return this._typ;
    }
}

let liga: FotbalovyTym[] = [];

function getEl<T extends HTMLElement>(id: string): T {
    return document.getElementById(id) as T;
}

function showToast(msg: string, err: boolean = false): void {
    const t = getEl<HTMLDivElement>("toast");

    t.textContent = msg;
    t.className = "toast show" + (err ? " err" : "");

    clearTimeout((t as any)._tid);

    (t as any)._tid = setTimeout(() => {
        t.className = "toast";
    }, 2500);
}

function updateStats(): void {
    getEl<HTMLElement>("statTeams").textContent = liga.length.toString();

    const totalMatches = liga.reduce((s, t) => s + t.zapasy, 0) / 2;
    getEl<HTMLElement>("statMatches").textContent = Math.round(totalMatches).toString();

    const totalGoals = liga.reduce((s, t) => s + t.vstreleneGoly, 0);
    getEl<HTMLElement>("statGoals").textContent = totalGoals.toString();
}

function renderTable(): void {
    const sections = [
        {
            id: "tableBodyZakladni",
            teams: liga.filter(t => t.typ === "zakladni"),
            emptyText: "Zatím žádné týmy v základní části. Přidej tým v panelu vpravo."
        },
        {
            id: "tableBodyNadstavba",
            teams: liga.filter(t => t.typ === "nadstavba"),
            emptyText: "Zatím žádné týmy v nadstavbě. Přidej tým v panelu vpravo."
        }
    ];

    const renderRows = (teams: FotbalovyTym[]): string | null => {
        if (teams.length === 0) return null;

        const sorted = [...teams].sort((a, b) => {
            const bodyDiff = b.vypocitejBody() - a.vypocitejBody();

            if (bodyDiff !== 0) return bodyDiff;

            return b.getRozdilSkore() - a.getRozdilSkore();
        });

        return sorted.map((tym, i) => {
            const rank = i + 1;
            const diff = tym.getRozdilSkore();
            const body = tym.vypocitejBody();

            const rankClass = rank <= 3 ? ` rank-${rank}` : "";
            const diffClass = diff > 0 ? "diff-pos" : diff < 0 ? "diff-neg" : "";
            const diffSign = diff > 0 ? "+" : "";

            return `<tr>
                <td><span class="rank${rankClass}">${rank}</span></td>
                <td><span class="team-name">${tym.jmenoTymu}</span></td>
                <td>${tym.zapasy}</td>
                <td>${tym.vyhra}</td>
                <td>${tym.remiza}</td>
                <td>${tym.prohra}</td>
                <td>${tym.vstreleneGoly}:${tym.obdrzeneGoly}</td>
                <td class="${diffClass}">${diffSign}${diff}</td>
                <td><span class="pts">${body}</span></td>
            </tr>`;
        }).join("");
    };

    sections.forEach(section => {
        const tbody = getEl<HTMLTableSectionElement>(section.id);
        const content = renderRows(section.teams);

        if (content) {
            tbody.innerHTML = content;
        } else {
            tbody.innerHTML = `
                <tr>
                    <td colspan="9">
                        <div class="empty">
                            <div class="icon">🏟️</div>
                            ${section.emptyText}
                        </div>
                    </td>
                </tr>`;
        }
    });

    updateStats();
}

function renderTeamList(): void {
    const el = getEl<HTMLDivElement>("teamList");

    if (liga.length === 0) {
        el.innerHTML = "";
        return;
    }

    el.innerHTML = liga.map((t, i) => `
        <div class="team-item">
            <span>${t.jmenoTymu}</span>
            <button class="del-btn" onclick="removeTeam(${i})" title="Smazat tým">✕</button>
        </div>
    `).join("");
}

function renderSelects(): void {
    const names = liga.map(t => t.jmenoTymu);

    ["inHome", "inAway"].forEach(id => {
        const sel = getEl<HTMLSelectElement>(id);
        const cur = sel.value;

        sel.innerHTML = names.length
            ? names.map(n => `<option value="${n}">${n}</option>`).join("")
            : `<option value="">– žádné týmy –</option>`;

        if (names.indexOf(cur) !== -1) {
            sel.value = cur;
        }
    });
}

function refresh(): void {
    renderTable();
    renderTeamList();
    renderSelects();
}

function addTeam(): void {
    const name = getEl<HTMLInputElement>("inName").value.trim();
    const typ = getEl<HTMLSelectElement>("inType").value;

    if (!name) {
        showToast("Zadej název týmu!", true);
        return;
    }

    const existing = liga.find(t => t.jmenoTymu.toLowerCase() === name.toLowerCase());

    if (existing && existing.typ === typ) {
        showToast("Tým s tímto názvem už v této části existuje!", true);
        return;
    }

    let tym: FotbalovyTym;

    if (typ === "nadstavba") {
        const bzzVal = parseInt(getEl<HTMLInputElement>("inBodyZZ").value) || 0;
        tym = new TymNadstavba(name, bzzVal);
    } else {
        tym = new TymZakladniCast(name);
    }

    liga.push(tym);

    getEl<HTMLInputElement>("inName").value = "";
    getEl<HTMLInputElement>("inBodyZZ").value = "";

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
    if (liga.length < 2) {
        showToast("Potřebuješ aspoň 2 týmy!", true);
        return;
    }

    const homeName = getEl<HTMLSelectElement>("inHome").value;
    const awayName = getEl<HTMLSelectElement>("inAway").value;

    if (homeName === awayName) {
        showToast("Domácí a hosté musí být různé týmy!", true);
        return;
    }

    const homeG = parseInt(getEl<HTMLInputElement>("inHomeG").value) || 0;
    const awayG = parseInt(getEl<HTMLInputElement>("inAwayG").value) || 0;

    const home = liga.find(t => t.jmenoTymu === homeName);
    const away = liga.find(t => t.jmenoTymu === awayName);

    if (!home || !away) return;

    home.zapasy++;
    away.zapasy++;

    home.vstreleneGoly += homeG;
    home.obdrzeneGoly += awayG;

    away.vstreleneGoly += awayG;
    away.obdrzeneGoly += homeG;

    if (homeG > awayG) {
        home.vyhra++;
        away.prohra++;
    } else if (homeG < awayG) {
        away.vyhra++;
        home.prohra++;
    } else {
        home.remiza++;
        away.remiza++;
    }

    showToast(`⚽ ${homeName} ${homeG}:${awayG} ${awayName}`);

    getEl<HTMLInputElement>("inHomeG").value = "0";
    getEl<HTMLInputElement>("inAwayG").value = "0";

    refresh();
}

function resetAll(): void {
    if (!confirm("Opravdu resetovat celou ligu?")) return;

    liga = [];

    showToast("Liga resetována.");
    refresh();
}

getEl<HTMLSelectElement>("inType").addEventListener("change", function () {
    getEl<HTMLDivElement>("nadstavbaRow").style.display =
        this.value === "nadstavba" ? "block" : "none";
});

refresh();