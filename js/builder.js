const PROJECT_VERSION = "1.0.0";
const palette = ['#FF6B6B','#FFB86B','#FFD36B','#9CE37D','#6BCBFF','#6B9CFF','#C6A0FF','#F28AB2','#9E9E9E'];

// ── localStorage project store ──────────────────────────────────────
// { "Project Name": { project: {...}, data: {...}, modified: "ISO" } }
function getProjects() {
    return JSON.parse(localStorage.getItem('dotplot_projects_v1') || '{}');
}
function setProjects(projects) {
    localStorage.setItem('dotplot_projects_v1', JSON.stringify(projects));
}

function migrateProject(project) {
    if (!project.version) project.version = "0.9.0";
    if (project.version === "0.9.0") {
        if (!project.chartTitle) project.chartTitle = '';
        if (project.showYLabel === undefined) project.showYLabel = true;
        if (project.showXLabel === undefined) project.showXLabel = true;
        if (project.showSecondaryLabel === undefined) project.showSecondaryLabel = false;
        project.version = "1.0.0";
    }
    return project;
}

function populateFormFromProject(project) {
    document.getElementById('projectName').value = project.name || '';
    document.getElementById('chartTitle').value = project.chartTitle || '';
    document.getElementById('epitopes').value = (project.epitopes || []).length;
    document.getElementById('timepoints').value = (project.timepoints || []).length;
    document.getElementById('secondaryCount').value = (project.secondary || []).length;
    document.getElementById('yLabel').value = project.yLabel || '';
    document.getElementById('xLabel').value = project.xLabel || 'Days Post Vaccination';
    document.getElementById('secondaryLabel').value = project.secondaryLabel || '';
    document.getElementById('showYLabel').checked = project.showYLabel !== false;
    document.getElementById('showXLabel').checked = project.showXLabel !== false;
    document.getElementById('showSecondaryLabel').checked = project.showSecondaryLabel || false;

    generateEpitopes();
    generateTimepoints();
    generateSecondary();

    (project.epitopes || []).forEach((epi, i) => {
        const nameEl = document.getElementById(`epitope_name_${i}`);
        const hexEl = document.getElementById(`epitope_hex_${i}`);
        const colorEl = document.getElementById(`epitope_color_${i}`);
        if (nameEl) nameEl.value = epi.name;
        if (hexEl) hexEl.value = epi.color || '#FF6B6B';
        if (colorEl) colorEl.value = epi.color || '#FF6B6B';
    });

    (project.timepoints || []).forEach((tp, i) => {
        const el = document.getElementById(`timepoint_${i}`);
        if (el) el.value = tp;
    });

    (project.secondary || []).forEach((s, i) => {
        const name = document.getElementById(`secondary_name_${i}`);
        if (name) name.value = s.name;
    });
}

function setActiveProjectLabel(name) {
    const el = document.getElementById('activeProjectLabel');
    if (!el) return;
    el.textContent = name ? `Active project: ${name}` : '';
    el.style.display = name ? 'block' : 'none';
}

function loadSavedData() {
    const saved = localStorage.getItem('project');
    if (saved) {
        const project = JSON.parse(saved);
        populateFormFromProject(project);
        setActiveProjectLabel(project.name || '');
    } else {
        generateEpitopes();
        generateTimepoints();
    }
    displaySavedProjects();
}

// ── Epitope UI ──────────────────────────────────────────────────────
function addEpitope() {
    const container = document.getElementById('epitopeBoxes');
    const index = container.children.length;
    document.getElementById('epitopes').value = index + 1;
    appendEpitopeBox(container, index);
}

function subtractEpitope() {
    const current = parseInt(document.getElementById('epitopes').value || 0);
    if (current > 1) {
        const container = document.getElementById('epitopeBoxes');
        if (container.children.length > 0) container.removeChild(container.lastChild);
        document.getElementById('epitopes').value = current - 1;
    }
}

function generateEpitopes() {
    const num = parseInt(document.getElementById('epitopes').value || 0);
    const container = document.getElementById('epitopeBoxes');
    container.innerHTML = '';
    for (let i = 0; i < num; i++) appendEpitopeBox(container, i);
}

function appendEpitopeBox(container, i) {
    const div = document.createElement('div');
    div.className = 'epitope-box';
    div.innerHTML = `
        <div class="textbox-label">Epitope ${i + 1}</div>
        <div class="epitope-inputs">
            <input type="text" id="epitope_name_${i}" class="textbox" placeholder="Name" />
            <input type="color" id="epitope_color_${i}" value="#FF6B6B" />
            <input type="text" id="epitope_hex_${i}" class="textbox" placeholder="#FF6B6B" value="#FF6B6B" style="width:100px;" />
            <div class="palette" id="palette_${i}"></div>
        </div>
    `;
    container.appendChild(div);

    const paletteEl = div.querySelector(`#palette_${i}`);
    palette.forEach(col => {
        const sw = document.createElement('div');
        sw.className = 'swatch';
        sw.style.background = col;
        sw.title = col;
        sw.onclick = () => {
            document.getElementById(`epitope_color_${i}`).value = col;
            document.getElementById(`epitope_hex_${i}`).value = col;
        };
        paletteEl.appendChild(sw);
    });

    const colorInput = div.querySelector(`#epitope_color_${i}`);
    const hexInput = div.querySelector(`#epitope_hex_${i}`);
    colorInput.addEventListener('input', () => hexInput.value = colorInput.value);
    hexInput.addEventListener('input', () => {
        const v = hexInput.value.trim();
        if (/^#([0-9A-Fa-f]{6})$/.test(v)) colorInput.value = v;
    });
}

// ── Timepoint UI ────────────────────────────────────────────────────
function addTimepoint() {
    const container = document.getElementById('timepointBoxes');
    const index = container.children.length;
    document.getElementById('timepoints').value = index + 1;
    const div = document.createElement('div');
    div.innerHTML = `
        <div class="textbox-label">Timepoint ${index + 1}</div>
        <input type="text" id="timepoint_${index}" class="textbox" placeholder="Day or Visit (e.g. Day 0)" value="Day ${index}" />
    `;
    container.appendChild(div);
}

function subtractTimepoint() {
    const current = parseInt(document.getElementById('timepoints').value || 0);
    if (current > 1) {
        const container = document.getElementById('timepointBoxes');
        if (container.children.length > 0) container.removeChild(container.lastChild);
        document.getElementById('timepoints').value = current - 1;
    }
}

function generateTimepoints() {
    const num = parseInt(document.getElementById('timepoints').value || 0);
    const container = document.getElementById('timepointBoxes');
    container.innerHTML = '';
    for (let i = 0; i < num; i++) {
        const div = document.createElement('div');
        div.innerHTML = `
            <div class="textbox-label">Timepoint ${i + 1}</div>
            <input type="text" id="timepoint_${i}" class="textbox" placeholder="Day or Visit (e.g. Day 0)" value="Day ${i}" />
        `;
        container.appendChild(div);
    }
}

// ── Secondary (Donors/Antigens) UI ──────────────────────────────────
function generateSecondary() {
    const num = parseInt(document.getElementById('secondaryCount').value || 0);
    const container = document.getElementById('secondaryBoxes');
    container.innerHTML = '';
    for (let i = 0; i < num; i++) {
        const div = document.createElement('div');
        div.style.width = '320px';
        div.innerHTML = `
            <div class="textbox-label">Item ${i + 1}</div>
            <input type="text" id="secondary_name_${i}" class="textbox" placeholder="Name (Donor or Antigen)" />
        `;
        container.appendChild(div);
    }
}

function subtractSecondary() {
    const current = parseInt(document.getElementById('secondaryCount').value || 0);
    if (current > 0) {
        const container = document.getElementById('secondaryBoxes');
        if (container.children.length > 0) container.removeChild(container.lastChild);
        document.getElementById('secondaryCount').value = current - 1;
    }
}

function addSecondary() {
    const container = document.getElementById('secondaryBoxes');
    const index = container.children.length;
    const div = document.createElement('div');
    div.style.width = '320px';
    div.innerHTML = `
        <div class="textbox-label">Item ${index + 1}</div>
        <input type="text" id="secondary_name_${index}" class="textbox" placeholder="Name (Donor or Antigen)" />
    `;
    container.appendChild(div);
    document.getElementById('secondaryCount').value = container.children.length;
}

// ── Gather current form state ───────────────────────────────────────
function gatherProjectFromForm() {
    const epitopeNum = parseInt(document.getElementById('epitopes').value || 0);
    const timepointNum = parseInt(document.getElementById('timepoints').value || 0);
    const secCount = parseInt(document.getElementById('secondaryCount').value || 0);

    const epitopes = [];
    for (let i = 0; i < epitopeNum; i++) {
        const name = document.getElementById(`epitope_name_${i}`).value || `Epitope ${i + 1}`;
        const color = document.getElementById(`epitope_hex_${i}`).value || document.getElementById(`epitope_color_${i}`).value || '#FF6B6B';
        epitopes.push({ name, color });
    }

    const timepoints = [];
    for (let i = 0; i < timepointNum; i++) {
        timepoints.push(document.getElementById(`timepoint_${i}`).value || `Day ${i}`);
    }

    const secondary = [];
    for (let i = 0; i < secCount; i++) {
        const el = document.getElementById(`secondary_name_${i}`);
        secondary.push({ name: (el && el.value) || `Item ${i + 1}` });
    }

    const existing = JSON.parse(localStorage.getItem('project') || '{}');

    return {
        version: PROJECT_VERSION,
        epitopes,
        timepoints,
        secondary,
        chartTitle: document.getElementById('chartTitle').value || '',
        yLabel: document.getElementById('yLabel').value || '',
        xLabel: document.getElementById('xLabel').value || 'Days Post Vaccination',
        secondaryLabel: document.getElementById('secondaryLabel').value || '',
        showYLabel: document.getElementById('showYLabel').checked,
        showXLabel: document.getElementById('showXLabel').checked,
        showSecondaryLabel: document.getElementById('showSecondaryLabel').checked,
        chartSettings: existing.chartSettings || null
    };
}

// ── Navigate to data entry ──────────────────────────────────────────
function goToData() {
    const project = gatherProjectFromForm();
    localStorage.setItem('project', JSON.stringify(project));

    // Always rebuild skeleton so structure matches current project,
    // carrying forward any values where epitope/timepoint/donor names still match.
    const oldRaw = localStorage.getItem('data');
    const oldData = oldRaw ? (() => { try { return JSON.parse(oldRaw); } catch(e) { return {}; } })() : {};

    let newData;
    if (project.secondary && project.secondary.length > 0) {
        newData = {};
        project.secondary.forEach(sec => {
            const oldDonor = oldData[sec.name] || {};
            newData[sec.name] = {};
            project.epitopes.forEach(ep => {
                const oldVals = oldDonor[ep.name] || [];
                newData[sec.name][ep.name] = project.timepoints.map((_, i) => oldVals[i] || 0);
            });
        });
    } else {
        newData = {};
        project.epitopes.forEach(ep => {
            const oldVals = Array.isArray(oldData[ep.name]) ? oldData[ep.name] : [];
            newData[ep.name] = project.timepoints.map((_, i) => oldVals[i] || 0);
        });
    }
    localStorage.setItem('data', JSON.stringify(newData));
    window.location.href = 'data.html';
}

// ── Project management (localStorage-backed) ────────────────────────
function saveProject() {
    const projectName = (document.getElementById('projectName').value || '').trim();
    if (!projectName) { alert('Please enter a project name'); return; }

    const project = gatherProjectFromForm();
    project.name = projectName;

    const currentData = localStorage.getItem('data');
    const projects = getProjects();
    projects[projectName] = {
        project,
        data: currentData ? JSON.parse(currentData) : null,
        modified: new Date().toISOString()
    };
    setProjects(projects);
    localStorage.setItem('project', JSON.stringify(project));

    setActiveProjectLabel(projectName);
    displaySavedProjects();
    alert(`Project "${projectName}" saved!`);
}

function loadProject(projectName) {
    const projects = getProjects();
    const entry = projects[projectName];
    if (!entry) { alert('Project not found'); return; }

    let project = entry.project;
    project = migrateProject(project);
    populateFormFromProject(project);
    localStorage.setItem('project', JSON.stringify(project));
    if (entry.data) {
        localStorage.setItem('data', JSON.stringify(entry.data));
    }
    setActiveProjectLabel(projectName);
    alert(`Project "${projectName}" loaded!`);
}

function deleteProject(projectName) {
    if (!confirm(`Delete "${projectName}"? This cannot be undone.`)) return;
    const projects = getProjects();
    delete projects[projectName];
    setProjects(projects);
    displaySavedProjects();
}

function displaySavedProjects() {
    const container = document.getElementById('savedProjectsList');
    if (!container) return;
    const projects = getProjects();
    const names = Object.keys(projects).sort();

    if (names.length === 0) {
        container.innerHTML = '<em style="color:#999;">No saved projects yet.</em>';
        return;
    }

    container.innerHTML = names.map(name => {
        const mod = projects[name].modified
            ? new Date(projects[name].modified).toLocaleDateString()
            : '';
        const escaped = name.replace(/'/g, "\\'");
        return `<div style="display:flex;align-items:center;gap:8px;margin:4px 0;">
            <button onclick="loadProject('${escaped}')" class="secondary small" style="width:auto;padding:4px 10px;font-size:12px;">Load</button>
            <button onclick="deleteProject('${escaped}')" style="background:#e53935;color:#fff;padding:4px 10px;font-size:12px;width:auto;border-radius:4px;border:none;cursor:pointer;">Delete</button>
            <span style="font-weight:600;">${name}</span>
            ${mod ? `<span style="color:#999;font-size:11px;">${mod}</span>` : ''}
        </div>`;
    }).join('');
}

function exportProject() {
    const projectName = (document.getElementById('projectName').value || '').trim();
    if (!projectName) { alert('Please enter a project name first'); return; }

    const project = gatherProjectFromForm();
    project.name = projectName;
    // Flush active session so export and saved copy are always in sync
    localStorage.setItem('project', JSON.stringify(project));

    const currentData = localStorage.getItem('data');
    const exportData = {
        project,
        data: currentData ? JSON.parse(currentData) : null
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${projectName.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.dotplot`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

function importProject() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.dotplot,.json';
    input.onchange = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            try {
                const importData = JSON.parse(event.target.result);
                let project = importData.project;

                if (!project) { alert('Invalid project file – no project data found'); return; }
                if (!project.name) { alert('Invalid project file – project has no name'); return; }

                project = migrateProject(project);

                const projects = getProjects();
                projects[project.name] = {
                    project,
                    data: importData.data || null,
                    modified: new Date().toISOString()
                };
                setProjects(projects);

                populateFormFromProject(project);
                localStorage.setItem('project', JSON.stringify(project));
                if (importData.data) {
                    localStorage.setItem('data', JSON.stringify(importData.data));
                }

                displaySavedProjects();
                alert(`Project "${project.name}" imported!`);
            } catch (error) {
                alert(`Error importing project: ${error.message}`);
            }
        };
        reader.readAsText(file);
    };
    input.click();
}

function goHome() { window.location.href = 'builder.html'; }

window.addEventListener('DOMContentLoaded', loadSavedData);
