# BioMed AI — Sistema de Gestión Biomédica

> SaaS de gestión de equipos médicos con inteligencia artificial para IPS colombianas.

![Next.js](https://img.shields.io/badge/Next.js-14-black)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue)
![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL-green)
![Tailwind](https://img.shields.io/badge/Tailwind-CSS-cyan)

---

## 📋 Descripción

BioMed AI es una plataforma SaaS multi-tenant para la gestión integral de tecnología biomédica en instituciones de salud colombianas. Cumple con la normativa de la **Resolución 4816/2008**, **Resolución 3100/2019** e **INVIMA**.

---

## 🏗️ Arquitectura
| Rol | Acceso |
|-----|--------|
| **Super Admin** | Todo el sistema + panel de control de empresas |
| **Admin IPS** | Todos los módulos de su institución |
| **Supervisor** | Mantenimiento, órdenes, KPIs, reportes |
| **Técnico** | Órdenes de trabajo, inventario (solo lectura) |

---

## 🗄️ Base de datos (Supabase / PostgreSQL)

### Tablas principales

| Tabla | Descripción |
|-------|-------------|
| `instituciones` | Empresas clientes con plan, código y módulos activos |
| `planes` | Planes de suscripción (Básico, Profesional, Enterprise) |
| `usuarios` | Usuarios por institución con roles |
| `equipos` | Inventario de equipos biomédicos |
| `mantenimientos` | Historial de intervenciones |
| `repuestos` | Inventario de repuestos |
| `repuesto_equipo` | Relación repuesto ↔ equipo |
| `repuesto_movimientos` | Trazabilidad de stock |
| `acceso_logs` | Auditoría de accesos |

---

## 🔌 API Routes
---

## ⚙️ Variables de entorno

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
ANTHROPIC_API_KEY=sk-ant-...
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

---

## 🛠️ Instalación y desarrollo

```bash
# 1. Clonar el repositorio
git clone https://github.com/biodesicion-svg/biomedai-app.git
cd biomedai-app

# 2. Instalar dependencias
npm install

# 3. Configurar variables de entorno
cp .env.example .env.local
# Editar .env.local con tus credenciales

# 4. Correr en desarrollo
npm run dev

# 5. Abrir en el navegador
# http://localhost:3000
```

---

## 📐 Stack tecnológico

| Capa | Tecnología |
|------|-----------|
| Frontend | Next.js 14 (App Router) + TypeScript |
| Estilos | Tailwind CSS + CSS inline |
| Base de datos | Supabase (PostgreSQL) |
| Autenticación | Supabase Auth (próximamente) |
| IA | Anthropic Claude (protocolos y asistente) |
| Deploy | Vercel (recomendado) |
| Iconos | Tabler Icons |

---

## 📋 Normativa colombiana implementada

- **Resolución 4816/2008** — Programa Nacional de Tecnovigilancia
- **Resolución 3100/2019** — Habilitación de servicios de salud
- **Decreto 4725/2005** — Dispositivos médicos
- **NTC ISO/IEC 17025** — Calibración y metrología
- **IEC 60601** — Seguridad de equipos electromédicos
- **Circulares Supersalud** — Reporte de incidentes

---

## 🗺️ Roadmap

### v0.1 ✅ (actual)
- [x] Multi-tenant con códigos de activación
- [x] 10 módulos operativos
- [x] 1,438 equipos reales cargados
- [x] Panel super admin
- [x] Predicción de fallas con IA

### v0.2 (próximo)
- [ ] Login con Supabase Auth
- [ ] Deploy en Vercel
- [ ] Integración con API Fracttal
- [ ] App móvil para técnicos
- [ ] Módulo de diagnóstico de vida útil

### v0.3
- [ ] Webhooks para ERP
- [ ] Documentación Swagger/OpenAPI
- [ ] Dashboard ejecutivo exportable a PDF
- [ ] Módulo de habilitaciones MSPS

---

## 📞 Contacto

**BioMed AI** — admin@biomedai.co  
Desarrollado para el ecosistema de salud colombiano 🇨🇴

---

*Última actualización: Mayo 2025*
