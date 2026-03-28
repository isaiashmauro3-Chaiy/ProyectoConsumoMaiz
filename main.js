const chartDom = document.getElementById('chart-container');
const intervalChartDom = document.getElementById('interval-chart-container');
const prodIntervalChartDom = document.getElementById('prod-interval-chart-container');

const myChart = echarts.init(chartDom, 'dark');
const intervalChart = echarts.init(intervalChartDom, 'dark');
const prodIntervalChart = echarts.init(prodIntervalChartDom, 'dark');

const stateSelector = document.getElementById('state-selector');
const btnBack = document.getElementById('btn-back');
const titleSpan = document.getElementById('chart-title-span');
const chartDesc = document.getElementById('chart-description');

// Utilities
const formatNumber = (num) => new Intl.NumberFormat('es-MX', { maximumFractionDigits: 2 }).format(num);
const convertToK = (val) => val / 1000;

// Estado global
let isMainChart = true;
let data = [];
let states = [];
let mainOption = {};

// 1. Cargar datos desde el archivo CSV para que siempre esté actualizado
fetch('Maiz_SIAP_ENA_Unificado.csv')
    .then(response => response.text())
    .then(csvText => {
        parseAndInitData(csvText);
    })
    .catch(error => console.error('Error al cargar el CSV:', error));

// 2. Parsear
function parseAndInitData(csvText) {
    const lines = csvText.split('\n').map(line => line.trim()).filter(line => line);
    for (let i = 1; i < lines.length; i++) {
        const cols = lines[i].split(',');
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


// 5. Configurar Layout Principal
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
    }, 150);
});
