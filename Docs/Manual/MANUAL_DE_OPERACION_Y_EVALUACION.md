# MANUAL INTEGRAL DE OPERACIÓN, EVALUACIÓN Y PRUEBAS: AGROCHAIN ERP

**Proyecto:** AgroChain ERP — Plataforma de Trazabilidad Fitosanitaria, Certificación de Inocuidad y Riego Inteligente IoT  
**Entidad:** AgroTrace Tech, S.A.  
**Asignatura:** Aseguramiento de la Calidad del Software — Universidad Mariano Gálvez de Guatemala (UMG)  
**Estándares de Calidad:** ISO/IEC 25010 (Calidad del Producto de Software) e ISO/IEC/IEEE 29119 (Proceso y Estrategia de Pruebas)

---

## TABLA DE CONTENIDOS
1. [Visión General y Arquitectura del Sistema](#1-visión-general-y-arquitectura-del-sistema)
2. [Despliegue y Puesta en Marcha en 1 Solo Paso](#2-despliegue-y-puesta-en-marcha-en-1-solo-paso)
3. [Manual de Usuario: Detalle y Funcionamiento Vista por Vista](#3-manual-de-usuario-detalle-y-funcionamiento-vista-por-vista)
4. [Control de Acceso Basado en Roles (RBAC)](#4-control-de-acceso-basado-en-roles-rbac)
5. [Guía de Funcionamiento y Conexión del Microcontrolador ESP32](#5-guía-de-funcionamiento-y-conexión-del-microcontrolador-esp32)
6. [Guion de Demostración para Evaluación Docente](#6-guion-de-demostración-para-evaluación-docente)
7. [Suite de Pruebas Automatizadas y Aseguramiento de Calidad (ISO 29119 / ISO 25010)](#7-suite-de-pruebas-automatizadas-y-aseguramiento-de-calidad-iso-29119--iso-25010)

---

## 1. VISIÓN GENERAL Y ARQUITECTURA DEL SISTEMA

AgroChain ERP es una plataforma de grado agroexportador diseñada para garantizar la **inocuidad alimentaria**, la **trazabilidad de la cadena de custodia** y la **automatización del riego agrícola** en fincas productivas de Guatemala (con datos semilla ubicados en Sacatepéquez y Antigua Guatemala).

### Arquitectura de Software: MVC + N-Capas
El sistema implementa una separación estricta de responsabilidades para cumplir con los atributos de *Mantenibilidad* y *Modificabilidad* de la norma **ISO/IEC 25010**:

```
+-------------------------------------------------------------------------------+
|                             CAPA DE PRESENTACIÓN                              |
|   Single Page Application (React 18 + TypeScript + Vite + Leaflet Maps)       |
+---------------------------------------+---------------------------------------+
                                        | HTTP / JSON REST
+---------------------------------------v---------------------------------------+
|                              CAPA CONTROLADORA                                |
|   Express Controllers (Validación de Esquemas, Manejo de Códigos de Estado)   |
+---------------------------------------+---------------------------------------+
                                        |
+---------------------------------------v---------------------------------------+
|                            CAPA DE SERVICIOS                                  |
|   Reglas de Negocio Puras: RN-01 (Carencias), RN-05 (QR), RN-06 (SHA-256)     |
+---------------------------------------+---------------------------------------+
                                        |
+---------------------------------------v---------------------------------------+
|                           CAPA DE REPOSITORIOS                                |
|   Abstracción de Persistencia y Consultas Geoespaciales PostGIS               |
+---------------------------------------+---------------------------------------+
                                        | SQL Nativo
+---------------------------------------v---------------------------------------+
|                             BASE DE DATOS                                     |
|   PostgreSQL 16 + Extensión Espacial PostGIS 3.4 (Indexación GIST, WGS84)     |
+-------------------------------------------------------------------------------+
```

---

## 2. DESPLIEGUE Y PUESTA EN MARCHA EN 1 SOLO PASO

Todo el ecosistema se encuentra 100% contenerizado bajo **Docker Compose**, asegurando reproducibilidad inmediata en cualquier máquina (Windows, Linux o macOS):

```bash
docker compose up --build
```

### Servicios y Puertos Disponibles:
* **Portal Web Frontend (SPA):** `http://localhost:5173`
* **API REST Backend (Node.js 22 LTS):** `http://localhost:3000/api/v1/health`
* **Base de Datos Espacial (PostgreSQL 16 + PostGIS):** `localhost:5432`  
  *(Usuario: `postgres`, Contraseña: `postgrespassword`, Base de Datos: `agrochain`)*

---

## 3. MANUAL DE USUARIO: DETALLE Y FUNCIONAMIENTO VISTA POR VISTA

### A. Pantalla de Inicio de Sesión (`LoginView`)
* **Propósito:** Autenticación formal con emisión de tokens criptográficos **JWT** válidos por 8 horas.
* **Elementos en Pantalla:**
  * Formulario estándar con validación de correo y contraseña.
  * **Panel de Accesos Rápidos por Rol:** 4 tarjetas que permiten iniciar sesión con 1 solo clic en cualquiera de los roles del sistema con la contraseña universal `Password123!`.

---

### B. Vista 1: Tablero General (`Dashboard`)
* **Propósito:** Centro de comando agronómico para supervisar el estado fitosanitario, métricas en tiempo real y alertas críticas.
* **Componentes Principales:**
  1. **Banner de Alerta Fitosanitaria (Regla RN-01):** Informa de forma destacada si existen lotes con aplicaciones químicas activas dentro del período de carencia (ej. Lote de Aguacate Hass con 12 días restantes de restricción por *Fungicida Clorotalonil*).
  2. **4 Tarjetas de Métricas (KPIs):**
     * *Área Monitoreada:* Superficie total calculada dinámicamente mediante funciones espaciales de PostGIS ($31.25\text{ Ha}$).
     * *Humedad de Suelo:* Lectura actual transmitida por el sensor ($21.2\%$), indicando estado de sequía o hidratación óptima.
     * *Electroválvula Sector 01:* Estado del actuador de riego (`ON` - Regando / `OFF` - En Espera).
     * *Conformidad GLOBALG.A.P.:* Promedio ponderado de auditorías vigentes ($96.5\%$).
  3. **Tabla de Parcelas Productivas:** Resumen de código, sector, cultivo, área y sistema de riego.
  4. **Panel de Acciones Rápidas:** Botón para activar riego manual de emergencia (restringido a Administradores y Operadores de Campo) y acceso directo a la telemetría.

---

### C. Vista 2: Parcelas y Delimitación Geoespacial (`Parcelas GIS`)
* **Propósito:** Gestión cartográfica y delimitación de linderos topológicos con almacenamiento espacial nativo.
* **Componentes Principales:**
  1. **Mapa Satelital / Topográfico Interactivo (Leaflet):** Proyecta los polígonos de Sacatepéquez (`GEOMETRY(Polygon, 4326)`). Al hacer clic en un polígono se despliega el popup con el cultivo, código y área calculada.
  2. **Lista de Parcelas Registradas:** Fichas técnicas con el detalle de superficie y sistema de riego automatizado.
  3. **Modal "Registrar / Modificar Parcela en PostGIS":** Botón en la esquina superior derecha que permite ingresar una nueva parcela o editar coordenadas en formato WKT (*Well-Known Text*), validando el no solapamiento y registrándola de inmediato en el mapa.

---

### D. Vista 3: Expediente Digital de Lotes y Trazabilidad QR (`Lotes y QR (RN-01)`)
* **Propósito:** Demostración y evaluación de la regla fitosanitaria **RN-01** y resolución del expediente de trazabilidad en tiempo real (**RN-05**).
* **Componentes Principales:**
  1. **Selector de Casos de Estudio:**
     * **Lote 1 (Aguacate Hass - `QR-AGROCHAIN-AVO-2026-001`):** Estado *BLOQUEADO_CARENCIA* debido a una aplicación reciente de *Fungicida Clorotalonil* (14 días de carencia requeridos, 12 restantes).
     * **Lote 2 (Café Arábica - `QR-AGROCHAIN-COF-2026-002`):** Estado *LIBERADO_COSECHA* con tratamiento de *Extracto de Neem* cuyo período de carencia ya expiró.
  2. **Simulador Transaccional de Cosecha:**
     * Al presionar *"Intentar Registrar Cosecha"* en el **Lote 1**, el motor de reglas **rechaza la transacción con alerta roja**, protegiendo la inocuidad agroexportadora.
     * Al presionar en el **Lote 2**, el motor **autoriza la cosecha con mensaje de éxito verde**.
  3. **Historial de Insumos Fitosanitarios:** Registro de agroquímicos aplicados, ingrediente activo, dosis, fecha de aplicación y responsable.

---

### E. Vista 4: Monitoreo IoT y Control de Riego (`IoT y Riego`)
* **Propósito:** Supervisión de variables físicas, telemetría y verificación de la integridad criptográfica de la evidencia (**RN-06**).
* **Componentes Principales:**
  1. **Indicadores en Vivo:** Tacómetro de Humedad de Suelo con barra porcentual dinámica, sensor de Temperatura Ambiental y estado de la Electroválvula.
  2. **Simulador de Sensor ESP32 para Evaluación Externa:** Permite enviar lecturas arbitrarias al backend o utilizar los botones de prueba rápida:
     * *Suelo Seco (15%):* El backend procesa la sequía y conmuta la válvula a `ON`.
     * *Suelo Óptimo (45%):* El backend detecta la recuperación hídrica y conmuta la válvula a `OFF`.
  3. **Bitácora Criptográfica Inmutable (RN-06):** Tabla que registra cada evento de campo con su firma digital **SHA-256** calculada por el backend, garantizando el no repudio de la evidencia ante auditorías internacionales.

---

### F. Vista 5: Auditorías de Calidad e Inocuidad (`Auditorías Calidad`)
* **Propósito:** Evaluación de protocolos normativos agroexportadores (**GLOBALG.A.P. IFA** y **USDA Organic**).
* **Componentes Principales:**
  1. **Formulario de Registro de Dictámenes:** Permite al Inspector o Auditor seleccionar la normativa, ajustar el puntaje de conformidad (umbral de aprobación: $\ge 90\%$) e ingresar observaciones técnicas.
  2. **Historial de Dictámenes:** Tabla de inspecciones con dictámenes *Conforme Aprobado* o *No Conforme*.

---

### G. Barra Superior (Navbar) y Pie de Página (Footer)
* **Navbar:** Muestra el logo corporativo de AgroTrace Tech, botón de navegación entre vistas, botón de acceso a la **Matriz ISO 25010 / 29119**, el nombre del usuario activo con su avatar y el botón de **Cerrar Sesión**.
* **Footer:** Muestra de forma fija la **sesión activa** junto a la insignia coloreada de su **Rol Oficial (RBAC)** y los estándares de calidad que respaldan la plataforma.

---

## 4. CONTROL DE ACCESO BASADO EN ROLES (RBAC)

La plataforma aplica permisos estrictos tanto en la interfaz de usuario como en los endpoints del Backend (`requireRoles` middleware):

| Rol | Usuario Demo | Permisos en la Plataforma |
| :--- | :--- | :--- |
| **`ROLE_ADMIN`** (Administrador General) | `admin@agrochain.gt` | Control total: riego manual, creación de parcelas PostGIS, cosechas, auditorías y gobernanza. |
| **`ROLE_FIELD_OP`** (Operador de Campo) | `campo@agrochain.gt` | Operación de campo: riego manual de emergencia, simulación de telemetría y consulta de parcelas. *Emisión de dictámenes normativos restringida.* |
| **`ROLE_QA_INSP`** (Inspector de Calidad) | `qa@agrochain.gt` | Control de inocuidad: evaluación de carencia RN-01, registro de cosechas y emisión de dictámenes de auditoría. *Accionamiento manual de válvulas restringido.* |
| **`ROLE_AUDITOR`** (Auditor Externo) | `auditor@certificadora.org` | Modo solo lectura: inspección de firmas SHA-256, verificación de trazabilidad QR e ISO 25010. |

*Contraseña para todos los usuarios:* `Password123!`

---

## 5. GUÍA DE FUNCIONAMIENTO Y CONEXIÓN DEL MICROCONTROLADOR ESP32

El firmware listo para compilar se encuentra en el archivo [AgroChain_ESP32_Firmware.ino](file:///c:/Users/fmartir/Downloads/Proyecto_Calidad/iot-firmware/AgroChain_ESP32_Firmware.ino).

```
                      DIAGRAMA DE CONEXIÓN DEL ESP32
                   +----------------------------------+
                   |          ESP32 DevKit v1         |
                   |                                  |
Sensor Humedad ADC | GPIO 34 (ADC1)                   |
Sensor Temp DHT22  | GPIO 4  (Digital)                |
Relé Válvula 5V    | GPIO 26 (Digital Output)         |
Alimentación       | 3.3V / 5V                        |
Tierra             | GND                              |
                   +----------------------------------+
```

### Configuración del Firmware:
1. Abra `AgroChain_ESP32_Firmware.ino` en **Arduino IDE** o **PlatformIO**.
2. Configure sus credenciales de red Wi-Fi:
   ```cpp
   const char* ssid = "NOMBRE_DE_TU_RED";
   const char* password = "PASSWORD_DE_TU_RED";
   const char* serverEndpoint = "http://192.168.1.50:3000/api/v1/iot/telemetry"; // IP de la PC
   ```
3. Suba el código al ESP32 con una velocidad de `115200` baudios.

### Lógica Autónoma Fail-Safe (Confiabilidad ISO 25010):
Si se interrumpe la conexión Wi-Fi o el backend no responde, el ESP32 **no se bloquea**: su microcontrolador evalúa localmente la lectura analógica. Si detecta sequía ($< 25\%$), conmuta automáticamente el pin `GPIO 26` a nivel alto para abrir la electroválvula, previniendo estrés hídrico en el cultivo.

### Simulación sin Hardware Físico:
Si no se dispone de un ESP32 en el momento de la evaluación:
* **Opción Web:** Utilice el panel de simulación en la pestaña *"IoT y Riego"*.
* **Opción Consola:** Ejecute el script standalone:
  ```bash
  node iot-firmware/simulator.js
  ```

---

## 6. GUION DE DEMOSTRACIÓN PARA EVALUACIÓN DOCENTE

Para realizar una presentación guiada del proyecto a catedráticos o evaluadores externos:

1. **Paso 1: Inicio de Sesión y Matriz RBAC**
   * Acceda a `http://localhost:5173`.
   * Presione **"Agr. Esdras Ajanel (Operador Campo)"**.
   * Navegue a *Auditorías Calidad*: observe que el sistema restringe el formulario de auditoría para este rol.
   * Cierre sesión e ingrese como **"Lic. Daniel Maldonado (Inspector Calidad)"** para comprobar la habilitación del módulo de auditorías.

2. **Paso 2: Comprobación de la Regla de Carencia Fitosanitaria (RN-01)**
   * Diríjase a la pestaña **"Lotes y QR (RN-01)"**.
   * Seleccione el **Lote 1 (Aguacate)** y presione *"Intentar Registrar Cosecha"*. Muestre cómo el sistema bloquea la transacción informando los 12 días restantes de carencia.
   * Seleccione el **Lote 2 (Café)** y presione *"Intentar Registrar Cosecha"*. Muestre cómo el sistema autoriza la cosecha.

3. **Paso 3: Telemetría IoT y Cripto-Evidencia (RN-06)**
   * Diríjase a la pestaña **"IoT y Riego"**.
   * Presione *"Suelo Seco (15%)"*: observe cómo el tacómetro se actualiza en rojo, la válvula pasa a estado `ON` y se genera una nueva fila en la bitácora con su hash **SHA-256**.
   * Presione *"Suelo Óptimo (45%)"*: observe la recuperación a estado hidratado y cierre de válvula `OFF`.

4. **Paso 4: Delimitación Geoespacial PostGIS**
   * Diríjase a la pestaña **"Parcelas GIS"**.
   * Muestre los polígonos en el mapa de Sacatepéquez.
   * Presione *"Registrar / Modificar Parcela"* y guarde un polígono para demostrar la integración espacial con PostGIS.

5. **Paso 5: Respaldo Normativo ISO**
   * Presione el botón **`ISO 25010 / 29119`** en la barra superior y exponga la matriz formal de calidad y pruebas.

---

## 7. SUITE DE PRUEBAS AUTOMATIZADAS Y ASEGURAMIENTO DE CALIDAD (ISO 29119 / ISO 25010)

La plataforma cuenta con una suite de pruebas automatizadas estructuradas bajo el estándar **ISO/IEC/IEEE 29119**:

### Ejecución de Pruebas:
```bash
# Desde la carpeta backend:
cd backend
npm test

# O mediante contenedor Docker:
docker compose run --rm backend npm test
```

### Resultados y Cobertura Verificada:
* **Suites de Pruebas:** 8 Suites ejecutadas con **100% de éxito** (68 pruebas pasando, 0 fallos).
* **Cobertura de Código Lograda:**
  * **Sentencias (Statements):** $97.25\%$ (Umbral normativo: $\ge 85\%$)
  * **Líneas (Lines):** $97.72\%$
  * **Funciones (Functions):** $100.00\%$
* **Mapeo con ISO/IEC 25010:**
  * *Adecuación Funcional:* Pruebas unitarias de las reglas RN-01 a RN-06.
  * *Confiabilidad y Tolerancia a Fallos:* Pruebas de lógica fail-safe y reconexión IoT.
  * *Seguridad y Confidencialidad:* Pruebas de autenticación JWT y control de acceso RBAC.
  * *Eficiencia de Desempeño:* Resolución de expedientes QR en $\le 1.5\text{ s}$.
