const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const cors = require('cors');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const dbPath = path.join(__dirname, 'database.sqlite');

const app = express();

// Middleware básico
app.use(cors());
app.use(express.json());

// Configuração do multer para upload de arquivos
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads/');
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + path.extname(file.originalname));
    }
});

// Configuração do upload com filtros e limites
const upload = multer({
    storage: storage,
    fileFilter: (req, file, cb) => {
        const allowedTypes = ['image/jpeg', 'image/png', 'image/gif'];
        if (allowedTypes.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error('Formato de arquivo não suportado'));
        }
    },
    limits: {
        fileSize: 5 * 1024 * 1024 // 5MB
    }
});

// Certifique-se de criar a pasta uploads
if (!fs.existsSync('uploads')) {
    fs.mkdirSync('uploads');
}

// Servir arquivos estáticos
app.use('/uploads', express.static('uploads'));



// Função para verificar se já existe um admin e criar se não existir
async function checkAndCreateAdminUser() {
    db.get('SELECT id FROM employees WHERE username = ? OR cpf = ?', ['admin', '000.000.000-00'], async (err, row) => {
        if (err) {
            console.error('Erro ao verificar usuário admin:', err);
            return;
        }

        if (!row) {
            // Se não existe admin, cria um
            try {
                const adminPassword = await bcrypt.hash('admin123', 10);
                db.run(`
                  INSERT INTO employees (
                      fullName, 
                      username, 
                      email, 
                      password, 
                      phone, 
                      cpf, 
                      role,
                      avatar
                  )
                  VALUES (?, ?, ?, ?, ?, ?, ?, ?)
              `, [
                    'Administrador',
                    'admin',
                    'admin@example.com',
                    adminPassword,
                    '(00) 00000-0000',
                    '000.000.000-00',
                    'admin',
                    null
                ], (err) => {
                    if (err) {
                        console.error('Erro ao criar usuário admin:', err);
                    } else {
                        console.log('Usuário admin criado com sucesso');
                    }
                });
            } catch (error) {
                console.error('Erro ao criar hash da senha:', error);
            }
        } else {
            console.log('Usuário admin já existe no sistema');
        }
    });
}

// Atualizar a função createTables (opcional, mas recomendado para maior clareza)
function createTables() {
    db.serialize(() => {
        // Tabela existente de employees
        db.run(`
          CREATE TABLE IF NOT EXISTS employees (
              id INTEGER PRIMARY KEY AUTOINCREMENT,
              fullName TEXT NOT NULL,
              username TEXT UNIQUE NOT NULL,
              email TEXT UNIQUE NOT NULL,
              password TEXT NOT NULL,
              phone TEXT,
              cpf TEXT UNIQUE NOT NULL,
              role TEXT NOT NULL DEFAULT 'user',
              avatar TEXT,
              created_at DATETIME DEFAULT CURRENT_TIMESTAMP
          )
      `);

        // Nova tabela de empresas
        db.run(`
          CREATE TABLE IF NOT EXISTS companies (
              id INTEGER PRIMARY KEY AUTOINCREMENT,
              name TEXT NOT NULL,
              cnpj TEXT UNIQUE NOT NULL,
              created_at DATETIME DEFAULT CURRENT_TIMESTAMP
          )
      `);

        // Tabela de vínculo entre empresas e funcionários
        db.run(`
          CREATE TABLE IF NOT EXISTS company_employees (
              id INTEGER PRIMARY KEY AUTOINCREMENT,
              company_id INTEGER,
              employee_id INTEGER,
              created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
              FOREIGN KEY (company_id) REFERENCES companies (id),
              FOREIGN KEY (employee_id) REFERENCES employees (id),
              UNIQUE(company_id, employee_id)
          )
      `);

        // Add this to your createTables function in the server code:
        db.run(`
    CREATE TABLE IF NOT EXISTS product_categories (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL UNIQUE,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
`);

        db.run(`
    CREATE TABLE IF NOT EXISTS products (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        code TEXT NOT NULL UNIQUE,
        name TEXT NOT NULL,
        image TEXT,
        cost_price DECIMAL(10,2) NOT NULL,
        selling_price DECIMAL(10,2) NOT NULL,
        profit_margin DECIMAL(5,2),
        category_id INTEGER,
        current_stock INTEGER DEFAULT 0,
        minimum_stock INTEGER DEFAULT 0,
        unit TEXT NOT NULL,
        company_id INTEGER NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (category_id) REFERENCES product_categories(id),
        FOREIGN KEY (company_id) REFERENCES companies(id)
    )
`);
    });
}
// Database setup
const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('Error connecting to database:', err);
    } else {
        console.log('Connected to SQLite database');
        createTables();
        checkAndCreateAdminUser();
    }
});

// Atualizar a função createAdminUser
async function createAdminUser() {
    try {
        const adminPassword = await bcrypt.hash('admin123', 10);
        db.run(`
          INSERT INTO employees (
              fullName, 
              username, 
              email, 
              password, 
              phone, 
              cpf, 
              role,
              avatar
          )
          VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `, [
            'Administrador',
            'admin',
            'admin@example.com',
            adminPassword,
            '(00) 00000-0000',
            '000.000.000-00',
            'admin',
            null
        ], (err) => {
            if (err) {
                console.error('Erro ao criar usuário admin:', err);
            } else {
                console.log('Usuário admin criado com sucesso');
            }
        });
    } catch (error) {
        console.error('Erro ao criar hash da senha:', error);
    }
}

// Middleware de autenticação
const verifyToken = (req, res, next) => {
    const bearerHeader = req.headers['authorization'];
    if (!bearerHeader) {
        return res.status(401).json({ message: 'Token não fornecido' });
    }

    const token = bearerHeader.split(' ')[1];
    jwt.verify(token, 'your-secret-key', (err, decoded) => {
        if (err) {
            return res.status(401).json({ message: 'Token inválido' });
        }
        req.user = decoded;
        next();
    });
};

// Middleware de verificação de admin
const isAdmin = (req, res, next) => {
    if (req.user.role !== 'admin') {
        return res.status(403).json({ message: 'Acesso negado' });
    }
    next();
};

// Rota de teste
app.get('/api/test', (req, res) => {
    res.json({ message: 'API está funcionando!' });
});

// Rota de login
app.post('/api/auth/login', async (req, res) => {
    const { username, password } = req.body;

    db.get('SELECT * FROM employees WHERE username = ?', [username], async (err, user) => {
        if (err) {
            return res.status(500).json({ message: 'Erro no servidor' });
        }
        if (!user) {
            return res.status(401).json({ message: 'Usuário não encontrado' });
        }

        const validPassword = await bcrypt.compare(password, user.password);
        if (!validPassword) {
            return res.status(401).json({ message: 'Senha incorreta' });
        }

        const token = jwt.sign(
            { id: user.id, username: user.username, role: user.role },
            'your-secret-key',
            { expiresIn: '24h' }
        );

        res.json({
            token,
            user: {
                id: user.id,
                username: user.username,
                fullName: user.fullName,
                email: user.email,
                phone: user.phone,
                role: user.role,
                avatar: user.avatar
            }
        });
    });
});

// Rota para obter dados do usuário
app.get('/api/profile', verifyToken, async (req, res) => {
    console.log('Requisição recebida em /api/profile');
    console.log('User ID:', req.user.id);

    try {
        const user = await new Promise((resolve, reject) => {
            db.get(
                'SELECT id, fullName, username, email, phone, role, avatar FROM employees WHERE id = ?',
                [req.user.id],
                (err, row) => {
                    if (err) reject(err);
                    else resolve(row);
                }
            );
        });

        if (user) {
            if (user.avatar) {
                user.avatar = user.avatar.replace(/\\/g, '/');
            }
            res.json(user);
        } else {
            res.status(404).json({ message: 'Usuário não encontrado' });
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Erro ao buscar perfil' });
    }
});

// Rota para atualizar perfil
app.put('/api/profile', verifyToken, upload.single('avatar'), async (req, res) => {
    try {
        const { id } = req.user;
        const { fullName, email, phone, currentPassword, newPassword } = req.body;

        // Se estiver alterando a senha, verifica a senha atual
        if (newPassword) {
            const user = await new Promise((resolve, reject) => {
                db.get('SELECT password FROM employees WHERE id = ?', [id], (err, row) => {
                    if (err) reject(err);
                    else resolve(row);
                });
            });

            const validPassword = await bcrypt.compare(currentPassword, user.password);
            if (!validPassword) {
                return res.status(400).json({ message: 'Senha atual incorreta' });
            }
        }

        let updateQuery = 'UPDATE employees SET fullName = ?, email = ?, phone = ?';
        let params = [fullName, email, phone];

        // Se uma nova imagem foi enviada
        if (req.file) {
            // Remove a antiga imagem se existir
            const currentUser = await new Promise((resolve, reject) => {
                db.get('SELECT avatar FROM employees WHERE id = ?', [id], (err, row) => {
                    if (err) reject(err);
                    else resolve(row);
                });
            });

            if (currentUser?.avatar) {
                try {
                    fs.unlinkSync(currentUser.avatar);
                } catch (error) {
                    console.error('Erro ao deletar arquivo antigo:', error);
                }
            }

            updateQuery += ', avatar = ?';
            params.push(req.file.path);
        }

        // Se uma nova senha foi fornecida
        if (newPassword) {
            updateQuery += ', password = ?';
            const hashedPassword = await bcrypt.hash(newPassword, 10);
            params.push(hashedPassword);
        }

        updateQuery += ' WHERE id = ?';
        params.push(id);

        // Executa a atualização
        await new Promise((resolve, reject) => {
            db.run(updateQuery, params, function (err) {
                if (err) reject(err);
                else resolve(this);
            });
        });

        // Busca os dados atualizados do usuário
        const updatedUser = await new Promise((resolve, reject) => {
            db.get(
                'SELECT id, fullName, username, email, phone, role, avatar FROM employees WHERE id = ?',
                [id],
                (err, row) => {
                    if (err) reject(err);
                    else resolve(row);
                }
            );
        });

        if (updatedUser.avatar) {
            updatedUser.avatar = updatedUser.avatar.replace(/\\/g, '/');
        }

        res.json(updatedUser);
    } catch (error) {
        console.error('Erro na atualização do perfil:', error);
        res.status(500).json({ message: 'Erro ao atualizar perfil' });
    }
});

// Rota para remover avatar
app.post('/api/profile/remove-avatar', verifyToken, async (req, res) => {
    try {
        const { id } = req.user;

        // Busca o usuário atual para obter o caminho da foto
        const currentUser = await new Promise((resolve, reject) => {
            db.get('SELECT avatar FROM employees WHERE id = ?', [id], (err, row) => {
                if (err) reject(err);
                else resolve(row);
            });
        });

        // Remove o arquivo se existir
        if (currentUser?.avatar) {
            try {
                fs.unlinkSync(currentUser.avatar);
            } catch (error) {
                console.error('Erro ao deletar arquivo:', error);
            }
        }

        // Atualiza o banco de dados
        await new Promise((resolve, reject) => {
            db.run('UPDATE employees SET avatar = NULL WHERE id = ?', [id], function (err) {
                if (err) reject(err);
                else resolve(this);
            });
        });

        // Retorna os dados atualizados do usuário
        const updatedUser = await new Promise((resolve, reject) => {
            db.get(
                'SELECT id, fullName, username, email, phone, role, avatar FROM employees WHERE id = ?',
                [id],
                (err, row) => {
                    if (err) reject(err);
                    else resolve(row);
                }
            );
        });

        res.json(updatedUser);
    } catch (error) {
        console.error('Erro ao remover avatar:', error);
        res.status(500).json({ message: 'Erro ao remover avatar' });
    }
});

// Rotas de funcionários
app.get('/api/employees', verifyToken, isAdmin, (req, res) => {
    db.all('SELECT id, fullName, username, email, phone, cpf, role FROM employees', [], (err, rows) => {
        if (err) {
            return res.status(500).json({ message: 'Erro ao buscar funcionários' });
        }
        res.json(rows);
    });
});

app.post('/api/employees', verifyToken, isAdmin, async (req, res) => {
    const { fullName, username, email, password, phone, cpf, role } = req.body;
    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        db.run(`
          INSERT INTO employees (
              fullName, 
              username, 
              email, 
              password, 
              phone, 
              cpf, 
              role,
              avatar
          )
          VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `, [
            fullName,
            username,
            email,
            hashedPassword,
            phone,
            cpf,
            role,
            null
        ], function (err) {
            if (err) {
                console.error('Erro ao criar funcionário:', err);
                return res.status(500).json({ message: 'Erro ao criar funcionário' });
            }
            res.json({
                id: this.lastID,
                fullName,
                username,
                email,
                phone,
                cpf,
                role,
                avatar: null
            });
        });
    } catch (error) {
        console.error('Erro ao criar funcionário:', error);
        res.status(500).json({ message: 'Erro ao criar funcionário' });
    }
});

app.put('/api/employees/:id', verifyToken, isAdmin, async (req, res) => {
    const { id } = req.params;
    const { fullName, username, email, phone, cpf, role } = req.body;

    db.run(`
        UPDATE employees 
        SET fullName = ?, username = ?, email = ?, phone = ?, cpf = ?, role = ?
        WHERE id = ?
    `, [fullName, username, email, phone, cpf, role, id], function (err) {
        if (err) {
            return res.status(500).json({ message: 'Erro ao atualizar funcionário' });
        }
        if (this.changes === 0) {
            return res.status(404).json({ message: 'Funcionário não encontrado' });
        }
        res.json({ id, fullName, username, email, phone, cpf, role });
    });
});

app.delete('/api/employees/:id', verifyToken, isAdmin, (req, res) => {
    const { id } = req.params;
    db.run('DELETE FROM employees WHERE id = ?', [id], function (err) {
        if (err) {
            return res.status(500).json({ message: 'Erro ao deletar funcionário' });
        }
        if (this.changes === 0) {
            return res.status(404).json({ message: 'Funcionário não encontrado' });
        }
        res.json({ message: 'Funcionário deletado com sucesso' });
    });
});

// Rotas de empresas
app.get('/api/companies', verifyToken, (req, res) => {
    db.all('SELECT * FROM companies', [], (err, rows) => {
        if (err) {
            console.error('Erro ao buscar empresas:', err);
            return res.status(500).json({ message: 'Erro ao buscar empresas' });
        }
        console.log('Empresas encontradas:', rows);
        res.json(rows);
    });
});

app.post('/api/companies', verifyToken, isAdmin, (req, res) => {
    const { name, cnpj } = req.body;
    db.run('INSERT INTO companies (name, cnpj) VALUES (?, ?)',
        [name, cnpj],
        function (err) {
            if (err) {
                return res.status(500).json({ message: 'Erro ao criar empresa' });
            }
            res.json({ id: this.lastID, name, cnpj });
        }
    );
});

app.put('/api/companies/:id', verifyToken, isAdmin, (req, res) => {
    const { id } = req.params;
    const { name, cnpj } = req.body;
    db.run('UPDATE companies SET name = ?, cnpj = ? WHERE id = ?',
        [name, cnpj, id],
        function (err) {
            if (err) {
                return res.status(500).json({ message: 'Erro ao atualizar empresa' });
            }
            res.json({ id, name, cnpj });
        }
    );
});

app.delete('/api/companies/:id', verifyToken, isAdmin, (req, res) => {
    const { id } = req.params;
    db.run('DELETE FROM companies WHERE id = ?', [id], function (err) {
        if (err) {
            return res.status(500).json({ message: 'Erro ao deletar empresa' });
        }
        res.json({ message: 'Empresa deletada com sucesso' });
    });
});

// Rotas para gerenciar funcionários na empresa
app.get('/api/companies/:id/employees', verifyToken, isAdmin, (req, res) => {
    const { id } = req.params;
    db.all(`
      SELECT e.* FROM employees e
      INNER JOIN company_employees ce ON e.id = ce.employee_id
      WHERE ce.company_id = ?
  `, [id], (err, rows) => {
        if (err) {
            return res.status(500).json({ message: 'Erro ao buscar funcionários da empresa' });
        }
        res.json(rows);
    });
});

app.post('/api/companies/:id/employees', verifyToken, isAdmin, (req, res) => {
    const { id } = req.params;
    const { employeeId } = req.body;
    db.run('INSERT INTO company_employees (company_id, employee_id) VALUES (?, ?)',
        [id, employeeId],
        function (err) {
            if (err) {
                return res.status(500).json({ message: 'Erro ao vincular funcionário à empresa' });
            }
            res.json({ message: 'Funcionário vinculado com sucesso' });
        }
    );
});

app.delete('/api/companies/:companyId/employees/:employeeId', verifyToken, isAdmin, (req, res) => {
    const { companyId, employeeId } = req.params;
    db.run('DELETE FROM company_employees WHERE company_id = ? AND employee_id = ?',
        [companyId, employeeId],
        function (err) {
            if (err) {
                return res.status(500).json({ message: 'Erro ao desvincular funcionário da empresa' });
            }
            res.json({ message: 'Funcionário desvinculado com sucesso' });
        }
    );
});

// Rota para obter a empresa do usuário logado
app.get('/api/user/company', verifyToken, (req, res) => {
    const { id } = req.user;
    db.get(`
      SELECT c.* FROM companies c
      INNER JOIN company_employees ce ON c.id = ce.company_id
      WHERE ce.employee_id = ?
  `, [id], (err, row) => {
        if (err) {
            return res.status(500).json({ message: 'Erro ao buscar empresa do usuário' });
        }
        res.json(row || null);
    });
});

// Rotas para categorias de produtos
app.get('/api/product-categories', verifyToken, (req, res) => {
    db.all('SELECT * FROM product_categories ORDER BY name', [], (err, rows) => {
        if (err) {
            return res.status(500).json({ message: 'Erro ao buscar categorias' });
        }
        res.json(rows);
    });
});

app.post('/api/product-categories', verifyToken, isAdmin, (req, res) => {
    const { name } = req.body;
    db.run('INSERT INTO product_categories (name) VALUES (?)',
        [name],
        function(err) {
            if (err) {
                return res.status(500).json({ message: 'Erro ao criar categoria' });
            }
            res.json({ id: this.lastID, name });
        }
    );
});

// Rotas para produtos
app.get('/api/products', verifyToken, (req, res) => {
    const companyId = req.query.companyId;
    const query = `
        SELECT p.*, pc.name as category_name 
        FROM products p
        LEFT JOIN product_categories pc ON p.category_id = pc.id
        WHERE p.company_id = ?
        ORDER BY p.name
    `;
    
    db.all(query, [companyId], (err, rows) => {
        if (err) {
            return res.status(500).json({ message: 'Erro ao buscar produtos' });
        }
        res.json(rows);
    });
});

app.post('/api/products', verifyToken, isAdmin, upload.single('image'), (req, res) => {
    const {
        code,
        name,
        cost_price,
        selling_price,
        profit_margin,
        category_id,
        current_stock,
        minimum_stock,
        unit,
        company_id
    } = req.body;

    const image = req.file ? req.file.path : null;

    // Converta os valores para números
    const numericValues = {
        cost_price: parseFloat(cost_price),
        selling_price: parseFloat(selling_price),
        profit_margin: parseFloat(profit_margin),
        current_stock: parseInt(current_stock),
        minimum_stock: parseInt(minimum_stock),
        category_id: parseInt(category_id),
        company_id: parseInt(company_id)
    };

    db.run(`
        INSERT INTO products (
            code,
            name,
            image,
            cost_price,
            selling_price,
            profit_margin,
            category_id,
            current_stock,
            minimum_stock,
            unit,
            company_id
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
        code,
        name,
        image,
        numericValues.cost_price,
        numericValues.selling_price,
        numericValues.profit_margin,
        numericValues.category_id,
        numericValues.current_stock,
        numericValues.minimum_stock,
        unit,
        numericValues.company_id
    ], function(err) {
        if (err) {
            console.error('Erro ao criar produto:', err);
            return res.status(500).json({ message: 'Erro ao criar produto' });
        }
        res.json({
            id: this.lastID,
            code,
            name,
            image,
            ...numericValues,
            unit
        });
    });
});

app.put('/api/products/:id', verifyToken, isAdmin, upload.single('image'), async (req, res) => {
    const { id } = req.params;
    const {
        code,
        name,
        cost_price,
        selling_price,
        profit_margin,
        category_id,
        current_stock,
        minimum_stock,
        unit,
        company_id
    } = req.body;

    try {
        // Se uma nova imagem foi enviada, remove a antiga
        if (req.file) {
            const oldProduct = await new Promise((resolve, reject) => {
                db.get('SELECT image FROM products WHERE id = ?', [id], (err, row) => {
                    if (err) reject(err);
                    else resolve(row);
                });
            });

            if (oldProduct?.image) {
                try {
                    fs.unlinkSync(oldProduct.image);
                } catch (error) {
                    console.error('Erro ao deletar imagem antiga:', error);
                }
            }
        }

        const image = req.file ? req.file.path : undefined;

        let updateQuery = `
            UPDATE products 
            SET code = ?,
                name = ?,
                cost_price = ?,
                selling_price = ?,
                profit_margin = ?,
                category_id = ?,
                current_stock = ?,
                minimum_stock = ?,
                unit = ?,
                company_id = ?
        `;
        const params = [
            code,
            name,
            cost_price,
            selling_price,
            profit_margin,
            category_id,
            current_stock,
            minimum_stock,
            unit,
            company_id
        ];

        if (image) {
            updateQuery += ', image = ?';
            params.push(image);
        }

        updateQuery += ' WHERE id = ?';
        params.push(id);

        db.run(updateQuery, params, function(err) {
            if (err) {
                return res.status(500).json({ message: 'Erro ao atualizar produto' });
            }
            if (this.changes === 0) {
                return res.status(404).json({ message: 'Produto não encontrado' });
            }
            res.json({
                id,
                code,
                name,
                image: image || undefined,
                cost_price,
                selling_price,
                profit_margin,
                category_id,
                current_stock,
                minimum_stock,
                unit,
                company_id
            });
        });
    } catch (error) {
        res.status(500).json({ message: 'Erro ao atualizar produto' });
    }
});

app.delete('/api/products/:id', verifyToken, isAdmin, async (req, res) => {
    const { id } = req.params;
    try {
        // Busca a imagem do produto antes de deletar
        const product = await new Promise((resolve, reject) => {
            db.get('SELECT image FROM products WHERE id = ?', [id], (err, row) => {
                if (err) reject(err);
                else resolve(row);
            });
        });

        // Remove o produto do banco de dados
        db.run('DELETE FROM products WHERE id = ?', [id], function(err) {
            if (err) {
                return res.status(500).json({ message: 'Erro ao deletar produto' });
            }
            if (this.changes === 0) {
                return res.status(404).json({ message: 'Produto não encontrado' });
            }

            // Se o produto tinha uma imagem, remove o arquivo
            if (product?.image) {
                try {
                    fs.unlinkSync(product.image);
                } catch (error) {
                    console.error('Erro ao deletar imagem:', error);
                }
            }

            res.json({ message: 'Produto deletado com sucesso' });
        });
    } catch (error) {
        res.status(500).json({ message: 'Erro ao deletar produto' });
    }
});

// Inicialização do servidor
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});