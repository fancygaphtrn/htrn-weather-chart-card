import locale from './locale.js';
import {
  cardinalDirectionsIcon,
  weatherIcons,
  weatherIconsDay,
  weatherIconsNight,
  WeatherEntityFeature
} from './const.js';
import {LitElement, html} from 'lit';
import './htrn-weather-chart-card-editor.js';
import { property } from 'lit/decorators.js';
import {Chart, registerables} from 'chart.js';
import ChartDataLabels from 'chartjs-plugin-datalabels';
Chart.register(...registerables, ChartDataLabels);

class HTRNWeatherChartCard extends LitElement {

static getConfigElement() {
  return document.createElement("htrn-weather-chart-card-editor");
}

static getStubConfig(hass, unusedEntities, allEntities) {
  let entity = unusedEntities.find((eid) => eid.split(".")[0] === "weather");
  if (!entity) {
    entity = allEntities.find((eid) => eid.split(".")[0] === "weather");
  }
  return {
    entity,
    show_main: true,
    show_temperature: true,
    show_current_condition: true,
    show_attributes: true,
    show_time: false,
    show_time_seconds: false,
    show_day: false,
    show_date: false,
    show_humidity: true,
    show_pressure: true,
    show_wind_direction: true,
    show_wind_speed: true,
    show_sun: true,
    show_feels_like: false,
    show_dew_point: false,
    show_wind_gust_speed: false,
    show_visibility: false,
    show_last_changed: false,
    use_12hour_format: false,
    icons_size: 25,
    animated_icons: false,
    icon_style: 'style1',
    autoscroll: false,
    forecast: {
      precipitation_type: 'rainfall',
      show_probability: false,
      labels_font_size: '11',
      precip_bar_size: '100',
      style: 'style1',
      show_wind_forecast: true,
      condition_icons: true,
      round_temp: false,
      type: 'daily',
      number_of_forecasts: '0', 
      disable_animation: false, 
    },
  };
}

  static get properties() {
    return {
      _hass: {},
      config: {},
      language: {},
      sun: {type: Object},
      weather: {type: Object},
      temperature: {type: Object},
      humidity: {type: Object},
      pressure: {type: Object},
      windSpeed: {type: Object},
      option1: {type: Object},
      option2: {type: Object},
      option3: {type: Object},
      windDirection: {type: Number},
      forecastChart: {type: Object},
      forecastItems: {type: Number},
      forecasts: { type: Array }
    };
  }

setConfig(config) {
  const cardConfig = {
    icons_size: 25,
    animated_icons: false,
    icon_style: 'style1',
    current_temp_size: 28,
    time_size: 26,
    day_date_size: 15,
    show_feels_like: false,
    show_dew_point: false,
    show_wind_gust_speed: false,
    show_visibility: false,
    show_last_changed: false,
    show_description: false,
    ...config,
    forecast: {
      precipitation_type: 'rainfall',
      show_probability: false,
      labels_font_size: 11,
      chart_height: 180,
      precip_bar_size: 100,
      style: 'style1',
      temperature1_color: 'rgba(255, 152, 0, 1.0)',
      temperature2_color: 'rgba(68, 115, 158, 1.0)',
      precipitation_color: 'rgba(132, 209, 253, 1.0)',
      condition_icons: true,
      show_wind_forecast: true,
      round_temp: false,
      type: 'daily',
      number_of_forecasts: '0',
      '12hourformat': false,
      ...config.forecast,
    },
    units: {
      pressure: 'hPa',
      ...config.units,
    }
  };

  cardConfig.units.speed = config.speed ? config.speed : cardConfig.units.speed;

  this.baseIconPath = cardConfig.icon_style === 'style2' ?
    'https://cdn.jsdelivr.net/gh/mlamberts78/weather-chart-card/dist/icons2/':
    'https://cdn.jsdelivr.net/gh/mlamberts78/weather-chart-card/dist/icons/' ;

  this.config = cardConfig;
  if (!config.entity) {
    throw new Error('Please, define entity in the card config');
  }
}

set hass(hass) {
  this._hass = hass;
  this.language = this.config.locale || hass.selectedLanguage || hass.language;
  this.sun = 'sun.sun' in hass.states ? hass.states['sun.sun'] : null;
  this.unitSpeed = this.config.units.speed ? this.config.units.speed : this.weather && this.weather.attributes.wind_speed_unit;
  this.unitPressure = this.config.units.pressure ? this.config.units.pressure : this.weather && this.weather.attributes.pressure_unit;
  this.unitVisibility = this.config.units.visibility ? this.config.units.visibility : this.weather && this.weather.attributes.visibility_unit;
  this.weather = this.config.entity in hass.states
    ? hass.states[this.config.entity]
    : null;
  if (!this.weather || this.weather.state == "unavailable") {
    this.weather = null;
  }
  if (this.weather) {
    this.temperature = this.config.temp ? hass.states[this.config.temp].state : this.weather.attributes.temperature;
    this.humidity = this.config.humid ? hass.states[this.config.humid].state : this.weather.attributes.humidity;
    this.pressure = this.config.press ? hass.states[this.config.press].state : this.weather.attributes.pressure;
    this.uv_index = this.config.uv ? hass.states[this.config.uv].state : this.weather.attributes.uv_index;
    this.windSpeed = this.config.windspeed ? hass.states[this.config.windspeed].state : this.weather.attributes.wind_speed;
    this.dew_point = this.config.dew_point ? hass.states[this.config.dew_point].state : this.weather.attributes.dew_point;
    this.wind_gust_speed = this.config.wind_gust_speed ? hass.states[this.config.wind_gust_speed].state : this.weather.attributes.wind_gust_speed;
    this.visibility = this.config.visibility ? hass.states[this.config.visibility].state : this.weather.attributes.visibility;

    if (this.config.winddir && hass.states[this.config.winddir] && hass.states[this.config.winddir].state !== undefined) {
      this.windDirection = parseFloat(hass.states[this.config.winddir].state);
    } else {
      this.windDirection = this.weather.attributes.wind_bearing;
    }

    this.feels_like = this.config.feels_like && hass.states[this.config.feels_like] ? hass.states[this.config.feels_like].state : this.weather.attributes.apparent_temperature;
    this.description = this.config.description && hass.states[this.config.description] ? hass.states[this.config.description].attributes.forecast[0].detailed_description : this.weather.attributes.description;

    this.option1 = this.config.option1 in hass.states ? hass.states[this.config.option1] : null;
    this.option2 = this.config.option2 in hass.states ? hass.states[this.config.option2] : null;
    this.option3 = this.config.option3 in hass.states ? hass.states[this.config.option3] : null;
  }

  if (this.weather && !this.forecastSubscriber) {
    this.subscribeForecastEvents();
  }
}

subscribeForecastEvents() {
  this.config.forecast.type || 'daily';

  //const feature = isHourly ? WeatherEntityFeature.FORECAST_HOURLY : WeatherEntityFeature.FORECAST_DAILY;
  //if (!this.supportsFeature(feature)) {
  //  console.error(`Weather entity "${this.config.entity}" does not support ${isHourly ? 'hourly' : 'daily'} forecasts.`);
  //  return;
  //}

  const callback = (event) => {
    this.forecasts = event.forecast;
    this.requestUpdate();
    this.drawChart();
  };

  this.forecastSubscriber = this._hass.connection.subscribeMessage(callback, {
    type: "weather/subscribe_forecast",
    forecast_type: this.config.forecast.type,
    entity_id: this.config.entity,
  });
}

  supportsFeature(feature) {
    return (this.weather.attributes.supported_features & feature) !== 0;
  }

  constructor() {
    super();
    this.resizeObserver = null;
    this.resizeInitialized = false;
  }

  connectedCallback() {
    super.connectedCallback();
    if (!this.resizeInitialized) {
      this.delayedAttachResizeObserver();
    }
  }

  delayedAttachResizeObserver() {
    setTimeout(() => {
      this.attachResizeObserver();
      this.resizeInitialized = true;
    }, 0);
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    this.detachResizeObserver();
    if (this.forecastSubscriber) {
      this.forecastSubscriber.then((unsub) => unsub());
    }
  }

  attachResizeObserver() {
    this.resizeObserver = new ResizeObserver(() => {
      this.measureCard();
    });
    const card = this.shadowRoot.querySelector('ha-card');
    if (card) {
      this.resizeObserver.observe(card);
    }
  }

  detachResizeObserver() {
    if (this.resizeObserver) {
      this.resizeObserver.disconnect();
      this.resizeObserver = null;
      this.resizeInitialized = false;
    }
  }

measureCard() {
  const hacard = this.shadowRoot.querySelector('ha-card');
  const card = hacard.querySelector('.forecast-container');
  let fontSize = this.config.forecast.labels_font_size;
  const numberOfForecasts = this.config.forecast.number_of_forecasts || 0;

  if (!card) {
    return;
  }

  if (numberOfForecasts > 0) {
    this.forecastItems = numberOfForecasts;
    if (this.forecasts) {
      const forecastContainer   = this.shadowRoot.querySelector('.forecast-container');
      const chartContainer      = this.shadowRoot.querySelector('.chart-container');
      const conditionsContainer = this.shadowRoot.querySelector('.conditions');
      const windContainer       = this.shadowRoot.querySelector('.wind-details');

      let newWidth = (fontSize * 3) * Math.min(this.forecasts.length+1, this.forecastItems);
      if (newWidth < card.offsetWidth){
        newWidth = card.offsetWidth;
      } else {
        forecastContainer.style.width     = `${newWidth}px`;
        forecastContainer.style.overflowX = 'scroll';
        
        chartContainer.style.width      = `${newWidth}px`;
        conditionsContainer.style.width = `${newWidth-20}px`;
        windContainer.style.width       = `${newWidth-20}px`;
       }
    }
  } else {  
    this.forecastItems = Math.round((card.offsetWidth) / (fontSize + 20)-1);
  }
  this.drawChart();
}

ll(str) {
  const selectedLocale = this.config.locale || this.language || 'en';
  return locale[selectedLocale][str] || locale.en[str] || str;
}

getCardSize() {
  return 4;
}

getUnit(unit) {
  return this._hass.config.unit_system[unit] || '';
}

getWeatherIcon(condition, sun) {
  if (this.config.animated_icons === true) {
    const iconName = sun === 'below_horizon' ? weatherIconsNight[condition] : weatherIconsDay[condition];
    return `${this.baseIconPath}${iconName}.svg`;
  } else if (this.config.icons) {
    const iconName = sun === 'below_horizon' ? weatherIconsNight[condition] : weatherIconsDay[condition];
    return `${this.config.icons}${iconName}.svg`;
  }
  return weatherIcons[condition];
}

getWindDirIcon(deg) {
  if (typeof deg === 'number') {
    return cardinalDirectionsIcon[parseInt((deg + 22.5) / 45.0)];
  } else {
    var i = 9;
    switch (deg) {
      case "N":
        i = 0;
        break;
      case "NNE":
      case "NE":
        i = 1;
        break;
      case "ENE":
      case "E":
        i = 2;
        break;
      case "ESE":
      case "SE":
        i = 3;
        break;
      case "SSE":
      case "S":
        i = 4;
        break;
      case "SSW":
      case "SW":
        i = 5;
        break;
      case "WSW":
      case "W":
        i = 6;
        break;
      case "NW":
      case "NNW":
        i = 7;
        break;
      case "WNW":
        i = 8;
        break;
      default:
        i = 9;
        break;
    }
    return cardinalDirectionsIcon[i];
  }
}

getWindDir(deg) {
  if (typeof deg === 'number') {
    return this.ll('cardinalDirections')[parseInt((deg + 11.25) / 22.5)];
  } else {
    return deg;
  }
}

calculateBeaufortScale(windSpeed) {
  const unitConversion = {
    'km/h': 1,
    'm/s': 3.6,
    'mph': 1.60934,
  };

  if (!this.weather || !this.weather.attributes.wind_speed_unit) {
    throw new Error('wind_speed_unit not available in weather attributes.');
  }

  const wind_speed_unit = this.weather.attributes.wind_speed_unit;
  const conversionFactor = unitConversion[wind_speed_unit];

  if (typeof conversionFactor !== 'number') {
    throw new Error(`Unknown wind_speed_unit: ${wind_speed_unit}`);
  }

  const windSpeedInKmPerHour = windSpeed * conversionFactor;

  if (windSpeedInKmPerHour < 1) return 0;
  else if (windSpeedInKmPerHour < 6) return 1;
  else if (windSpeedInKmPerHour < 12) return 2;
  else if (windSpeedInKmPerHour < 20) return 3;
  else if (windSpeedInKmPerHour < 29) return 4;
  else if (windSpeedInKmPerHour < 39) return 5;
  else if (windSpeedInKmPerHour < 50) return 6;
  else if (windSpeedInKmPerHour < 62) return 7;
  else if (windSpeedInKmPerHour < 75) return 8;
  else if (windSpeedInKmPerHour < 89) return 9;
  else if (windSpeedInKmPerHour < 103) return 10;
  else if (windSpeedInKmPerHour < 118) return 11;
  else return 12;
}

async firstUpdated(changedProperties) {
  super.firstUpdated(changedProperties);
  this.measureCard();
  await new Promise(resolve => setTimeout(resolve, 0));
  this.drawChart();

  if (this.config.autoscroll) {
    this.autoscroll();
  }
}


async updated(changedProperties) {
  await this.updateComplete;

  if (changedProperties.has('config')) {
    const oldConfig = changedProperties.get('config');

    const entityChanged = oldConfig && this.config.entity !== oldConfig.entity;
    const forecastTypeChanged = oldConfig && this.config.forecast.type !== oldConfig.forecast.type;
    const autoscrollChanged = oldConfig && this.config.autoscroll !== oldConfig.autoscroll;

    if (entityChanged || forecastTypeChanged) {
      if (this.forecastSubscriber && typeof this.forecastSubscriber === 'function') {
        this.forecastSubscriber();
      }

      this.subscribeForecastEvents();
    }

    if (this.forecasts && this.forecasts.length) {
      this.drawChart();
    }

    if (autoscrollChanged) {
      if (!this.config.autoscroll) {
        this.autoscroll();
      } else {
        this.cancelAutoscroll();
      }
    }
  }

  if (changedProperties.has('weather')) {
    this.updateChart();
  }
}

autoscroll() {
  if (this.autoscrollTimeout) {
    // Autscroll already set, nothing to do
    return;
  }

  const updateChartOncePerHour = () => {
    const now = new Date();
    const nextHour = new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate(),
        now.getHours()+1,
    );
    this.autoscrollTimeout = setTimeout(() => {
      this.autoscrollTimeout = null;
      this.updateChart();
      drawChartOncePerHour();
    }, nextHour - now);
  };

  updateChartOncePerHour();
}

cancelAutoscroll() {
  if (this.autoscrollTimeout) {
    clearTimeout(this.autoscrollTimeout);
  }
}

drawChart({ config, language, weather, forecastItems } = this) {
  if (!this.forecasts || !this.forecasts.length) {
    return [];
  }

  const chartCanvas = this.renderRoot && this.renderRoot.querySelector('#forecastChart');
  if (!chartCanvas) {
    console.error('Canvas element not found:', this.renderRoot);
    return;
  }

  if (this.forecastChart) {
    this.forecastChart.destroy();
  }
  var tempUnit = this._hass.config.unit_system.temperature;
  var lengthUnit = this._hass.config.unit_system.length;
  
  var probabilityUnit = '%';
  var precipUnit = lengthUnit === 'km' ? this.ll('units')['mm'] : this.ll('units')['in'];
  
  const data = this.computeForecastData();

  var style = getComputedStyle(document.body);
  var backgroundColor = style.getPropertyValue('--card-background-color');
  var textColor = style.getPropertyValue('--primary-text-color');
  var dividerColor = style.getPropertyValue('--divider-color');
  const canvas = this.renderRoot.querySelector('#forecastChart');
  if (!canvas) {
    requestAnimationFrame(() => this.drawChart());
    return;
  }

  const ctx = canvas.getContext('2d');

  let precipMax;

  if (config.forecast.precipitation_type === 'probability') {
    precipMax = 100;
  } else {
    if (config.forecast.type === 'hourly') {
      precipMax = lengthUnit === 'km' ? 4 : 1;
    } else {
      precipMax = lengthUnit === 'km' ? 20 : 1;
    }
  }

  Chart.defaults.color = textColor;
  Chart.defaults.scale.grid.color = dividerColor;
  Chart.defaults.elements.line.fill = false;
  Chart.defaults.elements.line.tension = 0.3;
  Chart.defaults.elements.line.borderWidth = 1.5;
  Chart.defaults.elements.point.radius = 2;
  Chart.defaults.elements.point.hitRadius = 10;

  var datasets = [
    {
      label: this.ll('tempHi'),
      type: 'line',
      data: data.tempHigh,
      spanGaps: true,
      yAxisID: 'TempAxis',
      borderColor: config.forecast.temperature1_color,
      backgroundColor: config.forecast.temperature1_color,
    },
    {
      label: this.ll('tempLo'),
      type: 'line',
      data: data.tempLow,
      spanGaps: true,
      yAxisID: 'TempAxis',
      borderColor: config.forecast.temperature2_color,
      backgroundColor: config.forecast.temperature2_color,
    },
    {
      label: this.ll('precip'),
      type: 'bar',
      data: data.precip,
      yAxisID: 'PrecipAxis',
      borderColor: config.forecast.precipitation_color,
      backgroundColor: config.forecast.precipitation_color,
      barPercentage: config.forecast.precip_bar_size / 100,
      categoryPercentage: 1.0,
      datalabels: {
        display: function (context) {
          return context.dataset.data[context.dataIndex] > 0 ? 'true' : false;
        },
      formatter: function (value, context) {
        const precipitationType = config.forecast.precipitation_type;

        //const rainfall = context.dataset.data[context.dataIndex];
        const rainfall = data.forecast[context.dataIndex].precipitation;
        const probability = data.forecast[context.dataIndex].precipitation_probability;

        let formattedValue;
        if (precipitationType === 'rainfall') {
          if (probability !== undefined && probability !== null && config.forecast.show_probability) {
            formattedValue = `${rainfall > 9 ? Math.round(rainfall) : rainfall.toFixed(1)}${precipUnit}\n${Math.round(probability)}${probabilityUnit}`;
          } else {
            formattedValue = `${rainfall > 9 ? Math.round(rainfall) : rainfall.toFixed(1)}${precipUnit}`;
          }
        } else {
          if (rainfall !== undefined && rainfall !== null && config.forecast.show_probability) {
            formattedValue = `${rainfall > 9 ? Math.round(rainfall) : rainfall.toFixed(1)}${precipUnit}\n${Math.round(probability)}${probabilityUnit}`;
          } else {
            formattedValue = `${Math.round(probability)}${probabilityUnit}`;
          }
        }


        formattedValue = formattedValue.replace('\n', '\n\n');

        return formattedValue;
      },
        textAlign: 'center',
        textBaseline: 'middle',
        align: 'top',
        anchor: 'start',
        offset: -10,
      },
    },
  ];

  if (config.forecast.style === 'style2') {
    datasets[0].datalabels = {
      display: function (context) {
        return 'true';
      },
      formatter: function (value, context) {
        return context.dataset.data[context.dataIndex] + '°';
      },
      align: 'top',
      anchor: 'center',
      backgroundColor: 'transparent',
      borderColor: 'transparent',
      color: config.forecast.chart_text_color || config.forecast.temperature1_color,
      font: {
        size: parseInt(config.forecast.labels_font_size) + 1,
        lineHeight: 0.7,
      },
    };

    datasets[1].datalabels = {
      display: function (context) {
        return 'true';
      },
      formatter: function (value, context) {
        return context.dataset.data[context.dataIndex] + '°';
      },
      align: 'bottom',
      anchor: 'center',
      backgroundColor: 'transparent',
      borderColor: 'transparent',
      color: config.forecast.chart_text_color || config.forecast.temperature2_color,
      font: {
        size: parseInt(config.forecast.labels_font_size) + 1,
        lineHeight: 0.7,
      },
    };
  }

  this.forecastChart = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: data.dateTime,
      datasets: datasets,
    },
    options: {
      maintainAspectRatio: false,
      animation: config.forecast.disable_animation === true ? { duration: 0 } : {},
      layout: {
        autoPadding: false,
        padding: {
          left: 10,
          right: 10,
          bottom: 10
        },
      },
      scales: {
        x: {
          position: 'top',
          border: {
            width: 0,
          },
          grid: {
            drawTicks: false,
            color: dividerColor,
          },
          ticks: {
              maxRotation: 0,
              color: config.forecast.chart_datetime_color || textColor,
              padding: config.forecast.precipitation_type === 'rainfall' && config.forecast.show_probability && config.forecast.type !== 'hourly' ? 4 : 10,
              callback: function (value, index, values) {
                  var datetime = this.getLabelForValue(value);
                  var dateObj = new Date(datetime);
        
                  var timeFormatOptions = {
                      hour12: config.use_12hour_format,
                      hour: 'numeric'
                  };

                  var time = dateObj.toLocaleTimeString(language, timeFormatOptions);

                  //if (dateObj.getHours() === 0 && dateObj.getMinutes() === 0 && config.forecast.type === 'hourly') {
                  if (config.forecast.type === 'hourly') {
                      var date = dateObj.toLocaleString(language, { weekday: 'short' }).toUpperCase();
                      time = time.replace('a.m.', 'AM').replace('p.m.', 'PM');
                      return [date, time];
                  }

                  if (config.forecast.type !== 'hourly') {
                      var weekday = dateObj.toLocaleString(language, { weekday: 'short' }).toUpperCase();
                      return weekday;
                  }

                  time = time.replace('a.m.', 'AM').replace('p.m.', 'PM');
                  return time;
              },
          },
        },
        TempAxis: {
          position: 'left',
          beginAtZero: false,
          suggestedMin: Math.min(...data.tempHigh.filter(v=>v!=null), ...data.tempLow.filter(v=>v!=null)) - 5,
          suggestedMax: Math.max(...data.tempHigh.filter(v=>v!=null), ...data.tempLow.filter(v=>v!=null)) + 3,
          grid: {
            display: false,
            drawTicks: false,
          },
          ticks: {
            display: false,
          },
        },
        PrecipAxis: {
          position: 'right',
          suggestedMax: precipMax,
          grid: {
            display: false,
            drawTicks: false,
          },
          ticks: {
            display: false,
          },
        },
      },
      plugins: {
        legend: {
          display: false,
        },
        datalabels: {
          backgroundColor: backgroundColor,
          borderColor: context => context.dataset.backgroundColor,
          borderRadius: 0,
          borderWidth: 1.5,
          padding: config.forecast.precipitation_type === 'rainfall' && config.forecast.show_probability && config.forecast.type !== 'hourly' ? 3 : 4,
          color: config.forecast.chart_text_color || textColor,
          font: {
            size: config.forecast.labels_font_size,
            lineHeight: 0.7,
          },
          formatter: function (value, context) {
            return context.dataset.data[context.dataIndex] + '°';
          },
        },
        tooltip: {
          caretSize: 0,
          caretPadding: 15,
          callbacks: {
            title: function (TooltipItem) {
              var datetime = TooltipItem[0].label;
              return new Date(datetime).toLocaleDateString(language, {
                month: 'short',
                day: 'numeric',
                weekday: 'short',
                hour: 'numeric',
                minute: 'numeric',
                hour12: config.use_12hour_format,
              });
            },
            label: function (context) {
              var label = context.dataset.label;
              var value = context.formattedValue;
              var probability = data.forecast[context.dataIndex].precipitation_probability;
              var unit = context.datasetIndex === 2 ? precipUnit : tempUnit;
        
              if (config.forecast.precipitation_type === 'rainfall' && context.datasetIndex === 2 && config.forecast.show_probability && probability !== undefined && probability !== null) {
                return label + ': ' + value + precipUnit + ' / ' + Math.round(probability) + probabilityUnit;
              }
              if (config.forecast.precipitation_type === 'probability' && context.datasetIndex === 2 && probability !== undefined && probability !== null) {
                return label + ': ' + value + probabilityUnit;
              } 
              return label + ': ' + value + unit;
            },
          },
        },
      },
    },
  });
}

computeForecastData({ config, forecastItems } = this) {
  var forecast = this.forecasts ? this.forecasts.slice(0, forecastItems) : [];
  var roundTemp = config.forecast.round_temp == true;
  var dateTime = [];
  var tempHigh = [];
  var tempLow = [];
  var precip = [];

  for (var i = 0; i < forecast.length; i++) {
    var d = forecast[i];
    if (config.autoscroll) {
      const cutoff = (config.forecast.type === 'hourly' ? 1 : 24) * 60 * 60 * 1000;
      if (new Date() - new Date(d.datetime) > cutoff) {
        continue;
      }
    }
    if (config.forecast.type === 'twice_daily' ) {
      dateTime.push(d.datetime);
      if (d.is_daytime || this.mode == 'hourly') {
        tempHigh.push(d.temperature);
        tempLow.push(null);
      } else {
        tempHigh.push(null);
        tempLow.push(d.temperature);
      }
    } else {
      dateTime.push(d.datetime);
      tempHigh.push(d.temperature);
      if (typeof d.templow !== 'undefined') {
        tempLow.push(d.templow);
      }
  
      if (roundTemp) {
        tempHigh[i] = Math.round(tempHigh[i]);
        if (typeof d.templow !== 'undefined') {
          tempLow[i] = Math.round(tempLow[i]);
        }
      }
    }
    if (config.forecast.precipitation_type === 'probability') {
      if (typeof d.precipitation_probability == 'number') {
        precip.push(d.precipitation_probability);
      } else {
        precip.push(0);
      }
    } else {
      if (typeof d.precipitation == 'number') {
        precip.push(d.precipitation);
      } else {
        precip.push(0);
      }
    }
  }

  return {
    forecast,
    dateTime,
    tempHigh,
    tempLow,
    precip,
  }
}

updateChart({ forecasts, forecastChart } = this) {
  if (!forecasts || !forecasts.length) {
    return [];
  }

  const data = this.computeForecastData();

  if (forecastChart) {
    forecastChart.data.labels = data.dateTime;
    forecastChart.data.datasets[0].data = data.tempHigh;
    forecastChart.data.datasets[1].data = data.tempLow;
    forecastChart.data.datasets[2].data = data.precip;
    forecastChart.update();
  }
}

  render({config, _hass, weather} = this) {
    if (!config || !_hass) {
      return html``;
    }
    if (!weather || !weather.attributes) {
      return html`
        <style>
          .card {
            padding-top: ${config.title? '0px' : '16px'};
            padding-right: 16px;
            padding-bottom: 16px;
            padding-left: 16px;
          }
        </style>
        <ha-card header="${config.title}">
          <div class="card">
            Please, check your weather entity
          </div>
        </ha-card>
      `;
    }
    return html`
      <style>
        ha-icon {
          color: var(--paper-item-icon-color);
        }
        img {
          width: ${config.icons_size}px;
          height: ${config.icons_size}px;
        }
        .card {
          padding-top: ${config.title ? '0px' : '16px'};
          padding-right: 16px;
          padding-bottom: ${config.show_last_changed === true ? '2px' : '16px'};
          padding-left: 16px;
        }
        .main {
          display: flex;
          align-items: center;
          font-size: ${config.current_temp_size}px;
          margin-bottom: 10px;
        }
        .main ha-icon {
          --mdc-icon-size: 50px;
          margin-right: 14px;
        }
        .main img {
          width: ${config.icons_size * 2}px;
          height: ${config.icons_size * 2}px;
          margin-right: 14px;
        }
        .main div {
          line-height: 0.9;
        }
        .main span {
          font-size: 18px;
          color: var(--secondary-text-color);
        }
        .main .temp {
           cursor: pointer;
        }
        .main .feels-like {
          font-size: 13px;
          margin-top: 5px;
          font-weight: 400;
          cursor: pointer;          
        }
        .main .description {
          font-style: italic;
          font-size: 13px;
          margin-left: 20px;
          font-weight: 400;
        }
        .attributes {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 6px;
          font-weight: 300;
        }
        .attributes .humidity {
           cursor: pointer;
        }
        .attributes .option1 {
           cursor: pointer;
        }
        .attributes .option2 {
           cursor: pointer;
        }
        .attributes .option3 {
           cursor: pointer;
        }
                .attributes .press {
           cursor: pointer;
        }
        .attributes .dew_point {
           cursor: pointer;
        }
        .attributes .visibility {
           cursor: pointer;
        }
        .attributes .uv {
           cursor: pointer;
        }
        .attributes .winddir {
           cursor: pointer;
        }
        .attributes .windspeed {
           cursor: pointer;
        }
        .attributes .wind_gust_speed {
           cursor: pointer;
        }
        .chart-container {
          position: relative;
          height: ${config.forecast.chart_height}px;
          //width: 450px;
        }
        .forecast-container {
          max-width: 100%;
        }
        .conditions {
          display: flex;
          justify-content: space-around;
          align-items: center;
          padding: 0px 10px 0px 10px;
          cursor: pointer;
        }
        .forecast-item {
          //display: flex;
          //flex-direction: column;
          //align-items: center;
          //margin: 1px;
        }
        .wind-details {
          display: flex;
          justify-content: space-around;
          align-items: center;
          font-weight: 300;
          padding: 0px 10px 0px 10px;
          cursor: pointer;
        }
        .wind-detail {
          display: flex;
          align-items: center;
          margin: 1px;
          flex-wrap: wrap;
        }
        .wind-detail ha-icon {
          --mdc-icon-size: 15px;
          margin-right: 1px;
        }
        .wind-icon {
          margin-right: 1px;
          position: relative;
          bottom: 1px;
        }
        .wind-speed {
          font-size: ${config.forecast.labels_font_size}px;
          margin-right: 1px;
        }
        .wind-unit {
          font-size: 9px;
          margin-left: 1px;
        }
        .current-time {
          position: absolute;
          top: 20px;
          right: 16px;
          font-size: ${config.time_size}px;
        }
        .date-text {
          font-size: ${config.day_date_size}px;
          color: var(--secondary-text-color);
        }
        .updated {
          font-size: 13px;
          align-items: right;
          font-weight: 300;
          margin-bottom: 1px;
        }
      </style>

      <ha-card header="${config.title}">
        <div class="card">
          ${this.renderMain()}
          ${this.renderAttributes()}
          <div class="forecast-container">
            <div class="chart-container">
              <canvas id="forecastChart"></canvas>
            </div>
            ${this.renderForecastConditionIcons()}
            ${this.renderWind()}
          </div>
          ${this.renderLastUpdated()}
        </div>
      </ha-card>
    `;
  }

renderMain({ config, sun, weather, temperature, feels_like, description } = this) {
  if (config.show_main === false)
    return html``;

  const use12HourFormat = config.use_12hour_format;
  const showTime = config.show_time;
  const showDay = config.show_day;
  const showDate = config.show_date;
  const showFeelsLike = config.show_feels_like;
  const showDescription = config.show_description;
  const showCurrentCondition = config.show_current_condition !== false;
  const showTemperature = config.show_temperature !== false;
  const showSeconds = config.show_time_seconds === true;

  let roundedTemperature = parseFloat(temperature);
  if (!isNaN(roundedTemperature) && roundedTemperature % 1 !== 0) {
    roundedTemperature = Math.round(roundedTemperature * 10) / 10;
  }

  let roundedFeelsLike = parseFloat(feels_like);
  if (!isNaN(roundedFeelsLike) && roundedFeelsLike % 1 !== 0) {
    roundedFeelsLike = Math.round(roundedFeelsLike * 10) / 10;
  }

  const iconHtml = config.animated_icons || config.icons
    ? html`<img src="${this.getWeatherIcon(weather.state, sun.state)}" alt="">`
    : html`<ha-icon icon="${this.getWeatherIcon(weather.state, sun.state)}"></ha-icon>`;

  const updateClock = () => {
    const currentDate = new Date();
    const timeOptions = {
      hour12: use12HourFormat,
      hour: 'numeric',
      minute: 'numeric',
      second: showSeconds ? 'numeric' : undefined
    };
    const currentTime = currentDate.toLocaleTimeString(this.language, timeOptions);
    const currentDayOfWeek = currentDate.toLocaleString(this.language, { weekday: 'long' }).toUpperCase();
    const currentDateFormatted = currentDate.toLocaleDateString(this.language, { month: 'long', day: 'numeric' });

    const mainDiv = this.shadowRoot.querySelector('.main');
    if (mainDiv) {
      const clockElement = mainDiv.querySelector('#digital-clock');
      if (clockElement) {
        clockElement.textContent = currentTime;
      }
      if (showDay) {
        const dayElement = mainDiv.querySelector('.date-text.day');
        if (dayElement) {
          dayElement.textContent = currentDayOfWeek;
        }
      }
      if (showDate) {
        const dateElement = mainDiv.querySelector('.date-text.date');
        if (dateElement) {
          dateElement.textContent = currentDateFormatted;
        }
      }
    }
  };

  updateClock();

  if (showTime) {
    setInterval(updateClock, 1000);
  }

  return html`
    <div class="main">
      ${iconHtml}
      <div>
        <div>
          <div  class="temp" @click="${(e) => this.showMoreInfo(config.temp)}">
            ${showTemperature ? html`${roundedTemperature}<span>${this.getUnit('temperature')}</span>` : ''}
          </div>  
          ${showFeelsLike && roundedFeelsLike ? html`
            <div class="feels-like" @click="${(e) => this.showMoreInfo(config.feels_like)}">
              ${this.ll('feelsLike')}
              ${roundedFeelsLike}${this.getUnit('temperature')}
            </div>
          ` : ''}
          ${showCurrentCondition ? html`
            <div class="current-condition">
              <span>${this.ll(weather.state)}</span>
            </div>
          ` : ''}
        </div>
        </div>
        ${showDescription ? html`
          <div class="description">
            ${description}
          </div>
        ` : ''}
        ${showTime ? html`
          <div class="current-time">
            <div id="digital-clock"></div>
            ${showDay ? html`<div class="date-text day"></div>` : ''}
            ${showDay && showDate ? html` ` : ''}
            ${showDate ? html`<div class="date-text date"></div>` : ''}
          </div>
        ` : ''}
      </div>
    </div>
  `;
}

renderAttributes({ config, humidity, pressure, windSpeed, windDirection, sun, language, uv_index, dew_point, wind_gust_speed, visibility, option1, option2, option3 } = this) {
  let dWindSpeed = windSpeed;
  let dPressure = pressure;
  let dhumidity = Number(humidity).toFixed(0);
  let dDewpoint = Number(dew_point).toFixed(1);

  if (this.unitSpeed !== this.weather.attributes.wind_speed_unit) {
    if (this.unitSpeed === 'm/s') {
      if (this.weather.attributes.wind_speed_unit === 'km/h') {
        dWindSpeed = Math.round(windSpeed * 1000 / 3600);
      } else if (this.weather.attributes.wind_speed_unit === 'mph') {
        dWindSpeed = Math.round(windSpeed * 0.44704);
      }
    } else if (this.unitSpeed === 'km/h') {
      if (this.weather.attributes.wind_speed_unit === 'm/s') {
        dWindSpeed = Math.round(windSpeed * 3.6);
      } else if (this.weather.attributes.wind_speed_unit === 'mph') {
        dWindSpeed = Math.round(windSpeed * 1.60934);
      }
    } else if (this.unitSpeed === 'mph') {
      if (this.weather.attributes.wind_speed_unit === 'm/s') {
        dWindSpeed = Math.round(windSpeed / 0.44704);
      } else if (this.weather.attributes.wind_speed_unit === 'km/h') {
        dWindSpeed = Math.round(windSpeed / 1.60934);
      }
    } else if (this.unitSpeed === 'Bft') {
      dWindSpeed = this.calculateBeaufortScale(windSpeed);
    }
  } else {
    dWindSpeed = Math.round(dWindSpeed);
  }

  if (this.unitPressure !== this.weather.attributes.pressure_unit) {
    if (this.unitPressure === 'mmHg') {
      if (this.weather.attributes.pressure_unit === 'hPa') {
        dPressure = Math.round(pressure * 0.75006);
      } else if (this.weather.attributes.pressure_unit === 'inHg') {
        dPressure = Math.round(pressure * 25.4);
      }
    } else if (this.unitPressure === 'hPa') {
      if (this.weather.attributes.pressure_unit === 'mmHg') {
        dPressure = Math.round(pressure / 0.75006);
      } else if (this.weather.attributes.pressure_unit === 'inHg') {
        dPressure = Math.round(pressure * 33.8639);
      }
    } else if (this.unitPressure === 'inHg') {
      if (this.weather.attributes.pressure_unit === 'mmHg') {
        dPressure = pressure / 25.4;
      } else if (this.weather.attributes.pressure_unit === 'hPa') {
        dPressure = pressure / 33.8639;
      }
      dPressure = dPressure.toFixed(2);
    }
  } else {
    if (this.unitPressure === 'hPa' || this.unitPressure === 'mmHg') {
      dPressure = Math.round(dPressure);
    }
  }

  if (config.show_attributes == false)
    return html``;

  const showHumidity = config.show_humidity !== false;
  const showPressure = config.show_pressure !== false;
  const showWindDirection = config.show_wind_direction !== false;
  const showWindSpeed = config.show_wind_speed !== false;
  const showSun = config.show_sun !== false;
  const showDewpoint = config.show_dew_point == true;
  const showWindgustspeed = config.show_wind_gust_speed == true;
  const showVisibility = config.show_visibility == true;

  return html`
    <div class="attributes">
      ${((showHumidity && humidity !== undefined) || (showPressure && dPressure !== undefined) || (showDewpoint && dew_point !== undefined) || (showVisibility && visibility !== undefined)) ? html`
        <div>
          ${showHumidity && humidity !== undefined ? html`
          <div class="humidity" @click="${(e) => this.showMoreInfo(config.humid)}">
            <ha-icon icon="hass:water-percent"></ha-icon> ${dhumidity} %<br>
          </div>
          ` : ''}
          ${showPressure && dPressure !== undefined ? html`
          <div class="press" @click="${(e) => this.showMoreInfo(config.press)}">
            <ha-icon icon="hass:gauge"></ha-icon> ${dPressure} ${this.ll('units')[this.unitPressure]} <br>
          </div>
          ` : ''}
          ${showDewpoint && dew_point !== undefined ? html`
          <div class="dew_point" @click="${(e) => this.showMoreInfo(config.dew_point)}">
            <ha-icon icon="hass:thermometer-water"></ha-icon> ${dDewpoint} ${this.weather.attributes.temperature_unit} <br>
          </div>
	  ` : ''}
          ${showVisibility && visibility !== undefined ? html`
          <div class="visibility" @click="${(e) => this.showMoreInfo(config.visibility)}">
            <ha-icon icon="hass:eye"></ha-icon> ${visibility} ${this.weather.attributes.visibility_unit} <br>
          </div>
	  ` : ''}
          <div class="option1" @click="${(e) => this.showMoreInfo(config.option1)}">
            ${ option1 ? html`${option1.attributes.friendly_name} ${option1.state} ${option1.attributes.unit_of_measurement}` : ''}
          </div)
       </div>
      ` : ''}
      ${((showSun && sun !== undefined) || (typeof uv_index !== 'undefined' && uv_index !== undefined)) ? html`
        <div>
          ${typeof uv_index !== 'undefined' && uv_index !== undefined ? html`
            <div class="uv" @click="${(e) => this.showMoreInfo(config.uv)}">
              <ha-icon icon="hass:white-balance-sunny"></ha-icon> UV: ${Math.round(uv_index * 10) / 10}
            </div>
          ` : ''}
          ${showSun && sun !== undefined ? html`
            <div>
              ${this.renderSun({ sun, language })}
            </div>
          ` : ''}
          <div class="option2" @click="${(e) => this.showMoreInfo(config.option2)}">
            ${ option2 ? html`${option2.attributes.friendly_name} ${option2.state} ${option2.attributes.unit_of_measurement}` : ''}
          </div)
      </div>
      ` : ''}
      ${((showWindDirection && windDirection !== undefined) || (showWindSpeed && dWindSpeed !== undefined)) ? html`
        <div>
          ${showWindDirection && windDirection !== undefined ? html`
           <div class="winddir" @click="${(e) => this.showMoreInfo(config.winddir)}">
            <ha-icon icon="hass:${this.getWindDirIcon(windDirection)}"></ha-icon> ${this.getWindDir(windDirection)} <br>
          </div>
	  ` : ''}
          ${showWindSpeed && dWindSpeed !== undefined ? html`
           <div class="windspeed" @click="${(e) => this.showMoreInfo(config.windspeed)}">
            <ha-icon icon="hass:weather-windy"></ha-icon>
            ${dWindSpeed} ${this.ll('units')[this.unitSpeed]} <br>
           </div>
	  ` : ''}
          ${showWindgustspeed && wind_gust_speed !== undefined ? html`
           <div class="wind_gust_speed" @click="${(e) => this.showMoreInfo(config.wind_gust_speed)}">
            <ha-icon icon="hass:weather-windy-variant"></ha-icon>
            ${wind_gust_speed} ${this.ll('units')[this.unitSpeed]} <br>
           </div>
	  ` : ''}
         <div class="option3" @click="${(e) => this.showMoreInfo(config.option3)}">
            ${ option3 ? html`${option3.attributes.friendly_name} ${option3.state} ${option3.attributes.unit_of_measurement}` : ''}
          </div)
      </div>
      ` : ''}
    </div>
`;
}

renderSun({ sun, language, config } = this) {
  if (sun == undefined) {
    return html``;
  }

  const use12HourFormat = this.config.use_12hour_format;
  const timeOptions = {
    hour12: use12HourFormat,
    hour: 'numeric',
    minute: 'numeric'
  };

  return html`
    <ha-icon icon="mdi:weather-sunset-up"></ha-icon>
      ${new Date(sun.attributes.next_rising).toLocaleTimeString(language, timeOptions)}<br>
    <ha-icon icon="mdi:weather-sunset-down"></ha-icon>
      ${new Date(sun.attributes.next_setting).toLocaleTimeString(language, timeOptions)}
  `;
}

renderForecastConditionIcons({ config, forecastItems, sun } = this) {
  const forecast = this.forecasts ? this.forecasts.slice(0, forecastItems) : [];

  if (config.forecast.condition_icons === false) {
    return html``;
  }

  return html`
    <div class="conditions" @click="${(e) => this.showMoreInfo(config.entity)}">
      ${forecast.map((item) => {
        const forecastTime = new Date(item.datetime);
        const sunriseTime = new Date(sun.attributes.next_rising);
        const sunsetTime = new Date(sun.attributes.next_setting);

        // Adjust sunrise and sunset times to match the date of forecastTime
        const adjustedSunriseTime = new Date(forecastTime);
        adjustedSunriseTime.setHours(sunriseTime.getHours());
        adjustedSunriseTime.setMinutes(sunriseTime.getMinutes());
        adjustedSunriseTime.setSeconds(sunriseTime.getSeconds());

        const adjustedSunsetTime = new Date(forecastTime);
        adjustedSunsetTime.setHours(sunsetTime.getHours());
        adjustedSunsetTime.setMinutes(sunsetTime.getMinutes());
        adjustedSunsetTime.setSeconds(sunsetTime.getSeconds());

        let isDayTime;

        if (config.forecast.type === 'daily') {
          // For daily forecast, assume it's day time
          isDayTime = true;
        } else {
          // For other forecast types, determine based on sunrise and sunset times
          isDayTime = forecastTime >= adjustedSunriseTime && forecastTime <= adjustedSunsetTime;
        }

        const weatherIcons = isDayTime ? weatherIconsDay : weatherIconsNight;
        const condition = item.condition;

        let iconHtml;

        if (config.animated_icons || config.icons) {
          const iconSrc = config.animated_icons ?
            `${this.baseIconPath}${weatherIcons[condition]}.svg` :
            `${this.config.icons}${weatherIcons[condition]}.svg`;
          iconHtml = html`<img class="icon" src="${iconSrc}" alt="">`;
        } else {
          iconHtml = html`<ha-icon icon="${this.getWeatherIcon(condition, sun.state)}"></ha-icon>`;
        }

        return html`
          <div class="forecast-item">
            ${iconHtml}
          </div>
        `;
      })}
    </div>
  `;
}

renderWind({ config, weather, windSpeed, windDirection, forecastItems } = this) {
  const showWindForecast = config.forecast.show_wind_forecast !== false;

  if (!showWindForecast) {
    return html``;
  }

  const forecast = this.forecasts ? this.forecasts.slice(0, forecastItems) : [];

  return html`
    <div class="wind-details" @click="${(e) => this.showMoreInfo(config.entity)}">
      ${showWindForecast ? html`
        ${forecast.map((item) => {
          let dWindSpeed = item.wind_speed;

          if (this.unitSpeed !== this.weather.attributes.wind_speed_unit) {
            if (this.unitSpeed === 'm/s') {
              if (this.weather.attributes.wind_speed_unit === 'km/h') {
                dWindSpeed = Math.round(item.wind_speed * 1000 / 3600);
              } else if (this.weather.attributes.wind_speed_unit === 'mph') {
                dWindSpeed = Math.round(item.wind_speed * 0.44704);
              }
            } else if (this.unitSpeed === 'km/h') {
              if (this.weather.attributes.wind_speed_unit === 'm/s') {
                dWindSpeed = Math.round(item.wind_speed * 3.6);
              } else if (this.weather.attributes.wind_speed_unit === 'mph') {
                dWindSpeed = Math.round(item.wind_speed * 1.60934);
              }
            } else if (this.unitSpeed === 'mph') {
              if (this.weather.attributes.wind_speed_unit === 'm/s') {
                dWindSpeed = Math.round(item.wind_speed / 0.44704);
              } else if (this.weather.attributes.wind_speed_unit === 'km/h') {
                dWindSpeed = Math.round(item.wind_speed / 1.60934);
              }
            } else if (this.unitSpeed === 'Bft') {
              dWindSpeed = this.calculateBeaufortScale(item.wind_speed);
            }
          } else {
            dWindSpeed = Math.round(dWindSpeed);
          }

          return html`
            <div class="wind-detail">
              <ha-icon class="wind-icon" icon="hass:${this.getWindDirIcon(item.wind_bearing)}"></ha-icon>
              <span class="wind-speed">${dWindSpeed}</span>
            </div>
          `;
        })}
      ` : ''}
    </div>
  `;
}

renderLastUpdated() {
  if (!this.config.show_last_changed) {
    return html``;
  }
  const lastUpdatedString = this.weather.last_updated;
  const lastUpdatedTimestamp = new Date(lastUpdatedString).getTime();
  const currentTimestamp = Date.now();
  const timeDifference = currentTimestamp - lastUpdatedTimestamp;

  const minutesAgo = Math.floor(timeDifference / (1000 * 60));
  const hoursAgo = Math.floor(minutesAgo / 60);

  const locale = this.language;

  const formatter = new Intl.RelativeTimeFormat(locale, { numeric: 'auto' });

  let formattedLastUpdated;

  if (hoursAgo > 0) {
    formattedLastUpdated = formatter.format(-hoursAgo, 'hour');
  } else {
    formattedLastUpdated = formatter.format(-minutesAgo, 'minute');
  }

  const showLastUpdated = this.config.show_last_changed == true;

  return html`
    <div class="updated">
      <div>
        ${formattedLastUpdated}
      </div>
    </div>
  `;
}

  _fire(type, detail, options) {
    const node = this.shadowRoot;
    options = options || {};
    detail = (detail === null || detail === undefined) ? {} : detail;
    const event = new Event(type, {
      bubbles: options.bubbles === undefined ? true : options.bubbles,
      cancelable: Boolean(options.cancelable),
      composed: options.composed === undefined ? true : options.composed
    });
    event.detail = detail;
    node.dispatchEvent(event);
    return event;
  }

  showMoreInfo(entity) {
    this._fire('hass-more-info', { entityId: entity });
  }
}

customElements.define('htrn-weather-chart-card', HTRNWeatherChartCard);

window.customCards = window.customCards || [];
window.customCards.push({
  type: "htrn-weather-chart-card",
  name: "HTRN Weather Chart Card",
  description: "A custom weather card with chart.",
  preview: true,
  documentationURL: "https://github.com/fancygaphtrn/htrn-weather-chart-card",
});
