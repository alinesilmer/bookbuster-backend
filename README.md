# Bookbuster Backend

Backend API for the Bookbuster library management system built with Node.js, Express.js, Firebase Firestore, and JWT authentication.

# Factories

BookFactory.crear(dto)

Garantiza título, normaliza campos (descripcion, idioma, portada_url, fecha_publicacion).

Usado en: CatalogoService.crearLibro.

BookFactory.normalizarAutores(autores) / normalizarGeneros(generos)

Limpian arrays y quitan entradas vacías.

Usado en: CatalogoService.crearLibro y CatalogoService.actualizarLibro.

LoanFactory.crear({ socio_id, copia_id, fecha_vencimiento })

Setea fecha_inicio, fecha_vencimiento (si falta, +14 días) y estado: ACTIVO.

Usado en: BibliotecaService.prestar.


# Services (Facade)

CatalogoService.crearLibro(dto)

Crea documento base de libro y subcolecciones autores y generos.

CatalogoService.actualizarLibro(id, dto)

Aplica patch al libro y reemplaza autores/géneros si se envían.

BibliotecaService.prestar({ copia_id, socio_id?, fecha_vencimiento?, actor })

Transacción: verifica disponibilidad, crea préstamo vía LoanFactory, marca copia como PRESTADO, incrementa contador del socio.

BibliotecaService.devolver({ prestamo_id, createPenalty?, penalty? })

Transacción: marca DEVUELTO, libera copia, decrementa contador.

Si createPenalty y hay atraso: calcula multa (ver Strategy) y la registra.


# Strategy

FixedByTypePenaltyStrategy

calcular({ tipo }) → obtiene monto desde MULTA_MONTOS.

Usado en: penaltiesController.createPenalty para emitir una multa fija por tipo.


# Adapter + Mailer

MailerAdapter.send(to, subject, html)

Abstrae proveedor de correo. Internamente llama a sendMail de utils/mailer.js.

Usado en:

solicitudesController.approveSolicitud / rejectSolicitud (notificación de resultado).

loanController.createLoan (confirmación de préstamo).


# DTO + Middleware

DTOs: CreateBookDTO, UpdateBookDTO, CreateCopyDTO, UpdateCopyDTO, CreateLoan, ReturnLoan.

validate: procesa resultados de express-validator.

Uso típico en rutas:

router.post("/", authenticate, requireAdmin, CreateBookDTO, validate, createBook)


# Beneficios de este diseño

Separación de responsabilidades: Controllers sencillos; los Services encapsulan reglas/escrituras en DB.

Consistencia: Factories garantizan objetos válidos.

Extensibilidad: Strategy permite cambiar la regla de monto sin tocar el resto.

Portabilidad: Adapter de mail cambia de SMTP a Resend sin modificar controllers.

Mantenibilidad: DTOs y validate estandarizan la validación de entrada.


# Autenticación (cookies)

Login: setea cookie (sesión).

Frontend: usa fetch(..., { credentials: "include" }).

Middleware: authenticate valida cookie y coloca req.user.

Logout: limpia cookie en el servidor.

Ventaja: menos exposición a XSS (httpOnly) y menor manipulación manual de tokens.