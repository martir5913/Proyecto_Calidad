# AgroChain ERP — Plataforma de Trazabilidad Agrícola e IoT

Sistema empresarial integral para la gestión de trazabilidad agrícola, control automatizado de riego con microcontroladores ESP32, delimitación espacial de parcelas con PostGIS y auditorías normativas de calidad (GLOBALG.A.P. y USDA Organic). Desarrollado bajo estándares de calidad de software **ISO/IEC 25010** y probado conforme a **ISO/IEC/IEEE 29119**.

---

## Inicio Rápido (Docker)

Para poner en marcha todo el ecosistema (Base de datos PostGIS + Backend REST API + Frontend SPA):

```bash
docker compose up --build
```

* **Portal Web:** [http://localhost:5173](http://localhost:5173)
* **API REST Backend:** [http://localhost:3000/api/v1/health](http://localhost:3000/api/v1/health)
* **Credenciales de Acceso:**
  * Administrador: `admin@agrochain.gt` / `Password123!`
  * Operador de Campo: `campo@agrochain.gt` / `Password123!`
  * Inspector QA: `qa@agrochain.gt` / `Password123!`
  * Auditor Externo: `auditor@certificadora.org` / `Password123!`

---

## Despliegue en la Nube (Microsoft Azure)

El sistema se encuentra desplegado y operativo en una Máquina Virtual en **Microsoft Azure**:

* **Portal Web (HTTPS Seguro):** [https://agrochain.westus2.cloudapp.azure.com](https://agrochain.westus2.cloudapp.azure.com)
* **API REST Health Check:** [https://agrochain.westus2.cloudapp.azure.com/api/v1/health](https://agrochain.westus2.cloudapp.azure.com/api/v1/health)
* **IP Pública:** `20.51.105.80`

### Acceso y Administración SSH
Para administrar los servicios en la máquina virtual:
```bash
ssh -i SSH_umg.pem azureuser@20.51.105.80
```

### Configuración de Red y Seguridad
* **Puerto 80 (HTTP):** Abierto en Azure NSG. Nginx redirige automáticamente todo el tráfico con estado `301` hacia HTTPS.
* **Puerto 443 (HTTPS):** Certificado SSL válido emitido por **Let's Encrypt** (ECDSA). Nginx opera como Reverse Proxy sirviendo el Frontend SPA y derivando internamente `/api/` hacia el contenedor del Backend en `backend:3000`.
* **Puerto 22 (SSH):** Acceso seguro para administración de la instancia mediante llave privada PEM.
* **Túnel SSH Alternativo (para pruebas locales):**
  ```bash
  ssh -i SSH_umg.pem -L 5173:localhost:80 -L 3000:localhost:3000 azureuser@20.51.105.80
  ```

---

## Estructura de Documentación (`Docs/`)

La documentación completa del proyecto se encuentra organizada en la carpeta [`Docs/`](Docs/):

* **[Guía de Instalación, Requisitos y Despliegue](Docs/Manual/GUIA_DE_INSTALACION_Y_DESPLIEGUE.md):** Requisitos de sistema, puertos, despliegue con Docker y bare-metal, troubleshooting.
* **[Manual de Operación, IoT y Evaluación](Docs/Manual/MANUAL_DE_OPERACION_Y_EVALUACION.md):** Guía vista por vista, configuración hardware/firmware de ESP32, simulador IoT, guion de demostración y pruebas.
* **[Guía Rápida para el Evaluador](Docs/Evaluacion/GUIA_EVALUADOR.md):** Pasos de prueba express para evaluadores externos y docentes.
* **[Especificación Técnica y Reglas de Negocio](Docs/Especificacion/Contexto.md):** Arquitectura, modelo de datos, normas ISO y reglas RN-01 a RN-06.
* **[Documento Académico](Docs/Academico/Primer%20Entragable%20Proyecto%20-%20Documento%20Escrito.md):** Documento formal de entrega académica y marco metodológico.

---

## Estructura del Código Fuente

* `backend/`: API REST construida con Node.js 22 LTS, Express, TypeScript, arquitectura MVC N-Capas, suites de prueba Jest y scripts SQL PostgreSQL/PostGIS.
* `frontend/`: Aplicación SPA reactiva construida con React 18, Vite, Bootstrap 5, Leaflet (Mapas GIS) e iconos Lucide.
* `iot-firmware/`: Firmware Arduino C++ para ESP32 (`AgroChain_ESP32_Firmware.ino`) y simulador en Node.js (`simulator.js`).
