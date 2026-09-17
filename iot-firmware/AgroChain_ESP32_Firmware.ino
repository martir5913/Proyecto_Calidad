/*
 * ====================================================================================
 * PROYECTO: AGROCHAIN ERP - NUCLEO DE CONTROL IOT Y RIEGO AUTOMATIZADO
 * HARDWARE: ESP32 DEVKIT V1 + SENSOR HUMEDAD CAPACITIVO + RELE ELECTROVALVULA
 * ESTANDARES APLICADOS: ISO/IEC 25010 (Fiabilidad, Tolerancia a Fallos y Fail-Safe)
 * ====================================================================================
 */

#include <WiFi.h>
#include <HTTPClient.h>

// 1. Configuracion de Red WiFi
const char* WIFI_SSID = "AGROTRACE_WIFI";
const char* WIFI_PASS = "AgroTrace2026";

// 2. Endpoint del Backend AgroChain REST API
const char* SERVER_ENDPOINT = "http://192.168.1.100:3000/api/v1/iot/telemetry";

// 3. Asignacion de Pines de Hardware
const int SOIL_SENSOR_PIN = 34; // Pin ADC1 para sensor de humedad de suelo
const int VALVE_RELAY_PIN = 23; // Pin digital para modulo de rele (Electrovalvula)
const int STATUS_LED_PIN  = 2;  // LED indicador de estado

// 4. Calibracion de Umbrales (ADC ESP32: 0 - 4095)
// Umbral seco: > 2800 (Requiere riego inmediato)
// Umbral humedo optimo: < 1900 (Suelo hidratado)
const int DRY_THRESHOLD_RAW = 2800; 
const char* BATCH_ID = "c7a8b61c-8e34-4b51-9104-58e1d2f95431";
const char* DEVICE_ID = "ESP32_SECTOR_01";

// 5. Temporizador de Transmision (cada 30 segundos)
unsigned long lastSendTime = 0;
const unsigned long SEND_INTERVAL_MS = 30000;

void setup() {
  Serial.begin(115200);
  delay(1000);
  Serial.println("\n[ESP32] Iniciando Nucleo de Riego y Telemetria AgroChain ERP...");

  pinMode(SOIL_SENSOR_PIN, INPUT);
  pinMode(VALVE_RELAY_PIN, OUTPUT);
  pinMode(STATUS_LED_PIN, OUTPUT);

  // Estado inicial seguro: Valvula cerrada
  digitalWrite(VALVE_RELAY_PIN, LOW);
  digitalWrite(STATUS_LED_PIN, LOW);

  // Conexion WiFi
  WiFi.mode(WIFI_STA);
  WiFi.begin(WIFI_SSID, WIFI_PASS);
  Serial.print("[WiFi] Conectando a red");

  int attempts = 0;
  while (WiFi.status() != WL_CONNECTED && attempts < 20) {
    delay(500);
    Serial.print(".");
    attempts++;
  }

  if (WiFi.status() == WL_CONNECTED) {
    Serial.println("\n[WiFi] Conectado exitosamente. IP: " + WiFi.localIP().toString());
  } else {
    Serial.println("\n[WiFi Warning] No se pudo conectar a WiFi. Operando en modo autonomo local (Fail-safe).");
  }
}

void loop() {
  // 1. Lectura de senal analogica
  int rawValue = analogRead(SOIL_SENSOR_PIN);

  // 2. Conversion a porcentaje de humedad (0% a 100%)
  // Mapeo: 4095 (aire/seco) -> 0%, 1200 (agua/saturado) -> 100%
  float moisturePct = (float)(4095 - rawValue) * 100.0 / (4095 - 1200);
  if (moisturePct < 0.0) moisturePct = 0.0;
  if (moisturePct > 100.0) moisturePct = 100.0;

  // 3. LOGICA LOCAL DE TOLERANCIA A FALLOS (ISO 25010 FAIL-SAFE)
  // Aunque no haya conexion al backend, el ESP32 protege el cultivo abriendo/cerrando el riego
  bool valveOpen = false;
  if (rawValue > DRY_THRESHOLD_RAW || moisturePct < 25.0) {
    digitalWrite(VALVE_RELAY_PIN, HIGH); // Abrir electrovalvula
    digitalWrite(STATUS_LED_PIN, HIGH);
    valveOpen = true;
    Serial.printf("[ALERTA] Suelo Seco (%.1f%%). RIEGO ACTIVADO (Valvula ON)\n", moisturePct);
  } else {
    digitalWrite(VALVE_RELAY_PIN, LOW); // Cerrar electrovalvula
    digitalWrite(STATUS_LED_PIN, LOW);
    valveOpen = false;
    Serial.printf("[INFO] Suelo Optimo (%.1f%%). Riego Apagado (Valvula OFF)\n", moisturePct);
  }

  // 4. Transmision de Telemetria al Servidor Central (cada 30s)
  if (millis() - lastSendTime >= SEND_INTERVAL_MS) {
    lastSendTime = millis();

    if (WiFi.status() == WL_CONNECTED) {
      HTTPClient http;
      http.begin(SERVER_ENDPOINT);
      http.addHeader("Content-Type", "application/json");

      String payload = "{";
      payload += "\"batch_id\":\"" + String(BATCH_ID) + "\",";
      payload += "\"device_id\":\"" + String(DEVICE_ID) + "\",";
      payload += "\"event_type\":\"TELEMETRIA_IOT\",";
      payload += "\"soil_moisture\":" + String(moisturePct, 2) + ",";
      payload += "\"temperature\":24.8,";
      payload += "\"notes\":\"Lectura automatica firmware ESP32\"";
      payload += "}";

      int httpResponseCode = http.POST(payload);
      if (httpResponseCode > 0) {
        Serial.printf("[HTTP] Telemetria enviada con exito. Codigo: %d\n", httpResponseCode);
      } else {
        Serial.printf("[HTTP Error] Error al transmitir: %s\n", http.errorToString(httpResponseCode).c_str());
      }
      http.end();
    }
  }

  delay(2000); // Muestreo cada 2 segundos
}
