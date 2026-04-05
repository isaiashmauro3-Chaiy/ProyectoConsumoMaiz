const chartDom = document.getElementById('chart-container');
const intervalChartDom = document.getElementById('interval-chart-container');
const prodIntervalChartDom = document.getElementById('prod-interval-chart-container');

const nationalChartDom = document.getElementById('national-chart-container');
const prodNationalChartDom = document.getElementById('prod-national-chart-container');

const myChart = echarts.init(chartDom, 'dark');
const intervalChart = echarts.init(intervalChartDom, 'dark');
const prodIntervalChart = echarts.init(prodIntervalChartDom, 'dark');
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
let data = [];
let states = [];
let mainOption = {};

// 1. Cargar datos incrustados directamente para evitar errores de CORS al abrir localmente
const rawCsvData = `Entidad,Sembrada (ha) [Oct18-Sep19],Cosechada (ha) [Oct18-Sep19],Siniestrada (ha) [Oct18-Sep19],Produccion (ton) [Oct18-Sep19],Rendimiento (ton/ha),Cultivo seleccionado,Consumo (I+J+K+L),Semilla para siembra [Oct18-Sep19],Para consumo de la familia [Oct18-Sep19],Para consumo de los animales [Oct18-Sep19],Para venta (Total),Para venta (Exportacion),Consumo total (H+M),,
Baja California,719.41,719.41,0,8679.05,12.06,Maiz de Grano,6286.435,0.029,0.962,5293.885,991.56,0,6286.435,,
Baja California Sur,6800.75,6800.75,0,61843.93,9.09,Maiz de Grano,37869.15,0.095,1.667,5312.262,32555.126,0,37869.15,,
Chiapas,689822.29,"672,812.27",17010.02,1255419.51,1.87,Maiz de Grano,1084385.734,5185.905,133754.581,64331.839,881113.408,0,1084385.734,,
Chihuahua,214769.12,"214,493.12",276,1417389.66,6.61,Maiz de Grano,2582406.526,2152.877867,1094.194879,81409.42998,2497750.023,2889.1723,2585295.698,,
Durango,121350.21,118266.21,3084,298842.99,2.53,Maiz de Grano,298564.161,1245.293,4293.042,33735.47,259290.357,18.789,298582.95,,
Guerrero,491301.24,453209.95,38091.29,"1,292,294.44",2.85,Maiz de Grano,731011.751,4355.955,178633.473,190137.486,357884.836,0,731011.751,,
Hidalgo,231585.21,194046.55,37538.66,602021.35,3.1,Maiz de Grano,601215.282,4409.505,84897.932,74568.067,437339.778,0,601215.282,,
Jalisco,589681.06,"589681.06	",0,3818364.89,6.48,Maiz de Grano,3408198.105,540.644,13013.482,364068.823,3030575.156,0,3408198.105,,
Mexico,475809.03,469318.66,6490.37,1865010.36,3.97,Maiz de Grano,621496.911,13834.996,197055.764,139098.012,271508.139,0,621496.911,,
Michoacan,441388.01,416775.01,24613,1945027.31,4.67,Maiz de Grano,2262398.628,11305.705,79855.539,189732.606,1981504.778,3186.737,2265585.365,,
Nayarit,26003,25979,24,111199.26,4.28,Maiz de Grano,381922.645,190.536,5132.092,28171.378,348428.639,1656.818,383579.463,,
Nuevo Leon,63332.84,63072.84,260,64811.82,1.03,Maiz de Grano,55973.436,2905.492,9901.355,19434.339,23732.25,0,55973.436,,
Oaxaca,497732.21,463265.71,34466.5,"633,798.37",1.37,Maiz de Grano,353707.314,9005.615,158804.719,36709.604,149187.376,1138.351,354845.665,,
Puebla,532963.63,517820.96,15142.67,893554.07,1.98,Maiz de Grano,696360.1,11177.268,182114.586,66365.842,436702.405,0,696360.1,,
Queretaro,89997.76,67329.92,22667.84,1026623.8,3.3,Maiz de Grano,334367.666,1697.793,14022.222,34700.7,283946.95,0,334367.666,,
Sinaloa,557279.25,556430.84,848.41,6440204.9,11.57,Maiz de Grano,7484681.071,1303.304,11957.818,29729.967,7441689.982,4718.4,7489399.471,,
Veracruz,574332.8,510627.49,63705.31,1113138.53,2.18,Maiz de Grano,578869.96,5348.178,116947.91,89414.694,367159.178,0,578869.96,,
Zacatecas,142877,94859.4,48017.6,319911.17,3.37,Maiz de Grano,287027.695,15021.178,11025.695,66423.013,194557.81,0,287027.695,,`;

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
        let fugada = Math.max(0, sembrada - cosechada - siniestrada); // Cálculo del área perdida sin clasificar

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
            consumoTotal: parseFloat(cols[13]) || 0
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
    renderIntervalChart();
    renderProdIntervalChart();
    renderNationalChart();
    renderProdNationalChart();
}

// 3. Histograma de Intervalos por Eficiencia (Rendimiento)
function renderIntervalChart() {
    const buckets = [
        { label: '0 a 2.5 ton/ha\n(Eficiencia Baja)', min: 0, max: 2.500, states: [], tooltipColor: '#ef4444', sumProduccion: 0, sumConsumo: 0 },
        { label: '2.5 a 5.0 ton/ha\n(Eficiencia Regular)', min: 2.501, max: 5.000, states: [], tooltipColor: '#f97316', sumProduccion: 0, sumConsumo: 0 },
        { label: '5.0 a 7.5 ton/ha\n(Eficiencia Buena)', min: 5.001, max: 7.500, states: [], tooltipColor: '#fbbf24', sumProduccion: 0, sumConsumo: 0 },
        { label: '7.5 a 10.0 ton/ha\n(Eficiencia Muy Buena)', min: 7.501, max: 10.000, states: [], tooltipColor: '#34d399', sumProduccion: 0, sumConsumo: 0 },
        { label: '+10.0 ton/ha\n(Nivel Exportación)', min: 10.001, max: 99999, states: [], tooltipColor: '#3b82f6', sumProduccion: 0, sumConsumo: 0 }
    ];

    data.forEach(item => {
        const r = item.rendimiento;
        for (let b of buckets) {
            if (r >= b.min && r <= b.max) {
                b.states.push(item);
                b.sumProduccion += item.produccion;
                b.sumConsumo += item.consumoTotal;
                break;
            }
        }
    });

    const intervalOption = {
        backgroundColor: 'transparent',
        legend: {
            data: ['Cantidad de Estados', 'Volumen de Producción', 'Volumen de Consumo'],
            textStyle: { color: '#cbd5e1', fontSize: 12, fontWeight: '500' },
            top: 0
        },
        tooltip: {
            trigger: 'axis',
            axisPointer: { type: 'shadow' },
            backgroundColor: 'rgba(15, 23, 42, 0.95)',
            borderColor: '#334155', borderWidth: 1, padding: [14, 18],
            confine: true,
            enterable: true,
            extraCssText: 'max-height: 320px; overflow-y: auto; pointer-events: auto;',
            formatter: function (params) {
                const index = params[0].dataIndex;
                const b = buckets[index];

                let statesListHtml = b.states.length === 0
                    ? '<tr><td colspan="2" class="text-slate-400 italic pt-2 pb-1">Ningún estado en este rango</td></tr>'
                    : b.states.sort((a, b) => b.rendimiento - a.rendimiento).map(s =>
                        `<tr>
                            <td class="text-slate-300 pr-5 py-0.5 flex items-center gap-2"><span class="w-2.5 h-2.5 rounded-full" style="background-color: ${b.tooltipColor}"></span>${s.estado}</td>
                            <td class="font-mono text-emerald-300 text-right py-0.5 font-bold">${formatNumber(s.rendimiento)} <span class="text-xs text-slate-400 font-normal">ton/ha</span></td>
                        </tr>`
                    ).join('');

                return `
                    <div class="font-extrabold mb-2 text-lg text-emerald-400 border-b border-slate-600 pb-2">${b.label.replace('\n', ' ')}</div>
                    
                    <div class="flex justify-between items-center mt-2 mb-1">
                        <span class="text-sm font-semibold text-slate-300 mr-8">Rango: Producción Agregada:</span>
                        <span class="font-mono font-bold text-white">${formatNumber(b.sumProduccion)} ton</span>
                    </div>
                    <div class="flex justify-between items-center mb-3">
                        <span class="text-sm font-semibold text-slate-300 mr-8">Rango: Consumo Agregado:</span>
                        <span class="font-mono font-bold text-white">${formatNumber(b.sumConsumo)} ton</span>
                    </div>

                    <div class="mb-1 text-slate-100 font-semibold text-xs border-t border-slate-600 pt-3">
                        COMPOSICIÓN DE ESTADOS EN INFRAESTRUCTURA (<b class="text-white text-base">${b.states.length}</b>)
                    </div>
                    <div class="mt-1">
                        <table class="w-full text-sm bg-slate-900/30 rounded p-1">
                            ${statesListHtml}
                        </table>
                    </div>
                `;
            }
        },
        grid: { left: '5%', right: '5%', bottom: '15%', top: '22%', containLabel: true },
        xAxis: {
            type: 'category',
            data: buckets.map(b => b.label),
            axisLabel: { color: '#94a3b8', interval: 0, fontWeight: '600', fontSize: 13, lineHeight: 18 },
            axisLine: { lineStyle: { color: '#475569', width: 2 } },
            axisTick: { show: false }
        },
        yAxis: [
            {
                type: 'value',
                name: 'Cantidad de Estados',
                nameTextStyle: { color: '#10b981', fontWeight: 'bold', fontSize: 13, align: 'left', padding: [0, 0, 10, -10] },
                axisLabel: { color: '#94a3b8', fontWeight: 'bold', fontSize: 13 },
                splitLine: { lineStyle: { color: 'rgba(51, 65, 85, 0.4)', type: 'dashed' } },
                minInterval: 1
            },
            {
                type: 'value',
                name: 'Volúmenes (x 1,000 Ton)',
                nameLocation: 'end',
                nameGap: 15,
                nameTextStyle: { color: '#cbd5e1', fontWeight: 'bold', fontSize: 12, align: 'right' },
                axisLabel: { color: '#94a3b8', fontWeight: '600', formatter: (value) => formatNumber(value) },
                splitLine: { show: false }
            }
        ],
        series: [
            {
                name: 'Cantidad de Estados',
                type: 'bar',
                barWidth: '50%',
                yAxisIndex: 0,
                data: buckets.map(b => ({
                    value: b.states.length,
                    itemStyle: { color: b.tooltipColor, borderRadius: [6, 6, 0, 0] }
                })),
                label: {
                    show: true, position: 'top', color: '#fff', fontSize: 16, fontWeight: 'bold',
                    formatter: (p) => p.value > 0 ? p.value : ''
                }
            },
            {
                name: 'Volumen de Producción',
                type: 'line',
                yAxisIndex: 1,
                data: buckets.map(b => ({ value: convertToK(b.sumProduccion), rawValue: b.sumProduccion })),
                itemStyle: { color: '#94a3b8' },
                symbolSize: 8,
                lineStyle: { width: 3, type: 'dashed' }
            },
            {
                name: 'Volumen de Consumo',
                type: 'line',
                yAxisIndex: 1,
                data: buckets.map(b => ({ value: convertToK(b.sumConsumo), rawValue: b.sumConsumo })),
                itemStyle: { color: '#34d399' },
                symbolSize: 8,
                lineStyle: { width: 3 }
            }
        ]
    };
    intervalChart.setOption(intervalOption);
}

// 4. Histograma de Intervalos por Volumen Bruto de Producción
function renderProdIntervalChart() {
    const totalNacional = data.reduce((sum, item) => sum + item.produccion, 0);

    const buckets = [
        { label: '0 a 200k ton\n(Producción Marginal)', min: 0, max: 200000, states: [], tooltipColor: '#ef4444', sumProduccion: 0 },
        { label: '200k a 500k ton\n(Productores Menores)', min: 200001, max: 500000, states: [], tooltipColor: '#f97316', sumProduccion: 0 },
        { label: '500k a 1M ton\n(Productores Medios)', min: 500001, max: 1000000, states: [], tooltipColor: '#fbbf24', sumProduccion: 0 },
        { label: '1M a 2M ton\n(Productores Mayores)', min: 1000001, max: 2000000, states: [], tooltipColor: '#34d399', sumProduccion: 0 },
        { label: '+ 2 Millones ton\n(Megaproductores)', min: 2000001, max: 99999999, states: [], tooltipColor: '#3b82f6', sumProduccion: 0 }
    ];

    data.forEach(item => {
        const p = item.produccion;
        for (let b of buckets) {
            if (p >= b.min && p <= b.max) {
                b.states.push(item);
                b.sumProduccion += item.produccion;
                break;
            }
        }
    });

    const option = {
        backgroundColor: 'transparent',
        legend: {
            data: ['Cantidad de Estados (Escala Izquierda)', '% Participación del Mercado Nacional (Escala Derecha)'],
            textStyle: { color: '#cbd5e1', fontSize: 12, fontWeight: '500' },
            top: 0
        },
        tooltip: {
            trigger: 'axis',
            axisPointer: { type: 'shadow' },
            backgroundColor: 'rgba(15, 23, 42, 0.95)',
            borderColor: '#334155', borderWidth: 1, padding: [14, 18],
            confine: true,
            enterable: true,
            extraCssText: 'max-height: 320px; overflow-y: auto; pointer-events: auto;',
            formatter: function (params) {
                const index = params[0].dataIndex;
                const b = buckets[index];
                const pct = ((b.sumProduccion / totalNacional) * 100).toFixed(2);

                let statesListHtml = b.states.length === 0
                    ? '<tr><td colspan="2" class="text-slate-400 italic pt-2 pb-1">Ningún estado en esta categoría</td></tr>'
                    : b.states.sort((a, b) => b.produccion - a.produccion).map(s =>
                        `<tr>
                            <td class="text-slate-300 pr-5 py-0.5 flex items-center gap-2"><span class="w-2.5 h-2.5 rounded-full" style="background-color: ${b.tooltipColor}"></span>${s.estado}</td>
                            <td class="font-mono text-emerald-300 text-right py-0.5 font-bold">${formatNumber(s.produccion)} <span class="text-xs text-slate-400 font-normal">ton</span></td>
                        </tr>`
                    ).join('');

                return `
                    <div class="font-extrabold mb-2 text-lg text-blue-400 border-b border-slate-600 pb-2">${b.label.replace('\n', ' ')}</div>
                    
                    <div class="flex justify-between items-center mt-2 mb-1">
                        <span class="text-sm font-semibold text-slate-300 mr-8">Producción Neta del Grupo:</span>
                        <span class="font-mono font-bold text-white">${formatNumber(b.sumProduccion)} ton</span>
                    </div>
                    <div class="flex justify-between items-center mb-3">
                        <span class="text-sm font-semibold text-slate-300 mr-8">Aportación al Mercado (Market Share):</span>
                        <span class="font-mono font-bold text-blue-400 text-base">${pct}% del Total País</span>
                    </div>

                    <div class="mb-1 text-slate-100 font-semibold text-xs border-t border-slate-600 pt-3">
                        ESTADOS EN ESTA CLASIFICACIÓN (<b class="text-white text-base">${b.states.length}</b>)
                    </div>
                    <div class="mt-1">
                        <table class="w-full text-sm bg-slate-900/30 rounded p-1">
                            ${statesListHtml}
                        </table>
                    </div>
                `;
            }
        },
        grid: { left: '5%', right: '5%', bottom: '15%', top: '22%', containLabel: true },
        xAxis: {
            type: 'category',
            data: buckets.map(b => b.label),
            axisLabel: { color: '#94a3b8', interval: 0, fontWeight: '600', fontSize: 13, lineHeight: 18 },
            axisLine: { lineStyle: { color: '#475569', width: 2 } },
            axisTick: { show: false }
        },
        yAxis: [
            {
                type: 'value',
                name: 'Cantidad de Estados',
                nameTextStyle: { color: '#10b981', fontWeight: 'bold', fontSize: 13, align: 'left', padding: [0, 0, 10, -10] },
                axisLabel: { color: '#94a3b8', fontWeight: 'bold', fontSize: 13 },
                splitLine: { lineStyle: { color: 'rgba(51, 65, 85, 0.4)', type: 'dashed' } },
                minInterval: 1
            },
            {
                type: 'value',
                name: '% Part. de Mercado',
                nameLocation: 'end',
                nameGap: 15,
                nameTextStyle: { color: '#3b82f6', fontWeight: 'bold', fontSize: 13, align: 'right', padding: [0, -10, 10, 0] },
                axisLabel: { color: '#94a3b8', fontWeight: '600', formatter: '{value}%' },
                splitLine: { show: false },
                max: 100
            }
        ],
        series: [
            {
                name: 'Cantidad de Estados (Escala Izquierda)',
                type: 'bar',
                barWidth: '50%',
                yAxisIndex: 0,
                data: buckets.map(b => ({
                    value: b.states.length,
                    itemStyle: { color: b.tooltipColor, borderRadius: [6, 6, 0, 0] }
                })),
                label: {
                    show: true, position: 'top', color: '#fff', fontSize: 16, fontWeight: 'bold',
                    formatter: (p) => p.value > 0 ? p.value : ''
                }
            },
            {
                name: '% Participación del Mercado Nacional (Escala Derecha)',
                type: 'line',
                yAxisIndex: 1,
                data: buckets.map(b => ({
                    value: ((b.sumProduccion / totalNacional) * 100).toFixed(2),
                    rawValue: b.sumProduccion
                })),
                itemStyle: { color: '#3b82f6' },
                symbolSize: 10,
                lineStyle: { width: 4 }
            }
        ]
    };
    prodIntervalChart.setOption(option);
}


// 5. Gráfica Comparativa Nacional
function renderNationalChart() {
    isConsumoNationalMain = true;
    btnConsumoBack.classList.add('hidden');
    consumoNationalDesc.innerHTML = 'Comparativa directa del <b>Consumo Total de los 18 Estados (Dataset)</b> contra la Demanda Nacional (Promedio 45.8 Millones de Toneladas). La diferencia agrupa los 14 estados restantes.\n<br><b>✨ ¡Haz clic en las barras (Dataset o Déficit) para desglosar sus estados interactivos!</b>';

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
                params.forEach(param => {
                    const rawValue = param.data.rawValue;
                    if (param.seriesName !== 'Producción Total' && !param.seriesName.includes('Hectáreas ')) {
                        sumConsumo += rawValue;
                    }
                    const unit = param.seriesName.includes('Hectáreas ') ? ' ha.' : ' ton.';
                    tooltipHtml += `<div class="flex justify-between items-center my-0.5 gap-6">
                                        <span class="flex items-center text-sm">${param.marker} ${param.seriesName}</span>
                                        <span class="font-mono font-semibold text-sm">${formatNumber(rawValue)}${unit}</span>
                                    </div>`;
                });
                tooltipHtml += `<div class="flex justify-between items-center mt-2 pt-2 border-t border-slate-600 font-bold text-emerald-400">
                                    <span class="mr-4 text-sm">SUMA CONSUMO:</span><span class="font-mono text-sm">${formatNumber(sumConsumo)} ton.</span>
                                </div>`;
                return tooltipHtml;
            }
        },
        legend: {
            data: ['Hectáreas Sembradas', 'Hectáreas Cosechadas', 'Hectáreas Siniestradas', 'Hectáreas Fugadas (No Cosechadas)', 'Producción Total', 'Semilla para siembra', 'Para consumo de la familia', 'Para consumo de animales', 'Para venta (Total)', 'Para venta (Exportacion)'],
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
            { name: 'Para venta (Exportacion)', type: 'bar', stack: 'total', data: data.map(i => ({ value: convertToK(i.ventaExp), rawValue: i.ventaExp })), itemStyle: { color: '#c084fc', borderRadius: [2, 2, 0, 0] } }
        ]
    };
}

function renderMainChart() {
    isMainChart = true;
    btnBack.classList.add('hidden');
    stateSelector.classList.remove('hidden');
    stateSelector.value = "";

    titleSpan.innerHTML = 'por Entidad';
    chartDesc.innerHTML = 'Comparativa de Producción vs Consumo y Métrica Terrestre General. Usa el menú contextual "Guía Rápida" arriba para ver los detalles de las líneas.';

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
                const unit = p.name.includes('(ha)') ? ' ha.' : ' ton.';
                return `<div class="font-extrabold mb-1.5 text-base text-emerald-400 border-b border-slate-600 pb-1.5">${p.name.replace('\n', ' ')}</div>
                        <div class="font-mono text-sm font-semibold mt-1.5">${formatNumber(p.data.rawValue)}${unit}</div>`;
            }
        },
        grid: { left: '2%', right: '4%', bottom: '10%', top: '25%', containLabel: true },
        xAxis: {
            type: 'category',
            data: ['Sembrada\n(ha)', 'Cosechada\n(ha)', 'Siniestrada\n(ha)', 'Fugada\n(ha)', 'Producción', 'Semilla', 'Familia', 'Animales', 'Venta\n(Total)', 'Venta\n(Export)'],
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
                { value: stateData.ventaExp, rawValue: stateData.ventaExp, itemStyle: { color: '#c084fc', borderRadius: [4, 4, 0, 0] } }
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
        intervalChart.resize();
        prodIntervalChart.resize();
        nationalChart.resize();
        prodNationalChart.resize();
    }, 150);
});
