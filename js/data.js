// static/js/data.js
// Builds the Data Entry table with checkbox support for presence + partial

function buildDataTable() {
    const projectRaw = localStorage.getItem('project');
    if (!projectRaw) {
        window.location.href = 'builder.html';
        return;
    }
    const project = JSON.parse(projectRaw);

    const epitopes = project.epitopes.map(e => e.name);
    const timepoints = project.timepoints;
    const secondary = project.secondary || [];

    const donorRow = document.getElementById('donorRow');
    const timeRow = document.getElementById('timeRow');
    const bodyTable = document.getElementById('bodyTable');

    // Reset headers
    donorRow.innerHTML = '<th class="nowrap">Epitope</th>';
    timeRow.innerHTML = '<th></th>';

    if (secondary.length === 0) {
        // No donors - just timepoints
        const span = document.createElement('th');
        span.colSpan = Math.max(1, timepoints.length);
        span.textContent = 'Timepoints';
        donorRow.appendChild(span);

        timepoints.forEach(tp => {
            const th = document.createElement('th');
            th.textContent = tp;
            timeRow.appendChild(th);
        });
    } else {
        // Multiple donors - each donor spans timepoints.length columns
        secondary.forEach(donor => {
            const th = document.createElement('th');
            th.colSpan = Math.max(1, timepoints.length);
            th.textContent = donor.name;
            donorRow.appendChild(th);
        });

        // Second row: repeat timepoints for each donor
        secondary.forEach(() => {
            timepoints.forEach(tp => {
                const th = document.createElement('th');
                th.textContent = tp;
                timeRow.appendChild(th);
            });
        });
    }

    // Build body: one row per epitope with checkboxes for presence + partial
    bodyTable.innerHTML = '';
    for (let e = 0; e < epitopes.length; e++) {
        const tr = document.createElement('tr');

        const tdName = document.createElement('td');
        tdName.className = 'epitope-name';
        tdName.textContent = epitopes[e];
        tr.appendChild(tdName);

        if (secondary.length === 0) {
            // One checkbox pair per timepoint
            for (let t = 0; t < timepoints.length; t++) {
                const td = document.createElement('td');
                
                const checkGroup = document.createElement('div');
                checkGroup.className = 'check-group';
                
                // Presence checkbox
                const presenceLabel = document.createElement('label');
                presenceLabel.className = 'check-label';
                const presenceCheck = document.createElement('input');
                presenceCheck.type = 'checkbox';
                presenceCheck.id = `chk_e${e}_t${t}`;
                presenceCheck.className = 'presence-check';
                presenceLabel.appendChild(presenceCheck);
                presenceLabel.appendChild(document.createTextNode('✓'));
                
                // Partial checkbox
                const partialLabel = document.createElement('label');
                partialLabel.className = 'check-label partial';
                const partialCheck = document.createElement('input');
                partialCheck.type = 'checkbox';
                partialCheck.id = `partial_e${e}_t${t}`;
                partialCheck.className = 'partial-check';
                partialCheck.disabled = true;
                partialLabel.appendChild(partialCheck);
                partialLabel.appendChild(document.createTextNode('½'));
                
                // Enable/disable partial based on presence
                presenceCheck.addEventListener('change', () => {
                    partialCheck.disabled = !presenceCheck.checked;
                    if (!presenceCheck.checked) {
                        partialCheck.checked = false;
                    }
                });
                
                checkGroup.appendChild(presenceLabel);
                checkGroup.appendChild(partialLabel);
                td.appendChild(checkGroup);
                tr.appendChild(td);
            }
        } else {
            // Per-donor: for each donor, for each timepoint
            for (let d = 0; d < secondary.length; d++) {
                for (let t = 0; t < timepoints.length; t++) {
                    const td = document.createElement('td');
                    
                    const checkGroup = document.createElement('div');
                    checkGroup.className = 'check-group';
                    
                    // Presence checkbox
                    const presenceLabel = document.createElement('label');
                    presenceLabel.className = 'check-label';
                    const presenceCheck = document.createElement('input');
                    presenceCheck.type = 'checkbox';
                    presenceCheck.id = `chk_e${e}_d${d}_t${t}`;
                    presenceCheck.className = 'presence-check';
                    presenceLabel.appendChild(presenceCheck);
                    presenceLabel.appendChild(document.createTextNode('✓'));
                    
                    // Partial checkbox
                    const partialLabel = document.createElement('label');
                    partialLabel.className = 'check-label partial';
                    const partialCheck = document.createElement('input');
                    partialCheck.type = 'checkbox';
                    partialCheck.id = `partial_e${e}_d${d}_t${t}`;
                    partialCheck.className = 'partial-check';
                    partialCheck.disabled = true;
                    partialLabel.appendChild(partialCheck);
                    partialLabel.appendChild(document.createTextNode('½'));
                    
                    // Enable/disable partial based on presence
                    presenceCheck.addEventListener('change', () => {
                        partialCheck.disabled = !presenceCheck.checked;
                        if (!presenceCheck.checked) {
                            partialCheck.checked = false;
                        }
                    });
                    
                    checkGroup.appendChild(presenceLabel);
                    checkGroup.appendChild(partialLabel);
                    td.appendChild(checkGroup);
                    tr.appendChild(td);
                }
            }
        }

        bodyTable.appendChild(tr);
    }

    // Load existing data from localStorage
    const saved = localStorage.getItem('data');
    if (!saved) return;

    try {
        const data = JSON.parse(saved);

        if (secondary.length === 0) {
            // Flat structure: { epitopeName: [0/1/2,...] }
            epitopes.forEach((ep, eIdx) => {
                const arr = data[ep] || [];
                for (let t = 0; t < timepoints.length; t++) {
                    const val = arr[t] || 0;
                    const presenceEl = document.getElementById(`chk_e${eIdx}_t${t}`);
                    const partialEl = document.getElementById(`partial_e${eIdx}_t${t}`);
                    
                    if (val === 0) {
                        if (presenceEl) presenceEl.checked = false;
                        if (partialEl) {
                            partialEl.checked = false;
                            partialEl.disabled = true;
                        }
                    } else if (val === 1) {
                        if (presenceEl) presenceEl.checked = true;
                        if (partialEl) {
                            partialEl.disabled = false;
                            partialEl.checked = true;
                        }
                    } else if (val === 2) {
                        if (presenceEl) presenceEl.checked = true;
                        if (partialEl) {
                            partialEl.disabled = false;
                            partialEl.checked = false;
                        }
                    }
                }
            });
        } else {
            // Nested structure: { donorName: { epitopeName: [0/1/2,...] } }
            secondary.forEach((donor, dIdx) => {
                const donorName = donor.name;
                const donorObj = data[donorName] || {};
                epitopes.forEach((ep, eIdx) => {
                    const arr = donorObj[ep] || [];
                    for (let t = 0; t < timepoints.length; t++) {
                        const val = arr[t] || 0;
                        const presenceEl = document.getElementById(`chk_e${eIdx}_d${dIdx}_t${t}`);
                        const partialEl = document.getElementById(`partial_e${eIdx}_d${dIdx}_t${t}`);
                        
                        if (val === 0) {
                            if (presenceEl) presenceEl.checked = false;
                            if (partialEl) {
                                partialEl.checked = false;
                                partialEl.disabled = true;
                            }
                        } else if (val === 1) {
                            if (presenceEl) presenceEl.checked = true;
                            if (partialEl) {
                                partialEl.disabled = false;
                                partialEl.checked = true;
                            }
                        } else if (val === 2) {
                            if (presenceEl) presenceEl.checked = true;
                            if (partialEl) {
                                partialEl.disabled = false;
                                partialEl.checked = false;
                            }
                        }
                    }
                });
            });
        }
    } catch (err) {
        console.warn('Could not load data:', err);
    }
}

function saveAndChart() {
    const projectRaw = localStorage.getItem('project');
    if (!projectRaw) {
        alert('No project found');
        window.location.href = 'builder.html';
        return;
    }
    const project = JSON.parse(projectRaw);

    const epitopes = project.epitopes.map(e => e.name);
    const timepoints = project.timepoints;
    const secondary = project.secondary || [];

    if (secondary.length === 0) {
        // Flat structure
        const out = {};
        epitopes.forEach((ep, eIdx) => {
            out[ep] = [];
            for (let t = 0; t < timepoints.length; t++) {
                const presenceEl = document.getElementById(`chk_e${eIdx}_t${t}`);
                const partialEl = document.getElementById(`partial_e${eIdx}_t${t}`);
                
                let value = 0;
                if (presenceEl && presenceEl.checked) {
                    value = (partialEl && partialEl.checked) ? 1 : 2;
                }
                out[ep].push(value);
            }
        });
        localStorage.setItem('data', JSON.stringify(out));
    } else {
        // Nested structure
        const out = {};
        secondary.forEach((donor, dIdx) => {
            out[donor.name] = {};
            epitopes.forEach((ep, eIdx) => {
                out[donor.name][ep] = [];
                for (let t = 0; t < timepoints.length; t++) {
                    const presenceEl = document.getElementById(`chk_e${eIdx}_d${dIdx}_t${t}`);
                    const partialEl = document.getElementById(`partial_e${eIdx}_d${dIdx}_t${t}`);
                    
                    let value = 0;
                    if (presenceEl && presenceEl.checked) {
                        value = (partialEl && partialEl.checked) ? 1 : 2;
                    }
                    out[donor.name][ep].push(value);
                }
            });
        });
        localStorage.setItem('data', JSON.stringify(out));
    }

    window.location.href = 'chart.html';
}

function goBack() {
    window.location.href = '/builder';
}

window.addEventListener('DOMContentLoaded', buildDataTable);
