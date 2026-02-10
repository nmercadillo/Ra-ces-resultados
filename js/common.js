// Normalización de nombres de grupo
function normalizarGrupo(grupo) {
    return grupo.trim().toUpperCase();
}

// Obtener nivel desde el grupo
function obtenerNivel(grupo) {
    grupo = grupo.toUpperCase().trim();

    if (/^1[A-Z]/.test(grupo)) return "1º ESO";
    if (/^2[A-Z]/.test(grupo)) return "2º ESO";
    if (/^3[A-Z]/.test(grupo)) return "3º ESO";
    if (/^4[A-Z]/.test(grupo)) return "4º ESO";

    if (/^1.*BAC/.test(grupo)) return "1º Bachillerato";
    if (/^2.*BAC/.test(grupo)) return "2º Bachillerato";

    return "Otros";
}

// Agrupar alumnos por grupo
function agruparPorGrupo(alumnos) {
    const grupos = {};
    for (const alumno of alumnos) {
        const g = normalizarGrupo(alumno.grupo);
        if (!grupos[g]) grupos[g] = [];
        grupos[g].push(alumno);
    }
    return grupos;
}

// Agrupar alumnos por nivel
function agruparPorNivel(alumnos) {
    const niveles = {};
    for (const alumno of alumnos) {
        const nivel = obtenerNivel(alumno.grupo);
        if (!niveles[nivel]) niveles[nivel] = [];
        niveles[nivel].push(alumno);
    }
    return niveles;
}

// Calcular estadísticas
function calcularEstadisticas(alumnos) {
    const stats = {
        aprobados: 0,
        susp1: 0,
        susp2: 0,
        susp3: 0,
        susp4mas: 0
    };

    for (const a of alumnos) {
        const susp = a.suspensos;

        if (susp === 0) stats.aprobados++;
        else if (susp === 1) stats.susp1++;
        else if (susp === 2) stats.susp2++;
        else if (susp === 3) stats.susp3++;
        else stats.susp4mas++;
    }

    return stats;
}

// Estadísticas por grupo
function calcularEstadisticasPorGrupo(alumnos) {
    const grupos = agruparPorGrupo(alumnos);
    const resultado = {};

    for (const g in grupos) {
        resultado[g] = calcularEstadisticas(grupos[g]);
    }

    return resultado;
}

// Estadísticas por nivel
function calcularEstadisticasPorNivel(alumnos) {
    const niveles = agruparPorNivel(alumnos);
    const resultado = {};

    for (const n in niveles) {
        resultado[n] = calcularEstadisticas(niveles[n]);
    }

    return resultado;
}

   
