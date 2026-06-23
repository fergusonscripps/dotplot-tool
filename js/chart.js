const project = JSON.parse(localStorage.getItem('project'));
const rawData = localStorage.getItem('data');
if (!project || !rawData) { window.location.href = 'builder.html'; }
const data = JSON.parse(rawData);

const epitopes = project.epitopes.map(e => e.name);
const epColors = project.epitopes.map(e => e.color);
const timepoints = project.timepoints.map(tp => String(tp));
const secondaryType = project.secondaryType || 'donor';
const secondary = project.secondary || [];
const chartTitle = project.chartTitle || 'Epitope Response Over Time';
const xLabel = project.showXLabel !== false ? (project.xLabel || 'Days Post Vaccination') : '';
const yLabel = project.showYLabel !== false ? (project.yLabel || 'Epitopes') : '';
const secondaryLabel = project.showSecondaryLabel ? (project.secondaryLabel || (secondaryType === 'donor' ? 'Donor' : 'Antigen')) : '';

// ═══════════════════════════════════════════════════════════════════
//  Chart-layout settings — restored from project.chartSettings
// ═══════════════════════════════════════════════════════════════════
const cs = project.chartSettings || {};

let yLabelPositionX      = cs.yLabelPositionX      ?? -0.12;
let ySpacingValue        = cs.ySpacingValue         ?? 1;
let xSpacingValue        = cs.xSpacingValue         ?? 1;
let xGroupGapValue       = cs.xGroupGapValue        ?? 0;
let xTopLabelOffsetY     = cs.xTopLabelOffsetY      ?? -0.02;
let xBottomLabelOffsetY  = cs.xBottomLabelOffsetY   ?? -0.15;
let xAxisTitleX          = cs.xAxisTitleX            ?? -0.12;
let xAxisTitleY          = cs.xAxisTitleY            ?? -0.06;
let secondaryLabelX      = cs.secondaryLabelX       ?? -0.20;
let secondaryLabelY      = cs.secondaryLabelY        ?? -0.06;
let donorLineY           = cs.donorLineY             ?? -0.06;
let donorLineWidth       = cs.donorLineWidth         ?? 6;
let yLabelOffsetLeft     = cs.yLabelOffsetLeft       ?? 300;
let xTopLabelRotation    = cs.xTopLabelRotation      ?? 0;
let xBottomLabelRotation = cs.xBottomLabelRotation   ?? 0;
let xAxisTitleRotation   = cs.xAxisTitleRotation     ?? 0;

let showKebabLines       = cs.showKebabLines         ?? true;
let hollowHalves         = cs.hollowHalves           ?? false;
let blackOutlines        = cs.blackOutlines          ?? false;
let kebabLineWidth       = cs.kebabLineWidth         ?? 1;
let kebabLineColor       = cs.kebabLineColor         ?? '#cccccc';
let kebabDashSpacing     = cs.kebabDashSpacing       ?? '5,5';

let axisTickThickness    = cs.axisTickThickness      ?? 2;
let donorLineExtend      = cs.donorLineExtend        ?? 0.5;
let donorLineUShape      = cs.donorLineUShape        ?? false;
let donorUCapHeight      = cs.donorUCapHeight        ?? 0.015;

// ── Sync slider / checkbox UI to restored values on load ────────
function syncControlsToValues() {
    const map = [
        ['yLabelSlider',             yLabelPositionX,      'yLabelPositionValue'],
        ['ySpacingSlider',           ySpacingValue,        'ySpacingValue'],
        ['xSpacingSlider',           xSpacingValue,        'xSpacingValue'],
        ['xGroupGapSlider',          xGroupGapValue,       'xGroupGapValue'],
        ['xTopLabelYSlider',         xTopLabelOffsetY,     'xTopLabelYValue'],
        ['xBottomLabelYSlider',      xBottomLabelOffsetY,  'xBottomLabelYValue'],
        ['xAxisTitleXSlider',        xAxisTitleX,          'xAxisTitleXValue'],
        ['xAxisTitleYSlider',        xAxisTitleY,          'xAxisTitleYValue'],
        ['secondaryLabelXSlider',    secondaryLabelX,      'secondaryLabelXValue'],
        ['secondaryLabelYSlider',    secondaryLabelY,      'secondaryLabelYValue'],
        ['donorLineYSlider',         donorLineY,           'donorLineYValue'],
        ['donorLineWidthSlider',     donorLineWidth,       'donorLineWidthValue'],
        ['donorLineExtendSlider',    donorLineExtend,      'donorLineExtendValue'],
        ['donorUCapHeightSlider',    donorUCapHeight,      'donorUCapHeightValue'],
        ['axisTickThicknessSlider',  axisTickThickness,    'axisTickThicknessValue'],
        ['kebabWidthSlider',         kebabLineWidth,       'kebabWidthValue'],
        ['leftMarginSlider',         yLabelOffsetLeft,     'leftMarginValue'],
        ['xTopLabelRotationSlider',  xTopLabelRotation,    'xTopLabelRotationValue'],
        ['xBottomLabelRotationSlider', xBottomLabelRotation, 'xBottomLabelRotationValue'],
        ['xAxisTitleRotationSlider', xAxisTitleRotation,   'xAxisTitleRotationValue'],
    ];
    map.forEach(([sliderId, val, labelId]) => {
        const s = document.getElementById(sliderId);
        const l = document.getElementById(labelId);
        if (s) s.value = val;
        if (l) l.textContent = val;
    });

    // Kebab dash — slider value is half the first number
    const kebabDashSlider = document.getElementById('kebabDashSlider');
    const kebabDashLabel  = document.getElementById('kebabDashValue');
    if (kebabDashSlider) {
        const dashNum = parseInt(kebabDashSpacing.split(',')[0]) || 5;
        kebabDashSlider.value = dashNum / 2;
    }
    if (kebabDashLabel) kebabDashLabel.textContent = kebabDashSpacing;

    // Color inputs
    const cp = document.getElementById('kebabColorPicker');
    const ch = document.getElementById('kebabColorHex');
    if (cp) cp.value = kebabLineColor;
    if (ch) ch.value = kebabLineColor;

    // Checkboxes
    const cbMap = [
        ['kebabLinesToggle',    showKebabLines],
        ['hollowHalvesToggle',  hollowHalves],
        ['blackOutlinesToggle', blackOutlines],
        ['donorUShapeToggle',   donorLineUShape],
    ];
    cbMap.forEach(([id, val]) => {
        const el = document.getElementById(id);
        if (el) el.checked = val;
    });
}

// ── Gather current settings into an object ──────────────────────
function gatherChartSettings() {
    return {
        yLabelPositionX, ySpacingValue, xSpacingValue, xGroupGapValue,
        xTopLabelOffsetY, xBottomLabelOffsetY,
        xAxisTitleX, xAxisTitleY,
        secondaryLabelX, secondaryLabelY,
        donorLineY, donorLineWidth,
        yLabelOffsetLeft,
        xTopLabelRotation, xBottomLabelRotation, xAxisTitleRotation,
        showKebabLines, hollowHalves, blackOutlines,
        kebabLineWidth, kebabLineColor, kebabDashSpacing,
        axisTickThickness, donorLineExtend, donorLineUShape, donorUCapHeight
    };
}

// ── Persist to localStorage (and thus into any subsequent .dotplot save) ─
function saveChartSettings() {
    project.chartSettings = gatherChartSettings();
    localStorage.setItem('project', JSON.stringify(project));

    if (project.name) {
        const projects = JSON.parse(localStorage.getItem('dotplot_projects_v1') || '{}');
        if (projects[project.name]) {
            projects[project.name].project = project;
            projects[project.name].modified = new Date().toISOString();
            localStorage.setItem('dotplot_projects_v1', JSON.stringify(projects));
        }
    }

    alert('Chart settings saved!');
}

// ═══════════════════════════════════════════════════════════════════
//  Chart rendering (unchanged logic)
// ═══════════════════════════════════════════════════════════════════

function darkenHex(hexCode, amt = 0.6) {
    const hex = hexCode.replace('#', '');
    const r = Math.max(0, Math.floor(parseInt(hex.substring(0, 2), 16) * amt));
    const g = Math.max(0, Math.floor(parseInt(hex.substring(2, 4), 16) * amt));
    const b = Math.max(0, Math.floor(parseInt(hex.substring(4, 6), 16) * amt));
    return '#' + r.toString(16).padStart(2, '0') + g.toString(16).padStart(2, '0') + b.toString(16).padStart(2, '0');
}

function buildChart() {
    let xCategories = [], xTopLabels = [], xBottomLabels = [];
    if (secondary.length === 0 || secondaryType === 'none') {
        xCategories = timepoints.slice();
        xTopLabels = timepoints.slice();
        xBottomLabels = timepoints.slice();
    } else {
        secondary.forEach((sec, donorIdx) => {
            if (donorIdx > 0 && xGroupGapValue > 0) {
                for (let g = 0; g < xGroupGapValue; g++) {
                    xCategories.push(`__gap_${donorIdx}_${g}__`);
                    xTopLabels.push('');
                    xBottomLabels.push('');
                }
            }
            timepoints.forEach(tp => {
                const cat = `${tp}___${sec.name}`;
                xCategories.push(cat);
                xTopLabels.push(tp);
                xBottomLabels.push(sec.name);
            });
        });
    }

    const baseHeight = 400;
    const plotHeight = baseHeight + (epitopes.length - 1) * ySpacingValue * 60;
    const yPositions = epitopes.map((_, i) => i);
    const baseWidth = 1200;
    const plotWidth = baseWidth * xSpacingValue;

    const allShapes = [];

    // Donor grouping lines
    for (let d = 0; d < secondary.length; d++) {
        const tpCount = timepoints.length;
        const startIdx = (xGroupGapValue === 0) ? (d * tpCount) : (d * (tpCount + xGroupGapValue));
        const endIdx = startIdx + (tpCount - 1);
        const lineX0 = startIdx - donorLineExtend;
        const lineX1 = endIdx + donorLineExtend;

        if (donorLineUShape) {
            const capTop = donorLineY + donorUCapHeight;
            const ry = Math.min(donorUCapHeight * 0.45, 0.006);
            const rx = 0.12;
            const path = [
                `M ${lineX0} ${capTop}`,
                `L ${lineX0} ${donorLineY + ry}`,
                `Q ${lineX0} ${donorLineY} ${lineX0 + rx} ${donorLineY}`,
                `L ${lineX1 - rx} ${donorLineY}`,
                `Q ${lineX1} ${donorLineY} ${lineX1} ${donorLineY + ry}`,
                `L ${lineX1} ${capTop}`
            ].join(' ');
            allShapes.push({
                type: 'path', xref: 'x', yref: 'paper', path,
                line: { color: '#000', width: donorLineWidth }, layer: 'below'
            });
        } else {
            allShapes.push({
                type: 'line', xref: 'x', yref: 'paper',
                x0: lineX0, x1: lineX1, y0: donorLineY, y1: donorLineY,
                line: { color: '#000', width: donorLineWidth }, layer: 'below'
            });
        }
    }

    // Kebab lines
    if (showKebabLines) {
        xCategories.forEach(cat => {
            if (!cat.startsWith('__gap_')) {
                allShapes.push({
                    type: 'line', xref: 'x', yref: 'y',
                    x0: cat, x1: cat, y0: -0.5, y1: epitopes.length - 0.5,
                    line: { color: kebabLineColor, width: kebabLineWidth, dash: kebabDashSpacing },
                    layer: 'below'
                });
            }
        });
    }

    // Data points
    const dataPoints = [];
    for (let e = 0; e < epitopes.length; e++) {
        const ep = epitopes[e], epY = e;
        const baseColor = epColors[e] || '#FF6B6B';
        const outlineColor = blackOutlines ? '#000' : darkenHex(baseColor);

        for (let catIdx = 0; catIdx < xCategories.length; catIdx++) {
            const cat = xCategories[catIdx];
            if (cat.startsWith('__gap_')) continue;

            let value = 0;
            if (secondary.length === 0 || secondaryType === 'none') {
                value = (data[ep] && data[ep][catIdx]) ? data[ep][catIdx] : 0;
            } else {
                const parts = cat.split('___');
                const tp = parts[0], donorName = parts[1];
                const tpIdx = timepoints.indexOf(tp);
                const donorObj = data[donorName] || {};
                value = (donorObj[ep] || [])[tpIdx] || 0;
            }
            if (value > 0) {
                dataPoints.push({ x: cat, y: epY, value, epitope: ep, color: baseColor, outlineColor });
            }
        }
    }

    // Traces
    const traces = [];
    for (let e = 0; e < epitopes.length; e++) {
        const ep = epitopes[e];
        const baseColor = epColors[e] || '#FF6B6B';
        const outlineColor = blackOutlines ? '#000' : darkenHex(baseColor);
        const pts_full = dataPoints.filter(p => p.epitope === ep && p.value === 2);
        const pts_half = dataPoints.filter(p => p.epitope === ep && p.value === 1);

        if (pts_full.length > 0) {
            traces.push({
                x: pts_full.map(p => p.x), y: pts_full.map(p => p.y),
                mode: 'markers', name: ep + ' (full)', showlegend: false,
                marker: { size: 24, color: baseColor, symbol: 'circle', line: { width: 2, color: outlineColor } },
                hovertemplate: `${ep} (full) at %{x}<extra></extra>`
            });
        }

        if (pts_half.length > 0) {
            if (hollowHalves) {
                traces.push({
                    x: pts_half.map(p => p.x), y: pts_half.map(p => p.y),
                    mode: 'markers', name: ep + ' (donut-outer)', showlegend: false,
                    marker: { size: 24, color: baseColor, symbol: 'circle', line: { width: 2, color: outlineColor } },
                    hovertemplate: `${ep} (partial) at %{x}<extra></extra>`
                });
                traces.push({
                    x: pts_half.map(p => p.x), y: pts_half.map(p => p.y),
                    mode: 'markers', name: ep + ' (donut-hole)', showlegend: false,
                    marker: { size: 14, color: 'white', symbol: 'circle', line: { width: 2, color: outlineColor } },
                    hoverinfo: 'skip'
                });
            } else {
                traces.push({
                    x: pts_half.map(p => p.x), y: pts_half.map(p => p.y),
                    mode: 'markers', name: ep + ' (partial-filled)', showlegend: false,
                    marker: { size: 24, color: baseColor, symbol: 'circle', line: { width: 2, color: outlineColor } },
                    hovertemplate: `${ep} (partial) at %{x}<extra></extra>`
                });
            }
        }
    }

    // Layout
    const layout = {
        title: chartTitle,
        xaxis: {
            type: 'category', categoryorder: 'array', categoryarray: xCategories,
            tickvals: xCategories, ticktext: [], showticklabels: false,
            showgrid: false, zeroline: false,
            linewidth: axisTickThickness, linecolor: '#000', ticks: '', automargin: true
        },
        yaxis: {
            title: '', tickmode: 'array', tickvals: yPositions, ticktext: epitopes,
            tickfont: { size: 24, family: 'Arial, sans-serif', color: '#000', weight: 'bold' },
            showgrid: false, zeroline: false,
            linewidth: axisTickThickness, linecolor: '#000',
            ticks: 'outside', ticklen: 10, tickwidth: axisTickThickness, tickcolor: '#000',
            automargin: true, range: [-0.5, epitopes.length - 0.5]
        },
        shapes: allShapes,
        plot_bgcolor: '#fff', paper_bgcolor: '#fff',
        height: plotHeight, width: plotWidth,
        margin: { l: yLabelOffsetLeft, r: 50, t: 80, b: (secondary.length > 0 ? 180 : 100) },
        showlegend: false,
        annotations: [
            ...xCategories.map((cat, i) => ({
                xref: 'x', x: cat, yref: 'paper', y: xTopLabelOffsetY,
                text: String(xTopLabels[i]), showarrow: false, xanchor: 'center', yanchor: 'top',
                textangle: -xTopLabelRotation,
                font: { size: 22, family: 'Arial, sans-serif', weight: 'bold', color: '#000' }
            })),
            ...(secondary.length > 0 ? secondary.map((sec, d) => {
                const tpCount = timepoints.length;
                const startIdx = (xGroupGapValue === 0) ? (d * tpCount) : (d * (tpCount + xGroupGapValue));
                const midIdx = startIdx + Math.floor((tpCount - 1) / 2);
                return {
                    xref: 'x', x: xCategories[midIdx], yref: 'paper', y: xBottomLabelOffsetY,
                    text: String(sec.name), showarrow: false, xanchor: 'center', yanchor: 'top',
                    textangle: -xBottomLabelRotation,
                    font: { size: 22, family: 'Arial, sans-serif', weight: 'bold', color: '#000' }
                };
            }) : []),
            {
                xref: 'paper', yref: 'paper', x: yLabelPositionX, y: -0.06,
                text: yLabel, showarrow: false, textangle: 0,
                font: { size: 22, family: 'Arial, sans-serif', weight: 'bold', color: '#000' },
                xanchor: 'right', yanchor: 'middle'
            },
            ...(secondary.length > 0 ? [{
                xref: 'paper', yref: 'paper', x: secondaryLabelX, y: secondaryLabelY,
                text: secondaryLabel, showarrow: false, textangle: 0,
                font: { size: 22, family: 'Arial, sans-serif', weight: 'bold', color: '#000' },
                xanchor: 'right', yanchor: 'middle'
            }] : []),
            {
                xref: 'paper', yref: 'paper', x: xAxisTitleX, y: xAxisTitleY,
                text: xLabel, showarrow: false, textangle: -xAxisTitleRotation,
                font: { size: 22, family: 'Arial, sans-serif', weight: 'bold', color: '#000' },
                xanchor: 'right', yanchor: 'middle'
            }
        ]
    };

    Plotly.newPlot('chart', traces, layout, { responsive: true });
}

// ── Initial build ───────────────────────────────────────────────────
syncControlsToValues();
buildChart();

// ── Slider / toggle callbacks ───────────────────────────────────────
function updateYLabelPosition(v)      { yLabelPositionX = parseFloat(v);      document.getElementById('yLabelPositionValue').textContent = v;      buildChart(); }
function updateYSpacing(v)            { ySpacingValue = parseFloat(v);        document.getElementById('ySpacingValue').textContent = v;            buildChart(); }
function updateXSpacing(v)            { xSpacingValue = parseFloat(v);        document.getElementById('xSpacingValue').textContent = v;            buildChart(); }
function updateXTopLabelY(v)          { xTopLabelOffsetY = parseFloat(v);     document.getElementById('xTopLabelYValue').textContent = v;          buildChart(); }
function updateXBottomLabelY(v)       { xBottomLabelOffsetY = parseFloat(v);  document.getElementById('xBottomLabelYValue').textContent = v;       buildChart(); }
function updateXAxisTitleX(v)         { xAxisTitleX = parseFloat(v);          document.getElementById('xAxisTitleXValue').textContent = v;         buildChart(); }
function updateXAxisTitleY(v)         { xAxisTitleY = parseFloat(v);          document.getElementById('xAxisTitleYValue').textContent = v;         buildChart(); }
function updateSecondaryLabelX(v)     { secondaryLabelX = parseFloat(v);      document.getElementById('secondaryLabelXValue').textContent = v;     buildChart(); }
function updateSecondaryLabelY(v)     { secondaryLabelY = parseFloat(v);      document.getElementById('secondaryLabelYValue').textContent = v;     buildChart(); }
function updateDonorLineY(v)          { donorLineY = parseFloat(v);           document.getElementById('donorLineYValue').textContent = v;          buildChart(); }
function updateDonorLineWidth(v)      { donorLineWidth = parseInt(v);         document.getElementById('donorLineWidthValue').textContent = v;      buildChart(); }
function updateXGroupGap(v)           { xGroupGapValue = parseInt(v);         document.getElementById('xGroupGapValue').textContent = v;           buildChart(); }
function updateLeftMargin(v)          { yLabelOffsetLeft = parseInt(v);        document.getElementById('leftMarginValue').textContent = v;          buildChart(); }
function updateXTopLabelRotation(v)   { xTopLabelRotation = parseInt(v);      document.getElementById('xTopLabelRotationValue').textContent = v;   buildChart(); }
function updateXBottomLabelRotation(v){ xBottomLabelRotation = parseInt(v);   document.getElementById('xBottomLabelRotationValue').textContent = v; buildChart(); }
function updateXAxisTitleRotation(v)  { xAxisTitleRotation = parseInt(v);     document.getElementById('xAxisTitleRotationValue').textContent = v;   buildChart(); }

function toggleKebabLines(checked)    { showKebabLines = checked;    buildChart(); }
function toggleHollowHalves(checked)  { hollowHalves = checked;      buildChart(); }
function toggleBlackOutlines(checked) { blackOutlines = checked;     buildChart(); }
function updateKebabWidth(v)          { kebabLineWidth = parseFloat(v); document.getElementById('kebabWidthValue').textContent = v; buildChart(); }
function updateKebabColor(v)          { kebabLineColor = v; document.getElementById('kebabColorPicker').value = v; document.getElementById('kebabColorHex').value = v; buildChart(); }
function updateKebabDashSpacing(v)    { const dash = v * 2; kebabDashSpacing = `${dash},${dash}`; document.getElementById('kebabDashValue').textContent = kebabDashSpacing; buildChart(); }

function updateAxisTickThickness(v)   { axisTickThickness = parseInt(v);  document.getElementById('axisTickThicknessValue').textContent = v; buildChart(); }
function updateDonorLineExtend(v)     { donorLineExtend = parseFloat(v);  document.getElementById('donorLineExtendValue').textContent = v;  buildChart(); }
function toggleDonorUShape(checked)   { donorLineUShape = checked;   buildChart(); }
function updateDonorUCapHeight(v)     { donorUCapHeight = parseFloat(v);  document.getElementById('donorUCapHeightValue').textContent = v;  buildChart(); }

// ── Downloads ───────────────────────────────────────────────────────
function downloadSVG()  { Plotly.downloadImage('chart', { format: 'svg', filename: 'dotplot' }); }
function downloadPNG()  { html2canvas(document.getElementById('chart'), { scale: 2, useCORS: true, allowTaint: true }).then(c => { const a = document.createElement('a'); a.href = c.toDataURL('image/png'); a.download = 'dotplot.png'; a.click(); }).catch(e => { console.error(e); alert('Error generating PNG.'); }); }
function downloadTIFF() { html2canvas(document.getElementById('chart'), { scale: 2, useCORS: true, allowTaint: true }).then(c => { const a = document.createElement('a'); a.href = c.toDataURL('image/png'); a.download = 'dotplot.tiff'; a.click(); }).catch(e => { console.error(e); alert('Error generating TIFF.'); }); }

function goBack() { window.location.href = 'data.html'; }
function goHome() { window.location.href = 'builder.html'; }
