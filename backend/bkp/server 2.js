const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

// Middleware para autenticação
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        console.error("🔴 Token ausente ou inválido:", authHeader);
        return res.status(401).json({ error: "Acesso negado" });
    }

    const token = authHeader.split(' ')[1];
    console.log("🟢 Token recebido no backend:", token);

    jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
        if (err) {
            console.error("🔴 Token inválido ou expirado:", err);
            return res.status(403).json({ error: "Token inválido" });
        }

        console.log("🟢 Token validado com sucesso:", decoded);
        req.user = decoded;
        next();
    });
};

// Rota para obter o nível do usuário
app.get('/api/user-level', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.id;
        const { rows } = await pool.query(
            "SELECT users_levels_id FROM tb_traffic_users WHERE id = $1",
            [userId]
        );

        if (rows.length === 0) {
            return res.status(404).json({ error: "Usuário não encontrado" });
        }

        res.json({ level_id: rows[0].users_levels_id });
    } catch (error) {
        res.status(500).json({ error: "Erro ao buscar nível do usuário" });
    }
});

// Rota de login
app.post('/api/login', async (req, res) => {
    const { username, password } = req.body;

    try {
        const userResult = await pool.query(
            "SELECT id, username, password, users_levels_id FROM tb_traffic_users WHERE username = $1",
            [username]
        );

        if (userResult.rows.length === 0) {
            return res.status(401).json({ error: "Usuário não encontrado" });
        }

        const user = userResult.rows[0];

        const senhaCorreta = await bcrypt.compare(password, user.password);
        if (!senhaCorreta) {
            return res.status(401).json({ error: "Senha incorreta" });
        }

        const token = jwt.sign(
            { id: user.id, username: user.username, level_id: user.users_levels_id }, // Adicionando level_id
            process.env.JWT_SECRET,
            { expiresIn: "15m" }
        );

        console.log("Token gerado no Login:", token);

        res.json({ token, userId: user.id });
    } catch (err) {
        res.status(500).json({ error: "Erro no login" });
    }
});


// Rota para listar tráfegos
app.get('/api/traffic', authenticateToken, async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT 
                t.id, 
                t.open_date, 
                t.delivery_date, 
                t.subject AS subject, 
                t.description AS description,
                t.summary_description AS summary_description,
                s.id AS status_id,
                s.status_name AS status_name,
                t.id_account AS account_id,
                a.account_name AS account_name, 
                u.name AS responsible_name 
            FROM tb_traffic t 
            LEFT JOIN tb_accounts a ON t.id_account = a.id 
            LEFT JOIN tb_traffic_users u ON t.id_responsible = u.id 
            LEFT JOIN tb_status s ON t.id_status = s.id 
            ORDER BY t.open_date DESC
        `);

        //console.log("Dados retornados pelo backend:", result.rows); // Debug para conferir se os dados estão certos

        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Rota para listar Contas Publicitárias
app.get('/api/accounts', authenticateToken, async (req, res) => {
    try {
        const { rows } = await pool.query("SELECT id, account_name FROM tb_accounts ORDER BY account_name ASC");
        res.json(rows);
    } catch (error) {
        console.error("Erro ao buscar contas:", error);
        res.status(500).json({ error: "Erro ao buscar contas" });
    }
});

// Rota para listar Situações
app.get('/api/statuses', authenticateToken, async (req, res) => {
    try {
        const { rows } = await pool.query("SELECT id, status_name FROM tb_status ORDER BY status_name ASC");
        res.json(rows);
    } catch (error) {
        console.error("Erro ao buscar situações:", error);
        res.status(500).json({ error: "Erro ao buscar situações" });
    }
});

// Nova Rota: Buscar detalhes do tráfego e acompanhamentos
app.get('/api/traffic/:id', authenticateToken, async (req, res) => {
    try {
        const trafficId = req.params.id;

        const trafficResult = await pool.query(`
            SELECT 
                t.id, 
                t.open_date, 
                t.delivery_date, 
                t.subject AS subject, 
                t.description AS description, 
                t.summary_description AS summary_description,
                s.status_name AS status_name, 
                c.company AS client_name, 
                a.account_name AS account_name, 
                u.name AS responsible_name
            FROM tb_traffic t 
            LEFT JOIN tb_clients c ON t.id_client = c.id 
            LEFT JOIN tb_accounts a ON t.id_account = a.id 
            LEFT JOIN tb_traffic_users u ON t.id_responsible = u.id 
            LEFT JOIN tb_status s ON t.id_status = s.id 
            WHERE t.id = $1
        `, [trafficId]);

        if (trafficResult.rows.length === 0) {
            return res.status(404).json({ error: "Tráfego não encontrado" });
        }

        const followupsResult = await pool.query(`
            SELECT 
                f.id, 
                f.description, 
                f.event_date, 
                f.responsible_return,
                u.name AS responsible_name 
            FROM tb_traffic_followups f
            LEFT JOIN tb_traffic_users u ON f.user_id = u.id
            WHERE f.traffic_id = $1
            ORDER BY f.event_date DESC
        `, [trafficId]);

        res.json({
            traffic: trafficResult.rows[0],
            followups: followupsResult.rows
        });

    } catch (error) {
        console.error("Erro ao buscar tráfego:", error);
        res.status(500).json({ error: "Erro ao buscar tráfego" });
    }
});

// Rota para Cadastrar Novos Tráfegos (com envio de e-mail corrigido)
// Rota para Cadastrar Novos Tráfegos (corrigido data e acompanhamento) [18/03/2025 - 16:12]
app.post('/api/traffic', authenticateToken, async (req, res) => {
    try {
        if (req.user.level_id !== 1) {
            return res.status(403).json({ error: "Acesso negado. Apenas administradores podem criar tráfegos." });
        }

        const { open_date, subject, description, account_id, status_id, delivery_date, contacts } = req.body;
        const id_responsible = req.user.id;

        if (!open_date || !subject || !description || !account_id || !status_id || !delivery_date) {
            return res.status(400).json({ error: "Todos os campos são obrigatórios." });
        }

        // 🔍 Buscar id_client com base na account_id
        const clientResult = await pool.query("SELECT id_client FROM tb_accounts WHERE id = $1", [account_id]);
        if (clientResult.rows.length === 0) {
            return res.status(400).json({ error: "Conta não encontrada." });
        }
        const id_client = clientResult.rows[0].id_client;

        console.log("📌 Dados recebidos no backend:", req.body);

        // 🔹 Inserir tráfego no banco de dados
        const result = await pool.query(
            `INSERT INTO tb_traffic (open_date, subject, description, summary_description, id_account, id_status, delivery_date, id_client, id_responsible)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING id`,
            [open_date, subject, description.replace(/\n/g, "<br>"), description.substring(0, 100) + "...", account_id, status_id, delivery_date, id_client, id_responsible]
        );

        const newTrafficId = result.rows[0].id;
        console.log("✅ Tráfego criado no banco:", newTrafficId);

        // 🔹 Criar acompanhamento inicial automaticamente
        const userNameResult = await pool.query("SELECT name FROM tb_traffic_users WHERE id = $1", [id_responsible]);
        const userName = userNameResult.rows[0].name;

        const acompanhamentoTexto = `Tráfego criado por ${userName} em ${new Date().toLocaleDateString('pt-BR')}. Aguardando as próximas ações.`;

        await pool.query(
            `INSERT INTO tb_traffic_followups (traffic_id, user_id, description, event_date, responsible_return)
            VALUES ($1, $2, $3, NOW() AT TIME ZONE 'America/Sao_Paulo', 'PSC')`,
            [newTrafficId, id_responsible, acompanhamentoTexto]
        );

        console.log(`✅ Acompanhamento inicial criado para o tráfego ${newTrafficId}`);

        // 🔹 Buscar nomes de conta e status para o e-mail
        const nomeConta = await getAccountName(account_id);
        const nomeStatus = await getStatusName(status_id);

        // 🔹 Buscar acompanhamento inicial para incluir no e-mail (garantindo que ele já foi salvo)
        const acompanhamentoInicial = await pool.query(
            `SELECT description, TO_CHAR(event_date, 'DD/MM/YYYY') AS event_date 
             FROM tb_traffic_followups 
             WHERE traffic_id = $1 ORDER BY event_date ASC LIMIT 1`,
            [newTrafficId]
        );

        const acompanhamento = acompanhamentoInicial.rows.length > 0 ? acompanhamentoInicial.rows[0] : null;

        // 🔹 Vincular contatos ao tráfego
        if (contacts && contacts.length > 0) {
            for (const contactId of contacts) {
                await pool.query("INSERT INTO tb_traffic_contacts (id_traffic, id_contact) VALUES ($1, $2)", [newTrafficId, contactId]);
                console.log(`➕ Contato ${contactId} vinculado ao tráfego ${newTrafficId}`);
            }
        }

        // 🔹 Enviar e-mail de notificação (com data corrigida e acompanhamento)
        await enviarEmailCriacaoTrafego(newTrafficId, {
            subject,
            description,
            delivery_date: new Date(delivery_date).toLocaleDateString('pt-BR'),  // 📌 Agora a data está correta
            account_name: nomeConta,
            status_name: nomeStatus,
            acompanhamento_inicial: acompanhamento // 📌 Agora o acompanhamento vem no e-mail
        });

        console.log("📧 E-mail enviado com sucesso!");

        res.status(201).json({ message: "Tráfego criado com sucesso.", id: newTrafficId });

    } catch (error) {
        console.error("🔴 Erro ao criar tráfego:", error);
        res.status(500).json({ error: "Erro ao criar tráfego." });
    }
});

// Função para envio de notificação de novo tráfego
const enviarEmailCriacaoTrafego = async (trafficId) => {
    try {
        console.log(`📌 [enviarEmailCriacaoTrafego] Iniciando envio de notificação de criação para tráfego ID: ${trafficId}`);

        // 🔍 Buscar detalhes do tráfego
        const trafficResult = await pool.query(`
            SELECT t.subject, t.description, 
                   TO_CHAR(t.delivery_date, 'DD/MM/YYYY') AS delivery_date, 
                   a.account_name, s.status_name
            FROM tb_traffic t
            LEFT JOIN tb_accounts a ON t.id_account = a.id
            LEFT JOIN tb_status s ON t.id_status = s.id
            WHERE t.id = $1
        `, [trafficId]);

        if (trafficResult.rows.length === 0) {
            console.log(`[enviarEmailCriacaoTrafego] ⚠️ Nenhum tráfego encontrado com ID ${trafficId}`);
            return;
        }

        const traffic = trafficResult.rows[0];

        // 🔍 Buscar o acompanhamento inicial (garantindo que ele já foi salvo no banco)
        const acompanhamentoInicialResult = await pool.query(
            `SELECT description, TO_CHAR(event_date, 'DD/MM/YYYY') AS event_date, u.name AS user_name 
             FROM tb_traffic_followups f
             LEFT JOIN tb_traffic_users u ON f.user_id = u.id
             WHERE f.traffic_id = $1 
             ORDER BY event_date ASC 
             LIMIT 1`, 
            [trafficId]
        );

        let acompanhamentoInicial = "<p>Nenhum acompanhamento inicial registrado.</p>";
        if (acompanhamentoInicialResult.rows.length > 0) {
            const a = acompanhamentoInicialResult.rows[0];
            acompanhamentoInicial = `<p><strong>${a.event_date}</strong> | ${a.description} <em>(${a.user_name})</em></p>`;
        }

        // 🔍 Buscar contatos vinculados ao tráfego
        const contactsResult = await pool.query(`
            SELECT c.name, c.email
            FROM tb_traffic_contacts tc
            JOIN tb_contacts c ON tc.id_contact = c.id
            WHERE tc.id_traffic = $1
        `, [trafficId]);

        if (contactsResult.rows.length === 0) {
            console.log(`[enviarEmailCriacaoTrafego] ⚠️ Nenhum contato encontrado para o tráfego ${trafficId}`);
            return;
        }

        const recipients = contactsResult.rows;
        console.log("[enviarEmailCriacaoTrafego] ✅ Contatos carregados:", recipients);

        // 🚀 Enviar e-mail para cada contato vinculado
        for (const contact of recipients) {
            const corpoEmail = `
                <p>Olá, <strong>${contact.name}</strong>,</p>
                <p>Este é um aviso de que um novo tráfego foi criado no Sistema de Tráfego da Agência macrobrasil.com. Confira os detalhes:</p>

                <h3>📌 Capa do Tráfego</h3>
                <p><strong>Data de Entrega:</strong> ${traffic.delivery_date}</p>
                <p><strong>Conta:</strong> ${traffic.account_name}</p>
                <p><strong>Status:</strong> ${traffic.status_name}</p>
                <p><strong>Descrição:</strong> ${traffic.description.replace(/\n/g, "<br>")}</p>

                <h3>📝 Acompanhamento Inicial</h3>
                ${acompanhamentoInicial}

                <p>Para saber mais, acesse o Sistema de Tráfego ou fale diretamente com o pessoal do Marketing ou da Agência macrobrasil.com.</p>

                <hr>
                <p><em>Sistema de Tráfego | Agência macrobrasil.com | Felipe Almeida & J.A.R.V.I.S | xFA | Versão Beta, 19 de março de 2025.</em></p>
            `;

            await transporter.sendMail({
                from: '"Sistema de Tráfego" <no-reply@macrobrasil.com>',
                to: contact.email,
                subject: `OURO FINO | ${traffic.account_name} | NOVO TRÁFEGO CRIADO [${trafficId}]`,
                html: corpoEmail,
            });

            console.log(`📧 E-mail enviado com sucesso para ${contact.email}`);
        }

    } catch (error) {
        console.error("🔴 Erro ao enviar e-mail de criação de tráfego:", error);
    }
};





const moment = require("moment-timezone");

const twilio = require("twilio");

// Substitua pelos seus dados
const client = twilio(
    "ACba960de291f9a0c7d1d5f0634aeda6f", // Account SID
    "a6ea72674f2a08438f465d5af031c90a"  // Auth Token
);

// Número do WhatsApp da Twilio
const TWILIO_WHATSAPP_NUMBER = "whatsapp:+14155238886";

// Função para enviar WhatsApp
const sendWhatsAppNotification = async (phone, message) => {
    try {
        console.log(`📲 Tentando enviar WhatsApp para: ${phone}`);
        console.log(`📌 Mensagem: ${message}`);

        const response = await client.messages.create({
            body: message,
            from: "whatsapp:+14155238886", // 📌 Número correto do Twilio
            to: `whatsapp:${phone}`
        });

        console.log(`✅ WhatsApp enviado com sucesso para ${phone}!`);
        console.log(`📌 Resposta da API Twilio:`, response);

    } catch (error) {
        console.error("🔴 Erro ao enviar WhatsApp:", error);
    }
};

// Rota para Cadastrar Novos Acompanhamentos no Tráfego, com envio de e-mail
app.post('/api/traffic/:id/followup', authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;
        const { description, responsible_return } = req.body;
        const userId = req.user.id;

        if (!description || !responsible_return) {
            return res.status(400).json({ error: "Todos os campos são obrigatórios." });
        }

        // 🔍 Verificar se o tráfego existe
        const trafficExists = await pool.query("SELECT * FROM tb_traffic WHERE id = $1", [id]);
        if (trafficExists.rows.length === 0) {
            return res.status(404).json({ error: "Tráfego não encontrado." });
        }

        // 🔄 Inserir acompanhamento no banco
        const result = await pool.query(
            `INSERT INTO tb_traffic_followups (traffic_id, user_id, event_date, description, responsible_return) 
             VALUES ($1, $2, NOW() AT TIME ZONE 'America/Sao_Paulo', $3, $4) 
             RETURNING id, description, TO_CHAR(event_date, 'DD/MM/YYYY') AS event_date`, 
            [id, userId, description, responsible_return]
        );

        console.log("✅ Novo acompanhamento cadastrado:", result.rows[0].id);

        // 🔍 Buscar nome do usuário que adicionou o acompanhamento
        const userResult = await pool.query("SELECT name FROM tb_traffic_users WHERE id = $1", [userId]);
        const userName = userResult.rows.length > 0 ? userResult.rows[0].name : "Desconhecido";

        // 📩 Enviar e-mail destacando o novo acompanhamento
        await enviarEmailNovoAcompanhamento(id, {
            description: result.rows[0].description,
            event_date: result.rows[0].event_date,
            user_name: userName
        });

        console.log("📧 E-mail enviado com sucesso para o novo acompanhamento.");

        res.status(201).json({ message: "Acompanhamento cadastrado com sucesso." });

    } catch (error) {
        console.error("🔴 Erro ao criar acompanhamento:", error);
        res.status(500).json({ error: "Erro ao criar acompanhamento." });
    }
});

// Função para envio de notificação de novo acompanhamento
const enviarEmailNovoAcompanhamento = async (trafficId, novoAcompanhamento) => {
    try {
        console.log(`📌 [enviarEmailNovoAcompanhamento] Iniciando envio de notificação para tráfego ID: ${trafficId}`);

        // 🔍 Buscar detalhes do tráfego
        const trafficResult = await pool.query(`
            SELECT t.subject, t.description, 
                   TO_CHAR(t.delivery_date, 'DD/MM/YYYY') AS delivery_date, 
                   a.account_name, s.status_name
            FROM tb_traffic t
            LEFT JOIN tb_accounts a ON t.id_account = a.id
            LEFT JOIN tb_status s ON t.id_status = s.id
            WHERE t.id = $1
        `, [trafficId]);

        if (trafficResult.rows.length === 0) {
            console.log(`[enviarEmailNovoAcompanhamento] ⚠️ Nenhum tráfego encontrado com ID ${trafficId}`);
            return;
        }

        const traffic = trafficResult.rows[0];

        // 🔍 Buscar os 3 últimos acompanhamentos, excluindo o novo
        const acompanhamentosResult = await pool.query(
            `SELECT f.description, TO_CHAR(f.event_date, 'DD/MM/YYYY') AS event_date, u.name AS user_name 
             FROM tb_traffic_followups f
             LEFT JOIN tb_traffic_users u ON f.user_id = u.id
             WHERE f.traffic_id = $1 
             ORDER BY f.event_date DESC 
             LIMIT 4`, 
            [trafficId]
        );

        let acompanhamentosAntigos = acompanhamentosResult.rows.length > 1 
            ? acompanhamentosResult.rows.slice(1, 4) 
            : [];

        const acompanhamentosHTML = acompanhamentosAntigos.length > 0 
            ? acompanhamentosAntigos.map(a => `<p><strong>${a.event_date}</strong> | ${a.description} <em>(${a.user_name})</em></p>`).join("") 
            : "<p>Nenhum acompanhamento recente.</p>";

        // 🔍 Buscar contatos vinculados ao tráfego
        const contactsResult = await pool.query(`
            SELECT c.name, c.email
            FROM tb_traffic_contacts tc
            JOIN tb_contacts c ON tc.id_contact = c.id
            WHERE tc.id_traffic = $1
        `, [trafficId]);

        if (contactsResult.rows.length === 0) {
            console.log(`[enviarEmailNovoAcompanhamento] ⚠️ Nenhum contato encontrado para o tráfego ${trafficId}`);
            return;
        }

        const recipients = contactsResult.rows;
        console.log("[enviarEmailNovoAcompanhamento] ✅ Contatos carregados:", recipients);

        // 🚀 Enviar e-mail para cada contato vinculado
        for (const contact of recipients) {
            const corpoEmail = `
                <p>Olá, <strong>${contact.name}</strong>,</p>
                <p>Um novo acompanhamento foi registrado no Sistema de Tráfego da Agência macrobrasil.com. Confira os detalhes:</p>

                <h3>🆕 Novo Acompanhamento</h3>
                <p><strong>${novoAcompanhamento.event_date}</strong> | ${novoAcompanhamento.description} <em>(${novoAcompanhamento.user_name})</em></p>

                <h3>📌 Capa do Tráfego</h3>
                <p><strong>Data de Entrega:</strong> ${traffic.delivery_date}</p>
                <p><strong>Conta:</strong> ${traffic.account_name}</p>
                <p><strong>Status:</strong> ${traffic.status_name}</p>
                <p><strong>Descrição:</strong> ${traffic.description.replace(/\n/g, "<br>")}</p>

                <h3>📝 Últimos Acompanhamentos</h3>
                ${acompanhamentosHTML}

                <p>Para saber mais, acesse o Sistema de Tráfego ou fale diretamente com o pessoal do Marketing ou da Agência macrobrasil.com.</p>

                <hr>
                <p><em>Sistema de Tráfego | Agência macrobrasil.com | Felipe Almeida & J.A.R.V.I.S | xFA | Versão Beta, 19 de março de 2025.</em></p>
            `;

            await transporter.sendMail({
                from: '"Sistema de Tráfego" <no-reply@macrobrasil.com>',
                to: contact.email,
                subject: `OURO FINO | ${traffic.account_name} | NOVO ACOMPANHAMENTO [${trafficId}]`,
                html: corpoEmail,
            });

            console.log(`📧 E-mail enviado com sucesso para ${contact.email}`);
        }

    } catch (error) {
        console.error("🔴 Erro ao enviar e-mail de acompanhamento:", error);
    }
};





// Rota para Alterar os Tráfegos, com envio de e-mail
app.put('/api/traffic/:id', authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;
        const { delivery_date, account_id, status_id, contacts } = req.body;
        const userId = req.user.id;

        console.log(`📌 Iniciando atualização do tráfego ID: ${id}`);

        // 🔍 Buscar os dados antigos antes da atualização
        const dadosAntigosResult = await pool.query(
            `SELECT subject, description, TO_CHAR(delivery_date, 'DD/MM/YYYY') AS delivery_date, 
                    id_account, id_status 
             FROM tb_traffic WHERE id = $1`, 
            [id]
        );

        if (dadosAntigosResult.rows.length === 0) {
            return res.status(404).json({ error: "Tráfego não encontrado." });
        }

        const dadosAntigos = dadosAntigosResult.rows[0];

        console.log(`📌 Dados antigos do tráfego ${id}:`, dadosAntigos);

        // 🔄 Atualizar o tráfego no banco de dados
        await pool.query(
            `UPDATE tb_traffic 
             SET delivery_date = $1, id_account = $2, id_status = $3 
             WHERE id = $4`,
            [delivery_date, account_id, status_id, id]
        );

        console.log(`✅ Tráfego ${id} atualizado no banco.`);

        // 🔍 Buscar os dados novos após a atualização
        const dadosNovosResult = await pool.query(
            `SELECT subject, description, TO_CHAR(delivery_date, 'DD/MM/YYYY') AS delivery_date, 
                    id_account, id_status 
             FROM tb_traffic WHERE id = $1`, 
            [id]
        );

        const dadosNovos = dadosNovosResult.rows[0];

        console.log(`📌 Dados novos do tráfego ${id}:`, dadosNovos);

        // 🔄 Comparação de dados e inserção de acompanhamento automático
        const alteracoes = [];
        if (dadosAntigos.delivery_date !== dadosNovos.delivery_date) {
            alteracoes.push(`Data de Entrega: ${dadosAntigos.delivery_date} → ${dadosNovos.delivery_date}`);
        }
        if (dadosAntigos.id_account !== dadosNovos.id_account) {
            alteracoes.push(`Conta: ${dadosAntigos.id_account} → ${dadosNovos.id_account}`);
        }
        if (dadosAntigos.id_status !== dadosNovos.id_status) {
            alteracoes.push(`Status: ${dadosAntigos.id_status} → ${dadosNovos.id_status}`);
        }

        const descricaoAcompanhamento = alteracoes.length > 0
            ? `Tráfego atualizado por ${(await pool.query("SELECT name FROM tb_traffic_users WHERE id = $1", [userId])).rows[0].name} em ${new Date().toLocaleDateString('pt-BR')}. Alterações: ${alteracoes.join(", ")}.`
            : "Tráfego atualizado sem alterações significativas.";

        await pool.query(
            `INSERT INTO tb_traffic_followups (traffic_id, user_id, description, event_date, responsible_return)
             VALUES ($1, $2, $3, NOW() AT TIME ZONE 'America/Sao_Paulo', 'PSC')`,
            [id, userId, descricaoAcompanhamento]
        );

        console.log(`✅ Acompanhamento automático criado para alteração do tráfego ${id}.`);

        // 🔔 Enviar e-mail de alteração do tráfego
        await enviarEmailNotificacao(id, "alteracao_trafego", dadosAntigos, dadosNovos);

        res.json({ message: "Tráfego atualizado com sucesso." });

    } catch (error) {
        console.error("🔴 Erro ao atualizar tráfego:", error);
        res.status(500).json({ error: "Erro ao atualizar tráfego." });
    }
});

// Encontrar Contatos
app.get('/api/traffic/:id/contacts', authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;
        console.log(`🔍 Buscando contatos para o tráfego ID: ${id}`);

        const contactsResult = await pool.query(`
            SELECT c.id, c.name, c.email 
            FROM tb_traffic_contacts tc
            JOIN tb_contacts c ON tc.id_contact = c.id
            WHERE tc.id_traffic = $1
        `, [id]);

        console.log("📌 Contatos encontrados no banco:", contactsResult.rows);

        const linkedContactIds = contactsResult.rows.map(c => c.id);
        console.log("📌 IDs dos contatos vinculados:", linkedContactIds);

        res.json({ contacts: contactsResult.rows, linkedContactIds });
    } catch (error) {
        console.error("🔴 Erro ao buscar contatos:", error);
        res.status(500).json({ error: "Erro ao buscar contatos" });
    }
});

// Encontrar Contatos
app.get('/api/contacts', authenticateToken, async (req, res) => {
    try {
        const contactsResult = await pool.query("SELECT id, name, email FROM tb_contacts");
        res.json(contactsResult.rows);
    } catch (error) {
        console.error("🔴 Erro ao buscar todos os contatos:", error);
        res.status(500).json({ error: "Erro ao buscar contatos" });
    }
});

const nodemailer = require("nodemailer");

// Configurar o serviço de e-mails
const transporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 587,
    secure: false,
    auth: {
        user: "fdalmeida@macrobrasil.com.br",
        pass: "dcvcjlmajlafgouk"
    }
});

// 🔍 Função para obter os contatos vinculados ao tráfego
const getTrafficContacts = async (trafficId) => {
    const result = await pool.query(
        `SELECT c.email AS recipient_email, c.name AS recipient_name 
         FROM tb_traffic_contacts tc
         JOIN tb_contacts c ON tc.id_contact = c.id
         WHERE tc.id_traffic = $1`,
        [trafficId]
    );
    return result.rows;
};

// 🔄 Função para obter o nome da conta pelo ID
const getAccountName = async (accountId) => {
    if (!accountId) return "Desconhecido";
    const result = await pool.query('SELECT account_name FROM tb_accounts WHERE id = $1', [accountId]);
    return result.rows.length > 0 ? result.rows[0].account_name : "Desconhecido";
};

// 🔄 Função para obter o nome do status pelo ID
const getStatusName = async (statusId) => {
    if (!statusId) return "Desconhecido";
    const result = await pool.query('SELECT status_name FROM tb_status WHERE id = $1', [statusId]);
    return result.rows.length > 0 ? result.rows[0].status_name : "Desconhecido";
};

// 🚀 Função para envio de e-mail com os dados corrigidos
const enviarEmailNotificacao = async (trafficId, tipo, dadosAntigos, dadosNovos) => {
    try {
        console.log(`📌 Iniciando envio de notificação para tráfego ID: ${trafficId}`);

        // 🔍 Buscar todos os contatos do tráfego
        const contatos = await getTrafficContacts(trafficId);

        if (contatos.length === 0) {
            console.log("⚠ Nenhum contato encontrado para este tráfego.");
            return;
        }

        // 🔄 Obter os nomes de Conta e Status para os valores **atuais e antigos**
        const nomeContaNova = await getAccountName(dadosNovos.id_account);
        const nomeContaAntiga = await getAccountName(dadosAntigos.id_account);
        const nomeStatusNovo = await getStatusName(dadosNovos.id_status);
        const nomeStatusAntigo = await getStatusName(dadosAntigos.id_status);

        // 🔄 Comparação de dados e destaque para alterações
        const formatarCampo = (campo, valorAntigo, valorNovo) => {
            if (valorAntigo !== valorNovo) {
                return `<p><strong>${campo}:</strong> 
                        <span style="background:yellow; padding:2px 4px; border-radius:3px;">${valorNovo}</span> 
                        <span style="color:gray; font-size:12px;">(Antes: ${valorAntigo})</span></p>`;
            } else {
                return `<p><strong>${campo}:</strong> ${valorNovo}</p>`;
            }
        };

        // 🔍 Buscar os últimos acompanhamentos
        const acompanhamentosResult = await pool.query(
            `SELECT f.description, TO_CHAR(f.event_date, 'DD/MM/YYYY') AS event_date, u.name 
             FROM tb_traffic_followups f
             LEFT JOIN tb_traffic_users u ON f.user_id = u.id
             WHERE f.traffic_id = $1 
             ORDER BY f.event_date DESC 
             LIMIT 3`, 
            [trafficId]
        );

        const acompanhamentos = acompanhamentosResult.rows
            .map(a => `<p><strong>${a.event_date}</strong> | ${a.description} <em>(${a.user_name})</em></p>`)
            .join("") || "<p>Nenhum acompanhamento recente.</p>";

        // 🔄 Loop para enviar e-mails individualmente para cada contato
        for (let contato of contatos) {
            const corpoEmail = `
                <p>Olá, <strong>${contato.recipient_name}</strong>,</p>
                <p>Esta é uma notificação gerada automaticamente pelo Sistema de Tráfego da Agência macrobrasil.com, referente ao tráfego abaixo. Confira os detalhes:</p>

                <h3>📌 Capa do Tráfego</h3>
                ${formatarCampo("Data de Entrega", dadosAntigos.delivery_date, dadosNovos.delivery_date)}
                ${formatarCampo("Conta", nomeContaAntiga, nomeContaNova)}
                ${formatarCampo("Status", nomeStatusAntigo, nomeStatusNovo)}
                ${formatarCampo("Descrição", dadosAntigos.description, dadosNovos.description)}

                <h3>📝 Últimos Acompanhamentos</h3>
                ${acompanhamentos}

                <p>Para saber mais, acesse o Sistema de Tráfego ou fale diretamente com o pessoal do Marketing ou da Agência macrobrasil.com.</p>

                <hr>
                <p><em>Sistema de Tráfego | Agência macrobrasil.com | Felipe Almeida & J.A.R.V.I.S | xFA | Versão Beta, 19 de março de 2025.</em></p>
            `;

            // 🚀 Enviar e-mail
            await transporter.sendMail({
                from: '"Sistema de Tráfego" <no-reply@macrobrasil.com>',
                to: contato.recipient_email,
                subject: `OURO FINO | CONSTRUÇÃO CIVIL | ALTERAÇÃO NO TRÁFEGO [${trafficId}]`,
                html: corpoEmail,
            });

            console.log(`📧 E-mail enviado para: ${contato.recipient_email}`);
        }

        console.log(`✅ Todos os e-mails foram enviados com sucesso!`);

    } catch (error) {
        console.error("🔴 Erro ao enviar e-mail:", error);
    }
};

const PORT = process.env.PORT || 5050;

app.listen(PORT, () => {
    console.log(`🟢 Servidor rodando na porta ${PORT}`);
});
