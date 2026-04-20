require("dotenv").config();
const fs = require("fs");
const https = require("https");
const express = require("express");
const { Sequelize, Op, where } = require("sequelize");
const LtiSequelize = require("ltijs-sequelize");
const lti = require("ltijs").Provider;
const cors = require("cors");
const usuarioService = require("./Services/usuarioService");
const { validarApiKey } = require('./middleware/apiKey.middleware');
const app = express();
app.use(express.json());

// Configurações do banco de dados
const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASS,
  {
    host: process.env.DB_HOST,
    dialect: "mysql",
    port: 3306,
    logging: false,
  }
);

const db = new LtiSequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASS,
  {
    host: process.env.DB_HOST,
    dialect: "mysql",
    port: 3306,
    logging: false,
  }
);

let sslOptions;

if (process.env.PRODUCAO_VARIAVEL == "true") {
  sslOptions = {
    key: fs.readFileSync("/certs/uea.edu.br.key"),
    cert: fs.readFileSync("/certs/uea.edu.br.fullchain.crt"),
  };

}

app.set('trust proxy', true);

lti.setup(
  process.env.LTI_KEY,
  { plugin: db },
  {
    cookies: { secure: false, sameSite: "" },
    devMode: true,
    dynReg: {
      url: process.env.BACK_LTI,
      name: process.env.NOME_FERRAMENTA,
      redirectUris: [ process.env.BACK_LTI ],
      autoActivate: true
    }
  }
);
urlFront = process.env.CORS_ORIGIN;

lti.app.use(
  cors({
    origin: urlFront,
    credentials: true,
  })
);

const {
  Modulo,
  PlataformaRegistro,
  Aluno,
} = require("./models");
const { options } = require("./routes");
const { platform } = require("os");

lti.onConnect(async (token, req, res) => {

  try {
    console.log("Token id abaixo", token);
    const ltik = req.query.ltik;
    let nomeModulo = token.platformContext.resource.title;
    let uuid = token.platformContext.custom.uuid;

    const plataforma = await PlataformaRegistro.findOne({
      where: { idCliente: token.clientId },
    });

    const modulo = await Modulo.findOne({ where: { uuid: uuid } });
    console.log(plataforma);
    if (modulo) {
      const user = await Aluno.findOne({
        where: { ltiUserId: token.user, id_plataforma: plataforma.id },
      });
      if (user) {
        await usuarioService.updateUser(user, ltik, modulo, token);
      } else {
        await usuarioService.createUser(token, ltik, modulo, plataforma);
      }
      console.log(`${urlFront}/modulo/${modulo.nome_url}?ltik=${ltik}`);
      res.redirect(`${urlFront}/modulo/${modulo.nome_url}?ltik=${ltik}`);
    } else {
      res.redirect(`${urlFront}/error404`);
      console.log("Modulo não existe ou não encontrado");
    }
  } catch (error) {
    console.error("Erro na conexão LTI:", error);
    res.status(500).send("Erro interno do servidor");
  }
});


lti.whitelist('/lti/register-platform');
lti.app.post('/lti/register-platform', validarApiKey, async (req, res) => {
  try {
    const { plataformaUrl, plataformaNome, idCliente } = req.body;

    if (!plataformaUrl || !plataformaNome || !idCliente) {
      return res.status(400).json({ message: 'Dados incompletos' });
    }

    const plat = await lti.getPlatform(plataformaUrl, idCliente);

    if (plat) {
      return res.status(200).json({
        message: 'Plataforma já registrada'
      });
    }

    await lti.registerPlatform({
      url: plataformaUrl,
      name: plataformaNome,
      clientId: idCliente,
      authenticationEndpoint: `${plataformaUrl}/mod/lti/auth.php`,
      accesstokenEndpoint: `${plataformaUrl}/mod/lti/token.php`,
      authConfig: {
        method: "JWK_SET",
        key: `${plataformaUrl}/mod/lti/certs.php`,
      },
    });

    console.log(`Plataforma registrada: ${plataformaNome}`);

    return res.status(201).json({
      message: 'Plataforma registrada com sucesso'
    });

  } catch (error) {
    console.error('Erro ao registrar plataforma:', error);

    return res.status(500).json({
      message: 'Erro interno ao registrar plataforma'
    });
  }
});


lti.whitelist('/lti/remove-platform');
lti.app.delete('/lti/remove-platform', validarApiKey, async (req, res) => {
  try {
    const { plataformaUrl, idCliente } = req.body;

    
    if (!plataformaUrl || !idCliente) {
      return res.status(400).json({ message: 'Dados incompletos' });
    }

    const plat = await lti.getPlatform(plataformaUrl, idCliente);

    if (!plat) {
      return res.status(404).json({
        message: 'Plataforma não encontrada'
      });
    }


    // Remove a plataforma
    await lti.deletePlatform(plataformaUrl, idCliente);

    console.log(`Plataforma removida: ${plataformaUrl}`);

    return res.status(200).json({
      message: 'Plataforma removida com sucesso'
    });

  } catch (error) {
    console.error('Erro ao remover plataforma:', error);

    return res.status(500).json({
      message: 'Erro interno ao remover plataforma'
    });
  }
});


lti.whitelist('/lti/update-platform');
lti.app.put('/lti/update-platform', validarApiKey, async (req, res) => {
  try {
    const { plataformaUrl, idCliente, novosDados } = req.body;
    
    if (!plataformaUrl || !idCliente || !novosDados) {
      return res.status(400).json({ message: 'Dados incompletos' });
    }

    const plat = await lti.getPlatform(plataformaUrl, idCliente);
    
    if (!plat) {
      return res.status(404).json({
        message: 'Plataforma não encontrada'
      });
    }

    const platformId = await plat.platformId();

    const dadosTratados = {
      name: novosDados.plataformaNome || plat.platformName(),
      url: novosDados.plataformaUrl || plat.platformUrl(),
      clientId: novosDados.idCliente || plat.platformClientId()
    };

    await lti.updatePlatformById(platformId, dadosTratados);

    console.log(`Plataforma atualizada: ${plataformaUrl}`);
    
    return res.status(200).json({
      message: 'Plataforma atualizada com sucesso'
    });

  } catch (error) {
    console.error('Erro ao atualizar plataforma:', error);

    return res.status(500).json({
      message: 'Erro interno ao atualizar plataforma'
    });
  }
});


lti.app.use("/", require("./routes"));
const plataforma = async () => {
  try {
    const plataformas = await PlataformaRegistro.findAll({
      attributes: ["plataformaNome", "plataformaUrl", "idCliente"],
    });
    return plataformas;
  } catch (error) {
    console.error("Erro ao buscar plataformas:", error);
    return [];
  }
};



const PORT = process.env.PORT || 3000;
lti.app.listen(PORT, '0.0.0.0', () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});
// Função de setup
const setup = async () => {
  try {
    await lti.deploy({ port: 3000 }); // O deploy é necessário para inicializar o LTI, mas a porta será gerida pelo HTTPS criado manualmente

    // Registro das plataformas
    const registerPlataforma = await plataforma();
    console.log('Plataformas', registerPlataforma)

    // for (let platform of registerPlataforma) {
    //   const { plataformaUrl, plataformaNome, idCliente } = platform.dataValues;
    //   if (plataformaUrl && plataformaNome && idCliente) {
    //     await lti.registerPlatform({
    //       url: plataformaUrl,
    //       name: plataformaNome,
    //       clientId: idCliente,
    //       authenticationEndpoint: `${plataformaUrl}/mod/lti/auth.php`,
    //       accesstokenEndpoint: `${plataformaUrl}/mod/lti/token.php`,
    //       authConfig: {
    //         method: "JWK_SET",
    //         key: `${plataformaUrl}/mod/lti/certs.php`,
    //       },
    //     });
    //     console.log(`Plataforma registrada: ${plataformaNome}`);
    //   } else {
    //     console.warn(`Dados incompletos para a plataforma: ${platform}`);
    //   }
    // }
  } catch (error) {
    console.error("Erro durante o setup:", error);
  }
};


setup();
