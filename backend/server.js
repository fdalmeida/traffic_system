// =======================================
//           SERVER - Sistema de Tráfego
//         Organização e Rotas Atualizadas
// =======================================

const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const nodemailer = require("nodemailer");
const moment = require("moment-timezone");
const twilio = require("twilio");
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

// ---------------------------------------
//           Conexão com o Banco
// ---------------------------------------
console.log("🔍 DATABASE_URL:", process.env.DATABASE_URL);
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

// ---------------------------------------
//           Configuração do Nodemailer
// ---------------------------------------
const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 587,
  secure: false,
  auth: {
    user: "fdalmeida@macrobrasil.com.br",
    pass: "dcvcjlmajlafgouk"
  }
});

// ---------------------------------------
//           Configuração do Twilio (WhatsApp)
// ---------------------------------------
const twilioClient = twilio(
  "ACba960de291f9a0c7d1d5f0634aeda6f", // Account SID
  "a6ea72674f2a08438f465d5af031c90a"  // Auth Token
);
const TWILIO_WHATSAPP_NUMBER = "whatsapp:+14155238886";

// ---------------------------------------
//           Middleware de Autenticação
// ---------------------------------------
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

// ---------------------------------------
//           Rotas de Autenticação e Usuário
// ---------------------------------------

// Obter nível do usuário
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

// Login
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
      { id: user.id, username: user.username, level_id: user.users_levels_id },
      process.env.JWT_SECRET,
      { expiresIn: "15m" }
    );
    console.log("Token gerado no Login:", token);
    res.json({ token, userId: user.id });
  } catch (err) {
    res.status(500).json({ error: "Erro no login" });
  }
});

// ---------------------------------------
//           Rotas de Tráfego
// ---------------------------------------

// Listar tráfegos
app.get('/api/traffic', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        t.id, 
        t.open_date, 
        t.delivery_date, 
        t.subject, 
        t.description,
        t.summary_description,
        t.confirmed_delivery_date,
        s.id AS status_id,
        s.status_name,
        t.id_account AS account_id,
        a.account_name,
        u.name AS responsible_name 
      FROM tb_traffic t 
      LEFT JOIN tb_accounts a ON t.id_account = a.id 
      LEFT JOIN tb_traffic_users u ON t.id_responsible = u.id 
      LEFT JOIN tb_status s ON t.id_status = s.id 
      ORDER BY t.open_date DESC
    `);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Listar contas
app.get('/api/accounts', authenticateToken, async (req, res) => {
  try {
    const { rows } = await pool.query("SELECT id, account_name FROM tb_accounts ORDER BY account_name ASC");
    res.json(rows);
  } catch (error) {
    console.error("Erro ao buscar contas:", error);
    res.status(500).json({ error: "Erro ao buscar contas" });
  }
});

// Listar situações
app.get('/api/statuses', authenticateToken, async (req, res) => {
  try {
    const { rows } = await pool.query("SELECT id, status_name FROM tb_status ORDER BY status_name ASC");
    res.json(rows);
  } catch (error) {
    console.error("Erro ao buscar situações:", error);
    res.status(500).json({ error: "Erro ao buscar situações" });
  }
});

// Buscar detalhes do tráfego e acompanhamentos
app.get('/api/traffic/:id', authenticateToken, async (req, res) => {
  try {
    const trafficId = req.params.id;
    const trafficResult = await pool.query(`
      SELECT 
        t.id, 
        t.open_date, 
        t.delivery_date, 
        t.subject, 
        t.description, 
        t.summary_description,
        t.confirmed_delivery_date,
        s.status_name,
        c.company AS client_name,
        a.account_name,
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

// ---------------------------------------
//           Função para validar transições de status
// ---------------------------------------
function validateStatusTransition(oldStatus, newStatus, userLevel) {
  // Status IDs:
  // 1 = Futuro, 2 = Em andamento, 3 = Concluído (Finalizado), 4 = Paralisado, 5 = Cancelado, 6 = Excluído

  if (oldStatus === 1) {
    if (![2, 5].includes(newStatus)) {
      return { ok: false, message: "Futuro só pode ir para Em andamento ou Cancelado." };
    }
  } else if (oldStatus === 2) {
    if (![3, 4, 5].includes(newStatus)) {
      return { ok: false, message: "Em andamento só pode ir para Concluído, Paralisado ou Cancelado." };
    }
  } else if (oldStatus === 4) {
    if (![2, 5].includes(newStatus)) {
      return { ok: false, message: "Paralisado só pode ir para Em andamento ou Cancelado." };
    }
  } else if (oldStatus === 5) {
    if (![1, 6].includes(newStatus)) {
      return { ok: false, message: "Cancelado só pode ir para Futuro (resgate) ou Excluído." };
    }
    if (userLevel !== 1) {
      return { ok: false, message: "Apenas administradores podem resgatar ou excluir tráfegos cancelados." };
    }
  }
  return { ok: true };
}

// ---------------------------------------
//           Rotas de Criação e Atualização de Tráfego
// ---------------------------------------
app.post('/api/traffic', authenticateToken, async (req, res) => {
  try {
    // Apenas administradores (nível 1) podem criar tráfegos
    if (req.user.level_id !== 1) {
      return res.status(403).json({ error: "Acesso negado. Apenas administradores podem criar tráfegos." });
    }
    const { open_date, subject, description, account_id, delivery_date, contacts } = req.body;
    const id_responsible = req.user.id;
    if (!open_date || !subject || !description || !account_id || !delivery_date) {
      return res.status(400).json({ error: "Todos os campos são obrigatórios." });
    }
    // Força o status para Futuro (ID=1)
    const status_id = 1;
    const clientResult = await pool.query("SELECT id_client FROM tb_accounts WHERE id = $1", [account_id]);
    if (clientResult.rows.length === 0) {
      return res.status(400).json({ error: "Conta não encontrada." });
    }
    const id_client = clientResult.rows[0].id_client;
    console.log("📌 Dados recebidos no backend:", req.body);
    const insertQuery = `
      INSERT INTO tb_traffic (
        open_date, subject, description, summary_description, 
        id_account, id_status, delivery_date, id_client, id_responsible
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING id
    `;
    const result = await pool.query(insertQuery, [
      open_date,
      subject,
      description,
      description.substring(0, 100) + "...",
      account_id,
      status_id, // Forçado a Futuro
      delivery_date,
      id_client,
      id_responsible
    ]);
    const newTrafficId = result.rows[0].id;
    console.log("✅ Tráfego criado no banco:", newTrafficId);
    const userNameResult = await pool.query("SELECT name FROM tb_traffic_users WHERE id = $1", [id_responsible]);
    const userName = userNameResult.rows[0].name;
    const acompanhamentoTexto = `Tráfego criado por ${userName} em ${new Date().toLocaleDateString('pt-BR')}. Aguardando as próximas ações.`;
    await pool.query(
      `INSERT INTO tb_traffic_followups (traffic_id, user_id, description, event_date, responsible_return)
       VALUES ($1, $2, $3, NOW() AT TIME ZONE 'America/Sao_Paulo', 'PSC')`,
      [newTrafficId, id_responsible, acompanhamentoTexto]
    );
    // Vincula contatos se houver
    if (contacts && contacts.length > 0) {
      for (const contactId of contacts) {
        await pool.query("INSERT INTO tb_traffic_contacts (id_traffic, id_contact) VALUES ($1, $2)", [newTrafficId, contactId]);
        console.log(`➕ Contato ${contactId} vinculado ao tráfego ${newTrafficId}`);
      }
    }
    // Envio de e-mail de criação (função existente)
    await enviarEmailCriacaoTrafego(newTrafficId, {
      subject,
      description,
      delivery_date: new Date(delivery_date).toLocaleDateString('pt-BR'),
      account_name: await getAccountName(account_id),
      status_name: await getStatusName(status_id)
    });
    console.log("📧 E-mail enviado com sucesso!");
    return res.status(201).json({ message: "Tráfego criado com sucesso.", id: newTrafficId });
  } catch (error) {
    console.error("🔴 Erro ao criar tráfego:", error);
    return res.status(500).json({ error: "Erro ao criar tráfego." });
  }
});

// ---------------------------------------
//           Rota de Atualização de Tráfego
// ---------------------------------------
app.put('/api/traffic/:id', authenticateToken, async (req, res) => {
  try {
    const trafficId = Number(req.params.id);
    const { delivery_date, account_id, status_id, contacts } = req.body;
    const newStatus = Number(status_id); // Já converte status para número
    
    // Converte delivery_date para o formato "YYYY-MM-DD"
    const formattedDeliveryDate = new Date(delivery_date).toISOString().split("T")[0];
    
    if (!formattedDeliveryDate || !account_id || newStatus == null) {
      return res.status(400).json({ error: "Campos obrigatórios ausentes." });
    }
    
    // Busca os dados atuais do tráfego
    const currentResult = await pool.query("SELECT * FROM tb_traffic WHERE id = $1", [trafficId]);
    if (currentResult.rows.length === 0) {
      return res.status(404).json({ error: "Tráfego não encontrado." });
    }
    const currentTraffic = currentResult.rows[0];
    const oldStatus = currentTraffic.id_status;
    
    // Bloqueia alterações se o tráfego já estiver Concluído (3) ou Excluído (6)
    if (oldStatus === 3 || oldStatus === 6) {
      return res.status(403).json({ error: "Tráfego Concluído ou Excluído não pode ser alterado." });
    }
    
    // Valida a transição de status usando newStatus
    const valid = validateStatusTransition(oldStatus, newStatus, req.user.level_id);
    if (!valid.ok) {
      return res.status(400).json({ error: valid.message });
    }
    
    // Se o novo status for Concluído (3), define confirmed_delivery_date com 24h a partir de agora
    let confirmedDeliveryDate = currentTraffic.confirmed_delivery_date;
    if (newStatus === 3 && oldStatus !== 3) {
      confirmedDeliveryDate = moment().tz('America/Sao_Paulo').add(24, 'hours').format();
    }
    
    // Monta a descrição das alterações, utilizando newStatus quando necessário
    let changeDescription = "";
    // Comparação da data de entrega
    const oldDeliveryDate = currentTraffic.delivery_date;
    const oldDeliveryStr = new Date(oldDeliveryDate).toISOString().split("T")[0];
    if (delivery_date !== oldDeliveryStr) {
      changeDescription += `<p><strong>Data de Entrega:</strong> <span style="color:gray;">${new Date(oldDeliveryDate).toLocaleDateString('pt-BR')}</span> → <mark>${new Date(delivery_date).toLocaleDateString('pt-BR')}</mark></p>`;
    }
    // Comparação da conta
    if (account_id != currentTraffic.id_account) {
      const oldAccountName = await getAccountName(currentTraffic.id_account);
      const newAccountName = await getAccountName(account_id);
      changeDescription += `<p><strong>Conta:</strong> <span style="color:gray;">${oldAccountName}</span> → <mark>${newAccountName}</mark></p>`;
    }
    // Comparação do status
    if (newStatus !== currentTraffic.id_status) {
      const oldStatusName = await getStatusName(currentTraffic.id_status);
      const newStatusName = await getStatusName(newStatus);
      changeDescription += `<p><strong>Status:</strong> <span style="color:gray;">${oldStatusName}</span> → <mark>${newStatusName}</mark></p>`;
    }
    // Comparação dos contatos, se necessário
    if (contacts) {
      const currentContactsResult = await pool.query("SELECT id_contact FROM tb_traffic_contacts WHERE id_traffic = $1", [trafficId]);
      const oldContacts = currentContactsResult.rows.map(r => r.id_contact);
      if (JSON.stringify(oldContacts.sort()) !== JSON.stringify(contacts.sort())) {
        changeDescription += `<p><strong>Contatos:</strong> <span style="color:gray;">[${oldContacts.join(", ")}]</span> → <mark>[${contacts.join(", ")}]</mark></p>`;
      }
    }
    if (!changeDescription) {
      changeDescription = "<p>Nenhuma alteração detectada.</p>";
    }
    
    // Atualiza o tráfego
    const updateQuery = `
      UPDATE tb_traffic
      SET delivery_date = $1,
          id_account = $2,
          id_status = $3,
          confirmed_delivery_date = COALESCE($4, confirmed_delivery_date)
      WHERE id = $5
      RETURNING *
    `;
    const updateResult = await pool.query(updateQuery, [
      formattedDeliveryDate,  // usa a data formatada
      account_id,
      newStatus,
      confirmedDeliveryDate,
      trafficId
    ]);

    
    // Atualiza os contatos, se fornecidos
    if (contacts && Array.isArray(contacts)) {
      await pool.query("DELETE FROM tb_traffic_contacts WHERE id_traffic = $1", [trafficId]);
      for (const contactId of contacts) {
        await pool.query("INSERT INTO tb_traffic_contacts (id_traffic, id_contact) VALUES ($1, $2)", [trafficId, contactId]);
      }
    }
    
    // Registra um acompanhamento com os detalhes da atualização
    const followupDescription = `Tráfego atualizado por ${req.user.username} em ${moment().format('DD/MM/YYYY')}.<br>${changeDescription}`;
    await pool.query(
      `INSERT INTO tb_traffic_followups (traffic_id, user_id, description, event_date, responsible_return)
       VALUES ($1, $2, $3, NOW() AT TIME ZONE 'America/Sao_Paulo', 'Atualizado')`,
      [trafficId, req.user.id, followupDescription]
    );
    
    // Envia e-mail de atualização
    await enviarEmailAtualizacaoTrafego(trafficId, {
      changeDescription,
      userName: req.user.username
    });
    
    return res.json({ message: "Tráfego atualizado com sucesso.", traffic: updateResult.rows[0] });
  } catch (error) {
    console.error("Erro ao atualizar tráfego:", error);
    return res.status(500).json({ error: "Erro ao atualizar tráfego." });
  }
});

// ---------------------------------------
//           Rota de Cadastro de Acompanhamentos
// ---------------------------------------
app.post('/api/traffic/:id/followup', authenticateToken, async (req, res) => {
    try {
      const trafficId = Number(req.params.id);
      const { description, responsible_return, event_date } = req.body;
      const userId = req.user.id;
  
      if (!description || !responsible_return) {
        return res.status(400).json({ error: "Todos os campos são obrigatórios." });
      }
  
      const trafficExists = await pool.query("SELECT * FROM tb_traffic WHERE id = $1", [trafficId]);
      if (trafficExists.rows.length === 0) {
        return res.status(404).json({ error: "Tráfego não encontrado." });
      }
  
      const result = await pool.query(
        `INSERT INTO tb_traffic_followups (traffic_id, user_id, event_date, description, responsible_return)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING id, description, TO_CHAR(event_date, 'DD/MM/YYYY') AS event_date`,
        [trafficId, userId, event_date, description, responsible_return]
      );
  
      console.log("✅ Novo acompanhamento cadastrado:", result.rows[0].id);
  
      const userResult = await pool.query("SELECT name FROM tb_traffic_users WHERE id = $1", [userId]);
      const userName = userResult.rows.length > 0 ? userResult.rows[0].name : "Desconhecido";
  
      await enviarEmailNovoAcompanhamento(trafficId, {
        description: result.rows[0].description,
        event_date: result.rows[0].event_date,
        user_name: userName
      });
  
      console.log("📧 E-mail enviado com sucesso para o novo acompanhamento.");
      return res.status(201).json({ message: "Acompanhamento cadastrado com sucesso." });
    } catch (error) {
      console.error("🔴 Erro ao criar acompanhamento:", error);
      return res.status(500).json({ error: "Erro ao criar acompanhamento." });
    }
});
  
// ---------------------------------------
//           Rota para EXCLUIR Tráfego (alterando status para Excluído)
// ---------------------------------------
app.put('/api/traffic/:id/exclude', authenticateToken, async (req, res) => {
  try {
    const trafficId = Number(req.params.id);
    const userId = req.user.id;
    
    // Permitir exclusão somente para usuários de nível 1
    if (req.user.level_id !== 1) {
      return res.status(403).json({ error: "Acesso negado. Apenas nível 1 pode excluir tráfegos." });
    }
  
    const updateResult = await pool.query(
      "UPDATE tb_traffic SET id_status = 6 WHERE id = $1 RETURNING *",
      [trafficId]
    );
    if (updateResult.rows.length === 0) {
      return res.status(404).json({ error: "Tráfego não encontrado." });
    }
  
    const userResult = await pool.query("SELECT name FROM tb_traffic_users WHERE id = $1", [userId]);
    const userName = userResult.rows.length > 0 ? userResult.rows[0].name : "Desconhecido";
    const followupText = `Tráfego excluído por ${userName} em ${new Date().toLocaleDateString('pt-BR')}.`;
    await pool.query(
      `INSERT INTO tb_traffic_followups (traffic_id, user_id, description, event_date, responsible_return)
       VALUES ($1, $2, $3, NOW() AT TIME ZONE 'America/Sao_Paulo', 'Excluído')`,
      [trafficId, userId, followupText]
    );
  
    return res.json({ message: "Tráfego excluído com sucesso." });
  } catch (error) {
    console.error("Erro ao excluir tráfego:", error);
    return res.status(500).json({ error: "Erro ao excluir tráfego." });
  }
});
  
// ---------------------------------------
//           Rotas de Contatos
// ---------------------------------------
app.get('/api/traffic/:id/contacts', authenticateToken, async (req, res) => {
    try {
      const trafficId = Number(req.params.id);
      console.log(`🔍 Buscando contatos para o tráfego ID: ${trafficId}`);
      const contactsResult = await pool.query(`
        SELECT c.id, c.name, c.email 
        FROM tb_traffic_contacts tc
        JOIN tb_contacts c ON tc.id_contact = c.id
        WHERE tc.id_traffic = $1
      `, [trafficId]);
      const linkedContactIds = contactsResult.rows.map(c => c.id);
      return res.json({ contacts: contactsResult.rows, linkedContactIds });
    } catch (error) {
      console.error("🔴 Erro ao buscar contatos:", error);
      return res.status(500).json({ error: "Erro ao buscar contatos" });
    }
});
  
app.get('/api/contacts', authenticateToken, async (req, res) => {
    try {
        const contactsResult = await pool.query("SELECT id, name, email FROM tb_contacts");
        return res.json(contactsResult.rows);
    } catch (error) {
        console.error("🔴 Erro ao buscar todos os contatos:", error);
        return res.status(500).json({ error: "Erro ao buscar contatos" });
    }
});
  
// ---------------------------------------
//           Servir Frontend
// ---------------------------------------
const path = require("path");
app.use(express.static(path.join(__dirname, "../frontend/dist")));
app.get("*", (req, res, next) => {
  if (req.path.startsWith("/api/")) {
    return next();
  }
  res.sendFile(path.join(__dirname, "../frontend/dist", "index.html"));
});
  
// ---------------------------------------
//           Inicia o Servidor
// ---------------------------------------
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🟢 Servidor rodando na porta ${PORT}`);
});
  
// ---------------------------------------
//           Funções Auxiliares
// ---------------------------------------
const getAccountName = async (accountId) => {
    if (!accountId) return "Desconhecido";
    const result = await pool.query('SELECT account_name FROM tb_accounts WHERE id = $1', [accountId]);
    return result.rows.length > 0 ? result.rows[0].account_name : "Desconhecido";
};
  
const getStatusName = async (statusId) => {
    if (!statusId) return "Desconhecido";
    const result = await pool.query('SELECT status_name FROM tb_status WHERE id = $1', [statusId]);
    return result.rows.length > 0 ? result.rows[0].status_name : "Desconhecido";
};
  
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
  
const enviarEmailCriacaoTrafego = async (trafficId, data) => {
  try {
    console.log(`📌 [enviarEmailCriacaoTrafego] Iniciando envio de notificação para tráfego ID: ${trafficId}`);
    const trafficResult = await pool.query(
      `
      SELECT t.subject, t.description, 
             TO_CHAR(t.delivery_date, 'DD/MM/YYYY') AS delivery_date, 
             a.account_name, s.status_name, t.id_status, t.open_date
      FROM tb_traffic t
      LEFT JOIN tb_accounts a ON t.id_account = a.id
      LEFT JOIN tb_status s ON t.id_status = s.id
      WHERE t.id = $1
      `,
      [trafficId]
    );
    if (trafficResult.rows.length === 0) {
      console.log(`[enviarEmailCriacaoTrafego] ⚠️ Nenhum tráfego encontrado com ID ${trafficId}`);
      return;
    }
    const traffic = trafficResult.rows[0];
  
    const contactsResult = await pool.query(
      `
      SELECT c.name, c.email
      FROM tb_traffic_contacts tc
      JOIN tb_contacts c ON tc.id_contact = c.id
      WHERE tc.id_traffic = $1
      `,
      [trafficId]
    );
    if (contactsResult.rows.length === 0) return;
  
    for (const contact of contactsResult.rows) {
      const corpoEmail = `
        <p>Olá, <strong>${contact.name}</strong>,</p>
        <p>Um novo tráfego foi registrado. Sua participação neste trabalho é 
        fundamental para alcançarmos o resultado esperado.</p>
        <p>Acompanhe tudo em tempo real pelo <strong>Traffic System</strong>.</p>  
        <h3>📌 Capa do Tráfego</h3>
        <p>
          <strong>Data de Entrega:</strong> ${traffic.delivery_date}</p><br>
          <strong>Conta:</strong> ${traffic.account_name}</p><br>
          <strong>Status:</strong> ${traffic.status_name}</p><br>
          <strong>Assunto:</strong> ${traffic.subject}</p><br>
          <strong>Descrição:</strong> ${traffic.description.replace(/\n/g, "<br>")}<br>
        </p>
        ${
          data.acompanhamento_inicial
            ? `<h3>🆕 Acompanhamento Inicial</h3>
               <p>${data.acompanhamento_inicial.description.replace(/\n/g, "<br>")}</p>`
            : ""
        }
        <hr>
        <p>
          <em>
            Este e-mail faz parte da nossa comunicação automatizada e do sistema inteligente 
            que garante transparência e qualidade em cada etapa do processo.
          </em>
        </p>
        <p>    
          <em><strong>Traffic System</strong> — BRUX & macrobrasil.com | 
          Felipe Almeida & Team | xFA vBeta 1</em>
        </p>
      `;
  
      await transporter.sendMail({
        from: '"Sistema de Tráfego" <no-reply@macrobrasil.com>',
        to: contact.email,
        subject: `OURO FINO | ${traffic.account_name.toUpperCase()} | NOVO TRÁFEGO CRIADO [${trafficId}]`,
        html: corpoEmail,
      });
      console.log(`📧 E-mail enviado com sucesso para ${contact.email}`);
    }
    console.log("✅ Todos os e-mails foram enviados com sucesso!");
  } catch (error) {
    console.error("Erro ao enviar e-mail de criação:", error);
  }
};
  
const enviarEmailNovoAcompanhamento = async (trafficId, novoAcompanhamento) => {
  try {
    console.log(`📌 [enviarEmailNovoAcompanhamento] Iniciando envio de notificação para tráfego ID: ${trafficId}`);
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
  
    const acompanhamentosResult = await pool.query(`
      SELECT f.description, TO_CHAR(f.event_date, 'DD/MM/YYYY') AS event_date, u.name AS user_name 
      FROM tb_traffic_followups f
      LEFT JOIN tb_traffic_users u ON f.user_id = u.id
      WHERE f.traffic_id = $1 
      ORDER BY f.event_date DESC 
      OFFSET 1 LIMIT 3
    `, [trafficId]);
  
    const acompanhamentos = acompanhamentosResult.rows
      .map(a => `<p><strong>${a.event_date}</strong> | ${a.description} <em>(${a.user_name})</em></p>`)
      .join("") || "<p>Nenhum acompanhamento recente.</p>";
  
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
    
    const contatosHTML = contactsResult.rows
      .map(c => `<li>${c.name} - ${c.email}</li>`)
      .join("");
  
    const recipients = contactsResult.rows;
    console.log("[enviarEmailNovoAcompanhamento] ✅ Contatos carregados:", recipients);
  
    for (const contact of recipients) {
      const corpoEmail = `
        <p>Olá, <strong>${contact.name}</strong>,</p>
        <p>Um novo acompanhamento foi registrado no Tráfego [${trafficId}]. Sua atenção nesse momento é essencial para garantirmos o melhor resultado.</p> 
        <p>Acesse o <strong>Traffic System</strong> e acompanhe tudo em tempo real.</p>                 
        <h3>🆕 Novo Acompanhamento</h3>
        <p><strong>${novoAcompanhamento.event_date}</strong> | ${novoAcompanhamento.description} <em>(${novoAcompanhamento.user_name})</em></p>
        <h3>📌 Capa do Tráfego</h3>
        <p>
          <strong>Data de Entrega:</strong> ${traffic.delivery_date}<br>
          <strong>Conta:</strong> ${traffic.account_name}<br>
          <strong>Status:</strong> ${traffic.status_name}<br>
          <strong>Descrição:</strong> ${traffic.description.replace(/\n/g, "<br>")}
        </p>
        <hr>
        <h3>📒 Contatos Vinculados:</h3>
        <ul>${contatosHTML}</ul>
        <hr>
        <h3>💬 Últimos Acompanhamentos</h3>
        ${acompanhamentos}
        <hr>
        <p>
          <em>
            Este e-mail faz parte da nossa comunicação automatizada e do sistema inteligente 
            que garante transparência e qualidade em cada etapa do processo.
          </em>
        </p>
        <p>    
          <em><strong>Traffic System</strong> — BRUX & macrobrasil.com | Felipe Almeida & Team | xFA vBeta 1</em>
        </p>
      `;
      await transporter.sendMail({
        from: '"Sistema de Tráfego" <no-reply@macrobrasil.com>',
        to: contact.email,
        subject: `OURO FINO | ${traffic.account_name.toUpperCase()} | NOVO ACOMPANHAMENTO [${trafficId}]`,
        html: corpoEmail,
      });
      console.log(`📧 E-mail enviado com sucesso para ${contact.email}`);
    }
  } catch (error) {
    console.error("🔴 Erro ao enviar e-mail de acompanhamento:", error);
  }
};
  
const enviarEmailAtualizacaoTrafego = async (trafficId, data) => {
  try {
    const trafficResult = await pool.query(`
      SELECT t.subject, t.description, 
             TO_CHAR(t.delivery_date, 'DD/MM/YYYY') AS delivery_date, 
             a.account_name, s.status_name
      FROM tb_traffic t
      LEFT JOIN tb_accounts a ON t.id_account = a.id
      LEFT JOIN tb_status s ON t.id_status = s.id
      WHERE t.id = $1
    `, [trafficId]);
    if (trafficResult.rows.length === 0) return;
    const traffic = trafficResult.rows[0];
    
    const contactsResult = await pool.query(`
      SELECT c.name, c.email
      FROM tb_traffic_contacts tc
      JOIN tb_contacts c ON tc.id_contact = c.id
      WHERE tc.id_traffic = $1
    `, [trafficId]);
    if (contactsResult.rows.length === 0) return;
    const contatosHTML = contactsResult.rows.map(c => `<li>${c.name} - ${c.email}</li>`).join("");
    
    const followupsResult = await pool.query(`
      SELECT f.description, TO_CHAR(f.event_date, 'DD/MM/YYYY') AS event_date, u.name AS user_name 
      FROM tb_traffic_followups f
      LEFT JOIN tb_traffic_users u ON f.user_id = u.id
      WHERE f.traffic_id = $1
      ORDER BY f.event_date DESC
      OFFSET 1 LIMIT 3
    `, [trafficId]);
    let acompanhamentosHTML = "";
    if (followupsResult.rows.length > 0) {
      acompanhamentosHTML = followupsResult.rows
        .map(a => `<p><strong>${a.event_date}</strong> | ${a.description} <em>(${a.user_name})</em></p>`)
        .join("");
    } else {
      acompanhamentosHTML = "<p>Nenhum acompanhamento recente.</p>";
    }
    
    for (const contact of contactsResult.rows) {
      const corpoEmail = `
        <p>Olá, <strong>${contact.name}</strong>,</p>
        <p>O Tráfego [${trafficId}] foi atualizado e sua atenção nesse momento é essencial
        para garantirmos o melhor resultado.</p> 
        <p>Acesse o <strong>Traffic System</strong> e acompanhe tudo em tempo real.</p>                 
        <h3>Detalhes da Atualização:</h3>
        ${data.changeDescription}
        <h3>📌 Capa do Tráfego</h3>
        <p>
          <strong>Data de Entrega:</strong> ${traffic.delivery_date}</p><br>
          <strong>Conta:</strong> ${traffic.account_name}</p><br>
          <strong>Status:</strong> ${traffic.status_name}</p><br>
          <strong>Descrição:</strong> ${traffic.description.replace(/\n/g, "<br>")}
        </p>
        <hr>
        <h3>📒 Contatos Vinculados:</h3>
        <ul>${contatosHTML}</ul>
        <hr>
        <h3>💬 Últimos Acompanhamentos:</h3>
        ${acompanhamentosHTML}
        <hr>
        <p>
          <em>
            Este e-mail faz parte da nossa comunicação automatizada e do sistema inteligente 
            que garante transparência e qualidade em cada etapa do processo.
          </em>
        </p>
        <p>    
          <em><strong>Traffic System</strong> — BRUX & macrobrasil.com | 
          Felipe Almeida & Team | xFA vBeta 1</em>
        </p>
      `;
      
      await transporter.sendMail({
        from: '"Sistema de Tráfego" <no-reply@macrobrasil.com>',
        to: contact.email,
        subject: `OURO FINO | ${traffic.account_name.toUpperCase()} | TRÁFEGO ATUALIZADO [${trafficId}]`,
        html: corpoEmail,
      });
      console.log(`📧 E-mail enviado com sucesso para ${contact.email}`);
    }
    console.log("✅ Todos os e-mails de atualização foram enviados com sucesso!");
  } catch (error) {
    console.error("Erro ao enviar e-mail de atualização:", error);
  }
};