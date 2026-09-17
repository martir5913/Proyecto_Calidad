# AgroChain ERP — Guía de Instalación, Requisitos y Despliegue

Este documento detalla los requisitos previos del sistema, los métodos de despliegue (mediante contenedores Docker o ejecución local en desarrollo) y los procedimientos para verificar el funcionamiento integral de **AgroChain ERP**.

---

## 1. Requisitos Previos del Sistema

### 1.1. Requisitos de Hardware

| Componente | Requisito Mínimo | Requisito Recomendado |
| :--- | :--- | :--- |
| **Procesador (CPU)** | 2 Núcleos (x86_64 o ARM64) | 4 Núcleos o superior |
| **Memoria RAM** | 4 GB | 8 GB o superior |
| **Almacenamiento** | 5 GB de espacio libre en disco | 10 GB SSD |
| **Conectividad** | Conexión a Internet (descarga de imágenes/paquetes) | Red local Wi-Fi 2.4 GHz (para ESP32 físico) |

### 1.2. Requisitos de Software

* **Sistema Operativo:** Windows 10/11 (con WSL2 habilitado), macOS (Intel/Apple Silicon) o Linux (Ubuntu 22.04 LTS / Debian 12 / Fedora).
* **Motor de Contenedores (Método Recomendado):**
  * [Docker Desktop](https://www.docker.com/products/docker-desktop/) (v24.0 o superior) con **Docker Compose v2+**.
* **Entorno de Desarrollo Local (Solo si se ejecuta sin Docker):**
  * [Node.js](https://nodejs.org/) v20.x o v22.x LTS.
  * [npm](https://www.npmjs.com/) v10.x o superior.
  * [PostgreSQL](https://www.postgresql.org/) v16 con extensión espacial **PostGIS 3.4**.
* **Entorno para Hardware IoT Físico (Opcional):**
  * [Arduino IDE 2.x](https://www.arduino.cc/en/software) con el paquete de tarjetas `esp32` por Espressif Systems.
  * Controladores USB-UART según la placa (`CP210x` o `CH340`).

---

## 2. Puertos de Red Utilizados

Asegúrese de que los siguientes puertos locales se encuentren disponibles antes de iniciar los servicios:

| Servicio | Puerto Local | Descripción |
| :--- | :--- | :--- |
| **agrochain-frontend** | `5173` | Portal Web SPA (React + Vite / Nginx) |
| **agrochain-backend** | `3000` | REST API Server (Node.js + Express + TypeScript) |
| **agrochain-db** | `5432` | Motor de Base de Datos PostgreSQL 16 + PostGIS |

---

## 3. Método 1: Despliegue Rápido con Docker (Recomendado)

Este método compila, inicializa y enlaza automáticamente la base de datos espacial con sus esquemas, el backend API y la aplicación web frontend.

### Paso 1: Clonar o abrir el directorio del proyecto
Abra una terminal (PowerShell, Bash o Zsh) en la raíz del repositorio:
```bash
cd c:/Users/fmartir/Downloads/Proyecto_Calidad
```

### Paso 2: Construir e iniciar los contenedores
Ejecute el siguiente comando:
```bash
docker compose up --build
```
> **Nota:** Si desea ejecutar los contenedores en segundo plano (modo demonio), añada la bandera `-d`:
> ```bash
> docker compose up --build -d
> ```

### Paso 3: Verificar el estado de los contenedores
```bash
docker ps
```
Debe observar 3 contenedores con estado `Up` o `healthy`:
* `agrochain-db` (puerto `0.0.0.0:5432->5432/tcp`)
* `agrochain-backend` (puerto `0.0.0.0:3000->3000/tcp`)
* `agrochain-frontend` (puerto `0.0.0.0:5173->80/tcp`)

### Paso 4: Acceder a las interfaces
* **Portal Web:** [http://localhost:5173](http://localhost:5173)
* **API Health Check:** [http://localhost:3000/api/v1/health](http://localhost:3000/api/v1/health)

---

## 4. Método 2: Despliegue Manual / Entorno de Desarrollo (Bare-Metal)

Si prefiere ejecutar el código directamente en su máquina sin Docker:

### 4.1. Configuración de la Base de Datos
1. Inicie su instancia local de PostgreSQL 16.
2. Cree la base de datos `agrochain`:
   ```sql
   CREATE DATABASE agrochain;
   ```
3. Ejecute los scripts SQL en orden:
   ```bash
   psql -U postgres -d agrochain -f backend/sql/01_schema.sql
   psql -U postgres -d agrochain -f backend/sql/02_seed.sql
   ```

### 4.2. Configuración y Ejecución del Backend
1. Navegue al directorio del backend e instale dependencias:
   ```bash
   cd backend
   npm install
   ```
2. Configure las variables de entorno creando un archivo `.env` en `backend/.env`:
   ```env
   PORT=3000
   DB_HOST=localhost
   DB_PORT=5432
   DB_USER=postgres
   DB_PASSWORD=postgrespassword
   DB_NAME=agrochain
   JWT_SECRET=agrochain-super-secret-production-key-2026
   ```
3. Inicie el servidor en modo desarrollo:
   ```bash
   npm run dev
   ```
   *El servidor quedará escuchando en `http://localhost:3000`.*

### 4.3. Configuración y Ejecución del Frontend
1. En otra terminal, navegue al directorio del frontend e instale dependencias:
   ```bash
   cd frontend
   npm install
   ```
2. Inicie el servidor de desarrollo Vite:
   ```bash
   npm run dev
   ```
   *El portal estará accesible en `http://localhost:5173`.*

---

## 5. Credenciales de Acceso al Sistema (RBAC)

Para iniciar sesión en el portal ([http://localhost:5173](http://localhost:5173)), utilice cualquiera de las siguientes cuentas preconfiguradas:

| Rol del Usuario | Correo Electrónico | Contraseña | Alcance de Permisos |
| :--- | :--- | :--- | :--- |
| **Administrador General** | `admin@agrochain.gt` | `Password123!` | Acceso irrestricto, edición GIS, control de válvulas, auditoría. |
| **Operador de Campo** | `campo@agrochain.gt` | `Password123!` | Registro de lotes, recolección y control IoT de riego. |
| **Inspector de Calidad (QA)** | `qa@agrochain.gt` | `Password123!` | Validación de carencia (RN-01), emisión de auditorías y certificados. |
| **Auditor Externo** | `auditor@certificadora.org` | `Password123!` | Auditorías de cumplimiento GLOBALG.A.P. / USDA Organic. |

*(La pantalla de Login incluye botones de acceso rápido para cargar estas credenciales con un solo clic).*

---

## 6. Puesta en Marcha del Subsistema IoT (ESP32)

### Opción A: Simulador de Telemetría Software (Node.js)
Para simular el flujo continuo de lecturas del ESP32 con firma criptográfica HMAC-SHA256:
```bash
node iot-firmware/simulator.js
```
El script enviará paquetes de telemetría cada 5 segundos al backend y reflejará los datos en tiempo real en la vista **Monitoreo IoT & Riego**.

### Opción B: Dispositivo Físico ESP32
1. Conecte el microcontrolador ESP32 mediante cable Micro-USB/USB-C a su computadora.
2. Abra el archivo `iot-firmware/AgroChain_ESP32_Firmware.ino` en **Arduino IDE**.
3. Edite las credenciales de red y la IP del servidor en el archivo:
   ```cpp
   const char* ssid = "SU_RED_WIFI";
   const char* password = "SU_PASSWORD_WIFI";
   const char* serverUrl = "http://IP_DE_SU_PC:3000/api/v1/iot/telemetry";
   ```
4. Seleccione la placa **ESP32 Dev Module** y el puerto COM correspondiente.
5. Compile y cargue el firmware.
6. Abra el Monitor Serie a `115200 baudios` para verificar la transmisión de telemetría.

---

## 7. Ejecución de Pruebas Automatizadas (ISO/IEC/IEEE 29119)

Para validar la integridad de las reglas de negocio y los contratos de la API:

1. Ingrese a la carpeta `backend/`:
   ```bash
   cd backend
   npm test
   ```
2. Para ejecutar las pruebas con reporte de cobertura de código:
   ```bash
   npm run test:coverage
   ```
   *Criterio de aprobación: $\ge 85\%$ de cobertura en sentencias, funciones y ramas de lógica.*

---

## 8. Comandos de Gestión y Mantenimiento

* **Detener los contenedores conservando los datos:**
  ```bash
  docker compose stop
  ```
* **Detener y eliminar contenedores:**
  ```bash
  docker compose down
  ```
* **Reinicio limpio completo (eliminando volúmenes de base de datos para recargar semillas):**
  ```bash
  docker compose down -v
  docker compose up --build
  ```
* **Ver logs en tiempo real del backend:**
  ```bash
  docker logs -f agrochain-backend
  ```

---

## 9. Preguntas Frecuentes y Solución de Problemas (Troubleshooting)

1. **Error: `Port 5432 is already in use`**
   * *Causa:* Tiene un servicio local de PostgreSQL ejecutándose en su equipo.
   * *Solución:* Detenga el servicio local de PostgreSQL (`Stop-Service postgresql*` en PowerShell o desde `services.msc`), o modifique el mapeo de puertos en `docker-compose.yml` a `"5433:5432"`.

2. **El Frontend muestra error de conexión con la API**
   * *Verificación:* Ingrese a `http://localhost:3000/api/v1/health`. Si no responde, revise los logs del backend con `docker logs agrochain-backend`.

3. **El ESP32 no conecta con la API**
   * *Causa:* El ESP32 no puede resolver `localhost`.
   * *Solución:* Asegúrese de colocar la dirección IP local de su computadora (ej. `192.168.1.50`) en lugar de `localhost` en el firmware del ESP32.
