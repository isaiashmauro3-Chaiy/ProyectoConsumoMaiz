# Dashboard de Datos Agrícolas: Producción y Consumo de Maíz en México

Este proyecto es un **Dashboard Interactivo** construido en Vanilla JavaScript, HTML5 y Tailwind CSS, apoyado en la poderosa librería de visualización de datos **Apache ECharts**.

## Objetivo del Proyecto

La herramienta está diseñada para analizar la distribución geoespacial, volumétrica y el rendimiento agrícola de la producción de **Maíz de Grano** en México (periodo de ciclo de cosecha Octubre 2018 - Septiembre 2019). Permite una navegación rápida ("Drill-down") de métricas nacionales a métricas por entidad federativa.

## 📊 Características Clave

1. **Visor de Variables Cruzadas (Dual-Axis):**
   * Gráfica principal que compara la **Superficie Física** (Hectáreas Sembradas, Cosechadas, Siniestradas y aquellas "Fugadas" no contabilizadas) frente a datos **Volumétricos** (Toneladas Producidas vs Toneladas Consumidas).
2. **Desglose Estatal (Drill-Down):**
   * Haciendo clic en cualquier estado, la interfaz carga una vista detallada con 3 columnas maestras que separan la naturaleza del terreno, la producción agregada y el destino exacto de ese consumo (uso familiar, semillas, alimento animal o venta comercial/exportación).
3. **Clasificación por Eficiencia (Rendimiento):**
   * Histograma inteligente que agrupa a los estados según sus Toneladas por Hectárea (Eficiencia Agrícola). Muestra aportaciones proporcionales de consumo y el conjunto de infraestructura estatal.
4. **Segmentación de Mercado (Market Share):**
   * Segmentación macroeconómica que separa a los estados por el tamaño neto de su industria productora para analizar sus monopolios o nivel de escala (Subsistencia vs Megaproductores).

## 🛠 Instalación y Uso

Este proyecto es completamente local y **no requiere un servidor backend o proceso de pre-construcción** como Node.js/NPM.

1. **Clonar el Repositorio:**
   \`\`\`bash
   git clone https://github.com/TU_USUARIO/ProyectoConsumoMaiz.git
   \`\`\`
2. **Ejecutar Localmente:**
   Simplemente da doble clic en el archivo \`index.html\` para abrirlo en cualquier navegador web moderno (Chrome, Edge, Firefox, Safari).

### Tecnologías Implementadas
* **HTML5:** Estructura semántica.
* **Tailwind CSS (CDN):** Framework de utilidades para responsividad, grid y diseño oscuro estético tipo cristal (glassmorphism).
* **Vanilla JavaScript:** Lógica funcional de procesamiento de CSV incrustado, cálculos estadísticos, algoritmos de clustering numérico y manipulación del DOM.
* **Apache ECharts:** Renderizado de gráficos profesionales y modulares en canvas.

---
*Datos basados en los reportes públicos de Agricultura y SIAP (México).*
