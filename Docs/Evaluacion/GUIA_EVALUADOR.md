# GUÍA DE EJECUCIÓN Y EVALUACIÓN: AGROCHAIN ERP
**Proyecto:** AgroChain ERP — Plataforma de Trazabilidad Agrícola y Riego IoT  
**Entidad:** AgroTrace Tech, S.A.  
**Curso:** Aseguramiento de la Calidad del Software — Universidad Mariano Gálvez de Guatemala  
**Estándares Aplicados:** ISO/IEC 25010 (Calidad de Producto) e ISO/IEC/IEEE 29119 (Proceso de Pruebas de Software)  

---

## 1. DESPLIEGUE EN 1 SOLO PASO CON DOCKER (REPRODUCIBILIDAD 100%)

Para levantar todo el ecosistema (Base de Datos PostgreSQL 16 + PostGIS, Backend Node.js 22 LTS y Frontend Web React 18):

```bash
docker compose up --build
```

### URLs de Acceso Inmediato:
- **Portal Web Administrativo:** `http://localhost:5173`
- **API REST Backend:** `http://localhost:3000/api/v1/health`
- **Base de Datos Espacial:** `localhost:5432` (Usuario: `postgres`, BD: `agrochain`, Pass: `postgrespassword`)

---

## 2. EJECUCIÓN DE LA SUITE DE PRUEBAS AUTOMATIZADAS (ISO 29119)

El grupo evaluador puede ejecutar la suite de pruebas unitarias y de integración para validar que todos los casos pasan al 100% y que la cobertura supera el umbral normativo del 85%:

### Opción A: Desde la máquina local (en la carpeta `backend/`)
```bash
cd backend
npm test
```

### Opción B: Mediante Contenedor Docker
```bash
docker compose run --rm backend npm test
```

### Criterios de Aceptación Evaluados:
1. **Regla RN-01 (Período de Carencia):** Bloquea intentos de cosecha cuando existen agroquímicos activos antes de la fecha segura (`safe_harvest_date`).
2. **Regla RN-05 (Expediente QR):** Resolución completa en $\le 1.5\text{ s}$ con agregación de parcelas, químicos y auditorías.
3. **Regla RN-06 (Integridad Criptográfica):** Cálculo de hash SHA-256 no nulo en cada evento de telemetría.
4. **Tolerancia a Fallos IoT (Fail-safe ISO 25010):** Activación automática de electroválvula cuando la humedad cae de 25% y apagado en humedad óptima.
5. **Cobertura de Código:** Cobertura de sentencias y líneas $\ge 97\%$ (Supera el umbral exigido del 85%).

---

## 3. PRUEBAS EN VIVO DE HARDWARE Y TELEMETRÍA IOT

Si el evaluador no dispone del microcontrolador físico ESP32, puede ejecutar el **Simulador CLI** o interactuar desde la propia Web:

### Opción A: Simulador Continuo por Consola
```bash
node iot-firmware/simulator.js
```
El simulador enviará lecturas cíclicas de humedad de suelo y temperatura al backend, reflejándose en tiempo real en la pantalla web.

### Opción B: Panel Interactivo en la Web App
1. Abra `http://localhost:5173`.
2. Diríjase a la pestaña **"IoT y Riego"**.
3. Use los botones **"Simular Suelo Seco (15%)"** o **"Simular Suelo Hidratado (45%)"** y observe la respuesta instantánea del actuador de la electroválvula (`ON` / `OFF`) y el registro en la bitácora con hash SHA-256.

---

## 4. VALIDACIÓN DE REGLAS DE NEGOCIO EN LA WEB (DEMO GUIADA)

1. **Prueba de Bloqueo de Cosecha (RN-01):**
   - Vaya a la pestaña **"Lotes y QR (RN-01)"**.
   - Seleccione el **Lote 1 (Aguacate Hass - `QR-AGROCHAIN-AVO-2026-001`)**.
   - Presione el botón **"Intentar Registrar Cosecha"**.
   - **Resultado Esperado:** El sistema rechaza la cosecha y muestra alerta roja indicando que el lote tiene carencia activa por Fungicida Clorotalonil.
   - Seleccione el **Lote 2 (Café - `QR-AGROCHAIN-COF-2026-002`)** y presione **"Intentar Registrar Cosecha"**.
   - **Resultado Esperado:** El sistema autoriza la cosecha exitosamente al haber superado la fecha de carencia.

2. **Visualización GIS de Parcelas (PostGIS):**
   - Vaya a la pestaña **"Parcelas GIS"**.
   - Observe los polígonos georreferenciados en el mapa interactivo de Sacatepéquez / Antigua Guatemala con sus capas de cultivo.

3. **Auditorías de Inocuidad:**
   - Vaya a la pestaña **"Auditorías Calidad"**.
   - Registre un dictamen para **GLOBALG.A.P.** o **USDA Organic** y compruebe el umbral de aprobación ($\ge 90\%$).

---

## 5. ROLES DE USUARIO PARA EVALUACIÓN (RBAC)

La plataforma cuenta con una pantalla de inicio de sesión productiva con **Botones de Acceso Rápido por Rol** (contraseña para todos: `Password123!`):
- **`ROLE_ADMIN` (Ing. Fredy Martir - `admin@agrochain.gt`):** Administrador técnico con control total de parcelas, telemetría, auditorías y gobernanza.
- **`ROLE_FIELD_OP` (Agr. Esdras Ajanel - `campo@agrochain.gt`):** Operador de campo habilitado para accionar la electroválvula de riego y transmitir telemetría.
- **`ROLE_QA_INSP` (Lic. Daniel Maldonado - `qa@agrochain.gt`):** Inspector de inocuidad habilitado para emitir dictámenes normativos y registrar cosechas bajo la regla RN-01.
- **`ROLE_AUDITOR` (Auditor GlobalGAP - `auditor@certificadora.org`):** Auditor externo con acceso de inspección y verificación de evidencias SHA-256 e ISO 25010 en modo solo lectura.
