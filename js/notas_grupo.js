let grafico = null;
window._historico = [];

// -----------------------------
// CARGA DE ARCHIVOS
// -----------------------------
document.getElementById("input").addEventListener("change", async (e) => {
    const archivos = [...e.target.files];

    for (const archivo of archivos) {
        const alumnos = await leerExcel(archivo);
        registrarEnHistorico(archivo, alumnos);
    }

    // Mostrar resultados del último boletín cargado
    const ultimo = window._historico[window._historico.length - 1];
    mostrarResultados(ultimo.alumnos);
});

// -----------------------------
// LECTURA DE EXCEL
// -----------------------------
async function leerExcel(archivo) {
    return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            const data = new Uint8Array(e.target.result);
            const workbook = XLSX.read(data, { type: "array" });

            const sheet = workbook.Sheets[workbook.SheetNames[0]];
            const json = XLSX.utils.sheet_to_json(sheet);

            const alumnos = json.map(row => ({
                nombre: row.Nombre,
                grupo: row.Grupo,
                suspensos: row.Suspensos
            }));

            resolve(alumnos);
        };
        reader.readAsArrayBuffer(archivo);
    });
}

// -----------------------------
// REGISTRO EN HISTÓRICO
// -----------------------------
function registrarEnHistorico(archivo, alumnos) {
    const nombre = archivo.name;

    // Detectar curso académico en el nombre
    const matchCurso = nombre.match(/(20\d{2})[^\d]?(20\d{2})/);
    let curso = "Desconocido";

    if (matchCurso) {
        curso = matchCurso[1] + "-" + matchCurso[2];
    }

    const fecha = new Date().toISOString();

    window._historico.push({
        curso,
        fecha,
        alumnos
    });
}

// -----------------------------
// TABLAS
// -----------------------------
function mostrarTablaGrupos(estadisticas) {
    let html = `
        <table>
            <tr>
                <th>Grupo</th>
                <th>Aprobados</th>
                <th>1 Suspenso</th>
                <th>2 Suspensos</th>
                <th>3 Suspensos</th>
                <th>4+ Suspensos</th>
            </tr>
    `;

    for (const g in estadisticas) {
        const e = estadisticas[g];
        html += `
            <tr>
                <td>${g}</td>
                <td>${e.aprobados}</td>
                <td>${e.susp1}</td>
                <td>${e.susp2}</td>
                <td>${e.susp3}</td>
                <td>${e.susp4mas}</td>
            </tr>
        `;
    }

    html += "</table>";
    document.getElementById("tabla").innerHTML = html;
}

function mostrarTablaNiveles(estadisticas) {
    let html = `
        <table>
            <tr>
                <th>Nivel</th>
                <th>Aprobados</th>
                <th>1 Suspenso</th>
                <th>2 Suspensos</th>
                <th>3 Suspensos</th>
                <th>4+ Suspensos</th>
            </tr>
    `;

    for (const n in estadisticas) {
        const e = estadisticas[n];
        html += `
            <tr>
                <td>${n}</td>
                <td>${e.aprobados}</td>
                <td>${e.susp1}</td>
                <td>${e.susp2}</td>
                <td>${e.susp3}</td>
                <td>${e.susp4mas}</td>
            </tr>
        `;
    }

    html += "</table>";
    document.getElementById("tabla").innerHTML = html;
}

// -----------------------------
// GRÁFICOS
// -----------------------------
function pintarGraficoPorNivel(estadisticas) {
    const ctx = document.getElementById("grafico");

    if (grafico) grafico.destroy();

    const niveles = Object.keys(estadisticas);
    const aprobados = niveles.map(n => estadisticas[n].aprobados);
    const suspensos = niveles.map(n =>
        estadisticas[n].susp1 +
        estadisticas[n].susp2 +
        estadisticas[n].susp3 +
        estadisticas[n].susp4mas
    );

    grafico = new Chart(ctx, {
        type: "bar",
        data: {
            labels: niveles,
            datasets: [
                {
                    label: "Aprobados",
                    data: aprobados,
                    backgroundColor: "rgba(75, 192, 192, 0.7)"
                },
                {
                    label: "Suspensos",
                    data: suspensos,
                    backgroundColor: "rgba(255, 99, 132, 0.7)"
                }
            ]
        },
        options: { responsive: true }
    });
}

function pintarGraficoCombinado(alumnos) {
    const ctx = document.getElementById("grafico");

    if (grafico) grafico.destroy();

    const grupos = agruparPorGrupo(alumnos);
    const etiquetas = Object.keys(grupos);

    const aprobados = etiquetas.map(g => calcularEstadisticas(grupos[g]).aprobados);
    const suspensos = etiquetas.map(g => {
        const e = calcularEstadisticas(grupos[g]);
        return e.susp1 + e.susp2 + e.susp3 + e.susp4mas;
    });

    grafico = new Chart(ctx, {
        type: "bar",
        data: {
            labels: etiquetas,
            datasets: [
                {
                    label: "Aprobados",
                    data: aprobados,
                    backgroundColor: "rgba(54, 162, 235, 0.7)"
                },
                {
                    label: "Suspensos",
                    data: suspensos,
                    backgroundColor: "rgba(255, 159, 64, 0.7)"
                }
            ]
        },
        options: { responsive: true }
    });
}

// -----------------------------
// EVOLUCIÓN TEMPORAL
// -----------------------------
function evolucionPorNivel(historico) {
    const resultado = {};

    for (const entrada of historico) {
        const fecha = entrada.fecha;
        const niveles = calcularEstadisticasPorNivel(entrada.alumnos);

        for (const nivel in niveles) {
            if (!resultado[nivel]) resultado[nivel] = [];
            resultado[nivel].push({ fecha, ...niveles[nivel] });
        }
    }

    return resultado;
}

function evolucionPorGrupo(historico) {
    const resultado = {};

    for (const entrada of historico) {
        const fecha = entrada.fecha;
        const grupos = calcularEstadisticasPorGrupo(entrada.alumnos);

        for (const grupo in grupos) {
            if (!resultado[grupo]) resultado[grupo] = [];
            resultado[grupo].push({ fecha, ...grupos[grupo] });
        }
    }

    return resultado;
}

function pintarEvolucionTemporal(datos, titulo) {
    const ctx = document.getElementById("grafico");

    if (grafico) grafico.destroy();

    const etiquetas = [...new Set(
        Object.values(datos).flat().map(d => d.fecha)
    )].sort();

    const datasets = Object.keys(datos).map(nombre => ({
        label: nombre,
        data: etiquetas.map(f => {
            const punto = datos[nombre].find(d => d.fecha === f);
            return punto ? punto.aprobados : null;
        }),
        borderWidth: 2,
        fill: false,
        tension: 0.2
    }));

    grafico = new Chart(ctx, {
        type: "line",
        data: { labels: etiquetas, datasets },
        options: {
            responsive: true,
            plugins: { title: { display: true, text: titulo } }
        }
    });
}

// -----------------------------
// COMPARATIVA ENTRE CURSOS
// -----------------------------
function agruparPorCurso(historico) {
    const cursos = {};
    for (const entrada of historico) {
        if (!cursos[entrada.curso]) cursos[entrada.curso] = [];
        cursos[entrada.curso].push(entrada);
    }
    return cursos;
}

function evolucionPorNivelComparada(historico) {
    const cursos = agruparPorCurso(historico);
    const resultado = {};

    for (const curso in cursos) {
        const evol = evolucionPorNivel(cursos[curso]);

        for (const nivel in evol) {
            if (!resultado[nivel]) resultado[nivel] = {};
            resultado[nivel][curso] = evol[nivel];
        }
    }

    return resultado;
}

function evolucionPorGrupoComparada(historico) {
    const cursos = agruparPorCurso(historico);
    const resultado = {};

    for (const curso in cursos) {
        const evol = evolucionPorGrupo(cursos[curso]);

        for (const grupo in evol) {
            if (!resultado[grupo]) resultado[grupo] = {};
            resultado[grupo][curso] = evol[grupo];
        }
    }

    return resultado;
}

function pintarComparativaCursos(datos, titulo) {
    const ctx = document.getElementById("grafico");

    if (grafico) grafico.destroy();

    const datasets = [];

    for (const curso in datos) {
        const serie = datos[curso];

        datasets.push({
            label: curso,
            data: serie.map(s => s.aprobados),
            borderWidth: 2,
            fill: false,
            tension: 0.2
        });
    }

    grafico = new Chart(ctx, {
        type: "line",
        data: {
            labels: datos[Object.keys(datos)[0]].map(s => s.fecha),
            datasets
        },
        options: {
            responsive: true,
            plugins: { title: { display: true, text: titulo } }
        }
    });
}

// -----------------------------
// CONTROL PRINCIPAL
// -----------------------------
document.getElementById("modo").addEventListener("change", () => {
    const ultimo = window._historico[window._historico.length - 1];
    mostrarResultados(ultimo.alumnos);
});

function mostrarResultados(alumnos) {
    const modo = document.getElementById("modo").value;

    if (modo === "grupo") {
        const est = calcularEstadisticasPorGrupo(alumnos);
        mostrarTablaGrupos(est);
        pintarGraficoCombinado(alumnos);
    }

    else if (modo === "nivel") {
        const est = calcularEstadisticasPorNivel(alumnos);
        mostrarTablaNiveles(est);
        pintarGraficoPorNivel(est);
    }

    else if (modo === "combinado") {
        const est = calcularEstadisticasPorGrupo(alumnos);
        mostrarTablaGrupos(est);
        pintarGraficoCombinado(alumnos);
    }

    else if (modo === "evolucion_nivel") {
        const datos = evolucionPorNivel(window._historico);
        pintarEvolucionTemporal(datos, "Evolución temporal por nivel");
        document.getElementById("tabla").innerHTML = "";
    }

    else if (modo === "evolucion_grupo") {
        const datos = evolucionPorGrupo(window._historico);
        pintarEvolucionTemporal(datos, "Evolución temporal por grupo");
        document.getElementById("tabla").innerHTML = "";
    }

    else if (modo === "comparativa_nivel") {
        const datos = evolucionPorNivelComparada(window._historico);
        const nivel = Object.keys(datos)[0];
        pintarComparativaCursos(datos[nivel], "Comparativa entre cursos – " + nivel);
        document.getElementById("tabla").innerHTML = "";
    }

    else if (modo === "comparativa_grupo") {
        const datos = evolucionPorGrupoComparada(window._historico);
        const grupo = Object.keys(datos)[0];
        pintarComparativaCursos(datos[grupo], "Comparativa entre cursos – Grupo " + grupo);
        document.getElementById("tabla").innerHTML = "";
    }
}
