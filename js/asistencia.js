// Logic for Attendance Analysis

let processedData = {};
let annoCurso = '';

document.addEventListener('DOMContentLoaded', () => {
    setupDragAndDrop('uploadSection', 'csvFile', processFile);
});

function switchTab(sectionId, btnElement) {
    // Hide all sections
    document.querySelectorAll('.evaluation-section').forEach(el => el.classList.remove('active'));
    // Show target
    document.getElementById(sectionId).classList.add('active');
    
    // Update buttons
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
    if(btnElement) btnElement.classList.add('active');
}

function processFile(file) {
    // Reset state
    processedData = {};
    annoCurso = '';

    // Reset UI
    document.getElementById('subtitle').textContent = 'Arrastra tu fichero CSV para analizar la asistencia por nivel';
    document.getElementById('title1ev').textContent = '1ª Evaluación';
    document.getElementById('title2ev').textContent = '2ª Evaluación';
    document.getElementById('title3ev').textContent = '3ª Evaluación';
    document.getElementById('titletotal').textContent = 'Total del Curso';

    // Clear tables
    document.getElementById('table1ev').innerHTML = '';
    document.getElementById('table2ev').innerHTML = '';
    document.getElementById('table3ev').innerHTML = '';
    document.getElementById('tabletotal').innerHTML = '';

    // UI Feedback
    const loading = document.getElementById('loading');
    const error = document.getElementById('error');
    const results = document.getElementById('results');

    if(loading) loading.classList.add('active');
    if(error) error.classList.remove('active');
    if(results) results.style.display = 'none';

    const reader = new FileReader();
    reader.onload = function(event) {
        try {
            const csvContent = event.target.result;
            processCSV(csvContent);
            if(loading) loading.classList.remove('active');
            if(results) results.style.display = 'block';
            
            // Reset to first tab
            const firstTabBtn = document.querySelector('.tab-btn');
            if(firstTabBtn) switchTab('section-1ev', firstTabBtn);

        } catch (err) {
            console.error(err);
            showError('Error al procesar el archivo: ' + err.message);
            if(loading) loading.classList.remove('active');
        }
    };
    reader.readAsText(file, 'UTF-8');
}

function processCSV(csvContent) {
    // Use common.js parseCSV
    const lines = parseCSV(csvContent);
    if (!lines || lines.length < 2) throw new Error('El archivo está vacío o no tiene cabecera');

    const headers = lines[0];

    const indices = {
        anno: headers.indexOf('C_ANNO'),
        curso: headers.indexOf('CURSO'),
        nia: headers.indexOf('NIA'),
        estado: headers.indexOf('ESTADO'),
        materiaGeneral: headers.indexOf('MATERIA_GENERAL'),
        faltas1: headers.indexOf('FALTAS_ASISTENCIA_1EV'),
        retrasos1: headers.indexOf('RETRASOS_ASISTENCIA_1EV'),
        faltas2: headers.indexOf('FALTAS_ASISTENCIA_2EV'),
        retrasos2: headers.indexOf('RETRASOS_ASISTENCIA_2EV'),
        faltas3: headers.indexOf('FALTAS_ASISTENCIA_3EV'),
        retrasos3: headers.indexOf('RETRASOS_ASISTENCIA_3EV')
    };

    const data1ev = {};
    const data2ev = {};
    const data3ev = {};
    const niasPorCurso = {};
    const niaMateriasProcesadas = new Set();

    for (let i = 1; i < lines.length; i++) {
        const row = lines[i];
        if (row.length < headers.length) continue;

        const estado = (row[indices.estado] || '').trim().toLowerCase();
        if (estado === 'pendiente') continue;

        const nia = row[indices.nia];
        const materiaGeneral = row[indices.materiaGeneral] || '';
        const niaMateriaKey = `${nia}|${materiaGeneral}`;

        if (niaMateriasProcesadas.has(niaMateriaKey)) continue;
        niaMateriasProcesadas.add(niaMateriaKey);

        if (!annoCurso && indices.anno !== -1) {
            annoCurso = row[indices.anno];
        }

        let curso = row[indices.curso];
        if (!curso) continue;

        // Groupings
        if (curso.startsWith('1º de Bachillerato')) {
            curso = '1º de Bachillerato';
        } else if (curso.startsWith('2º de Bachillerato')) {
            curso = '2º de Bachillerato';
        } else if (curso.startsWith('1º de E.S.O.')) {
            curso = '1º de E.S.O.';
        } else if (curso.startsWith('2º de E.S.O.')) {
            curso = '2º de E.S.O.';
        } else if (curso.startsWith('3º de E.S.O.') || curso.includes('1º Programa de Diversificación')) {
            curso = '3º de E.S.O.';
        } else if (curso.startsWith('4º de E.S.O.') || curso.includes('2º Programa de Diversificación')) {
            curso = '4º de E.S.O.';
        }

        if (!data1ev[curso]) {
            data1ev[curso] = { faltas: 0, retrasos: 0 };
            data2ev[curso] = { faltas: 0, retrasos: 0 };
            data3ev[curso] = { faltas: 0, retrasos: 0 };
            niasPorCurso[curso] = new Set();
        }

        data1ev[curso].faltas += parseInt(row[indices.faltas1]) || 0;
        data1ev[curso].retrasos += parseInt(row[indices.retrasos1]) || 0;
        data2ev[curso].faltas += parseInt(row[indices.faltas2]) || 0;
        data2ev[curso].retrasos += parseInt(row[indices.retrasos2]) || 0;
        data3ev[curso].faltas += parseInt(row[indices.faltas3]) || 0;
        data3ev[curso].retrasos += parseInt(row[indices.retrasos3]) || 0;

        niasPorCurso[curso].add(nia);
    }

    // Totals
    const dataTotal = {};
    for (const curso in data1ev) {
        dataTotal[curso] = {
            faltas: data1ev[curso].faltas + data2ev[curso].faltas + data3ev[curso].faltas,
            retrasos: data1ev[curso].retrasos + data2ev[curso].retrasos + data3ev[curso].retrasos
        };
    }

    processedData = {
        '1ev': { data: data1ev, nias: niasPorCurso },
        '2ev': { data: data2ev, nias: niasPorCurso },
        '3ev': { data: data3ev, nias: niasPorCurso },
        'total': { data: dataTotal, nias: niasPorCurso }
    };

    if (annoCurso) {
        document.getElementById('subtitle').textContent = `Análisis de asistencia por evaluaciones - Curso ${annoCurso}`;
        document.getElementById('title1ev').textContent = `1ª Evaluación (Curso ${annoCurso})`;
        document.getElementById('title2ev').textContent = `2ª Evaluación (Curso ${annoCurso})`;
        document.getElementById('title3ev').textContent = `3ª Evaluación (Curso ${annoCurso})`;
        document.getElementById('titletotal').textContent = `Total del Curso (Curso ${annoCurso})`;
    }

    renderTable('1ev', document.getElementById('table1ev'));
    renderTable('2ev', document.getElementById('table2ev'));
    renderTable('3ev', document.getElementById('table3ev'));
    renderTable('total', document.getElementById('tabletotal'));
}

function ordenCurso(curso) {
    const orden = {
        '1º de E.S.O.': 1,
        '2º de E.S.O.': 2,
        '3º de E.S.O.': 3,
        '4º de E.S.O.': 4,
        '1º de Bachillerato': 5,
        '2º de Bachillerato': 6
    };
    return orden[curso] || 99;
}

function renderTable(evaluation, container) {
    if (!processedData[evaluation]) return;
    const { data, nias } = processedData[evaluation];
    const sortedCursos = Object.keys(data).sort((a, b) => ordenCurso(a) - ordenCurso(b));

    let html = '<table class="asistencia-table"><thead><tr>';
    html += '<th>CURSO</th>';
    html += '<th class="number">ALUMNOS</th>';
    html += '<th class="number">FALTAS</th>';
    html += '<th class="number">RETRASOS</th>';
    html += '<th class="number">MEDIA FALTAS</th>';
    html += '<th class="number">MEDIA RETRASOS</th>';
    html += '</tr></thead><tbody>';

    let totalFaltas = 0;
    let totalRetrasos = 0;
    let totalAlumnos = new Set();

    for (const curso of sortedCursos) {
        const numAlumnos = nias[curso].size;
        const faltas = data[curso].faltas;
        const retrasos = data[curso].retrasos;
        const mediaFaltas = numAlumnos > 0 ? (faltas / numAlumnos).toFixed(2) : '0.00';
        const mediaRetrasos = numAlumnos > 0 ? (retrasos / numAlumnos).toFixed(2) : '0.00';

        html += '<tr>';
        html += `<td>${curso}</td>`;
        html += `<td class="number">${numAlumnos}</td>`;
        html += `<td class="number">${faltas}</td>`;
        html += `<td class="number">${retrasos}</td>`;
        html += `<td class="number">${mediaFaltas}</td>`;
        html += `<td class="number">${mediaRetrasos}</td>`;
        html += '</tr>';

        totalFaltas += faltas;
        totalRetrasos += retrasos;
        nias[curso].forEach(nia => totalAlumnos.add(nia));
    }

    const numTotalAlumnos = totalAlumnos.size;
    const mediaGeneralFaltas = numTotalAlumnos > 0 ? (totalFaltas / numTotalAlumnos).toFixed(2) : '0.00';
    const mediaGeneralRetrasos = numTotalAlumnos > 0 ? (totalRetrasos / numTotalAlumnos).toFixed(2) : '0.00';

    html += '<tr>';
    html += '<td><strong>TOTAL GENERAL</strong></td>';
    html += `<td class="number"><strong>${numTotalAlumnos}</strong></td>`;
    html += `<td class="number"><strong>${totalFaltas}</strong></td>`;
    html += `<td class="number"><strong>${totalRetrasos}</strong></td>`;
    html += `<td class="number"><strong>${mediaGeneralFaltas}</strong></td>`;
    html += `<td class="number"><strong>${mediaGeneralRetrasos}</strong></td>`;
    html += '</tr>';

    html += '</tbody></table>';
    container.innerHTML = html;
}

function downloadCSV(evaluation) {
    if(!processedData[evaluation]) return;
    const { data, nias } = processedData[evaluation];
    const sortedCursos = Object.keys(data).sort((a, b) => ordenCurso(a) - ordenCurso(b));

    let csv = 'CURSO,ALUMNOS,FALTAS,RETRASOS,MEDIA_FALTAS,MEDIA_RETRASOS\n';

    let totalFaltas = 0;
    let totalRetrasos = 0;
    let totalAlumnos = new Set();

    for (const curso of sortedCursos) {
        const numAlumnos = nias[curso].size;
        const faltas = data[curso].faltas;
        const retrasos = data[curso].retrasos;
        const mediaFaltas = numAlumnos > 0 ? (faltas / numAlumnos).toFixed(2) : '0.00';
        const mediaRetrasos = numAlumnos > 0 ? (retrasos / numAlumnos).toFixed(2) : '0.00';

        csv += `"${curso}",${numAlumnos},${faltas},${retrasos},${mediaFaltas},${mediaRetrasos}\n`;

        totalFaltas += faltas;
        totalRetrasos += retrasos;
        nias[curso].forEach(nia => totalAlumnos.add(nia));
    }

    const numTotalAlumnos = totalAlumnos.size;
    const mediaGeneralFaltas = numTotalAlumnos > 0 ? (totalFaltas / numTotalAlumnos).toFixed(2) : '0.00';
    const mediaGeneralRetrasos = numTotalAlumnos > 0 ? (totalRetrasos / numTotalAlumnos).toFixed(2) : '0.00';

    csv += `"TOTAL GENERAL",${numTotalAlumnos},${totalFaltas},${totalRetrasos},${mediaGeneralFaltas},${mediaGeneralRetrasos}\n`;

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);

    const fileName = evaluation === 'total' ?
        `${annoCurso}_TOTAL.csv` :
        `${annoCurso}_${evaluation.toUpperCase()}.csv`;

    link.setAttribute('href', url);
    link.setAttribute('download', fileName);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}