const express = require('express');
const router = express.Router();
const { sql, config } = require('./db');

router.get('/tarjeton/:id', async (req, res) => {
  const { id } = req.params;

  const query = `
    SELECT 
      ta.idEstatusTarjeton,
      ta.idMunicipioTarjeton,
      ta.idTipoTarjeton,
      ta.idModalidadTarjeton,
      ta.idTarjeton,
      ta.idOperador,
      ta.fechaEmision,
      ta.fechaVencimiento,
      ta.folioOperador,
      ta.folioPago,
      ta.idtipoImpresion,
      ti.descripcion AS tipoImpresion,
      E.descripcion AS estatus,
      m.descripcion AS municipio,
      tt.Clave AS claveTipo,
      mo.descripcion AS modalidad
    FROM tarjetones TA
    LEFT JOIN tipoimpresion TI ON ta.idtipoImpresion = TI.idTipoImpresion
    LEFT JOIN estatusTarjeton E ON ta.idEstatusTarjeton = E.idEstatusTarjeton
    LEFT JOIN municipios M ON TA.idMunicipioTarjeton = M.idMunicipio
    LEFT JOIN modalidad MO ON TA.idModalidadTarjeton = MO.idModalidad
    LEFT JOIN TipoTarjeton Tt ON TA.idTipoTarjeton = Tt.idTipoTarjeton
    WHERE TA.idTarjeton = @idTarjeton
  `;

  try {
    await sql.connect(config);
    const result = await sql.query`SELECT 1`; // test connection
    const request = new sql.Request();
    request.input('idTarjeton', sql.VarChar, id);
    const data = await request.query(query);

    res.json(data.recordset);
  } catch (error) {
    console.error('Error en consulta:', error);
    res.status(500).json({ error: 'Error al consultar tarjetón' });
  }
});

router.get('/tarjetones', async (req, res) => {
  const query = `
    SELECT 
      T.idTarjeton,
      T.folioOperador,
      CONVERT(VARCHAR(10), T.fechaEmision, 103) AS emision,
      CONVERT(VARCHAR(10), T.fechaVencimiento, 103) AS vence,
      TR.descripcion AS tramite,
      S.descripcion AS coordinacion,
      G.descripcion AS genero,
      (O.nombre + ' ' + O.apellidoPaterno + ' ' + O.apellidoMaterno) AS nombreOperador,
      M.descripcion AS municipio,
      MO.descripcion AS modalidad,
      TJ.Clave AS tipoTarjeton,
      E.descripcion AS estatus,
      T.folioAdministrativo,
      T.folioPago
    FROM tarjetones T
    LEFT JOIN tipoImpresion TR ON T.idTipoImpresion = TR.idTipoImpresion
    LEFT JOIN sedesRegionales S ON T.idSedeRegion = S.idSedeRegion
    LEFT JOIN operador O ON T.idOperador = O.idOperador
    LEFT JOIN municipios M ON T.idMunicipioTarjeton = M.idMunicipio
    LEFT JOIN modalidad MO ON T.idModalidadTarjeton = MO.idModalidad
    LEFT JOIN estatusTarjeton E ON T.idEstatusTarjeton = E.idEstatusTarjeton
    LEFT JOIN tipoTarjeton TJ ON T.idTipoTarjeton = TJ.idTipoTarjeton
    LEFT JOIN Genero G ON O.idGenero = G.idGenero
    ORDER BY T.idTarjeton DESC
  `;

  try {
    await sql.connect(config);
    const result = await sql.query(query);
    res.json(result.recordset);
  } catch (error) {
    console.error('❌ Error al consultar tarjetones:', error);
    res.status(500).json({ error: 'Error al obtener los tarjetones' });
  }
});

// Nueva ruta para búsqueda filtrada de tarjetones
router.get('/tarjetones/buscar', async (req, res) => {
  const {
    folioOperador,
    municipio,
    modalidad,
    tipoTarjeton,
    estatus,
    folioAdministrativo,
    folioPago
  } = req.query;

  let query = `
    SELECT 
      T.idTarjeton,
      T.folioOperador,
      CONVERT(VARCHAR(10), T.fechaEmision, 103) AS emision,
      CONVERT(VARCHAR(10), T.fechaVencimiento, 103) AS vence,
      TR.descripcion AS tramite,
      S.descripcion AS coordinacion,
      G.descripcion AS genero,
      (O.nombre + ' ' + O.apellidoPaterno + ' ' + O.apellidoMaterno) AS nombreOperador,
      M.descripcion AS municipio,
      MO.descripcion AS modalidad,
      TJ.Clave AS tipoTarjeton,
      E.descripcion AS estatus,
      T.folioAdministrativo,
      T.folioPago
    FROM tarjetones T
    LEFT JOIN tipoImpresion TR ON T.idTipoImpresion = TR.idTipoImpresion
    LEFT JOIN sedesRegionales S ON T.idSedeRegion = S.idSedeRegion
    LEFT JOIN operador O ON T.idOperador = O.idOperador
    LEFT JOIN municipios M ON T.idMunicipioTarjeton = M.idMunicipio
    LEFT JOIN modalidad MO ON T.idModalidadTarjeton = MO.idModalidad
    LEFT JOIN estatusTarjeton E ON T.idEstatusTarjeton = E.idEstatusTarjeton
    LEFT JOIN tipoTarjeton TJ ON T.idTipoTarjeton = TJ.idTipoTarjeton
    LEFT JOIN Genero G ON O.idGenero = G.idGenero
    WHERE 1=1
    `;
  try {
    await sql.connect(config);
    const request = new sql.Request();
    if (folioOperador) {
      query += ' AND T.folioOperador = @folioOperador';
      request.input('folioOperador', sql.VarChar, folioOperador);
    }
    if (municipio) {
      query += ' AND M.descripcion = @municipio';
      request.input('municipio', sql.VarChar, municipio);
    }
    if (modalidad) {
      query += ' AND MO.descripcion = @modalidad';
      request.input('modalidad', sql.VarChar, modalidad);
    }
    if (tipoTarjeton) {
      query += ' AND TJ.Clave = @tipoTarjeton';
      request.input('tipoTarjeton', sql.VarChar, tipoTarjeton);
    }
    if (estatus) {
      query += ' AND E.descripcion = @estatus';
      request.input('estatus', sql.VarChar, estatus);
    }
    if (folioAdministrativo) {
      query += ' AND T.folioAdministrativo = @folioAdministrativo';
      request.input('folioAdministrativo', sql.VarChar, folioAdministrativo);
    }
    if (folioPago) {
      query += ' AND T.folioPago = @folioPago';
      request.input('folioPago', sql.VarChar, folioPago);
    }
    query += '\nORDER BY T.idTarjeton DESC';
    const result = await request.query(query);
    res.json(result.recordset);
  } catch (error) {
    console.error('❌ Error al buscar tarjetones:', error);
    res.status(500).json({ error: 'Error al buscar tarjetones' });
  }
});


router.get('/tarjetones/filtrar', async (req, res) => {
  const {
    fchIni,
    fchFin,
    idCoordinacion,
    idMunicipio,
    idModalidad,
    idGenero,
    idTramite,
    idOperador
  } = req.query;

  if (!fchIni || !fchFin) {
    return res.status(400).json({ error: 'Fechas fchIni y fchFin son obligatorias' });
  }

  // Ajustamos el rango de fechas para incluir todo el día final
  const fchIniDate = new Date(fchIni);
  const fchFinDate = new Date(fchFin);
  fchFinDate.setHours(23, 59, 59, 999); // cubrir todo el día

  let where = '';
  try {
    const pool = await sql.connect(config);
    const request = pool.request();

    // ✅ Usa sql.Date para que compare correctamente
    request.input('fchIni', sql.Date, fchIniDate);
    request.input('fchFin', sql.Date, fchFinDate);

    if (idCoordinacion && idCoordinacion !== '-1') {
      where += (where ? ' AND ' : '') + 'T.idSedeRegion = @idCoordinacion';
      request.input('idCoordinacion', sql.VarChar, idCoordinacion);
    }
    if (idMunicipio && idMunicipio !== '-1') {
      where += (where ? ' AND ' : '') + 'T.idMunicipioTarjeton = @idMunicipio';
      request.input('idMunicipio', sql.VarChar, idMunicipio);
    }
    if (idModalidad && idModalidad !== '-1') {
      where += (where ? ' AND ' : '') + 'T.idModalidadTarjeton = @idModalidad';
      request.input('idModalidad', sql.VarChar, idModalidad);
    }
    if (idTramite && idTramite !== '-1') {
      where += (where ? ' AND ' : '') + 'T.idtipoImpresion = @idTramite';
      request.input('idTramite', sql.VarChar, idTramite);
    }
    if (idOperador && idOperador !== '') {
      where += (where ? ' AND ' : '') + 'T.idOperador = @idOperador';
      request.input('idOperador', sql.VarChar, idOperador);
    }
    if (idGenero && idGenero !== '-1') {
      where += (where ? ' AND ' : '') + 'O.idGenero = @idGenero';
      request.input('idGenero', sql.VarChar, idGenero);
    }

    if (where) where = ' AND ' + where;

    const query = `
  SELECT 
    T.idTarjeton,
    T.folioOperador,
    CONVERT(VARCHAR(10), T.fechaEmision, 103) AS emision,
    CONVERT(VARCHAR(10), T.fechaVencimiento, 103) AS vence,
    TR.descripcion AS tramite,
    S.descripcion AS coordinacion,
    G.descripcion AS genero,
    (O.nombre + ' ' + O.apellidoPaterno + ' ' + O.apellidoMaterno) AS nombreOperador,
    M.descripcion AS municipio,
    MO.descripcion AS modalidad,
    TJ.Clave AS tipoTarjeton,
    E.descripcion AS estatus,
    T.folioAdministrativo,
    T.folioPago,
    Foto.datos AS fotografia
  FROM tarjetones T
  LEFT JOIN tipoImpresion TR ON T.idTipoImpresion = TR.idTipoImpresion
  LEFT JOIN sedesRegionales S ON T.idSedeRegion = S.idSedeRegion
  LEFT JOIN operador O ON T.idOperador = O.idOperador
  LEFT JOIN municipios M ON T.idMunicipioTarjeton = M.idMunicipio
  LEFT JOIN modalidad MO ON T.idModalidadTarjeton = MO.idModalidad
  LEFT JOIN estatusTarjeton E ON T.idEstatusTarjeton = E.idEstatusTarjeton
  LEFT JOIN tipoTarjeton TJ ON T.idTipoTarjeton = TJ.idTipoTarjeton
  LEFT JOIN Genero G ON O.idGenero = G.idGenero
  OUTER APPLY (
    SELECT TOP 1 DB.datos
    FROM datosBiometricos DB
    WHERE DB.idOperador = O.idOperador AND DB.idTipoDatoBiometrico = 1
  ) Foto
  WHERE T.fechaEmision BETWEEN @fchIni AND @fchFin
  ${where}
  ORDER BY T.idTarjeton
`;


    const result = await request.query(query);
    res.json(result.recordset);
  } catch (error) {
    console.error('❌ Error en /tarjetones/filtrar:', error);
    res.status(500).json({ error: 'Error al consultar tarjetones filtrados' });
  }
});

router.get('/catalogos/municipios', async (req, res) => {
  try {
    const pool = await sql.connect(config);
    const result = await pool.request().query(`
      SELECT idMunicipio AS id, descripcion FROM municipios ORDER BY descripcion
    `);
    res.json(result.recordset);
  } catch (error) {
    console.error('❌ Error al obtener municipios:', error);
    res.status(500).json({ error: 'Error al obtener municipios' });
  }
});

router.get('/catalogos/modalidades', async (req, res) => {
  try {
    const pool = await sql.connect(config);
    const result = await pool.request().query(`
      SELECT idModalidad AS id, descripcion FROM modalidad ORDER BY descripcion
    `);
    res.json(result.recordset);
  } catch (error) {
    console.error('❌ Error al obtener modalidades:', error);
    res.status(500).json({ error: 'Error al obtener modalidades' });
  }
});
router.get('/catalogos/generos', async (req, res) => {
  try {
    const pool = await sql.connect(config);
    const result = await pool.request().query(`
      SELECT idGenero AS id, descripcion FROM genero ORDER BY descripcion
    `);
    res.json(result.recordset);
  } catch (error) {
    console.error('❌ Error al obtener géneros:', error);
    res.status(500).json({ error: 'Error al obtener géneros' });
  }
});
router.get('/catalogos/tramites', async (req, res) => {
  try {
    const pool = await sql.connect(config);
    const result = await pool.request().query(`
      SELECT idTipoImpresion AS id, descripcion FROM tipoImpresion ORDER BY descripcion
    `);
    res.json(result.recordset);
  } catch (error) {
    console.error('❌ Error al obtener trámites:', error);
    res.status(500).json({ error: 'Error al obtener trámites' });
  }
});
router.get('/catalogos/coordinaciones', async (req, res) => {
  try {
    const pool = await sql.connect(config);
    const result = await pool.request().query(`
      SELECT idSedeRegion AS id, descripcion FROM sedesRegionales ORDER BY descripcion
    `);
    res.json(result.recordset);
  } catch (error) {
    console.error('❌ Error al obtener coordinaciones:', error);
    res.status(500).json({ error: 'Error al obtener coordinaciones' });
  }
});

module.exports = router;
