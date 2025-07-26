# Migración Básica - ECI IAGen Angular

## Descripción
Este es el resultado de la migración básica de la aplicación ECI IAGen desde vanilla JavaScript a Angular 19. Se han migrado únicamente los componentes esenciales:

### Archivos Migrados

#### 1. **src/index.html**
- Mantiene la estructura HTML básica
- Integra Bootstrap 5.1.3 y Font Awesome 6.0.0
- Configurado para Angular con `<app-root></app-root>`

#### 2. **src/app/services/api.service.ts**
- Migración completa del `api-client.js` original
- Implementa todos los endpoints de la API REST
- Manejo de errores mejorado con RxJS
- Soporte para todas las entidades: usuarios, roles, equipos, clases, asignaciones, entregas, evaluaciones y retroalimentación

#### 3. **src/app/app.component.ts**
- Lógica principal de la aplicación
- Navegación entre secciones
- Carga de datos inicial
- Sistema de notificaciones con toast

#### 4. **src/app/app.component.html**
- Estructura de navegación con sidebar
- Tabla de usuarios funcional
- Placeholders para otras secciones
- Sistema de toast para notificaciones

#### 5. **src/app/app.component.css**
- Estilos específicos del componente principal
- Botón flotante de actualización
- Estilos para navegación y tablas

#### 6. **src/styles.css**
- Estilos globales de la aplicación
- Mejoras para Bootstrap
- Responsive design
- Animaciones y transiciones

## Funcionalidades Implementadas

### ✅ Completadas
- **Navegación**: Sidebar con todas las secciones
- **API Service**: Todos los endpoints migrados
- **Carga de Datos**: Sistema de carga inicial de todos los datos
- **Tabla de Usuarios**: Visualización completa de usuarios
- **Sistema de Notificaciones**: Toast messages
- **Responsive Design**: Adaptable a móviles
- **Loading States**: Indicadores de carga

### 🚧 En Desarrollo (Placeholders)
- Crear/Editar/Eliminar usuarios
- Gestión de roles
- Gestión de equipos
- Gestión de clases
- Gestión de asignaciones
- Gestión de entregas
- Gestión de evaluaciones
- Gestión de retroalimentación
- Importación de Excel

## Estructura de Archivos

```
src/
├── app/
│   ├── services/
│   │   └── api.service.ts          # Servicio API migrado
│   ├── app.component.ts            # Componente principal
│   ├── app.component.html          # Template principal
│   ├── app.component.css           # Estilos del componente
│   ├── app.config.ts              # Configuración de la app
│   └── app.routes.ts               # Configuración de rutas
├── index.html                      # HTML principal
└── styles.css                      # Estilos globales
```

## Cómo Ejecutar

1. **Instalar dependencias**:
   ```bash
   npm install
   ```

2. **Ejecutar en desarrollo**:
   ```bash
   ng serve
   ```

3. **Acceder a la aplicación**:
   - URL: http://localhost:4200
   - El backend debe estar ejecutándose en http://localhost:8080

## Dependencias Principales
- Angular 19.2.0
- Bootstrap 5.3.7
- Font Awesome 6.0.0
- RxJS 7.8.0

## Próximos Pasos

Para completar la migración:

1. **Crear componentes individuales** para cada sección (usuarios, roles, equipos, etc.)
2. **Implementar modales** para CRUD operations
3. **Añadir formularios reactivos** para creación/edición
4. **Implementar importación de Excel**
5. **Añadir routing** para navegación por URL
6. **Añadir guards** para protección de rutas
7. **Implementar estado global** (NgRx o servicios)
8. **Añadir tests unitarios**

## Notas Técnicas

- Se mantiene la misma estructura de datos que el backend
- Compatible con el API REST existente
- Diseño responsive usando Bootstrap
- Manejo de errores mejorado
- Typescript para mejor tipado y desarrollo

## Comando de Desarrollo

Para trabajar en desarrollo con recarga automática:
```bash
ng serve --open
```

Esto abrirá automáticamente el navegador en http://localhost:4200
