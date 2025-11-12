import express from 'express';
import mysql from 'mysql2/promise';

const app = express();
app.use(express.json());

const db = mysql.createPool({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'basededatos'
});
app.get('/categorias',
    async (req, res) => {
        const [resultado] = await db.query('SELECT * FROM categorias');
        res.status(200).json(resultado);
    }
);
app.post('/categorias',
    async (req, res) => {
        const { nombre, descripcion } = req.body;
        const resultado = await db.query('INSERT INTO categorias (nombre, descripcion) VALUES (?, ?)', [nombre, descripcion]);
        
        res.status(201).json(resultado);
    });
app.get('/categorias/:id', 
    async (req, res) => {
    const { id } = req.params;
    const [categoriaRows] = await db.query('SELECT * FROM categorias WHERE id = ?', [id]);
    const categoria = categoriaRows[0];
    const [productosRows] = await db.query('SELECT * FROM productos WHERE categoria_id = ?', [id]);
    res.json({...categoria,productos: productosRows});
});
app.put('/categorias/:id', 
    async (req, res) => {
    const { id } = req.params;
    const { nombre, descripcion } = req.body;
    const [resultado] = await db.query('UPDATE categorias SET nombre = ?, descripcion = ?, fecha_act = NOW() WHERE id = ?',[nombre, descripcion, id] );
    res.status(200).json({resultado});
});
app.delete('/categorias/:id',
    async (req, res) => {
    const { id } = req.params;
    const resultado = await db.query('DELETE FROM categorias WHERE id = ?', [id]);
    res.json({
      mensaje: 'Categoría y productos asociados eliminados correctamente',
    });
});

app.post('/productos', 
    async (req, res) => {
    const { nombre, precio, stock, categoria_id } = req.body;
    const resultado= await db.query(
      `INSERT INTO productos (nombre, precio, stock, categoria_id) 
       VALUES (?, ?, ?, ?)`,
      [nombre, precio, stock, categoria_id]
    );
    res.status(201).json({resultado});
  });
app.get('/productos', 
    async (req, res) => {
    const [rows] = await db.query(`
        SELECT p.id,
        p.nombre,
        p.precio,
        p.stock,
        p.categoria_id,
        c.nombre AS categoria_nombre,
        p.fecha_alta,
        p.fecha_act
      FROM productos p
      INNER JOIN categorias c ON p.categoria_id = c.id
      ORDER BY p.id ASC
    `);res.json(rows);
});
app.get('/productos/:id', 
    async (req, res) => {
    const { id } = req.params;
    const [rows] = await db.query(
        `SELECT p.id,
            p.nombre,
            p.precio,
            p.stock,
            p.categoria_id,
            c.nombre AS categoria_nombre,
            p.fecha_alta,
            p.fecha_act
        FROM productos p
        INNER JOIN categorias c ON p.categoria_id = c.id
        WHERE p.id = ?
        `, [id]);
        res.json(rows[0]);});
app.put('/productos/:id', 
    async (req, res) => {
    const { id } = req.params;
    const { nombre, precio, stock, categoria_id } = req.body
    const resultado = await db.query(
      `UPDATE productos SET nombre = ?, precio = ?, stock = ?, categoria_id = ?, fecha_act = NOW() 
      WHERE id = ?`,
      [nombre, precio, stock, categoria_id, id]);
    res.status(200).json(resultado);
});
app.patch('/productos/:id/stock',
    async (req, res) => {
    const { id } = req.params;
    const { cantidad } = req.body;
    const [productoRows] = await db.query('SELECT * FROM productos WHERE id = ?', [id]);
    const producto = productoRows[0];
    const nuevoStock = producto.stock + cantidad;
    if (nuevoStock < 0) {
      return res.status(400).json({ mensaje: 'El stock no puede ser negativo' });
    }
    await db.query(
      'UPDATE productos SET stock = ?, fecha_act = NOW() WHERE id = ?',
      [nuevoStock, id]   );
    res.json({mensaje: 'Stock actualizado correctamente', });
});
const puerto = 3001;
app.listen(puerto, () => console.log(`Servidor en http://localhost:${puerto}`));