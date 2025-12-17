require("dotenv").config();
const { Pool } = require("pg");
const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");

const app = express();

app.use(cors({ origin: true, credentials: true }));
app.use(express.json());
app.use(cookieParser());

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_SSL === "true"
    ? { rejectUnauthorized: false }
    : undefined,
});

pool.connect((err, client, release) => {
  if (err) {
    return console.error('Error acquiring client', err.stack);
  }
  console.log('Successfully connected to Render PostgreSQL (SSL)!');
  release();
});

function signToken(payload) {
  return jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || "7d",
  });
}

function authRequired(req, res, next) {
  const token = req.cookies?.accessToken;
  if (!token) return res.status(401).json({ message: "Unauthorized" });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch {
    return res.status(401).json({ message: "Invalid token" });
  }
}

function rolesAllowed(...roles) {
  return (req, res, next) => {
    if (!req.user?.role) return res.status(403).json({ message: "Forbidden" });
    if (!roles.includes(req.user.role))
      return res.status(403).json({ message: "Forbidden" });
    next();
  };
}

function cookieOptions() {
  const secure = (process.env.COOKIE_SECURE || "false") === "true";
  const sameSite = process.env.COOKIE_SAMESITE || "lax";
  return {
    httpOnly: true,
    secure,
    sameSite,
    maxAge: 7 * 24 * 60 * 60 * 1000,
  };
}

app.get("/api/health", (_, res) => res.json({ ok: true }));

// ======================================================
// 1) Auth
// ======================================================

app.post("/api/auth/login", async (req, res) => {
  const { username, password } = req.body || {};
  if (!username || !password)
    return res.status(400).json({ message: "username/password required" });

  const client = await pool.connect();
  try {
    const q = `SELECT employee_id, username, password, role, status
              FROM employee WHERE username=$1`;
    const { rows } = await client.query(q, [username]);
    const emp = rows[0];
    if (!emp) return res.status(401).json({ message: "Invalid credentials" });

    if ((emp.status || "").toLowerCase() === "resigned") {
      return res.status(401).json({ message: "Employee resigned" });
    }

    const ok = await bcrypt.compare(password, emp.password);
    if (!ok) return res.status(401).json({ message: "Invalid credentials" });

    const token = signToken({
      employee_id: emp.employee_id,
      username: emp.username,
      role: emp.role || "Staff",
    });

    res.cookie("accessToken", token, cookieOptions());
    return res.json({
      message: "Login successfully.",
      user: { employee_id: emp.employee_id, username: emp.username, role: emp.role, status: emp.status },
    });
  } finally {
    client.release();
  }
});

app.post("/api/auth/logout", (req, res) => {
  res.clearCookie("accessToken");
  res.json({ message: "Logout successfully." });
});

app.get("/api/auth/me", authRequired, (req, res) => {
  res.json({ user: req.user });
});

// ======================================================
// 2) Employees (Admin/Manager)
// ======================================================

app.get("/api/employees", authRequired, rolesAllowed("Admin", "Manager"), async (req, res) => {
  const { rows } = await pool.query(
    `SELECT employee_id, first_name_th, last_name_th, first_name_en, last_name_en,
            phone, birth_date, education, username, role, status
     FROM employee
     ORDER BY employee_id ASC`
  );
  res.json(rows);
});

app.post("/api/employees", authRequired, rolesAllowed("Admin", "Manager"), async (req, res) => {
  const {
    first_name_th, last_name_th, first_name_en, last_name_en,
    phone, birth_date, education, username, password, role, status
  } = req.body || {};

  if (!username || !password) {
    return res.status(400).json({ message: "username/password required" });
  }

  const hash = await bcrypt.hash(password, 10);

  try {
    const { rows } = await pool.query(
      `INSERT INTO employee
        (first_name_th, last_name_th, first_name_en, last_name_en, phone, birth_date, education,
         username, password, role, status)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
       RETURNING employee_id, username, role, status`,
      [
        first_name_th || null,
        last_name_th || null,
        first_name_en || null,
        last_name_en || null,
        phone || null,
        birth_date || null,
        education || null,
        username,
        hash,
        role || "Staff",
        status || "Active",
      ]
    );
    res.status(201).json(rows[0]);
  } catch (e) {
    if (String(e).includes("duplicate key")) {
      return res.status(409).json({ message: "Username already exists" });
    }
    throw e;
  }
});

app.put("/api/employees/:id", authRequired, rolesAllowed("Admin", "Manager"), async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isFinite(id)) return res.status(400).json({ message: "Invalid id" });

  const body = req.body || {};
  const fields = [
    "first_name_th","last_name_th","first_name_en","last_name_en",
    "phone","birth_date","education","role","status"
  ];

  let set = [];
  let values = [];
  let idx = 1;

  for (const f of fields) {
    if (body[f] !== undefined) {
      set.push(`${f}=$${idx++}`);
      values.push(body[f]);
    }
  }

  if (body.password) {
    const hash = await bcrypt.hash(body.password, 10);
    set.push(`password=$${idx++}`);
    values.push(hash);
  }

  if (set.length === 0) return res.status(400).json({ message: "No fields to update" });
  values.push(id);

  const { rowCount, rows } = await pool.query(
    `UPDATE employee SET ${set.join(", ")}
     WHERE employee_id=$${idx}
     RETURNING employee_id, username, role, status`,
    values
  );

  if (!rowCount) return res.status(404).json({ message: "Employee not found" });
  res.json(rows[0]);
});

app.delete("/api/employees/:id", authRequired, rolesAllowed("Admin", "Manager"), async (req, res) => {
  const id = Number(req.params.id);
  const { rowCount, rows } = await pool.query(
    `UPDATE employee SET status='Resigned'
     WHERE employee_id=$1
     RETURNING employee_id, username, status`,
    [id]
  );
  if (!rowCount) return res.status(404).json({ message: "Employee not found" });
  res.json(rows[0]);
});

// ======================================================
// 3) Menu
// ======================================================

app.get("/api/menu", authRequired, async (req, res) => {
  const { rows } = await pool.query(`SELECT * FROM menu ORDER BY menu_id ASC`);
  res.json(rows);
});

app.get("/api/menu/:id", authRequired, async (req, res) => {
  const id = Number(req.params.id);
  const { rows } = await pool.query(`SELECT * FROM menu WHERE menu_id=$1`, [id]);
  if (!rows[0]) return res.status(404).json({ message: "Menu not found" });
  res.json(rows[0]);
});

app.post("/api/menu", authRequired, rolesAllowed("Admin", "Manager"), async (req, res) => {
  const { menu_name, price, status } = req.body || {};
  if (price === undefined) return res.status(400).json({ message: "price required" });

  const { rows } = await pool.query(
    `INSERT INTO menu (menu_name, price, status)
     VALUES ($1,$2,$3)
     RETURNING *`,
    [menu_name || null, price, status || "Available"]
  );
  res.status(201).json(rows[0]);
});

app.put("/api/menu/:id", authRequired, rolesAllowed("Admin", "Manager"), async (req, res) => {
  const id = Number(req.params.id);
  const { menu_name, price, status } = req.body || {};

  const { rowCount, rows } = await pool.query(
    `UPDATE menu
     SET menu_name=COALESCE($1, menu_name),
         price=COALESCE($2, price),
         status=COALESCE($3, status)
     WHERE menu_id=$4
     RETURNING *`,
    [menu_name ?? null, price ?? null, status ?? null, id]
  );
  if (!rowCount) return res.status(404).json({ message: "Menu not found" });
  res.json(rows[0]);
});

app.delete("/api/menu/:id", authRequired, rolesAllowed("Admin", "Manager"), async (req, res) => {
  const id = Number(req.params.id);
  const { rowCount } = await pool.query(`DELETE FROM menu WHERE menu_id=$1`, [id]);
  if (!rowCount) return res.status(404).json({ message: "Menu not found" });
  res.json({ message: "Deleted" });
});

// ======================================================
// 4) Ingredients & Inventory
// ======================================================

// GET /api/ingredients
app.get("/api/ingredients", authRequired, async (req, res) => {
  const { rows } = await pool.query(
    `SELECT i.*, c.category_name
     FROM ingredient i
     LEFT JOIN ingredient_category c ON c.category_code=i.category_code
     ORDER BY i.ingredient_id ASC`
  );
  res.json(rows);
});

app.post("/api/ingredients", authRequired, rolesAllowed("Admin", "Manager"), async (req, res) => {
  const {
    ingredient_id, ingredient_name, unit, cost_per_unit,
    quantity_on_hand, expire_date, category_code
  } = req.body || {};
  if (!ingredient_id) return res.status(400).json({ message: "ingredient_id required" });

  const { rows } = await pool.query(
    `INSERT INTO ingredient
     (ingredient_id, ingredient_name, unit, cost_per_unit, quantity_on_hand, expire_date, category_code)
     VALUES ($1,$2,$3,$4,$5,$6,$7)
     RETURNING *`,
    [
      ingredient_id,
      ingredient_name || null,
      unit || null,
      cost_per_unit ?? null,
      quantity_on_hand ?? null,
      expire_date || null,
      category_code || null,
    ]
  );
  res.status(201).json(rows[0]);
});

app.put("/api/ingredients/:id", authRequired, rolesAllowed("Admin", "Manager"), async (req, res) => {
  const id = req.params.id;
  const {
    ingredient_name, unit, cost_per_unit, quantity_on_hand,
    expire_date, category_code
  } = req.body || {};

  const { rowCount, rows } = await pool.query(
    `UPDATE ingredient
     SET ingredient_name=COALESCE($1, ingredient_name),
         unit=COALESCE($2, unit),
         cost_per_unit=COALESCE($3, cost_per_unit),
         quantity_on_hand=COALESCE($4, quantity_on_hand),
         expire_date=COALESCE($5, expire_date),
         category_code=COALESCE($6, category_code)
     WHERE ingredient_id=$7
     RETURNING *`,
    [
      ingredient_name ?? null,
      unit ?? null,
      cost_per_unit ?? null,
      quantity_on_hand ?? null,
      expire_date ?? null,
      category_code ?? null,
      id,
    ]
  );
  if (!rowCount) return res.status(404).json({ message: "Ingredient not found" });
  res.json(rows[0]);
});

app.delete("/api/ingredients/:id", authRequired, rolesAllowed("Admin", "Manager"), async (req, res) => {
  const id = req.params.id;
  const { rowCount } = await pool.query(`DELETE FROM ingredient WHERE ingredient_id=$1`, [id]);
  if (!rowCount) return res.status(404).json({ message: "Ingredient not found" });
  res.json({ message: "Deleted" });
});

app.get("/api/ingredients/alerts", authRequired, async (req, res) => {
  const days = Number(req.query.days || 7);
  const n = Number.isFinite(days) ? days : 7;

  const { rows } = await pool.query(
    `SELECT *
     FROM ingredient
     WHERE expire_date IS NOT NULL
       AND expire_date <= (CURRENT_DATE + ($1 || ' days')::interval)
     ORDER BY expire_date ASC`,
    [n]
  );
  res.json(rows);
});

// ======================================================
// 5) Members
// ======================================================

app.get("/api/members", authRequired, async (req, res) => {
  const phone = String(req.query.phone || "").trim();
  if (!phone) return res.json([]);
  const { rows } = await pool.query(
    `SELECT * FROM member WHERE phone ILIKE $1 ORDER BY member_id ASC`,
    [`%${phone}%`]
  );
  res.json(rows);
});

app.post("/api/members", authRequired, async (req, res) => {
  const { name, gender, phone, points } = req.body || {};
  const { rows } = await pool.query(
    `INSERT INTO member (name, gender, phone, points)
     VALUES ($1,$2,$3,COALESCE($4,0))
     RETURNING *`,
    [name || null, gender || null, phone || null, points ?? null]
  );
  res.status(201).json(rows[0]);
});

app.put("/api/members/:id", authRequired, async (req, res) => {
  const id = Number(req.params.id);
  const { name, gender, phone, points } = req.body || {};

  const { rowCount, rows } = await pool.query(
    `UPDATE member
     SET name=COALESCE($1,name),
         gender=COALESCE($2,gender),
         phone=COALESCE($3,phone),
         points=COALESCE($4,points)
     WHERE member_id=$5
     RETURNING *`,
    [name ?? null, gender ?? null, phone ?? null, points ?? null, id]
  );
  if (!rowCount) return res.status(404).json({ message: "Member not found" });
  res.json(rows[0]);
});

app.delete("/api/members/:id", authRequired, async (req, res) => {
  const id = Number(req.params.id);
  const { rowCount } = await pool.query(`DELETE FROM member WHERE member_id=$1`, [id]);
  if (!rowCount) return res.status(404).json({ message: "Member not found" });
  res.json({ message: "Deleted" });
});

// ======================================================
// 6) Promotions
// ======================================================

app.get("/api/promotions", authRequired, async (req, res) => {
  const { rows } = await pool.query(
    `SELECT *
     FROM promotion
     WHERE (start_date IS NULL OR start_date <= CURRENT_DATE)
       AND (end_date IS NULL OR end_date >= CURRENT_DATE)
     ORDER BY promotion_id ASC`
  );
  res.json(rows);
});

app.post("/api/promotions", authRequired, rolesAllowed("Admin", "Manager"), async (req, res) => {
  const { promotion_name, promotion_detail, start_date, end_date } = req.body || {};
  const { rows } = await pool.query(
    `INSERT INTO promotion (promotion_name, promotion_detail, start_date, end_date)
     VALUES ($1,$2,$3,$4)
     RETURNING *`,
    [promotion_name || null, promotion_detail || null, start_date || null, end_date || null]
  );
  res.status(201).json(rows[0]);
});

app.put("/api/promotions/:id", authRequired, rolesAllowed("Admin", "Manager"), async (req, res) => {
  const id = Number(req.params.id);
  const { promotion_name, promotion_detail, start_date, end_date } = req.body || {};

  const { rowCount, rows } = await pool.query(
    `UPDATE promotion
     SET promotion_name=COALESCE($1,promotion_name),
         promotion_detail=COALESCE($2,promotion_detail),
         start_date=COALESCE($3,start_date),
         end_date=COALESCE($4,end_date)
     WHERE promotion_id=$5
     RETURNING *`,
    [promotion_name ?? null, promotion_detail ?? null, start_date ?? null, end_date ?? null, id]
  );
  if (!rowCount) return res.status(404).json({ message: "Promotion not found" });
  res.json(rows[0]);
});

app.delete("/api/promotions/:id", authRequired, rolesAllowed("Admin", "Manager"), async (req, res) => {
  const id = Number(req.params.id);
  const { rowCount } = await pool.query(`DELETE FROM promotion WHERE promotion_id=$1`, [id]);
  if (!rowCount) return res.status(404).json({ message: "Promotion not found" });
  res.json({ message: "Deleted" });
});

// ======================================================
// 7) Supplier + Orders (Purchase Order)
// ======================================================

app.get("/api/suppliers", authRequired, rolesAllowed("Admin", "Manager"), async (req, res) => {
  const { rows } = await pool.query(`SELECT * FROM supplier ORDER BY supplier_id ASC`);
  res.json(rows);
});

app.post("/api/suppliers", authRequired, rolesAllowed("Admin", "Manager"), async (req, res) => {
  const { supplier_name, contact } = req.body || {};
  const { rows } = await pool.query(
    `INSERT INTO supplier (supplier_name, contact)
     VALUES ($1,$2) RETURNING *`,
    [supplier_name || null, contact || null]
  );
  res.status(201).json(rows[0]);
});

app.get("/api/orders", authRequired, rolesAllowed("Admin", "Manager"), async (req, res) => {
  const orders = await pool.query(
    `SELECT o.*, s.supplier_name
     FROM purchase_order o
     LEFT JOIN supplier s ON s.supplier_id=o.supplier_id
     ORDER BY o.order_id DESC`
  );

  const items = await pool.query(
    `SELECT oi.*, i.ingredient_name, i.unit
     FROM purchase_order_item oi
     LEFT JOIN ingredient i ON i.ingredient_id=oi.ingredient_id
     ORDER BY oi.order_item_id ASC`
  );

  const map = new Map();
  for (const o of orders.rows) map.set(o.order_id, { ...o, items: [] });
  for (const it of items.rows) {
    const holder = map.get(it.order_id);
    if (holder) holder.items.push(it);
  }
  res.json([...map.values()]);
});


app.post("/api/orders", authRequired, rolesAllowed("Admin", "Manager"), async (req, res) => {
  const { supplier_id, order_status, items } = req.body || {};
  if (!Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ message: "items required" });
  }

  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const orderRes = await client.query(
      `INSERT INTO purchase_order (order_status, supplier_id)
       VALUES ($1,$2)
       RETURNING *`,
      [order_status || "Pending", supplier_id ?? null]
    );
    const order = orderRes.rows[0];

    for (const it of items) {
      if (!it.ingredient_id || !it.quantity) {
        await client.query("ROLLBACK");
        return res.status(400).json({ message: "ingredient_id and quantity required" });
      }
      await client.query(
        `INSERT INTO purchase_order_item (order_id, ingredient_id, quantity, unit_cost)
         VALUES ($1,$2,$3,$4)`,
        [order.order_id, it.ingredient_id, it.quantity, it.unit_cost ?? null]
      );
    }

    if (String(order.order_status).toLowerCase() === "received") {
      for (const it of items) {
        await client.query(
          `UPDATE ingredient
           SET quantity_on_hand = COALESCE(quantity_on_hand,0) + $1
           WHERE ingredient_id=$2`,
          [it.quantity, it.ingredient_id]
        );
      }
    }

    await client.query("COMMIT");
    res.status(201).json({ ...order, items });
  } catch (e) {
    await client.query("ROLLBACK");
    throw e;
  } finally {
    client.release();
  }
});

// ======================================================
// 8) Sales / POS Transaction
// ======================================================


app.post("/api/sales", authRequired, async (req, res) => {
  const employee_id = req.user.employee_id;
  const { member_id, promotion_id, payment_method, discount_amount, items } = req.body || {};

  if (!Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ message: "items required" });
  }

  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const menuIds = items.map((i) => Number(i.menu_id)).filter(Number.isFinite);
    const menusRes = await client.query(
      `SELECT menu_id, price FROM menu WHERE menu_id = ANY($1::int[])`,
      [menuIds]
    );
    const priceMap = new Map(menusRes.rows.map((m) => [m.menu_id, Number(m.price)]));

    let subtotal = 0;
    const prepared = items.map((it) => {
      const q = Number(it.quantity || 0);
      const unit = it.unit_price !== undefined
        ? Number(it.unit_price)
        : Number(priceMap.get(Number(it.menu_id)) || 0);
      subtotal += unit * q;
      return { menu_id: Number(it.menu_id), quantity: q, unit_price: unit };
    });

    const discount = discount_amount !== undefined ? Number(discount_amount) : 0;
    const net_total = subtotal - discount;

    const saleRes = await client.query(
      `INSERT INTO sale
        (subtotal, discount_amount, net_total, payment_method, employee_id, member_id, promotion_id)
       VALUES ($1,$2,$3,$4,$5,$6,$7)
       RETURNING *`,
      [subtotal, discount, net_total, payment_method || "Cash", employee_id, member_id ?? null, promotion_id ?? null]
    );
    const sale = saleRes.rows[0];

    for (const it of prepared) {
      await client.query(
        `INSERT INTO sale_item (sale_id, menu_id, quantity, unit_price)
         VALUES ($1,$2,$3,$4)`,
        [sale.sale_id, it.menu_id, it.quantity, it.unit_price]
      );
    }

    if (member_id) {
      const addPoints = Math.floor(net_total / 20);
      await client.query(
        `UPDATE member SET points = COALESCE(points,0) + $1 WHERE member_id=$2`,
        [addPoints, member_id]
      );
    }

    await client.query("COMMIT");
    res.status(201).json({ ...sale, items: prepared });
  } catch (e) {
    await client.query("ROLLBACK");
    throw e;
  } finally {
    client.release();
  }
});

app.get("/api/sales", authRequired, async (req, res) => {
  const salesRes = await pool.query(
    `SELECT s.*, e.username AS employee_username, m.name AS member_name, p.promotion_name
     FROM sale s
     LEFT JOIN employee e ON e.employee_id=s.employee_id
     LEFT JOIN member m ON m.member_id=s.member_id
     LEFT JOIN promotion p ON p.promotion_id=s.promotion_id
     ORDER BY s.sale_id DESC`
  );

  const itemsRes = await pool.query(
    `SELECT si.*, mn.menu_name
     FROM sale_item si
     LEFT JOIN menu mn ON mn.menu_id=si.menu_id
     ORDER BY si.sale_item_id ASC`
  );

  const map = new Map();
  for (const s of salesRes.rows) map.set(s.sale_id, { ...s, items: [] });
  for (const it of itemsRes.rows) {
    const holder = map.get(it.sale_id);
    if (holder) holder.items.push(it);
  }
  res.json([...map.values()]);
});

app.get("/api/sales/:id", authRequired, async (req, res) => {
  const id = Number(req.params.id);
  const saleRes = await pool.query(
    `SELECT s.*, e.username AS employee_username, m.name AS member_name, p.promotion_name
     FROM sale s
     LEFT JOIN employee e ON e.employee_id=s.employee_id
     LEFT JOIN member m ON m.member_id=s.member_id
     LEFT JOIN promotion p ON p.promotion_id=s.promotion_id
     WHERE s.sale_id=$1`,
    [id]
  );
  if (!saleRes.rows[0]) return res.status(404).json({ message: "Sale not found" });

  const itemsRes = await pool.query(
    `SELECT si.*, mn.menu_name
     FROM sale_item si
     LEFT JOIN menu mn ON mn.menu_id=si.menu_id
     WHERE si.sale_id=$1
     ORDER BY si.sale_item_id ASC`,
    [id]
  );

  res.json({ ...saleRes.rows[0], items: itemsRes.rows });
});

app.delete("/api/sales/:id", authRequired, rolesAllowed("Admin", "Manager"), async (req, res) => {
  const id = Number(req.params.id);
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    await client.query(`DELETE FROM sale_item WHERE sale_id=$1`, [id]);
    const { rowCount } = await client.query(`DELETE FROM sale WHERE sale_id=$1`, [id]);
    await client.query("COMMIT");

    if (!rowCount) return res.status(404).json({ message: "Sale not found" });
    res.json({ message: "Cancelled (deleted)" });
  } catch (e) {
    await client.query("ROLLBACK");
    throw e;
  } finally {
    client.release();
  }
});

app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ message: "Internal Server Error", error: String(err?.message || err) });
});

const PORT = Number(process.env.PORT || 3000);
app.listen(PORT, () => console.log(`POS API running on port ${PORT}`));