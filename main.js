const chartDom = document.getElementById('chart-container');
const masterIntervalDom = document.getElementById('master-interval-container');
const nationalChartDom = document.getElementById('national-chart-container');
const prodNationalChartDom = document.getElementById('prod-national-chart-container');

const myChart = echarts.init(chartDom, 'dark');
const masterIntervalChart = echarts.init(masterIntervalDom, 'dark');
const nationalChart = echarts.init(nationalChartDom, 'dark');
const prodNationalChart = echarts.init(prodNationalChartDom, 'dark');

const stateSelector = document.getElementById('state-selector');
const btnBack = document.getElementById('btn-back');
const titleSpan = document.getElementById('chart-title-span');
const chartDesc = document.getElementById('chart-description');
const btnProdBack = document.getElementById('btn-prod-back');
const prodNationalDesc = document.getElementById('prod-national-desc');

let isProdNationalMain = true;
let isConsumoNationalMain = true;
const btnConsumoBack = document.getElementById('btn-consumo-back');
const consumoNationalDesc = document.getElementById('consumo-national-desc');
// Utilities
const formatNumber = (num) => new Intl.NumberFormat('es-MX', { maximumFractionDigits: 2 }).format(num);
const convertToK = (val) => val / 1000;

// Estado global
let isMainChart = true;
let currentIntervalView = 'scale'; // 'efficiency' | 'scale' | 'climate'
let data = [];
let states = [];
let mainOption = {};

// 2. Contenido de Narrativa Analítica (Conectividad)
const masterNarrativeData = {
    'scale': {
        title: 'Balance Nacional: Producción vs Demanda',
        icon: '⚖️',
        about: 'Esta gráfica analiza el volumen físico bruto de maíz. Su objetivo es detectar en qué niveles de producción se encuentra el mayor superávit o déficit alimentario del país.',
        explanation: 'Las barras muestran la producción total agrupada, mientras que la línea verde representa el consumo. Buscamos identificar los intervalos donde la producción supera la demanda nacional.',
        connection: 'Identificado el volumen, debemos analizar el costo de suelo: ¿Cuánta tierra usamos? Míralo en <b>Eficiencia</b>.',
        color: 'slate'
    },
    'efficiency': {
        title: 'Productividad y Rendimiento del Suelo',
        icon: '🎯',
        about: 'Aquí medimos la calidad de la producción, no solo la cantidad. Evalúa cuántas toneladas logramos extraer por cada hectárea de tierra utilizada.',
        explanation: 'La línea ámbar es el promedio de rendimiento (t/ha). Si la línea sube pero las barras bajan, significa que pocos estados están siendo muy efectivos con poco suelo.',
        connection: '¿Este éxito es natural o técnico? Analicemos si depende de la lluvia en la pestaña de <b>Clima</b>.',
        color: 'amber'
    },
    'climate': {
        title: 'Dependencia Ambiental (Precipitación)',
        icon: '☁️',
        about: 'Esta visualización cruza el éxito agrícola con el clima. Su propósito es determinar qué estados son vulnerables a las sequías y cuáles son resilientes.',
        explanation: 'Comparamos la eficiencia contra los milímetros de lluvia. Los estados que logran alta eficiencia con poca lluvia son los que tienen mejores sistemas de gestión hídrica.',
        connection: 'La prueba final de esta resiliencia es el riego artificial. Descúbrelo en <b>Tecnificación</b>.',
        color: 'sky'
    },
    'tech': {
        title: 'Resiliencia Tecnológica (Riego vs Temporal)',
        icon: '🏗️',
        about: 'Es la conclusión del análisis. Compara el impacto directo de la inversión en infraestructura (riego) contra los métodos tradicionales (temporal).',
        explanation: 'Aquí vemos cómo la tecnificación rompe la barrera del clima, permitiendo que estados en zonas secas tengan producciones de escala industrial y exportación.',
        connection: 'Con tecnología, el agro mexicano pasa de la subsistencia a una industria competitiva global.',
        color: 'emerald'
    }
};

// 1. Cargar datos incrustados directamente para evitar errores de CORS al abrir localmente
const rawCsvData = `Entidad,Sembrada (ha) [Oct18-Sep19],Cosechada (ha) [Oct18-Sep19],Siniestrada (ha) [Oct18-Sep19],Produccion (ton) [Oct18-Sep19],Rendimiento (ton/ha),Cultivo seleccionado,Consumo (I+J+K+L),Semilla para siembra [Oct18-Sep19],Para consumo de la familia [Oct18-Sep19],Para consumo de los animales [Oct18-Sep19],Para venta (Total),Para venta (Exportacion),Consumo total (H+M),total de precipitacion mm,Tecnificado (Riego),No Tecnificado (Temporal)
Chiapas,689822.29,672812.27,17010.02,1255419.51,1.87,Maiz de Grano,1084385.734,5185.905,133754.581,64331.839,881113.408,0,1084385.734,1720.5,10347.3,679475
Jalisco,589681.06,589681.06,0,3818364.89,6.48,Maiz de Grano,3408198.105,540.644,13013.482,364068.823,3030575.156,0,3408198.105,810.7,89631.5,500049.5
Veracruz,574332.8,510627.49,63705.31,1113138.53,2.18,Maiz de Grano,578869.96,5348.178,116947.91,89414.694,367159.178,0,578869.96,1045.2,18378.6,555954.2
Sinaloa,557279.25,556430.84,848.41,6440204.9,11.57,Maiz de Grano,7484681.071,1303.304,11957.818,29729.967,7441689.982,4718.4,7489399.471,533.2,556722,557.3
Puebla,532963.63,517820.96,15142.67,893554.07,1.98,Maiz de Grano,696360.1,11177.268,182114.586,66365.842,436702.405,0,696360.1,845.2,46367.8,486595.8
Oaxaca,497732.21,463265.71,34466.5,"633,798.37",1.37,Maiz de Grano,353707.314,9005.615,158804.719,36709.604,149187.376,1138.351,354845.665,921.8,18913.8,478818.4
Guerrero,491301.24,453209.95,38091.29,"1,292,294.44",2.85,Maiz de Grano,731011.751,4355.955,178633.473,190137.486,357884.836,0,731011.751,1080.4,13265.1,478036.1
Mexico,475809.03,469318.66,6490.37,1865010.36,3.97,Maiz de Grano,621496.911,13834.996,197055.764,139098.012,271508.139,0,621496.911,740.1,49484.1,426324.9
Michoacan,441388.01,416775.01,24613,1945027.31,4.67,Maiz de Grano,2262398.628,11305.705,79855.539,189732.606,1981504.778,3186.737,2265585.365,785.4,108140.1,333247.9
Hidalgo,231585.21,194046.55,37538.66,602021.35,3.1,Maiz de Grano,601215.282,4409.505,84897.932,74568.067,437339.778,0,601215.282,585.6,41222.2,190363
Chihuahua,214769.12,"214,493.12",276,1417389.66,6.61,Maiz de Grano,2582406.526,2152.877867,1094.194879,81409.42998,2497750.023,2889.1723,2585295.698,358.4,76457.8,138311.3
Zacatecas,142877,94859.4,48017.6,319911.17,3.37,Maiz de Grano,287027.695,15021.178,11025.695,66423.013,194557.81,0,287027.695,345.1,15002.1,127874.9
Durango,121350.21,118266.21,3084,298842.99,2.53,Maiz de Grano,298564.161,1245.293,4293.042,33735.47,259290.357,18.789,298582.95,418.2,17959.8,103390.4
Queretaro,89997.76,67329.92,22667.84,1026623.8,3.3,Maiz de Grano,334367.666,1697.793,14022.222,34700.7,283946.95,0,334367.666,412.5,12149.7,77848.1
Nuevo Leon,63332.84,63072.84,260,64811.82,1.03,Maiz de Grano,55973.436,2905.492,9901.355,19434.339,23732.25,0,55973.436,465.8,26789.8,36543
Nayarit,26003,25979,24,111199.26,4.28,Maiz de Grano,381922.645,190.536,5132.092,28171.378,348428.639,1656.818,383579.463,945.3,10531.2,15471.8
Baja California Sur,6800.75,6800.75,0,61843.93,9.09,Maiz de Grano,37869.15,0.095,1.667,5312.262,32555.126,0,37869.15,132.8,6800.8,0
Baja California,719.41,719.41,0,8679.05,12.06,Maiz de Grano,6286.435,0.029,0.962,5293.885,991.56,0,6286.435,165.3,719.4,0`;

parseAndInitData(rawCsvData);

// 2. Parsear
function parseAndInitData(csvText) {
    const lines = csvText.split('\n').map(line => line.trim()).filter(line => line);
    for (let i = 1; i < lines.length; i++) {
        // Parseador de CSV mejorado para tolerar comillas y comas en miles (ej. "672,812.27")
        const cols = [];
        let cur = '';
        let inQuotes = false;
        for (let j = 0; j < lines[i].length; j++) {
            let c = lines[i][j];
            if (c === '"') inQuotes = !inQuotes;
            else if (c === ',' && !inQuotes) { cols.push(cur.replace(/,/g, '').trim()); cur = ''; }
            else cur += c;
        }
        cols.push(cur.replace(/,/g, '').trim());
        
        if (cols.length < 13) continue;

        let sembrada = parseFloat(cols[1]) || 0;
        let cosechada = parseFloat(cols[2]) || 0;
        let siniestrada = parseFloat(cols[3]) || 0;
        let fugada = Math.max(0, sembrada - cosechada - siniestrada); 

        data.push({
            estado: cols[0],
            sembrada: sembrada,
            cosechada: cosechada,
            siniestrada: siniestrada,
            fugada: fugada,
            produccion: parseFloat(cols[4]) || 0,
            rendimiento: parseFloat(cols[5]) || 0,
            semilla: parseFloat(cols[8]) || 0,
            familia: parseFloat(cols[9]) || 0,
            animales: parseFloat(cols[10]) || 0,
            ventaTotal: parseFloat(cols[11]) || 0,
            ventaExp: parseFloat(cols[12]) || 0,
            consumoTotal: parseFloat(cols[13]) || 0,
            precipitacion: parseFloat(cols[14]) || 0,
            tech: parseFloat(cols[15]) || 0,
            noTech: parseFloat(cols[16]) || 0
        });
    }

    // Ordenar de mayor a menor por producción total
    data.sort((a, b) => b.produccion - a.produccion);

    states = data.map(item => item.estado);
    states.forEach(st => {
        const opt = document.createElement('option');
        opt.value = opt.textContent = st;
        stateSelector.appendChild(opt);
    });

    initOptions();
    renderMainChart();
    updateMasterNarrative('scale');
    renderMasterInterval('scale');
    renderNationalChart();
    renderProdNationalChart();
}

// --- LOGICA DE TABLERO MAESTRO DE INTERVALOS ---

function updateMasterNarrative(type) {
    const container = document.getElementById('master-narrative-container');
    if (!container) return;

    const n = masterNarrativeData[type];
    const colorClass = n.color === 'emerald' ? 'text-emerald-400' : (n.color === 'amber' ? 'text-amber-400' : (n.color === 'sky' ? 'text-sky-400' : 'text-slate-300'));
    const borderClass = n.color === 'emerald' ? 'border-emerald-500/30' : (n.color === 'amber' ? 'border-amber-500/30' : (n.color === 'sky' ? 'border-sky-500/30' : 'border-slate-500/30'));

    // 1. Renderizar el análisis breve en la parte superior
    const topContainer = document.getElementById('master-top-analysis');
    if (topContainer) {
        topContainer.innerHTML = `
            <div class="flex items-center gap-3">
                <div class="text-2xl">${n.icon}</div>
                <div>
                    <h4 class="text-sm font-bold ${colorClass}">¿De qué trata esta gráfica?</h4>
                    <p class="text-slate-300 text-xs mt-0.5 leading-snug">${n.about}</p>
                </div>
            </div>
        `;
    }
    
    // 2. Renderizar el análisis detallado en la parte inferior
    container.className = `mt-4 p-5 rounded-xl border transition-all duration-500 bg-slate-900/40 backdrop-blur-sm ${borderClass}`;
    container.innerHTML = `
        <div class="flex flex-col md:flex-row items-start gap-6">
            <div class="flex-grow">
                <div class="flex items-center gap-2 mb-1">
                    <span class="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Desglose Analítico</span>
                    <div class="h-[1px] flex-grow bg-white/5"></div>
                </div>
                <h3 class="text-xl font-black ${colorClass} mb-3 tracking-tight">${n.title}</h3>
                
                <div class="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
                    <div class="p-4 rounded-lg bg-white/5 border border-white/5">
                        <div class="text-[9px] font-bold text-slate-500 uppercase mb-2">Propósito Técnico</div>
                        <p class="text-slate-200 text-xs leading-relaxed">${n.about}</p>
                    </div>
                    <div class="p-4 rounded-lg bg-white/5 border border-white/5">
                        <div class="text-[9px] font-bold text-slate-500 uppercase mb-2">Análisis de Datos</div>
                        <p class="text-slate-300 text-xs leading-relaxed italic">${n.explanation}</p>
                    </div>
                </div>
                
                <div class="flex items-center gap-3 bg-black/20 p-3 rounded-lg border border-white/5">
                    <span class="text-lg">🛤️</span>
                    <p class="text-[11px] text-slate-300 font-medium">
                        <span class="font-black text-white uppercase text-[9px] mr-2 px-1.5 py-0.5 bg-slate-700 rounded-sm">Paso Maestro:</span>
                        ${n.connection}
                    </p>
                </div>
            </div>
        </div>
    `;
}

function switchIntervalView(viewType) {
    currentIntervalView = viewType;
    updateMasterNarrative(viewType);
    
    // Actualizar estados visuales de los botones
    const btnIds = { 
        'efficiency': 'btn-view-eff', 
        'scale': 'btn-view-scale', 
        'tech': 'btn-view-tech',
        'climate': 'btn-view-climate' 
    };
    Object.keys(btnIds).forEach(key => {
        const btn = document.getElementById(btnIds[key]);
        if (!btn) return;
        if (key === viewType) {
            btn.classList.add('bg-emerald-600', 'text-white', 'shadow-lg');
            btn.classList.remove('text-slate-400', 'hover:text-white');
        } else {
            btn.classList.remove('bg-emerald-600', 'text-white', 'shadow-lg');
            btn.classList.add('text-slate-400', 'hover:text-white');
        }
    });

    // Actualizar descripción dinámica
    const desc = document.getElementById('master-view-description');
    if (desc) {
        if (viewType === 'efficiency') desc.innerText = 'Analizando distribución por rango de eficiencia (ton/ha). Ideal para identificar la brecha técnica.';
        else if (viewType === 'scale') desc.innerText = 'Agrupación por volumen bruto de producción neta. Clasifica desde agricultura marginal hasta gigantes comerciales.';
        else if (viewType === 'tech') desc.innerText = 'Comparativa de superficie Tecnificada (Riego) vs No Tecnificada (Temporal). Observa cómo la infraestructura impacta el rendimiento.';
        else if (viewType === 'climate') desc.innerText = 'Correlación entre niveles de lluvia (mm) y resultados agrícolas. Crucial para el análisis de resiliencia hídrica.';
    }

    renderMasterInterval(viewType);
}

function renderMasterInterval(type) {
    let buckets = [];
    let valueGetter = null;

    // 1. Configurar buckets según el tipo de vista
    if (type === 'efficiency') {
        buckets = [
            { label: '0 a 2.5 ton/ha\n(Baja)', min: 0, max: 2.5, states: [], color: '#ef4444' },
            { label: '2.5 a 5.0 ton/ha\n(Regular)', min: 2.501, max: 5, states: [], color: '#f97316' },
            { label: '5.0 a 7.5 ton/ha\n(Buena)', min: 5.001, max: 7.5, states: [], color: '#fbbf24' },
            { label: '7.5 a 10.0 ton/ha\n(Muy Buena)', min: 7.501, max: 10, states: [], color: '#34d399' },
            { label: '+10.0 ton/ha\n(Exportación)', min: 10.001, max: 999, states: [], color: '#3b82f6' }
        ];
        valueGetter = (item) => item.rendimiento;
    } else if (type === 'scale') {
        buckets = [
            { label: '0 - 100k ton\n(Subsistencia)', min: 0, max: 100000, states: [], color: '#94a3b8' },
            { label: '100k - 500k ton\n(Pequeña)', min: 100001, max: 500000, states: [], color: '#64748b' },
            { label: '500k - 1M ton\n(Mediana)', min: 500001, max: 1000000, states: [], color: '#334155' },
            { label: '1M - 3M ton\n(Grande)', min: 1000001, max: 3000000, states: [], color: '#1e293b' },
            { label: '+3M ton\n(Industrial)', min: 3000001, max: 99999999, states: [], color: '#020617' }
        ];
        valueGetter = (item) => item.produccion;
    } else if (type === 'climate') {
        buckets = [
            { label: '0-300 mm\n(Seco)', min: 0, max: 300, states: [], color: '#f87171' },
            { label: '300-600 mm\n(Semi-seco)', min: 301, max: 600, states: [], color: '#fbbf24' },
            { label: '600-900 mm\n(Templado)', min: 601, max: 900, states: [], color: '#34d399' },
            { label: '900+ mm\n(Húmedo)', min: 901, max: 9999, states: [], color: '#00f2ff' }
        ];
        valueGetter = (item) => item.precipitacion;
    } else if (type === 'tech') {
        // Usamos los mismos buckets de eficiencia para ver cómo impacta la tecnificación en el rendimiento
        buckets = [
            { label: '0 a 2.5 ton/ha\n(Baja)', min: 0, max: 2.5, states: [], color: '#ef4444' },
            { label: '2.5 a 5.0 ton/ha\n(Regular)', min: 2.501, max: 5, states: [], color: '#f97316' },
            { label: '5.0 a 7.5 ton/ha\n(Buena)', min: 5.001, max: 7.5, states: [], color: '#fbbf24' },
            { label: '7.5 a 10.0 ton/ha\n(Muy Buena)', min: 7.501, max: 10, states: [], color: '#34d399' },
            { label: '+10.0 ton/ha\n(Exportación)', min: 10.001, max: 9991, states: [], color: '#3b82f6' }
        ];
        valueGetter = (item) => item.rendimiento;
    }

    // Inicializar acumuladores
    buckets.forEach(b => {
        b.stateData = []; 
        b.sumProd = 0;
        b.sumConsumo = 0;
        b.sumRend = 0;
        b.sumPrecip = 0;
        b.sumHec = 0; 
        b.sumTec = 0;    // Superficie Tecnificada
        b.sumNoTec = 0;  // Superficie No Tecnificada
    });

    // Agrupar datos
    data.forEach(item => {
        const val = valueGetter(item);
        for (let b of buckets) {
            if (val >= b.min && val <= b.max) {
                b.stateData.push(item);
                b.sumProd += item.produccion;
                b.sumConsumo += item.consumoTotal;
                b.sumRend += item.rendimiento;
                b.sumPrecip += item.precipitacion;
                b.sumHec += item.cosechada;
                b.sumTec += item.tech;
                b.sumNoTec += item.noTech;
                break;
            }
        }
    });

    // Filtrar series segun requerimiento
    let finalLegend = ['Cantidad de Estados', 'Producción Total', 'Consumo Total', 'Precipitación Prom.'];
    if (type === 'efficiency') {
        finalLegend = ['Cantidad de Estados', 'Eficiencia Prom.'];
    } else if (type === 'climate') {
        finalLegend = ['Cantidad de Estados', 'Lluvia Prom.', 'Eficiencia Prom.'];
    } else if (type === 'tech') {
        finalLegend = ['Cantidad de Estados', 'Riego (Tecnificado)', 'Temporal (No Tecnificado)', 'Eficiencia Prom.'];
    }

    let finalSeries = [];

    // 1. Serie base: Cantidad de Estados (Barras de fondo en algunas vistas)
    const stateCountSeries = {
        name: 'Cantidad de Estados',
        type: 'bar',
        barWidth: (type === 'tech' || type === 'scale') ? '70%' : '45%',
        data: buckets.map(b => ({
            value: b.stateData.length,
            itemStyle: { 
                color: (type === 'tech' || type === 'scale') ? b.color + '22' : b.color, 
                borderRadius: [4, 4, 0, 0] 
            }
        })),
        label: { 
            show: (type !== 'tech' && type !== 'scale'), 
            position: 'top', 
            color: '#cbd5e1', 
            fontSize: 10 
        }
    };

    if (type !== 'tech' && type !== 'scale') {
        finalSeries.push(stateCountSeries);
    }

    // Lógica para añadir Prod/Cons (Solo en Scale)
    if (type === 'scale') {
        finalSeries.push(
            {
                name: 'Producción Total',
                type: 'line',
                yAxisIndex: 1,
                data: buckets.map(b => convertToK(b.sumProd)),
                itemStyle: { color: '#94a3b8' },
                symbolSize: 6,
                lineStyle: { width: 2, type: 'dashed' }
            },
            {
                name: 'Consumo Total',
                type: 'line',
                yAxisIndex: 1,
                data: buckets.map(b => convertToK(b.sumConsumo)),
                itemStyle: { color: '#34d399' },
                symbolSize: 6,
                lineStyle: { width: 3 }
            }
        );
    }

    // Agregar métricas técnicas/climáticas/tecnificadas
    if (type === 'efficiency') {
        finalSeries.push(
            {
                name: 'Eficiencia Prom.',
                type: 'line',
                yAxisIndex: 1,
                data: buckets.map(b => (b.sumRend / (b.stateData.length || 1)).toFixed(2)),
                itemStyle: { color: '#fbbf24' }, // Ámbar
                symbolSize: 8,
                lineStyle: { width: 3 }
            }
        );
    } else if (type === 'tech') {
        finalSeries.push(
            {
                name: 'Temporal (No Tecnificado)',
                type: 'bar',
                yAxisIndex: 1,
                barWidth: '35%',
                data: buckets.map(b => convertToK(b.sumNoTec)),
                itemStyle: { color: '#94a3b8', borderRadius: [6, 6, 0, 0] }, // Gris Slate
                label: { show: true, position: 'top', color: '#94a3b8', fontSize: 10, fontWeight: 'bold', formatter: (v) => v.value > 0 ? formatNumber(v.value) : '' }
            },
            {
                name: 'Riego (Tecnificado)',
                type: 'bar',
                yAxisIndex: 1,
                barWidth: '30%',
                data: buckets.map(b => convertToK(b.sumTec)),
                itemStyle: { color: '#10b981', borderRadius: [6, 6, 0, 0] }, // Verde Esmeralda
                label: { show: true, position: 'top', color: '#10b981', fontSize: 10, fontWeight: 'bold', formatter: (v) => v.value > 0 ? formatNumber(v.value) : '' }
            },
            {
                name: 'Eficiencia Prom.',
                type: 'line',
                yAxisIndex: 1,
                data: buckets.map(b => (b.sumRend / (b.stateData.length || 1)).toFixed(2)),
                itemStyle: { color: '#fbbf24' }, // Ámbar
                symbolSize: 10,
                lineStyle: { width: 4, shadowBlur: 10, shadowColor: 'rgba(251, 191, 36, 0.5)' }
            }
        );
    } else if (type === 'climate') {
        finalSeries.push(
            {
                name: 'Lluvia Prom.',
                type: 'line',
                yAxisIndex: 1,
                data: buckets.map(b => (b.sumPrecip / (b.stateData.length || 1)).toFixed(1)),
                itemStyle: { color: '#3b82f6' }, // Azul
                symbolSize: 8,
                lineStyle: { width: 3 }
            },
            {
                name: 'Eficiencia Prom.',
                type: 'line',
                yAxisIndex: 1,
                data: buckets.map(b => (b.sumRend / (b.stateData.length || 1)).toFixed(2)),
                itemStyle: { color: '#fbbf24' }, // Ámbar
                symbolSize: 8,
                lineStyle: { width: 3 }
            }
        );
    } else if (type === 'scale') {
        // En scale ya añadimos Prod/Cons arriba, ahora añadimos Eficiencia
        finalLegend = ['Producción Total', 'Consumo Total', 'Eficiencia Prom.'];
        finalSeries = [
            {
                name: 'Producción Total',
                type: 'bar',
                yAxisIndex: 1,
                data: buckets.map(b => convertToK(b.sumProd)),
                itemStyle: { color: '#94a3b8', borderRadius: [4, 4, 0, 0] },
                label: { show: true, position: 'top', color: '#94a3b8', fontSize: 9, formatter: (v) => formatNumber(v.value) }
            },
            {
                name: 'Consumo Total',
                type: 'bar',
                yAxisIndex: 1,
                data: buckets.map(b => convertToK(b.sumConsumo)),
                itemStyle: { color: '#34d399', borderRadius: [4, 4, 0, 0] },
                label: { show: true, position: 'top', color: '#34d399', fontSize: 9, formatter: (v) => formatNumber(v.value) }
            },
            {
                name: 'Eficiencia Prom.',
                type: 'line',
                yAxisIndex: 1,
                data: buckets.map(b => (b.sumRend / (b.stateData.length || 1)).toFixed(2)),
                itemStyle: { color: '#fbbf24' },
                symbolSize: 8,
                lineStyle: { width: 3 }
            }
        ];
    }
    const isEff = (type === 'efficiency');
    const isScale = (type === 'scale');
    const isClimate = (type === 'climate');
    const isTech = (type === 'tech');

    const option = {
        animationDuration: 1000,
        backgroundColor: 'transparent',
        legend: {
            data: finalLegend,
            textStyle: { color: '#cbd5e1', fontSize: 11 },
            top: 0
        },
        tooltip: {
            trigger: 'axis',
            axisPointer: { type: 'shadow' },
            backgroundColor: 'rgba(15, 23, 42, 0.95)',
            borderColor: '#334155',
            padding: [12, 16],
            extraCssText: 'max-height: 400px; overflow-y: auto; box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.5); pointer-events: auto;',
            enterable: true,
            formatter: function(params) {
                const b = buckets[params[0].dataIndex];
                const avgRend = (b.sumRend / (b.stateData.length || 1)).toFixed(2);
                const avgPrecip = (b.sumPrecip / (b.stateData.length || 1)).toFixed(1);
                
                let rowsHtml = b.stateData.sort((a,b) => b.produccion - a.produccion).map(s => {
                    if (isEff) {
                        return `
                        <tr class="border-b border-white/10 hover:bg-white/5 transition-all">
                            <td class="py-3 px-3 text-white font-black text-[13px] whitespace-nowrap">${s.estado}</td>
                            <td class="py-3 px-3 text-right font-mono text-amber-400 text-[12px] font-black">${s.rendimiento.toFixed(1)}</td>
                        </tr>`;
                    }
                    if (isClimate) {
                        return `
                        <tr class="border-b border-white/10 hover:bg-white/5 transition-all">
                            <td class="py-3 px-3 text-white font-black text-[13px] whitespace-nowrap">${s.estado}</td>
                            <td class="py-3 px-3 text-right font-mono text-amber-400 text-[12px] font-black">${s.rendimiento.toFixed(1)}</td>
                            <td class="py-3 px-3 text-right font-mono text-sky-400 text-[12px] font-black">${s.precipitacion.toFixed(0)}</td>
                        </tr>`;
                    }
                    if (isTech) {
                        return `
                        <tr class="border-b border-white/10 hover:bg-white/5 transition-all">
                            <td class="py-3 px-3 text-white font-black text-[13px] whitespace-nowrap">${s.estado}</td>
                            <td class="py-3 px-3 text-right font-mono text-amber-400 text-[12px] font-black">${s.rendimiento.toFixed(1)}</td>
                            <td class="py-3 px-3 text-right font-mono text-cyan-400 text-[12px] font-black">${formatNumber(s.tech)}</td>
                            <td class="py-3 px-3 text-right font-mono text-slate-400 text-[12px] font-black">${formatNumber(s.noTech)}</td>
                        </tr>`;
                    }
                    return `
                    <tr class="border-b border-white/10 hover:bg-white/5 transition-all">
                        <td class="py-3 px-3 text-white font-black text-[13px] whitespace-nowrap">${s.estado}</td>
                        <td class="py-3 px-3 text-right font-mono text-slate-100 text-[12px] font-black">${formatNumber(s.produccion)}</td>
                        <td class="py-3 px-3 text-right font-mono text-emerald-400 text-[12px] font-black">${formatNumber(s.consumoTotal)}</td>
                        <td class="py-3 px-3 text-right font-mono text-amber-400 text-[12px] font-black">${s.rendimiento.toFixed(1)}</td>
                        ${isScale ? '' : `<td class="py-3 px-3 text-right font-mono text-sky-400 text-[12px] font-black">${s.precipitacion.toFixed(0)}</td>`}
                    </tr>`;
                }).join('');

                let html = `
                    <div class="mb-4">
                        <div class="flex items-center gap-3 mb-1.5">
                            <span class="w-4 h-4 rounded-full shadow-lg" style="background-color: ${b.color}; box-shadow: 0 0 10px ${b.color}80;"></span>
                            <div class="font-black text-emerald-400" style="font-size: 18px; letter-spacing: -0.5px;">${b.label.replace('\n', ' ')}</div>
                        </div>
                        <div class="text-[12px] text-slate-400 italic ml-7 font-medium">Análisis de ${b.stateData.length} estados</div>
                    </div>

                    <div class="overflow-hidden rounded-xl border border-white/20 mb-5 shadow-2xl bg-black/40 backdrop-blur-sm">
                        <table class="w-full border-collapse">
                            <thead class="bg-white/10 text-slate-300 uppercase tracking-widest text-[10px]">
                                <tr>
                                    <th class="p-3 text-left font-black">ESTADO</th>
                                    ${(isEff || isClimate || isTech) ? '' : '<th class="p-3 text-right font-black">PROD.</th>'}
                                    ${(isEff || isClimate || isTech) ? '' : '<th class="p-3 text-right font-black text-emerald-400">CONS.</th>'}
                                    <th class="p-3 text-right font-black text-amber-400">EF.</th>
                                    ${(isScale || isEff) ? '' : `<th class="p-3 text-right font-black text-${isTech ? 'cyan-400' : 'sky-400'}">${isTech ? 'RIEG.' : 'LLUV.'}</th>`}
                                    ${isTech ? '<th class="p-3 text-right font-black text-slate-400">TEMP.</th>' : ''}
                                </tr>
                            </thead>
                            <tbody>
                                ${rowsHtml || `<tr><td colspan="${(isEff || isClimate) ? 3 : (isTech ? 4 : (isScale ? 4 : 5))}" class="py-10 text-center text-slate-500 italic font-black text-base">Sin registros</td></tr>`}
                            </tbody>
                        </table>
                    </div>
 
                    <div class="grid ${isTech ? 'grid-cols-3' : 'grid-cols-2'} gap-x-5 gap-y-5 border-t border-white/20 pt-5 mt-2">
                        ${(isClimate || isTech) ? '' : `
                        <div>
                            <div class="text-[10px] text-slate-500 uppercase font-black tracking-widest mb-1">TOTAL PRODUCCIÓN</div>
                            <div class="font-mono font-black text-white text-base">${formatNumber(b.sumProd)} <span class="text-[11px] font-normal text-slate-500">ton</span></div>
                        </div>
                        <div class="text-right">
                            <div class="text-[10px] text-emerald-600 uppercase font-black tracking-widest text-right mb-1">TOTAL CONSUMO</div>
                            <div class="font-mono font-black text-emerald-400 text-base">${formatNumber(b.sumConsumo)} <span class="text-[11px] font-normal text-slate-500">ton</span></div>
                        </div>`}
                        <div class="${isClimate ? 'col-span-1' : (isTech ? 'col-span-1' : '')}">
                            <div class="text-[10px] text-amber-600 uppercase font-black tracking-widest mb-1">EFICIENCIA PROM.</div>
                            <div class="font-mono font-black text-amber-400 text-base">${avgRend} <span class="text-[11px] font-normal text-slate-700">t/ha</span></div>
                        </div>
                        ${(isScale || isEff) ? '' : (isTech ? `
                        <div class="text-center col-span-1">
                            <div class="text-[10px] text-cyan-600 uppercase font-black tracking-widest mb-1">TOTAL RIEGO</div>
                            <div class="font-mono font-black text-cyan-400 text-base">${formatNumber(b.sumTec.toFixed(1))} <span class="text-[11px] font-normal text-slate-700">ha</span></div>
                        </div>
                        <div class="text-right col-span-1">
                            <div class="text-[10px] text-slate-500 uppercase font-black tracking-widest text-right mb-1">TOTAL TEMPORAL</div>
                            <div class="font-mono font-black text-slate-400 text-base">${formatNumber(b.sumNoTec.toFixed(1))} <span class="text-[11px] font-normal text-slate-700">ha</span></div>
                        </div>` : `
                        <div class="text-right">
                            <div class="text-[10px] text-sky-600 uppercase font-black tracking-widest text-right mb-1">LLUVIA PROM.</div>
                            <div class="font-mono font-black text-sky-400 text-base">${avgPrecip} <span class="text-[11px] font-normal text-slate-700">mm</span></div>
                        </div>`)}
                    </div>`;
                
                return html;
            }
        },
        grid: { top: '15%', bottom: '12%', left: '4%', right: '4%', containLabel: true },
        xAxis: {
            type: 'category',
            data: buckets.map(b => b.label),
            axisLabel: { 
                color: '#94a3b8', 
                fontSize: 10, 
                fontWeight: '600',
                formatter: (val) => val.replace(' ton/ha', '') // Simplificar etiquetas para evitar clutter
            }
        },
        yAxis: [
            { 
                type: 'value', 
                name: 'Estados', 
                axisLabel: { color: '#64748b' }, 
                splitLine: { show: false }, 
                show: (!isTech && !isScale) 
            },
            { 
                type: 'value', 
                name: isTech ? 'Hectáreas (k) / Eficiencia' : (isEff ? 'Hectáreas (k) / Eficiencia' : 'Toneladas Metricas (k)'), 
                axisLabel: { 
                    color: '#64748b', 
                    formatter: (v) => {
                        if (isEff || isTech || isClimate) return formatNumber(v);
                        return v >= 1000 ? (v/1000).toFixed(1)+'M' : v+'k';
                    }
                },
                splitLine: { lineStyle: { color: 'rgba(51, 65, 85, 0.3)', type: 'dashed' } }
            }
        ],
        series: finalSeries
    };

    masterIntervalChart.setOption(option, true);
}



// 5. Gráfica Comparativa Nacional
function renderNationalChart() {
    isConsumoNationalMain = true;
    btnConsumoBack.classList.add('hidden');
    consumoNationalDesc.innerHTML = 'Comparativa directa del <b>Consumo Total de los 18 Estados (Dataset)</b> contra la Demanda Nacional (Promedio 45.8 Millones de Toneladas). La diferencia agrupa los 14 estados restantes.\n<br><span class="text-amber-400 font-semibold">⚠️ Nota: Los datos de los 14 estados faltantes fueron investigados en internet y promediados (no provienen del dataset original).</span>\n<br><b>✨ ¡Haz clic en las barras (Dataset o Déficit) para desglosar sus estados interactivos!</b>';

    const totalDatasetConsumo = data.reduce((sum, item) => sum + item.consumoTotal, 0);
    // Consumo Promedio de Mexico = 45.8 millones
    const totalNacionalInternet = 45800000;
    const deficitOImportacion = totalNacionalInternet - totalDatasetConsumo;

    const option = {
        backgroundColor: 'transparent',
        tooltip: {
            trigger: 'axis',
            axisPointer: { type: 'shadow' },
            backgroundColor: 'rgba(15, 23, 42, 0.95)',
            borderColor: '#334155', borderWidth: 1, padding: [14, 18],
            formatter: function(params) {
                const p = params[0];
                let extra = '';
                if (p.name === 'Consumo 18 Estados (Dataset)') {
                    extra = '<div class="text-xs text-purple-300 mt-3 font-bold">👉 Haz clic para desglosar consumo por estado</div>';
                } else if (p.name === 'Déficit (Resto Estados + Importación)') {
                    extra = '<div class="text-xs text-orange-300 mt-3 font-bold animate-pulse">👉 Haz clic para desglose demográfico estimado</div>';
                }
                return '<div class="font-extrabold mb-1.5 text-base border-b border-slate-600 pb-2" style="color: ' + p.color + ';">' + p.name + '</div>' + 
                       '<div class="font-mono text-white text-lg mt-2">' + formatNumber(p.value) + ' ton</div>' + extra;
            }
        },
        grid: { left: '10%', right: '10%', bottom: '15%', top: '15%', containLabel: true },
        xAxis: {
            type: 'category',
            data: ['Consumo 18 Estados (Dataset)', 'Déficit (Resto Estados + Importación)', 'Demanda Nacional Total (Internet)'],
            axisLabel: { color: '#94a3b8', interval: 0, fontWeight: '600', fontSize: 13, lineHeight: 18 },
            axisLine: { lineStyle: { color: '#475569', width: 2 } },
            axisTick: { show: false }
        },
        yAxis: {
            type: 'value',
            name: 'Toneladas Netas',
            nameTextStyle: { color: '#8b5cf6', fontWeight: 'bold', fontSize: 13, align: 'left', padding: [0, 0, 10, -10] },
            axisLabel: { color: '#94a3b8', fontWeight: 'bold', fontSize: 13, formatter: (val) => formatNumber(val) },
            splitLine: { lineStyle: { color: 'rgba(51, 65, 85, 0.4)', type: 'dashed' } }
        },
        series: [
            {
                name: 'Consumo Comparativo',
                type: 'bar',
                barWidth: '60%',
                data: [
                    { value: totalDatasetConsumo, itemStyle: { color: '#10b981', borderRadius: [6, 6, 0, 0] } },
                    { value: deficitOImportacion, itemStyle: { color: '#f59e0b', borderRadius: [6, 6, 0, 0] } },
                    { value: totalNacionalInternet, itemStyle: { color: '#8b5cf6', borderRadius: [6, 6, 0, 0] } }
                ],
                label: {
                    show: true, position: 'top', color: '#fff', fontSize: 15, fontWeight: 'bold',
                    formatter: (p) => formatNumber(p.value) + ' ton'
                }
            }
        ]
    };
    nationalChart.clear();
    nationalChart.setOption(option);
}

function renderConsumoDrilldown() {
    isConsumoNationalMain = false;
    btnConsumoBack.classList.remove('hidden');
    consumoNationalDesc.innerHTML = 'Desglose interactivo del Consumo Real de Maíz por cada uno de los 18 estados de tu Dataset (Ordenado de Mayor a Menor).';

    const sortedData = [...data].sort((a, b) => b.consumoTotal - a.consumoTotal);

    const option = {
        backgroundColor: 'transparent',
        tooltip: {
            trigger: 'axis',
            axisPointer: { type: 'shadow' },
            backgroundColor: 'rgba(15, 23, 42, 0.95)',
            borderColor: '#334155', borderWidth: 1, padding: [10, 14],
            formatter: function(params) {
                const p = params[0];
                return '<div class="font-extrabold mb-1.5 text-base text-purple-400 border-b border-slate-600 pb-1.5">' + p.name + '</div>' + 
                       '<div class="font-mono text-white text-base mt-2">' + formatNumber(p.value) + ' ton</div>';
            }
        },
        grid: { left: '5%', right: '5%', bottom: '22%', top: '15%', containLabel: true },
        xAxis: {
            type: 'category',
            data: sortedData.map(i => i.estado),
            axisLabel: { color: '#94a3b8', interval: 0, rotate: 35, fontWeight: '600', fontSize: 12 },
            axisLine: { lineStyle: { color: '#475569', width: 2 } },
            axisTick: { show: false }
        },
        yAxis: {
            type: 'value',
            name: 'Toneladas Consumidas',
            nameTextStyle: { color: '#c084fc', fontWeight: 'bold', fontSize: 13, align: 'left', padding: [0, 0, 10, -10] },
            axisLabel: { color: '#94a3b8', fontWeight: 'bold', fontSize: 13, formatter: (val) => formatNumber(val) },
            splitLine: { lineStyle: { color: 'rgba(51, 65, 85, 0.4)', type: 'dashed' } }
        },
        series: [
            {
                type: 'bar',
                data: sortedData.map(i => ({ value: i.consumoTotal, itemStyle: { color: '#c084fc', borderRadius: [4, 4, 0, 0] } })),
                label: {
                    show: true, position: 'top', color: '#f8fafc', fontSize: 11, fontWeight: 'bold', rotate: 45, horizontalAlign: 'left', verticalAlign: 'middle', distance: 10,
                    formatter: (p) => formatNumber(p.value)
                }
            }
        ]
    };
    nationalChart.clear();
    nationalChart.setOption(option);
}

function renderMissingConsumoDrilldown(totalFaltante) {
    isConsumoNationalMain = false;
    btnConsumoBack.classList.remove('hidden');
    consumoNationalDesc.innerHTML = 'Desglose interactivo estimado de qué estados absorbieron el Consumo Restante (Déficit + Importación), calculado proporcionalmente según la densidad poblacional de cada estado faltante (INEGI 2020).';

    const missingConsumoWeights = [
        { estado: 'Ciudad de México', pct: 0.23 },
        { estado: 'Guanajuato', pct: 0.15 },
        { estado: 'Tamaulipas', pct: 0.09 },
        { estado: 'Coahuila', pct: 0.08 },
        { estado: 'Sonora', pct: 0.07 },
        { estado: 'San Luis Potosí', pct: 0.07 },
        { estado: 'Tabasco', pct: 0.06 },
        { estado: 'Yucatán', pct: 0.055 },
        { estado: 'Morelos', pct: 0.045 },
        { estado: 'Quintana Roo', pct: 0.045 },
        { estado: 'Aguascalientes', pct: 0.035 },
        { estado: 'Tlaxcala', pct: 0.03 },
        { estado: 'Campeche', pct: 0.02 },
        { estado: 'Colima', pct: 0.02 }
    ];

    const missingData = missingConsumoWeights.map(i => ({
        name: i.estado,
        value: totalFaltante * i.pct
    }));

    const option = {
        backgroundColor: 'transparent',
        tooltip: {
            trigger: 'axis',
            axisPointer: { type: 'shadow' },
            backgroundColor: 'rgba(15, 23, 42, 0.95)',
            borderColor: '#334155', borderWidth: 1, padding: [10, 14],
            formatter: function(params) {
                const p = params[0];
                return '<div class="font-extrabold mb-1.5 text-base text-orange-400 border-b border-slate-600 pb-1.5">' + p.name + '</div>' + 
                       '<div class="font-mono text-white text-base mt-2">' + formatNumber(p.value) + ' ton (Estimación)</div>';
            }
        },
        grid: { left: '5%', right: '5%', bottom: '22%', top: '15%', containLabel: true },
        xAxis: {
            type: 'category',
            data: missingData.map(i => i.name),
            axisLabel: { color: '#94a3b8', interval: 0, rotate: 35, fontWeight: '600', fontSize: 12 },
            axisLine: { lineStyle: { color: '#475569', width: 2 } },
            axisTick: { show: false }
        },
        yAxis: {
            type: 'value',
            name: 'Ton. Consumidas (Estimadas)',
            nameTextStyle: { color: '#f97316', fontWeight: 'bold', fontSize: 13, align: 'left', padding: [0, 0, 10, -10] },
            axisLabel: { color: '#94a3b8', fontWeight: 'bold', fontSize: 13, formatter: (val) => formatNumber(val) },
            splitLine: { lineStyle: { color: 'rgba(51, 65, 85, 0.4)', type: 'dashed' } }
        },
        series: [
            {
                type: 'bar',
                data: missingData.map(i => ({ value: i.value, itemStyle: { color: '#f97316', borderRadius: [4, 4, 0, 0] } })),
                label: {
                    show: true, position: 'top', color: '#f8fafc', fontSize: 11, fontWeight: 'bold', rotate: 45, horizontalAlign: 'left', verticalAlign: 'middle', distance: 10,
                    formatter: (p) => formatNumber(p.value)
                }
            }
        ]
    };
    nationalChart.clear();
    nationalChart.setOption(option);
}

// 6. Gráfica Comparativa de Producción Nacional (Drilldown)
function renderProdNationalChart() {
    isProdNationalMain = true;
    btnProdBack.classList.add('hidden');
    prodNationalDesc.innerHTML = 'Comparativa de la Producción real de los 18 Estados en tu CSV vs la Producción Nacional Total (27,228,242 Toneladas). <br><b class="text-white">✨ ¡Haz clic en la barra del Dataset (Verde) para desglosar y ver exactamente cuánto produjo cada estado individualmente!</b>';

    const totalProdDataset = data.reduce((sum, item) => sum + item.produccion, 0);
    const totalProdNacional = 27228242;
    const prodFaltante = totalProdNacional - totalProdDataset;

    const option = {
        backgroundColor: 'transparent',
        tooltip: {
            trigger: 'item',
            backgroundColor: 'rgba(15, 23, 42, 0.95)',
            borderColor: '#334155', borderWidth: 1, padding: [10, 14],
            formatter: function(p) {
                let extra = '';
                if (p.name === 'Producción 18 Estados (Dataset)') extra = '<div class="text-xs text-yellow-300 mt-3 font-bold">👉 Haz clic para desglosar por estado</div>';
                if (p.name === 'Faltante (14 Estados Restantes)') extra = '<div class="text-xs text-orange-300 mt-3 font-bold animate-pulse">👉 Haz clic para desglosar estados faltantes</div>';
                return '<div class="font-extrabold mb-1.5 text-base border-b border-slate-600 pb-2" style="color: ' + p.color + ';">' + p.name + '</div>' + 
                       '<div class="font-mono text-white text-lg mt-2">' + formatNumber(p.value) + ' ton</div>' + extra;
            }
        },
        grid: { left: '10%', right: '10%', bottom: '15%', top: '15%', containLabel: true },
        xAxis: {
            type: 'category',
            data: ['Producción 18 Estados (Dataset)', 'Faltante (14 Estados Restantes)', 'Producción Nacional Total (SIAP 2019)'],
            axisLabel: { color: '#e2e8f0', interval: 0, fontWeight: '600', fontSize: 13 },
            axisLine: { lineStyle: { color: '#475569', width: 2 } },
            axisTick: { show: false }
        },
        yAxis: {
            type: 'value',
            name: 'Toneladas Producidas',
            nameTextStyle: { color: '#fbbf24', fontWeight: 'bold', fontSize: 13, align: 'left', padding: [0, 0, 10, -10] },
            axisLabel: { color: '#94a3b8', fontWeight: 'bold', fontSize: 13, formatter: (val) => formatNumber(val) },
            splitLine: { lineStyle: { color: 'rgba(51, 65, 85, 0.4)', type: 'dashed' } }
        },
        series: [
            {
                type: 'bar',
                barWidth: '60%',
                data: [
                    { value: totalProdDataset, itemStyle: { color: '#10b981', borderRadius: [6, 6, 0, 0] } },
                    { value: prodFaltante, itemStyle: { color: '#f97316', borderRadius: [6, 6, 0, 0] } },
                    { value: totalProdNacional, itemStyle: { color: '#eab308', borderRadius: [6, 6, 0, 0] } }
                ],
                label: {
                    show: true, position: 'top', color: '#fff', fontSize: 15, fontWeight: 'bold',
                    formatter: (p) => formatNumber(p.value) + ' ton'
                }
            }
        ]
    };
    prodNationalChart.clear();
    prodNationalChart.setOption(option);
}

function renderProdDrilldown() {
    isProdNationalMain = false;
    btnProdBack.classList.remove('hidden');
    prodNationalDesc.innerHTML = 'Desglose detallado de la producción de los 18 estados analizados, ordenados de mayor a menor volumen (Totalizando el bloque verde anterior).';

    const sortedData = [...data].sort((a, b) => b.produccion - a.produccion);

    const option = {
        backgroundColor: 'transparent',
        tooltip: {
            trigger: 'axis',
            axisPointer: { type: 'shadow' },
            backgroundColor: 'rgba(15, 23, 42, 0.95)',
            borderColor: '#334155', borderWidth: 1, padding: [10, 14],
            formatter: function(params) {
                const p = params[0];
                return '<div class="font-extrabold mb-1.5 text-base text-emerald-400 border-b border-slate-600 pb-1.5">' + p.name + '</div>' + 
                       '<div class="font-mono text-white text-base mt-2">' + formatNumber(p.value) + ' ton</div>';
            }
        },
        grid: { left: '5%', right: '5%', bottom: '22%', top: '15%', containLabel: true },
        xAxis: {
            type: 'category',
            data: sortedData.map(i => i.estado),
            axisLabel: { color: '#94a3b8', interval: 0, rotate: 35, fontWeight: '600', fontSize: 12 },
            axisLine: { lineStyle: { color: '#475569', width: 2 } },
            axisTick: { show: false }
        },
        yAxis: {
            type: 'value',
            name: 'Toneladas Producidas',
            nameTextStyle: { color: '#10b981', fontWeight: 'bold', fontSize: 13, align: 'left', padding: [0, 0, 10, -10] },
            axisLabel: { color: '#94a3b8', fontWeight: 'bold', fontSize: 13, formatter: (val) => formatNumber(val) },
            splitLine: { lineStyle: { color: 'rgba(51, 65, 85, 0.4)', type: 'dashed' } }
        },
        series: [
            {
                type: 'bar',
                data: sortedData.map(i => ({ value: i.produccion, itemStyle: { color: '#10b981', borderRadius: [4, 4, 0, 0] } })),
                label: {
                    show: true, position: 'top', color: '#f8fafc', fontSize: 11, fontWeight: 'bold', rotate: 45, horizontalAlign: 'left', verticalAlign: 'middle', distance: 10,
                    formatter: (p) => formatNumber(p.value)
                }
            }
        ]
    };
    prodNationalChart.clear();
    prodNationalChart.setOption(option);
}

function renderMissingStatesDrilldown() {
    isProdNationalMain = false;
    btnProdBack.classList.remove('hidden');
    prodNationalDesc.innerHTML = 'Desglose interactivo exacto de la producción de los 14 estados ausentes. Tomado directamente del tabulador real del Cierre Agrícola 2018-2019.';

    const missingData = [
        { name: 'Guanajuato', value: 1391741.15 },
        { name: 'Tamaulipas', value: 820971.23 },
        { name: 'Sonora', value: 692277.31 },
        { name: 'Tlaxcala', value: 215295.04 },
        { name: 'Campeche', value: 162147.63 },
        { name: 'Tabasco', value: 150204.85 },
        { name: 'San Luis Potosí', value: 143733.63 },
        { name: 'Morelos', value: 86523.16 },
        { name: 'Yucatán', value: 74050.27 },
        { name: 'Aguascalientes', value: 69807.47 },
        { name: 'Colima', value: 58558.71 },
        { name: 'Quintana Roo', value: 47604.57 },
        { name: 'Coahuila', value: 30929.28 },
        { name: 'Ciudad de México', value: 4834.58 }
    ];

    const option = {
        backgroundColor: 'transparent',
        tooltip: {
            trigger: 'axis',
            axisPointer: { type: 'shadow' },
            backgroundColor: 'rgba(15, 23, 42, 0.95)',
            borderColor: '#334155', borderWidth: 1, padding: [10, 14],
            formatter: function(params) {
                const p = params[0];
                return '<div class="font-extrabold mb-1.5 text-base text-orange-400 border-b border-slate-600 pb-1.5">' + p.name + '</div>' + 
                       '<div class="font-mono text-white text-base mt-2">' + formatNumber(p.value) + ' ton</div>';
            }
        },
        grid: { left: '5%', right: '5%', bottom: '22%', top: '15%', containLabel: true },
        xAxis: {
            type: 'category',
            data: missingData.map(i => i.name),
            axisLabel: { color: '#94a3b8', interval: 0, rotate: 35, fontWeight: '600', fontSize: 12 },
            axisLine: { lineStyle: { color: '#475569', width: 2 } },
            axisTick: { show: false }
        },
        yAxis: {
            type: 'value',
            name: 'Toneladas Producidas',
            nameTextStyle: { color: '#f97316', fontWeight: 'bold', fontSize: 13, align: 'left', padding: [0, 0, 10, -10] },
            axisLabel: { color: '#94a3b8', fontWeight: 'bold', fontSize: 13, formatter: (val) => formatNumber(val) },
            splitLine: { lineStyle: { color: 'rgba(51, 65, 85, 0.4)', type: 'dashed' } }
        },
        series: [
            {
                type: 'bar',
                data: missingData.map(i => ({ value: i.value, itemStyle: { color: '#f97316', borderRadius: [4, 4, 0, 0] } })),
                label: {
                    show: true, position: 'top', color: '#f8fafc', fontSize: 11, fontWeight: 'bold', rotate: 45, horizontalAlign: 'left', verticalAlign: 'middle', distance: 10,
                    formatter: (p) => formatNumber(p.value)
                }
            }
        ]
    };
    prodNationalChart.clear();
    prodNationalChart.setOption(option);
}

// Lógica de Eventos Clic y Retorno para National Charts
nationalChart.on('click', function(params) {
    if (isConsumoNationalMain) {
        if (params.name === 'Consumo 18 Estados (Dataset)') {
            renderConsumoDrilldown();
        } else if (params.name === 'Déficit (Resto Estados + Importación)') {
            const totalDatasetConsumo = data.reduce((sum, item) => sum + item.consumoTotal, 0);
            const prodFaltante = 45800000 - totalDatasetConsumo;
            renderMissingConsumoDrilldown(prodFaltante);
        }
    }
});
btnConsumoBack.addEventListener('click', renderNationalChart);

prodNationalChart.on('click', function(params) {
    if (isProdNationalMain) {
        if (params.name === 'Producción 18 Estados (Dataset)') {
            renderProdDrilldown();
        } else if (params.name === 'Faltante (14 Estados Restantes)') {
            renderMissingStatesDrilldown();
        }
    }
});
btnProdBack.addEventListener('click', renderProdNationalChart);

// 7. Configurar Layout Principal
function initOptions() {
    mainOption = {
        backgroundColor: 'transparent',
        tooltip: {
            trigger: 'axis',
            axisPointer: { type: 'shadow' },
            backgroundColor: 'rgba(15, 23, 42, 0.95)',
            borderColor: '#334155', borderWidth: 1, padding: [10, 14],
            confine: true,
            position: function (pt, params, dom, rect, size) {
                let x = pt[0] + 20;
                if (x + size.contentSize[0] > size.viewSize[0]) x = pt[0] - size.contentSize[0] - 20;
                let y = pt[1] - (size.contentSize[1] / 3);
                if (y < 70) y = 70;
                if (y + size.contentSize[1] > size.viewSize[1]) y = size.viewSize[1] - size.contentSize[1] - 5;
                return [x, y];
            },
            textStyle: { color: '#f8fafc', fontSize: 13 },
            formatter: function (params) {
                let tooltipHtml = `<div class="font-extrabold mb-1.5 text-base border-b border-slate-600 pb-1.5 text-emerald-400">📍 ${params[0].name} (Clic para desglosar)</div>`;
                let sumConsumo = 0;
                let prodTotalHtml = '';
                params.forEach(param => {
                    const rawValue = param.data.rawValue;
                    const unit = param.seriesName.includes('Hectáreas ') ? ' ha.' : (param.seriesName.includes('Precipitación') ? ' mm.' : ' ton.');
                    
                    if (param.seriesName === 'Producción Total') {
                        prodTotalHtml = `<div class="flex justify-between items-center mb-0.5 gap-6">
                            <span class="flex items-center text-sm font-bold text-slate-100">${param.marker} ${param.seriesName}</span>
                            <span class="font-mono font-bold text-sm text-white">${formatNumber(rawValue)}${unit}</span>
                        </div>`;
                    } else {
                        if (!param.seriesName.includes('Hectáreas ') && !param.seriesName.includes('Precipitación')) {
                            sumConsumo += rawValue;
                        }
                        tooltipHtml += `<div class="flex justify-between items-center my-0.5 gap-6">
                                            <span class="flex items-center text-sm font-medium text-slate-300">${param.marker} ${param.seriesName}</span>
                                            <span class="font-mono font-semibold text-sm text-slate-200">${formatNumber(rawValue)}${unit}</span>
                                        </div>`;
                    }
                });
                tooltipHtml += `<div class="mt-2 pt-2 border-t border-slate-600">
                                    ${prodTotalHtml}
                                    <div class="flex justify-between items-center mt-1 font-bold text-emerald-400">
                                        <span class="mr-4 text-sm">SUMA CONSUMO:</span><span class="font-mono text-sm">${formatNumber(sumConsumo)} ton.</span>
                                    </div>
                                </div>`;
                return tooltipHtml;
            }
        },
        legend: {
            data: ['Hectáreas Sembradas', 'Hectáreas Cosechadas', 'Hectáreas Siniestradas', 'Hectáreas Fugadas (No Cosechadas)', 'Producción Total', 'Semilla para siembra', 'Para consumo de la familia', 'Para consumo de animales', 'Para venta (Total)', 'Para venta (Exportacion)', 'Precipitación (Línea)'],
            textStyle: { color: '#cbd5e1', fontSize: 12, fontWeight: '500' },
            top: 0, itemGap: 10
        },
        grid: { left: '3%', right: '5%', bottom: '15%', top: '30%', containLabel: true },
        dataZoom: [
            { type: 'inside', start: 0, end: 100 },
            { start: 0, end: 100, borderColor: '#334155', textStyle: { color: '#cbd5e1' }, backgroundColor: 'rgba(30, 41, 59, 0.5)', fillerColor: 'rgba(52, 211, 153, 0.2)', bottom: 5, height: 20 }
        ],
        xAxis: {
            type: 'category',
            data: states,
            triggerEvent: true,
            axisLabel: {
                color: '#94a3b8', interval: 0, rotate: 30, fontSize: 12, fontWeight: '500',
                formatter: function (value) { return '{stateName|' + value + '}'; },
                rich: { stateName: { color: '#94a3b8', backgroundColor: 'transparent', padding: [4, 4], borderRadius: 4, align: 'center' } }
            },
            axisLine: { lineStyle: { color: '#475569', width: 2 } },
            axisTick: { show: false }
        },
        yAxis: [
            {
                type: 'value',
                name: 'Miles de Toneladas\n(x 1,000)',
                nameLocation: 'end',
                nameGap: 15,
                nameTextStyle: { color: '#10b981', fontWeight: 'bold', fontSize: 12, align: 'left' },
                axisLabel: { color: '#94a3b8', fontWeight: '600', formatter: (value) => formatNumber(value) },
                splitLine: { lineStyle: { color: 'rgba(51, 65, 85, 0.4)', type: 'dashed' } }
            },
            {
                type: 'value',
                name: 'Área Terrestre\n(Hectáreas)',
                nameLocation: 'end',
                nameGap: 15,
                nameTextStyle: { color: '#3b82f6', fontWeight: 'bold', fontSize: 12, align: 'right' },
                axisLabel: { color: '#e2e8f0', fontWeight: '600', formatter: (value) => formatNumber(value) },
                splitLine: { show: false }
            },
            {
                type: 'value',
                name: 'Clima\n(mm)',
                nameLocation: 'end',
                offset: 60,
                nameTextStyle: { color: '#60a5fa', fontWeight: 'bold', fontSize: 12, align: 'right' },
                axisLabel: { color: '#94a3b8', fontWeight: '600', formatter: '{value} mm' },
                splitLine: { show: false }
            }
        ],
        series: [
            { name: 'Hectáreas Sembradas', type: 'line', yAxisIndex: 1, data: data.map(i => ({ value: i.sembrada, rawValue: i.sembrada })), itemStyle: { color: '#3b82f6' }, symbolSize: 6, lineStyle: { width: 2, type: 'dashed' }, z: 10 },
            { name: 'Hectáreas Cosechadas', type: 'line', yAxisIndex: 1, data: data.map(i => ({ value: i.cosechada, rawValue: i.cosechada })), itemStyle: { color: '#10b981' }, symbolSize: 8, lineStyle: { width: 3 }, z: 9 },
            { name: 'Hectáreas Siniestradas', type: 'line', yAxisIndex: 1, data: data.map(i => ({ value: i.siniestrada, rawValue: i.siniestrada })), itemStyle: { color: '#ef4444' }, symbolSize: 8, lineStyle: { width: 3 }, z: 8 },
            { name: 'Hectáreas Fugadas (No Cosechadas)', type: 'line', yAxisIndex: 1, data: data.map(i => ({ value: i.fugada, rawValue: i.fugada })), itemStyle: { color: '#f97316' }, symbolSize: 6, lineStyle: { width: 2, type: 'dotted' }, z: 7 },
            { name: 'Producción Total', type: 'bar', data: data.map(i => ({ value: convertToK(i.produccion), rawValue: i.produccion })), itemStyle: { color: '#94a3b8', borderRadius: [4, 4, 0, 0] } },
            { name: 'Semilla para siembra', type: 'bar', stack: 'total', data: data.map(i => ({ value: convertToK(i.semilla), rawValue: i.semilla })), itemStyle: { color: '#fbbf24' } },
            { name: 'Para consumo de la familia', type: 'bar', stack: 'total', data: data.map(i => ({ value: convertToK(i.familia), rawValue: i.familia })), itemStyle: { color: '#f87171' } },
            { name: 'Para consumo de animales', type: 'bar', stack: 'total', data: data.map(i => ({ value: convertToK(i.animales), rawValue: i.animales })), itemStyle: { color: '#60a5fa' } },
            { name: 'Para venta (Total)', type: 'bar', stack: 'total', data: data.map(i => ({ value: convertToK(i.ventaTotal), rawValue: i.ventaTotal })), itemStyle: { color: '#34d399' } },
            { name: 'Para venta (Exportacion)', type: 'bar', stack: 'total', data: data.map(i => ({ value: convertToK(i.ventaExp), rawValue: i.ventaExp })), itemStyle: { color: '#c084fc', borderRadius: [2, 2, 0, 0] } },
            { name: 'Precipitación (Línea)', type: 'line', yAxisIndex: 2, data: data.map(i => ({ value: i.precipitacion, rawValue: i.precipitacion })), itemStyle: { color: '#00f2ff' }, symbolSize: 6, lineStyle: { width: 2, type: 'dashed' }, z: 15 }
        ]
    };
}

function renderMainChart() {
    isMainChart = true;
    btnBack.classList.add('hidden');
    stateSelector.classList.remove('hidden');
    stateSelector.value = "";

    titleSpan.innerHTML = 'por Entidad';
    chartDesc.innerHTML = 'Comparativa de Producción vs Consumo, Métrica Terrestre y <b class="text-cyan-400">Precipitación</b>. <br><span class="text-slate-400 text-xs mt-1 block">⚠️ Nota: Datos exclusivos de los <b class="text-slate-200">18 estados</b> obtenidos para el ciclo <b class="text-slate-200">Octubre 2018 - Septiembre 2019</b>.</span>';

    myChart.clear();
    myChart.setOption(mainOption, true);
}

function renderStateChart(stateName) {
    isMainChart = false;
    const stateData = data.find(item => item.estado === stateName);
    if (!stateData) return;

    btnBack.classList.remove('hidden');
    stateSelector.classList.add('hidden');

    titleSpan.innerHTML = `en <span class="text-white">${stateName}</span>`;
    chartDesc.innerHTML = 'Detalle de estado. Diez columnas desplegadas representando desgloses puntuales e individuales libres de apilamiento cruzado.';

    const stateOption = {
        backgroundColor: 'transparent',
        tooltip: {
            trigger: 'axis',
            axisPointer: { type: 'shadow' },
            backgroundColor: 'rgba(15, 23, 42, 0.95)',
            borderColor: '#334155', borderWidth: 1, padding: [10, 14],
            confine: true,
            position: function (pt, params, dom, rect, size) {
                let x = pt[0] + 15;
                if (x + size.contentSize[0] > size.viewSize[0]) x = pt[0] - size.contentSize[0] - 15;
                let y = pt[1] - 40;
                if (y < 70) y = 70;
                if (y + size.contentSize[1] > size.viewSize[1]) y = size.viewSize[1] - size.contentSize[1] - 5;
                return [x, y];
            },
            formatter: function (params) {
                const p = params[0];
                const unit = p.name.includes('(ha)') ? ' ha.' : (p.name.includes('(mm)') ? ' mm.' : ' ton.');
                return `<div class="font-extrabold mb-1.5 text-base text-emerald-400 border-b border-slate-600 pb-1.5">${p.name.replace('\n', ' ')}</div>
                        <div class="font-mono text-sm font-semibold mt-1.5">${formatNumber(p.data.rawValue)}${unit}</div>`;
            }
        },
        grid: { left: '2%', right: '4%', bottom: '10%', top: '25%', containLabel: true },
        xAxis: {
            type: 'category',
            data: ['Sembrada\n(ha)', 'Cosechada\n(ha)', 'Siniestrada\n(ha)', 'Fugada\n(ha)', 'Producción', 'Semilla', 'Familia', 'Animales', 'Venta\n(Total)', 'Venta\n(Export)', 'Lluvia\n(mm)'],
            axisLabel: { color: '#e2e8f0', fontSize: 13, fontWeight: '600', interval: 0, rotate: 15 },
            axisLine: { lineStyle: { color: '#475569', width: 2 } }
        },
        yAxis: {
            type: 'value',
            name: '(Cifras Exactas)',
            nameLocation: 'end',
            nameGap: 15,
            nameTextStyle: { color: '#10b981', fontWeight: 'bold', fontSize: 13, align: 'left' },
            axisLabel: { color: '#94a3b8', fontWeight: '600', formatter: (val) => formatNumber(val) },
            splitLine: { lineStyle: { color: 'rgba(51, 65, 85, 0.4)', type: 'dashed' } }
        },
        series: [{
            type: 'bar',
            barWidth: '60%',
            data: [
                { value: stateData.sembrada, rawValue: stateData.sembrada, itemStyle: { color: '#3b82f6', borderRadius: [4, 4, 0, 0] } },
                { value: stateData.cosechada, rawValue: stateData.cosechada, itemStyle: { color: '#10b981', borderRadius: [4, 4, 0, 0] } },
                { value: stateData.siniestrada, rawValue: stateData.siniestrada, itemStyle: { color: '#ef4444', borderRadius: [4, 4, 0, 0] } },
                { value: stateData.fugada, rawValue: stateData.fugada, itemStyle: { color: '#f97316', borderRadius: [4, 4, 0, 0] } },
                { value: stateData.produccion, rawValue: stateData.produccion, itemStyle: { color: '#94a3b8', borderRadius: [4, 4, 0, 0] } },
                { value: stateData.semilla, rawValue: stateData.semilla, itemStyle: { color: '#fbbf24', borderRadius: [4, 4, 0, 0] } },
                { value: stateData.familia, rawValue: stateData.familia, itemStyle: { color: '#f87171', borderRadius: [4, 4, 0, 0] } },
                { value: stateData.animales, rawValue: stateData.animales, itemStyle: { color: '#60a5fa', borderRadius: [4, 4, 0, 0] } },
                { value: stateData.ventaTotal, rawValue: stateData.ventaTotal, itemStyle: { color: '#34d399', borderRadius: [4, 4, 0, 0] } },
                { value: stateData.ventaExp, rawValue: stateData.ventaExp, itemStyle: { color: '#c084fc', borderRadius: [4, 4, 0, 0] } },
                { value: stateData.precipitacion, rawValue: stateData.precipitacion, itemStyle: { color: '#00f2ff', borderRadius: [4, 4, 0, 0] } }
            ],
            label: {
                show: true,
                position: 'top',
                color: '#f8fafc',
                fontWeight: 'bold',
                fontSize: 12,
                formatter: (p) => p.data.rawValue > 0 ? formatNumber(p.data.rawValue) : '0'
            }
        }]
    };

    myChart.clear();
    myChart.setOption(stateOption, true);
}

// Listeners Generales
stateSelector.addEventListener('change', (e) => {
    if (e.target.value) renderStateChart(e.target.value);
});

myChart.on('click', function (params) {
    if (params.componentType === 'series' && states.includes(params.name)) renderStateChart(params.name);
    else if (params.componentType === 'xAxis' && states.includes(params.value)) renderStateChart(params.value);
});

myChart.getZr().on('click', function (params) {
    if (!params.target && isMainChart) {
        const pointInPixel = [params.offsetX, params.offsetY];
        if (myChart.containPixel('grid', pointInPixel)) {
            const pointInGrid = myChart.convertFromPixel({ seriesIndex: 0 }, pointInPixel);
            const stateName = states[pointInGrid[0]];
            if (stateName) renderStateChart(stateName);
        }
    }
});

myChart.getZr().on('mousemove', function (params) {
    if (!params.target && isMainChart) {
        const pointInPixel = [params.offsetX, params.offsetY];
        if (myChart.containPixel('grid', pointInPixel)) {
            myChart.getZr().setCursorStyle('pointer');
            return;
        }
    }
});

myChart.on('mouseover', function (params) { if (params.componentType === 'xAxis') myChart.getZr().setCursorStyle('pointer'); });
myChart.on('mouseout', function (params) { if (params.componentType === 'xAxis') myChart.getZr().setCursorStyle('default'); });

btnBack.addEventListener('click', renderMainChart);

window.addEventListener('resize', () => {
    setTimeout(() => {
        myChart.resize();
        masterIntervalChart.resize();
        nationalChart.resize();
        prodNationalChart.resize();
    }, 150);
});

// ==========================================
// EXPORTACIÓN A CSV
// ==========================================

function downloadCSV(filename, csvContent) {
    // Añadimos BOM para que Excel respete los acentos/ñ en español
    const blob = new Blob(["\uFEFF" + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

document.getElementById('btn-dl-main').addEventListener('click', () => {
    // La Gráfica 1 descarga la matriz unificada exacta de los 18 estados presentes en la raw data
    downloadCSV('Maiz_Dataset_Unificado_Principal.csv', rawCsvData);
});

document.getElementById('btn-dl-interval-master').addEventListener('click', () => {
    let csv = '';
    let fn = '';
    const type = currentIntervalView;

    if (type === 'efficiency') {
        csv = 'Rango de Eficiencia (Ton/Ha),Cantidad de Estados,Estados Integrantes,Produccion Total (Ton),Consumo Total (Ton),Precipitacion Promedio (mm)\n';
        fn = 'Analisis_Intervalos_Eficiencia.csv';
    } else if (type === 'scale') {
        csv = 'Categoria de Escala de Produccion,Cantidad de Estados,Estados Integrantes,Produccion Total (Ton),Consumo Total (Ton),Rendimiento Promedio (ton/ha)\n';
        fn = 'Analisis_Intervalos_Escala.csv';
    } else if (type === 'tech') {
        csv = 'Rango de Eficiencia,Cantidad de Estados,Estados Integrantes,Superficie Riego (ha),Superficie Temporal (ha),Eficiencia Promedio\n';
        fn = 'Analisis_Tecnificacion.csv';
    } else {
        csv = 'Rango de Precipitacion (mm),Cantidad de Estados,Estados Integrantes,Produccion Total (Ton),Consumo Total (Ton),Rendimiento Promedio (ton/ha)\n';
        fn = 'Analisis_Intervalos_Clima.csv';
    }

    // Usar la misma lógica de buckets que el renderizado para consistencia
    renderMasterInterval(type); // Asegurar que buckets estén frescos si hiciéramos lógica compartida, pero mejor lo calculo aquí rápido o comparto buckets
    
    // Para simplificar y no duplicar lógica de buckets, vamos a disparar una función que genere el CSV basado en la vista actual
    const opt = masterIntervalChart.getOption();
    const xData = opt.xAxis[0].data;
    
    // Re-calculamos buckets locales para el CSV
    const dataToExport = calculateBucketsForCSV(type);
    dataToExport.forEach(b => {
        const integrantes = b.states.join('; ');
        const avgVal = (b.sumExtra / (b.states.length || 1)).toFixed(2);
        csv += `"${b.label.replace('\n', ' ')}",${b.states.length},"${integrantes}",${b.sumProd.toFixed(2)},${b.sumConsumo.toFixed(2)},${avgVal}\n`;
    });

    downloadCSV(fn, csv);
});

function calculateBucketsForCSV(type) {
    let buckets = [];
    let getter = null;
    let extraGetter = null;

    if (type === 'efficiency') {
        buckets = [
            { label: '0-2.5 ton/ha', min: 0, max: 2.5, states: [], sumProd: 0, sumConsumo: 0, sumExtra: 0 },
            { label: '2.5-5.0 ton/ha', min: 2.501, max: 5, states: [], sumProd: 0, sumConsumo: 0, sumExtra: 0 },
            { label: '5.0-7.5 ton/ha', min: 5.001, max: 7.5, states: [], sumProd: 0, sumConsumo: 0, sumExtra: 0 },
            { label: '7.5-10.0 ton/ha', min: 7.501, max: 10, states: [], sumProd: 0, sumConsumo: 0, sumExtra: 0 },
            { label: '10.0+ ton/ha', min: 10.001, max: 999, states: [], sumProd: 0, sumConsumo: 0, sumExtra: 0 }
        ];
        getter = (i) => i.rendimiento;
        extraGetter = (i) => i.precipitacion;
    } else if (type === 'scale') {
        buckets = [
            { label: '0-100k ton', min: 0, max: 100000, states: [], sumProd: 0, sumConsumo: 0, sumExtra: 0 },
            { label: '100k-500k ton', min: 100001, max: 500000, states: [], sumProd: 0, sumConsumo: 0, sumExtra: 0 },
            { label: '500k-1M ton', min: 500001, max: 1000000, states: [], sumProd: 0, sumConsumo: 0, sumExtra: 0 },
            { label: '1M-3M ton', min: 1000001, max: 3000000, states: [], sumProd: 0, sumConsumo: 0, sumExtra: 0 },
            { label: '3M+ ton', min: 3000001, max: 99999999, states: [], sumProd: 0, sumConsumo: 0, sumExtra: 0 }
        ];
        getter = (i) => i.produccion;
        extraGetter = (i) => i.rendimiento;
    } else if (type === 'tech') {
        buckets = [
            { label: '0-2.5 ton/ha', min: 0, max: 2.5, states: [], sumProd: 0, sumConsumo: 0, sumExtra: 0, sumExtra2: 0 },
            { label: '2.5-5.0 ton/ha', min: 2.501, max: 5, states: [], sumProd: 0, sumConsumo: 0, sumExtra: 0, sumExtra2: 0 },
            { label: '5.0-7.5 ton/ha', min: 5.001, max: 7.5, states: [], sumProd: 0, sumConsumo: 0, sumExtra: 0, sumExtra2: 0 },
            { label: '7.5-10.0 ton/ha', min: 7.501, max: 10, states: [], sumProd: 0, sumConsumo: 0, sumExtra: 0, sumExtra2: 0 },
            { label: '10.0+ ton/ha', min: 10.001, max: 999, states: [], sumProd: 0, sumConsumo: 0, sumExtra: 0, sumExtra2: 0 }
        ];
        getter = (i) => i.rendimiento;
        extraGetter = (i) => i.tech;
        extra2Getter = (i) => i.noTech;
    } else {
        buckets = [
            { label: '0-300 mm', min: 0, max: 300, states: [], sumProd: 0, sumConsumo: 0, sumExtra: 0 },
            { label: '300-600 mm', min: 301, max: 600, states: [], sumProd: 0, sumConsumo: 0, sumExtra: 0 },
            { label: '600-900 mm', min: 601, max: 900, states: [], sumProd: 0, sumConsumo: 0, sumExtra: 0 },
            { label: '900+ mm', min: 901, max: 9999, states: [], sumProd: 0, sumConsumo: 0, sumExtra: 0 }
        ];
        getter = (i) => i.precipitacion;
        extraGetter = (i) => i.rendimiento;
    }

    data.forEach(item => {
        const val = getter(item);
        for (let b of buckets) {
            if (val >= b.min && val <= b.max) {
                b.states.push(item.estado);
                b.sumProd += item.produccion;
                b.sumConsumo += item.consumoTotal;
                b.sumExtra += extraGetter(item);
                if (typeof extra2Getter === 'function') {
                    b.sumExtra2 += extra2Getter(item);
                }
                break;
            }
        }
    });
    return buckets;
}

// Función genérica para extraer datos de la instancia de gráfica viva (Ideal para Drilldowns)
function getEchartsDataToCSV(chartInstance, TitleHeader, ValueHeader) {
    const option = chartInstance.getOption();
    if (!option || !option.xAxis || !option.series) return '';
    
    const xData = option.xAxis[0].data;
    const seriesData = option.series[0].data;

    let csv = `${TitleHeader},${ValueHeader}\n`;
    for (let i = 0; i < xData.length; i++) {
        let val = (typeof seriesData[i] === 'object') ? seriesData[i].value : seriesData[i];
        csv += `"${xData[i]}",${val}\n`;
    }
    return csv;
}

document.getElementById('btn-dl-national').addEventListener('click', () => {
    const csv = getEchartsDataToCSV(nationalChart, 'Entidad o Categoria', 'Toneladas Consumidas');
    let suffix = isConsumoNationalMain ? 'Totales' : 'Desglose_Detalle';
    downloadCSV(`Comparativa_Consumo_Nacional_${suffix}.csv`, csv);
});

document.getElementById('btn-dl-prod-national').addEventListener('click', () => {
    const csv = getEchartsDataToCSV(prodNationalChart, 'Entidad o Categoria', 'Toneladas Producidas');
    let suffix = isProdNationalMain ? 'Totales' : 'Desglose_Detalle';
    downloadCSV(`Desempeno_Produccion_Nacional_${suffix}.csv`, csv);
});



