/**
 * SIMULADOR DE HARDWARE IOT ESP32 PARA EVALUACIÓN EXTERNA (ISO 29119)
 * Permite simular lecturas de humedad de suelo y temperatura hacia el backend AgroChain.
 */

const http = require('http');

const BACKEND_HOST = process.env.BACKEND_HOST || 'localhost';
const BACKEND_PORT = process.env.BACKEND_PORT || 3000;
const BATCH_ID = process.env.BATCH_ID || 'c7a8b61c-8e34-4b51-9104-58e1d2f95431';
const DEVICE_ID = process.env.DEVICE_ID || 'ESP32_SIMULADOR_CLI';

function sendTelemetry(moisture, temperature, note) {
  const payload = JSON.stringify({
    batch_id: BATCH_ID,
    device_id: DEVICE_ID,
    event_type: 'TELEMETRIA_IOT',
    soil_moisture: moisture,
    temperature: temperature,
    notes: note || 'Simulación de lectura periódica IoT'
  });

  const options = {
    hostname: BACKEND_HOST,
    port: BACKEND_PORT,
    path: '/api/v1/iot/telemetry',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(payload)
    }
  };

  const req = http.request(options, (res) => {
    let data = '';
    res.on('data', (chunk) => data += chunk);
    res.on('end', () => {
      try {
        const json = JSON.parse(data);
        console.log(`[${new Date().toLocaleTimeString()}] [HTTP ${res.statusCode}] Humedad: ${moisture.toFixed(1)}% | Temp: ${temperature.toFixed(1)}°C | Estado Válvula: [${json.valve_status || 'N/A'}]`);
        if (json.actionTaken) {
          console.log(`  -> ${json.actionTaken}`);
        }
      } catch (e) {
        console.log(`Respuesta cruda:`, data);
      }
    });
  });

  req.on('error', (err) => {
    console.error(`[Error de Conexión] No se pudo comunicar con http://${BACKEND_HOST}:${BACKEND_PORT}: ${err.message}`);
  });

  req.write(payload);
  req.end();
}

console.log('===========================================================');
console.log('   AGROCHAIN ERP: SIMULADOR DE SENSOR IOT ESP32           ');
console.log(`   Destino: http://${BACKEND_HOST}:${BACKEND_PORT}/api/v1/iot/telemetry`);
console.log(`   Lote ID: ${BATCH_ID}`);
console.log('===========================================================');

// Ejecución cíclica con variación realista (simulando secado gradual y riego)
let currentMoisture = 38.0;
let currentTemp = 24.5;

setInterval(() => {
  // Simular secado gradual
  currentMoisture -= (Math.random() * 2.5);
  currentTemp += ((Math.random() - 0.5) * 0.4);

  // Si cae por debajo de 20%, simular que el riego lo recupera
  if (currentMoisture < 19.0) {
    console.log('\n>>> [SIMULACIÓN] Suelo muy seco. Riego activado. Hidratando suelo...');
    currentMoisture = 55.0;
  }

  sendTelemetry(parseFloat(currentMoisture.toFixed(1)), parseFloat(currentTemp.toFixed(1)));
}, 5000);

// Primer envío inmediato
sendTelemetry(34.5, 24.0, 'Lectura inicial de arranque del simulador');
