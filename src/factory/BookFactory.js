export class BookFactory {
  //FACTORY DE CREACIÓN DE LIBROS: valida los campos necesarios para crear un libro
  static crear({ titulo, descripcion, idioma, portada_url, fecha_publicacion }) {
    const t = String(titulo || "").trim();
    if (!t) throw new Error("Título requerido");
    return {
      titulo: t,
      descripcion: descripcion ?? null,
      idioma: idioma ?? null,
      portada_url: portada_url || null,
      fecha_publicacion: fecha_publicacion || null,
    };
  }

  static normalizarAutores(autores = []) {
    return (Array.isArray(autores) ? autores : [])
      .map(a => ({ nombre: String(a?.nombre || "").trim() }))
      .filter(a => a.nombre.length > 0);
  }

  static normalizarGeneros(generos = []) {
    return (Array.isArray(generos) ? generos : [])
      .map(g => ({ nombre: String(g?.nombre || "").trim() }))
      .filter(g => g.nombre.length > 0);
  }
}
