/**
 * @file
 * Универсальный инициализатор графиков Apache ECharts для темы Base11 (base11/echarts).
 *
 * Возможности:
 * - автоматическое разрешение CSS-переменных вида var(--...) и color-mix(...) в цвета для Canvas;
 * - наследование базовой типографики, сетки и палитры темы из _b11-tokens.scss;
 * - ленивая подгрузка JSON-конфигурации по data-b11-chart-url через IntersectionObserver;
 * - адаптивный ресайз через ResizeObserver и событие b11:layout-change;
 * - экспорт графика в PNG по [data-b11-chart-export];
 * - публичный API Drupal.base11Charts для обновления графиков без перезагрузки страницы.
 */
((Drupal, once) => {
  'use strict';

  const instances = new WeakMap();
  const resizeObservers = new WeakMap();
  let intersectionObserver = null;
  let colorProbe = null;

  /**
   * Возвращает или создаёт скрытый элемент-пробу для вычисления любых CSS-цветов
   * (включая var(--...) и color-mix(...)) в понятный ECharts формат rgb()/rgba().
   */
  function getColorProbe() {
    if (colorProbe && document.body.contains(colorProbe)) {
      return colorProbe;
    }
    colorProbe = document.createElement('span');
    colorProbe.style.position = 'fixed';
    colorProbe.style.visibility = 'hidden';
    colorProbe.style.pointerEvents = 'none';
    document.body.appendChild(colorProbe);
    return colorProbe;
  }

  /**
   * Преобразует строку с CSS-переменной (например, "var(--chart-fact)") в вычисленный цвет.
   *
   * @param {HTMLElement} contextEl
   * @param {string} rawValue
   * @return {string}
   */
  function resolveCssToken(contextEl, rawValue) {
    if (typeof rawValue !== 'string' || !rawValue.includes('var(')) {
      return rawValue;
    }

    const trimmed = rawValue.trim();
    if (/^var\(--[a-zA-Z0-9_-]+\)$/.test(trimmed)) {
      const varName = trimmed.slice(4, -1);
      const computedVar = window.getComputedStyle(contextEl).getPropertyValue(varName).trim();
      if (computedVar && !computedVar.includes('var(') && !computedVar.includes('color-mix(')) {
        return computedVar;
      }
    }

    // Универсальный расчёт через CSS color property для сложных выражений (var + color-mix)
    const probe = getColorProbe();
    probe.style.color = '';
    probe.style.color = trimmed;
    const resolved = window.getComputedStyle(probe).color;
    return resolved || rawValue;
  }

  /**
   * Рекурсивно заменяет CSS-токены в конфигурации ECharts на вычисленные значения.
   *
   * @param {*} value
   * @param {HTMLElement} contextEl
   * @return {*}
   */
  function resolveOptionTokens(value, contextEl) {
    if (typeof value === 'string') {
      return resolveCssToken(contextEl, value);
    }
    if (Array.isArray(value)) {
      return value.map((item) => resolveOptionTokens(item, contextEl));
    }
    if (value && typeof value === 'object') {
      const next = {};
      Object.keys(value).forEach((key) => {
        next[key] = resolveOptionTokens(value[key], contextEl);
      });
      return next;
    }
    return value;
  }

  /**
   * Формирует базовую тему оформления ECharts на основе текущих CSS-токенов страницы.
   *
   * @param {HTMLElement} contextEl
   * @return {Object}
   */
  function getThemeDefaults(contextEl) {
    const styles = window.getComputedStyle(contextEl);
    const fontFamily = styles.getPropertyValue('--font-family-base').trim() || 'sans-serif';
    const textColor = resolveCssToken(contextEl, 'var(--text-color)');
    const axisColor = resolveCssToken(contextEl, 'var(--chart-axis-color)');
    const gridColor = resolveCssToken(contextEl, 'var(--chart-grid-color)');
    const tooltipBg = resolveCssToken(contextEl, 'var(--chart-tooltip-bg)');
    const tooltipBorder = resolveCssToken(contextEl, 'var(--chart-tooltip-border)');

    const palette = [];
    for (let i = 1; i <= 8; i++) {
      const color = resolveCssToken(contextEl, `var(--chart-series-${i})`);
      if (color && !color.includes('var(')) {
        palette.push(color);
      }
    }

    return {
      color: palette.length ? palette : undefined,
      textStyle: {
        fontFamily,
        color: textColor,
      },
      tooltip: {
        backgroundColor: tooltipBg,
        borderColor: tooltipBorder,
        borderWidth: 1,
        textStyle: {
          color: textColor,
          fontFamily,
        },
      },
      legend: {
        textStyle: {
          color: textColor,
          fontFamily,
        },
      },
      _axisColor: axisColor,
      _gridColor: gridColor,
    };
  }

  /**
   * Мягко дополняет конфигурацию ECharts базовыми настройками темы без перезаписи авторских опций.
   *
   * @param {Object} rawOption
   * @param {HTMLElement} contextEl
   * @return {Object}
   */
  function buildFinalOption(rawOption, contextEl) {
    const defaults = getThemeDefaults(contextEl);
    const resolved = resolveOptionTokens(rawOption, contextEl);

    const applyAxisDefaults = (axis) => {
      if (!axis) return axis;
      const items = Array.isArray(axis) ? axis : [axis];
      const mapped = items.map((item) => ({
        axisLabel: { color: defaults._axisColor, ...(item.axisLabel || {}) },
        axisLine: { lineStyle: { color: defaults._gridColor, ...(item.axisLine?.lineStyle || {}) }, ...(item.axisLine || {}) },
        splitLine: { lineStyle: { color: defaults._gridColor, ...(item.splitLine?.lineStyle || {}) }, ...(item.splitLine || {}) },
        ...item,
      }));
      return Array.isArray(axis) ? mapped : mapped[0];
    };

    const finalOption = {
      color: resolved.color || defaults.color,
      textStyle: { ...defaults.textStyle, ...(resolved.textStyle || {}) },
      tooltip: resolved.tooltip ? { ...defaults.tooltip, ...resolved.tooltip } : defaults.tooltip,
      ...resolved,
    };

    if (resolved.legend) {
      finalOption.legend = { ...defaults.legend, ...resolved.legend };
    }
    if (resolved.xAxis) {
      finalOption.xAxis = applyAxisDefaults(resolved.xAxis);
    }
    if (resolved.yAxis) {
      finalOption.yAxis = applyAxisDefaults(resolved.yAxis);
    }

    return finalOption;
  }

  /**
   * Показывает сообщение об ошибке внутри контейнера графика.
   *
   * @param {HTMLElement} container
   * @param {string} message
   */
  function showError(container, message) {
    container.classList.remove('is-loading');
    const errorBox = container.querySelector('.b11-chart__error') || document.createElement('div');
    errorBox.className = 'b11-chart__error';
    errorBox.textContent = message;
    if (!errorBox.parentNode) {
      container.appendChild(errorBox);
    }
  }

  /**
   * Очищает предыдущее сообщение об ошибке.
   *
   * @param {HTMLElement} container
   */
  function clearError(container) {
    const errorBox = container.querySelector('.b11-chart__error');
    if (errorBox) {
      errorBox.remove();
    }
  }

  /**
   * Рендерит ECharts-график внутри .b11-chart и подключает ResizeObserver.
   *
   * @param {HTMLElement} container
   * @param {Object} option
   */
  function renderChart(container, option) {
    if (typeof window.echarts === 'undefined') {
      showError(container, Drupal.t('Библиотека визуализации графиков (ECharts) не загружена.'));
      return;
    }

    const canvas = container.querySelector('.b11-chart__canvas');
    if (!canvas) {
      return;
    }

    clearError(container);

    let chart = instances.get(container);
    if (!chart) {
      chart = window.echarts.init(canvas);
      instances.set(container, chart);

      if (typeof window.ResizeObserver !== 'undefined') {
        const ro = new window.ResizeObserver(() => {
          const active = instances.get(container);
          if (active && !active.isDisposed()) {
            active.resize();
          }
        });
        ro.observe(canvas);
        resizeObservers.set(container, ro);
      }
    }

    const finalOption = buildFinalOption(option, container);
    chart.setOption(finalOption, true);
    container.classList.remove('is-loading');
  }

  /**
   * Загружает JSON-конфигурацию графика по HTTP и отрисовывает её.
   *
   * @param {HTMLElement} container
   * @param {string} url
   */
  async function loadChartFromUrl(container, url) {
    container.classList.add('is-loading');
    clearError(container);

    try {
      const response = await window.fetch(url, {
        headers: { Accept: 'application/json' },
        credentials: 'same-origin',
      });
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      const data = await response.json();
      const option = data && typeof data === 'object' && data.option ? data.option : data;
      if (!option || typeof option !== 'object') {
        throw new Error('Invalid chart payload');
      }
      renderChart(container, option);
    } catch (err) {
      console.error('Ошибка загрузки графика ECharts:', err);
      showError(container, Drupal.t('Не удалось загрузить данные графика.'));
    }
  }

  /**
   * Инициализирует один элемент .b11-chart (синхронно или лениво через IntersectionObserver).
   *
   * @param {HTMLElement} container
   */
  function initChartContainer(container) {
    const inlineConfig = container.getAttribute('data-b11-chart-config');
    if (inlineConfig) {
      try {
        renderChart(container, JSON.parse(inlineConfig));
      } catch (err) {
        console.error('Некорректный JSON конфигурации графика:', err);
        showError(container, Drupal.t('Ошибка конфигурации графика.'));
      }
      return;
    }

    const endpoint = container.getAttribute('data-b11-chart-url');
    if (!endpoint) {
      container.classList.remove('is-loading');
      return;
    }

    if (typeof window.IntersectionObserver === 'undefined') {
      loadChartFromUrl(container, endpoint);
      return;
    }

    if (!intersectionObserver) {
      intersectionObserver = new window.IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (!entry.isIntersecting) return;
            const target = entry.target;
            intersectionObserver.unobserve(target);
            const targetUrl = target.getAttribute('data-b11-chart-url');
            if (targetUrl && target.dataset.b11ChartLoaded !== '1') {
              target.dataset.b11ChartLoaded = '1';
              loadChartFromUrl(target, targetUrl);
            }
          });
        },
        { rootMargin: '200px 0px' }
      );
    }

    intersectionObserver.observe(container);
  }

  /**
   * Экспортирует график в PNG-файл.
   *
   * @param {HTMLElement} container
   * @param {string} filename
   */
  function exportChartToPng(container, filename) {
    const chart = instances.get(container);
    if (!chart || chart.isDisposed()) {
      return;
    }

    const bgColor = resolveCssToken(container, 'var(--surface-card)') || '#ffffff';
    const dataUrl = chart.getDataURL({
      type: 'png',
      pixelRatio: 2,
      backgroundColor: bgColor,
    });

    const link = document.createElement('a');
    link.href = dataUrl;
    link.download = `${filename || 'chart'}.png`;
    document.body.appendChild(link);
    link.click();
    link.remove();
  }

  /**
   * Публичный JS API Base11 для программного управления графиками.
   */
  Drupal.base11Charts = {
    getInstance(containerOrSelector) {
      const el = typeof containerOrSelector === 'string'
        ? document.querySelector(containerOrSelector)
        : containerOrSelector;
      return el ? instances.get(el) || null : null;
    },

    reload(containerOrSelector, urlOrConfig) {
      const el = typeof containerOrSelector === 'string'
        ? document.querySelector(containerOrSelector)
        : containerOrSelector;
      if (!el) return;

      if (typeof urlOrConfig === 'string') {
        el.setAttribute('data-b11-chart-url', urlOrConfig);
        el.dataset.b11ChartLoaded = '1';
        loadChartFromUrl(el, urlOrConfig);
      } else if (urlOrConfig && typeof urlOrConfig === 'object') {
        renderChart(el, urlOrConfig);
      } else {
        const currentUrl = el.getAttribute('data-b11-chart-url');
        if (currentUrl) {
          loadChartFromUrl(el, currentUrl);
        }
      }
    },

    resizeAll() {
      document.querySelectorAll('.b11-chart').forEach((el) => {
        const chart = instances.get(el);
        if (chart && !chart.isDisposed()) {
          chart.resize();
        }
      });
    },
  };

  // Ресайз всех видимых графиков при изменении раскладки (например, сворачивании сайдбара)
  document.addEventListener('b11:layout-change', () => {
    Drupal.base11Charts.resizeAll();
  });

  Drupal.behaviors.base11Echarts = {
    attach(context) {
      once('base11-echarts', '.b11-chart', context).forEach((container) => {
        initChartContainer(container);
      });

      once('base11-echarts-export', '[data-b11-chart-export]', context).forEach((btn) => {
        btn.addEventListener('click', (event) => {
          event.preventDefault();
          const targetId = btn.getAttribute('data-b11-chart-export');
          let chartEl = targetId ? document.getElementById(targetId) : null;
          if (!chartEl) {
            const card = btn.closest('.b11-chart-card, .b11-card');
            chartEl = card ? card.querySelector('.b11-chart') : null;
          }
          if (chartEl) {
            const filename = btn.getAttribute('data-b11-chart-filename') || chartEl.id || 'chart';
            exportChartToPng(chartEl, filename);
          }
        });
      });
    },

    detach(context, settings, trigger) {
      if (trigger !== 'unload') {
        return;
      }
      context.querySelectorAll('.b11-chart').forEach((container) => {
        if (intersectionObserver) {
          intersectionObserver.unobserve(container);
        }
        const ro = resizeObservers.get(container);
        if (ro) {
          ro.disconnect();
          resizeObservers.delete(container);
        }
        const chart = instances.get(container);
        if (chart && !chart.isDisposed()) {
          chart.dispose();
        }
        instances.delete(container);
      });
    },
  };
})(Drupal, once);
