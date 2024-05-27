const express = require('express'); // Importa o módulo express
const multer = require('multer'); // Importa o módulo multer
const basicAuth = require('basic-auth'); // Importa o módulo basic-auth
const path = require('path'); // Importa o módulo path
const fs = require('fs'); // Importa o módulo fs
const app = express(); // Cria uma instância do express
const port = 3000; // Define a porta em que o servidor irá rodar

// Array de exemplo com alguns servidores
let estudantes = [
  { id: 1, nome: "João da Silva", curso: "Engenharia Civil", universidade: "Universidade Federal de São Paulo" },
  { id: 2, nome: "Maria Oliveira", curso: "Medicina", universidade: "Universidade de São Paulo" },
  { id: 3, nome: "Pedro Souza", curso: "Administração", universidade: "Fundação Getúlio Vargas" },
];

// Configuração do multer para armazenamento de arquivos
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/'); // Define o diretório onde os arquivos serão salvos
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`); // Define o nome do arquivo
  }
});
const upload = multer({ storage: storage });

// Middleware para permitir acesso a partir de qualquer origem (CORS)
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*"); // Permite acesso de qualquer origem
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept"); // Permite esses cabeçalhos na requisição
  res.header("Access-Control-Allow-Methods", "GET, POST, PUT, PATCH, DELETE, OPTIONS"); // Permite esses métodos HTTP
  if (req.method === 'OPTIONS') { // Verifica se o método é OPTIONS
    return res.sendStatus(200); // Responde com status 200 OK para requisições OPTIONS
  }
  next(); // Chama o próximo middleware
});

// Middleware para processar JSON no corpo da requisição
app.use(express.json()); // Habilita o processamento de JSON nas requisições

// Middleware de autenticação básica
const authenticate = (req, res, next) => {
  const user = basicAuth(req);
  const validUser = 'admin';
  const validPassword = 'senha123';

  if (user && user.name === validUser && user.pass === validPassword) {
    return next(); // Usuário autenticado com sucesso
  } else {
    res.set('WWW-Authenticate', 'Basic realm="401"'); // Solicita credenciais de autenticação
    return res.status(401).send('Autenticação necessária'); // Responde com status 401 Unauthorized
  }
};

// Rota para obter todos os servidores (protegida por autenticação)
app.get('/estudantes/listar', authenticate, (req, res) => {
  res.json(estudantes); // Responde com o array de servidores em formato JSON
});

// Rota para obter um servidor por ID (protegida por autenticação)
app.get('/estudantes/listarEstudantes/:id', authenticate, (req, res) => {
  const id = parseInt(req.params.id); // Converte o parâmetro ID para um número inteiro
  console.log(`Recebida requisição GET para ID: ${id}`); // Loga o ID recebido
  const estudante = estudantes.find(s => s.id === id); // Encontra o servidor com o ID especificado
  if (estudante) {
    res.json(estudante); // Responde com os dados do servidor encontrado
  } else {
    res.status(404).send('Servidor não encontrado'); // Responde com status 404 se o servidor não for encontrado
  }
});

// Rota para adicionar um novo servidor (protegida por autenticação)
app.post('/estudantes/inserir', authenticate, (req, res) => {
  const novoEstudantes= req.body; // Obtém o novo servidor do corpo da requisição
  novoEstudantes.id = estudantes.length ? estudantes[estudantes.length - 1].id + 1 : 1; // Define o ID do novo servidor
  estudantes.push(novoEstudantes); // Adiciona o novo servidor ao array
  res.status(201).json(novoEstudantes); // Responde com status 201 e o novo servidor em formato JSON
});

// Rota para atualizar um servidor existente (protegida por autenticação)
app.put('/estudantes/atualizar/:id', authenticate, (req, res) => {
  const id = parseInt(req.params.id); // Converte o parâmetro ID para um número inteiro
  console.log(`Recebida requisição PUT para ID: ${id} com dados: `, req.body); // Loga o ID e os dados recebidos
  const index = estudantes.findIndex(s => s.id === id); // Encontra o índice do servidor com o ID especificado
  if (index !== -1) {
    estudantes[index] = { ...estudantes[index], ...req.body }; // Atualiza o servidor com os novos dados
    res.json(estudantes[index]); // Responde com o servidor atualizado
  } else {
    res.status(404).send('Servidor não encontrado'); // Responde com status 404 se o servidor não for encontrado
  }
});

// Rota para atualizar parcialmente um servidor existente (protegida por autenticação)
app.patch('/estudantes/atualizar/:id', authenticate, (req, res) => {
  const id = parseInt(req.params.id); // Converte o parâmetro ID para um número inteiro
  console.log(`Recebida requisição PATCH para ID: ${id} com dados: `, req.body); // Loga o ID e os dados recebidos
  const index = estudantes.findIndex(s => s.id === id); // Encontra o índice do servidor com o ID especificado
  if (index !== -1) {
    estudantes[index] = { ...estudantes[index], ...req.body }; // Atualiza o servidor com os novos dados
    res.json(estudantes[index]); // Responde com o servidor atualizado
  } else {
    res.status(404).send('Servidor não encontrado'); // Responde com status 404 se o servidor não for encontrado
  }
});

// Rota para excluir um servidor (protegida por autenticação)
app.delete('/estudantes/deletar/:id', authenticate, (req, res) => {
  const id = parseInt(req.params.id); // Converte o parâmetro ID para um número inteiro
  console.log(`Recebida requisição DELETE para ID: ${id}`); // Loga o ID recebido
  const index = estudantes.findIndex(s => s.id === id); // Encontra o índice do servidor com o ID especificado
  if (index !== -1) {
    estudantes.splice(index, 1); // Remove o servidor do array
    res.status(204).send(); // Responde com status 204 No Content
  } else {
    res.status(404).send('Servidor não encontrado'); // Responde com status 404 se o servidor não for encontrado
  }
});

// Rota para upload de arquivo (protegida por autenticação)
app.post('/upload', authenticate, upload.single('file'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: 'Nenhum arquivo enviado' });
  }
  res.status(200).json({ message: 'Arquivo enviado com sucesso', file: req.file });
});

// Rota para download de arquivo (protegida por autenticação)
app.get('/download/:filename', authenticate, (req, res) => {
  const filename = req.params.filename;
  const filepath = path.join(__dirname, 'uploads', filename);

  fs.access(filepath, fs.constants.F_OK, (err) => {
    if (err) {
      return res.status(404).json({ message: 'Arquivo não encontrado' });
    }
    res.sendFile(filepath);
  });
});

// Inicia o servidor na porta especificada
app.listen(port, () => {
  console.log(`Servidor rodando em http://localhost:${port}`); // Loga a URL do servidor
});
